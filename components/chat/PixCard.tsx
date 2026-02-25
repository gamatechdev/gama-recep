/**
 * PixCard.tsx
 * -----------
 * Exibe um card visual de pagamento via PIX dentro do chat.
 * Renderizado quando uma mensagem contém 'raw_payload.pixKeyMessage'.
 *
 * Apresenta a chave PIX com botão de copiar e ícone de moeda.
 * As cores se adaptam ao contexto (mensagem própria ou do contato).
 */

import React from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface PixCardProps {
    /** Chave PIX a ser exibida e copiada */
    pixKey: string;
    /** Tipo da chave PIX: 'CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'EVP' */
    keyType: string;
    /** Nome do recebedor (ex: "Gama Center") — opcional */
    merchantName?: string;
    /** Se true, a mensagem é do usuário atual (inverte esquema de cores) */
    isOwn: boolean;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const PixCard: React.FC<PixCardProps> = ({ pixKey, keyType, merchantName, isOwn }) => {
    /**
     * Copia a chave PIX para a área de transferência do usuário.
     * Usa a API moderna navigator.clipboard (requer contexto seguro HTTPS).
     */
    const handleCopy = () => {
        navigator.clipboard.writeText(pixKey);
        alert('Chave PIX copiada!');
    };

    return (
        <div
            className={`p-4 rounded-xl max-w-sm ${isOwn
                    ? 'bg-white/10 text-white'
                    : 'bg-slate-50 dark:bg-[#1c1c1e] text-slate-800 dark:text-white'
                }`}
        >
            {/* Cabeçalho com ícone de moeda e nome do recebedor */}
            <div className="flex items-center gap-3 mb-3 border-b border-current/10 pb-2">
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${isOwn ? 'bg-white text-[#04a7bd]' : 'bg-[#04a7bd] text-white'
                        }`}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-sm leading-tight">Pagamento via PIX</h3>
                    {/* Nome do recebedor (ex: empresa) — exibido apenas se fornecido */}
                    {merchantName && <p className="text-xs opacity-80">{merchantName}</p>}
                </div>
            </div>

            {/* Exibição da chave PIX */}
            <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wide opacity-70 mb-1">
                    Chave {keyType || 'PIX'}
                </p>
                {/* Exibido em fonte monospace para facilitar leitura de chaves longas */}
                <div
                    className={`p-2 rounded-lg font-mono text-sm break-all ${isOwn ? 'bg-black/20' : 'bg-slate-200 dark:bg-white/10'
                        }`}
                >
                    {pixKey}
                </div>
            </div>

            {/* Botão de copiar — usa a Clipboard API */}
            <button
                onClick={handleCopy}
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${isOwn
                        ? 'bg-white text-[#04a7bd] hover:bg-white/90'
                        : 'bg-[#04a7bd] text-white hover:bg-[#149890]'
                    }`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                </svg>
                Copiar Chave
            </button>
        </div>
    );
};

export default PixCard;
