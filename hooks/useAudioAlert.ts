/**
 * useAudioAlert.ts
 * -----------------
 * Custom hook que encapsula toda a lógica da Web Audio API para o Painel de Chamada.
 * Isola o AudioContext, o oscilador e o controle de permissão de áudio do componente de UI.
 *
 * Estados gerenciados:
 *  - audioEnabled   → true após o usuário clicar em "Ativar Som"
 *
 * Refs gerenciados:
 *  - audioContextRef → referência ao AudioContext (necessário para não recriar a cada render)
 *
 * Funções exportadas:
 *  - enableAudio → Inicializa o AudioContext e toca o áudio de teste
 *  - playAlert   → Toca o som de alerta usando oscilador (sine, 880→440 Hz com fade)
 */

import { useState, useRef, useCallback } from 'react';

// ─── Interface de Retorno ─────────────────────────────────────────────────────

export interface UseAudioAlertReturn {
    audioEnabled: boolean;               // true após permissão concedida pelo usuário
    enableAudio: () => Promise<void>;    // Inicializa o AudioContext e toca áudio de teste
    playAlert: () => Promise<void>;      // Toca o som de alerta de chamada
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

export function useAudioAlert(): UseAudioAlertReturn {
    // Estado: controla se o áudio foi habilitado pelo usuário
    // O overlay de permissão é exibido enquanto audioEnabled === false
    const [audioEnabled, setAudioEnabled] = useState(false);

    // Ref: mantém a instância do AudioContext entre renders sem causar re-renderizações
    // Usar ref é essencial pois o AudioContext deve ser criado apenas uma vez
    const audioContextRef = useRef<AudioContext | null>(null);

    // ── Função: Tocar Alerta Sonoro ───────────────────────────────────────────
    /**
     * Toca um alerta sonoro usando a Web Audio API com um oscilador do tipo 'sine'.
     *
     * Configuração do som:
     *  - Frequência inicial: 880 Hz (Lá5) descendo para 440 Hz (Lá4) em 0.8s
     *    → Cria o efeito de "ding" descendente característico de painéis de chamada
     *  - Gain (volume): fade-in rápido (0→0.5 em 0.05s) + fade-out lento (0.5→0 em 1.5s)
     *    → Evita cliques/pops de áudio e cria um som suave
     *  - Duração total: 1.5 segundos
     *
     * Não faz nada se o AudioContext não foi inicializado (usuário não deu permissão).
     */
    const playAlert = useCallback(async () => {
        const ctx = audioContextRef.current;
        if (!ctx) return; // Guarda de segurança: sem contexto, sem som

        try {
            // Retoma o contexto se estiver suspenso (política de autoplay do browser)
            if (ctx.state === 'suspended') {
                await ctx.resume();
            }

            // Cria o oscilador — gerador do sinal de áudio
            const oscillator = ctx.createOscillator();
            // Cria o nó de ganho — controla o volume com envelope de fade
            const gainNode = ctx.createGain();

            // Conecta: Oscilador → Ganho → Saída de áudio (alto-falante)
            oscillator.connect(gainNode);
            gainNode.connect(ctx.destination);

            // Configura a forma de onda como seno (som mais suave, sem harmônicos agressivos)
            oscillator.type = 'sine';
            const now = ctx.currentTime;

            // Envelope de frequência: 880 Hz → 440 Hz em 0.8 segundos (descida característica)
            oscillator.frequency.setValueAtTime(880, now);
            oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.8);

            // Envelope de volume: 0 → 0.5 (fade-in de 50ms) → 0.01 (fade-out até 1.5s)
            gainNode.gain.setValueAtTime(0, now);
            gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.5);

            // Inicia e finaliza o oscilador (descarta automaticamente após stop)
            oscillator.start(now);
            oscillator.stop(now + 1.5);
        } catch (e) {
            console.error('[useAudioAlert] Erro ao reproduzir alerta:', e);
        }
    }, []); // Sem dependências — playAlert é estável entre renders

    // ── Função: Habilitar Áudio (chamada pelo usuário via overlay) ────────────
    /**
     * Inicializa o AudioContext após interação do usuário.
     * Browsers modernos exigem que o AudioContext seja criado durante um evento de usuário
     * (click), por isso esta função é necessária — não é possível auto-inicializar o áudio.
     *
     * Após inicializar, toca o alerta de teste para confirmar que o áudio está funcionando.
     */
    const enableAudio = useCallback(async () => {
        try {
            // Usa o prefixo webkit para compatibilidade com Safari
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const ctx = new AudioContextClass();
            audioContextRef.current = ctx;

            // Garante que o contexto está ativo (pode estar suspenso por padrão)
            await ctx.resume();

            // Marca o áudio como habilitado — remove o overlay de permissão
            setAudioEnabled(true);

            // Toca o som de teste para confirmar que o áudio está funcionando
            playAlert();
        } catch (e) {
            console.error('[useAudioAlert] Erro ao inicializar AudioContext:', e);
        }
    }, [playAlert]);

    // ── Retorno do Hook ───────────────────────────────────────────────────────
    return { audioEnabled, enableAudio, playAlert };
}
