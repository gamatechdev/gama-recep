/**
 * CallMobileList.tsx
 * -------------------
 * Componente de UI responsável pela visualização em CARDS dos agendamentos
 * na Tela de Chamada — visível apenas em telas pequenas (md:hidden).
 *
 * Cada agendamento é exibido como um card individual com:
 *  - Avatar + nome do colaborador + badge de prioridade
 *  - Horário de chegada
 *  - Uma linha por sala com botão de status colorido e label
 *
 * Toda a lógica de negócio é recebida via props — o componente é puramente visual.
 */

import React from 'react';
import { Agendamento } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────

/** Definição de uma coluna de sala */
interface RoomColumn {
    key: string;
    label: string;
}

export interface CallMobileListProps {
    /** Lista de agendamentos visíveis na fila */
    appointments: Agendamento[];

    /** Configuração das colunas de sala */
    roomColumns: RoomColumn[];

    /** Salas com paciente em atendimento ('atendido') */
    occupiedRooms: Set<string>;

    /** Verifica permissão do usuário para uma sala */
    canInteract: (columnKey: string) => boolean;

    /** Avança o status de uma sala para o próximo */
    cycleStatus: (id: number, column: string, currentStatus: string, patientName?: string) => void;

    /** Formata o horário de chegada para exibição */
    formatTime: (val: string | null | undefined) => string;

    /** Retorna as classes CSS do botão de sala */
    getDotColor: (status: string, isClickable: boolean) => string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const CallMobileList: React.FC<CallMobileListProps> = ({
    appointments,
    roomColumns,
    occupiedRooms,
    canInteract,
    cycleStatus,
    formatTime,
    getDotColor,
}) => {
    return (
        // Visível apenas no mobile (escondido em md+)
        <div className="md:hidden space-y-4">
            {appointments.map((apt) => {
                // Verifica se este paciente está ativo em alguma sala
                const activeRoomKey = roomColumns.find(
                    r => apt[r.key as keyof Agendamento] === 'atendido'
                )?.key;

                return (
                    // Card individual do paciente — borda vermelha se prioritário
                    <div
                        key={apt.id}
                        className={`bg-white rounded-ios p-5 shadow-sm border ${apt.prioridade ? 'border-red-200 bg-red-50/20' : 'border-gray-100'}`}
                    >
                        {/* Cabeçalho do Card: avatar + nome + horário de chegada */}
                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                {/* Avatar com inicial do nome */}
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold shadow-sm ${apt.prioridade ? 'bg-red-100 text-red-600' : 'bg-ios-primary/10 text-ios-primary'}`}>
                                    {apt.colaboradores?.nome?.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-ios-text text-lg">{apt.colaboradores?.nome}</h3>
                                    <div className="flex items-center gap-2">
                                        <p className="text-xs text-ios-subtext uppercase font-semibold">Paciente</p>
                                        {/* Badge de prioridade — exibido apenas se o campo prioridade=True */}
                                        {apt.prioridade && (
                                            <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">
                                                PRIORIDADE
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Horário de chegada no canto superior direito do card */}
                            <span className="text-xs font-mono font-bold text-gray-400 bg-gray-50 px-2 py-1 rounded-md">
                                {formatTime(apt.chegou_em)}
                            </span>
                        </div>

                        {/* Lista de salas do paciente: uma linha por sala com status relevante */}
                        <div className="space-y-3">
                            {roomColumns.map(col => {
                                const status = apt[col.key as keyof Agendamento] as string;
                                const isVisible = status === 'Aguardando' || status === 'atendido' || status === 'Finalizado';

                                const hasPermission = canInteract(col.key);
                                const isRoomOccupied = occupiedRooms.has(col.key);

                                // Sala ocupada por outro paciente — bloqueia botão
                                const isOccupiedByOther = isRoomOccupied && status !== 'atendido';

                                // Mesma lógica de concorrência da tabela desktop:
                                // Só permite clicar se tem permissão, o paciente não está ocupado
                                // em outra sala E a sala não está sendo usada por outro paciente.
                                const isClickable = hasPermission &&
                                    (!activeRoomKey || activeRoomKey === col.key) &&
                                    !isOccupiedByOther;

                                // Salas sem status relevante não são exibidas no card
                                if (!isVisible) return null;

                                return (
                                    <div
                                        key={col.key}
                                        className="flex items-center justify-between bg-gray-50 rounded-xl p-3"
                                    >
                                        {/* Label da sala — acinzentada se não clicável */}
                                        <span className={`text-sm font-medium ${isClickable ? 'text-gray-600' : 'text-gray-300'}`}>
                                            {col.label}
                                        </span>

                                        {/* Botão circular de status da sala */}
                                        <button
                                            onClick={() => isClickable && cycleStatus(apt.id, col.key, status, apt.colaboradores?.nome)}
                                            className={`w-10 h-10 rounded-full shadow-sm transition-all flex items-center justify-center border-2 border-white ${getDotColor(status, isClickable)}`}
                                            disabled={!isClickable || status === 'Finalizado'}
                                        >
                                            {/* Ping animado visível somente quando em atendimento e clicável */}
                                            {status === 'atendido' && isClickable && (
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-20" />
                                            )}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default CallMobileList;
