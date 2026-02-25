/**
 * agendaService.ts
 * Serviço de banco de dados para o módulo de Agenda.
 * Contém todas as interações com o Supabase referentes a agendamentos.
 */

import { supabase } from './supabaseClient';

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface FetchByDateRangeParams {
    start: string;
    end: string;
    showPendingOnly: boolean;
}

export interface FinancialRevenuePayload {
    contratante: number;
    unidade_contratante: number;
    valor_med: number;
    valor_total: number;
    valor_esoc: number;
    status: string;
    data_executada: string;
    data_projetada: string;
    descricao: string;
    empresa_resp: string;
    exames_snapshot: string[];
}

// ─── Funções de Busca ─────────────────────────────────────────────────────────

/**
 * Busca agendamentos por intervalo de datas com joins de colaboradores, unidades e prontuários.
 * Opcionalmente filtra apenas pendentes (sem comparecimento).
 */
export async function fetchAppointmentsByDateRange(params: FetchByDateRangeParams) {
    const { start, end, showPendingOnly } = params;

    let query = supabase
        .from('agendamentos')
        .select(`
      *,
      colaboradores:colaboradores!agendamentos_colaborador_id_fkey (id, nome, cpf, data_nascimento, sexo, cargos(nome), setor),
      unidades:unidades!agendamentos_unidade_fkey (id, nome_unidade),
      prontuarios:prontuarios_agendamentos!prontuarios_agendamentos_agendamento_id_fkey(*)
    `)
        .gte('data_atendimento', start)
        .lte('data_atendimento', end);

    // Filtra apenas quem NÃO compareceu se showPendingOnly=true
    if (showPendingOnly) {
        query = query.or('compareceu.eq.false,compareceu.is.null');
    }

    // Ordenação: data_atendimento ASC → prioridade DESC → id DESC
    query = query
        .order('data_atendimento', { ascending: true })
        .order('prioridade', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });

    return query;
}

/**
 * Busca agendamentos por nome de colaborador (busca parcial, case-insensitive).
 * Limitado a 50 resultados para performance.
 */
export async function searchAppointmentsByName(searchTerm: string) {
    return supabase
        .from('agendamentos')
        .select(`
      *,
      colaboradores:colaboradores!agendamentos_colaborador_id_fkey!inner (id, nome, cpf, data_nascimento, sexo, cargos(nome), setor),
      unidades:unidades!agendamentos_unidade_fkey (id, nome_unidade),
      prontuarios:prontuarios_agendamentos!prontuarios_agendamentos_agendamento_id_fkey(*)
    `)
        .ilike('colaboradores.nome', `%${searchTerm}%`)
        .order('prioridade', { ascending: false, nullsFirst: false })
        .order('data_atendimento', { ascending: false })
        .limit(50);
}

// ─── Funções de Toggle/Update ─────────────────────────────────────────────────

/**
 * Atualiza compareceu e chegou_em de um agendamento.
 * chegadaTime=null quando compareceu=false.
 */
export async function updateAttendanceStatus(id: number, newStatus: boolean, chegadaTime: string | null) {
    return supabase
        .from('agendamentos')
        .update({ compareceu: newStatus, chegou_em: chegadaTime })
        .eq('id', id);
}

/** Busca o empresaId vinculado a uma unidade. */
export async function fetchUnitEmpresaId(unidadeId: number) {
    return supabase.from('unidades').select('empresaid').eq('id', unidadeId).single();
}

/** Busca dados financeiros (envia_esoc, valor_esoc) de um cliente. */
export async function fetchClientFinancialData(empresaId: number) {
    return supabase.from('clientes').select('envia_esoc, valor_esoc').eq('id', empresaId).single();
}

/** Busca tabela de preços de exames de uma empresa. */
export async function fetchExamPrices(empresaId: number) {
    return supabase.from('preco_exames').select('nome, preco').eq('empresaId', empresaId);
}

/** Insere um lançamento de receita financeira. */
export async function insertFinancialRevenue(payload: FinancialRevenuePayload) {
    return supabase.from('financeiro_receitas').insert(payload);
}

/**
 * Upsert de faturamento na tabela gerencia_meta para o mês atual.
 * Soma ao existente se já houver registro, cria um novo caso contrário.
 */
