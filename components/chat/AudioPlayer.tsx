/**
 * AudioPlayer.tsx
 * ----------------
 * Componente de player de áudio no estilo WhatsApp.
 * Exibe a foto do remetente, botão play/pause, barra de progresso
 * interativa e o tempo atual de reprodução.
 *
 * Encapsula a lógica do HTMLAudioElement para que o ChatWindow
 * não precise gerenciar estado de reprodução diretamente.
 */

import React, { useState, useRef, useEffect } from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AudioPlayerProps {
    /** URL pública do arquivo de áudio (webm/ogg) */
    src: string;
    /** Se true, a mensagem é do usuário atual (afeta as cores do player) */
    isOwn: boolean;
    /** URL da foto do remetente para exibir no avatar do player */
    senderPhoto: string;
}

// ─── Helper: Formatar Duração ─────────────────────────────────────────────────

/**
 * Converte segundos em formato de exibição "M:SS".
 * Trata casos onde o duration ainda não foi carregado (NaN ou 0).
 *
 * @param seconds - Tempo em segundos
 * @returns String formatada como "1:05", "0:00", etc.
 */
const formatTime = (seconds: number): string => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// ─── Componente ───────────────────────────────────────────────────────────────

const AudioPlayer: React.FC<AudioPlayerProps> = ({ src, isOwn, senderPhoto }) => {
    // Estado de reprodução: tocando ou pausado
    const [isPlaying, setIsPlaying] = useState(false);
    // Duração total do áudio em segundos (preenchida após metadados carregados)
    const [duration, setDuration] = useState(0);
    // Posição atual de reprodução em segundos
    const [currentTime, setCurrentTime] = useState(0);

    // Referência ao elemento <audio> para controle programático
    const audioRef = useRef<HTMLAudioElement>(null);

    // ── Effect: Registra eventos do elemento de áudio ─────────────────────────
    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        /**
         * Atualiza 'duration' quando os metadados são carregados.
         * O evento 'durationchange' cobre casos onde a duração é atualizada
         * tardiamente (comum em arquivos webm com duração indefinida).
         */
        const setAudioData = () => {
            if (audio.duration !== Infinity) {
                setDuration(audio.duration);
            }
        };

        // Atualiza o estado de 'currentTime' a cada tick de reprodução
        const setAudioTime = () => setCurrentTime(audio.currentTime);

        // Reseta a interface quando o áudio termina
        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        // Registra os event listeners
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('durationchange', setAudioData);
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);

        // Cleanup: remove os listeners ao desmontar o componente
        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('durationchange', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    // ── Handler: Alternar Play / Pause ────────────────────────────────────────
    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        // Se está tocando, pausa; se está pausado, reproduz
        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    // ── Handler: Seek (arrastar a barra de progresso) ─────────────────────────
    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        // Converte o valor do input para número e posiciona o áudio
        const time = Number(e.target.value);
        audio.currentTime = time;
        setCurrentTime(time);
    };

    // ─── Renderização ─────────────────────────────────────────────────────────
    return (
        <div className="flex items-center gap-4 min-w-[280px] p-1">

            {/* Avatar com ícone de microfone sobreposto */}
            <div className="relative flex-shrink-0">
                <img
                    src={senderPhoto || 'https://ui-avatars.com/api/?name=User&background=random'}
                    alt="Sender"
                    className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                />
                {/* Ícone de microfone no canto inferior direito do avatar */}
                <div className="absolute bottom-0 right-0">
                    <svg
                        className={`w-5 h-5 drop-shadow-md ${isOwn ? 'text-white/80' : 'text-slate-500 dark:text-slate-300'}`}
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                </div>
            </div>

            {/* Controles de reprodução */}
            <div className="flex items-center gap-3 flex-1">
                {/* Botão Play/Pause */}
                <button
                    onClick={togglePlay}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isOwn
                            ? 'text-white/90 hover:text-white'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white'
                        }`}
                >
                    {isPlaying ? (
                        /* Ícone de Pausa */
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    ) : (
                        /* Ícone de Play */
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                {/* Barra de progresso e marcador de tempo */}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                    <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none ${isOwn
                                ? 'bg-[#149890]/40 accent-white'
                                : 'bg-slate-300 dark:bg-white/20 accent-[#04a7bd]'
                            }`}
                        style={{
                            // Gradiente customizado para indicar o progresso visualmente quando é mensagem própria
                            backgroundImage: isOwn
                                ? `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
                                : undefined,
                        }}
                    />
                    {/* Exibe o tempo atual de reprodução */}
                    <div
                        className={`text-[11px] mt-1 font-medium ${isOwn ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'
                            }`}
                    >
                        {formatTime(currentTime)}
                    </div>
                </div>
            </div>

            {/* Elemento de áudio oculto — controlado via ref */}
            <audio ref={audioRef} src={src} preload="metadata" />
        </div>
    );
};

export default AudioPlayer;
