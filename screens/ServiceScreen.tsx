/**
 * ServiceScreen.tsx (Orquestrador)
 * ----------------------------------
 * Tela do Painel de Chamada (Modo TV) — atua exclusivamente como ORQUESTRADOR.
 *
 * Responsabilidades deste arquivo:
 *  1. Invocar useAudioAlert() para obter audioEnabled, enableAudio e playAlert
 *  2. Invocar useTvBoard(playAlert) para obter currentCall, historyList e loading
 *  3. Exibir spinner enquanto os dados carregam
 *  4. Renderizar AudioPermissionOverlay enquanto o áudio não está habilitado
 *  5. Renderizar TvMainDisplay (painel principal) e TvHistoryList (lateral)
 *
 * O que NÃO está mais neste arquivo:
 *  - AudioContext, oscilador e lógica de fade  → useAudioAlert.ts
 *  - Canal Realtime + detecção de nova chamada → useTvBoard.ts
 *  - Query ao Supabase                          → tvBoardService.ts
 *  - JSX do overlay de permissão               → AudioPermissionOverlay.tsx
 *  - JSX do display principal (nome + sala)    → TvMainDisplay.tsx
 *  - JSX da lista lateral de histórico         → TvHistoryList.tsx
 */

import React from 'react';

// ─── Hooks de Dados e Áudio ───────────────────────────────────────────────────
import { useAudioAlert } from '../hooks/useAudioAlert';
import { useTvBoard } from '../hooks/useTvBoard';

// ─── Subcomponentes de UI ─────────────────────────────────────────────────────
import AudioPermissionOverlay from '../components/service/AudioPermissionOverlay';
import TvMainDisplay from '../components/service/TvMainDisplay';
import TvHistoryList from '../components/service/TvHistoryList';

// ─── Componente Orquestrador ──────────────────────────────────────────────────

const ServiceScreen: React.FC = () => {
  /**
   * Hook de áudio: gerencia o AudioContext e o oscilador.
   * Deve ser criado ANTES de useTvBoard pois playAlert é passado como parâmetro.
   */
  const { audioEnabled, enableAudio, playAlert } = useAudioAlert();

  /**
   * Hook de dados do painel: gerencia os estados da chamada,
   * o canal Realtime e a detecção de nova chamada.
   * Recebe playAlert para acionar o áudio ao detectar mudanças.
   */
  const { currentCall, historyList, loading } = useTvBoard(playAlert);

  // ── Estado de Carregamento ─────────────────────────────────────────────────
  // Exibido durante o fetch inicial dos dados do painel
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-primary mb-4" />
      </div>
    );
  }

  // ── Renderização Principal ─────────────────────────────────────────────────
  return (
    // Container raiz: fundo preto, layout flex, padding responsivo
    <div className="h-full w-full flex flex-col lg:flex-row gap-6 relative bg-black p-4 lg:p-6">

      {/*
       * AudioPermissionOverlay: Overlay de tela cheia exibido enquanto o áudio
       * não foi habilitado. Desaparece após o usuário clicar em "Ativar Som".
       * A propriedade audioEnabled (do useAudioAlert) controla a visibilidade.
       */}
      {!audioEnabled && (
        <AudioPermissionOverlay enableAudio={enableAudio} />
      )}

      {/*
       * TvMainDisplay: Painel principal com gradiente.
       * Exibe nome do paciente e sala (currentCall) ou ⏳ aguardando (null).
       */}
      <TvMainDisplay currentCall={currentCall} />

      {/*
       * TvHistoryList: Lista lateral de chamadas anteriores.
       * Recebe historyList (agendamentos com posicao_tela > 1).
       */}
      <TvHistoryList historyList={historyList} />
    </div>
  );
};

export default ServiceScreen;