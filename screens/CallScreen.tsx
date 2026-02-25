/**
 * CallScreen.tsx (Orquestrador)
 * ------------------------------
 * Tela principal de Chamada de Pacientes — atua exclusivamente como ORQUESTRADOR.
 *
 * Responsabilidade deste arquivo:
 *  - Invocar os hooks de negócio (useCallQueue, useCallPermissions, useAttendanceTimer)
 *  - Combinar os dados retornados pelos hooks e repassá-los como props para os componentes visuais
 *  - Gerenciar a função cycleStatus que conecta o attendanceService com o estado React
 *  - Renderizar a estrutura de layout da página (header, estado vazio, subcomponentes)
 *
 * O que NÃO está mais neste arquivo:
 *  - Lógica de fetch do Supabase → useCallQueue, useCallPermissions
 *  - Lógica do timer → useAttendanceTimer
 *  - Queries de banco de dados → attendanceService
 *  - JSX da tabela desktop → CallDesktopTable
 *  - JSX dos cards mobile → CallMobileList
 *  - JSX do timer flutuante → ActiveCallTimer
 */

import React, { useCallback } from 'react';
import { Agendamento } from '../types';

// ─── Hooks de Negócio ─────────────────────────────────────────────────────────
import { useCallQueue } from '../hooks/useCallQueue';
import { useCallPermissions } from '../hooks/useCallPermissions';
import { useAttendanceTimer } from '../hooks/useAttendanceTimer';

// ─── Serviços de Banco de Dados ───────────────────────────────────────────────
import {
  updateRoomStatus,
  pushPatientToScreen,
  startAttendanceSession,
  finishAttendanceSession,
  insertFinancialExpense,
} from '../services/attendanceService';

// ─── Subcomponentes de UI ─────────────────────────────────────────────────────
import CallDesktopTable from '../components/call/CallDesktopTable';
import CallMobileList from '../components/call/CallMobileList';
import ActiveCallTimer from '../components/call/ActiveCallTimer';

// ─── Constantes ───────────────────────────────────────────────────────────────

/** Configuração das colunas de sala — compartilhada com subcomponentes via prop */
const ROOM_COLUMNS = [
  { key: 'consultorio', label: 'Consultório Médico' },
  { key: 'salaexames', label: 'Sala Exames' },
  { key: 'salacoleta', label: 'Sala Coleta' },
  { key: 'audiometria', label: 'Audiometria' },
  { key: 'raiox', label: 'Raio-X' },
];

// ─── Componente Orquestrador ──────────────────────────────────────────────────

