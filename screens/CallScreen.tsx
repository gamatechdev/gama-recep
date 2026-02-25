
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../services/supabaseClient'; // Cliente Supabase canônico em services/
import { Agendamento } from '../types'; // Tipos globais na raiz do projeto

const ROOM_COLUMNS = [
  { key: 'consultorio', label: 'Consultório Médico' },
  { key: 'salaexames', label: 'Sala Exames' },
  { key: 'salacoleta', label: 'Sala Coleta' },
  { key: 'audiometria', label: 'Audiometria' },
  { key: 'raiox', label: 'Raio-X' }
];

const CallScreen: React.FC = () => {
  const [appointments, setAppointments] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [userAccessLevel, setUserAccessLevel] = useState<number | null>(null);
  const [currentDbUserId, setCurrentDbUserId] = useState<number | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('');

  // Timer State
  const [activeCallData, setActiveCallData] = useState<{ startTime: Date; patientName: string } | null>(null);
  const [elapsedTime, setElapsedTime] = useState<string>('00:00');

  useEffect(() => {
    fetchUserAccess();
    fetchQueue();
    // Keep polling as a fallback for the list view
    const interval = setInterval(fetchQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  // Timer Interval Logic
  useEffect(() => {
    let interval: any;

    if (activeCallData) {
      interval = setInterval(() => {
        const now = new Date();
        const diff = Math.floor((now.getTime() - activeCallData.startTime.getTime()) / 1000);

        const minutes = Math.floor(diff / 60);
        const seconds = diff % 60;

        const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setElapsedTime(formatted);
      }, 1000);
    } else {
      setElapsedTime('00:00');
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCallData]);

  const fetchUserAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from('users')
        .select('id, acesso_med, username')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setUserAccessLevel(data.acesso_med);
        setCurrentDbUserId(data.id);
        setCurrentUsername(data.username);
        checkForActiveSession(data.id);
      }
    }
  };

  const checkForActiveSession = async (userId: number) => {
    // Check if there is an open session (finalizou_em is null) for this user
    const { data } = await supabase
      .from('atendimentos')
      .select(`
        chamou_em,
        agendamentos (
            colaboradores ( nome )
        )
      `)
      .eq('user_id', userId)
      .is('finalizou_em', null)
      .maybeSingle();

    if (data) {
      const patientName = (data.agendamentos as any)?.colaboradores?.nome || 'Paciente';
      setActiveCallData({
        startTime: new Date(data.chamou_em),
        patientName: patientName
      });
    }
  };

  const fetchQueue = async () => {
    const today = new Date().toISOString().split('T')[0];

    // Ordered by Priority (True first) then 'chegou_em' to respect FIFO based on arrival time within priority groups
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        colaboradores:colaboradores!agendamentos_colaborador_id_fkey (id, nome)
      `)
      .eq('data_atendimento', today)
      .eq('compareceu', true)
      .order('prioridade', { ascending: false, nullsFirst: false })
      .order('chegou_em', { ascending: true });

    if (error) {
      console.error("Error fetching queue:", error);
    } else {
      const filtered = (data as unknown as Agendamento[]).filter(apt => {
        return ROOM_COLUMNS.some(col =>
          apt[col.key as keyof Agendamento] === 'Aguardando' ||
          apt[col.key as keyof Agendamento] === 'atendido'
        );
      });
      setAppointments(filtered);
    }
    setLoading(false);
  };

  const getRoomLabel = (key: string) => {
    const room = ROOM_COLUMNS.find(r => r.key === key);
    return room ? room.label : 'Consultório';
  };

  // Helper to format time safely (handles full timestamps or time-only strings)
  const formatTime = (val: string | null | undefined) => {
    if (!val) return '--:--';

    // If it has 'T', assume it's ISO timestamp (old data fallback)
    if (val.includes('T')) {
      try {
        return new Date(val).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } catch {
        return val;
      }
    }

    // Assume HH:MM:SS or HH:MM
    // Just return the first 5 chars (HH:MM)
    return val.substring(0, 5);
  };

  // Permission Logic
  const canInteract = (columnKey: string): boolean => {
    if (userAccessLevel === null) return false; // Loading or error
    if (userAccessLevel === 1) return true; // Full Access

    switch (columnKey) {
      case 'consultorio': return userAccessLevel === 2;
      case 'salaexames': return userAccessLevel === 3;
      case 'salacoleta': return userAccessLevel === 4;
      case 'audiometria': return userAccessLevel === 5;
      case 'raiox': return userAccessLevel === 6;
      default: return false;
    }
  };

  const cycleStatus = async (id: number, column: string, currentStatus: string, patientName?: string) => {
    // Note: We check permission inside render to disable button, but double check here security
    if (!canInteract(column)) return;

    let nextStatus = '';
    const updates: any = {};
    const nowISO = new Date().toISOString();

    // --- State Machine & Side Effects ---

    if (currentStatus === 'Aguardando') {
      // --- STARTING ATTENDANCE (Red -> Yellow) ---
      nextStatus = 'atendido';

      // Start Timer
      setActiveCallData({
        startTime: new Date(),
        patientName: patientName || 'Paciente'
      });

      // Update main table (agendamentos)
      updates.posicao_tela = 1;
      updates.sala_chamada = getRoomLabel(column);

      // Optional: Move the previous #1 to #2 to keep history on TV
      await supabase
        .from('agendamentos')
        .update({ posicao_tela: 2 })
        .eq('posicao_tela', 1);

      // Insert into 'atendimentos' table
      if (currentDbUserId) {
        // REMOVIDO 'profissional' PARA EVITAR ERRO DE FK (perfil_med)
        // O 'user_id' já faz o vínculo com a tabela 'users'
        const { error: insertError } = await supabase.from('atendimentos').insert({
          agendamento_id: id,
          user_id: currentDbUserId,
          chamou_em: nowISO,
          finalizou_em: null
        });
        if (insertError) console.error("Erro ao registrar atendimento:", insertError);
      }

    } else if (currentStatus === 'atendido') {
      // --- FINISHING ATTENDANCE (Yellow -> Green) ---
      nextStatus = 'Finalizado';

      // Stop Timer
      setActiveCallData(null);

      // Update 'atendimentos' table (Close the session)
      if (currentDbUserId) {
        const { error: updateError } = await supabase.from('atendimentos')
          .update({ finalizou_em: nowISO })
          .eq('agendamento_id', id)
          .is('finalizou_em', null); // Only update open records for this schedule

        if (updateError) console.error("Erro ao finalizar atendimento:", updateError);
      }

      // --- Insert into 'financeiro_despesas' ---
      if (currentUsername) {
        const date = new Date();
        // Get the last day of the current month
        const lastDayOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        const dataProjetada = lastDayOfMonth.toISOString().split('T')[0];

        const { error: despesaError } = await supabase.from('financeiro_despesas').insert({
          desc: "Atendimento por prestador",
          fornecedor: currentUsername, // Username of logged in user
          forma_pagamento: "a combinar",
          centro_custos: "Variavel",
          responsavel: "Gama Medicina",
          valor: 0,
          data_projetada: dataProjetada,
          status: "pendente",
          nome: currentUsername, // Username of logged in user as requested
          qnt_parcela: 1,
          categoria: "Medicina",
          recorrente: false
        });

        if (despesaError) {
          console.error("Erro ao gerar despesa financeira:", despesaError);
        } else {
          console.log("Despesa gerada com sucesso.");
        }
      }

    } else {
      return;
    }

    updates[column] = nextStatus;

    // Optimistic Update
    setAppointments(prev => prev.map(a =>
      a.id === id ? { ...a, ...updates } : a
    ));

    const { error } = await supabase
      .from('agendamentos')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error("Error updating room status", error);
      fetchQueue();
    }
  };

  const getDotColor = (status: string, isClickable: boolean) => {
    // REGRA 1: Se estiver amarelo ('atendido'), SEMPRE mostra amarelo (somente leitura se não tiver permissão)
    if (status === 'atendido') {
      return `bg-yellow-400 shadow-yellow-400/50 ${isClickable ? 'cursor-pointer hover:scale-110' : 'cursor-not-allowed opacity-80'}`;
    }

    // REGRA 2: Se não puder clicar (sem permissão ou bloqueado por outra sala), fica cinza
    if (!isClickable) return 'bg-gray-300 border-gray-300 opacity-30 cursor-not-allowed';

    switch (status) {
      case 'Aguardando': return 'bg-red-500 shadow-red-500/50 animate-pulse cursor-pointer hover:scale-110 active:scale-95';
      case 'Finalizado': return 'bg-green-500 shadow-green-500/50 cursor-default'; // Finalizado usually locked anyway
      default: return 'bg-gray-200 border-gray-200';
    }
  };

  // Calculate which rooms are currently busy (someone is 'atendido')
  const getOccupiedRooms = () => {
    const occupied = new Set<string>();
    appointments.forEach(apt => {
      ROOM_COLUMNS.forEach(col => {
        if (apt[col.key as keyof Agendamento] === 'atendido') {
          occupied.add(col.key);
        }
      });
    });
    return occupied;
  };

  const occupiedRooms = getOccupiedRooms();

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-ios-subtext">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ios-primary mb-2"></div>
        Carregando Chamadas...
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-20">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold text-ios-text tracking-tight">Tela de Chamada</h2>
          <p className="text-ios-subtext font-medium mt-1 uppercase text-xs tracking-wider">
            Fluxo de Atendimento (Ordem de Chegada)
          </p>
        </div>
      </div>

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
          {/* --- Desktop Table View (Hidden on Mobile) --- */}
          <div className="hidden md:block bg-white rounded-ios shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/50">
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Chegada</th>
                    <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Colaborador</th>
                    {ROOM_COLUMNS.map(col => (
                      <th key={col.key} className="px-6 py-5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">
                        {col.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {appointments.map((apt) => {
                    // Verifica se o paciente está "Ocupado" em alguma sala (status = 'atendido')
                    const activeRoomKey = ROOM_COLUMNS.find(r => apt[r.key as keyof Agendamento] === 'atendido')?.key;

                    return (
                      <tr key={apt.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-mono text-gray-500">
                              {formatTime(apt.chegou_em)}
                            </span>
                            {apt.prioridade && (
                              <span className="text-[9px] uppercase font-bold text-red-500 mt-1">
                                Prioridade
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${apt.prioridade ? 'bg-red-100 text-red-600 ring-2 ring-red-100' : 'bg-ios-primary/10 text-ios-primary'}`}>
                              {apt.colaboradores?.nome?.charAt(0)}
                            </div>
                            <span className="font-semibold text-ios-text text-sm">{apt.colaboradores?.nome}</span>
                          </div>
                        </td>
                        {ROOM_COLUMNS.map(col => {
                          const status = apt[col.key as keyof Agendamento] as string;
                          const isVisible = status === 'Aguardando' || status === 'atendido' || status === 'Finalizado';

                          // User Permission Check
                          const hasPermission = canInteract(col.key);

                          // Is the room physically occupied by anyone?
                          const isRoomOccupied = occupiedRooms.has(col.key);

                          // Is it occupied by someone ELSE? (If it's busy, but status isn't 'atendido' for THIS user, then someone else is in there)
                          const isOccupiedByOther = isRoomOccupied && status !== 'atendido';

                          // Concurrency Logic:
                          // Clickable if: 
                          // 1. User has permission 
                          // 2. Patient isn't busy elsewhere (or This is the busy room)
                          // 3. The room isn't occupied by another patient
                          const isClickable = hasPermission &&
                            (!activeRoomKey || activeRoomKey === col.key) &&
                            !isOccupiedByOther;

                          let tooltip = !isClickable ? 'Bloqueado' : 'Ação';
                          if (status === 'atendido') tooltip = 'Em atendimento';
                          if (isOccupiedByOther) tooltip = 'Sala ocupada por outro paciente';

                          if (!isVisible) return <td key={col.key} className="px-6 py-5"></td>;

                          return (
                            <td key={col.key} className="px-6 py-5 whitespace-nowrap text-center">
                              <button
                                onClick={() => isClickable && cycleStatus(apt.id, col.key, status, apt.colaboradores?.nome)}
                                className={`w-8 h-8 rounded-full shadow-md transition-all duration-300 transform border-2 border-white ${getDotColor(status, isClickable)}`}
                                title={tooltip}
                                disabled={!isClickable || status === 'Finalizado'}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* --- Mobile Card View (Visible only on Mobile) --- */}
          <div className="md:hidden space-y-4">
            {appointments.map((apt) => {
              const activeRoomKey = ROOM_COLUMNS.find(r => apt[r.key as keyof Agendamento] === 'atendido')?.key;

              return (
                <div key={apt.id} className={`bg-white rounded-ios p-5 shadow-sm border ${apt.prioridade ? 'border-red-200 bg-red-50/20' : 'border-gray-100'}`}>
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${apt.prioridade ? 'bg-red-100 text-red-600' : 'bg-ios-primary/10 text-ios-primary'}`}>
                        {apt.colaboradores?.nome?.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-bold text-ios-text text-lg">{apt.colaboradores?.nome}</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-xs text-ios-subtext uppercase font-semibold">Paciente</p>
                          {apt.prioridade && <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">PRIORIDADE</span>}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                      {formatTime(apt.chegou_em)}
                    </span>
                  </div>

                  <div className="space-y-3">
                    {ROOM_COLUMNS.map(col => {
                      const status = apt[col.key as keyof Agendamento] as string;
                      const isVisible = status === 'Aguardando' || status === 'atendido' || status === 'Finalizado';

                      const hasPermission = canInteract(col.key);
                      const isRoomOccupied = occupiedRooms.has(col.key);
                      const isOccupiedByOther = isRoomOccupied && status !== 'atendido';
                      const isClickable = hasPermission &&
                        (!activeRoomKey || activeRoomKey === col.key) &&
                        !isOccupiedByOther;

                      if (!isVisible) return null;

                      return (
                        <div key={col.key} className="flex items-center justify-between bg-gray-50 rounded-xl p-3">
                          <span className={`text-sm font-medium ${isClickable ? 'text-gray-600' : 'text-gray-300'}`}>{col.label}</span>
                          <button
                            onClick={() => isClickable && cycleStatus(apt.id, col.key, status, apt.colaboradores?.nome)}
                            className={`w-10 h-10 rounded-full shadow-sm transition-all flex items-center justify-center border-2 border-white ${getDotColor(status, isClickable)}`}
                            disabled={!isClickable || status === 'Finalizado'}
                          >
                            {status === 'atendido' && isClickable && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-20"></span>}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Floating Timer Button */}
      {activeCallData && (
        <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-yellow-400 text-yellow-900 rounded-full shadow-float px-6 py-4 flex items-center gap-4 border-2 border-white transform hover:scale-105 transition-transform cursor-pointer group">
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">Em atendimento</span>
              <span className="text-sm font-bold truncate max-w-[150px]">{activeCallData.patientName}</span>
            </div>
            <div className="h-8 w-px bg-yellow-900/10"></div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-mono font-bold tracking-tight">{elapsedTime}</span>
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallScreen;
