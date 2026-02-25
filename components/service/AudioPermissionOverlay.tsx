/**
 * AudioPermissionOverlay.tsx
 * ---------------------------
 * Overlay de tela cheia exibido antes do usuário conceder permissão de áudio.
 * Cobre toda a tela com fundo preto semitransparente e solicita que o usuário
 * clique em "Ativar Som" para inicializar o AudioContext.
 *
 * O overlay é necessário porque browsers modernos exigem interação do usuário
 * antes de permitir reprodução de áudio (política de autoplay).
 *
 * Componente puramente visual — sem lógica própria.
 */

import React from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AudioPermissionOverlayProps {
    enableAudio: () => Promise<void>; // Callback do useAudioAlert para inicializar o AudioContext
}

// ─── Componente ───────────────────────────────────────────────────────────────

const AudioPermissionOverlay: React.FC<AudioPermissionOverlayProps> = ({ enableAudio }) => {
    return (
        // Overlay absoluto que cobre toda a area do painel — z-50 garante que fica acima de tudo
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-white">
            <div className="text-center p-8 border border-white/20 rounded-3xl bg-white/5 shadow-2xl">
                {/* Ícone de TV */}
                <div className="text-5xl mb-6">📺</div>

                <h2 className="text-3xl font-bold mb-4">Painel de Chamada</h2>

                <p className="text-gray-400 mb-8 max-w-md">
                    Clique abaixo para ativar o som de alerta.
                </p>

                {/* Botão de ativação — dispara enableAudio() no useAudioAlert */}
                <button
                    onClick={enableAudio}
                    className="bg-ios-primary text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-ios-secondary transition-colors shadow-lg shadow-ios-primary/30"
                >
                    Ativar Som
                </button>
            </div>
        </div>
    );
};

export default AudioPermissionOverlay;
