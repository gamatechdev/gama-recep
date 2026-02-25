/**
 * AgendaList.tsx
 * ---------------
 * Componente responsável por renderizar a lista de agendamentos da Agenda.
 * Exibe um card por agendamento com:
 *  - Avatar com inicial do nome
 *  - Nome, empresa, cargo, tipo, data, observações e valor (Prefeitura)
 *  - Botões de toggle ASO, toggle presença, data de liberação, upload e visualização de ASO
 *  - Botão de prontuários e link para a ficha clínica
 *
 * Não possui lógica própria — recebe tudo via props do useAgenda.
 */

import React from 'react';
import { AgendamentoComProntuarios } from '../../hooks/useAgenda';
import { Agendamento } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AgendaListProps {
    appointments: AgendamentoComProntuarios[];
    loading: boolean;
    isSearching: boolean;
    showPendingOnly: boolean;
    searchTerm: string;
    isUploading: boolean;
    uploadingAsoId: number | null;

    // ── Handlers recebidos do useAgenda ───────────────────────────────────────
    onEditAppointment: (apt: Agendamento) => void;
    onGenerateAso?: (apt: Agendamento) => void;
    onNewAppointment: () => void;
    toggleAttendance: (id: number, currentStatus: boolean | null) => Promise<void>;
    toggleAso: (id: number, currentAsoFeito: boolean | undefined) => Promise<void>;
    handleUpdateAso: (id: number, newDate: string) => Promise<void>;
    handleOpenProcedures: (apt: AgendamentoComProntuarios) => void;
    triggerAsoUpload: (id: number) => void;
    setUploadModalAppointmentId: (id: number | null) => void;
    openFicha: (url: string | null) => void;

    // ── Helper de formatação ──────────────────────────────────────────────────
    formatDateShort: (dateString: string) => string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const AgendaList: React.FC<AgendaListProps> = ({
    appointments, loading, isSearching, showPendingOnly, searchTerm,
    isUploading, uploadingAsoId,
    onEditAppointment, onGenerateAso, onNewAppointment,
    toggleAttendance, toggleAso, handleUpdateAso,
    handleOpenProcedures, triggerAsoUpload, setUploadModalAppointmentId,
    openFicha, formatDateShort,
}) => {
    // ── Estado de Carregamento ────────────────────────────────────────────────
    if (loading) {
        return (
            <div className="w-full h-64 flex flex-col items-center justify-center text-ios-subtext">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ios-primary mb-2" />
                {isSearching ? 'Pesquisando...' : 'Carregando agenda...'}
            </div>
        );
    }

    // ── Estado Vazio ────────────────────────────────────────────────────────
    if (appointments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-24 bg-white rounded-ios border border-gray-100 text-center shadow-sm animate-in fade-in zoom-in duration-300">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner text-gray-300">
                    {isSearching ? '🔍' : '📅'}
                </div>
                <h3 className="text-xl font-bold text-ios-text">
                    {isSearching ? 'Nenhum resultado' : 'Tudo livre por aqui'}
                </h3>
                <p className="text-ios-subtext mt-2">
                    {isSearching
                        ? `Não encontramos ninguém com "${searchTerm}"`
                        : showPendingOnly
                            ? 'Todos os pacientes já foram atendidos!'
                            : 'Nenhum agendamento encontrado para este período.'}
                </p>
                {!isSearching && (
                    <button onClick={onNewAppointment} className="mt-6 text-ios-primary font-semibold hover:underline">
                        Agendar agora
                    </button>
                )}
            </div>
        );
    }

    // ── Lista de Cards ─────────────────────────────────────────────────────
    return (
        <div className="grid gap-4 animate-in slide-in-from-bottom-4 duration-500">
            {appointments.map((apt) => (
                <div
                    key={apt.id}
                    className={`group bg-white hover:bg-ios-cardHover p-5 rounded-ios-sm shadow-sm hover:shadow-md border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${apt.prioridade ? 'border-l-4 border-l-red-500 border-t-gray-100 border-r-gray-100 border-b-gray-100' : 'border-gray-100'}`}
                >
                    {/* ── Seção Esquerda: Informações do Paciente ─────────────── */}
                    <div className="flex items-center gap-5 flex-1 cursor-pointer" onClick={() => onEditAppointment(apt)} title="Clique para editar detalhes">
                        {/* Avatar: inicial do nome, cor indica comparecimento */}
                        <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-bold shadow-sm transition-colors ${apt.compareceu ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {apt.colaboradores?.nome?.charAt(0) || '?'}
                        </div>

                        <div>
                            {/* Nome + badges de prioridade e "agendado via sistema" */}
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg text-ios-text leading-tight group-hover:text-ios-primary transition-colors">
                                    {apt.colaboradores?.nome || 'Desconhecido'}
                                </h4>
                                {apt.prioridade && (
                                    <span className="bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-red-100">
                                        Prioridade
                                    </span>
                                )}
                                {apt.enviado_empresa && (
                                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                        Agendado via sistema
                                    </span>
                                )}
                            </div>

                            {/* Badges de data, empresa, cargo e tipo */}
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 flex items-center gap-1">
                                    📅 {formatDateShort(apt.data_atendimento)}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-ios-primary/10 text-ios-primary">
                                    {apt.unidades?.nome_unidade || 'N/A'}
                                </span>
                                {apt.colaboradores?.cargos?.nome && (
                                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 truncate max-w-[150px]">
                                        {apt.colaboradores.cargos.nome}
                                    </span>
                                )}
                                <span className="hidden md:inline text-xs text-ios-subtext">•</span>
                                <span className="text-xs text-ios-subtext font-medium">{apt.tipo || 'Geral'}</span>
                            </div>

                            {/* Chips de observação e valor (Prefeitura/Estado) */}
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                {apt.obs_agendamento && (
                                    <div className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100 max-w-full md:max-w-xs truncate" title={apt.obs_agendamento}>
                                        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <span className="truncate font-medium">{apt.obs_agendamento}</span>
                                    </div>
                                )}
                                {apt.unidades?.nome_unidade === 'Prefeitura/ Estado' && apt.valor && (
                                    <div className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                        <span className="font-bold">R$ {Number(apt.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        {apt.metodo_pagamento && (
                                            <span className="text-blue-500 border-l border-blue-200 pl-1 ml-1 text-[10px] uppercase font-bold">{apt.metodo_pagamento}</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Seção Direita: Ações e Controles ───────────────────── */}
                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 border-t md:border-t-0 border-gray-50 pt-4 md:pt-0 flex-wrap">

                        {/* Toggle ASO (feito/pendente) */}
                        <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">ASO</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleAso(apt.id, apt.aso_feito); }}
                                className={`w-8 h-8 rounded-full shadow-inner transition-all duration-500 relative flex items-center justify-center ${apt.aso_feito ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200'} hover:scale-105 active:scale-95`}
                                title={apt.aso_feito ? 'ASO Feito' : 'ASO Pendente'}
                            >
                                {apt.aso_feito
                                    ? <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    : <div className="w-2 h-2 bg-white rounded-full opacity-50" />
                                }
                            </button>
                        </div>

                        {/* Toggle Presença (compareceu) */}
                        <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">Status</span>
                            <button
                                onClick={(e) => { e.stopPropagation(); toggleAttendance(apt.id, apt.compareceu); }}
                                className={`w-8 h-8 rounded-full shadow-inner transition-all duration-500 relative flex items-center justify-center ${apt.compareceu ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200'} hover:scale-105 active:scale-95`}
                                title={apt.compareceu ? 'Presente' : 'Ausente'}
                            >
                                {apt.compareceu
                                    ? <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                    : <div className="w-2 h-2 bg-white rounded-full opacity-50" />
                                }
                            </button>
                        </div>

                        <div className="hidden md:block h-10 w-px bg-gray-100" />

                        {/* Data de liberação do ASO + botões de upload */}
                        <div className="flex flex-col items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                            <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">Liberado em</span>
                            <div className="flex items-center gap-2 relative">
                                {/* Input de data nativo para selecionar a data de liberação */}
                                <input
                                    type="date"
                                    value={apt.aso_liberado || ''}
                                    onChange={(e) => handleUpdateAso(apt.id, e.target.value)}
                                    className={`h-8 w-28 text-xs font-bold rounded-lg border px-2 outline-none transition-all ${apt.aso_liberado ? 'bg-white border-gray-200 text-gray-800 shadow-sm' : 'bg-gray-50 border-transparent text-gray-400'}`}
                                />

                                {/* Botão de seleção de documento (abre o modal de seleção) */}
                                <button
                                    onClick={() => setUploadModalAppointmentId(apt.id)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${apt.aso_url ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                    title={apt.aso_url ? 'Substituir ASO' : 'Enviar ASO'}
                                    disabled={isUploading && uploadingAsoId === apt.id}
                                >
                                    {isUploading && uploadingAsoId === apt.id
                                        ? <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
                                        : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                    }
                                </button>

                                {/* Botão de prontuários e exames */}
                                <button
                                    onClick={() => handleOpenProcedures(apt)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${apt.prontuarios && apt.prontuarios.length > 0 ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'}`}
                                    title="Prontuários e Exames"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </button>

                                {/* Link para visualizar o ASO (quando disponível) */}
                                {apt.aso_url && (
                                    <button
                                        onClick={() => window.open(apt.aso_url || '', '_blank')}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 transition-all border border-green-100"
                                        title="Visualizar ASO"
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="hidden md:block h-10 w-px bg-gray-100" />

                        {/* Botão "Gerar ASO" (opcional — aparece se prop passada) */}
                        {onGenerateAso && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onGenerateAso(apt); }}
                                className="p-3 rounded-xl transition-all text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-100"
                                title="Gerar ASO"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                            </button>
                        )}

                        {/* Botão de ficha clínica (PDF) */}
                        <button
                            onClick={(e) => { e.stopPropagation(); openFicha(apt.ficha_url); }}
                            className={`p-3 rounded-xl transition-all ${apt.ficha_url ? 'text-ios-primary bg-ios-primary/5 hover:bg-ios-primary/10' : 'text-gray-300 cursor-not-allowed bg-gray-50'}`}
                            title={apt.ficha_url ? 'Abrir Ficha Clínica' : 'Ficha indisponível'}
                            disabled={!apt.ficha_url}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};

export default AgendaList;
