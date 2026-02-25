/**
 * StatCards.tsx
 * --------------
 * Componente visual que renderiza o grid superior de cards do Dashboard.
 *
 * Contém dois cards lado a lado (md:grid-cols-2):
 *  - Card 1: Total de Agendados Hoje com ícone de calendário decorativo
 *  - Card 2: Taxa de Presença com gráfico circular (SVG) animado
 *
 * Os cálculos do gráfico circular (circunferência, offset) são feitos localmente
 * pois dependem apenas dos dados recebidos via props — sem efeitos colaterais.
 *
 * Toda a lógica de busca e agregação está no hook useDashboardStats.
 */

import React from 'react';
import { DashboardStats } from '../../hooks/useDashboardStats';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface StatCardsProps {
    /**
     * Métricas calculadas pelo hook useDashboardStats.
     * Inclui total de agendados, presentes e aguardando.
     */
    stats: DashboardStats;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const StatCards: React.FC<StatCardsProps> = ({ stats }) => {
    // ── Cálculo do Gráfico Circular ───────────────────────────────────────────
    // Calculado localmente pois depende apenas das props (não há fetch aqui)

    /**
     * Taxa de presença em percentual (0–100).
     * Evita divisão por zero quando não há agendamentos (total = 0).
     */
    const attendanceRate = stats.total > 0
        ? Math.round((stats.present / stats.total) * 100)
        : 0;

    /**
     * Circunferência do círculo SVG usando a fórmula: 2 * π * raio
     * O raio do círculo é 54 (definido no atributo r do elemento <circle>).
     */
    const circleCircumference = 2 * Math.PI * 54;

    /**
     * Offset do traçado SVG que controla quanto da circunferência é "preenchida".
     * Quanto menor o offset, mais preenchido aparece o arco.
     * offset = circumference - (percentual/100) * circumference
     * Exemplo: 100% → offset = 0 (círculo completo preenchido)
     *          50%  → offset = circumference / 2 (metade preenchida)
     *            0% → offset = circumference (nada preenchido)
     */
    const circleOffset = circleCircumference - (attendanceRate / 100) * circleCircumference;

    return (
        // Grid responsivo: 1 coluna no mobile, 2 colunas a partir de md
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ─── Card 1: Total de Agendados ──────────────────────────────────── */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-float transition-all duration-500">

                {/* Ícone decorativo de fundo — aumenta a opacidade no hover */}
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                    <svg className="w-32 h-32 text-ios-primary" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.89-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z" />
                    </svg>
                </div>

                <div className="relative z-10">
                    {/* Ícone do card — calendário pequeno no canto */}
                    <div className="w-12 h-12 rounded-2xl bg-ios-primary/10 flex items-center justify-center text-ios-primary mb-6">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                    </div>

                    {/* Label do card */}
                    <h3 className="text-ios-subtext font-semibold text-sm uppercase tracking-wider mb-1">
                        Agendados Hoje
                    </h3>

                    {/* Número principal em destaque */}
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-ios-text tracking-tighter">{stats.total}</span>
                        <span className="text-sm font-medium text-gray-400">pacientes</span>
                    </div>

                    {/* Badge secundário com quantidade aguardando chegada */}
                    <div className="mt-4 flex gap-2">
                        <span className="px-3 py-1 rounded-full bg-gray-50 text-xs font-bold text-gray-500 border border-gray-100">
                            {stats.waiting} aguardando
                        </span>
                    </div>
                </div>
            </div>

            {/* ─── Card 2: Taxa de Presença + Gráfico Circular ─────────────────── */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-float transition-all duration-500">

                {/* Coluna esquerda: ícone + números */}
                <div className="flex flex-col justify-center h-full">
                    {/* Ícone de check-circle verde */}
                    <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 mb-4">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>

                    <div>
                        <h3 className="text-ios-subtext font-semibold text-sm uppercase tracking-wider mb-1">
                            Taxa de Presença
                        </h3>
                        {/* Presentes / Total como fração */}
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-bold text-ios-text tracking-tighter">{stats.present}</span>
                            <span className="text-sm font-medium text-gray-400">/ {stats.total}</span>
                        </div>
                        <p className="text-xs text-gray-400 font-medium mt-2">Colaboradores presentes</p>
                    </div>
                </div>

                {/* Coluna direita: Gráfico de arco SVG animado */}
                <div className="relative w-32 h-32 flex-shrink-0 ml-4">
                    {/*
           * O SVG é rotacionado -90° para que o arco inicie no topo (12h)
           * em vez do lado direito (3h), que é o padrão SVG.
           */}
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                        {/* Trilha cinza de fundo (círculo completo) */}
                        <circle
                            cx="64" cy="64" r="54"
                            stroke="currentColor" strokeWidth="10" fill="transparent"
                            className="text-gray-100"
                        />
                        {/* Arco colorido que avança conforme a taxa de presença */}
                        {/* transition-all duration-1000 cria a animação suave de preenchimento */}
                        <circle
                            cx="64" cy="64" r="54"
                            stroke="currentColor" strokeWidth="10" fill="transparent"
                            strokeDasharray={circleCircumference}
                            strokeDashoffset={circleOffset}
                            className="text-green-500 transition-all duration-1000 ease-out"
                            strokeLinecap="round"
                        />
                    </svg>

                    {/* Percentual centralizado sobre o SVG */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-2xl font-black text-gray-800 tracking-tight leading-none">
                            {attendanceRate}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StatCards;
