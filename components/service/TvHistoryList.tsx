/**
 * TvHistoryList.tsx
 * ------------------
 * Barra lateral direita do Painel de Chamada (Modo TV).
 * Exibe as últimas chamadas (agendamentos com posicao_tela > 1) em uma lista scrollável.
 *
 * Estados visuais:
 *  - historyList com itens → Lista de cards com nome e sala
 *  - historyList vazio     → Mensagem de "Histórico vazio"
 *
 * Componente puramente visual — sem lógica e sem estado próprios.
 */

import React from 'react';
import { Agendamento } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TvHistoryListProps {
    historyList: Agendamento[]; // Chamadas anteriores (posicao_tela > 1)
}

// ─── Componente ───────────────────────────────────────────────────────────────

const TvHistoryList: React.FC<TvHistoryListProps> = ({ historyList }) => {
    return (
        // Container lateral: fundo escuro, borda sutil, altura máxima responsiva
        <div className="w-full lg:w-1/3 bg-[#111] rounded-[32px] lg:rounded-[40px] border border-white/10 shadow-glass flex flex-col overflow-hidden max-h-[40vh] lg:max-h-full">

            {/* ── Cabeçalho da lista ──────────────────────────────────────────── */}
            <div className="p-6 lg:p-8 border-b border-white/10 bg-white/5">
                <h3 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
                    {/* Ícone de relógio */}
                    <svg className="w-6 h-6 lg:w-8 lg:h-8 text-ios-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Últimas Chamadas
                </h3>
            </div>

            {/* ── Área scrollável com os cards de histórico ───────────────────── */}
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4 custom-scrollbar">
                {historyList.length > 0 ? (
                    // Renderiza um card por chamada no histórico
                    historyList.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white/5 p-4 lg:p-6 rounded-2xl shadow-sm flex items-center justify-between border border-white/5 hover:bg-white/10 transition-colors animate-in slide-in-from-right duration-500 group"
                        >
                            {/* Coluna esquerda: nome e badge "Chamado" */}
                            <div>
                                <p className="font-bold text-lg lg:text-xl text-white mb-1 lg:mb-2 group-hover:text-ios-primary transition-colors">
                                    {item.colaboradores?.nome}
                                </p>
                                <span className="inline-block px-2 lg:px-3 py-0.5 lg:py-1 bg-white/10 rounded-lg text-[10px] lg:text-xs text-gray-300 font-bold uppercase tracking-wide">
                                    Chamado
                                </span>
                            </div>

                            {/* Coluna direita: sala de destino em destaque */}
                            <div className="text-right">
                                <span className="block text-xl lg:text-3xl font-bold text-ios-primary">
                                    {item.sala_chamada}
                                </span>
                            </div>
                        </div>
                    ))
                ) : (
                    // Estado vazio: nenhuma chamada no histórico ainda
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60 min-h-[100px]">
                        <p className="text-lg lg:text-xl">Histórico vazio</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TvHistoryList;
