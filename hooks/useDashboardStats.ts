/**
 * useDashboardStats.ts
 * ---------------------
 * Custom hook que centraliza toda a lógica de dados e cálculos do Dashboard.
 *
 * Responsabilidades:
 *  - Buscar os agendamentos do dia no Supabase (apenas as colunas necessárias)
 *  - Buscar o nome do usuário autenticado para a saudação
 *  - Calcular as métricas de resumo (total, presentes, aguardando)
 *  - Calcular a ocupação em tempo real de cada sala e normalizar as alturas do gráfico de barras
 *
 * O componente Dashboard.tsx apenas consome os valores retornados por este hook,
 * sem precisar conhecer nenhum detalhe de como os dados são obtidos ou calculados.
 */

import { useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient'; // Cliente Supabase canônico

// ─── Mapeamento de Salas ──────────────────────────────────────────────────────

/**
 * Lista de salas que serão consideradas no cálculo de ocupação.
 * A chave 'key' corresponde ao nome da coluna no banco de dados (tabela 'agendamentos').
 * O 'label' é usado para exibição no gráfico de barras.
 */
const ROOM_MAPPING = [
    { key: 'consultorio', label: 'Médico' },
    { key: 'salaexames', label: 'Exames' },
    { key: 'salacoleta', label: 'Coleta' },
    { key: 'audiometria', label: 'Audio' },
    { key: 'raiox', label: 'Raio-X' },
];

// ─── Interfaces de Tipos ──────────────────────────────────────────────────────

/** Métricas de resumo do dia exibidas nos cards superiores do Dashboard */
export interface DashboardStats {
    total: number;    // Total de agendamentos para hoje
    present: number;  // Quantos pacientes já chegaram (compareceu = true)
    waiting: number;  // Pacientes ainda não chegaram (total - present)
}

/** Dados de ocupação de uma sala individual para o gráfico de barras */
export interface RoomOccupancyItem {
    label: string;  // Label exibida abaixo da barra (ex: 'Médico', 'Raio-X')
    count: number;  // Número de pacientes ativos na sala (Aguardando ou atendido)
    height: number; // Percentual de altura da barra (0–100) relativo à sala mais movimentada
}

/** Interface completa do retorno do hook */
interface UseDashboardStatsReturn {
    loading: boolean;                     // true durante o carregamento inicial
    userName: string;                     // Nome do usuário autenticado para a saudação
    stats: DashboardStats;                // Métricas calculadas dos agendamentos do dia
    roomOccupancy: RoomOccupancyItem[];  // Dados normalizados para o gráfico de barras
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

export function useDashboardStats(): UseDashboardStatsReturn {
    // Controla o spinner de carregamento inicial
    const [loading, setLoading] = useState(true);

    // Nome do usuário logado (para exibição no header de boas-vindas)
    const [userName, setUserName] = useState('');

    // Métricas consolidadas dos agendamentos do dia
    const [stats, setStats] = useState<DashboardStats>({ total: 0, present: 0, waiting: 0 });

    // Array com dados de ocupação e altura calculada para cada sala
    const [roomOccupancy, setRoomOccupancy] = useState<RoomOccupancyItem[]>([]);

    // ── Effect: Busca paralela dos dados ao montar o hook ─────────────────────
    useEffect(() => {
        fetchDashboardData();
        getUserInfo();
    }, []);

    /**
     * Busca o nome do usuário autenticado na tabela 'users'.
     * Usado para personalizar a saudação no header do Dashboard.
     * A busca é feita via UUID do Supabase Auth (user.id) mapeado na coluna user_id.
     */
    const getUserInfo = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase
            .from('users')
            .select('username')
            .eq('user_id', user.id)
            .single();

        if (data) setUserName(data.username);
    };

    /**
     * Busca e processa os dados do Dashboard para a data de hoje.
     *
     * Fluxo:
     *  1. Busca somente as colunas necessárias de 'agendamentos' para o dia atual
     *     (evita transferir dados desnecessários da API)
     *  2. Calcula as métricas de resumo (total, presentes, aguardando)
     *  3. Calcula a ocupação de cada sala e normaliza as alturas do gráfico
     */
    const fetchDashboardData = async () => {
        setLoading(true);

        // Obtém apenas a parte de data (YYYY-MM-DD) do timestamp atual
        const today = new Date().toISOString().split('T')[0];

        // Busca apenas as colunas relevantes para minimizar a transferência de dados
        const { data: agendamentos, error } = await supabase
            .from('agendamentos')
            .select('compareceu, consultorio, salaexames, salacoleta, audiometria, raiox')
            .eq('data_atendimento', today);

        if (error || !agendamentos) {
            console.error('[useDashboardStats] Erro ao buscar dados do dashboard:', error);
            setLoading(false);
            return;
        }

        // Cast para any[] para acessar as colunas de sala dinamicamente via chave string
        const typedAgendamentos = agendamentos as any[];

        // ── Cálculo 1: Métricas de Resumo ─────────────────────────────────────────
        const total = typedAgendamentos.length;

        // Conta apenas os que efetivamente chegaram à clínica (compareceu = true)
        const present = typedAgendamentos.filter(a => a.compareceu).length;

        // 'waiting' = agendados mas ainda não chegaram fisicamente
        // Nota: não são pacientes "na fila de espera", mas sim "faltosos potenciais"
        const waiting = total - present;

        // ── Cálculo 2: Ocupação em Tempo Real por Sala ────────────────────────────
        // Para cada sala, contamos os pacientes que compareceram E ainda estão
        // ativos na fila ('Aguardando') ou sendo atendidos ('atendido').
        // Pacientes 'Finalizado' ou sem status não são contabilizados.
        let maxCount = 0; // Armazena o maior count entre todas as salas (usado para normalizar)

        const occupancyData = ROOM_MAPPING.map(room => {
            const count = typedAgendamentos.filter(a =>
                a.compareceu &&                                     // Paciente presente
                (a[room.key] === 'Aguardando' || a[room.key] === 'atendido') // Ainda na sala
            ).length;

            // Rastreia o máximo para cálculo proporcional da barra mais alta = 100%
            if (count > maxCount) maxCount = count;

            return { label: room.label, count };
        });

        // ── Normalização das Alturas do Gráfico ───────────────────────────────────
        // Converte count absoluto em percentual de 0 a 100 relativo ao máximo.
        // Exemplo: se maxCount=5 e uma sala tem 3 → height = (3/5)*100 = 60%
        // Se maxCount=0 (ninguém presente), todas as barras ficam com height=0
        const finalOccupancyData = occupancyData.map(d => ({
            ...d,
            height: maxCount === 0 ? 0 : (d.count / maxCount) * 100,
        }));

        // Persiste os dados calculados no estado do hook
        setStats({ total, present, waiting });
        setRoomOccupancy(finalOccupancyData);
        setLoading(false);
    };

    return { loading, userName, stats, roomOccupancy };
}
