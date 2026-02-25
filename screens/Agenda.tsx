/**
 * Agenda.tsx (Orquestrador)
 * --------------------------
 * Tela principal da Agenda — atua exclusivamente como ORQUESTRADOR.
 *
 * Responsabilidade deste arquivo:
 *  1. Invocar o hook useAgenda para obter estado, handlers e formatadores
 *  2. Renderizar os hidden file inputs (necessários para os uploads)
 *  3. Renderizar os subcomponentes de UI (AgendaHeader, AgendaList)
 *  4. Gerenciar os modais de upload, prontuários e exportação XLS
 *
 * O que NÃO está mais neste arquivo:
 *  - Qualquer chamada ao supabaseClient           → agendaService.ts
 *  - Cálculos de receita, metas e preços           → useAgenda.ts
 *  - Fetch de agendamentos e debounce              → useAgenda.ts
 *  - Handlers de toggle, upload e navegação        → useAgenda.ts
 *  - JSX do cabeçalho (data, filtros, busca)       → AgendaHeader.tsx
 *  - JSX dos cards de agendamento                  → AgendaList.tsx
 */

import React from 'react';
import { Agendamento } from '../types';

// ─── Hook de Dados e Lógica ───────────────────────────────────────────────────
import { useAgenda } from '../hooks/useAgenda';

// ─── Subcomponentes de UI ─────────────────────────────────────────────────────
import AgendaHeader from '../components/agenda/AgendaHeader';
import AgendaList from '../components/agenda/AgendaList';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AgendaProps {
    onNewAppointment: () => void;
    onEditAppointment: (appointment: Agendamento) => void;
    onGenerateAso?: (appointment: Agendamento) => void;
}

// ─── Componente Orquestrador ──────────────────────────────────────────────────