export async function upsertGerenciaMeta(gerenciaId: number, amount: number, firstDay: string, lastDayISO: string) {
    const { data: existingMeta } = await supabase
        .from('gerencia_meta')
        .select('id, faturamento')
        .eq('gerencia', gerenciaId)
        .gte('created_at', firstDay)
        .lte('created_at', lastDayISO)
        .maybeSingle();

    if (existingMeta) {
        // Incrementa o faturamento existente
        await supabase.from('gerencia_meta')
            .update({ faturamento: Number(existingMeta.faturamento) + Number(amount) })
            .eq('id', existingMeta.id);
    } else {
        // Cria novo registro de meta para esta gerência
        await supabase.from('gerencia_meta').insert({ gerencia: gerenciaId, faturamento: Number(amount) });
    }
}

/** Alterna o campo aso_feito (true/false) de um agendamento. */
export async function updateAsoStatus(id: number, newStatus: boolean) {
    return supabase.from('agendamentos').update({ aso_feito: newStatus }).eq('id', id);
}

/** Atualiza a data de liberação do ASO (aso_liberado). String vazia → null. */
export async function updateAsoLiberado(id: number, newDate: string | null) {
    return supabase.from('agendamentos').update({ aso_liberado: newDate || null }).eq('id', id);
}

// ─── Funções de Upload ────────────────────────────────────────────────────────

/**
 * Faz upload de um PDF de ASO para o bucket 'asos' e salva a URL pública no agendamento.
 * Retorna { publicUrl, error }.
 */
export async function uploadAsoFile(agendamentoId: number, file: File): Promise<{ publicUrl: string | null; error: any }> {
    try {
        const fileName = `aso_${agendamentoId}_${new Date().getTime()}.pdf`;

        // 1. Upload para o bucket 'asos'
        const { error: uploadError } = await supabase.storage.from('asos').upload(fileName, file);
        if (uploadError) return { publicUrl: null, error: uploadError };

        // 2. Obtém a URL pública do arquivo
        const { data: { publicUrl } } = supabase.storage.from('asos').getPublicUrl(fileName);

        // 3. Persiste a URL no campo aso_url do agendamento
        const { error: updateError } = await supabase.from('agendamentos').update({ aso_url: publicUrl }).eq('id', agendamentoId);
        if (updateError) return { publicUrl: null, error: updateError };

        return { publicUrl, error: null };
    } catch (error) {
        return { publicUrl: null, error };
    }
}

/**
 * Faz upload de arquivos e-Social para o bucket 'documents'.
 * Detecta o tipo de evento (2240/2220) pelo nome do arquivo.
 * Insere registros na tabela 'esoc_agendamentos'.
 */
export async function uploadEsocFiles(agendamentoId: number, files: FileList): Promise<{ uploadCount: number; error: any }> {
    let uploadCount = 0;
    try {
        for (const file of Array.from(files)) {
            const timestamp = new Date().getTime();
            // Detecta o tipo de evento e-Social pelo nome do arquivo
            let folder = 'esoc';
            let eventType = 'Indefinido';
            if (file.name.includes('2240')) { folder = 'esoc/2240'; eventType = '2240'; }
            else if (file.name.includes('2220')) { folder = 'esoc/2220'; eventType = '2220'; }

            const uniquePath = `${folder}/${agendamentoId}_${timestamp}_${file.name}`;

            // Upload para o bucket 'documents'
            const { error: uploadError } = await supabase.storage.from('documents').upload(uniquePath, file);
            if (uploadError) throw uploadError;

            // Obtém a URL pública do arquivo
            const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(uniquePath);

            // Insere o registro na tabela esoc_agendamentos
            const { error: insertError } = await supabase.from('esoc_agendamentos')
                .insert({ agendamento_id: agendamentoId, evento: eventType, url: publicUrl });
            if (insertError) throw insertError;

            uploadCount++;
        }
        return { uploadCount, error: null };
    } catch (error) {
        return { uploadCount, error };
    }
}

/**
 * Faz upload de prontuários para o bucket 'prontuarios'.
 * Detecta o tipo de prontuário pelo prefixo do nome do arquivo (ACU → Acuidade, etc.).
 * Insere registros em 'prontuarios_agendamentos' e retorna os objetos inseridos.
 */
