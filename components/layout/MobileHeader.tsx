/**
 * MobileHeader.tsx
 * -----------------
 * Cabeçalho da aplicação visível apenas em dispositivos móveis (< lg).
 * Exibe o logo, o nome do sistema, o avatar do utilizador e o botão de logout.
 *
 * Renderizado condicionalmente pelo Layout.tsx (oculto em isFullScreen/isDocumentView).
 * Componente puramente visual — sem lógica e sem estado próprios.
 */

import React from 'react';
import { User } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface MobileHeaderProps {
    userProfile: User | null; // Dados do utilizador logado (ou null enquanto carrega)
    onLogout: () => void;     // Callback para encerrar a sessão
}

// ─── Componente ───────────────────────────────────────────────────────────────

const MobileHeader: React.FC<MobileHeaderProps> = ({ userProfile, onLogout }) => {
    return (
        // Header fixo no topo, visível apenas em ecrãs menores que lg (hidden no desktop)
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 z-30 sticky top-0">

            {/* ── Esquerda: Logo + Nome ─────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                {/* Ícone da Gama Center com gradiente */}
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ios-primary to-ios-secondary flex items-center justify-center shadow-md shadow-ios-primary/20 overflow-hidden">
                    <img
                        src="https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/public/Media/Image/image-removebg-preview%20(2).png"
                        alt="Logo"
                        className="w-5 h-5 object-contain brightness-0 invert"
                    />
                </div>
                <h1 className="text-lg font-bold text-ios-text tracking-tight">Gama Center</h1>
            </div>

            {/* ── Direita: Avatar + Botão de Logout ────────────────────────────── */}
            <div className="flex items-center gap-3">
                {/* Avatar do utilizador: usa imagem de perfil ou fallback ui-avatars */}
                <img
                    src={
                        userProfile?.img_url ||
                        `https://ui-avatars.com/api/?name=${userProfile?.username || 'User'}&background=04a7bd&color=fff`
                    }
                    alt="Profile"
                    className="w-8 h-8 rounded-full bg-gray-100 object-cover ring-2 ring-white shadow-sm"
                />

                {/* Botão de logout — ícone de seta para fora */}
                <button onClick={onLogout} className="text-red-500">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                </button>
            </div>
        </header>
    );
};

export default MobileHeader;
