/**
 * useChatMessages.ts
 * ------------------
 * Custom hook responsável por toda a lógica de estado e busca de mensagens.
 * Encapsula:
 *  - Estado das mensagens (lista, loading, paginação)
 *  - Busca inicial no Supabase (últimas 40 mensagens)
 *  - Paginação por scroll infinito (carregar mais antigas)
 *  - Inscrição em tempo real via Supabase Realtime
 *
 * O componente visual (ChatWindow) apenas CONSOME o que este hook retorna,
 * sem precisar conhecer os detalhes do Supabase.
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '../services/supabaseClient'; // Cliente Supabase canônico
import { Message } from '../types'; // Tipagem compartilhada da mensagem

// Número de mensagens carregadas por "página" (inicial e em cada scroll)
const MESSAGES_PER_PAGE = 40;

// ─── Interface de retorno do hook ─────────────────────────────────────────────

interface UseChatMessagesReturn {
    messages: Message[];              // Lista de mensagens atual ordenada cronologicamente
    loading: boolean;                 // True durante o carregamento inicial do chat
    loadingMore: boolean;             // True durante o carregamento de mensagens mais antigas
    hasMore: boolean;                 // False quando todas as mensagens antigas já foram carregadas
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>; // Permite atualizações otimistas externas
    handleScroll: (e: React.UIEvent<HTMLDivElement>) => void;     // Disparado pelo container de mensagens
    messagesContainerRef: React.RefObject<HTMLDivElement>;        // Ref do container para controle de scroll
    scrollToBottom: (behavior?: ScrollBehavior) => void;          // Função utilitária para rolar ao fim
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

/**
 * Hook que gerencia todas as mensagens de um chat específico.
 *
 * @param chatname         - Identificador único do chat (campo 'chatname' na tabela messages)
 * @param messageSearchQuery - Query de busca local (desativa scroll infinito durante a busca)
 */
