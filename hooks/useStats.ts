/**
 * useStats.ts
 * ------------
 * Custom hook que centraliza toda a lógica de busca e cálculo das estatísticas diárias.
 *
 * Estados gerenciados:
 *  - loading        → true enquanto as queries estão em andamento
 *  - averageTime    → Tempo médio de atendimento do usuário logado (em segundos)
 *  - globalAverage  → Tempo médio de toda a equipe (em segundos)
 *  - totalServices  → Total de atendimentos finalizados pelo usuário hoje
 *  - ranking        → Array com a métrica do usuário atual para o gráfico de barras
 *  - userName       → Nome do usuário logado para exibição nos cards e gráfico
 *
 * Funções utilitárias retornadas:
 *  - formatDuration     → Formata segundos em "Xm YYs"
 *  - formatMinutesOnly  → Retorna apenas os minutos inteiros
 */

import { useEffect, useState } from 'react';
import {
    AtendimentoStats,
    ProfissionalMetric,
    fetchCurrentStatsUser,
    fetchTodayAttendances,
} from '../services/statsService';

// ─── Interface de Retorno ─────────────────────────────────────────────────────

export interface UseStatsReturn {
    loading: boolean;
    averageTime: number;
    globalAverage: number;
    totalServices: number;
    ranking: ProfissionalMetric[];
    userName: string;
    formatDuration: (totalSeconds: number) => string;
    formatMinutesOnly: (totalSeconds: number) => number;
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

/**
 * Hook de estatísticas diárias.
 * Orquestra o fetch de usuário + atendimentos e executa processMetrics para
 * calcular as métricas de desempenho individual e da equipe.
 */
export function useStats(): UseStatsReturn {
    // ── Estados ──────────────────────────────────────────────────────────────
    const [loading, setLoading] = useState(true);
    const [averageTime, setAverageTime] = useState(0); // Média pessoal em segundos
    const [globalAverage, setGlobalAverage] = useState(0); // Média da equipe em segundos
    const [totalServices, setTotalServices] = useState(0); // Total de atendimentos do usuário
    const [ranking, setRanking] = useState<ProfissionalMetric[]>([]);
    const [userName, setUserName] = useState('');

    // ── Effect: Dispara o fetch ao montar o componente ───────────────────────
    useEffect(() => {
        fetchStats();
    }, []); // Sem dependências — executa apenas uma vez ao montar

    // ── Função de Busca Orquestrada ──────────────────────────────────────────
    /**
     * Executa em sequência:
     *  1. fetchCurrentStatsUser → obtém o ID interno e username do usuário logado
     *  2. Calcula o início do dia em UTC para filtrar apenas registros de hoje
     *  3. fetchTodayAttendances → busca todos os atendimentos da equipe de hoje
     *  4. processMetrics        → calcula médias pessoal e global, monta o ranking
     */
    const fetchStats = async () => {
        setLoading(true);

        try {
            // Passo 1: Identificar o usuário autenticado
            const currentUser = await fetchCurrentStatsUser();

            if (!currentUser) {
                // Sem usuário autenticado, não há estatísticas para exibir
                setLoading(false);
                return;
            }

            setUserName(currentUser.username);

            // Passo 2: Calcular o início do dia atual em UTC
            // setHours(0,0,0,0) ajusta para meia-noite no horário local,
            // e toISOString() converte para UTC — garantindo o filtro correto no Supabase
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayISO = today.toISOString();

            // Passo 3: Buscar todos os atendimentos finalizados no dia
            const records = await fetchTodayAttendances(todayISO);

            // Passo 4: Calcular as métricas com os registros obtidos
            processMetrics(records, currentUser.username, currentUser.internalId);

        } catch (err) {
            console.error('[useStats] Erro geral ao buscar estatísticas:', err);
        } finally {
            setLoading(false);
        }
    };

    // ── Processamento de Métricas ────────────────────────────────────────────
    /**
     * Calcula a média global da equipe e a média pessoal do usuário logado.
     *
     * Algoritmo:
     *  1. Filtra registros válidos: descarta durações negativas ou acima de 10 horas (36000s).
     *     Registros >10h são erros de dados (ex: sistema ficou aberto overnight).
     *  2. Calcula globalTotalSeconds somando a duração de todos os atendimentos válidos.
     *  3. Filtra os registros do usuário logado e calcula sua soma pessoal.
     *  4. Atualiza os estados com as médias calculadas e monta o array de ranking.
     *
     * @param records         - Todos os atendimentos do dia (equipe inteira)
     * @param currentUserName - Nome do usuário logado (para o ranking)
     * @param currentUserId   - ID interno do usuário (para filtrar seus registros)
     */
    const processMetrics = (
        records: AtendimentoStats[],
        currentUserName: string,
        currentUserId: number,
    ) => {
        // ── Passo 1: Filtrar registros válidos ───────────────────────────────────
        // Remove registros com duração negativa (erro de dados) ou acima de 36000s (>10h)
        // para não distorcer a média com valores absurdos
        const validRecords = records.filter(rec => {
            const start = new Date(rec.chamou_em).getTime();
            const end = new Date(rec.finalizou_em).getTime();
            const diffSeconds = (end - start) / 1000;
            return diffSeconds >= 0 && diffSeconds <= 36000; // Descarta anomalias (> 10 horas)
        });

        // ── Passo 2: Calcular média global da equipe ─────────────────────────────
        let globalTotalSeconds = 0;
        validRecords.forEach(rec => {
            const start = new Date(rec.chamou_em).getTime();
            const end = new Date(rec.finalizou_em).getTime();
            globalTotalSeconds += (end - start) / 1000; // Acumula duração em segundos
        });

        const globalCount = validRecords.length;
        const globalAvg = globalCount > 0 ? globalTotalSeconds / globalCount : 0;
        setGlobalAverage(globalAvg);

        // ── Passo 3: Calcular média pessoal do usuário ───────────────────────────
        // Filtra apenas os registros onde user_id corresponde ao usuário logado
        const userRecords = validRecords.filter(rec => rec.user_id === currentUserId);

        let userTotalSeconds = 0;
        userRecords.forEach(rec => {
            const start = new Date(rec.chamou_em).getTime();
            const end = new Date(rec.finalizou_em).getTime();
            userTotalSeconds += (end - start) / 1000; // Acumula duração em segundos
        });

        const userCount = userRecords.length;
        const userAvg = userCount > 0 ? userTotalSeconds / userCount : 0;

        setTotalServices(userCount);
        setAverageTime(userAvg);

        // ── Passo 4: Montar o array de ranking ──────────────────────────────────
        // Atualmente exibe apenas o usuário logado comparado à média global.
        // A estrutura de array permite expansão futura para múltiplos usuários.
        setRanking([{
            id: currentUserId,
            name: currentUserName,
            count: userCount,
            avgTimeSeconds: userAvg,
        }]);
    };

    // ── Funções Utilitárias de Formatação ────────────────────────────────────

    /**
     * Formata uma duração em segundos para o formato "Xm YYs".
     * Ex: 375 segundos → "6m 15s"
     *
     * @param totalSeconds - Duração em segundos
     * @returns String formatada no padrão "Xm YYs"
     */
    const formatDuration = (totalSeconds: number): string => {
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = Math.floor(totalSeconds % 60);
        return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
    };

    /**
     * Retorna apenas os minutos inteiros de uma duração em segundos.
     * Usado nos cards KPI onde o número grande é o destaque principal.
     *
     * @param totalSeconds - Duração em segundos
     * @returns Número inteiro de minutos
     */
    const formatMinutesOnly = (totalSeconds: number): number => {
        return Math.floor(totalSeconds / 60);
    };

    // ── Retorno do Hook ──────────────────────────────────────────────────────
    return {
        loading,
        averageTime,
        globalAverage,
        totalServices,
        ranking,
        userName,
        formatDuration,
        formatMinutesOnly,
    };
}
