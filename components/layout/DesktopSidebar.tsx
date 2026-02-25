/**
 * DesktopSidebar.tsx
 * -------------------
 * Barra lateral de navegação visível apenas em desktop (≥ lg).
 * Exibe o logo, menu de navegação com 4 itens e a secção de perfil do utilizador.
 *
 * Renderizado condicionalmente pelo Layout.tsx (oculto em isFullScreen/isDocumentView).
 * Componente puramente visual — sem lógica e sem estado próprios.
 */

import React from 'react';
import { User } from '../../types';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TabName = 'dashboard' | 'agenda' | 'novo' | 'chamada' | 'atendimento' | 'stats' | 'aso';

// ─── Props ────────────────────────────────────────────────────────────────────

interface DesktopSidebarProps {
    activeTab: TabName;                   // Tab atualmente ativa (para highlight do item)
    setActiveTab: (tab: TabName) => void; // Callback para navegar entre as tabs
    userProfile: User | null;            // Dados do utilizador logado (ou null enquanto carrega)
    onLogout: () => void;                // Callback para encerrar a sessão
}

// ─── Componente ───────────────────────────────────────────────────────────────

const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
    activeTab, setActiveTab, userProfile, onLogout
}) => {
    return (
        // Aside visível apenas em desktop (hidden < lg, flex ≥ lg)
        <aside className="hidden lg:flex w-64 flex-shrink-0 glass-sidebar rounded-ios flex-col py-8 px-4 transition-all duration-500 shadow-glass relative overflow-hidden">

            {/* ── Logo e Título ─────────────────────────────────────────────────── */}
            <div className="mb-12 flex flex-col items-start px-4 relative z-10">
                {/* Ícone com gradiente — mesmo padrão do MobileHeader */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ios-primary to-ios-secondary flex items-center justify-center shadow-lg shadow-ios-primary/30 mb-3 overflow-hidden">
                    <img
                        src="https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/public/Media/Image/image-removebg-preview%20(2).png"
                        alt="Gama Center Logo"
                        className="w-8 h-8 object-contain brightness-0 invert"
                    />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-ios-text">Gama Center</h1>
                {/* Versão do sistema */}
                <p className="text-[10px] uppercase tracking-wider text-ios-subtext font-semibold mt-0.5">Health OS 26</p>
            </div>

            {/* ── Navegação Principal ────────────────────────────────────────────── */}
            <nav className="flex-1 space-y-2 relative z-10">

                {/* Item: Início (Dashboard) */}
                <button
                    onClick={() => setActiveTab('dashboard')}
                    className={`w-full flex items-center justify-start gap-4 px-4 py-3.5 rounded-ios-btn transition-all duration-300 group ${activeTab === 'dashboard'
                            ? 'bg-ios-primary text-white shadow-lg shadow-ios-primary/25'
                            : 'text-ios-subtext hover:bg-white hover:text-ios-text'
                        }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    <span className="font-medium tracking-wide">Início</span>
                </button>

                {/* Item: Agenda — activo também na tab 'novo' (novo agendamento) */}
                <button
                    onClick={() => setActiveTab('agenda')}
                    className={`w-full flex items-center justify-start gap-4 px-4 py-3.5 rounded-ios-btn transition-all duration-300 group ${activeTab === 'agenda' || activeTab === 'novo'
                            ? 'bg-ios-primary text-white shadow-lg shadow-ios-primary/25'
                            : 'text-ios-subtext hover:bg-white hover:text-ios-text'
                        }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="font-medium tracking-wide">Agenda</span>
                </button>

                {/* Item: Chamada */}
                <button
                    onClick={() => setActiveTab('chamada')}
                    className={`w-full flex items-center justify-start gap-4 px-4 py-3.5 rounded-ios-btn transition-all duration-300 group ${activeTab === 'chamada'
                            ? 'bg-ios-primary text-white shadow-lg shadow-ios-primary/25'
                            : 'text-ios-subtext hover:bg-white hover:text-ios-text'
                        }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                    </svg>
                    <span className="font-medium tracking-wide">Chamada</span>
                </button>

                {/* Item: Estatísticas */}
                <button
                    onClick={() => setActiveTab('stats')}
                    className={`w-full flex items-center justify-start gap-4 px-4 py-3.5 rounded-ios-btn transition-all duration-300 group ${activeTab === 'stats'
                            ? 'bg-ios-primary text-white shadow-lg shadow-ios-primary/25'
                            : 'text-ios-subtext hover:bg-white hover:text-ios-text'
                        }`}
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span className="font-medium tracking-wide">Estatísticas</span>
                </button>
            </nav>

            {/* ── Perfil do Utilizador + Logout ─────────────────────────────────── */}
            {/*
       * Secção no rodapé da sidebar com o avatar, username e o botão de logout.
       * mt-auto empurra este bloco para o fundo da sidebar.
       */}
            <div className="mt-auto pt-6 flex flex-col items-start px-2 gap-4 relative z-10 border-t border-gray-100">

                {/* Card do utilizador: avatar + nome + estado */}
                <div className="flex items-center gap-3 w-full bg-white/50 p-2 rounded-2xl border border-white/50 shadow-sm">
                    <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0">
                        {/* Foto de perfil ou fallback gerado pelo ui-avatars */}
                        <img
                            src={
                                userProfile?.img_url ||
                                `https://ui-avatars.com/api/?name=${userProfile?.username || 'User'}&background=04a7bd&color=fff`
                            }
                            alt="Profile"
                            className="w-full h-full object-cover"
                        />
                    </div>
                    <div className="min-w-0 flex-1">
                        {/* Nome do utilizador — truncado se muito longo */}
                        <p className="text-sm font-bold text-ios-text truncate leading-tight">
                            {userProfile?.username || 'Carregando...'}
                        </p>
                        {/* Estado de ligação */}
                        <p className="text-[10px] text-ios-secondary font-medium">Conectado</p>
                    </div>
                </div>

                {/* Botão de encerrar sessão */}
                <button
                    onClick={onLogout}
                    className="w-full text-left py-2 text-xs text-red-500 font-semibold hover:opacity-70 transition-opacity flex items-center justify-start gap-2"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Encerrar Sessão</span>
                </button>
            </div>
        </aside>
    );
};

export default DesktopSidebar;