export function useChatMessages(
    chatname: string,
    messageSearchQuery: string
): UseChatMessagesReturn {
    // ── Estado principal ──────────────────────────────────────────────────────
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);

    // ── Refs de controle (não causam re-render) ───────────────────────────────
    // Referência ao container de mensagens para manipular scrollTop
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    // Guarda a contagem anterior de mensagens para detectar novas chegadas
    const previousMessagesLength = useRef(0);

    // ─── Função: Rolar para o final da conversa ───────────────────────────────
    /**
     * Rola o container de mensagens até o final.
     * Só executa se não estiver em modo de loading ou busca, pois
     * nesses casos queremos manter a posição atual do scroll.
     *
     * @param behavior - 'smooth' para animado, 'auto' para instantâneo
     */
    const scrollToBottom = useCallback(
        (behavior: ScrollBehavior = 'auto') => {
            // Não rola automaticamente durante carregamento inicial, carregamento de mais mensagens
            // ou quando o usuário está buscando (para não interromper a navegação)
            if (!loading && !loadingMore && !messageSearchQuery && messagesContainerRef.current) {
                setTimeout(() => {
                    if (messagesContainerRef.current) {
                        // Adiciona um buffer generoso para garantir que suba até o último elemento
                        messagesContainerRef.current.scrollTo({
                            top: messagesContainerRef.current.scrollHeight + 500,
                            behavior,
                        });
                    }
                }, 50); // Delay mínimo para o DOM atualizar a altura antes de rolar
            }
        },
        [loading, loadingMore, messageSearchQuery]
    );

    // ─── Effect: Rolar ao fim quando novas mensagens chegarem ─────────────────
    useEffect(() => {
        // Só rola automaticamente se o número de mensagens aumentou (nova mensagem chegou)
        if (messages.length > previousMessagesLength.current) {
            if (!loadingMore && !loading && !messageSearchQuery) {
                scrollToBottom('smooth');
            }
        }
        // Atualiza a contagem para a próxima comparação
        previousMessagesLength.current = messages.length;
    }, [messages, loadingMore, loading, messageSearchQuery, scrollToBottom]);

    // ─── Effect principal: Busca inicial + Realtime ───────────────────────────
    useEffect(() => {
        /**
         * Busca as últimas MESSAGES_PER_PAGE mensagens do chat.
         * Ordena decrescentemente (mais novas primeiro) para pegar as mais recentes,
         * depois inverte para exibição cronológica (mais antigas em cima).
         */
        const fetchMessages = async () => {
            // Reseta todo o estado ao trocar de chat
            setLoading(true);
            setMessages([]);
            setHasMore(true);
            previousMessagesLength.current = 0;

            // Pequeno delay para evitar flash de conteúdo ao trocar de chat rapidamente
            await new Promise((resolve) => setTimeout(resolve, 500));

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chatname', chatname)
                .order('criado_em', { ascending: false }) // Mais novas primeiro (para pegar as últimas N)
                .limit(MESSAGES_PER_PAGE);

            if (error) {
                console.error('[useChatMessages] Erro ao buscar mensagens:', error);
            } else {
                // Inverte para exibir cronologicamente (mais antigas no topo, mais novas embaixo)
                const reversedData = data ? [...data].reverse() : [];
                setMessages(reversedData);

                // Se veio menos que o limite, não há mais páginas para carregar
                if (data && data.length < MESSAGES_PER_PAGE) {
                    setHasMore(false);
                }
            }

            setLoading(false);
            // Após carregar, rola para o final imediatamente (sem animação)
            setTimeout(() => scrollToBottom('auto'), 100);
        };

        fetchMessages();

        // ── Realtime: escuta novas mensagens em tempo real ──────────────────────
        /**
         * Inscreve no canal do Supabase Realtime para receber eventos em tempo real.
         *
         * INSERT: Nova mensagem chegou — tenta substituir mensagem otimista se houver,
         *         ou adiciona ao final se for genuinamente nova.
         *
         * UPDATE: Mensagem alterada (editada ou apagada) — substitui no estado local
         *         sem precisar de outro fetch.
         */
        const subscription = supabase
            .channel(`chat:${chatname}`) // Canal único por chat, evita conflito de canais
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chatname=eq.${chatname}`, // Filtra apenas mensagens deste chat
                },
                (payload) => {
                    const newMessage = payload.new as Message;

                    setMessages((prev) => {
                        /**
                         * Lógica de mensagem otimista:
                         * Quando o usuário envia uma mensagem, adicionamos um objeto temporário
                         * com id prefixado 'temp-' para dar feedback imediato.
                         * Quando o realtime confirma o INSERT, substituímos o temp pelo real.
                         * Isso evita duplicação (temp + real) na lista de mensagens.
                         */
                        const tempMatchIndex = prev.findIndex(
                            (m) =>
                                m.id.toString().startsWith('temp-') &&
                                m.text_message &&
                                newMessage.text_message &&
                                (m.text_message === newMessage.text_message ||
                                    newMessage.text_message.includes(m.text_message))
                        );

                        if (tempMatchIndex !== -1) {
                            // Substitui a mensagem otimista pela mensagem real confirmada pelo banco
                            const newMessages = [...prev];
                            newMessages.splice(tempMatchIndex, 1);
                            return [...newMessages, newMessage];
                        }

                        // Verifica se a mensagem já está na lista (evita duplicata em condições de corrida)
                        if (prev.some((m) => m.id === newMessage.id)) {
                            return prev;
                        }

                        // Adiciona a nova mensagem ao final da lista
                        return [...prev, newMessage];
                    });

                    // Força rolagem ao final quando chega mensagem em tempo real
                    scrollToBottom('smooth');
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `chatname=eq.${chatname}`,
                },
                (payload) => {
                    // Substitui a mensagem atualizada (edição ou deleção) no estado local
                    setMessages((prev) =>
                        prev.map((msg) =>
                            msg.id === (payload.new as Message).id ? (payload.new as Message) : msg
                        )
                    );
                }
            )
            .subscribe();

        // ── Cleanup: cancela a inscrição ao trocar de chat ou desmontar ──────────
        return () => {
            subscription.unsubscribe();
        };
    }, [chatname]); // Re-executa quando o chat muda (chatname é o identificador)

    // ─── Paginação: Carregar mensagens mais antigas ao rolar para cima ─────────
    /**
     * Função de scroll infinito reverso:
     * Quando o usuário chega ao topo do container, buscamos o próximo "lote"
     * de mensagens mais antigas e as inserimos no início do array.
     * Depois, restauramos a posição do scroll para o usuário não "pular".
     */
    const handleScroll = useCallback(
        async (e: React.UIEvent<HTMLDivElement>) => {
            // Desabilita paginação durante busca para não misturar contextos
            if (messageSearchQuery) return;

            const container = e.currentTarget;

            // Verifica se chegou ao topo (scrollTop === 0) e se pode carregar mais
            if (
                container.scrollTop === 0 &&
                !loadingMore &&
                !loading &&
                hasMore &&
                messages.length > 0
            ) {
                setLoadingMore(true);

                // Salva a altura atual do scroll para restaurar depois de inserir mensagens
                const currentScrollHeight = container.scrollHeight;

                // A mensagem mais antiga atualmente visível é o ponto de corte da paginação
                const oldestMessage = messages[0];

                try {
                    const { data, error } = await supabase
                        .from('messages')
                        .select('*')
                        .eq('chatname', chatname)
                        .lt('criado_em', oldestMessage.criado_em) // Busca mensagens anteriores à mais antiga atual
                        .order('criado_em', { ascending: false })
                        .limit(MESSAGES_PER_PAGE);

                    if (error) throw error;

                    if (data && data.length > 0) {
                        // Inverte para ordem cronológica e insere no início da lista
                        const olderMessages = [...data].reverse();
                        setMessages((prev) => [...olderMessages, ...prev]);

                        // Se veio menos que o limite, chegamos ao início da conversa
                        if (data.length < MESSAGES_PER_PAGE) {
                            setHasMore(false);
                        }

                        // Restaura a posição do scroll:
                        // A diferença entre a nova altura e a antiga é exatamente o espaço
                        // que as mensagens antigas ocuparam — posicionar o scroll ali mantém
                        // a mensagem que estava no topo visível após o carregamento.
                        setTimeout(() => {
                            if (messagesContainerRef.current) {
                                const newScrollHeight = messagesContainerRef.current.scrollHeight;
                                messagesContainerRef.current.scrollTop = newScrollHeight - currentScrollHeight;
                            }
                        }, 0);
                    } else {
                        // Não há mais mensagens antigas
                        setHasMore(false);
                    }
                } catch (err) {
                    console.error('[useChatMessages] Erro ao carregar mensagens antigas:', err);
                } finally {
                    setLoadingMore(false);
                }
            }
        },
        [chatname, hasMore, loading, loadingMore, messageSearchQuery, messages]
    );

    // ─── Retorno do hook ──────────────────────────────────────────────────────
    return {
        messages,
        loading,
        loadingMore,
        hasMore,
        setMessages,       // Exposto para atualizações otimistas no ChatWindow
        handleScroll,
        messagesContainerRef,
        scrollToBottom,
    };
}
