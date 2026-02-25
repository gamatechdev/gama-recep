/**
 * StatsHeader.tsx
 * ----------------
 * Cabeçalho da tela de Estatísticas.
 * Exibe o título "Desempenho Diário" e a data atual formatada em PT-BR.
 * Componente puramente visual — sem lógica e sem estado próprios.
 */

import React from 'react';

// ─── Componente ───────────────────────────────────────────────────────────────

const StatsHeader: React.FC = () => {
    return (
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
                {/* Título principal da tela */}
                <h2 className="text-3xl font-bold text-ios-text tracking-tight">Desempenho Diário</h2>
                {/* Subtítulo com a data de hoje formatada em PT-BR */}
                <p className="text-ios-subtext font-medium mt-1">
                    Estatísticas de hoje ({new Date().toLocaleDateString('pt-BR')})
                </p>
            </div>
        </div>
    );
};

export default StatsHeader;
