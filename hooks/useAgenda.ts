/**
 * useAgenda.ts
 * -------------
 * Custom hook que centraliza TODA a lógica de estado, efeitos e handlers
 * da tela de Agenda. O componente Agenda.tsx apenas consume este hook
 * e repassa os dados para os subcomponentes visuais.
 *
 * Responsabilidades:
 *  - Estado de data selecionada, modo de visualização (dia/semana/mês) e filtros
 *  - Busca de agendamentos por período (fetchAgenda) com debounce de search
 *  - Busca full-text por nome do paciente (performSearch)
 *  - Toggle de presença (toggleAttendance) com cálculo de receita financeira e metas
 *  - Toggle de ASO (toggleAso) e update de data de liberação (handleUpdateAso)
 *  - Uploads de ASO, e-Social e prontuários
 *  - Exportação em XLS (handleExportXLS)
 *  - Navegação por data (handleNav, handleToday)
 *  - Helpers de formatação de data (formatDateDisplay, formatDateShort)
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { Agendamento } from '../types';
import {
    fetchAppointmentsByDateRange,
    searchAppointmentsByName,
    updateAttendanceStatus,
    fetchUnitEmpresaId,
    fetchClientFinancialData,
    fetchExamPrices,
    insertFinancialRevenue,
    upsertGerenciaMeta,
    updateAsoStatus,
    updateAsoLiberado,
    uploadAsoFile,
    uploadEsocFiles,
    uploadProntuarioFiles,
    fetchExportData,
} from '../services/agendaService';

// ─── Constantes ───────────────────────────────────────────────────────────────

/**
 * Lista de exames utilizada para mapeamento de nomes nas keywords de gerência e no export.
 * Mantida aqui pois faz parte da lógica de negócio (mapeamento de exame → gerência).
 */
const EXAMES_LIST_EXPORT = [
    { idx: 0, id: 447, nome: 'Avaliação Clínica' },
    { idx: 1, id: 448, nome: 'Audiometria' },
    { idx: 2, id: 449, nome: 'Acuidade Visual' },
    { idx: 3, id: 450, nome: 'Espirometria' },
    { idx: 4, id: 451, nome: 'Eletrocardiograma' },
    { idx: 5, id: 452, nome: 'Eletroencefalograma' },
    { idx: 6, id: 453, nome: 'Raio-X Tórax PA OIT' },
    { idx: 7, id: 454, nome: 'Raio-X Coluna L-Sacra' },
    { idx: 8, id: 455, nome: 'Raio-X Mãos e Braços' },
    { idx: 9, id: 456, nome: 'Raio-X Punho' },
    { idx: 10, id: 457, nome: 'Hemograma Completo' },
    { idx: 11, id: 458, nome: 'Glicemia em Jejum' },
    { idx: 12, id: 459, nome: 'EPF (parasitológico fezes)' },
    { idx: 13, id: 460, nome: 'EAS (urina)' },
    { idx: 14, id: 461, nome: 'Grupo Sanguíneo + Fator RH' },
    { idx: 15, id: 462, nome: 'Gama GT' },
    { idx: 16, id: 463, nome: 'TGO / TGP' },
    { idx: 17, id: 464, nome: 'Ácido Trans. Muconico' },
    { idx: 18, id: 465, nome: 'Ácido Úrico' },
    { idx: 19, id: 466, nome: 'Ácido Hipúr. (Tolueno urina)' },
    { idx: 20, id: 467, nome: 'Ácido Metil Hipúrico' },
    { idx: 21, id: 468, nome: 'Ácido Mandélico' },
    { idx: 22, id: 469, nome: 'ALA-U' },
    { idx: 23, id: 470, nome: 'Hemoglobina glicada' },
    { idx: 24, id: 471, nome: 'Coprocultura' },
    { idx: 25, id: 472, nome: 'Colesterol T e F' },
    { idx: 26, id: 473, nome: 'Chumbo Sérico' },
    { idx: 27, id: 474, nome: 'Creatinina' },
    { idx: 28, id: 475, nome: 'Ferro Sérico' },
    { idx: 29, id: 476, nome: 'Manganês Urinário' },
    { idx: 30, id: 477, nome: 'Manganês Sanguíneo' },
    { idx: 31, id: 478, nome: 'Reticulócitos' },
    { idx: 32, id: 479, nome: 'Triglicerídeos' },
    { idx: 33, id: 480, nome: 'IGE Específica - Abelha' },
    { idx: 34, id: 481, nome: 'Acetona Urinária' },
    { idx: 35, id: 482, nome: 'Anti HAV' },
    { idx: 36, id: 483, nome: 'Anti HBS' },
    { idx: 37, id: 484, nome: 'Anti HBSAG' },
    { idx: 38, id: 485, nome: 'Anti HCV' },
    { idx: 39, id: 486, nome: 'Carboxihemoglobina' },
    { idx: 40, id: 487, nome: 'Exame Toxicológico Pelo' },
    { idx: 41, id: 488, nome: 'Avaliação Vocal' },
    { idx: 42, id: 489, nome: 'Avaliação Psicossocial' },
    { idx: 43, id: 490, nome: 'Avaliação Psicológica' },
    { idx: 44, id: 491, nome: 'Aspecto da Pele' },
    { idx: 45, id: 492, nome: 'Questionário Epilepsia' },
    { idx: 46, id: 493, nome: 'Teste Palográfico' },
    { idx: 47, id: 494, nome: 'Teste de Atenção' },
    { idx: 48, id: 495, nome: 'Teste Romberg' },
    { idx: 49, id: 496, nome: 'Exame Toxicológico Urina' },
    { idx: 50, id: 497, nome: 'Higidez' },
    { idx: 51, id: 498, nome: 'Grupo Sanguíneo' },
];

