/**
 * useTvBoard.ts
 * --------------
 * Custom hook que gerencia os dados e o canal Realtime do Painel de Chamada (Modo TV).
 * Recebe `playAlert` como callback para acionar o áudio quando uma nova chamada é detectada.
 *
 * Estados gerenciados:
 *  - currentCall → Agendamento com posicao_tela === 1 (exibido no display principal)
 *  - historyList → Agendamentos com posicao_tela > 1 (lista lateral de chamadas anteriores)
 *  - loading     → true durante o fetch inicial
 *
 * Refs gerenciados (não causam re-render):
 *  - previousCallIdRef  → ID da última chamada exibida (detecta troca de paciente)
 *  - previousRoomRef    → Sala da última chamada (detecta troca de sala)
 *
 * Lógica de detecção de nova chamada:
 *  O alerta sonoro é tocado quando o fetch retorna um currentCall diferente do anterior
 *  (id diferente OU sala diferente). Os refs são usados em vez de estado para evitar
 *  loops de re-renderização e garantir comparação com o valor mais recente.
 */

import { useEffect, useState, useRef, useCallback } from 'react';
import { Agendamento } from '../types';
import { fetchTvBoardData } from '../services/tvBoardService';
import { supabase } from '../services/supabaseClient';

// ─── Interface de Retorno ─────────────────────────────────────────────────────

export interface UseTvBoardReturn {
    currentCall: Agendamento | null; // Chamada ativa no display principal (posicao_tela === 1)
    historyList: Agendamento[];      // Chamadas anteriores na lista lateral (posicao_tela > 1)
    loading: boolean;                // true durante o fetch inicial dos dados
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

/**
 * Hook de dados do Painel de Chamada.
 *
 * @param playAlert - Callback do hook useAudioAlert para tocar o alerta sonoro.
 *                    Recebido como parâmetro para evitar acoplamento direto com o AudioContext.
 */
export function useTvBoard(playAlert: () => Promise<void>): UseTvBoardReturn {
    // ── Estados ──────────────────────────────────────────────────────────────
    const [currentCall, setCurrentCall] = useState<Agendamento | null>(null);
    const [historyList, setHistoryList] = useState<Agendamento[]>([]);
    const [loading, setLoading] = useState(true);

    // ── Refs para Detecção de Nova Chamada ───────────────────────────────────
    // Refs são usadas (em vez de estados) pois precisamos do valor mais recente
    // dentro do callback do Realtime sem causar re-subscrições do canal.
    const previousCallIdRef = useRef<number | null>(null);  // ID do último agendamento exibido
    const previousRoomRef = useRef<string | null>(null);  // Sala do último agendamento exibido

    // ── Função de Fetch e Processamento ─────────────────────────────────────
    /**
     * Busca os dados do painel via tvBoardService e atualiza os estados.
     *
     * Lógica de detecção de nova chamada:
     *  Após cada fetch, compara o agendamento na posição 1 com os refs de estado anterior.
     *  Se o ID ou a sala mudaram, dispara o alerta sonoro e atualiza os refs.
     *  Isso evita que o alerta toque em re-renders sem mudança real na chamada.
     */
    const loadDisplayData = useCallback(async () => {
        const allCalls = await fetchTvBoardData();

        // Separa a chamada principal (posição 1) das demais (histórico lateral)
        const main = allCalls.find(a => a.posicao_tela === 1) || null;
        const history = allCalls.filter(a => a.posicao_tela !== 1);

        // Detecta se a chamada atual é diferente da última exibida
        // → ID diferente: novo paciente foi chamado
        // → Sala diferente: mesmo paciente foi redirecionado para outra sala
        const hasChanged = main && (
            main.id !== previousCallIdRef.current ||
            main.sala_chamada !== previousRoomRef.current
        );

        if (hasChanged) {
            // Atualiza os refs com os valores da nova chamada
            previousCallIdRef.current = main.id;
            previousRoomRef.current = main.sala_chamada || null;

            // Aciona o alerta sonoro via callback (gerenciado pelo useAudioAlert no orquestrador)
            await playAlert();
        }

        // Atualiza os estados de UI com os dados processados
        setCurrentCall(main);
        setHistoryList(history);
        setLoading(false);
    }, [playAlert]); // Dependência: playAlert (estável via useCallback no useAudioAlert)

    // ── Effect: Inicialização + Canal Realtime ───────────────────────────────
    useEffect(() => {
        // Fetch inicial ao montar o componente
        loadDisplayData();

        /**
         * Inscrição no canal Realtime do Supabase.
         * Escuta QUALQUER mudança (INSERT/UPDATE/DELETE) na tabela 'agendamentos'
         * e re-executa o fetch para refletir o estado atual do painel.
         *
         * O nome do canal 'public:agendamentos' segue a convenção do Supabase Realtime.
         */
        const channel = supabase
            .channel('public:agendamentos')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'agendamentos' }, // Escuta todos os eventos
                () => {
                    loadDisplayData(); // Re-busca os dados ao detectar qualquer mudança
                }
            )
            .subscribe();

        // Cleanup: remove o canal ao desmontar o componente para evitar memory leaks
        return () => {
            supabase.removeChannel(channel);
        };
    }, [loadDisplayData]); // Dependência: loadDisplayData (estável via useCallback)

    return { currentCall, historyList, loading };
}
