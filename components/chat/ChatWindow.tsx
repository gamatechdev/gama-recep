import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { ChatTag, Message, User, Unidade } from '../../types';
import { AppointmentModal } from '../agenda/AppointmentModal';

// --- Subsistemas Extraídos ---
import { useChatMessages } from '../../hooks/useChatMessages';
import * as whatsappService from '../../services/whatsappService';
import AudioPlayer from './AudioPlayer';
import PixCard from './PixCard';
import ContactCard from './ContactCard';

interface PendingDocument {
    id: string;
    file: File;
    name: string;
}

interface ChatWindowProps {
    chat: ChatTag;
    currentUser: User;
    onClose: () => void;
    onChatUpdate: () => Promise<void>;
}

// Emoticons comuns
const COMMON_EMOJIS = ['😊', '😂', '👍', '❤️', '🙏', '😍', '👏', '🔥', '🎉', '💯', '🙌', '🤔', '😅', '👀', '✔️', '✅', '❌', '⚠️', '👋', '🤝'];
const SECTORS = [
    { id: 1, name: 'Recepção' },
    { id: 2, name: 'Triagem' },
    { id: 3, name: 'Comercial' },
    { id: 4, name: 'Medicina' },
    { id: 5, name: 'Engenharia/Segurança' },
    { id: 6, name: 'Faturamento/Financeiro' },
    { id: 7, name: 'Fonoaudiologia' },
    { id: 8, name: 'Qualidade/Diretoria' },
];