// ─── Interfaces Locais ────────────────────────────────────────────────────────

/** Extensão local do Agendamento para incluir prontuários sem alterar o types.ts global */
export interface AgendamentoComProntuarios extends Agendamento {
    prontuarios?: {
        id: number;
        created_at: string;
        tipo: string;
        url: string;
    }[];
}

export type ViewMode = 'day' | 'week' | 'month';

// ─── Interface de Retorno do Hook ─────────────────────────────────────────────

export interface UseAgendaReturn {
    // ── Estado Principal ──────────────────────────────────────────────────────
    appointments: AgendamentoComProntuarios[];
    loading: boolean;
    selectedDate: string;
    viewMode: ViewMode;
    showPendingOnly: boolean;
    searchTerm: string;
    isSearching: boolean;
    isToday: boolean;

    // ── Estado de Export ──────────────────────────────────────────────────────
    showExportModal: boolean;
    exportStartDate: string;
    exportEndDate: string;
    isExporting: boolean;
    includeAbsent: boolean;

    // ── Estado de Upload ──────────────────────────────────────────────────────
    isUploading: boolean;
    uploadingAsoId: number | null;
    uploadModalAppointmentId: number | null;
    showProcedureListModal: boolean;

    // ── Refs de File Input ────────────────────────────────────────────────────
    fileInputRef: React.RefObject<HTMLInputElement>;
    esocFileInputRef: React.RefObject<HTMLInputElement>;
    prontuarioFileInputRef: React.RefObject<HTMLInputElement>;
    dateInputRef: React.RefObject<HTMLInputElement>;

    // ── Setters de Estado (para controle do Orquestrador) ────────────────────
    setSelectedDate: (date: string) => void;
    setViewMode: (mode: ViewMode) => void;
    setShowPendingOnly: (val: boolean) => void;
    setSearchTerm: (term: string) => void;
    setShowExportModal: (val: boolean) => void;
    setExportStartDate: (val: string) => void;
    setExportEndDate: (val: string) => void;
    setIncludeAbsent: (val: boolean) => void;
    setUploadModalAppointmentId: (id: number | null) => void;
    setShowProcedureListModal: (val: boolean) => void;
    setIsSearching: (val: boolean) => void;

    // ── Handlers de Ação ─────────────────────────────────────────────────────
    toggleAttendance: (id: number, currentStatus: boolean | null) => Promise<void>;
    toggleAso: (id: number, currentAsoFeito: boolean | undefined) => Promise<void>;
    handleUpdateAso: (id: number, newDate: string) => Promise<void>;
    handleOpenProcedures: (apt: AgendamentoComProntuarios) => void;
    triggerAsoUpload: (id: number) => void;
    handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    triggerEsocUpload: () => void;
    handleEsocFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    triggerProntuarioUpload: () => void;
    handleProntuarioFileChange: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
    handleExportXLS: () => Promise<void>;
    handleNav: (direction: 'prev' | 'next') => void;
    handleToday: () => void;
    triggerDatePicker: () => void;
    openFicha: (url: string | null) => void;