const Agenda: React.FC<AgendaProps> = ({ onNewAppointment, onEditAppointment, onGenerateAso }) => {
    /**
     * Único ponto de acesso a dados e handlers desta tela.
     * O hook encapsula: estado, fetchs, toggles, uploads, exportação e formatação.
     */
    const agenda = useAgenda();

    return (
        <div className="space-y-6">

            {/*
       * Hidden File Inputs para os uploads de arquivo.
       * São mantidos aqui (no orquestrador) pois os refs são gerenciados pelo useAgenda
       * e precisam estar no DOM para que triggerAsoUpload(), triggerEsocUpload()
       * e triggerProntuarioUpload() funcionem corretamente.
       */}
            {/* Input para upload de ASO (PDF único) */}
            <input
                type="file"
                ref={agenda.fileInputRef}
                className="hidden"
                accept="application/pdf"
                onChange={agenda.handleFileChange}
            />
            {/* Input para upload de arquivos e-Social (múltiplos) */}
            <input
                type="file"
                ref={agenda.esocFileInputRef}
                className="hidden"
                multiple
                onChange={agenda.handleEsocFileChange}
            />
            {/* Input para upload de prontuários (múltiplos) */}
            <input
                type="file"
                ref={agenda.prontuarioFileInputRef}
                className="hidden"
                multiple
                onChange={agenda.handleProntuarioFileChange}
            />

            {/*
       * AgendaHeader: Cabeçalho da tela com controles de data, modo de view,
       * filtros (Todos/Pendentes), busca por nome e botões de ação.
       */}
            <AgendaHeader
                viewMode={agenda.viewMode}
                setViewMode={agenda.setViewMode}
                selectedDate={agenda.selectedDate}
                setSelectedDate={agenda.setSelectedDate}
                isSearching={agenda.isSearching}
                isToday={agenda.isToday}
                showPendingOnly={agenda.showPendingOnly}
                setShowPendingOnly={agenda.setShowPendingOnly}
                searchTerm={agenda.searchTerm}
                setSearchTerm={agenda.setSearchTerm}
                setIsSearching={agenda.setIsSearching}
                onNewAppointment={onNewAppointment}
                setShowExportModal={agenda.setShowExportModal}
                formatDateDisplay={agenda.formatDateDisplay}
                handleNav={agenda.handleNav}
                handleToday={agenda.handleToday}
                triggerDatePicker={agenda.triggerDatePicker}
                dateInputRef={agenda.dateInputRef}
            />

            {/*
       * AgendaList: Lista de cards de agendamentos.
       * Recebe os dados do hook e os handlers de ação (toggle, upload, edição).
       * Gerencia internamente os estados de loading e lista vazia.
       */}
            <AgendaList
                appointments={agenda.appointments}
                loading={agenda.loading}
                isSearching={agenda.isSearching}
                showPendingOnly={agenda.showPendingOnly}
                searchTerm={agenda.searchTerm}
                isUploading={agenda.isUploading}
                uploadingAsoId={agenda.uploadingAsoId}
                onEditAppointment={onEditAppointment}
                onGenerateAso={onGenerateAso}
                onNewAppointment={onNewAppointment}
                toggleAttendance={agenda.toggleAttendance}
                toggleAso={agenda.toggleAso}
                handleUpdateAso={agenda.handleUpdateAso}
                handleOpenProcedures={agenda.handleOpenProcedures}
                triggerAsoUpload={agenda.triggerAsoUpload}
                setUploadModalAppointmentId={agenda.setUploadModalAppointmentId}
                openFicha={agenda.openFicha}
                formatDateShort={agenda.formatDateShort}
            />

            {/* ── Modal de Seleção de Tipo de Documento ──────────────────────── */}
            {/*
       * Exibido ao clicar no ícone de upload de um agendamento.
       * Oferece 3 opções: ASO, Prontuário e e-Social.
       */}
            {agenda.uploadModalAppointmentId && !agenda.showProcedureListModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-ios p-8 max-w-3xl w-full shadow-2xl relative">
                        <button
                            onClick={() => agenda.setUploadModalAppointmentId(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <div className="text-center mb-8">
                            <h3 className="text-2xl font-bold text-gray-800">Enviar Documento</h3>
                            <p className="text-gray-500 mt-1">Selecione o tipo de documento para anexar ao agendamento.</p>
                        </div>

                        {/* 3 botões: ASO, Prontuário, e-Social */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* ASO */}
                            <button
                                onClick={() => { agenda.triggerAsoUpload(agenda.uploadModalAppointmentId!); agenda.setUploadModalAppointmentId(null); }}
                                className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 hover:border-blue-200 rounded-2xl transition-all group"
                            >
                                <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-blue-600">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <span className="font-bold text-blue-800 text-lg">Subir ASO</span>
                            </button>

                            {/* Prontuário */}
                            <button
                                onClick={agenda.triggerProntuarioUpload}
                                className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-gray-100 border-2 border-gray-100 hover:border-gray-200 rounded-2xl transition-all group"
                            >
                                <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-gray-600">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                                </div>
                                <span className="font-bold text-gray-700 text-lg">Prontuário</span>
                            </button>

                            {/* e-Social */}
                            <button
                                onClick={agenda.triggerEsocUpload}
                                className="flex flex-col items-center justify-center p-6 bg-green-50 hover:bg-green-100 border-2 border-green-100 hover:border-green-200 rounded-2xl transition-all group"
                            >
                                <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-green-600">
                                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                                </div>
                                <span className="font-bold text-green-800 text-lg">E-social</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal de Listagem de Prontuários ─────────────────────────────── */}
            {/*
       * Exibido ao clicar no botão de prontuários de um agendamento.
       * Lista os arquivos já anexados e permite adicionar novos.
       */}
            {agenda.showProcedureListModal && agenda.uploadModalAppointmentId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-ios p-6 max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[80vh]">
                        <button
                            onClick={() => { agenda.setShowProcedureListModal(false); agenda.setUploadModalAppointmentId(null); }}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                        </button>

                        <h3 className="text-xl font-bold text-gray-800 mb-4 px-2">Prontuários / Exames</h3>

                        {/* Lista de prontuários existentes */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            {agenda.appointments.find(a => a.id === agenda.uploadModalAppointmentId)?.prontuarios?.length ? (
                                <div className="space-y-3">
                                    {agenda.appointments.find(a => a.id === agenda.uploadModalAppointmentId)?.prontuarios?.map((file) => (
                                        <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                                </div>
                                                <div>
                                                    <p className="font-bold text-gray-800">{file.tipo}</p>
                                                    <p className="text-xs text-gray-400">{new Date(file.created_at).toLocaleString('pt-BR')}</p>
                                                </div>
                                            </div>
                                            <button onClick={() => window.open(file.url, '_blank')} className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors">
                                                Visualizar
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10 text-gray-400">
                                    <p>Nenhum procedimento anexado.</p>
                                </div>
                            )}
                        </div>

                        {/* Botão de adicionar arquivos */}
                        <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                            <button onClick={agenda.triggerProntuarioUpload} className="flex items-center gap-2 bg-ios-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-ios-primary/30 hover:bg-ios-secondary transition-all">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                                Adicionar Arquivos
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Modal de Exportação XLS ───────────────────────────────────────── */}
            {/*
       * Permite ao usuário selecionar o período (data inicial/final) e
       * se incluir colaboradores que não compareceram.
       */}
            {agenda.showExportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
                    <div className="bg-white rounded-ios p-8 max-w-sm w-full shadow-2xl">
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-ios-primary/10 flex items-center justify-center text-ios-primary mb-4 mx-auto text-3xl">
                                📊
                            </div>
                            <h3 className="text-xl font-bold text-gray-800">Exportar Excel</h3>
                            <p className="text-sm text-gray-500 mt-2">Selecione o intervalo de datas para exportar os agendamentos.</p>
                        </div>

                        <div className="space-y-4 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase">Data Inicial</label>
                                <input type="date" value={agenda.exportStartDate} onChange={(e) => agenda.setExportStartDate(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white border focus:border-ios-primary outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase">Data Final</label>
                                <input type="date" value={agenda.exportEndDate} onChange={(e) => agenda.setExportEndDate(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white border focus:border-ios-primary outline-none" />
                            </div>
                            <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                                <input
                                    type="checkbox"
                                    id="includeAbsent"
                                    checked={agenda.includeAbsent}
                                    onChange={(e) => agenda.setIncludeAbsent(e.target.checked)}
                                    className="w-5 h-5 text-ios-primary border-gray-300 rounded focus:ring-ios-primary cursor-pointer"
                                />
                                <label htmlFor="includeAbsent" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                                    Incluir colaboradores que não compareceram
                                </label>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <button onClick={() => agenda.setShowExportModal(false)} className="flex-1 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                                Cancelar
                            </button>
                            <button onClick={agenda.handleExportXLS} disabled={agenda.isExporting} className="flex-1 py-3 font-semibold text-white bg-ios-primary hover:bg-ios-secondary rounded-xl shadow-lg transition-colors flex justify-center">
                                {agenda.isExporting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" /> : 'Confirmar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Agenda;
