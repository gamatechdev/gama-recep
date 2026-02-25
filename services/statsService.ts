/**
 * statsService.ts
 * ----------------
 * Serviço de banco de dados para a tela de Estatísticas (StatsScreen).
 * Encapsula as duas queries ao Supabase necessárias para montar o comparativo.
 *
 * Funções exportadas:
 *  - fetchCurrentStatsUser   → Identifica o usuário logado e retorna seu id interno + username
 *  - fetchTodayAttendances   → Busca todos os atendimentos da equipe no dia atual (finalizados)
 *
 * Tipos exportados:
 *  - AtendimentoStats   → Estrutura de um registro da tabela 'atendimentos'
 *  - ProfissionalMetric → Métrica calculada de um profissional para exibição no ranking
 */

import { supabase } from './supabaseClient'; // Cliente Supabase canônico

// ─── Tipos Exportados ─────────────────────────────────────────────────────────

/** Registro bruto da tabela 'atendimentos' */
export interface AtendimentoStats {
    id: number;
    chamou_em: string;      // Timestamp de quando o paciente foi chamado
    finalizou_em: string;   // Timestamp de quando o atendimento foi encerrado
    user_id: number;        // ID interno (tabela users) do profissional que atendeu
}

/** Métrica calculada de um profissional para o gráfico de comparação */
export interface ProfissionalMetric {
    id: number;
    name: string;
    count: number;          // Total de atendimentos realizados no dia
    avgTimeSeconds: number; // Tempo médio de atendimento em segundos
}

// ─── Resultado da query de usuário ───────────────────────────────────────────

export interface CurrentStatsUser {
    internalId: number;  // ID interno do usuário na tabela 'users'
    username: string;    // Nome de exibição do usuário
}

// ─── Função 1: Identificar Usuário Logado ─────────────────────────────────────

/**
 * Identifica o usuário atualmente autenticado no Supabase Auth e busca
 * seu registro interno na tabela 'users' para obter o ID interno e nome.
 *
 * Fluxo:
 *  1. supabase.auth.getUser() → obtém o UUID do usuário autenticado
 *  2. tabela 'users'          → busca id interno e username pelo user_id (UUID)
 *
 * @returns CurrentStatsUser com id interno e username, ou null se não autenticado/erro
 */
export async function fetchCurrentStatsUser(): Promise<CurrentStatsUser | null> {
    // Passo 1: Obtém o usuário autenticado via Supabase Auth
    const { data: { user } } = await supabase.auth.getUser();

    // Guarda de segurança: sem usuário autenticado não há o que buscar
    if (!user) return null;

    // Passo 2: Busca o ID interno e o nome do usuário na tabela 'users'
    // O user_id na tabela 'users' corresponde ao UUID do auth.users
    const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username')
        .eq('user_id', user.id) // Filtra pelo UUID do auth.users
        .single();

    if (userError || !userData) {
        console.error('[statsService] Erro ao identificar usuário:', userError);
        return null;
    }

    return {
        internalId: userData.id,
        username: userData.username,
    };
}

// ─── Função 2: Buscar Atendimentos do Dia ────────────────────────────────────

/**
 * Busca TODOS os atendimentos finalizados de HOJE de toda a equipe.
 * Não filtra por usuário — o processamento por usuário é feito no hook useStats.
 *
 * Filtros aplicados:
 *  - chamou_em >= início do dia (todayISO) → apenas atendimentos de hoje
 *  - finalizou_em IS NOT NULL              → apenas atendimentos concluídos
 *  - chamou_em IS NOT NULL                 → garante que o tempo inicial existe
 *
 * @param todayISO - ISO string do início do dia em UTC (ex: "2026-02-25T03:00:00.000Z")
 * @returns Array de AtendimentoStats ou array vazio em caso de erro
 */
export async function fetchTodayAttendances(todayISO: string): Promise<AtendimentoStats[]> {
    const { data, error } = await supabase
        .from('atendimentos')
        .select('id, chamou_em, finalizou_em, user_id') // Campos necessários para cálculo de tempo
        .gte('chamou_em', todayISO)                      // Apenas atendimentos do dia atual
        .not('finalizou_em', 'is', null)                 // Somente atendimentos finalizados
        .not('chamou_em', 'is', null);                   // Garante que o timestamp inicial existe

    if (error) {
        console.error('[statsService] Erro ao buscar atendimentos:', error);
        return [];
    }

    return (data as unknown as AtendimentoStats[]) ?? [];
}
