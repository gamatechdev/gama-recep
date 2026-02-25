import React, { useEffect, useRef, useState, useLayoutEffect } from 'react';
import { supabase } from '../../services/supabaseClient'; // Cliente Supabase canônico em services/
import { ChatTag, Message, User, Unidade } from '../../types'; // Tipos globais na raiz do projeto
import { AppointmentModal } from '../agenda/AppointmentModal'; // Modal de agendamento em components/agenda/

interface ChatWindowProps {
    chat: ChatTag;
    currentUser: User;
    onChatUpdate: () => void;
    onSelectChat: (chat: ChatTag) => void;
    onStartChat: (phone: string, name: string) => void;
}

interface PendingDocument {
    id: string;
    file: File;
    name: string;
}

const SECTORS = [
    { id: 1, name: 'Administrativo' },
    { id: 2, name: 'Medicina Ocupacional' },
    { id: 3, name: 'Segurança do Trabalho' },
    { id: 4, name: 'Tecnologia da Informação' },
    { id: 5, name: 'Comercial' },
];

const COMMON_EMOJIS = [
    '😀', '😃', '😄', '😁', '😆', '😅', '😂', '🤣', '😊', '😇',
    '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚',
    '😋', '😛', '😝', '😜', '🤪', '🤨', '🧐', '🤓', '😎', '🤩',
    '🥳', '😏', '😒', '😞', '😔', 'ww', '😕', '😟', '😣', '😖',
    '😫', '😩', '🥺', '😢', '😭', '😤', '😠', '😡', '🤬', '🤯',
    '😳', '🥵', '🥶', '😱', '😨', 'mw', '😥', '😓', '🤗', '🤔',
    '🤭', '🤫', '🤥', '😶', '😐', '😑', '😬', '😯', '😯',
    '👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉',
    '👆', '👇', '✋', '🤚', '🖐', '🖖', '👋', '👏', '🙌', '👐',
    '❤️', '🧡', '💛', '💚', '💜', '🖤', '🤍', '🤎', '💔',
    '✅', '❌', '🔥', '✨', '⭐', '🌟', '💫', '💥', '💯', '💢', '🤝'
];

const sanitizeFileName = (fileName: string) => {
    return fileName
        .normalize('NFD') // Split accents from letters
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/[^a-zA-Z0-9._-]/g, ''); // Remove any other special characters (like parentheses)
};

const formatTime = (seconds: number) => {
    if (!seconds || isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

// Helper to parse message text into appointment data
const parseMessageToAppointment = (text: string) => {
    if (!text) return null;

    const extract = (regex: RegExp) => {
        const match = text.match(regex);
        return match ? match[1].trim() : undefined;
    };

    // Parse DD/MM/YYYY to YYYY-MM-DD
    const parseDate = (dateStr?: string) => {
        if (!dateStr) return undefined;
        // Check if already YYYY-MM-DD
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) return dateStr;

        const parts = dateStr.split('/');
        if (parts.length === 3) {
            return `${parts[2]}-${parts[1]}-${parts[0]}`;
        }
        return undefined;
    };

    const nome = extract(/(?:Nome Completo:)\s*(.*)/i);
    const cpf = extract(/(?:CPF:)\s*(.*)/i);
    const data_nascimento = parseDate(extract(/(?:Data de Nascimento:)\s*(.*)/i));
    const cargo = extract(/(?:Cargo:)\s*(.*)/i);
    const setor = extract(/(?:Setor:)\s*(.*)/i);
    const empresa = extract(/(?:Empresa:)\s*(.*)/i);
    const data_agendamento = parseDate(extract(/(?:Data pretendida para agendamento:)\s*(.*)/i));

    // Try to detect selected exam type: "(X)Admissional" or just "Admissional"
    let tipo_exame = 'Admissional';
    const tipoLine = extract(/(?:Tipo de Exame:)\s*(.*)/i);

    if (tipoLine) {
        if (tipoLine.match(/\([xX]\)\s*Admissional/i) || tipoLine.includes('Admissional')) tipo_exame = 'Admissional';
        else if (tipoLine.match(/\([xX]\)\s*Periódico/i) || tipoLine.includes('Periódico')) tipo_exame = 'Periódico';
        else if (tipoLine.match(/\([xX]\)\s*Demissional/i) || tipoLine.includes('Demissional')) tipo_exame = 'Demissional';
        else if (tipoLine.match(/\([xX]\)\s*Mudança/i) || tipoLine.includes('Mudança')) tipo_exame = 'Mudança';
    }

    return {
        nome,
        cpf,
        data_nascimento,
        cargo,
        setor,
        empresa,
        data_agendamento,
        tipo_exame
    };
};


// --- AUDIO PLAYER COMPONENT (WhatsApp Style) ---
const AudioPlayer: React.FC<{ src: string; isOwn: boolean; senderPhoto: string }> = ({ src, isOwn, senderPhoto }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;

        const setAudioData = () => {
            if (audio.duration !== Infinity) {
                setDuration(audio.duration);
            }
        };

        const setAudioTime = () => {
            setCurrentTime(audio.currentTime);
        };

        const handleEnded = () => {
            setIsPlaying(false);
            setCurrentTime(0);
        };

        // Events
        audio.addEventListener('loadedmetadata', setAudioData);
        audio.addEventListener('durationchange', setAudioData); // Sometimes duration updates later
        audio.addEventListener('timeupdate', setAudioTime);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('loadedmetadata', setAudioData);
            audio.removeEventListener('durationchange', setAudioData);
            audio.removeEventListener('timeupdate', setAudioTime);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
        } else {
            audio.play();
        }
        setIsPlaying(!isPlaying);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const audio = audioRef.current;
        if (!audio) return;
        const time = Number(e.target.value);
        audio.currentTime = time;
        setCurrentTime(time);
    };

    return (
        <div className="flex items-center gap-4 min-w-[280px] p-1">
            {/* Avatar Section */}
            <div className="relative flex-shrink-0">
                <img
                    src={senderPhoto || 'https://ui-avatars.com/api/?name=User&background=random'}
                    alt="Sender"
                    className="w-14 h-14 rounded-full object-cover border-2 border-white/20"
                />
                <div className="absolute bottom-0 right-0">
                    <svg className={`w-5 h-5 drop-shadow-md ${isOwn ? 'text-white/80' : 'text-slate-500 dark:text-slate-300'}`} fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z" />
                        <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    </svg>
                </div>
            </div>

            {/* Controls Section */}
            <div className="flex items-center gap-3 flex-1">
                {/* Play/Pause Button */}
                <button
                    onClick={togglePlay}
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${isOwn ? 'text-white/90 hover:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-300 dark:hover:text-white'
                        }`}
                >
                    {isPlaying ? (
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                    ) : (
                        <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                        </svg>
                    )}
                </button>

                {/* Slider & Timer */}
                <div className="flex flex-col justify-center flex-1 min-w-0">
                    <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer focus:outline-none ${isOwn ? 'bg-[#149890]/40 accent-white' : 'bg-slate-300 dark:bg-white/20 accent-[#04a7bd]'
                            }`}
                        style={{
                            backgroundImage: isOwn
                                ? `linear-gradient(to right, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.8) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) ${(currentTime / duration) * 100}%, rgba(255,255,255,0.2) 100%)`
                                : undefined
                        }}
                    />
                    <div className={`text-[11px] mt-1 font-medium ${isOwn ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>
                        {formatTime(currentTime)}
                    </div>
                </div>
            </div>

            <audio ref={audioRef} src={src} preload="metadata" />
        </div>
    );
};

// --- PIX MESSAGE COMPONENT ---
const PixCard: React.FC<{ pixKey: string; keyType: string; merchantName?: string; isOwn: boolean }> = ({ pixKey, keyType, merchantName, isOwn }) => {
    const handleCopy = () => {
        navigator.clipboard.writeText(pixKey);
        alert('Chave PIX copiada!');
    };

    return (
        <div className={`p-4 rounded-xl max-w-sm ${isOwn ? 'bg-white/10 text-white' : 'bg-slate-50 dark:bg-[#1c1c1e] text-slate-800 dark:text-white'}`}>
            <div className="flex items-center gap-3 mb-3 border-b border-current/10 pb-2">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isOwn ? 'bg-white text-[#04a7bd]' : 'bg-[#04a7bd] text-white'}`}>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                </div>
                <div>
                    <h3 className="font-bold text-sm leading-tight">Pagamento via PIX</h3>
                    {merchantName && <p className="text-xs opacity-80">{merchantName}</p>}
                </div>
            </div>

            <div className="mb-3">
                <p className="text-[10px] uppercase tracking-wide opacity-70 mb-1">Chave {keyType || 'PIX'}</p>
                <div className={`p-2 rounded-lg font-mono text-sm break-all ${isOwn ? 'bg-black/20' : 'bg-slate-200 dark:bg-white/10'}`}>
                    {pixKey}
                </div>
            </div>

            <button
                onClick={handleCopy}
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2 ${isOwn
                        ? 'bg-white text-[#04a7bd] hover:bg-white/90'
                        : 'bg-[#04a7bd] text-white hover:bg-[#149890]'
                    }`}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
                </svg>
                Copiar Chave
            </button>
        </div>
    );
};

// --- CONTACT CARD COMPONENT ---
const ContactCard: React.FC<{
    displayName: string;
    phoneNumber?: string;
    isOwn: boolean;
    onStartChat: (phone: string, name: string) => void;
}> = ({ displayName, phoneNumber, isOwn, onStartChat }) => {
    return (
        <div className={`p-3 rounded-xl min-w-[240px] max-w-sm ${isOwn ? 'bg-white/10 text-white' : 'bg-slate-50 dark:bg-[#1c1c1e] text-slate-800 dark:text-white'}`}>
            <div className="flex items-center gap-3 mb-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold flex-shrink-0 ${isOwn ? 'bg-white text-[#04a7bd]' : 'bg-slate-300 dark:bg-slate-600 text-white'}`}>
                    {displayName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                    <h3 className="font-bold text-sm leading-tight truncate">{displayName}</h3>
                    {phoneNumber && <p className="text-xs opacity-70 truncate">{phoneNumber}</p>}
                </div>
            </div>

            <button
                onClick={() => phoneNumber && onStartChat(phoneNumber, displayName)}
                disabled={!phoneNumber}
                className={`w-full py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isOwn
                        ? 'bg-white/20 hover:bg-white/30 text-white'
                        : 'bg-slate-200 dark:bg-white/10 hover:bg-slate-300 dark:hover:bg-white/20'
                    }`}>
                Conversar
            </button>
        </div>
    );
};


