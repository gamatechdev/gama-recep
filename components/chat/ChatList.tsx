import React from 'react';
import { ChatTag } from '../../types'; // Tipos globais na raiz do projeto

interface ChatListProps {
  chats: ChatTag[];
  messageMatches?: ChatTag[];
  searchQuery?: string;
  selectedChatId: string | null;
  onSelectChat: (chat: ChatTag) => void;
  isLoading: boolean;
  userSector: number;
  userRole?: number;
}

export const ChatList: React.FC<ChatListProps> = ({
  chats,
  messageMatches = [],
  searchQuery,
  selectedChatId,
  onSelectChat,
  isLoading,
  userSector,
  userRole
}) => {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-20 w-full bg-white dark:bg-white/5 rounded-[20px] animate-pulse" />
        ))}
      </div>
    );
  }

  const hasSearch = !!searchQuery;
  const hasMessageResults = messageMatches.length > 0;

  if (hasSearch && chats.length === 0 && !hasMessageResults) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="font-medium">Nenhum resultado encontrado</p>
        <p className="text-sm mt-1">Tente buscar por outro termo.</p>
      </div>
    );
  }

  if (!hasSearch && chats.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-400">
        <svg className="w-12 h-12 mb-4 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        <p className="font-medium">Nenhum atendimento</p>
        <p className="text-sm mt-1">Sua lista de contatos está vazia.</p>
      </div>
    );
  }

  const renderChatCard = (chat: ChatTag, isMessageResult: boolean = false) => {
    const isSelected = selectedChatId === chat.chatname;
    const showPhone = chat.chatname === chat.phone;

    // Highlight matching text if searching
    const displayText = isMessageResult && chat.matched_message
      ? chat.matched_message
      : (chat.last_message || "Iniciar conversa");

    const displayTime = isMessageResult && chat.matched_time
      ? chat.matched_time
      : chat.updated_at;

    return (
      <div
        key={`${chat.chatname}-${isMessageResult ? 'msg' : 'contact'}`}
        onClick={() => onSelectChat(chat)}
        className={`
            group relative flex items-center p-3 cursor-pointer transition-all duration-200
            rounded-[20px] border mb-2
            ${isSelected
            ? 'bg-[#04a7bd] border-[#04a7bd] shadow-lg shadow-[#04a7bd]/30'
            : 'bg-white dark:bg-white/5 border-transparent hover:bg-slate-50 dark:hover:bg-white/10 hover:border-slate-200 dark:hover:border-white/10 shadow-sm'}
            `}
      >
        {/* Avatar */}
        <div className="relative flex-shrink-0 mr-3">
          <img
            src={chat.senderphoto || `https://ui-avatars.com/api/?name=${chat.chatname}&background=random`}
            alt={chat.chatname}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-white dark:ring-white/10"
          />
          {chat.notificado && !isSelected && !isMessageResult && (
            <span className="absolute top-0 right-0 block h-3 w-3 rounded-full ring-2 ring-white dark:ring-black bg-red-500 animate-pulse" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-0.5">
            <h3 className={`text-[15px] font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
              {chat.chatname}
            </h3>
            <span className={`text-[10px] flex-shrink-0 ml-2 ${isSelected ? 'text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>
              {new Date(displayTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {showPhone && (
            <div className={`text-[11px] mb-0.5 font-medium truncate ${isSelected ? 'text-white/70' : 'text-slate-500 dark:text-slate-400'}`}>
              {chat.phone}
            </div>
          )}

          <p className={`text-[13px] truncate ${isSelected ? 'text-white/90' : 'text-slate-500 dark:text-slate-400'} ${isMessageResult ? 'italic' : ''}`}>
            {/* Simple highlight logic if searching messages */}
            {isMessageResult && searchQuery ? (
              <span>
                {displayText.split(new RegExp(`(${searchQuery})`, 'gi')).map((part, i) =>
                  part.toLowerCase() === searchQuery.toLowerCase()
                    ? <span key={i} className="bg-yellow-200 text-slate-900 rounded-sm px-0.5 not-italic font-medium">{part}</span>
                    : part
                )}
              </span>
            ) : (
              displayText
            )}
          </p>
        </div>
      </div>
    );
  };

  // Group chats by sector
  // IF role is 7 (Super User), show ALL chats in the main list
  const isSuperUser = userRole === 7;
  const myChats = isSuperUser ? chats : chats.filter(c => c.tag === userSector);
  const otherChats = isSuperUser ? [] : chats.filter(c => c.tag !== userSector);

  // Split Message matches if any
  const myMessageMatches = isSuperUser ? messageMatches : messageMatches.filter(c => c.tag === userSector);
  const otherMessageMatches = isSuperUser ? [] : messageMatches.filter(c => c.tag !== userSector);

  return (
    <div className="flex flex-col h-full overflow-y-auto pt-2 pb-20 px-3 custom-scrollbar">

      {/* --- SECTION: SUAS CONVERSAS (My Chats) --- */}
      <div className="mb-4">
        <h3 className="text-xs font-bold text-[#04a7bd] uppercase tracking-wider mb-2 px-1 flex items-center">
          <span className="w-1.5 h-1.5 rounded-full bg-[#04a7bd] mr-2"></span>
          {isSuperUser ? 'Todas as Conversas' : 'Suas Conversas'}
        </h3>

        {/* Matches from Content Search */}
        {hasSearch && myMessageMatches.length > 0 && (
          <div className="mb-2">
            {myMessageMatches.map(chat => renderChatCard(chat, true))}
          </div>
        )}

        {/* Standard Chats (or Name/Phone Matches) */}
        {myChats.length > 0 ? (
          myChats.map(chat => renderChatCard(chat, false))
        ) : (
          !hasSearch && <p className="text-xs text-slate-400 px-2 italic mb-2">Nenhuma conversa ativa.</p>
        )}
      </div>


      {/* --- SECTION: OUTROS SETORES (Other Chats) --- */}
      {/* Only show 'Other Sectors' if searching AND not super user */}
      {hasSearch && !isSuperUser && (otherChats.length > 0 || otherMessageMatches.length > 0) && (
        <div className="mb-4 mt-2 pt-4 border-t border-slate-100 dark:border-white/10">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 mr-2"></span>
            Outros Setores
          </h3>

          {/* Matches from Content Search */}
          {hasSearch && otherMessageMatches.length > 0 && (
            <div className="mb-2">
              {otherMessageMatches.map(chat => renderChatCard(chat, true))}
            </div>
          )}

          {/* Standard Chats */}
          {otherChats.map(chat => renderChatCard(chat, false))}
        </div>
      )}
    </div>
  );
};