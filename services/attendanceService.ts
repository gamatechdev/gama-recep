/**
 * attendanceService.ts
 * ---------------------
 * Serviço responsável por TODAS as operações de banco de dados
 * relacionadas ao ciclo de vida de um atendimento médico.
 *
 * Funções extraídas originalmente da função `cycleStatus` do CallScreen.tsx.
 * Seguindo o princípio de Separação de Responsabilidades (SoC), este módulo
 * NÃO conhece React — apenas executa transações no Supabase e retorna resultados.
 *
 * Estrutura:
 *  - updateRoomStatus       → Atualiza o status de uma sala no agendamento
 *  - startAttendanceSession → Inicia um atendimento (insere em 'atendimentos')
 *  - finishAttendanceSession → Finaliza um atendimento e gera a despesa financeira
 *  - pushPatientToScreen    → Move posição do paciente na fila do telão
 */

import { supabase } from './supabaseClient'; // Cliente Supabase canônico

// ─── Tipos de Parâmetros ──────────────────────────────────────────────────────

/** Parâmetros para iniciar um novo atendimento */
interface StartSessionParams {
    agendamentoId: number;    // ID do agendamento vinculado
    userId: number;           // ID interno (tabela 'users') do profissional
    nowISO: string;           // Timestamp atual em formato ISO para consistência
    column: string;           // Chave da coluna/sala (ex: 'consultorio')
    roomLabel: string;        // Label legível da sala (ex: 'Consultório Médico')
}

/** Parâmetros para finalizar um atendimento já aberto */
interface FinishSessionParams {
    agendamentoId: number;    // ID do agendamento a ser fechado
    userId: number;           // ID do profissional (para garantir que só fecha o seu)
    nowISO: string;           // Timestamp de finalização em formato ISO
    username: string;         // Nome do usuário para registrar na despesa financeira
}

// ─── Funções Exportadas ───────────────────────────────────────────────────────

/**
 * Atualiza o status de uma coluna/sala em um agendamento específico.
 * Chamada tanto para 'atendido' (amarelo) quanto para 'Finalizado' (verde).
 *
 * @param id         - ID do agendamento na tabela 'agendamentos'
 * @param column     - Chave da coluna (ex: 'consultorio', 'salaexames')
 * @param nextStatus - Novo status a ser persistido ('atendido' ou 'Finalizado')
 * @param extra      - Campos adicionais opcionais (como posicao_tela, sala_chamada)
 * @returns O objeto de erro do Supabase, ou null em caso de sucesso
 */
export async function updateRoomStatus(
    id: number,
    column: string,
    nextStatus: string,
    extra: Record<string, any> = {}
): Promise<{ error: any }> {
    // Monta o payload com o status da sala + quaisquer campos extras
    const payload = { [column]: nextStatus, ...extra };

    const { error } = await supabase
        .from('agendamentos')
        .update(payload)
        .eq('id', id);

    if (error) {
        console.error('[attendanceService] Erro ao atualizar status da sala:', error);
    }

    return { error };
}

/**
 * Move o paciente anterior para a posição 2 no telão e sobe o atual para a posição 1.
 * Isso garante a exibição histórica no painel de chamada para a recepção.
 *
 * @param agendamentoId - ID do agendamento que está sendo chamado agora
 */
export async function pushPatientToScreen(agendamentoId: number): Promise<void> {
    // Rebaixa o paciente que estava em posição 1 para posição 2 (histórico)
    await supabase
        .from('agendamentos')
        .update({ posicao_tela: 2 })
        .eq('posicao_tela', 1);

    // O update da posição 1 do agendamento atual é feito junto ao updateRoomStatus via 'extra'
}

/**
 * Registra o início de um atendimento na tabela 'atendimentos'.
 * Cria um registro aberto (finalizou_em = null) que será fechado em finishAttendanceSession.
 *
 * @param params - Parâmetros do início da sessão (see StartSessionParams)
 * @returns O objeto de erro do Supabase, ou null em caso de sucesso
 */
export async function startAttendanceSession(params: StartSessionParams): Promise<{ error: any }> {
    const { agendamentoId, userId, nowISO } = params;

    // Insere na tabela 'atendimentos' — finalizou_em = null indica sessão ainda aberta
    // Nota: campo 'profissional' foi propositalmente omitido para evitar erro de FK com perfil_med
    const { error } = await supabase.from('atendimentos').insert({
        agendamento_id: agendamentoId,
        user_id: userId,        // Vínculo com a tabela 'users'
        chamou_em: nowISO,      // Momento em que o profissional chamou o paciente
        finalizou_em: null      // null = sessão ainda ativa (usada pelo timer)
    });

    if (error) {
        console.error('[attendanceService] Erro ao registrar início de atendimento:', error);
    }

    return { error };
}

/**
 * Finaliza um atendimento aberto na tabela 'atendimentos' registrando o timestamp de fim.
 * Utiliza .is('finalizou_em', null) para garantir que apenas o registro aberto é fechado
 * — proteção contra condições de corrida onde dois profissionais tentam finalizar o mesmo paciente.
 *
 * @param params - Parâmetros de finalização (see FinishSessionParams)
 * @returns O objeto de erro do Supabase, ou null em caso de sucesso
 */
export async function finishAttendanceSession(params: FinishSessionParams): Promise<{ error: any }> {
    const { agendamentoId, nowISO } = params;

    // Atualiza SOMENTE o registro em aberto (finalizou_em IS NULL) para este agendamento
    const { error } = await supabase
        .from('atendimentos')
        .update({ finalizou_em: nowISO })
        .eq('agendamento_id', agendamentoId)
        .is('finalizou_em', null); // Proteção contra dupla finalização

    if (error) {
        console.error('[attendanceService] Erro ao finalizar atendimento:', error);
    }

    return { error };
}

/**
 * Gera um lançamento de despesa financeira ao finalizar um atendimento por prestador.
 * O "valor" inicia em 0 pois o valor real é calculado/negociado posteriormente.
 * A "data_projetada" sempre aponta para o último dia do mês corrente.
 *
 * @param username - Nome do profissional que realizou o atendimento (exibido na despesa)
 * @returns O objeto de erro do Supabase, ou null em caso de sucesso
 */
export async function insertFinancialExpense(username: string): Promise<{ error: any }> {
    const date = new Date();

    // Calcula o último dia do mês atual (ex: 31/03, 28/02, 30/04)
    // Trick: Dia 0 do mês SEGUINTE = último dia do mês ATUAL
    const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const dataProjetada = lastDayOfMonth.toISOString().split('T')[0]; // Formato YYYY-MM-DD

    const { error } = await supabase.from('financeiro_despesas').insert({
        desc: 'Atendimento por prestador',
        fornecedor: username,           // Prestador que realizou o atendimento
        forma_pagamento: 'a combinar',
        centro_custos: 'Variavel',
        responsavel: 'Gama Medicina',
        valor: 0,                       // Valor 0 — será ajustado manualmente depois
        data_projetada: dataProjetada,  // Projetada para o final do mês
        status: 'pendente',
        nome: username,                 // Campo 'nome' também recebe o username conforme regra de negócio
        qnt_parcela: 1,
        categoria: 'Medicina',
        recorrente: false
    });

    if (error) {
        console.error('[attendanceService] Erro ao gerar despesa financeira:', error);
    } else {
        console.log('[attendanceService] Despesa financeira gerada com sucesso.');
    }

    return { error };
}