    // ── Helpers de Formatação ─────────────────────────────────────────────────
    formatDateDisplay: (dateString: string) => string;
    formatDateShort: (dateString: string) => string;
    examesListExport: typeof EXAMES_LIST_EXPORT;
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

export function useAgenda(): UseAgendaReturn {
    // ── Estado Principal ──────────────────────────────────────────────────────
    const [appointments, setAppointments] = useState<AgendamentoComProntuarios[]>([]);
    const [loading, setLoading] = useState(true);

    // Data e modo de visualização
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [viewMode, setViewMode] = useState<ViewMode>('day');
    const [showPendingOnly, setShowPendingOnly] = useState(false);

    // Busca por nome (com debounce)
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // ── Estado de Export ──────────────────────────────────────────────────────
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportStartDate, setExportStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [isExporting, setIsExporting] = useState(false);
    const [includeAbsent, setIncludeAbsent] = useState(true);

    // ── Estado de Upload ──────────────────────────────────────────────────────
    const [uploadingAsoId, setUploadingAsoId] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadModalAppointmentId, setUploadModalAppointmentId] = useState<number | null>(null);
    const [showProcedureListModal, setShowProcedureListModal] = useState(false);

    // ── Refs de File Inputs ───────────────────────────────────────────────────
    const fileInputRef = useRef<HTMLInputElement>(null);
    const esocFileInputRef = useRef<HTMLInputElement>(null);
    const prontuarioFileInputRef = useRef<HTMLInputElement>(null);
    const dateInputRef = useRef<HTMLInputElement>(null);

