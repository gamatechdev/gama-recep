/**
 * useCallQueue.ts
 * ---------------
 * Custom hook que gerencia toda a lógica de busca e atualização
 * da fila de atendimento da Tela de Chamada.
 *
 * Responsabilidades:
 *  - Busca inicial dos agendamentos do dia com compareceu=true
 *  - Polling automático a cada 10 segundos como fallback de sincronização
 *  - Filtro de agendamentos: só exibe quem tem ao menos uma sala em 'Aguardando' ou 'atendido'
 *  - Atualização otimista via setAppointments exposto no retorno
 *
 * O componente visual (CallScreen) apenas consome 'appointments', 'loading' e 'setAppointments'.
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient'; // Cliente Supabase canônico
import { Agendamento } from '../types';                // Tipagem global dos agendamentos

// Colunas de sala utilizadas para filtrar agendamentos relevantes
// Deve estar em sync com ROOM_COLUMNS do CallScreen
const ROOM_KEYS = ['consultorio', 'salaexames', 'salacoleta', 'audiometria', 'raiox'];

// ─── Interface de Retorno ─────────────────────────────────────────────────────

interface UseCallQueueReturn {
    appointments: Agendamento[];                                                     // Lista de agendamentos ativos na fila
    loading: boolean;                                                                // True durante o primeiro carregamento
    setAppointments: React.Dispatch<React.SetStateAction<Agendamento[]>>;            // Exposto para atualizações otimistas no CallScreen
    refetch: () => Promise<void>;                                                    // Função para forçar re-busca manual
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

export function useCallQueue(): UseCallQueueReturn {
    // Lista de agendamentos filtrados e ordenados (os "relevantes" para a tela)
    const [appointments, setAppointments] = useState<Agendamento[]>([]);
    // Controla o skeleton/spinner de carregamento inicial
    const [loading, setLoading] = useState(true);

    /**
     * Função principal de busca dos agendamentos do dia corrente.
     * Busca todos os agendamentos em que o paciente já chegou (compareceu=true),
     * ordenando por prioridade (desc) e por hora de chegada (asc) — FIFO dentro de cada grupo.
     *
     * Filtro pós-busca: remove agendamentos onde nenhuma sala de interesse
     * está em 'Aguardando' ou 'atendido' — evita exibir pacientes já concluídos.
     */
    const fetchQueue = useCallback(async () => {
        // Pega apenas a data de hoje no formato YYYY-MM-DD (sem horário)
        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('agendamentos')
            .select(`
        *,
        colaboradores:colaboradores!agendamentos_colaborador_id_fkey (id, nome)
      `)
            .eq('data_atendimento', today)
            .eq('compareceu', true)
            // Prioridade: True sobe ao topo (nullsFirst: false garante que null cai por último)
            .order('prioridade', { ascending: false, nullsFirst: false })
            // Dentro de cada prioridade, ordena por hora de chegada (FIFO)
            .order('chegou_em', { ascending: true });

        if (error) {
            console.error('[useCallQueue] Erro ao buscar fila:', error);
            return;
        }

        // Filtra: só exibe agendamentos que possuem ao menos uma sala pendente/em curso
        const filtered = (data as unknown as Agendamento[]).filter(apt =>
            ROOM_KEYS.some(key =>
                apt[key as keyof Agendamento] === 'Aguardando' ||
                apt[key as keyof Agendamento] === 'atendido'
            )
        );

        setAppointments(filtered);
        // Carregamento inicial concluído — remove o spinner
        setLoading(false);
    }, []);

    // ── Effect: Busca inicial + Polling de 10s ────────────────────────────────
    useEffect(() => {
        // Busca imediata ao montar o hook
        fetchQueue();

        // Polling a cada 10s como fallback de sincronização entre dispositivos
        // (complementa o realtime mas garante consistência mesmo sem WebSocket)
        const interval = setInterval(fetchQueue, 10_000);

        // Cleanup: cancela o polling ao desmontar o componente
        return () => clearInterval(interval);
    }, [fetchQueue]);

    return {
        appointments,
        loading,
        setAppointments, // Exposto para permitir atualizações otimistas no orquestrador
        refetch: fetchQueue,
    };
}
