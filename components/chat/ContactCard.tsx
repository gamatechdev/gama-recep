/**
 * ContactCard.tsx
 * ---------------
 * Exibe um card de contato recebido/enviado pelo WhatsApp.
 * Renderizado quando uma mensagem contém 'raw_payload.contactMessage'.
 *
 * Apresenta o nome e número do contato compartilhado, com botão
 * de ação para iniciar uma nova conversa com esse número.
 */

import React from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface ContactCardProps {
    /** Nome de exibição do contato compartilhado */
    displayName: string;
    /** Número de telefone do contato (opcional — pode não estar disponível) */
    phoneNumber?: string;
    /** Se true, a mensagem é do usuário atual (inverte esquema de cores) */
    isOwn: boolean;
    /**
     * Callback para iniciar uma nova conversa com o contato compartilhado.
     * Recebe o telefone e nome para abrir/criar o chat correspondente.
     */
    onStartChat: (phone: string, name: string) => void;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const ContactCard: React.FC<ContactCardProps> = ({
    displayName,
    phoneNumber,
    isOwn,
    onStartChat,
}) => {
    return (
        <div
            className={`p-3 rounded-xl min-w-[240px] max-w-sm ${isOwn
                    ? 'bg-white/10 text-white'
                    : 'bg-slate-50 dark:bg-[#1c1c1e] text-slate-800 dark:text-white'
                }`}
        >
            {/* Avatar com inicial do nome e dados do contato */}
            <div className="flex items-center gap-3 mb-3">
                {/* Avatar gerado com a inicial do nome — sem imagem real do contato */}
                <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${isOwn
                            ? 'bg-white text-[#04a7bd]'
                            : 'bg-slate-300 dark:bg-slate-600 text-white'
                        }`}
                >
                    {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-sm leading-tight truncate">{displayName}</h3>
                    {/* Número de telefone — truncado para caber no card */}
                    {phoneNumber && (
                        <p className="text-xs opacity-70 truncate">{phoneNumber}</p>
                    )}
                </div>
            </div>

            {/* Botão para iniciar conversa com o contato compartilhado */}
            <button
                onClick={() => phoneNumber && onStartChat(phoneNumber, displayName)}
                disabled={!phoneNumber} // Desabilitado se não há número disponível
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isOwn
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20'
                    }`}
            >
                Conversar
            </button>
        </div>
    );
};

export default ContactCard;
