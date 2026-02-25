/**
 * AuthHeader.tsx
 * ---------------
 * Cabeçalho visual da tela de autenticação.
 * Exibe o logo, nome do sistema e versão.
 * Componente puramente visual — sem lógica, sem estado.
 */

import React from 'react';

// ─── Componente ───────────────────────────────────────────────────────────────

const AuthHeader: React.FC = () => {
    return (
        // Centraliza o logo e os textos dentro do card de autenticação
        <div className="text-center mb-10">

            {/* Logo da Gama Center → ícone com fundo gradiente e leve rotação */}
            <div className="w-20 h-20 bg-gradient-to-tr from-ios-primary to-ios-secondary rounded-[24px] mx-auto flex items-center justify-center shadow-lg shadow-ios-primary/30 mb-6 transform rotate-3">
                <img
                    src="https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/public/Media/Image/image-removebg-preview%20(2).png"
                    alt="Gama Center Logo"
                    className="w-14 h-14 object-contain brightness-0 invert"
                />
            </div>

            {/* Nome do sistema */}
            <h1 className="text-3xl font-bold text-ios-text tracking-tight">Gama Center</h1>

            {/* Versão / subtítulo */}
            <p className="text-ios-subtext text-sm font-medium mt-2">Health OS 26</p>
        </div>
    );
};

export default AuthHeader;
