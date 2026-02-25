/**
 * StatsKpiCards.tsx
 * ------------------
 * Dois cards KPI superiores da tela de Estatísticas:
 *  1. Card Azul  → Total de atendimentos realizados hoje pelo usuário
 *  2. Card Verde → Tempo médio de atendimento em minutos
 *
 * Componente puramente visual — sem lógica e sem estado próprios.
 */

import React from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatsKpiCardsProps {
    totalServices: number;  // Total de atendimentos finalizados pelo usuário hoje
    averageTime: number;    // Tempo médio do usuário em segundos
    formatMinutesOnly: (totalSeconds: number) => number; // Extrai minutos inteiros
}

// ─── Componente ───────────────────────────────────────────────────────────────

const StatsKpiCards: React.FC<StatsKpiCardsProps> = ({
    totalServices,
    averageTime,
    formatMinutesOnly,
}) => {
    return (
        // Grid de 2 colunas em desktop, 1 coluna em mobile
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

            {/* ── Card 1: Total de Atendimentos (Azul) ─────────────────────────── */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-float transition-all duration-300">
                {/* Blob decorativo no canto superior direito */}
                <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                {/* Ícone + Label */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Seus Atendimentos</h3>
                </div>

                {/* Valor principal em destaque */}
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-ios-text tracking-tight">{totalServices}</span>
                    <span className="text-xl font-medium text-gray-400">pacientes</span>
                </div>
                <p className="text-sm text-gray-400 mt-2 font-medium">Finalizados com sucesso hoje</p>
            </div>

            {/* ── Card 2: Tempo Médio (Verde) ───────────────────────────────────── */}
            <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-float transition-all duration-300">
                {/* Blob decorativo no canto superior direito */}
                <div className="absolute right-0 top-0 w-32 h-32 bg-green-50 rounded-full blur-2xl transform translate-x-10 -translate-y-10" />

                {/* Ícone + Label */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Seu Tempo Médio</h3>
                </div>

                {/* Valor principal: minutos em destaque */}
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-black text-ios-text tracking-tight">
                        {formatMinutesOnly(averageTime)}
                    </span>
                    <span className="text-xl font-medium text-gray-400">minutos</span>
                </div>

                {/* Segundos restantes como detalhe secundário */}
                <div className="text-sm text-gray-400 mt-2 font-medium">
                    {averageTime % 60 > 0
                        ? `e ${Math.floor(averageTime % 60)} segundos`
                        : 'exatos'} por paciente
                </div>
            </div>
        </div>
    );
};

export default StatsKpiCards;