    // ─── Calcula o intervalo de datas baseado no modo de visualização ─────────
    /**
     * Retorna { start, end } em YYYY-MM-DD baseado no selectedDate e no viewMode.
     * - 'day'   → start = end = selectedDate
     * - 'week'  → Domingo ao Sábado da semana que contém a data
     * - 'month' → Primeiro e último dia do mês da data selecionada
     */
    const getDateRange = useCallback(() => {
        const date = new Date(selectedDate + 'T00:00:00');
        let start = selectedDate;
        let end = selectedDate;

        if (viewMode === 'week') {
            // Calcula Domingo a Sábado da semana atual
            const day = date.getDay(); // 0 (Dom) a 6 (Sab)
            const sunday = new Date(date);
            sunday.setDate(date.getDate() - day);
            const saturday = new Date(sunday);
            saturday.setDate(sunday.getDate() + 6);

            start = sunday.toISOString().split('T')[0];
            end = saturday.toISOString().split('T')[0];
        } else if (viewMode === 'month') {
            // Primeiro e último dia do mês
            const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
            const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);

            start = firstDay.toISOString().split('T')[0];
            end = lastDay.toISOString().split('T')[0];
        }

        return { start, end };
    }, [selectedDate, viewMode]);

    // ─── Busca Principal da Agenda ────────────────────────────────────────────
    /**
     * Busca os agendamentos do período selecionado via agendaService.
     * Ignorada caso searchTerm esteja preenchido (a busca por nome tem prioridade).
     */
    const fetchAgenda = useCallback(async () => {
        if (searchTerm.trim()) return; // Não busca por data se há um searchTerm ativo

        setLoading(true);
        const { start, end } = getDateRange();

        const { data, error } = await fetchAppointmentsByDateRange({ start, end, showPendingOnly });

        if (error) {
            console.error('[useAgenda] Erro ao buscar agenda:', JSON.stringify(error, null, 2));
        } else {
            setAppointments(data as unknown as AgendamentoComProntuarios[]);
        }
        setLoading(false);
    }, [searchTerm, getDateRange, showPendingOnly]);

    // ─── Busca por Nome (Full Text) ───────────────────────────────────────────
    /**
     * Busca agendamentos cujo colaborador tenha nome similar ao searchTerm.
     * Usa ILIKE no serviço e limita a 50 resultados.
     */
    const performSearch = useCallback(async () => {
        setLoading(true);
        setIsSearching(true);

        const { data, error } = await searchAppointmentsByName(searchTerm.trim());

        if (error) {
            console.error('[useAgenda] Erro na busca:', error);
        } else {
            setAppointments(data as unknown as AgendamentoComProntuarios[]);
        }
        setLoading(false);
    }, [searchTerm]);

    // ── Effect: Debounce de fetch com 500ms ───────────────────────────────────
    /**
     * Dispara fetchAgenda ou performSearch com debounce de 500ms.
     * Reexecuta sempre que searchTerm, selectedDate, viewMode ou showPendingOnly mudar.
     */
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm.trim()) {
                performSearch();
            } else {
                setIsSearching(false);
                fetchAgenda();
            }
        }, 500);

        return () => clearTimeout(timeoutId); // Cancela o timeout anterior a cada mudança
    }, [selectedDate, searchTerm, viewMode, showPendingOnly]);

    // ─── Toggle de Presença ───────────────────────────────────────────────────
    /**
     * Alterna o status de comparecimento de um paciente e, se confirmado,
     * dispara a geração de receita financeira + atualização de metas de gerência.
     *
     * Fluxo:
     *  1. Atualização otimista no estado local (resposta imediata na UI)
     *  2. updateAttendanceStatus() no service (persiste no Supabase)
     *  3. Se compareceu=true e tem unidade → calcula e insere financeiro
     *  4. Se qualquer erro → reverte o estado local para o valor original
     */
    const toggleAttendance = useCallback(async (id: number, currentStatus: boolean | null) => {
        const originalItem = appointments.find(a => a.id === id);
        if (!originalItem) return;

        const newStatus = !currentStatus; // Toggle: null/false → true, true → false

        // Formata o horário de chegada (HH:MM:SS) ou null ao desmarcar
        const now = new Date();
        const pad = (n: number) => n.toString().padStart(2, '0');
        const timeString = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
        const chegadaTime = newStatus ? timeString : null;

        // 1. Atualização otimista no estado React (feedback imediato)
        setAppointments(prev =>
            prev.map(a => a.id === id ? { ...a, compareceu: newStatus, chegou_em: chegadaTime } : a)
        );

        try {
            // 2. Persiste no Supabase via service
            const { error } = await updateAttendanceStatus(id, newStatus, chegadaTime);
            if (error) throw error;

            // 3. Lança receita financeira apenas ao confirmar comparecimento (newStatus = true)
            //    e se o agendamento tiver uma unidade associada
            if (newStatus && originalItem.unidade) {
                await handleFinancialOnAttendance(originalItem);
            }
        } catch (error: any) {
            console.error('[useAgenda] Erro ao atualizar status:', JSON.stringify(error, null, 2));
            // 4. Reverte para o estado original em caso de erro (rollback)
            setAppointments(prev =>
                prev.map(a => a.id === id
                    ? { ...a, compareceu: originalItem.compareceu, chegou_em: originalItem.chegou_em }
                    : a
                )
            );
            alert(`Erro ao atualizar status: ${error.message}`);
        }
    }, [appointments]);

    /**
     * Lógica financeira ao registrar comparecimento.
     * Calcula o valor do atendimento com base nos exames (preco_exames) e eSOC,
     * insere em financeiro_receitas e atualiza gerencia_meta.
     * Extraída de toggleAttendance para legibilidade.
     */
    const handleFinancialOnAttendance = useCallback(async (originalItem: AgendamentoComProntuarios) => {
        if (!originalItem.unidade) return;

        // Busca o empresaId da unidade do paciente
        const { data: unitData } = await fetchUnitEmpresaId(originalItem.unidade);
        if (!unitData?.empresaid) return;

        let totalCalculado = 0;
        let statusFinanceiro = 'Pendente';
        let valorEsocCalculado = 0;
        const gerenciaTotals: Record<number, number> = {}; // Acumulador por gerência

        // ── 1. Cálculo do eSoc ────────────────────────────────────────────────
        const { data: clientData } = await fetchClientFinancialData(unitData.empresaid);
        if (clientData?.envia_esoc) {
            valorEsocCalculado = Number(clientData.valor_esoc || 0) * 2; // Regra de negócio: multiplica por 2
            if (valorEsocCalculado > 0) {
                gerenciaTotals[1] = (gerenciaTotals[1] || 0) + valorEsocCalculado; // eSoc → Gerência 1
            }
        }

        // ── 2. Lógica Prefeitura/Estado ───────────────────────────────────────
        const isPrefeitura = originalItem.unidades?.nome_unidade === 'Prefeitura/ Estado';
        if (isPrefeitura && originalItem.valor && Number(originalItem.valor) > 0) {
            gerenciaTotals[20] = (gerenciaTotals[20] || 0) + Number(originalItem.valor);
            totalCalculado = Number(originalItem.valor);
            statusFinanceiro = 'pago';
        }

        // ── 3. Cálculo por tabela de preços de exames ─────────────────────────
        if (originalItem.exames_snapshot && originalItem.exames_snapshot.length > 0) {
            const { data: precos } = await fetchExamPrices(unitData.empresaid);

            if (precos && precos.length > 0) {
                originalItem.exames_snapshot.forEach(exameNome => {
                    // Encontra o preço do exame na tabela (case-insensitive)
                    const p = precos.find((price: any) =>
                        price.nome && price.nome.toLowerCase().trim() === exameNome.toLowerCase().trim()
                    );
                    if (p?.preco) {
                        const valExame = Number(p.preco);
                        totalCalculado += valExame;

                        // Mapeamento de exame → ID de gerência para distribuição de meta
                        const lowerName = exameNome.toLowerCase();
                        let gerenciaId = 0;

                        if (lowerName.includes('avaliação clínica') || lowerName.includes('avaliacao clinica')) gerenciaId = 25;
                        else if (lowerName.includes('audiometria')) gerenciaId = 12;
                        else if (lowerName.includes('raio-x') || lowerName.includes('raio x')) gerenciaId = 13;
                        else if (lowerName.includes('eletrocardiograma')) gerenciaId = 15;
                        else if (lowerName.includes('eletroencefalograma')) gerenciaId = 16;
                        else if (lowerName.includes('acuidade visual')) gerenciaId = 17;
                        else if (lowerName.includes('psicossocial') || lowerName.includes('psicológica')) gerenciaId = 18;
                        else if (lowerName.includes('toxicológico')) gerenciaId = 19;
                        else if (lowerName.includes('espirometria')) gerenciaId = 21;
                        else {
                            // Exames de sangue, urina e fezes → Gerência 14 (Coleta)
                            const bloodKeywords = [
                                'hemograma', 'glicemia', 'sanguíneo', 'colesterol', 'gama gt', 'tgo', 'tgp',
                                'ácido', 'creatinina', 'ferro', 'manganês', 'reticulócitos', 'triglicerídeos',
                                'anti ', 'chumbo', 'carboxihemoglobina', 'eas', 'epf', 'coprocultura', 'acetona'
                            ];
                            if (bloodKeywords.some(k => lowerName.includes(k))) gerenciaId = 14;
                        }

                        if (gerenciaId > 0) {
                            gerenciaTotals[gerenciaId] = (gerenciaTotals[gerenciaId] || 0) + valExame;
                        }
                    }
                });
            }
        }

        // ── 4. Fallback: valor manual (avulso) ────────────────────────────────
        if (totalCalculado === 0 && originalItem.valor && Number(originalItem.valor) > 0) {
            totalCalculado = Number(originalItem.valor);
            statusFinanceiro = 'pago';
        }

        const valorTotalSomado = totalCalculado + valorEsocCalculado;

        // ── 5. Parse defensivo do exames_snapshot ────────────────────────────
        // O Supabase às vezes retorna o campo jsonb como string JSON.
        // Este parse garante que sempre inserimos um array real.
        let examesParaInserir: string[] = [];
        const rawSnapshot = originalItem.exames_snapshot;
        if (Array.isArray(rawSnapshot)) {
            examesParaInserir = rawSnapshot;
        } else if (typeof (rawSnapshot as unknown) === 'string' && (rawSnapshot as unknown as string).trim().startsWith('[')) {
            try {
                const parsed = JSON.parse(rawSnapshot as unknown as string);
                examesParaInserir = Array.isArray(parsed) ? parsed : [];
            } catch (_e) {
                examesParaInserir = [];
            }
        }

        // ── 6. Insere a receita financeira ────────────────────────────────────
        await insertFinancialRevenue({
            contratante: unitData.empresaid,
            unidade_contratante: originalItem.unidade,
            valor_med: totalCalculado,
            valor_total: valorTotalSomado,
            valor_esoc: valorEsocCalculado,
            status: statusFinanceiro,
            data_executada: new Date().toISOString(),
            data_projetada: new Date(originalItem.data_atendimento).toISOString(),
            descricao: `Atendimento - ${originalItem.colaboradores?.nome || 'Desconhecido'}`,
            empresa_resp: 'Gama medicina',
            exames_snapshot: examesParaInserir,
        });

        // ── 7. Atualiza as metas de gerência ──────────────────────────────────
        const date = new Date();
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        lastDay.setHours(23, 59, 59, 999);
        const lastDayISO = lastDay.toISOString();

        // Distribui o valor para cada gerência acumulada
        for (const [gId, amount] of Object.entries(gerenciaTotals)) {
            await upsertGerenciaMeta(Number(gId), amount, firstDay, lastDayISO);
        }
    }, []);

    // ─── Toggle ASO ─────────────────────────────────────────────────────────
    /**
     * Alterna o status do ASO (feito/pendente) com atualização otimista.
     * Reverte em caso de erro.
     */
    const toggleAso = useCallback(async (id: number, currentAsoFeito: boolean | undefined) => {
        const originalItem = appointments.find(a => a.id === id);
        if (!originalItem) return;
        const newStatus = !currentAsoFeito;

        setAppointments(prev => prev.map(a => a.id === id ? { ...a, aso_feito: newStatus } : a));

        try {
            const { error } = await updateAsoStatus(id, newStatus);
            if (error) throw error;
        } catch (error: any) {
            // Reverte o toggle se falhou no banco
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, aso_feito: originalItem.aso_feito } : a));
        }
    }, [appointments]);

    // ─── Atualização de Data de Liberação do ASO ──────────────────────────────
    /**
     * Salva a data de liberação do ASO com atualização otimista e rollback em erro.
     */
    const handleUpdateAso = useCallback(async (id: number, newDate: string) => {
        const originalItem = appointments.find(a => a.id === id);
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, aso_liberado: newDate || null } : a));

        try {
            const { error } = await updateAsoLiberado(id, newDate);
            if (error) throw error;
        } catch (error: any) {
            if (originalItem) {
                setAppointments(prev => prev.map(a => a.id === id ? { ...a, aso_liberado: originalItem.aso_liberado } : a));
            }
        }
    }, [appointments]);

    // ─── Abrir Modal de Procedimentos ────────────────────────────────────────
    /** Define o agendamento selecionado e exibe o modal de listagem de prontuários. */
    const handleOpenProcedures = useCallback((apt: AgendamentoComProntuarios) => {
        setUploadModalAppointmentId(apt.id);
        setShowProcedureListModal(true);
    }, []);

    const openFicha = useCallback((url: string | null) => {
        if (url) window.open(url, '_blank');
        else alert('Ficha não disponível.');
    }, []);

    // ─── Upload de ASO ───────────────────────────────────────────────────────

    /** Ativa o input de arquivo para upload de ASO. */
    const triggerAsoUpload = useCallback((id: number) => {
        setUploadingAsoId(id);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
            fileInputRef.current.click();
        }
    }, []);

    /** Processa o arquivo selecionado e faz upload do ASO via service. */
    const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !uploadingAsoId) return;
        setIsUploading(true);
        try {
            const { publicUrl, error } = await uploadAsoFile(uploadingAsoId, file);
            if (error) throw error;
            // Atualiza o estado local com o novo link do ASO
            setAppointments(prev => prev.map(a =>
                a.id === uploadingAsoId ? { ...a, aso_url: publicUrl! } : a
            ));
            alert('ASO enviado com sucesso!');
        } catch (err: any) {
            alert(`Erro ao enviar ASO: ${err.message}`);
        } finally {
            setIsUploading(false);
            setUploadingAsoId(null);
        }
    }, [uploadingAsoId]);

    // ─── Upload de e-Social ──────────────────────────────────────────────────

    const triggerEsocUpload = useCallback(() => {
        if (esocFileInputRef.current) {
            esocFileInputRef.current.value = '';
            esocFileInputRef.current.click();
        }
    }, []);

    const handleEsocFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !uploadModalAppointmentId) return;
        setIsUploading(true);
        try {
            const { uploadCount, error } = await uploadEsocFiles(uploadModalAppointmentId, files);
            if (error) throw error;
            alert(`${uploadCount} arquivo(s) do E-social enviado(s) com sucesso!`);
            if (!showProcedureListModal) setUploadModalAppointmentId(null);
        } catch (err: any) {
            alert(`Erro ao enviar arquivos: ${err.message}`);
        } finally {
            setIsUploading(false);
            if (esocFileInputRef.current) esocFileInputRef.current.value = '';
        }
    }, [uploadModalAppointmentId, showProcedureListModal]);

    // ─── Upload de Prontuários ────────────────────────────────────────────────

    const triggerProntuarioUpload = useCallback(() => {
        if (prontuarioFileInputRef.current) {
            prontuarioFileInputRef.current.value = '';
            prontuarioFileInputRef.current.click();
        }
    }, []);

    const handleProntuarioFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0 || !uploadModalAppointmentId) return;
        setIsUploading(true);
        try {
            const { uploadCount, insertedFiles, error } = await uploadProntuarioFiles(uploadModalAppointmentId, files);
            if (error) throw error;
            alert(`${uploadCount} prontuário(s) enviado(s) com sucesso!`);
            // Atualiza o estado local com os novos prontuários inseridos
            if (insertedFiles.length > 0) {
                setAppointments(prev => prev.map(a =>
                    a.id === uploadModalAppointmentId
                        ? { ...a, prontuarios: [...(a.prontuarios || []), ...insertedFiles] }
                        : a
                ));
            }
            if (!showProcedureListModal) setUploadModalAppointmentId(null);
        } catch (err: any) {
            alert(`Erro ao enviar arquivos: ${err.message}`);
        } finally {
            setIsUploading(false);
            if (prontuarioFileInputRef.current) prontuarioFileInputRef.current.value = '';
        }
    }, [uploadModalAppointmentId, showProcedureListModal]);

    // ─── Exportação XLS ──────────────────────────────────────────────────────
    /**
     * Gera e baixa um arquivo .xls com os agendamentos do período selecionado.
     * Usa busca paginada (batches de 500) via agendaService.fetchExportData.
     * Formata os dados brutos em HTML/Excel e dispara o download.
     */
    const handleExportXLS = useCallback(async () => {
        setIsExporting(true);
        try {
            const { data: items, error } = await fetchExportData(exportStartDate, exportEndDate, includeAbsent);
            if (error) throw error;
            if (items.length === 0) { alert('Nenhum dado encontrado no período selecionado.'); return; }

            // Template HTML que o Excel interpreta como XLS
            const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
        <x:Name>Agendamentos</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions>
        </x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head><body>`;

            // Estilos das células de cabeçalho
            const styleGreen = 'style="background-color:#70AD47; color:white; font-weight:bold; text-align:center;"';
            const styleBlue = 'style="background-color:#4472C4; color:white; font-weight:bold; text-align:center;"';

            // Monta o cabeçalho da tabela com colunas fixas (verde) e dinâmicas por exame (azul)
            let table = '<table border="1"><thead><tr>';
            table += `<th ${styleGreen}>Nome</th><th ${styleGreen}>Data Atendimento</th><th ${styleGreen}>Status</th>`;
            table += `<th ${styleGreen}>Cargo</th><th ${styleGreen}>Setor</th><th ${styleGreen}>Tipo de Exame</th>`;
            table += `<th ${styleGreen}>Unidade</th><th ${styleGreen}>Valor</th><th ${styleGreen}>Data Nascimento</th>`;
            table += `<th ${styleGreen}>CPF</th><th ${styleGreen}>Data de liberação</th><th ${styleGreen}>Observações</th>`;
            EXAMES_LIST_EXPORT.forEach(exame => { table += `<th ${styleBlue}>${exame.nome}</th>`; });
            table += '</tr></thead><tbody>';

            // Preenche os dados linha a linha
            items.forEach((item: any) => {
                const nome = item.colaboradores?.nome || 'N/A';
                const dataAtendimento = item.data_atendimento ? new Date(item.data_atendimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
                const cargo = item.colaboradores?.cargos?.nome || 'N/A';
                const setor = item.colaboradores?.sector || 'N/A';
                const unidade = item.unidades?.nome_unidade || 'Avulso';
                const dtNasc = item.colaboradores?.data_nascimento ? new Date(item.colaboradores.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
                const cpf = item.colaboradores?.cpf || '';
                const dtLib = item.aso_liberado ? new Date(item.aso_liberado).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
                const observacoes = item.obs_agendamento || '';
                const tipo = item.tipo || '';
                const valor = item.valor ? item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
                let statusText = 'Pendente';
                if (item.compareceu === true) statusText = 'Compareceu';
                else if (item.compareceu === false) statusText = 'Faltou';

                table += `<tr><td>${nome}</td><td>${dataAtendimento}</td><td>${statusText}</td>`;
                table += `<td>${cargo}</td><td>${setor}</td><td>${tipo}</td><td>${unidade}</td><td>${valor}</td>`;
                table += `<td>${dtNasc}</td>`;
                // mso-number-format:'\\@' força texto no CPF para preservar zeros à esquerda
                table += `<td style="mso-number-format:'\\@'">${cpf}</td>`;
                table += `<td>${dtLib}</td><td>${observacoes}</td>`;
                EXAMES_LIST_EXPORT.forEach(exame => {
                    const hasExam = item.exames_snapshot && item.exames_snapshot.includes(exame.nome);
                    table += `<td style="text-align:center;">${hasExam ? 'X' : ''}</td>`;
                });
                table += '</tr>';
            });

            table += '</tbody></table></body></html>';

            // Cria o Blob e dispara o download automático
            const blob = new Blob([excelTemplate + table], { type: 'application/vnd.ms-excel' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `agendamentos_${exportStartDate}_${exportEndDate}.xls`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);

            setShowExportModal(false);
        } catch (err: any) {
            alert(`Erro na exportação: ${err.message}`);
        } finally {
            setIsExporting(false);
        }
    }, [exportStartDate, exportEndDate, includeAbsent]);

    // ─── Navegação por Data ───────────────────────────────────────────────────
    /**
     * Avança ou retroage a data selecionada de acordo com o modo de visualização.
     * Também limpa o searchTerm para não manter uma busca ativa ao navegar.
     */
    const handleNav = useCallback((direction: 'prev' | 'next') => {
        const date = new Date(selectedDate + 'T00:00:00');
        const modifier = direction === 'next' ? 1 : -1;

        if (viewMode === 'day') date.setDate(date.getDate() + modifier);
        else if (viewMode === 'week') date.setDate(date.getDate() + modifier * 7);
        else if (viewMode === 'month') date.setMonth(date.getMonth() + modifier);

        setSelectedDate(date.toISOString().split('T')[0]);
        setSearchTerm('');
    }, [selectedDate, viewMode]);

    /** Volta para hoje (data atual). */
    const handleToday = useCallback(() => {
        setSelectedDate(new Date().toISOString().split('T')[0]);
        setSearchTerm('');
    }, []);

    /**
     * Abre o seletor de data nativo do browser.
     * Usa showPicker() quando disponível, com fallback para .click().
     */
    const triggerDatePicker = useCallback(() => {
        if (dateInputRef.current) {
            if ('showPicker' in (dateInputRef.current as any)) {
                try { (dateInputRef.current as any).showPicker(); } catch (e) { dateInputRef.current.click(); }
            } else {
                dateInputRef.current.click();
            }
        }
    }, []);

    // ─── Helpers de Formatação ────────────────────────────────────────────────
    /**
     * Formata a data selecionada para exibição no header da Agenda.
     * - Modo 'month' → "março de 2026"
     * - Outros → "terça-feira, 25 de março"
     */
    const formatDateDisplay = useCallback((dateString: string) => {
        const date = new Date(dateString + 'T00:00:00');
        if (viewMode === 'month') return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    }, [viewMode]);

    /** Formata uma data YYYY-MM-DD para DD/MM/YYYY. */
    const formatDateShort = useCallback((dateString: string) => {
        if (!dateString) return '';
        return new Date(dateString + 'T00:00:00').toLocaleDateString('pt-BR');
    }, []);

    // ─── Cálculo de "isToday" ─────────────────────────────────────────────────
    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    // ─── Retorno do Hook ──────────────────────────────────────────────────────
    return {
        appointments, loading, selectedDate, viewMode, showPendingOnly,
        searchTerm, isSearching, isToday,
        showExportModal, exportStartDate, exportEndDate, isExporting, includeAbsent,
        isUploading, uploadingAsoId, uploadModalAppointmentId, showProcedureListModal,
        fileInputRef, esocFileInputRef, prontuarioFileInputRef, dateInputRef,
        setSelectedDate, setViewMode, setShowPendingOnly, setSearchTerm,
        setShowExportModal, setExportStartDate, setExportEndDate, setIncludeAbsent,
        setUploadModalAppointmentId, setShowProcedureListModal, setIsSearching,
        toggleAttendance, toggleAso, handleUpdateAso,
        handleOpenProcedures, openFicha,
        triggerAsoUpload, handleFileChange,
        triggerEsocUpload, handleEsocFileChange,
        triggerProntuarioUpload, handleProntuarioFileChange,
        handleExportXLS, handleNav, handleToday, triggerDatePicker,
        formatDateDisplay, formatDateShort,
        examesListExport: EXAMES_LIST_EXPORT,
    };
}
