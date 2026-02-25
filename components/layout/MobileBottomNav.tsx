/**
 * MobileBottomNav.tsx
 * --------------------
 * Barra de navegação inferior fixa, visível apenas em dispositivos móveis (< lg).
 * Exibe 5 ítens de navegação: Início, Agenda, Novo (botão FAB central), Chamada e Stats.
 *
 * Renderizado condicionalmente pelo Layout.tsx (oculto em isFullScreen/isDocumentView).
 * Componente puramente visual — sem lógica e sem estado próprios.
 */

import React from 'react';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TabName = 'dashboard' | 'agenda' | 'novo' | 'chamada' | 'atendimento' | 'stats' | 'aso';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MobileBottomNavProps {
    activeTab: TabName;                  // Tab atualmente ativa (para highlight do ícone)
    setActiveTab: (tab: TabName) => void; // Callback para navegar entre as tabs
}

// ─── Componente ───────────────────────────────────────────────────────────────

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
    return (
        // Nav fixa no fundo do ecrã, oculta no desktop (lg:hidden)
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-safe pt-2 px-6 flex justify-around items-center z-40 pb-4">

            {/* ── Início (Dashboard) ─────────────────────────────────────────────── */}
            <button
                onClick={() => setActiveTab('dashboard')}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'dashboard' ? 'text-ios-primary' : 'text-gray-400'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="text-[10px] font-medium">Início</span>
            </button>

            {/* ── Agenda ─────────────────────────────────────────────────────────── */}
            <button
                onClick={() => setActiveTab('agenda')}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'agenda' ? 'text-ios-primary' : 'text-gray-400'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-[10px] font-medium">Agenda</span>
            </button>

            {/* ── Botão FAB Central: Novo Agendamento ───────────────────────────── */}
            {/* Elevado acima da barra com -mt-6 e design circular com gradiente */}
            <button
                onClick={() => setActiveTab('novo')}
                className="flex flex-col items-center justify-center -mt-6"
            >
                <div className="w-14 h-14 bg-gradient-to-tr from-ios-primary to-ios-secondary rounded-full shadow-lg shadow-ios-primary/30 flex items-center justify-center text-white transform active:scale-95 transition-transform">
                    <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
            </button>

            {/* ── Chamada ────────────────────────────────────────────────────────── */}
            <button
                onClick={() => setActiveTab('chamada')}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'chamada' ? 'text-ios-primary' : 'text-gray-400'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
                <span className="text-[10px] font-medium">Chamada</span>
            </button>

            {/* ── Estatísticas ───────────────────────────────────────────────────── */}
            <button
                onClick={() => setActiveTab('stats')}
                className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'stats' ? 'text-ios-primary' : 'text-gray-400'}`}
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="text-[10px] font-medium">Stats</span>
            </button>
        </nav>
    );
};

export default MobileBottomNav;