const CallScreen: React.FC = () => {
  // ── Hook: Fila de Atendimento ─────────────────────────────────────────────
  // Gerencia a lista de agendamentos, polling de 10s e estado de carregamento
  const { appointments, loading, setAppointments, refetch } = useCallQueue();

  // ── Hook: Permissões e Dados do Usuário ───────────────────────────────────
  // Gerencia o nível de acesso, ID do usuário, sessão ativa e função canInteract
  const {
    currentDbUserId,
    currentUsername,
    activeCallData,
    setActiveCallData,
    canInteract,
  } = useCallPermissions();

  // ── Hook: Cronômetro de Atendimento ───────────────────────────────────────
  // Recalcula o tempo decorrido a cada segundo enquanto activeCallData não for null
  const elapsedTime = useAttendanceTimer(activeCallData);

  // ─── Helpers Utilitários ────────────────────────────────────────────────────

  /**
   * Retorna o label legível de uma sala dado sua chave.
   * Exemplo: 'consultorio' → 'Consultório Médico'
   */
  const getRoomLabel = useCallback((key: string): string => {
    return ROOM_COLUMNS.find(r => r.key === key)?.label ?? 'Sala';
  }, []);

  /**
   * Formata o timestamp de chegada do paciente para exibição.
   * Suporta ISO timestamps (dados antigos) e strings HH:MM:SS (dados novos).
   *
   * @param val - Valor armazenado no campo chegou_em (pode ser null/undefined)
   * @returns String no formato HH:MM, ou '--:--' se inválido
   */
  const formatTime = useCallback((val: string | null | undefined): string => {
    if (!val) return '--:--';

    // Dados antigos armazenaram timestamps ISO completos — converte pela API de Date
    if (val.includes('T')) {
      try {
        return new Date(val).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } catch {
        return val;
      }
    }

    // Dados novos armazenam apenas HH:MM:SS — retorna apenas os primeiros 5 caracteres
    return val.substring(0, 5);
  }, []);

  /**
   * Retorna as classes Tailwind para o botão de sala de acordo com o status
   * e se o usuário pode clicar (permissão + concorrência).
   *
   * Mapa de cores:
   *  - 🟡 amarelo  = 'atendido'   (sempre visível, mas cursor-not-allowed se sem permissão)
   *  - ⚪ cinza    = sem permissão ou sala bloqueada por outro paciente
   *  - 🔴 vermelho = 'Aguardando' + clicável (pulsa para chamar atenção)
   *  - 🟢 verde    = 'Finalizado' (apenas leitura)
   */
  const getDotColor = useCallback((status: string, isClickable: boolean): string => {
    // Amarelo sempre visível, mas cursor indica se pode interagir
    if (status === 'atendido') {
      return `bg-yellow-400 shadow-yellow-400/50 ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-80'}`;
    }

    // Sem permissão → cinza opaco para indicar "não disponível para você"
    if (!isClickable) return 'bg-gray-300 border-gray-300 opacity-30 cursor-not-allowed';

    switch (status) {
      case 'Aguardando': return 'bg-red-500 shadow-red-500/50 animate-pulse cursor-pointer hover:scale-110 active:scale-95';
      case 'Finalizado': return 'bg-green-500 shadow-green-500/50 cursor-default';
      default: return 'bg-gray-200 border-gray-200';
    }
  }, []);

  /**
   * Calcula quais salas estão atualmente com um paciente em atendimento ('atendido').
   * Utilizado para bloquear a mesma sala para outros pacientes (controle de concorrência).
   *
   * @returns Set com as chaves das salas ocupadas (ex: Set{'consultorio', 'raiox'})
   */
  const getOccupiedRooms = useCallback((): Set<string> => {
    const occupied = new Set<string>();
    appointments.forEach(apt => {
      ROOM_COLUMNS.forEach(col => {
        if (apt[col.key as keyof Agendamento] === 'atendido') {
          occupied.add(col.key);
        }
      });
    });
    return occupied;
  }, [appointments]);

  // ─── Handler Principal: Ciclo de Status ────────────────────────────────────

  /**
   * Avança o status de uma sala para um agendamento específico.
   * Implementa a máquina de estados: Aguardando → atendido → Finalizado
   *
   * Fluxo para 'Aguardando' → 'atendido':
   *  1. Inicia o timer local (setActiveCallData)
   *  2. Move o paciente anterior para posição 2 no telão (pushPatientToScreen)
   *  3. Registra os início na tabela 'atendimentos' (startAttendanceSession)
   *  4. Chama updateRoomStatus com posicao_tela=1 e sala_chamada
   *
   * Fluxo para 'atendido' → 'Finalizado':
   *  1. Para o timer local (setActiveCallData(null))
   *  2. Fecha a sessão na tabela 'atendimentos' (finishAttendanceSession)
   *  3. Gera despesa financeira (insertFinancialExpense)
   *  4. Chama updateRoomStatus com 'Finalizado'
   *
   * Após cada transação, realiza atualização otimista no estado local para resposta imediata,
   * e re-busca a fila em caso de erro (rollback automático).
   *
   * @param id            - ID do agendamento na tabela 'agendamentos'
   * @param column        - Chave da sala (ex: 'consultorio')
   * @param currentStatus - Status atual da sala para este agendamento
   * @param patientName   - Nome do paciente (para o timer flutuante)
   */
  const cycleStatus = useCallback(async (
    id: number,
    column: string,
    currentStatus: string,
    patientName?: string
  ) => {
    // Dupla verificação de segurança: a UI já deveria ter bloqueado o botão
    if (!canInteract(column)) return;

    const nowISO = new Date().toISOString();
    let nextStatus = '';
    const extraUpdates: Record<string, any> = {};

    if (currentStatus === 'Aguardando') {
      // ── INICIANDO ATENDIMENTO (Vermelho → Amarelo) ────────────────────────
      nextStatus = 'atendido';

      // 1. Inicia o cronômetro local imediatamente (UX responsiva)
      setActiveCallData({
        startTime: new Date(),
        patientName: patientName || 'Paciente',
      });

      // 2. Campos extras para atualização do agendamento no telão
      extraUpdates.posicao_tela = 1;
      extraUpdates.sala_chamada = getRoomLabel(column);

      // 3. Move o paciente que estava no topo do telão para posição 2 (histórico)
      await pushPatientToScreen(id);

      // 4. Registra o início do atendimento na tabela 'atendimentos'
      if (currentDbUserId) {
        await startAttendanceSession({
          agendamentoId: id,
          userId: currentDbUserId,
          nowISO,
          column,
          roomLabel: getRoomLabel(column),
        });
      }

    } else if (currentStatus === 'atendido') {
      // ── FINALIZANDO ATENDIMENTO (Amarelo → Verde) ─────────────────────────
      nextStatus = 'Finalizado';

      // 1. Para o cronômetro local
      setActiveCallData(null);

      // 2. Fecha o registro aberto na tabela 'atendimentos'
      if (currentDbUserId) {
        await finishAttendanceSession({
          agendamentoId: id,
          userId: currentDbUserId,
          nowISO,
          username: currentUsername,
        });
      }

      // 3. Gera a despesa financeira pelo atendimento realizado
      if (currentUsername) {
        await insertFinancialExpense(currentUsername);
      }

    } else {
      // Status desconhecido — não faz nada
      return;
    }

    // ── Atualização Otimista ──────────────────────────────────────────────────
    // Aplica o próximo status imediatamente no estado local para resposta visual rápida
    setAppointments(prev =>
      prev.map(a => a.id === id ? { ...a, [column]: nextStatus, ...extraUpdates } : a)
    );

    // ── Confirma no Banco de Dados ────────────────────────────────────────────
    const { error } = await updateRoomStatus(id, column, nextStatus, extraUpdates);

    if (error) {
      // Se falhou, reverte o otimismo fazendo um re-fetch completo
      console.error('[CallScreen] Erro ao atualizar sala — revertendo:', error);
      refetch();
    }
  }, [
    canInteract, currentDbUserId, currentUsername,
    setActiveCallData, setAppointments, getRoomLabel, refetch,
  ]);

  // ─── Estado de Carregamento ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-ios-subtext">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ios-primary mb-2" />
        Carregando Chamadas...
      </div>
    );
  }

  // ─── Dados Calculados ───────────────────────────────────────────────────────
  // Calculado uma vez e repassado para ambos os subcomponentes (tabela e cards)
  const occupiedRooms = getOccupiedRooms();

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 relative pb-20">

      {/* Cabeçalho da página */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-ios-text tracking-tight">Tela de Chamada</h2>
          <p className="text-ios-subtext font-medium mt-1 uppercase text-xs tracking-wider">
            Fluxo de Atendimento (Ordem de Chegada)
          </p>
        </div>
      </div>

      {/* Estado Vazio: nenhum paciente aguardando */}
      {appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-ios border border-gray-100 text-center shadow-sm">
          <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-3xl mb-4 shadow-inner">
            🩺
          </div>
          <h3 className="text-xl font-bold text-ios-text">Tudo tranquilo</h3>
          <p className="text-ios-subtext mt-2">Nenhum paciente presente aguardando atendimento.</p>
        </div>
      ) : (
        <>
          {/*
           * CallDesktopTable: Tabela visível em telas médias e grandes (md:block).
           * Recebe appointments + funções auxiliares via props — lógica de negócio fica aqui no orquestrador.
           */}
          <CallDesktopTable
            appointments={appointments}
            roomColumns={ROOM_COLUMNS}
            occupiedRooms={occupiedRooms}
            canInteract={canInteract}
            cycleStatus={cycleStatus}
            formatTime={formatTime}
            getDotColor={getDotColor}
          />

          {/*
           * CallMobileList: Cards visíveis apenas no mobile (md:hidden).
           * Mesmo conjunto de dados e handlers que a tabela, mas em layout diferente.
           */}
          <CallMobileList
            appointments={appointments}
            roomColumns={ROOM_COLUMNS}
            occupiedRooms={occupiedRooms}
            canInteract={canInteract}
            cycleStatus={cycleStatus}
            formatTime={formatTime}
            getDotColor={getDotColor}
          />
        </>
      )}

      {/*
       * ActiveCallTimer: Botão flutuante do cronômetro.
       * Renderiza condicionalmente — só aparece quando há um atendimento ativo.
       * elapsedTime é provido pelo hook useAttendanceTimer.
       */}
      <ActiveCallTimer
        activeCallData={activeCallData}
        elapsedTime={elapsedTime}
      />
    </div>
  );
};

export default CallScreen;
