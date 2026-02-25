/**
 * Layout.tsx (Orquestrador)
 * --------------------------
 * Componente de estrutura principal da aplicação — atua exclusivamente como ORQUESTRADOR.
 *
 * Responsabilidades deste ficheiro:
 *  1. Invocar o hook useUserProfile para obter os dados do utilizador logado
 *  2. Calcular as flags isFullScreen e isDocumentView (escondem a navegação)
 *  3. Renderizar condicionalmente MobileHeader, DesktopSidebar e MobileBottomNav
 *  4. Renderizar a área de conteúdo principal (children) com o botão de saída do modo TV
 *
 * O que NÃO está mais neste ficheiro:
 *  - Chamadas ao supabaseClient        → userService.ts
 *  - Estado e fetch do userProfile     → useUserProfile.ts (consome userService)
 *  - JSX do cabeçalho mobile           → MobileHeader.tsx
 *  - JSX da barra lateral desktop      → DesktopSidebar.tsx
 *  - JSX da barra de navegação mobile  → MobileBottomNav.tsx
 */

import React from 'react';

// ─── Hook de Dados ────────────────────────────────────────────────────────────
import { useUserProfile } from '../../hooks/useUserProfile';

// ─── Subcomponentes de UI ─────────────────────────────────────────────────────
import MobileHeader from './MobileHeader';
import DesktopSidebar from './DesktopSidebar';
import MobileBottomNav from './MobileBottomNav';

// ─── Tipos ────────────────────────────────────────────────────────────────────

type TabName = 'dashboard' | 'agenda' | 'novo' | 'chamada' | 'atendimento' | 'stats' | 'aso';

// ─── Props ────────────────────────────────────────────────────────────────────

interface LayoutProps {
  children: React.ReactNode;              // Conteúdo da tab activa
  activeTab: TabName;                     // Tab actualmente seleccionada
  setActiveTab: (tab: TabName) => void;   // Callback para navegar entre tabs
  onLogout: () => void;                   // Callback para encerrar a sessão
  userId: string;                         // UUID do utilizador autenticado
}

// ─── Componente Orquestrador ──────────────────────────────────────────────────

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, userId }) => {
  /**
   * Busca o perfil do utilizador via hook.
   * O hook encapsula: estado userProfile + useEffect + chamada ao userService.
   * Retorna null enquanto carrega — os subcomponentes tratam esse caso com graceful fallback.
   */
  const userProfile = useUserProfile(userId);

  /**
   * Modo FullScreen (tab 'atendimento'): oculta toda a navegação (header/sidebar/bottomnav).
   * Usado na tela de atendimento/chamada para maximizar o espaço de conteúdo.
   */
  const isFullScreen = activeTab === 'atendimento';

  /**
   * Modo DocumentView (tab 'aso'): também oculta a navegação.
   * Usado na visualização de documentos (ASO) para ambiente limpo, sem distrações.
   */
  const isDocumentView = activeTab === 'aso';

  return (
    // Contentor raiz: ocupa toda a altura do ecrã, sem overflow global
    <div className={`flex h-screen w-full overflow-hidden ${isFullScreen || isDocumentView ? 'p-0' : 'p-0 lg:p-4 gap-6'} flex-col lg:flex-row`}>

      {/*
       * MobileHeader: barra superior com logo e perfil do utilizador.
       * Oculta nos modos FullScreen e DocumentView.
       */}
      {!isFullScreen && !isDocumentView && (
        <MobileHeader userProfile={userProfile} onLogout={onLogout} />
      )}

      {/*
       * DesktopSidebar: navegação lateral visível apenas em ≥ lg.
       * Oculta nos modos FullScreen e DocumentView.
       */}
      {!isFullScreen && !isDocumentView && (
        <DesktopSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          userProfile={userProfile}
          onLogout={onLogout}
        />
      )}

      {/* ── Área de Conteúdo Principal ──────────────────────────────────── */}
      {/*
       * main: ocupa o espaço restante após a sidebar.
       * Em modos FullScreen/DocumentView, o fundo é branco e sem padding.
       */}
      <main className={`flex-1 overflow-hidden relative transition-all duration-500 flex flex-col ${isFullScreen || isDocumentView ? 'bg-white' : 'bg-ios-bg lg:rounded-ios'}`}>
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${isFullScreen || isDocumentView ? 'p-0' : 'p-4 pb-24 lg:p-10 lg:pb-10'}`}>

          {/*
           * Botão para sair do modo FullScreen (modo TV/Atendimento).
           * Posicionado de forma absoluta no canto superior esquerdo
           * para não interferir com o conteúdo da tela de chamada.
           */}
          {isFullScreen && (
            <button
              onClick={() => setActiveTab('agenda')}
              className="absolute top-6 left-6 z-50 p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all border border-white/10 shadow-lg"
              title="Sair do modo TV"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}

          {/* Conteúdo da tab activa injectado pelo componente pai */}
          {children}
        </div>
      </main>

      {/*
       * MobileBottomNav: barra de navegação inferior fixa (mobile).
       * Oculta nos modos FullScreen e DocumentView.
       */}
      {!isFullScreen && !isDocumentView && (
        <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      )}
    </div>
  );
};

export default Layout;