export const ChatWindow: React.FC<ChatWindowProps> = ({ chat, currentUser, onClose, onChatUpdate }) => {
    // ─── Estado Local (UI) ───────────────────────────────────────────────────
    const [inputText, setInputText] = useState('');
    const [updatingChat, setUpdatingChat] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // ─── Hooks Customizados ───────────────────────────────────────────────────
    const [messageSearchQuery, setMessageSearchQuery] = useState('');

    // Todo o estado e lógica de mensagens (fetch, realtime, paginação) 
    // está isolado neste hook customizado. O componente visual apenas consome os dados.
    const {
        messages,
        loading,
        loadingMore,
        hasMore,
        setMessages,
        handleScroll,
        messagesContainerRef,
        scrollToBottom
    } = useChatMessages(chat.chatname, messageSearchQuery);

    // ─── Estado Local de Menus e Modais ───────────────────────────────────────
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isAttachmentMenuOpen, setIsAttachmentMenuOpen] = useState(false);
    const [isEmojiMenuOpen, setIsEmojiMenuOpen] = useState(false);
    const [isMessageSearchOpen, setIsMessageSearchOpen] = useState(false);
    const [isQuickActionsOpen, setIsQuickActionsOpen] = useState(false);

    // ─── Estado de Mensagens Dinâmicas ───────────────────────────────────────
    const [replyingToMessage, setReplyingToMessage] = useState<Message | null>(null);
    const [activeMessageMenuId, setActiveMessageMenuId] = useState<string | null>(null);
    const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
    const [editContent, setEditContent] = useState('');

    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [msgToDelete, setMsgToDelete] = useState<Message | null>(null);

    // ─── Estado de Tarefas e Agendamentos ─────────────────────────────────────
    const [taskModalOpen, setTaskModalOpen] = useState(false);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [taskForm, setTaskForm] = useState({
        title: '', description: '', dueDate: '', responsibleId: '', g: 1, u: 1, t: 1
    });

    const [appointmentModalOpen, setAppointmentModalOpen] = useState(false);
    const [appointmentInitialData, setAppointmentInitialData] = useState<any>(null);

    // ─── Estado de Arquivos (Imagens, Docs, Áudio) ────────────────────────────
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [imageCaption, setImageCaption] = useState('');

    const docInputRef = useRef<HTMLInputElement>(null);
    const [selectedDocs, setSelectedDocs] = useState<PendingDocument[]>([]);
    const [isDocModalOpen, setIsDocModalOpen] = useState(false);

    const [isRecording, setIsRecording] = useState(false);
    const [recordingDuration, setRecordingDuration] = useState(0);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<BlobPart[]>([]);
    const recordingTimerRef = useRef<number | null>(null);

    // ─── Estado para Links de Agendamento ─────────────────────────────────────
    const [isUnitSelectionOpen, setIsUnitSelectionOpen] = useState(false);
    const [units, setUnits] = useState<Unidade[]>([]);
    const [selectedUnitForLink, setSelectedUnitForLink] = useState('');

    // ─── Estado para Contatos ─────────────────────────────────────────────────
    const [isContactPickerOpen, setIsContactPickerOpen] = useState(false);
    const [allContacts, setAllContacts] = useState<ChatTag[]>([]);
    const [contactSearchQuery, setContactSearchQuery] = useState('');


    // ─── Efeitos Iniciais ─────────────────────────────────────────────────────
    // Carrega usuários e unidades para os modais e links
    useEffect(() => {
        const fetchInitialData = async () => {
            const { data: userData } = await supabase.from('users').select('*');
            if (userData) setAllUsers(userData as User[]);
            const { data: unitsData } = await supabase.from('unidades').select('*');
            if (unitsData) setUnits(unitsData as Unidade[]);
        };
        fetchInitialData();
    }, []);

    // Atualiza a visualização com a tag (marca a conversa lida)
    useEffect(() => {
        const updateVisualized = async () => {
            if (chat.notificado || chat.visualizado_por !== currentUser.user_id) {
                await supabase.from('chat_tags').update({
                    visualizado_por: currentUser.user_id,
                    notificado: false
                }).eq('chatname', chat.chatname);
                onChatUpdate();
            }
        };
        updateVisualized();
        // Marca focado no textarea
        setTimeout(() => textareaRef.current?.focus(), 100);
    }, [chat.chatname, currentUser.user_id]);

    // Formatador de texto 
    const renderFormattedText = (text: string, searchQuery: string = '') => {
        if (!text) return null;
        let elements: React.ReactNode[] = [];
        let keyCounter = 0;
        let parts = text.split(/(\*[^*]+\*)/g);

        parts.forEach((part, index) => {
            if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
                const boldText = part.slice(1, -1);
                elements.push(<strong key={`bold-${index}`}>{highlightSearch(boldText, searchQuery)}</strong>);
            } else if (part) {
                elements.push(<span key={`text-${index}`}>{highlightSearch(part, searchQuery)}</span>);
            }
        });
        return elements;
    };

    const highlightSearch = (text: string, search: string) => {
        if (!search.trim()) return text;
        const regex = new RegExp(`(${search})`, 'gi');
        const parts = text.split(regex);
        return parts.map((part, i) =>
            regex.test(part) ? <mark key={i} className="bg-yellow-200 text-black px-0.5 rounded">{part}</mark> : part
        );
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Replace invalid XML chars in filename
    const sanitizeFileName = (fileName: string) => fileName.replace(/[&<>"'/]/g, '');


    // ─── Handlers de Mensagem ─────────────────────────────────────────────────

    /**
     * Função principal de envio de mensagem de texto no chat.
     * Envia mensagem simples ou uma resposta (reply) utilizando o whatsappService.
     */
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const msgText = inputText.trim();
        if (!msgText || !chat.phone) return;

        setInputText('');
        setIsAttachmentMenuOpen(false);
        setIsEmojiMenuOpen(false);

        // Mensagem otimista para o usuário
        const optimisticMessage: Message = {
            id: 'temp-' + Date.now(),
            chatname: chat.chatname,
            text_message: msgText,
            status: 'SENT',
            criado_em: new Date().toISOString(),
            enviado_por: currentUser.user_id,
            is_img: false,
            img_path: '',
            audio_url: '',
            sender_lid: 'me',
            raw_payload: replyingToMessage ? { referenceMessageId: replyingToMessage.message_id } : null
        };

        setMessages((prev) => [...prev, optimisticMessage]);
        setTimeout(() => scrollToBottom('smooth'), 50);

        try {
            if (replyingToMessage && replyingToMessage.message_id) {
                // 1. Envia Reposta usando whatsappService
                await whatsappService.sendWhatsAppReplyText(chat.phone, msgText, replyingToMessage.message_id);
                setReplyingToMessage(null);
            } else {
                // 1. Envia Texto usando whatsappService
                await whatsappService.sendWhatsAppText(chat.phone, msgText);
            }
        } catch (error) {
            console.error("Falha ao enviar mensagem:", error);
            alert("Erro ao enviar mensagem.");
            // Opcional: Reverter atualização otimista em produção
        }
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

        setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, text_message: newContent } : m));
        setEditingMessageId(null);

        try {
            await whatsappService.sendWhatsAppEditText(chat.phone, newContent, msg.message_id);
            await supabase.from('messages').update({ text_message: newContent }).eq('message_id', msg.message_id);
        } catch (error) {
            console.error("Erro ao editar:", error);
            alert("Falha ao editar mensagem.");
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
        setMessages(prev => prev.map(m => m.id === msgToDelete.id ? { ...m, text_message: "Mensagem Apagada" } : m));
        setDeleteModalOpen(false);

        try {
            await whatsappService.deleteWhatsAppMessage(chat.phone, msgToDelete.message_id);
            await supabase.from('messages').update({ text_message: "Mensagem Apagada" }).eq('message_id', msgToDelete.message_id);
        } catch (error) {
            console.error("Erro ao apagar:", error);
            alert("Erro ao apagar mensagem.");
            setMessages(previousMessages);
        } finally {
            setMsgToDelete(null);
        }
    };

    // ─── Uploads de Mídia (Imagens, Áudios, PDFs) ─────────────────────────────
    const handleConfirmSendImage = async () => {
        if (!selectedFile || !chat.phone) return;
        setIsUploading(true);

        try {
            const fileName = `pictures/${Date.now()}_${sanitizeFileName(selectedFile.name)}`;
            const { error: uploadError } = await supabase.storage.from('wpp_gama').upload(fileName, selectedFile);
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('wpp_gama').getPublicUrl(fileName);
            await whatsappService.sendWhatsAppImage(chat.phone, urlData.publicUrl, imageCaption);

            handleCancelPreview();
        } catch (error: any) {
            console.error("Error sending image:", error);
            alert("Falha ao enviar imagem.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirmSendDocuments = async () => {
        if (selectedDocs.length === 0 || !chat.phone) return;
        setIsUploading(true);

        try {
            for (const doc of selectedDocs) {
                const fileName = `documents/${Date.now()}_${sanitizeFileName(doc.file.name)}`;
                const { error: uploadError } = await supabase.storage.from('wpp_gama').upload(fileName, doc.file);
                if (uploadError) throw uploadError;

                const { data: urlData } = supabase.storage.from('wpp_gama').getPublicUrl(fileName);
                const extension = doc.file.name.split('.').pop() || 'pdf';

                await whatsappService.sendWhatsAppDocument(chat.phone, urlData.publicUrl, doc.name, extension);
            }
            handleCancelDocPreview();
        } catch (error: any) {
            console.error("Error sending docs:", error);
            alert("Falha ao enviar documentos.");
        } finally {
            setIsUploading(false);
        }
    };

    const handleUploadAndSendAudio = async (audioBlob: Blob) => {
        if (!chat.phone) return;
        setIsUploading(true);

        try {
            const fileName = `pictures/audio_${Date.now()}.webm`;
            const { error: uploadError } = await supabase.storage.from('wpp_gama').upload(fileName, audioBlob, { contentType: 'audio/webm' });
            if (uploadError) throw uploadError;

            const { data: urlData } = supabase.storage.from('wpp_gama').getPublicUrl(fileName);
            await whatsappService.sendWhatsAppAudio(chat.phone, urlData.publicUrl);
        } catch (error) {
            console.error("Error sending audio:", error);
            alert("Falha ao enviar áudio.");
        } finally {
            setIsUploading(false);
        }
    };

    // Áudio Recording Helpers
    const handleStartRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) audioChunksRef.current.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                handleUploadAndSendAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingDuration(0);
            recordingTimerRef.current = window.setInterval(() => setRecordingDuration(prev => prev + 1), 1000);
        } catch (err) {
            console.error("Erro no microfone:", err);
            alert("Erro ao acessar microfone.");
        }
    };

    const handleStopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
        }
    };

    const handleCancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.onstop = null;
            mediaRecorderRef.current.stop();
            mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            setIsRecording(false);
            if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
            audioChunksRef.current = [];
        }
    };

    // ─── Ações Rápidas (PIX, Endereço, Contato, Link de Agendamento) ───────────
    const handleSendPix = async () => {
        setIsQuickActionsOpen(false);
        if (!chat.phone) return alert("Contato sem número.");

        const optimisticMessage: Message = {
            id: 'temp-' + Date.now(),
            chatname: chat.chatname,
            text_message: `*${currentUser.username}:*\n\nSegue a chave PIX para pagamento:`,
            status: 'SENT',
            criado_em: new Date().toISOString(),
            enviado_por: currentUser.user_id,
            sender_lid: 'me',
            raw_payload: { pixKeyMessage: { key: "52620502000119", keyType: "EVP", merchantName: "Gama Center" } }
        };
        setMessages(prev => [...prev, optimisticMessage]);
        setTimeout(() => scrollToBottom('smooth'), 50);

        try {
            await whatsappService.sendWhatsAppPix(chat.phone);
        } catch (err) {
            console.error(err);
        }
    };

    const handleSendAddress = async () => {
        setIsQuickActionsOpen(false);
        if (!chat.phone) return alert("Contato sem número.");

        const msg = `*${currentUser.username}:*\n\nNossa empresa, *Gama Center – Saúde e Engenharia do Trabalho*, fica localizada na *Rua Barão de Pouso Alegre, 90, São Sebastião, Conselheiro Lafaiete (ao lado da Igreja São Sebastião)*.\n\nSe precisar de ajuda para chegar, é só chamar!`;
        setMessages(prev => [...prev, { id: 'temp-' + Date.now(), chatname: chat.chatname, text_message: msg, status: 'SENT', criado_em: new Date().toISOString(), enviado_por: currentUser.user_id, sender_lid: 'me' }]);
        setTimeout(() => scrollToBottom('smooth'), 50);

        try { await whatsappService.sendWhatsAppText(chat.phone, msg); } catch (err) { }
    };

    const handleSendContact = async (contact: ChatTag) => {
        if (!chat.phone) return;
        setIsContactPickerOpen(false);

        const optimisticMessage: Message = {
            id: 'temp-' + Date.now(),
            chatname: chat.chatname,
            text_message: '',
            status: 'SENT',
            criado_em: new Date().toISOString(),
            enviado_por: currentUser.user_id,
            sender_lid: 'me',
            raw_payload: { contactMessage: { displayName: contact.chatname, phoneNumber: contact.phone } }
        };
        setMessages((prev) => [...prev, optimisticMessage]);
        setTimeout(() => scrollToBottom('smooth'), 50);

        try {
            await whatsappService.sendWhatsAppContact(chat.phone, contact.chatname, contact.phone!);
        } catch (e) { }
    };

    const handleSendSchedulingLink = async () => {
        if (!selectedUnitForLink) return alert("Selecione uma unidade.");
        setIsUnitSelectionOpen(false);
        if (!chat.phone) return;

        const unit = units.find(u => u.id.toString() === selectedUnitForLink);
        const unitName = unit ? unit.nome_unidade : "Gama Center";
        const schedulingUrl = `https://gama-talk.vercel.app/?mode=agendar&unidade_id=${selectedUnitForLink}&phone=${chat.phone.replace(/[^0-9]/g, '')}`;
        const msg = `*${currentUser.username}:*\n\nSegue o link para realização do agendamento (${unitName}):\n\n${schedulingUrl}`;

        setMessages((prev) => [...prev, { id: 'temp-' + Date.now(), chatname: chat.chatname, text_message: msg, status: 'SENT', criado_em: new Date().toISOString(), enviado_por: currentUser.user_id, sender_lid: 'me' }]);
        setTimeout(() => scrollToBottom('smooth'), 50);

        try { await whatsappService.sendWhatsAppText(chat.phone, msg); } catch (e) { }
    };

    const handleSendSchedulingRequest = async () => {
        setIsQuickActionsOpen(false);
        if (!chat.phone) return alert("Contato sem número.");
        const msg = `*${currentUser.username}:*\n\nOlá ${chat.chatname}! Para agilizarmos seu atendimento, encaminhe as seguintes informações:\n\n*NOME COMPLETO:*\n*DATA DE NASCIMENTO:*\n*CPF:*\n*FUNÇÃO:*\n*EMPRESA:*\n\nFavor nos enviar o nome da empresa onde fará o exame conforme descrito no contrato social.`;
        setMessages((prev) => [...prev, { id: 'temp-' + Date.now(), chatname: chat.chatname, text_message: msg, status: 'SENT', criado_em: new Date().toISOString(), enviado_por: currentUser.user_id, sender_lid: 'me' }]);
        setTimeout(() => scrollToBottom('smooth'), 50);
        try { await whatsappService.sendWhatsAppText(chat.phone, msg); } catch (e) { }
    };

    const handleSendPrefeituraRequest = async () => {
        setIsQuickActionsOpen(false);
        if (!chat.phone) return alert("Contato sem número.");
        const msg = `*${currentUser.username}:*\n\nOlá, ${chat.chatname}! Para agilizarmos seu atendimento, encaminhe as seguintes informações (PREFEITURA / ESTADO / CONCURSOS):\n\n*NOME COMPLETO:*\n*DATA DE NASCIMENTO:*\n*CPF:*\n*FUNÇÃO:*\n*RG:*\n\n*Informar quais são os profissionais solicitados.*`;
        setMessages((prev) => [...prev, { id: 'temp-' + Date.now(), chatname: chat.chatname, text_message: msg, status: 'SENT', criado_em: new Date().toISOString(), enviado_por: currentUser.user_id, sender_lid: 'me' }]);
        setTimeout(() => scrollToBottom('smooth'), 50);
        try { await whatsappService.sendWhatsAppText(chat.phone, msg); } catch (e) { }
    };

    // ─── Helpers Visuais ──────────────────────────────────────────────────────
    const handleUpdateTag = async (newTag: number) => {
        setUpdatingChat(true);
        setIsMenuOpen(false);
        try {
            await supabase.from('chat_tags').update({ tag: newTag }).eq('chatname', chat.chatname);
            onChatUpdate();
        } catch (err) { alert("Erro ao transferir/finalizar"); }
        finally { setUpdatingChat(false); }
    };

    const handleCreateTask = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await supabase.from('kanban').insert({
                titulo: taskForm.title, descricao: taskForm.description, responsavel: taskForm.responsibleId,
                status: 'A fazer', pai: currentUser.sector, datadeentrega: new Date(taskForm.dueDate).toISOString(),
                G: taskForm.g, U: taskForm.u, T: taskForm.t, score: taskForm.g * taskForm.u * taskForm.t
            });
            alert("Tarefa criada!"); setTaskModalOpen(false);
        } catch (err) { alert("Erro ao criar tarefa"); }
    };

    const handleOpenTaskModal = (msg: Message) => {
        setTaskForm({ title: '', description: `Referência: "${msg.text_message}"`, dueDate: '', responsibleId: '', g: 1, u: 1, t: 1 });
        setTaskModalOpen(true);
        setActiveMessageMenuId(null);
    };

    const handleOpenAppointmentModal = (msg: Message) => {
        setAppointmentInitialData(parseMessageToAppointment(msg.text_message));
        setAppointmentModalOpen(true);
        setActiveMessageMenuId(null);
    };

    const handleReplyClick = (msg: Message) => {
        setReplyingToMessage(msg);
        setActiveMessageMenuId(null);
        setTimeout(() => textareaRef.current?.focus(), 100);
    };

    const handleOpenUnitSelection = () => {
        setIsUnitSelectionOpen(true);
        setIsQuickActionsOpen(false);
    };

    const parseMessageToAppointment = (msg: string | undefined) => {
        if (!msg) return null;
        const findField = (regex: RegExp) => { const m = msg.match(regex); return m ? m[1].trim() : ''; };
        return {
            nome: findField(/NOME COMPLETO\s*:\s*\*?\s*(.+?)(?=\n|$)/i),
            cpf: findField(/CPF\s*:\s*\*?\s*(.+?)(?=\n|$)/i),
            empresaStr: findField(/EMPRESA\s*:\s*\*?\s*(.+?)(?=\n|$)/i),
            cargoStr: findField(/FUNÇÃO\s*:\s*\*?\s*(.+?)(?=\n|$)/i),
            data_nasc: findField(/NASCIMENTO\s*:\s*\*?\s*(.+?)(?=\n|$)/i),
            telefone: chat.phone || ''
        };
    };

    const handleImageSelect = () => { fileInputRef.current?.click(); setIsAttachmentMenuOpen(false); };
    const handleDocSelect = () => { docInputRef.current?.click(); setIsAttachmentMenuOpen(false); };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const file = e.target.files[0];
        setSelectedFile(file);
        setPreviewUrl(URL.createObjectURL(file));
        setImageCaption('');
        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    // Processa a seleção de arquivos de documento no input invisível
    const handleDocFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        const files = Array.from(e.target.files);
        const newDocs = files.map(f => ({ id: Math.random().toString(36).substr(2, 9), file: f, name: f.name }));
        setSelectedDocs(newDocs);
        setIsDocModalOpen(true);
        if (docInputRef.current) docInputRef.current.value = ''; // reseta o input
    };

    const handleAddEmoji = (emoji: string) => setInputText(prev => prev + emoji);
    const handleCancelPreview = () => { setPreviewUrl(null); setSelectedFile(null); setImageCaption(''); };
    const handleCancelDocPreview = () => { setSelectedDocs([]); setIsDocModalOpen(false); };
    const handleRemoveDoc = (id: string) => setSelectedDocs(prev => prev.filter(doc => doc.id !== id));
    const handleDocNameChange = (id: string, newName: string) => setSelectedDocs(prev => prev.map(doc => doc.id === id ? { ...doc, name: newName } : doc));

    // Paste handler para Imagens
    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                if (!chat.phone) return alert("Contato sem número.");
                const file = items[i].getAsFile();
                if (file) {
                    setSelectedFile(file);
                    setPreviewUrl(URL.createObjectURL(file));
                    setImageCaption('');
                }
                return;
            }
        }
    };

    // Busca de contatos para o ContactCard custom start chat action
    const onStartContactCardChat = () => { alert("Funcionalidade delegada à tela principal."); };


    // Busca filtrada no front-end
    const filteredMessages = messageSearchQuery.trim()
        ? messages.filter(msg => msg.text_message?.toLowerCase().includes(messageSearchQuery.toLowerCase()))
        : messages;

    return (
        <div className="flex flex-col h-full w-full bg-[#f8f9fa] dark:bg-[#1c1c1e] overflow-hidden relative transition-colors duration-300">
            {/* Loading Overlay */}
            {(updatingChat || isUploading) && (
                <div className="absolute inset-0 bg-white/60 dark:bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center animate-fadeIn">
                    <div className="flex flex-col items-center">
                        <div className="w-8 h-8 border-4 border-[#04a7bd] border-t-transparent rounded-full animate-spin"></div>
                        <p className="text-sm font-medium text-slate-600 dark:text-slate-300 mt-2">{isUploading ? "Enviando..." : "Atualizando..."}</p>
                    </div>
                </div>
            )}

            {/* MODAIS (Agendamento, Link de Unidade, Contatos, Tarefa, Apagar, Prev Imagem, Prev Doc) */}
            {appointmentModalOpen && <AppointmentModal onClose={() => setAppointmentModalOpen(false)} currentUser={currentUser} initialData={appointmentInitialData} selectedChat={chat} />}

            {isUnitSelectionOpen && (
                <div className="absolute inset-0 bg-black/40 z-[70] flex items-center justify-center p-4 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-2xl p-6 w-full max-w-sm text-center">
                        <h3 className="text-lg font-bold">Enviar Link de Agendamento</h3>
                        <select className="w-full h-12 px-4 rounded-xl border mt-4 mb-4 dark:bg-black" value={selectedUnitForLink} onChange={e => setSelectedUnitForLink(e.target.value)}>
                            <option value="">Selecione...</option>
                            {units.map(u => <option key={u.id} value={u.id}>{u.nome_unidade}</option>)}
                        </select>
                        <div className="flex gap-3">
                            <button onClick={() => setIsUnitSelectionOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/10 rounded-[16px]">Cancelar</button>
                            <button onClick={handleSendSchedulingLink} className="flex-1 py-3 bg-[#04a7bd] text-white rounded-[16px]">Enviar</button>
                        </div>
                    </div>
                </div>
            )}

            {isContactPickerOpen && (
                <div className="absolute inset-0 bg-black/40 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-2xl p-6 w-full max-w-sm h-[80vh] flex flex-col">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold">Enviar Contato</h3>
                            <button onClick={() => setIsContactPickerOpen(false)}>✕</button>
                        </div>
                        <input type="text" placeholder="Buscar contato..." value={contactSearchQuery} onChange={(e) => setContactSearchQuery(e.target.value)} className="w-full px-4 py-2 border rounded-xl mb-4 dark:bg-black" />
                        <div className="flex-1 overflow-y-auto">
                            {allContacts.filter(c => c.chatname.toLowerCase().includes(contactSearchQuery.toLowerCase())).map(c => (
                                <button key={c.phone} onClick={() => handleSendContact(c)} className="w-full flex items-center p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl text-left">
                                    <h4 className="font-bold">{c.chatname}</h4>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {taskModalOpen && (
                <div className="absolute inset-0 bg-black/40 z-[80] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-[#1c1c1e] rounded-[24px] p-6 w-full max-w-lg">
                        <h2 className="text-xl font-bold mb-4">Gerar Tarefa</h2>
                        <form onSubmit={handleCreateTask} className="space-y-4">
                            <input type="text" value={taskForm.title} onChange={e => setTaskForm({ ...taskForm, title: e.target.value })} className="w-full p-2 border rounded-xl dark:bg-black" placeholder="Título" required />
                            <textarea value={taskForm.description} onChange={e => setTaskForm({ ...taskForm, description: e.target.value })} className="w-full p-2 border rounded-xl dark:bg-black" placeholder="Descrição" />
                            <input type="datetime-local" value={taskForm.dueDate} onChange={e => setTaskForm({ ...taskForm, dueDate: e.target.value })} className="w-full p-2 border rounded-xl dark:bg-black" required />
                            <select value={taskForm.responsibleId} onChange={e => setTaskForm({ ...taskForm, responsibleId: e.target.value })} className="w-full p-2 border rounded-xl dark:bg-black" required>
                                <option value="">Responsável</option>
                                {allUsers.map(u => <option key={u.user_id} value={u.user_id}>{u.username}</option>)}
                            </select>
                            <div className="flex gap-3">
                                <button type="button" onClick={() => setTaskModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/10 rounded-xl">Cancelar</button>
                                <button type="submit" className="flex-1 py-3 bg-[#04a7bd] text-white rounded-xl">Criar</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {deleteModalOpen && (
                <div className="absolute inset-0 bg-black/40 z-[70] flex justify-center items-center">
                    <div className="bg-white dark:bg-[#1c1c1e] p-6 rounded-[24px] text-center w-full max-w-sm">
                        <h3 className="text-lg font-bold mb-4">Apagar mensagem para todos?</h3>
                        <div className="flex gap-3">
                            <button onClick={() => setDeleteModalOpen(false)} className="flex-1 py-3 bg-slate-100 dark:bg-white/10 rounded-xl">Cancelar</button>
                            <button onClick={confirmDeleteMessage} className="flex-1 py-3 bg-red-500 text-white rounded-xl">Apagar</button>
                        </div>
                    </div>
                </div>
            )}

            {previewUrl && (
                <div className="absolute inset-0 bg-black/60 z-[70] flex justify-center items-center">
                    <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-[24px] max-w-md w-full flex flex-col items-center relative">
                        <button onClick={handleCancelPreview} className="absolute top-2 right-2 m-2 p-1 bg-black/10 rounded-full">✕</button>
                        <img src={previewUrl} className="max-h-64 object-contain rounded-lg mb-4" />
                        <input type="text" value={imageCaption} onChange={e => setImageCaption(e.target.value)} placeholder="Legenda..." className="w-full p-3 border rounded-xl mb-4 dark:bg-black" />
                        <button onClick={handleConfirmSendImage} className="w-full py-3 bg-[#04a7bd] text-white rounded-xl font-bold">Enviar</button>
                    </div>
                </div>
            )}

            {isDocModalOpen && (
                <div className="absolute inset-0 bg-black/60 z-[70] flex justify-center items-center">
                    <div className="bg-white dark:bg-[#1c1c1e] p-4 rounded-[24px] max-w-md w-full">
                        <h3 className="font-bold mb-4">Enviar Docs</h3>
                        {selectedDocs.map(d => (
                            <div key={d.id} className="flex items-center gap-2 mb-2 p-2 bg-slate-50 dark:bg-white/5 border rounded-xl">
                                <input value={d.name} onChange={e => handleDocNameChange(d.id, e.target.value)} className="flex-1 bg-transparent outline-none p-1" />
                                <button onClick={() => handleRemoveDoc(d.id)} className="text-red-500 font-bold px-2">X</button>
                            </div>
                        ))}
                        <div className="flex justify-between mt-4">
                            <button onClick={handleCancelDocPreview} className="font-bold p-2 text-slate-500">Cancelar</button>
                            <button onClick={handleConfirmSendDocuments} className="p-2 px-6 bg-[#04a7bd] text-white rounded-xl font-bold">Confirmar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Cabeçalho do Chat */}
            <div className="bg-white/80 dark:bg-[#1c1c1e]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-10 flex items-center px-6 h-20 justify-between">
                <div className="flex items-center">
                    <img src={chat.senderphoto || `https://ui-avatars.com/api/?name=${chat.chatname}`} className="w-12 h-12 rounded-full ring-2 ring-slate-100" />
                    <div className="ml-4">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white">{chat.chatname}</h2>
                        {chat.phone && <span className="text-xs text-slate-500">{chat.phone}</span>}
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setIsMessageSearchOpen(!isMessageSearchOpen)} className="p-2 text-slate-400 hover:text-[#04a7bd]">🔍</button>

                    <div className="relative">
                        <button onClick={() => { setIsQuickActionsOpen(!isQuickActionsOpen); setIsMenuOpen(false); }} className="p-2 text-yellow-500">⚡</button>
                        {isQuickActionsOpen && (
                            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-[#3a3a3c] rounded-xl shadow-xl z-20 py-2">
                                <button onClick={handleSendSchedulingRequest} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/10">Agendamento (Normal)</button>
                                <button onClick={handleSendPrefeituraRequest} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/10">Agendamento (Prefeitura)</button>
                                <button onClick={handleOpenUnitSelection} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/10">Enviar Link Custom</button>
                                <button onClick={handleSendPix} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/10">Enviar PIX</button>
                                <button onClick={handleSendAddress} className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-white/10">Enviar Endereço</button>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button onClick={() => { setIsMenuOpen(!isMenuOpen); setIsQuickActionsOpen(false); }} className="p-2 text-slate-400">⚙️</button>
                        {isMenuOpen && (
                            <div className="absolute right-0 top-12 w-48 bg-white dark:bg-[#3a3a3c] rounded-xl shadow-xl z-20 overflow-hidden">
                                <button onClick={() => handleUpdateTag(100)} className="w-full text-left px-4 py-3 text-red-500 font-bold hover:bg-slate-50 dark:hover:bg-white/10">Finalizar Atendimento</button>
                                <div className="border-t my-1"></div>
                                {SECTORS.map(s => (
                                    <button key={s.id} onClick={() => handleUpdateTag(s.id)} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-white/10">{s.name}</button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {isMessageSearchOpen && (
                <div className="px-6 py-2 bg-white dark:bg-[#1c1c1e]">
                    <input type="text" value={messageSearchQuery} onChange={e => setMessageSearchQuery(e.target.value)} placeholder="Buscar nesta conversa..." className="w-full p-2 border rounded-xl dark:bg-black" />
                </div>
            )}

            {/* Area Principal de Mensagens */}
            <div ref={messagesContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {loadingMore && <div className="text-center">Carregando mais...</div>}

                {loading ? (
                    <div className="text-center pt-10">Carregando chat...</div>
                ) : (
                    <>
                        {filteredMessages.map((msg, idx) => {
                            const isOwn = msg.status === 'SENT' || msg.enviado_por === currentUser.user_id || msg.enviado_por === 'Gama Soluções';
                            const isEditing = editingMessageId === msg.id;

                            const pixData = msg.raw_payload?.pixKeyMessage;
                            let contactData = msg.raw_payload?.contactMessage;
                            if (!contactData && msg.raw_payload?.contact) {
                                contactData = { displayName: msg.raw_payload.contact.displayName, phoneNumber: msg.raw_payload.contact.phones?.[0] };
                            }

                            return (
                                <div key={msg.id || idx} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} relative group`}>
                                    <div className={`max-w-[85%] px-3 py-2 text-[15px] rounded-[20px] shadow-sm relative ${isOwn ? 'bg-[#04a7bd] text-white rounded-br-sm' : 'bg-white dark:bg-[#2c2c2e] border rounded-bl-sm dark:border-white/5'}`}>

                                        {!isEditing && (
                                            <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 z-10 transition-opacity">
                                                <button onClick={(e) => { e.stopPropagation(); setActiveMessageMenuId(activeMessageMenuId === msg.id ? null : msg.id) }} className="p-1 rounded-full bg-black/20 text-white">⋮</button>
                                                {activeMessageMenuId === msg.id && (
                                                    <div className="absolute top-6 right-0 bg-white dark:bg-[#3a3a3c] shadow-lg rounded-lg z-50 text-slate-800 dark:text-white" onClick={e => e.stopPropagation()}>
                                                        <button onClick={() => handleReplyClick(msg)} className="block w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10 text-sm">Responder</button>
                                                        <button onClick={() => handleOpenTaskModal(msg)} className="block w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10 text-sm">Gerar Tarefa</button>
                                                        <button onClick={() => handleOpenAppointmentModal(msg)} className="block w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10 text-sm">Agendar</button>
                                                        {isOwn && (
                                                            <>
                                                                <button onClick={() => handleEditClick(msg)} className="block w-full text-left px-3 py-2 hover:bg-slate-100 dark:hover:bg-white/10 text-sm">Editar</button>
                                                                <button onClick={() => handleDeleteClick(msg)} className="block w-full text-left px-3 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm">Apagar</button>
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {msg.raw_payload?.referenceMessageId && (
                                            <div className="mb-2 p-2 bg-black/10 rounded-lg text-xs italic">
                                                Referenciando resposta.
                                            </div>
                                        )}

                                        {msg.img_path && <img src={msg.img_path} onClick={() => window.open(msg.img_path!)} className="rounded-xl w-full max-h-[300px] object-cover mb-2 cursor-pointer" />}
                                        {msg.video_path && <video src={msg.video_path} controls className="rounded-xl w-full max-h-[300px] mb-2" />}
                                        {msg.audio_url && <AudioPlayer src={msg.audio_url} isOwn={isOwn} senderPhoto={chat.senderphoto!} />}
                                        {msg.pdf_path && <a href={msg.pdf_path} target="_blank" className="block p-3 bg-black/10 rounded-xl mb-2 underline">Abrir Documento</a>}
                                        {pixData && <PixCard pixKey={pixData.key} keyType={pixData.keyType} merchantName={pixData.merchantName} isOwn={isOwn} />}
                                        {contactData && <ContactCard displayName={contactData.displayName} phoneNumber={contactData.phoneNumber} isOwn={isOwn} onStartChat={onStartContactCardChat} />}

                                        {isEditing ? (
                                            <div className="min-w-[200px]">
                                                <textarea value={editContent} onChange={e => setEditContent(e.target.value)} className="w-full bg-white/20 p-2 text-sm rounded mb-2 text-white" />
                                                <div className="flex justify-end gap-2"><button onClick={() => setEditingMessageId(null)} className="px-2 py-1">Cancelar</button><button onClick={() => handleSaveEdit(msg)} className="px-2 py-1 font-bold">Salvar</button></div>
                                            </div>
                                        ) : (
                                            msg.text_message && !msg.pdf_path && !pixData && !contactData && (
                                                <p className="whitespace-pre-wrap">{renderFormattedText(msg.text_message, messageSearchQuery)}</p>
                                            )
                                        )}
                                        <div className={`text-[10px] mt-1 text-right ${isOwn ? 'text-white/80' : 'text-slate-400'}`}>
                                            {new Date(msg.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                        <div ref={messagesEndRef} />
                    </>
                )}
            </div>

            {/* Input Formulario */}
            <div className="bg-white dark:bg-[#1c1c1e] p-4 border-t border-slate-200 dark:border-white/5 relative z-20">
                {replyingToMessage && (
                    <div className="mb-2 p-2 bg-slate-50 dark:bg-white/5 border-l-4 border-[#04a7bd] rounded flex justify-between">
                        <div className="text-xs">
                            <strong className="text-[#04a7bd]">Respondendo</strong><br />
                            <span className="truncate">{replyingToMessage.text_message || 'Mídia'}</span>
                        </div>
                        <button onClick={() => setReplyingToMessage(null)}>✕</button>
                    </div>
                )}
                <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleFileChange} />
                    <input type="file" ref={docInputRef} hidden accept=".pdf,.doc,.docx" multiple onChange={handleDocFileChange} />

                    <div className="relative">
                        <button type="button" onClick={() => { setIsAttachmentMenuOpen(!isAttachmentMenuOpen); setIsEmojiMenuOpen(false); }} className="p-2 text-slate-400">📎</button>
                        {isAttachmentMenuOpen && (
                            <div className="absolute bottom-10 left-0 bg-white dark:bg-[#3a3a3c] rounded-xl shadow-lg p-2 flex flex-col w-32 border dark:border-white/10">
                                <button type="button" onClick={handleImageSelect} className="text-left py-2 px-2 hover:bg-slate-50 dark:hover:bg-white/10 rounded">Imagem</button>
                                <button type="button" onClick={handleDocSelect} className="text-left py-2 px-2 hover:bg-slate-50 dark:hover:bg-white/10 rounded">Documento</button>
                                <button type="button" onClick={() => setIsContactPickerOpen(true)} className="text-left py-2 px-2 hover:bg-slate-50 dark:hover:bg-white/10 rounded">Contato</button>
                            </div>
                        )}
                    </div>

                    <div className="relative">
                        <button type="button" onClick={() => { setIsEmojiMenuOpen(!isEmojiMenuOpen); setIsAttachmentMenuOpen(false); }} className="p-2 text-yellow-500">😀</button>
                        {isEmojiMenuOpen && (
                            <div className="absolute bottom-10 left-0 bg-white dark:bg-[#3a3a3c] p-2 rounded-xl shadow-lg grid grid-cols-5 w-[200px] border dark:border-white/10">
                                {COMMON_EMOJIS.map(e => <button key={e} type="button" onClick={() => handleAddEmoji(e)} className="p-1 hover:bg-slate-50 text-xl">{e}</button>)}
                            </div>
                        )}
                    </div>

                    {isRecording ? (
                        <div className="flex-1 flex items-center justify-between border rounded-full px-4 py-2 bg-slate-50 dark:bg-black">
                            <span className="text-red-500 font-bold animate-pulse">Gravando: {formatTime(recordingDuration)}</span>
                            <div className="flex gap-2">
                                <button type="button" onClick={handleCancelRecording} className="p-2 text-slate-400">Apagar</button>
                                <button type="button" onClick={handleStopRecording} className="p-2 text-white bg-green-500 rounded-full font-bold">Enviar</button>
                            </div>
                        </div>
                    ) : (
                        <textarea ref={textareaRef} value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(e); } }} onPaste={handlePaste} className="flex-1 bg-slate-50 dark:bg-black border rounded-2xl p-3 resize-none outline-none dark:text-white max-h-32" rows={1} placeholder="Mensagem..." />
                    )}

                    {!isRecording && (
                        inputText.trim() ? (
                            <button type="submit" className="w-12 h-12 bg-[#04a7bd] text-white rounded-full font-bold flex items-center justify-center">➤</button>
                        ) : (
                            <button type="button" onClick={handleStartRecording} className="w-12 h-12 bg-[#04a7bd] text-white rounded-full font-bold flex items-center justify-center">🎤</button>
                        )
                    )}
                </form>
            </div>
        </div>
    );
};