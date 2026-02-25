/**
 * AgendaHeader.tsx
 * -----------------
 * Componente de cabeçalho da tela de Agenda.
 * Responsável por exibir os controles de data, modo de visualização (dia/semana/mês),
 * filtro de pendentes, barra de pesquisa, botões de exportar e novo agendamento.
 *
 * Não possui lógica própria — recebe tudo via props do hook useAgenda.
 */

import React from 'react';
import { ViewMode } from '../../hooks/useAgenda';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AgendaHeaderProps {
    // ── Estado de data e visualização ────────────────────────────────────────
    viewMode: ViewMode;
    setViewMode: (mode: ViewMode) => void;
    selectedDate: string;
    setSelectedDate: (date: string) => void;
    isSearching: boolean;
    isToday: boolean;

    // ── Filtros ───────────────────────────────────────────────────────────────
    showPendingOnly: boolean;
    setShowPendingOnly: (val: boolean) => void;

    // ── Busca ─────────────────────────────────────────────────────────────────
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    setIsSearching: (val: boolean) => void;

    // ── Ações ─────────────────────────────────────────────────────────────────
    onNewAppointment: () => void;
    setShowExportModal: (val: boolean) => void;

    // ── Helpers ───────────────────────────────────────────────────────────────
    formatDateDisplay: (dateString: string) => string;
    handleNav: (direction: 'prev' | 'next') => void;
    handleToday: () => void;
    triggerDatePicker: () => void;
    dateInputRef: React.RefObject<HTMLInputElement>;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const AgendaHeader: React.FC<AgendaHeaderProps> = ({
    viewMode, setViewMode, selectedDate, setSelectedDate,
    isSearching, isToday,
    showPendingOnly, setShowPendingOnly,
    searchTerm, setSearchTerm, setIsSearching,
    onNewAppointment, setShowExportModal,
    formatDateDisplay, handleNav, handleToday, triggerDatePicker, dateInputRef,
}) => {
    return (
        <div className="flex flex-col gap-6">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">

                {/* ── Coluna Esquerda: Título + Controles de Data ───────────────── */}
                <div className="flex flex-col gap-4">
                    <h2 className="text-3xl font-bold text-ios-text tracking-tight">Agenda</h2>

                    {/* Controles de navegação por data (ocultados durante busca) */}
                    {!isSearching && (
                        <div className="flex flex-wrap items-center gap-4 animate-in fade-in">

                            {/* Seletor de modo: Dia / Semana / Mês */}
                            <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner">
                                {(['day', 'week', 'month'] as const).map((mode) => (
                                    <button
                                        key={mode}
                                        onClick={() => setViewMode(mode)}
                                        className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === mode ? 'bg-white text-ios-text shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                    >
                                        {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
                                    </button>
                                ))}
                            </div>

                            {/* Navegador de data com setas e clique no calendário */}
                            <div className="inline-flex items-center bg-white rounded-full p-1.5 shadow-sm border border-gray-100 gap-2">
                                {/* Seta para retroceder */}
                                <button onClick={() => handleNav('prev')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-ios-primary transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                    </svg>
                                </button>

                                {/* Exibição da data atual com input oculto para o calendário nativo */}
                                <div onClick={triggerDatePicker} className="relative group px-4 py-1.5 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors min-w-[140px] text-center">
                                    {/* Input nativo oculto — o clique é interceptado pelo div pai */}
                                    <input
                                        ref={dateInputRef}
                                        type="date"
                                        value={selectedDate}
                                        onChange={(e) => setSelectedDate(e.target.value)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer -z-10"
                                    />
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">
                                            {new Date(selectedDate + 'T00:00:00').getFullYear()}
                                        </p>
                                        <p className="text-sm font-bold text-ios-text capitalize whitespace-nowrap">
                                            {formatDateDisplay(selectedDate)}
                                        </p>
                                    </div>
                                </div>

                                {/* Seta para avançar */}
                                <button onClick={() => handleNav('next')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-ios-primary transition-colors">
                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                </button>
                            </div>

                            {/* Botão "Hoje" — visível apenas quando não está no dia atual */}
                            {!isToday && (
                                <button onClick={handleToday} className="text-sm font-medium text-ios-primary hover:underline">
                                    Hoje
                                </button>
                            )}
                        </div>
                    )}

                    {/* Badge de resultados de busca (substitui os controles de data) */}
                    {isSearching && (
                        <div className="flex items-center gap-2 h-14 animate-in fade-in">
                            <span className="text-lg font-semibold text-gray-400">Resultados da pesquisa</span>
                        </div>
                    )}
                </div>

                {/* ── Coluna Direita: Filtros + Busca + Botões ─────────────────── */}
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full xl:w-auto">

                    {/* Filtro Todos / Pendentes */}
                    <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner h-12">
                        <button
                            onClick={() => setShowPendingOnly(false)}
                            className={`h-full px-5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${!showPendingOnly ? 'bg-white text-ios-text shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Todos
                        </button>
                        <button
                            onClick={() => setShowPendingOnly(true)}
                            className={`h-full px-5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${showPendingOnly ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <span className={`w-2 h-2 rounded-full ${showPendingOnly ? 'bg-orange-500' : 'bg-gray-300'}`} />
                            Pendentes
                        </button>
                    </div>

                    {/* Campo de busca global por nome */}
                    <div className="relative group w-full lg:w-64 transition-all focus-within:w-full lg:focus-within:w-80">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400 group-focus-within:text-ios-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Pesquisar..."
                            className="w-full h-12 pl-10 pr-10 rounded-full bg-white border border-gray-100 focus:border-ios-primary focus:ring-4 focus:ring-ios-primary/10 outline-none transition-all shadow-sm placeholder-gray-400 text-sm font-medium"
                        />
                        {/* Botão para limpar a busca */}
                        {searchTerm && (
                            <button
                                onClick={() => { setSearchTerm(''); setIsSearching(false); }}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                            >
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Botões de ação */}
                    <div className="flex items-center gap-3">
                        {/* Exportar Excel → abre o modal de seleção de período */}
                        <button
                            onClick={() => setShowExportModal(true)}
                            className="bg-white text-ios-text border border-gray-200 hover:bg-gray-50 px-6 py-2.5 rounded-full shadow-sm transition-all font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Exportar Excel
                        </button>

                        {/* Novo Agendamento → delega para o orquestrador */}
                        <button
                            onClick={onNewAppointment}
                            className="bg-gradient-to-r from-ios-primary to-ios-secondary text-white px-6 py-2.5 rounded-full shadow-lg shadow-ios-primary/30 hover:shadow-ios-primary/50 transition-all font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transform whitespace-nowrap"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                            Novo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AgendaHeader;