export async function uploadProntuarioFiles(agendamentoId: number, files: FileList): Promise<{ uploadCount: number; insertedFiles: any[]; error: any }> {
    let uploadCount = 0;
    const insertedFiles: any[] = [];
    try {
        for (const file of Array.from(files)) {
            const nameUpper = file.name.toUpperCase();
            let folder = 'outros';
            let tipo = 'Outros';

            // Mapeamento do tipo de prontuário pelo prefixo do arquivo
            if (nameUpper.startsWith('ACU')) { folder = 'acuidade'; tipo = 'Acuidade'; }
            else if (nameUpper.startsWith('AUDIO')) { folder = 'audio'; tipo = 'Audiometria'; }
            else if (nameUpper.startsWith('ECG')) { folder = 'ecg'; tipo = 'Eletrocardiograma'; }
            else if (nameUpper.startsWith('EEG')) { folder = 'eeg'; tipo = 'Eletroencefalograma'; }
            else if (nameUpper.startsWith('ESP')) { folder = 'espiro'; tipo = 'Espirometria'; }
            else if (nameUpper.startsWith('LAB')) { folder = 'lab'; tipo = 'Laboratorio'; }
            else if (nameUpper.startsWith('PSICO')) { folder = 'psico'; tipo = 'Psicossocial'; }
            else if (nameUpper.startsWith('RX')) { folder = 'rx'; tipo = 'Raio X'; }

            const timestamp = new Date().getTime();
            // Normaliza o nome para evitar caracteres especiais no path do storage
            const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
            const path = `${folder}/${agendamentoId}_${timestamp}_${safeName}`;

            // Upload para o bucket 'prontuarios'
            const { error: upErr } = await supabase.storage.from('prontuarios').upload(path, file);
            if (upErr) throw upErr;

            // Obtém a URL pública do prontuário
            const { data: { publicUrl } } = supabase.storage.from('prontuarios').getPublicUrl(path);

            // Insere o registro do prontuário na tabela prontuarios_agendamentos
            const { data: inserted, error: dbErr } = await supabase
                .from('prontuarios_agendamentos')
                .insert({ agendamento_id: agendamentoId, tipo, url: publicUrl })
                .select().single();
            if (dbErr) throw dbErr;

            if (inserted) insertedFiles.push(inserted);
            uploadCount++;
        }
        return { uploadCount, insertedFiles, error: null };
    } catch (error) {
        return { uploadCount, insertedFiles, error };
    }
}

// ─── Exportação ───────────────────────────────────────────────────────────────

/**
 * Busca paginada de agendamentos para exportação em XLS.
 * Faz múltiplas chamadas (batches de 500) até buscar todos os registros do período.
 */
export async function fetchExportData(startDate: string, endDate: string, includeAbsent: boolean): Promise<{ data: any[]; error: any }> {
    const BATCH_SIZE = 500; // Tamanho do lote para não causar timeout
    let allItems: any[] = [];
    let from = 0;
    let hasMore = true;

    try {
        while (hasMore) {
            // Reconstrói a query a cada iteração para aplicar o range correto
            let query = supabase
                .from('agendamentos')
                .select(`
          *,
          colaboradores:colaboradores!agendamentos_colaborador_id_fkey (id, nome, cpf, data_nascimento, sector:setor, cargos(nome)),
          unidades:unidades!agendamentos_unidade_fkey (id, nome_unidade)
        `)
                .gte('data_atendimento', startDate)
                .lte('data_atendimento', endDate)
                .order('data_atendimento', { ascending: true });

            // Opcional: inclui somente quem compareceu
            if (!includeAbsent) query = query.eq('compareceu', true);

            // Aplica paginação por range (from → from + BATCH_SIZE - 1)
            const { data, error } = await query.range(from, from + BATCH_SIZE - 1);
            if (error) throw error;

            if (data && data.length > 0) {
                allItems = [...allItems, ...data];
                // Menos que BATCH_SIZE significa que chegamos ao final
                if (data.length < BATCH_SIZE) hasMore = false;
                else from += BATCH_SIZE; // Avança o cursor para o próximo lote
            } else {
                hasMore = false;
            }
        }
        return { data: allItems, error: null };
    } catch (error) {
        return { data: [], error };
    }
}