export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, currentUser, onChatUpdate, onSelectChat, onStartChat }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(true);
    const [inputText, setInputText] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]); // List of all users for task assignment

    // Search State
    const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
    const [messageSearchQuery, setMessageSearchQuery] = useState('');

    // Pagination State
    const [loadingMore, setLoadingMore] = useState(false);
    const [hasMore, setHasMore] = useState(true);
    const MESSAGES_PER_PAGE = 40;

    // Menu States
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Header action menu
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false); // Quick Actions Menu
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false); // Attachment menu
    const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false); // Emoji menu
    const [updatingChat, setUpdatingChat] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Audio Recording States
    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const recordingTimerRef = useRef<number | null>(null);

    // Message Action States
    const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');
    const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null); // State for replying

    // Delete States
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [msgToDelete, setMsgToDelete] = useState<Message | null>(null);

    // Task Creation States
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [taskForm, setTaskForm] = useState({
        title: '',
        description: '',
        dueDate: '',
        responsibleId: '',
        g: 1,
        u: 1,
        t: 1
    });

    // Appointment Modal State
    const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
    const [appointmentInitialData, setAppointmentInitialData] = useState<any>(null);

    // Unit Selection Modal (Link Generation)
    const [isUnitSelectionOpen, setIsUnitSelectionOpen] = useState(false);
    const [units, setUnits] = useState<Unidade[]>([]);
    const [selectedUnitForLink, setSelectedUnitForLink] = useState('');

    // Image Preview States
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageCaption, setImageCaption] = useState('');

    // Document Preview States
    const [selectedDocs, setSelectedDocs] = useState<PendingDocument[]>([]);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);

    // Contact Picker States
    const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
    const [allContacts, setAllContacts] = useState<ChatTag[]>([]);
    const [contactSearchQuery, setContactSearchQuery] = useState('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null); // For Images
    const docInputRef = useRef<HTMLInputElement>(null); // For PDFs
    const previousMessagesLength = useRef(0);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Fetch Users for Task assignment and Units for Link generation
    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase.from('users').select('*');
            if (data) setAllUsers(data as User[]);
        };

        const fetchUnits = async () => {
            const { data } = await supabase.from('unidades').select('id, nome_unidade');
            if (data) setUnits(data as Unidade[]);
        };

        fetchUsers();
        fetchUnits();
    }, []);

    // Helper to format text with **bold** support AND highlight search query
    const renderFormattedText = (text: string, query: string) => {
        if (!text) return null;

        // First, handle bold split
        const parts = text.split(/(\*\*.*?\*\*)/g);

        return parts.map((part, index) => {
            let content = part;
            let isBold = false;

            if (part.startsWith('**') && part.endsWith('**')) {
                content = part.slice(2, -2);
                isBold = true;
            }

            // If there's a search query, highlight matches
            if (query.trim()) {
                const regex = new RegExp(`(${query})`, 'gi');
                const splitByQuery = content.split(regex);

                return (
                    <span key={index} className={isBold ? "font-bold" : ""}>
                        {splitByQuery.map((subPart, subIndex) =>
                            regex.test(subPart) ? (
                                <span key={subIndex} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5">{subPart}</span>
                            ) : (
                                <span key={subIndex}>{subPart}</span>
                            )
                        )}
                    </span>
                );
            }

            return isBold ? <span key={index} className="font-bold">{content}</span> : <span key={index}>{content}</span>;
        });
    };

    // Improved scroll to bottom logic
    const scrollToBottom = (behavior: ScrollBehavior = 'auto') => {
        // Only scroll if we are NOT searching and NOT loading more
        if (!loading && !loadingMore && !messageSearchQuery && messagesContainerRef.current) {
            // Use a very short timeout to ensure DOM has rendered new height but feels instant
            setTimeout(() => {
                if (messagesContainerRef.current) {
                    const maxScroll = messagesContainerRef.current.scrollHeight;
                    messagesContainerRef.current.scrollTo({
                        top: maxScroll + 500, // Add generous buffer to ensure it hits the limit
                        behavior: behavior
                    });
                }
            }, 50); // Reduced delay for snappier feel
        }
    };

    // Effect to scroll on new messages (but not when loading history or searching)
    useEffect(() => {
        if (messages.length > previousMessagesLength.current) {
            // If we are NOT loading more and NOT searching
            if (!loadingMore && !loading && !messageSearchQuery) {
                scrollToBottom('smooth');
            }
        }
        previousMessagesLength.current = messages.length;
    }, [messages, loadingMore, loading, messageSearchQuery]);

    // Initial Fetch (Last 40 messages)
    useEffect(() => {
        const fetchMessages = async () => {
            setLoading(true);
            setMessages([]);
            setHasMore(true);
            setMessageSearchQuery(''); // Reset search on new chat
            setIsMessageSearchOpen(false);
            setIsQuickActionsOpen(false);
            setReplyingToMessage(null); // Clear reply state
            previousMessagesLength.current = 0;

            // Artificial delay reduced to 0.5s
            await new Promise(resolve => setTimeout(resolve, 500));

            // Fetch last 40 messages (descending order by creation date)
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('chatname', chat.chatname)
                .order('criado_em', { ascending: false }) // Get newest first
                .limit(MESSAGES_PER_PAGE);

            if (error) {
                console.error('Error fetching messages:', error);
            } else {
                // Reverse to display chronologically (oldest at top, newest at bottom)
                const reversedData = data ? [...data].reverse() : [];
                setMessages(reversedData);
                if (data && data.length < MESSAGES_PER_PAGE) {
                    setHasMore(false);
                }
            }
            setLoading(false);
            // Scroll to absolute bottom after loading to create the "descend" animation effect
            setTimeout(() => scrollToBottom('auto'), 100);
        };

        fetchMessages();

        // Subscribe to new messages for this chat
        const subscription = supabase
            .channel(`chat:${chat.chatname}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `chatname=eq.${chat.chatname}`,
                },
                (payload) => {
                    const newMessage = payload.new as Message;

                    setMessages((prev) => {
                        // MATCHING LOGIC:
                        const tempMatchIndex = prev.findIndex(
                            m => m.id.toString().startsWith('temp-') &&
                                m.text_message &&
                                newMessage.text_message &&
                                (
                                    m.text_message === newMessage.text_message ||
                                    newMessage.text_message.includes(m.text_message)
                                )
                        );

                        if (tempMatchIndex !== -1) {
                            const newMessages = [...prev];
                            newMessages.splice(tempMatchIndex, 1);
                            return [...newMessages, newMessage];
                        }

                        if (prev.some(m => m.id === newMessage.id)) {
                            return prev;
                        }

                        return [...prev, newMessage];
                    });

                    // Force scroll on real-time update
                    scrollToBottom('smooth');
                }
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages',
                    filter: `chatname=eq.${chat.chatname}`,
                },
                (payload) => {
                    setMessages((prev) => prev.map(msg =>
                        msg.id === (payload.new as Message).id ? (payload.new as Message) : msg
                    ));
                }
            )
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    }, [chat.chatname]);

    // Handle Scroll (Load More)
    const handleScroll = async (e: React.UIEvent<HTMLDivElement>) => {
        // Disable infinite scroll while searching to avoid UX conflicts
        if (messageSearchQuery) return;

        const container = e.currentTarget;

        // If scrolled to top and not loading and has more messages
        if (container.scrollTop === 0 && !loadingMore && !loading && hasMore && messages.length > 0) {
            setLoadingMore(true);
            const currentScrollHeight = container.scrollHeight;
            const oldestMessage = messages[0];

            try {
                const { data, error } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('chatname', chat.chatname)
                    .lt('criado_em', oldestMessage.criado_em) // Get messages older than the current oldest
                    .order('criado_em', { ascending: false })
                    .limit(MESSAGES_PER_PAGE);

                if (error) throw error;

                if (data && data.length > 0) {
                    const olderMessages = [...data].reverse();
                    setMessages(prev => [...olderMessages, ...prev]);

                    // If we fetched fewer than requested, we reached the beginning
                    if (data.length < MESSAGES_PER_PAGE) {
                        setHasMore(false);
                    }

                    // Restore scroll position
                    // Wait for DOM update
                    setTimeout(() => {
                        if (messagesContainerRef.current) {
                            const newScrollHeight = messagesContainerRef.current.scrollHeight;
                            messagesContainerRef.current.scrollTop = newScrollHeight - currentScrollHeight;
                        }
                    }, 0);
                } else {
                    setHasMore(false);
                }
            } catch (err) {
                console.error("Error loading older messages", err);
            } finally {
                setLoadingMore(false);
            }
        }
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const messageText = inputText;

        // Create optimistic message
        const optimisticMessage: Message = {
            id: 'temp-' + Date.now(),
            chatname: chat.chatname,
            text_message: messageText,
            status: 'SENT', // Default to SENT for local display
            criado_em: new Date().toISOString(),
            enviado_por: currentUser.user_id, // Mark as sent by current user
            is_img: false,
            img_path: '',
            audio_url: '',
            sender_lid: 'me',
            raw_payload: replyingToMessage ? { referenceMessageId: replyingToMessage.message_id } : undefined
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setInputText('');
        setReplyingToMessage(null); // Clear reply state
        scrollToBottom('smooth');

        // Send to Z-API
        if (chat.phone) {
            try {
                const zApiPayload: any = {
                    phone: chat.phone,
                    message: `*${currentUser.username}:*\n\n${messageText}`
                };

                // If responding to a message, add messageId to payload
                if (replyingToMessage && replyingToMessage.message_id) {
                    zApiPayload.messageId = replyingToMessage.message_id;
                }

                const response = await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-text", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Client-Token": "F53f53bad10a9494f92d5e33804220a26S"
                    },
                    body: JSON.stringify(zApiPayload)
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error("Z-API Error:", errorText);
                }
            } catch (apiError) {
                console.error("Failed to send to Z-API", apiError);
            }
        } else {
            console.warn("No phone number found for this chat. Z-API request skipped.");
        }
    };

    // --- QUICK ACTIONS HANDLER ---
    const handleSendSchedulingRequest = async () => {
        setIsQuickActionsOpen(false);
        if (!chat.phone) {
            alert("Este contato não possui número de telefone.");
            return;
        }

        const templateMessage = `*${currentUser.username}:*\n\nMe envie os seguintes dados do colaborador:\n\nNome Completo:\nCPF:\nData de Nascimento:\nCargo:\nSetor:\nTipo de Exame: (  )Admissional  (  )Periódico  (  )Demissional   (  ) Mudança De Riscos\nCNPJ:\nEmpresa:\nData pretendida para agendamento:`;

        // Optimistic Update
        const optimisticMessage: Message = {
            id: 'temp-' + Date.now(),
            chatname: chat.chatname,
            text_message: templateMessage.replace(`*${currentUser.username}:*\n\n`, ''), // Display without header locally if desired, or full text
            status: 'SENT',
            criado_em: new Date().toISOString(),
            enviado_por: currentUser.user_id,
            is_img: false,
            img_path: '',
            audio_url: '',
            sender_lid: 'me'
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        scrollToBottom('smooth');

        try {
            const response = await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-text", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Client-Token": "F53f53bad10a9494f92d5e33804220a26S"
                },
                body: JSON.stringify({
                    phone: chat.phone,
                    message: templateMessage
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Z-API Scheduling Error:", errorText);
                alert("Erro ao enviar solicitação de agendamento.");
            }
        } catch (error) {
            console.error("Failed to send scheduling request", error);
            alert("Falha de conexão.");
        }
    };

    const handleSendPrefeituraRequest = async () => {
        setIsQuickActionsOpen(false);
        if (!chat.phone) {
            alert("Este contato não possui número de telefone.");
            return;
        }

        const message1 = `*${currentUser.username}:*\n\nNome Completo:\nCPF:\nData de Nascimento:\nCargo: Professor\nSetor: Educação\nTipo de Exame: ( X )Admissional  (  )Periódico  (  )Demissional   (  ) Mudança De Riscos\nCNPJ: Não se aplica\nEmpresa: Prefeitura de Congonhas\nData pretendida para agendamento: `;
        const message2 = `*${currentUser.username}:*\n\nEi, *${chat.chatname}*, preenche os campos que faltam na mensagem pra gente te agendar.\nLembrando que os atendimentos são no turno da manhã, por ordem de chegada`;

        // Optimistic Updates
        const optMsg1: Message = {
            id: 'temp-' + Date.now(),
            chatname: chat.chatname,
            text_message: message1,
            status: 'SENT',
            criado_em: new Date().toISOString(),
            enviado_por: currentUser.user_id,
            is_img: false,
            sender_lid: 'me'
        };
        const optMsg2: Message = {
            id: 'temp-' + (Date.now() + 1),
            chatname: chat.chatname,
            text_message: message2,
            status: 'SENT',
            criado_em: new Date().toISOString(),
            enviado_por: currentUser.user_id,
            is_img: false,
            sender_lid: 'me'
        };

        setMessages((prev) => [...prev, optMsg1, optMsg2]);
        scrollToBottom('smooth');

        const headers = {
            "Content-Type": "application/json",
            "Client-Token": "F53f53bad10a9494f92d5e33804220a26S"
        };

        try {
            // Request 1
            await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-text", {
                method: "POST",
                headers,
                body: JSON.stringify({ phone: chat.phone, message: message1 })
            });

            // Request 2
            await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-text", {
                method: "POST",
                headers,
                body: JSON.stringify({ phone: chat.phone, message: message2 })
            });

        } catch (error) {
            console.error("Failed to send prefeitura requests", error);
            alert("Erro ao enviar mensagens.");
        }
    };

    const handleOpenUnitSelection = () => {
        setIsQuickActionsOpen(false);
        setIsUnitSelectionOpen(true);
        setSelectedUnitForLink('');
    };

    const handleSendSchedulingLink = async () => {
        if (!selectedUnitForLink) {
            alert("Selecione uma unidade.");
            return;
        }

        setIsUnitSelectionOpen(false);

        if (!chat.phone) return;

        const unit = units.find(u => u.id.toString() === selectedUnitForLink);
        const unitName = unit ? unit.nome_unidade : "Gama Center";

        // Construct URL using query parameters to avoid 404s on Vercel
        // Example: https://gama-talk.vercel.app/?mode=agendar&unidade_id=...
        const schedulingUrl = `https://gama-talk.vercel.app/?mode=agendar&unidade_id=${selectedUnitForLink}&phone=${chat.phone.replace(/[^0-9]/g, '')}`;

        const messageBody = `*${currentUser.username}:*\n\nSegue o link para realização do agendamento (${unitName}):\n\n${schedulingUrl}`;

        // Optimistic Message
        const optimisticMessage: Message = {
            id: 'temp-' + Date.now(),
            chatname: chat.chatname,
            text_message: messageBody,
            status: 'SENT',
            criado_em: new Date().toISOString(),
            enviado_por: currentUser.user_id,
            is_img: false,
            img_path: '',
            audio_url: '',
            sender_lid: 'me'
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        scrollToBottom('smooth');

        try {
            const response = await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-text", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Client-Token": "F53f53bad10a9494f92d5e33804220a26S"
                },
                body: JSON.stringify({
                    phone: chat.phone,
                    message: messageBody
                })
            });

            if (!response.ok) {
                console.error("API Error sending link", await response.text());
                alert("Erro ao enviar link.");
            }
        } catch (e) {
            console.error(e);
            alert("Erro de conexão.");
        }
    };

    const handleSendPix = async () => {
        setIsQuickActionsOpen(false);
        if (!chat.phone) {
            alert("Este contato não possui número de telefone.");
            return;
        }

        const messageBody = `*${currentUser.username}:*\n\nSegue a chave PIX para pagamento:`;

        // Optimistic Update
        const optimisticMessage: Message = {
            id: 'temp-' + Date.now(),
            chatname: chat.chatname,
            text_message: messageBody,
            status: 'SENT',
            criado_em: new Date().toISOString(),
            enviado_por: currentUser.user_id,
            is_img: false,
            img_path: '',
            audio_url: '',
            sender_lid: 'me',
            raw_payload: {
                pixKeyMessage: {
                    key: "52620502000119",
                    keyType: "EVP",
                    merchantName: "Gama Center"
                }
            }
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        scrollToBottom('smooth');

        try {
            const response = await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-button-pix", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Client-Token": "F53f53bad10a9494f92d5e33804220a26S"
                },
                body: JSON.stringify({
                    phone: chat.phone,
                    pixKey: "52620502000119",
                    type: "EVP"
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Z-API PIX Error:", errorText);
                alert("Erro ao enviar PIX.");
            }
        } catch (error) {
            console.error("Failed to send PIX", error);
            alert("Falha de conexão.");
        }
    };

    const handleSendAddress = async () => {
        setIsQuickActionsOpen(false);
        if (!chat.phone) {
            alert("Este contato não possui número de telefone.");
            return;
        }

        const messageBody = `*${currentUser.username}:*\n\nNossa empresa, *Gama Center – Saúde e Engenharia do Trabalho*, fica localizada na *Rua Barão de Pouso Alegre, 90, São Sebastião, Conselheiro Lafaiete (ao lado da Igreja São Sebastião)*.\n\nSe precisar de ajuda para chegar, é só chamar!`;

        // Optimistic Update
        const optimisticMessage: Message = {
            id: 'temp-' + Date.now(),
            chatname: chat.chatname,
            text_message: messageBody,
            status: 'SENT',
            criado_em: new Date().toISOString(),
            enviado_por: currentUser.user_id,
            is_img: false,
            img_path: '',
            audio_url: '',
            sender_lid: 'me'
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        scrollToBottom('smooth');

        try {
            const response = await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-text", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Client-Token": "F53f53bad10a9494f92d5e33804220a26S"
                },
                body: JSON.stringify({
                    phone: chat.phone,
                    message: messageBody
                })
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Z-API Address Error:", errorText);
                alert("Erro ao enviar endereço.");
            }
        } catch (error) {
            console.error("Failed to send address", error);
            alert("Falha de conexão.");
        }
    };


    const handleUpdateTag = async (newTag: number) => {
        setUpdatingChat(true);
        setIsMenuOpen(false);
        try {
            const { error } = await supabase
                .from('chat_tags')
                .update({ tag: newTag })
                .eq('chatname', chat.chatname);

            if (error) throw error;

            // Notify parent to refresh list and close chat window
            onChatUpdate();

        } catch (err) {
            console.error("Error updating tag:", err);
            alert("Não foi possível atualizar o atendimento. Tente novamente.");
        } finally {
            setUpdatingChat(false);
        }
    };

    // --- AUDIO RECORDING HANDLERS ---
    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            // When stopping, trigger upload
            mediaRecorder.onstop = () => {
                // Create blob with webm type (common for browsers)
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                handleUploadAndSendAudio(audioBlob);

                // Stop all tracks to release mic
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);

            // Start timer
            recordingTimerRef.current = window.setInterval(() => {
                setRecordingDuration(prev => prev + 1);
            }, 1000);

        } catch (err) {
            console.error("Error accessing microphone:", err);
            alert("Erro ao acessar microfone. Verifique as permissões.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            // UI updates handled in onstop event, but we clear timer here
            setIsRecording(false);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        }
    };

    const handleCancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            // Stop but override the onstop behavior (or just don't handle the data)
            mediaRecorderRef.current.onstop = null; // Remove handler to prevent upload
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());

            setIsRecording(false);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            audioChunksRef.current = [];
        }
    };

    const handleUploadAndSendAudio = async (audioBlob: Blob) => {
        if (!chat.phone) return;
        setIsUploading(true);

        try {
            // 1. Upload to Supabase (Bucket: wpp_gama, Folder: pictures - per instruction)
            const fileName = `pictures/audio_${Date.now()}.webm`;

            const { error: uploadError } = await supabase.storage
                .from('wpp_gama')
                .upload(fileName, audioBlob, {
                    contentType: 'audio/webm'
                });

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: urlData } = supabase.storage
                .from('wpp_gama')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;

            // 3. Send to Z-API
            const zApiPayload = {
                phone: chat.phone,
                audio: publicUrl,
                viewOnce: false,
                waveform: true
            };

            const response = await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-audio", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Client-Token": "F53f53bad10a9494f92d5e33804220a26S"
                },
                body: JSON.stringify(zApiPayload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.error("Z-API Audio Error:", errText);
                throw new Error("Erro na API de envio");
            }

        } catch (error) {
            console.error("Error uploading/sending audio:", error);
            alert("Falha ao enviar áudio.");
        } finally {
            setIsUploading(false);
        }
    };


    // --- MESSAGE ACTIONS (EDIT / DELETE / TASK / APPOINTMENT / REPLY) ---

    const handleReplyClick = (msg: Message) => {
        setActiveMessageMenuId(null);
        setReplyingToMessage(msg);
        textareaRef.current?.focus();
    };

    const handleEditClick = (msg: Message) => {
        if (!msg.message_id) {
            alert("Não é possível editar esta mensagem ainda (ID não gerado).");
            return;
        }
        setEditingMessageId(msg.id);
        setEditContent(msg.text_message);
        setActiveMessageMenuId(null);
    };

    const handleSaveEdit = async (msg: Message) => {
        if (!editContent.trim() || !chat.phone || !msg.message_id) return;
        const oldContent = msg.text_message;
        const newContent = editContent;

        // Optimistic update
        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, text_message: newContent } : m));
        setEditingMessageId(null);

        try {
            // 1. Z-API Edit Request
            const response = await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-text", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Client-Token": "F53f53bad10a9494f92d5e33804220a26S"
                },
                body: JSON.stringify({
                    phone: chat.phone,
                    message: newContent,
                    editMessageId: msg.message_id
                })
            });

            if (!response.ok) throw new Error("Falha na API");

            // 2. Update Supabase
            const { error } = await supabase
                .from('messages')
                .update({ text_message: newContent })
                .eq('message_id', msg.message_id);

            if (error) throw error;

        } catch (error) {
            console.error("Erro ao editar:", error);
            alert("Falha ao editar mensagem. Revertendo...");
            // Revert optimistic update
            setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, text_message: oldContent } : m));
        }
    };

    const handleDeleteClick = (msg: Message) => {
        if (!msg.message_id || !chat.phone) return;
        setMsgToDelete(msg);
        setDeleteModalOpen(true);
        setActiveMessageMenuId(null);
    };

    const confirmDeleteMessage = async () => {
        if (!msgToDelete || !chat.phone || !msgToDelete.message_id) return;

        const previousMessages = [...messages];
        // Optimistic update
        setMessages(prev => prev.map(m => m.id === msgToDelete.id ? { ...m, text_message: "Mensagem Apagada" } : m));
        setDeleteModalOpen(false);

        try {
            // 1. Z-API Delete Request
            const deleteUrl = `https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/messages?messageId=${msgToDelete.message_id}&Phone=${chat.phone}&owner=true`;

            const response = await fetch(deleteUrl, {
                method: "DELETE",
                headers: {
                    "Client-Token": "F53f53bad10a9494f92d5e33804220a26S"
                }
            });

            if (!response.ok) throw new Error("Falha na API");

            // 2. Update Supabase
            const { error } = await supabase
                .from('messages')
                .update({ text_message: "Mensagem Apagada" })
                .eq('message_id', msgToDelete.message_id);

            if (error) throw error;

        } catch (error) {
            console.error("Erro ao apagar:", error);
            alert("Erro ao apagar mensagem.");
            setMessages(previousMessages);
        } finally {
            setMsgToDelete(null);
        }
    };

    // --- TASK CREATION HANDLERS ---
    const handleOpenTaskModal = (msg: Message) => {
        setActiveMessageMenuId(null);
        setTaskForm({
            title: msg.text_message || 'Nova Tarefa',
            description: '',
            dueDate: '',
            responsibleId: currentUser.user_id || '', // Default to current user
            g: 1,
            u: 1,
            t: 1
        });
        setTaskModalOpen(true);
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskForm.title || !taskForm.dueDate || !taskForm.responsibleId) {
            alert("Preencha os campos obrigatórios.");
            return;
        }

        try {
            const { error } = await supabase.from('kanban').insert({
                titulo: taskForm.title,
                descricao: taskForm.description,
                responsavel: taskForm.responsibleId,
                status: 'A fazer',
                pai: currentUser.sector, // Use current user sector as 'pai'
                datadeentrega: new Date(taskForm.dueDate).toISOString(),
                G: taskForm.g,
                U: taskForm.u,
                T: taskForm.t,
                score: taskForm.g * taskForm.u * taskForm.t
            });

            if (error) throw error;

            alert("Tarefa criada com sucesso!");
            setTaskModalOpen(false);

        } catch (err: any) {
            console.error("Error creating task:", err);
            alert(`Erro ao criar tarefa: ${err.message}`);
        }
    };

    // --- APPOINTMENT CREATION HANDLERS ---
    const handleOpenAppointmentModal = (msg: Message) => {
        setActiveMessageMenuId(null);
        const parsedData = parseMessageToAppointment(msg.text_message);
        setAppointmentInitialData(parsedData);
        setAppointmentModalOpen(true);
    };

    // --- CONTACT HANDLING ---
    const handleContactSelect = async () => {
        setIsAttachmentMenuOpen(false);
        setIsContactPickerOpen(true);
        setLoading(true);
        // Fetch contacts from chat_tags
        const { data } = await supabase.from('chat_tags').select('*').limit(50);
        if (data) setAllContacts(data as ChatTag[]);
        setLoading(false);
    };

    const handleSendContact = async (contact: ChatTag) => {
        if (!chat.phone) return;
        setIsContactPickerOpen(false);

        const contactName = contact.chatname;
        const contactPhone = contact.phone;

        // Optimistic UI for Contact Card
        const optimisticMessage: Message = {
            id: 'temp-' + Date.now(),
            chatname: chat.chatname,
            text_message: '',
            status: 'SENT',
            criado_em: new Date().toISOString(),
            enviado_por: currentUser.user_id,
            is_img: false,
            sender_lid: 'me',
            raw_payload: {
                contactMessage: {
                    displayName: contactName,
                    phoneNumber: contactPhone
                }
            }
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        scrollToBottom('smooth');

        try {
            const response = await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-contact", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Client-Token": "F53f53bad10a9494f92d5e33804220a26S"
                },
                body: JSON.stringify({
                    phone: chat.phone,
                    contactName: contactName,
                    contactPhone: contactPhone
                })
            });

            if (!response.ok) {
                console.error("Failed to send contact via Z-API", await response.text());
                alert("Erro ao enviar contato.");
            }

        } catch (err) {
            console.error(err);
            alert("Falha de conexão.");
        }
    };

    const filteredContacts = allContacts.filter(c =>
        c.chatname.toLowerCase().includes(contactSearchQuery.toLowerCase()) ||
        (c.phone && c.phone.includes(contactSearchQuery))
    );


    // --- ATTACHMENT HANDLERS ---

    const handleAttachmentClick = () => {
        setIsAttachmentMenuOpen(!isAttachmentMenuOpen);
        setIsEmojiMenuOpen(false); // Close emoji if open
    };

    const handleEmojiClick = () => {
        setIsEmojiMenuOpen(!isEmojiMenuOpen);
        setIsAttachmentMenuOpen(false); // Close attachment if open
    };

    const handleAddEmoji = (emoji: string) => {
        setInputText(prev => prev + emoji);
    };

    // --- IMAGE HANDLING ---
    const handleImageSelect = () => {
        fileInputRef.current?.click();
        setIsAttachmentMenuOpen(false);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!chat.phone) {
            alert("Erro: Este contato não possui um número de telefone associado.");
            return;
        }

        // Create a local preview URL
        const objectUrl = URL.createObjectURL(file);
        setSelectedFile(file);
        setPreviewUrl(objectUrl);
        setImageCaption(''); // Reset caption

        // Clear input so selecting the same file works again if needed
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Paste Handler for Images
    const handlePaste = (e: React.ClipboardEvent) => {
        if (!e.clipboardData || !e.clipboardData.items) return;

        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault(); // Prevent text paste behavior for images

                if (!chat.phone) {
                    alert("Erro: Este contato não possui um número de telefone associado.");
                    return;
                }

                const file = items[i].getAsFile();
                if (file) {
                    const objectUrl = URL.createObjectURL(file);
                    setSelectedFile(file);
                    setPreviewUrl(objectUrl);
                    setImageCaption('');
                }
                return; // Stop after finding the first image
            }
        }
    };

    const handleCancelPreview = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setSelectedFile(null);
        setImageCaption('');
    };

    const handleConfirmSendImage = async () => {
        if (!selectedFile || !chat.phone) return;

        setIsUploading(true);

        try {
            // 1. Upload to Supabase Storage
            const sanitizedName = sanitizeFileName(selectedFile.name);
            const fileName = `pictures/${Date.now()}_${sanitizedName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('wpp_gama')
                .upload(fileName, selectedFile);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: urlData } = supabase.storage
                .from('wpp_gama')
                .getPublicUrl(fileName);

            const publicUrl = urlData.publicUrl;

            // 3. Send to Z-API
            const zApiPayload = {
                phone: chat.phone,
                image: publicUrl,
                caption: imageCaption, // Use the caption from input
                viewOnce: false
            };

            const response = await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-image", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Client-Token": "F53f53bad10a9494f92d5e33804220a26S"
                },
                body: JSON.stringify(zApiPayload)
            });

            if (response.ok) {
                // Success
                handleCancelPreview();
            } else {
                console.error("Z-API Image Upload Error", await response.text());
                alert("Erro ao enviar imagem. Verifique o console.");
            }

        } catch (error: any) {
            console.error("Error sending image:", error);
            alert("Falha ao enviar imagem: " + (error.message || "Erro desconhecido"));
        } finally {
            setIsUploading(false);
        }
    };

    // --- DOCUMENT HANDLING ---

    const handleDocSelect = () => {
        docInputRef.current?.click();
        setIsAttachmentMenuOpen(false);
    };

    const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        if (!chat.phone) {
            alert("Erro: Este contato não possui um número de telefone associado.");
            return;
        }

        const newDocs: PendingDocument[] = (Array.from(files) as File[]).map(file => ({
            id: Math.random().toString(36).substr(2, 9),
            file: file,
            name: file.name.split('.').slice(0, -1).join('.') // Name without extension
        }));

        setSelectedDocs(prev => [...prev, ...newDocs]);
        setIsDocModalOpen(true);

        // Clear input
        if (docInputRef.current) docInputRef.current.value = '';
    };

    const handleRemoveDoc = (id: string) => {
        setSelectedDocs(prev => {
            const newState = prev.filter(doc => doc.id !== id);
            if (newState.length === 0) setIsDocModalOpen(false);
            return newState;
        });
    };

    const handleDocNameChange = (id: string, newName: string) => {
        setSelectedDocs(prev => prev.map(doc => doc.id === id ? { ...doc, name: newName } : doc));
    };

    const handleCancelDocPreview = () => {
        setSelectedDocs([]);
        setIsDocModalOpen(false);
    };

    const handleConfirmSendDocuments = async () => {
        if (selectedDocs.length === 0 || !chat.phone) return;
        setIsUploading(true);

        try {
            for (const doc of selectedDocs) {
                // 1. Upload
                const sanitizedName = sanitizeFileName(doc.file.name);
                const fileName = `documents/${Date.now()}_${sanitizedName}`;

                const { error: uploadError } = await supabase.storage
                    .from('wpp_gama')
                    .upload(fileName, doc.file);

                if (uploadError) throw uploadError;

                // 2. Get URL
                const { data: urlData } = supabase.storage
                    .from('wpp_gama')
                    .getPublicUrl(fileName);

                const publicUrl = urlData.publicUrl;
                const extension = doc.file.name.split('.').pop() || 'pdf';

                // 3. Z-API Call
                const zApiPayload = {
                    phone: chat.phone,
                    document: publicUrl,
                    fileName: doc.name // User edited name
                };

                const response = await fetch(`https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-document/${extension}`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Client-Token": "F53f53bad10a9494f92d5e33804220a26S"
                    },
                    body: JSON.stringify(zApiPayload)
                });

                if (!response.ok) {
                    console.error(`Failed to send document ${doc.name}`, await response.text());
                    throw new Error(`Erro ao enviar ${doc.name}`);
                }
            }

            handleCancelDocPreview();

        } catch (error: any) {
            console.error("Error sending documents:", error);
            alert("Falha ao enviar documentos: " + (error.message || "Erro desconhecido"));
        } finally {
            setIsUploading(false);
        }
    };

    // --- FILTER MESSAGES FOR SEARCH ---
    const filteredMessages = messageSearchQuery.trim()
        ? messages.filter(msg =>
            msg.text_message &&
            msg.text_message.toLowerCase().includes(messageSearchQuery.toLowerCase())
        )
        : messages;


    return (
        <div className="flex flex-col h-full w-full bg-[#f8f9fa] dark:bg-[#1c1c1e] overflow-hidden relative transition-colors duration-300">
            {/* Loading Overlay for Actions */}
            {(updatingChat || isUploading) && (
                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center animate-fadeIn">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-[#04a7bd] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2">
                            {isUploading ? "Enviando..." : "Atualizando..."}
                        </p>
                    </div>
                </div>
            )}

            {/* APPOINTMENT MODAL */}
            {appointmentModalOpen && (
                <AppointmentModal
                    onClose={() => setAppointmentModalOpen(false)}
                    currentUser={currentUser}
                    initialData={appointmentInitialData}
                    selectedChat={chat}
                />
            )}

            {/* UNIT SELECTION MODAL (For Scheduling Link) */}
            {isUnitSelectionOpen && (
                <div className="absolute inset-0 bg-black/40 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-2xl p-6 w-full max-w-sm animate-scaleIn text-center border border-white dark:border-white/5">
                        <div className="w-12 h-12 bg-[#04a7bd]/10 text-[#04a7bd] rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Enviar Link de Agendamento</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Selecione a unidade para a qual o link será gerado.
                        </p>

                        <div className="mb-6 text-left">
                            <label className="block text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-1.5 ml-1">Unidade</label>
                            <select
                                value={selectedUnitForLink}
                                onChange={(e) => setSelectedUnitForLink(e.target.value)}
                                className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-2 focus:ring-[#04a7bd]/10 outline-none transition-all text-slate-700 dark:text-slate-300"
                            >
                                <option value="">Selecione...</option>
                                {units.map(u => (
                                    <option key={u.id} value={u.id}>{u.nome_unidade}</option>
                                ))}
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsUnitSelectionOpen(false)}
                                className="flex-1 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-[16px] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSendSchedulingLink}
                                className="flex-1 py-3 text-sm font-semibold text-white bg-[#04a7bd] hover:bg-[#149890] rounded-[16px] transition-colors shadow-lg shadow-[#04a7bd]/20"
                            >
                                Enviar
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* CONTACT PICKER MODAL */}
            {isContactPickerOpen && (
                <div className="absolute inset-0 bg-black/40 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-2xl p-6 w-full max-w-sm h-[80vh] flex flex-col animate-scaleIn border border-white dark:border-white/5">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Enviar Contato</h3>
                            <button onClick={() => setIsContactPickerOpen(false)} className="text-slate-400 hover:text-slate-600">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <input
                            type="text"
                            placeholder="Buscar contato..."
                            value={contactSearchQuery}
                            onChange={(e) => setContactSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl mb-4 focus:outline-none focus:border-[#04a7bd] text-sm text-slate-800 dark:text-white"
                        />

                        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                            {filteredContacts.map(c => (
                                <button
                                    key={c.phone}
                                    onClick={() => handleSendContact(c)}
                                    className="w-full flex items-center p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-white/5 transition-colors text-left"
                                >
                                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 mr-3 overflow-hidden flex-shrink-0">
                                        <img
                                            src={c.senderphoto || `https://ui-avatars.com/api/?name=${c.chatname}`}
                                            className="w-full h-full object-cover"
                                            alt=""
                                        />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{c.chatname}</p>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{c.phone}</p>
                                    </div>
                                </button>
                            ))}
                            {filteredContacts.length === 0 && (
                                <p className="text-center text-slate-400 text-sm mt-4">Nenhum contato encontrado.</p>
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* CREATE TASK MODAL */}
            {taskModalOpen && (
                <div className="absolute inset-0 bg-black/40 z-[80] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-2xl p-6 w-full max-w-lg animate-scaleIn overflow-y-auto max-h-[90vh] custom-scrollbar border border-white dark:border-white/5">
                        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Gerar Tarefa</h2>
                        <form onSubmit={handleCreateTask} className="space-y-4">

                            {/* Title */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Título</label>
                                <input
                                    type="text"
                                    value={taskForm.title}
                                    onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#04a7bd]/20 text-slate-800 dark:text-white"
                                    required
                                />
                            </div>

                            {/* Description */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Descrição</label>
                                <textarea
                                    value={taskForm.description}
                                    onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#04a7bd]/20 resize-none h-24 text-slate-800 dark:text-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Due Date */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Data Entrega</label>
                                    <input
                                        type="datetime-local"
                                        value={taskForm.dueDate}
                                        onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#04a7bd]/20 text-sm text-slate-800 dark:text-white"
                                        required
                                    />
                                </div>

                                {/* Responsible */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">Responsável</label>
                                    <select
                                        value={taskForm.responsibleId}
                                        onChange={(e) => setTaskForm({ ...taskForm, responsibleId: e.target.value })}
                                        className="w-full px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[14px] focus:outline-none focus:ring-2 focus:ring-[#04a7bd]/20 text-sm text-slate-800 dark:text-white"
                                        required
                                    >
                                        <option value="">Selecione...</option>
                                        {allUsers.map(u => (
                                            <option key={u.user_id} value={u.user_id}>{u.username}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* G.U.T Matrix */}
                            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-[16px] border border-slate-100 dark:border-white/10">
                                <h3 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wide mb-3">Matriz G.U.T.</h3>
                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Gravidade (G)</label>
                                        <select
                                            value={taskForm.g}
                                            onChange={(e) => setTaskForm({ ...taskForm, g: Number(e.target.value) })}
                                            className="w-full p-2 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-[10px] text-sm text-slate-800 dark:text-white"
                                        >
                                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Urgência (U)</label>
                                        <select
                                            value={taskForm.u}
                                            onChange={(e) => setTaskForm({ ...taskForm, u: Number(e.target.value) })}
                                            className="w-full p-2 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-[10px] text-sm text-slate-800 dark:text-white"
                                        >
                                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1">Tendência (T)</label>
                                        <select
                                            value={taskForm.t}
                                            onChange={(e) => setTaskForm({ ...taskForm, t: Number(e.target.value) })}
                                            className="w-full p-2 bg-white dark:bg-black border border-slate-200 dark:border-white/10 rounded-[10px] text-sm text-slate-800 dark:text-white"
                                        >
                                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setTaskModalOpen(false)}
                                    className="flex-1 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-[16px] transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-3 text-sm font-semibold text-white bg-[#04a7bd] hover:bg-[#149890] rounded-[16px] transition-colors shadow-lg shadow-[#04a7bd]/20"
                                >
                                    Criar Tarefa
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* DELETE CONFIRMATION MODAL */}
            {deleteModalOpen && (
                <div className="absolute inset-0 bg-black/40 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-2xl p-6 w-full max-w-sm animate-scaleIn text-center border border-white dark:border-white/5">
                        <div className="w-12 h-12 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Apagar mensagem?</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
                            Esta ação não poderá ser desfeita e a mensagem será removida para você.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setDeleteModalOpen(false);
                                    setMsgToDelete(null);
                                }}
                                className="flex-1 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-[16px] transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={confirmDeleteMessage}
                                className="flex-1 py-3 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 rounded-[16px] transition-colors shadow-lg shadow-red-500/20"
                            >
                                Apagar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* IMAGE PREVIEW MODAL */}
            {previewUrl && (
                <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
                    <div className="relative bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-2xl overflow-hidden max-w-[420px] w-full flex flex-col animate-scaleIn border border-white dark:border-white/5">

                        {/* Close Button (X) */}
                        <button
                            onClick={handleCancelPreview}
                            className="absolute top-4 left-4 z-10 p-2 bg-black/10 hover:bg-black/20 text-slate-800 rounded-full transition-colors backdrop-blur-md"
                            title="Cancelar"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Image Container */}
                        <div className="bg-slate-100 dark:bg-black flex items-center justify-center min-h-[300px] max-h-[450px]">
                            <img
                                src={previewUrl}
                                alt="Preview"
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Caption Input and Actions */}
                        <div className="p-4 bg-white dark:bg-[#1c1c1e] flex flex-col gap-3 border-t border-slate-50 dark:border-white/5">
                            <div className="w-full">
                                <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1 ml-1 uppercase tracking-wide">
                                    Legenda
                                </label>
                                <input
                                    type="text"
                                    value={imageCaption}
                                    onChange={(e) => setImageCaption(e.target.value)}
                                    placeholder="Adicione uma legenda..."
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-[16px] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04a7bd]/20 focus:border-[#04a7bd] transition-all"
                                />
                            </div>

                            <div className="flex items-center justify-between mt-2">
                                <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wide ml-1">
                                    {isUploading ? 'Enviando...' : 'Confirmar envio'}
                                </span>

                                {/* Send Button Image */}
                                <button
                                    onClick={handleConfirmSendImage}
                                    disabled={isUploading}
                                    className="w-11 h-11 bg-[#04a7bd] text-white rounded-full hover:bg-[#149890] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-md shadow-[#04a7bd]/20 flex items-center justify-center"
                                >
                                    {isUploading ? (
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    ) : (
                                        <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DOCUMENT PREVIEW MODAL */}
            {isDocModalOpen && (
                <div className="absolute inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-md animate-fadeIn">
                    <div className="relative bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-2xl overflow-hidden max-w-[420px] w-full flex flex-col animate-scaleIn max-h-[80vh] border border-white dark:border-white/5">

                        {/* Header */}
                        <div className="p-4 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-white dark:bg-[#1c1c1e]">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">Enviar Documentos</h3>
                            <button
                                onClick={handleCancelDocPreview}
                                className="p-2 bg-slate-100 dark:bg-white/10 rounded-full hover:bg-slate-200 dark:hover:bg-white/20 text-slate-500 dark:text-slate-400"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* List of Docs */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8f9fa] dark:bg-[#1c1c1e]">
                            {selectedDocs.map((doc) => (
                                <div key={doc.id} className="bg-white dark:bg-white/5 p-3 rounded-[16px] shadow-sm border border-slate-100 dark:border-white/5 flex items-center gap-3">
                                    <div className="w-10 h-10 bg-red-50 dark:bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <label className="text-[10px] uppercase text-slate-400 dark:text-slate-500 font-bold ml-1">Nome do arquivo</label>
                                        <input
                                            type="text"
                                            value={doc.name}
                                            onChange={(e) => handleDocNameChange(doc.id, e.target.value)}
                                            className="w-full bg-transparent border-b border-slate-200 dark:border-white/20 focus:border-[#04a7bd] outline-none text-sm text-slate-800 dark:text-white py-1"
                                        />
                                        <p className="text-[10px] text-slate-400 mt-1 truncate">{doc.file.name}</p>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveDoc(doc.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/20 rounded-full transition-colors"
                                    >
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            ))}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-4 bg-white dark:bg-[#1c1c1e] border-t border-slate-100 dark:border-white/5 flex items-center justify-between">
                            <button
                                onClick={() => docInputRef.current?.click()}
                                className="px-4 py-2.5 text-sm font-semibold text-[#04a7bd] bg-[#04a7bd]/10 rounded-[14px] hover:bg-[#04a7bd]/20 transition-colors flex items-center"
                            >
                                <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                                Adicionar
                            </button>

                            <button
                                onClick={handleConfirmSendDocuments}
                                disabled={isUploading}
                                className="w-11 h-11 bg-[#04a7bd] text-white rounded-full hover:bg-[#149890] active:scale-95 transition-all disabled:opacity-50 disabled:scale-100 shadow-md shadow-[#04a7bd]/20 flex items-center justify-center"
                            >
                                {isUploading ? (
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                ) : (
                                    <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Header */}
            <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-10 transition-colors duration-300">
                <div className="h-20 flex items-center px-6 justify-between">
                    <div className="flex items-center">
                        <img
                            src={chat.senderphoto || `https://ui-avatars.com/api/?name=${chat.chatname}`}
                            className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 dark:ring-white/10"
                            alt="Profile"
                        />
                        <div className="ml-4 flex flex-col">
                            <h2 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{chat.chatname}</h2>
                            {chat.phone && (
                                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">{chat.phone}</span>
                            )}
                        </div>
                    </div>
                    <div className="flex space-x-3 items-center">
                        {/* Search Toggle */}
                        <button
                            onClick={() => setIsMessageSearchOpen(!isMessageSearchOpen)}
                            className={`p-2.5 rounded-full transition-colors ${isMessageSearchOpen ? 'text-[#04a7bd] bg-[#04a7bd]/10' : 'text-slate-400 dark:text-slate-500 hover:text-[#04a7bd] hover:bg-[#04a7bd]/10'}`}
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>

                        {/* Quick Actions (Lightning Icon) */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsQuickActionsOpen(!isQuickActionsOpen);
                                    setIsMenuOpen(false);
                                }}
                                className={`p-2.5 rounded-full transition-colors ${isQuickActionsOpen ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10' : 'text-slate-400 dark:text-slate-500 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10'}`}
                                title="Ações Rápidas"
                            >
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </button>

                            {isQuickActionsOpen && (
                                <>
                                    <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsQuickActionsOpen(false)}></div>
                                    <div className="absolute right-0 top-12 w-64 bg-white dark:bg-[#2c2c2e] rounded-[18px] shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-white/5 z-20 overflow-hidden animate-scaleIn origin-top-right">
                                        <div className="px-4 py-3 border-b border-slate-50 dark:border-white/5 bg-slate-50/50 dark:bg-black/20">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ações Rápidas</h3>
                                        </div>
                                        <div className="py-1">
                                            <button
                                                onClick={handleSendSchedulingRequest}
                                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-white hover:bg-[#04a7bd]/10 hover:text-[#04a7bd] transition-colors flex items-center"
                                            >
                                                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                                Solicitar Agendamento
                                            </button>

                                            <button
                                                onClick={handleOpenUnitSelection}
                                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-white hover:bg-[#04a7bd]/10 hover:text-[#04a7bd] transition-colors flex items-center"
                                            >
                                                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                                </svg>
                                                Enviar Link de Agendamento
                                            </button>

                                            <button
                                                onClick={handleSendPrefeituraRequest}
                                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-white hover:bg-[#04a7bd]/10 hover:text-[#04a7bd] transition-colors flex items-center"
                                            >
                                                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                </svg>
                                                Agendamento Prefeitura (Prof)
                                            </button>

                                            <button
                                                onClick={handleSendPix}
                                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-white hover:bg-[#04a7bd]/10 hover:text-[#04a7bd] transition-colors flex items-center"
                                            >
                                                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                                                </svg>
                                                Enviar PIX
                                            </button>

                                            <button
                                                onClick={handleSendAddress}
                                                className="w-full text-left px-4 py-3 text-sm text-slate-700 dark:text-white hover:bg-[#04a7bd]/10 hover:text-[#04a7bd] transition-colors flex items-center"
                                            >
                                                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                                Enviar Endereço
                                            </button>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Main Action Menu - REPLACED ICON */}
                        <div className="relative">
                            <button
                                onClick={() => {
                                    setIsMenuOpen(!isMenuOpen);
                                    setIsAttachmentMenuOpen(false); // Close other menu
                                    setIsEmojiMenuOpen(false);
                                    setIsQuickActionsOpen(false);
                                }}
                                className={`p-2.5 rounded-full transition-colors ${isMenuOpen ? 'text-[#04a7bd] bg-[#04a7bd]/10' : 'text-slate-400 dark:text-slate-500 hover:text-[#04a7bd] hover:bg-[#04a7bd]/10'}`}
                            >
                                {/* CHANGED ICON TO SEND/AIRPLANE */}
                                <svg className="w-6 h-6 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>

                            {isMenuOpen && (
                                <>
                                    <div className="fixed inset-0 z-10 cursor-default" onClick={() => setIsMenuOpen(false)}></div>
                                    <div className="absolute right-0 top-12 w-64 bg-white dark:bg-[#2c2c2e] rounded-[18px] shadow-xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-white/5 z-20 overflow-hidden animate-scaleIn origin-top-right">
                                        <div className="py-1">
                                            <button
                                                onClick={() => handleUpdateTag(100)}
                                                className="w-full text-left px-4 py-3 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center"
                                            >
                                                <svg className="w-4 h-4 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                </svg>
                                                Finalizar Atendimento
                                            </button>

                                            <div className="border-t border-slate-100 dark:border-white/5 my-1"></div>
                                            <div className="px-4 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                                Transferir para setor
                                            </div>

                                            {SECTORS.map((sector) => (
                                                <button
                                                    key={sector.id}
                                                    onClick={() => handleUpdateTag(sector.id)}
                                                    className="w-full text-left px-4 py-2.5 text-sm text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-white/10 hover:text-[#04a7bd] transition-colors flex items-center"
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-500 mr-3"></span>
                                                    {sector.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>

                {/* Message Search Bar */}
                {isMessageSearchOpen && (
                    <div className="px-6 pb-3 animate-fadeIn">
                        <div className="relative">
                            <input
                                type="text"
                                value={messageSearchQuery}
                                onChange={(e) => setMessageSearchQuery(e.target.value)}
                                placeholder="Buscar na conversa..."
                                className="w-full pl-9 pr-4 py-2 bg-slate-100 dark:bg-white/5 border-none rounded-xl text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#04a7bd]/20 transition-all"
                                autoFocus
                            />
                            <svg className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                            {messageSearchQuery && (
                                <button
                                    onClick={() => setMessageSearchQuery('')}
                                    className="absolute right-2 top-2 p-0.5 bg-slate-200 dark:bg-white/10 rounded-full text-slate-500 hover:bg-slate-300 dark:hover:bg-white/20"
                                >
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            )}
                        </div>
                        <div className="mt-1 text-right">
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wide">
                                {filteredMessages.length} resultados
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* Messages Area */}
            <div
                ref={messagesContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-[#f8f9fa] dark:bg-[#1c1c1e] transition-colors duration-300"
            >
                {loadingMore && !messageSearchQuery && (
                    <div className="flex justify-center py-2">
                        <div className="w-6 h-6 border-2 border-slate-300 dark:border-slate-600 border-t-[#04a7bd] rounded-full animate-spin"></div>
                    </div>
                )}

                {loading ? (
                    <div className="flex justify-center items-center h-full animate-fadeIn">
                        <div className="w-10 h-10 border-4 border-[#04a7bd] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                ) : (
                    <>
                        {!hasMore && !messageSearchQuery && (
                            <div className="text-center text-xs text-slate-400 my-4 uppercase tracking-widest">Início da Conversa</div>
                        )}

                        {filteredMessages.map((msg, index) => {
                            // Determine if the message is from the current user or system (SENT).
                            const isOwn = msg.status === 'SENT' || msg.enviado_por === currentUser.user_id || msg.enviado_por === 'Gama Soluções';
                            const isEditing = editingMessageId === msg.id;
                            const isTemp = msg.id.toString().startsWith('temp-');

                            // Pix Check
                            const pixData = msg.raw_payload?.pixKeyMessage;

                            // Contact Check - NORMALIZE DATA
                            let contactData = msg.raw_payload?.contactMessage;
                            if (!contactData && msg.raw_payload?.contact) {
                                const c = msg.raw_payload.contact;
                                contactData = {
                                    displayName: c.displayName,
                                    phoneNumber: c.phones?.[0]
                                };
                            }

                            // Reply Context Logic
                            const replyId = msg.raw_payload?.referenceMessageId;
                            const repliedMsg = replyId ? messages.find(m => m.message_id === replyId) : null;

                            return (
                                <div
                                    key={msg.id || index}
                                    className={`flex animate-messagePop ${isOwn ? 'justify-end' : 'justify-start'} ${activeMessageMenuId === msg.id ? 'relative z-50' : 'relative z-0'}`}
                                >
                                    <div
                                        className={`
                                max-w-[85%] px-3 py-2 shadow-sm text-[15px] leading-relaxed relative flex flex-col group
                                ${isOwn
                                                ? 'bg-[#04a7bd] text-white rounded-[20px] rounded-br-sm'
                                                : 'bg-white dark:bg-[#2c2c2e] text-slate-800 dark:text-white border border-slate-100 dark:border-transparent rounded-[20px] rounded-bl-sm'}
                            `}
                                    >
                                        {/* MENU BUTTON (ALWAYS ON RIGHT) */}
                                        {!isEditing && (
                                            <div className="absolute top-1 right-1 z-20">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id);
                                                    }}
                                                    className={`p-1 rounded-full transition-all ${isOwn
                                                            ? 'text-white opacity-70 hover:opacity-100 hover:bg-white/20'
                                                            : 'text-slate-400 opacity-0 group-hover:opacity-100 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-600 dark:hover:text-white'
                                                        }`}
                                                >
                                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>

                                                {activeMessageMenuId === msg.id && (
                                                    <>
                                                        <div className="fixed inset-0 z-30" onClick={() => setActiveMessageMenuId(null)}></div>
                                                        <div
                                                            className={`absolute w-48 bg-white dark:bg-[#3a3a3c] rounded-xl shadow-lg border border-slate-100 dark:border-white/5 z-40 overflow-hidden animate-scaleIn text-slate-800 dark:text-white ${isOwn ? 'top-6 right-0 origin-top-right' : 'top-0 left-full ml-2 origin-top-left'}`}
                                                        >

                                                            {/* REPLY OPTION (FIRST) */}
                                                            <button
                                                                onClick={() => handleReplyClick(msg)}
                                                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#04a7bd]/10 hover:text-[#04a7bd] flex items-center transition-colors font-medium"
                                                            >
                                                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                                                                </svg>
                                                                Responder
                                                            </button>

                                                            <button
                                                                onClick={() => handleOpenTaskModal(msg)}
                                                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#04a7bd]/10 hover:text-[#04a7bd] flex items-center transition-colors"
                                                            >
                                                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                                                </svg>
                                                                Gerar Tarefa
                                                            </button>

                                                            <button
                                                                onClick={() => handleOpenAppointmentModal(msg)}
                                                                className="w-full text-left px-3 py-2.5 text-sm hover:bg-[#04a7bd]/10 hover:text-[#04a7bd] flex items-center transition-colors"
                                                            >
                                                                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                                </svg>
                                                                Gerar Atendimento
                                                            </button>

                                                            {isOwn && (
                                                                <>
                                                                    <div className="border-t border-slate-100 dark:border-white/5 my-1"></div>
                                                                    <button
                                                                        onClick={() => handleEditClick(msg)}
                                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/10 flex items-center"
                                                                    >
                                                                        <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                                                        </svg>
                                                                        Editar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleDeleteClick(msg)}
                                                                        className="w-full text-left px-3 py-2 text-sm hover:bg-red-50 dark:hover:bg-red-500/10 text-red-600 dark:text-red-400 flex items-center"
                                                                    >
                                                                        <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                                        </svg>
                                                                        Apagar
                                                                    </button>
                                                                </>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        )}

                                        {/* REPLY CONTEXT PREVIEW */}
                                        {replyId && (
                                            <div className={`mb-2 rounded-lg p-2 text-xs border-l-4 cursor-pointer select-none ${isOwn
                                                    ? 'bg-black/10 border-white/50 text-white/90'
                                                    : 'bg-slate-100 dark:bg-white/5 border-slate-300 dark:border-white/20 text-slate-600 dark:text-slate-300'
                                                }`}
                                            >
                                                <div className="font-bold mb-0.5">
                                                    {repliedMsg ? (repliedMsg.enviado_por === currentUser.user_id ? 'Você' : chat.chatname) : 'Mensagem Respondida'}
                                                </div>
                                                <div className="opacity-80 whitespace-pre-wrap break-words max-w-[30ch] leading-tight">
                                                    {repliedMsg ? (repliedMsg.text_message || (repliedMsg.img_path ? '📷 Imagem' : (repliedMsg.audio_url ? '🎤 Áudio' : '📎 Mídia'))) : '...'}
                                                </div>
                                            </div>
                                        )}

                                        {/* MEDIA: Image */}
                                        {msg.img_path && (
                                            <div className="mb-2 -mx-2 -mt-2">
                                                <img
                                                    src={msg.img_path}
                                                    alt="Enviado"
                                                    className="rounded-xl w-full h-auto object-cover max-h-[300px]"
                                                    onClick={() => window.open(msg.img_path!, '_blank')}
                                                    style={{ cursor: 'pointer' }}
                                                />
                                            </div>
                                        )}

                                        {/* MEDIA: Video */}
                                        {msg.video_path && (
                                            <div className="mb-2 -mx-2 -mt-2">
                                                <video
                                                    src={msg.video_path}
                                                    controls
                                                    className="rounded-xl w-full h-auto max-h-[300px]"
                                                />
                                            </div>
                                        )}

                                        {/* MEDIA: Audio */}
                                        {msg.audio_url && (
                                            <div className="mb-1">
                                                <AudioPlayer
                                                    src={msg.audio_url}
                                                    isOwn={isOwn}
                                                    senderPhoto={isOwn ? currentUser.img_url : (chat.senderphoto || '')}
                                                />
                                            </div>
                                        )}

                                        {/* MEDIA: PDF */}
                                        {msg.pdf_path && (
                                            <div className="mb-2">
                                                <a
                                                    href={msg.pdf_path}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${isOwn ? 'bg-[#04a7bd] hover:bg-[#149890]' : 'bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:hover:bg-white/10'
                                                        }`}
                                                >
                                                    <div className="bg-red-500 text-white p-2 rounded-lg flex-shrink-0">
                                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className={`font-medium truncate text-sm ${isOwn ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                                                            {msg.text_message || (msg.pdf_path ? decodeURIComponent(msg.pdf_path.split('/').pop()?.split('?')[0] || 'Documento PDF') : 'Documento PDF')}
                                                        </p>
                                                        <p className={`text-[10px] ${isOwn ? 'text-white/80' : 'text-slate-500 dark:text-slate-400'}`}>Clique para visualizar</p>
                                                    </div>
                                                </a>
                                            </div>
                                        )}

                                        {/* SPECIAL: PIX */}
                                        {pixData && (
                                            <PixCard
                                                pixKey={pixData.key}
                                                keyType={pixData.keyType}
                                                merchantName={pixData.merchantName}
                                                isOwn={isOwn}
                                            />
                                        )}

                                        {/* SPECIAL: CONTACT CARD */}
                                        {contactData && (
                                            <ContactCard
                                                displayName={contactData.displayName}
                                                phoneNumber={contactData.phoneNumber}
                                                isOwn={isOwn}
                                                onStartChat={onStartChat}
                                            />
                                        )}

                                        {/* TEXT MESSAGE / EDIT MODE / TYPING INDICATOR */}
                                        {isEditing ? (
                                            <div className="min-w-[200px]">
                                                <textarea
                                                    value={editContent}
                                                    onChange={(e) => setEditContent(e.target.value)}
                                                    className="w-full bg-white/20 text-white placeholder-white/60 rounded-md p-2 text-sm focus:outline-none border border-white/30 resize-none mb-2"
                                                    rows={3}
                                                />
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => setEditingMessageId(null)}
                                                        className="px-3 py-1 bg-white/20 hover:bg-white/30 rounded text-xs text-white"
                                                    >
                                                        Cancelar
                                                    </button>
                                                    <button
                                                        onClick={() => handleSaveEdit(msg)}
                                                        className="px-3 py-1 bg-white hover:bg-slate-100 rounded text-xs text-[#04a7bd] font-bold"
                                                    >
                                                        Salvar
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            msg.text_message && !msg.pdf_path && !pixData && !contactData && (
                                                isTemp ? (
                                                    <div className="flex items-center gap-1 h-5 px-1">
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-typing" style={{ animationDelay: '0s' }}></div>
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-typing" style={{ animationDelay: '0.2s' }}></div>
                                                        <div className="w-1.5 h-1.5 bg-white rounded-full animate-typing" style={{ animationDelay: '0.4s' }}></div>
                                                    </div>
                                                ) : (
                                                    <p className="whitespace-pre-wrap break-words">{renderFormattedText(msg.text_message, messageSearchQuery)}</p>
                                                )
                                            )
                                        )}

                                        {/* Time */}
                                        <div className={`text-[10px] mt-1 text-right ${isOwn ? 'text-white/80' : 'text-slate-400'}`}>
                                            {new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Area */}
            <div className="bg-white dark:bg-[#1c1c1e] px-4 pt-2 pb-4 border-t border-slate-200 dark:border-white/5 relative z-20 transition-colors duration-300">

                {/* REPLY PREVIEW UI */}
                {replyingToMessage && (
                    <div className="mb-2 p-2 bg-slate-50 dark:bg-white/5 border-l-4 border-[#04a7bd] rounded-r-lg flex justify-between items-center animate-scaleIn">
                        <div className="flex-1 min-w-0 pr-4">
                            <div className="text-xs font-bold text-[#04a7bd] mb-0.5 truncate">
                                {replyingToMessage.enviado_por === currentUser.user_id ? 'Você' : chat.chatname}
                            </div>
                            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                                {replyingToMessage.text_message || (replyingToMessage.img_path ? 'Imagem' : (replyingToMessage.audio_url ? 'Áudio' : 'Mensagem'))}
                            </div>
                        </div>
                        <button
                            onClick={() => setReplyingToMessage(null)}
                            className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full text-slate-400"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Hidden File Inputs */}
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileChange}
                />
                <input
                    type="file"
                    ref={docInputRef}
                    className="hidden"
                    accept="application/pdf"
                    multiple
                    onChange={handleDocFileChange}
                />

                {/* Attachment Menu Popup */}
                {isAttachmentMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-20 cursor-default" onClick={() => setIsAttachmentMenuOpen(false)}></div>
                        <div className="absolute bottom-20 left-4 bg-white dark:bg-[#2c2c2e] rounded-[18px] shadow-xl shadow-slate-300/50 dark:shadow-black/50 border border-slate-100 dark:border-white/5 z-30 p-2 min-w-[180px] animate-scaleIn origin-bottom-left">
                            <button
                                onClick={handleImageSelect}
                                className="w-full text-left px-3 py-2.5 rounded-[12px] hover:bg-slate-50 dark:hover:bg-white/10 flex items-center text-slate-700 dark:text-white font-medium transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                Imagem
                            </button>
                            <button
                                onClick={handleDocSelect}
                                className="w-full text-left px-3 py-2.5 rounded-[12px] hover:bg-slate-50 dark:hover:bg-white/10 flex items-center text-slate-700 dark:text-white font-medium transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-500/20 text-orange-600 dark:text-orange-400 flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                Documento
                            </button>
                            <button
                                onClick={handleContactSelect}
                                className="w-full text-left px-3 py-2.5 rounded-[12px] hover:bg-slate-50 dark:hover:bg-white/10 flex items-center text-slate-700 dark:text-white font-medium transition-colors"
                            >
                                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mr-3">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </div>
                                Contato
                            </button>
                        </div>
                    </>
                )}

                {/* Emoji Menu Popup */}
                {isEmojiMenuOpen && (
                    <>
                        <div className="fixed inset-0 z-20 cursor-default" onClick={() => setIsEmojiMenuOpen(false)}></div>
                        <div className="absolute bottom-20 left-16 bg-white dark:bg-[#2c2c2e] rounded-[18px] shadow-xl shadow-slate-300/50 dark:shadow-black/50 border border-slate-100 dark:border-white/5 z-30 p-2 w-[320px] animate-scaleIn origin-bottom-left">
                            <div className="grid grid-cols-8 gap-1 p-1 max-h-[250px] overflow-y-auto custom-scrollbar">
                                {COMMON_EMOJIS.map((emoji) => (
                                    <button
                                        key={emoji}
                                        onClick={() => handleAddEmoji(emoji)}
                                        className="w-8 h-8 flex items-center justify-center text-xl hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                                    >
                                        {emoji}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {/* RECORDING UI */}
                {isRecording ? (
                    <div className="flex items-center gap-4 bg-slate-100 dark:bg-white/5 rounded-[24px] p-2 pl-4 border border-slate-200 dark:border-white/10 shadow-inner h-[58px]">
                        <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                        <div className="flex-1 font-mono text-slate-700 dark:text-slate-300 font-medium">
                            {formatTime(recordingDuration)}
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleCancelRecording}
                                className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                                title="Cancelar"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                            <button
                                onClick={handleStopRecording}
                                className="w-11 h-11 bg-[#04a7bd] text-white rounded-full hover:bg-[#149890] active:scale-95 transition-all flex items-center justify-center shadow-lg shadow-[#04a7bd]/30"
                            >
                                <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2 bg-slate-100 dark:bg-white/5 rounded-[24px] p-1.5 pl-4 border border-slate-200 dark:border-white/5 focus-within:ring-2 focus-within:ring-[#04a7bd]/20 focus-within:border-[#04a7bd] focus-within:scale-[1.01] focus-within:shadow-md transition-all duration-300 ease-out">
                        <button
                            type="button"
                            onClick={handleAttachmentClick}
                            className={`p-2 transition-all duration-300 hover:scale-110 active:scale-90 ${isAttachmentMenuOpen ? 'text-[#04a7bd] bg-[#04a7bd]/10 rounded-full scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300'}`}
                            title="Anexar"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                            </svg>
                        </button>

                        <button
                            type="button"
                            onClick={handleEmojiClick}
                            className={`p-2 transition-all duration-300 hover:scale-110 active:scale-90 ${isEmojiMenuOpen ? 'text-yellow-500 bg-yellow-50 dark:bg-yellow-500/10 rounded-full scale-105' : 'text-slate-400 dark:text-slate-500 hover:text-yellow-500'}`}
                            title="Emojis"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>

                        <textarea
                            ref={textareaRef}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSendMessage(e);
                                }
                            }}
                            onPaste={handlePaste}
                            placeholder="Digite uma mensagem..."
                            className="flex-1 bg-transparent border-none outline-none text-slate-800 dark:text-white placeholder-slate-500 min-h-[40px] max-h-[120px] resize-none py-2 custom-scrollbar transition-colors"
                            rows={1}
                        />

                        {inputText.trim() ? (
                            <button
                                type="submit"
                                className="w-11 h-11 bg-[#04a7bd] text-white rounded-full hover:bg-[#149890] hover:scale-110 hover:shadow-lg hover:shadow-[#04a7bd]/30 active:scale-90 transition-all duration-300 ease-out flex items-center justify-center flex-shrink-0"
                            >
                                <svg className="w-5 h-5 transform rotate-90" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleStartRecording}
                                className="w-11 h-11 bg-[#04a7bd] text-white rounded-full hover:bg-[#149890] hover:scale-110 hover:shadow-lg hover:shadow-[#04a7bd]/30 active:scale-90 transition-all duration-300 ease-out flex items-center justify-center flex-shrink-0"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                </svg>
                            </button>
                        )}
                    </form>
                )}
            </div>
        </div>
    );
};