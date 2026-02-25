/**
 * AsoToolbar.tsx
 * ---------------
 * Barra de ferramentas da tela do documento ASO.
 * Contém os botões "Voltar" e "Imprimir" posicionados fixos no canto superior direito.
 *
 * Esta barra é ocultada automaticamente durante a impressão (print:hidden).
 * Componente puramente visual — sem lógica e sem estado próprios.
 */

import React from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AsoToolbarProps {
    onBack: () => void;       // Callback para voltar à tela anterior (Agenda)
    handlePrint: () => void;  // Callback para acionar window.print()
}

// ─── Componente ───────────────────────────────────────────────────────────────

const AsoToolbar: React.FC<AsoToolbarProps> = ({ onBack, handlePrint }) => {
    return (
        // Barra fixa no topo direito — invisível durante a impressão (print:hidden)
        <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50">

            {/* Botão Voltar: retorna para a listagem da Agenda */}
            <button
                onClick={onBack}
                className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700"
            >
                Voltar
            </button>

            {/* Botão Imprimir: aciona window.print() no orquestrador */}
            <button
                onClick={handlePrint}
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2"
            >
                {/* Ícone de impressora */}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Imprimir
            </button>
        </div>
    );
};

export default AsoToolbar;
