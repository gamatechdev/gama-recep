/**
 * asoService.ts
 * --------------
 * Serviço de banco de dados para o módulo de ASO (Atestado de Saúde Ocupacional).
 * Encapsula todas as queries ao Supabase necessárias para montar o documento ASO.
 *
 * Funções exportadas:
 *  - getCompanyInfo        → Busca razão social e CNPJ da empresa via unidade
 *  - getOccupationalRisks  → Busca os riscos ocupacionais via cadeia: Setor → Unidade_Setor → Riscos_Unidade → Riscos
 *
 * Relações de tabelas utilizadas:
 *
 *  getCompanyInfo:
 *    agendamento.unidade (unidade_id)
 *      → unidades.empresaid (empresa_id)
 *        → clientes.nome_fantasia + cnpj
 *
 *  getOccupationalRisks:
 *    colaborador.setor (nome do setor)
 *      → setor.id              (A. Busca ID do setor pelo nome)
 *        → unidade_setor.id    (B. Busca o vínculo unidade-setor)
 *          → riscos_unidade[]  (C. Busca os IDs dos riscos vinculados ao setor+unidade)
 *            → riscos[]        (D. Busca os detalhes de cada risco: nome e tipo)
 */

import { supabase } from './supabaseClient'; // Cliente Supabase canônico

// ─── Tipos Exportados ─────────────────────────────────────────────────────────

/** Dados da empresa para exibição no quadro "Empresa" do ASO */
export interface CompanyInfo {
    razao_social: string; // nome_fantasia do cliente
    cnpj: string;
}

/** Risco ocupacional com tipo numérico e nome descritivo */
export interface RiskData {
    tipo: number; // 1=Físico, 2=Químico, 3=Ergonômico, 4=Acidente, 5=Biológico
    nome: string;
}

// ─── Função 1: Dados da Empresa ───────────────────────────────────────────────

/**
 * Busca as informações da empresa (razão social e CNPJ) a partir de um ID de unidade.
 *
 * Fluxo de queries:
 *  1. unidades → busca empresaid pelo id da unidade do agendamento
 *  2. clientes  → busca nome_fantasia e cnpj pelo empresaid obtido
 *
 * @param unidadeId - ID da unidade do agendamento (appointment.unidade)
 * @returns CompanyInfo com razão social e CNPJ, ou valores vazios em caso de erro/ausência
 */
export async function getCompanyInfo(unidadeId: number): Promise<CompanyInfo> {
    // Valor padrão retornado em caso de falha em qualquer etapa
    const empty: CompanyInfo = { razao_social: '', cnpj: '' };

    // Passo 1: Obtém o ID da empresa (empresaid) a partir da unidade do agendamento
    const { data: unitData } = await supabase
        .from('unidades')
        .select('empresaid')
        .eq('id', unidadeId) // Filtra pela unidade do agendamento
        .single();

    // Guarda de segurança: se não encontrou a unidade ou o vínculo com empresa, retorna vazio
    if (!unitData?.empresaid) return empty;

    // Passo 2: Obtém o nome fantasia e CNPJ do cliente (empresa) pelo ID encontrado
    const { data: clientData } = await supabase
        .from('clientes')
        .select('nome_fantasia, cnpj')
        .eq('id', unitData.empresaid) // Filtra pelo ID da empresa vinculado à unidade
        .single();

    // Se não encontrou o cliente, retorna vazio
    if (!clientData) return empty;

    return {
        razao_social: clientData.nome_fantasia ?? '',
        cnpj: clientData.cnpj ?? '',
    };
}

// ─── Função 2: Riscos Ocupacionais ────────────────────────────────────────────

/**
 * Busca os riscos ocupacionais de um colaborador no seu setor e unidade específicos.
 *
 * Fluxo de queries (cadeia de 4 passos):
 *
 *  A. setor          → Busca o ID do setor pelo nome (ilike para tolerância de case)
 *  B. unidade_setor  → Busca o registro de vínculo entre a unidade e o setor
 *  C. riscos_unidade → Lista os risco_ids ativados para aquele vínculo unidade-setor
 *  D. riscos         → Obtém o nome e tipo de cada risco pelo seu ID
 *
 * @param unidadeId  - ID da unidade do agendamento
 * @param setorName  - Nome do setor do colaborador (appointment.colaboradores.setor)
 * @returns Array de RiskData ordenados por tipo, ou array vazio se não houver riscos
 */
export async function getOccupationalRisks(unidadeId: number, setorName: string): Promise<RiskData[]> {
    // ── Passo A: Busca o ID do setor pelo nome ────────────────────────────────
    // Usa ilike para busca case-insensitive (ex: "Administrativo" == "administrativo")
    const { data: setorData } = await supabase
        .from('setor')
        .select('id')
        .ilike('nome', setorName) // Tolerância a variações de capitalização
        .maybeSingle();           // Retorna null (sem erro) se não encontrar

    // Se o setor não existir no banco, não há riscos a retornar
    if (!setorData) return [];

    // ── Passo B: Busca o vínculo Unidade-Setor ────────────────────────────────
    // A tabela 'unidade_setor' relaciona unidades com setores e é referenciada por riscos_unidade
    const { data: usData } = await supabase
        .from('unidade_setor')
        .select('id')
        .eq('unidade_id', unidadeId)  // Filtra pela unidade do agendamento
        .eq('setor_id', setorData.id) // Filtra pelo setor do colaborador
        .maybeSingle();

    // Se não existe vínculo unidade-setor, não há riscos cadastrados para esse par
    if (!usData) return [];

    // ── Passo C: Busca os IDs dos riscos vinculados a este par unidade-setor ──
    // A tabela 'riscos_unidade' é a tabela de junção que lista quais riscos existem
    // para cada combinação de unidade+setor
    const { data: riskLinks } = await supabase
        .from('riscos_unidade')
        .select('risco_id')
        .eq('unidade_setor', usData.id); // Filtra pelo ID do vínculo unidade-setor

    // Se não há vínculos de risco para esta combinação, retorna vazio
    if (!riskLinks || riskLinks.length === 0) return [];

    // Extrai apenas os IDs dos riscos para a próxima query
    const riskIds = riskLinks.map(r => r.risco_id);

    // ── Passo D: Busca os detalhes dos riscos pelo array de IDs ──────────────
    // A tabela 'riscos' contém o nome descritivo e o tipo numérico de cada risco
    const { data: riskDetails } = await supabase
        .from('riscos')
        .select('nome, tipo')
        .in('id', riskIds); // Busca todos os riscos cujo ID está no array

    return (riskDetails as RiskData[]) ?? [];
}
