/**
 * CallDesktopTable.tsx
 * ---------------------
 * Componente de UI responsável pela visualização em TABELA dos agendamentos
 * na Tela de Chamada — visível apenas em telas médias e maiores (md:block).
 *
 * Exibe colunas de sala com botões coloridos que refletem o status atual:
 *  - 🔴 Vermelho (Aguardando)  → pisca, clicável para iniciar atendimento
 *  - 🟡 Amarelo (atendido)     → em atendimento, clicável para finalizar
 *  - 🟢 Verde   (Finalizado)   → concluído, bloqueado
 *  - ⚪ Cinza                  → sem permissão ou sala ocupada por outro
 *
 * Toda a lógica de negócio (cycleStatus, canInteract, etc.) é recebida via props
 * para que este componente seja puramente visual/apresentacional.
 */

import React from 'react';
import { Agendamento } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────

/** Definição de uma coluna de sala para exibição na tabela */
interface RoomColumn {
    key: string;    // Chave da coluna no agendamento (ex: 'consultorio')
    label: string;  // Label exibida no cabeçalho da tabela (ex: 'Consultório Médico')
}

export interface CallDesktopTableProps {
    /** Lista de agendamentos filtrados e ordenados pelo hook useCallQueue */
    appointments: Agendamento[];

    /** Configuração das colunas de sala a serem renderizadas */
    roomColumns: RoomColumn[];

    /** Conjunto de chaves das salas com paciente 'atendido' (controle de concorrência) */
    occupiedRooms: Set<string>;

    /**
     * Verifica se o usuário logado pode interagir com uma sala específica.
     * Implementado no hook useCallPermissions.
     */
    canInteract: (columnKey: string) => boolean;

    /**
     * Avança o status de um agendamento em uma determinada sala.
     * Aguardando → atendido → Finalizado
     */
    cycleStatus: (id: number, column: string, currentStatus: string, patientName?: string) => void;

    /** Formata o timestamp de chegada para exibição legível (HH:MM) */
    formatTime: (val: string | null | undefined) => string;

    /** Retorna as classes CSS do botão com base no status e permissão do usuário */
    getDotColor: (status: string, isClickable: boolean) => string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const CallDesktopTable: React.FC<CallDesktopTableProps> = ({
    appointments,
    roomColumns,
    occupiedRooms,
    canInteract,
    cycleStatus,
    formatTime,
    getDotColor,
}) => {
    return (
        // Visível somente em md+ (escondido no mobile)
        <div className="hidden md:block bg-white rounded-ios shadow-sm border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">

                    {/* Cabeçalho da tabela: Chegada | Colaborador | [Salas...] */}
                    <thead>
                        <tr className="border-b border-gray-100 bg-gray-50/50">
                            <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Chegada
                            </th>
                            <th className="px-6 py-5 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Colaborador
                            </th>
                            {/* Renderiza dinamicamente uma coluna por sala configurada */}
                            {roomColumns.map(col => (
                                <th
                                    key={col.key}
                                    className="px-6 py-5 text-center text-xs font-bold text-gray-400 uppercase tracking-wider"
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>

                    {/* Corpo da tabela: uma linha por agendamento */}
                    <tbody className="divide-y divide-gray-100">
                        {appointments.map((apt) => {
                            // Verifica se este paciente específico está em alguma sala ('atendido')
                            // Usado para bloquear salas de um paciente já em atendimento
                            const activeRoomKey = roomColumns.find(
                                r => apt[r.key as keyof Agendamento] === 'atendido'
                            )?.key;

                            return (
                                <tr key={apt.id} className="hover:bg-gray-50 transition-colors">

                                    {/* Coluna de Chegada: horário + badge de prioridade */}
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

                                    {/* Coluna do Colaborador: avatar com inicial + nome completo */}
                                    <td className="px-6 py-5 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            {/* Avatar colorido: vermelho para prioritário, azul padrão */}
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shadow-sm ${apt.prioridade ? 'bg-red-100 text-red-600 ring-2 ring-red-100' : 'bg-ios-primary/10 text-ios-primary'}`}>
                                                {apt.colaboradores?.nome?.charAt(0)}
                                            </div>
                                            <span className="font-semibold text-ios-text text-sm">
                                                {apt.colaboradores?.nome}
                                            </span>
                                        </div>
                                    </td>

                                    {/* Colunas de Sala: uma célula por sala configurada */}
                                    {roomColumns.map(col => {
                                        const status = apt[col.key as keyof Agendamento] as string;
                                        // Só renderiza o botão se o status for relevante (não null/undefined)
                                        const isVisible = status === 'Aguardando' || status === 'atendido' || status === 'Finalizado';

                                        // Lógica de permissão + controle de concorrência
                                        const hasPermission = canInteract(col.key);
                                        const isRoomOccupied = occupiedRooms.has(col.key);

                                        // Sala ocupada por OUTRO paciente (não este)
                                        const isOccupiedByOther = isRoomOccupied && status !== 'atendido';

                                        // Um botão é clicável se:
                                        // 1. O usuário tem permissão para esta sala
                                        // 2. O paciente não está em outra sala OU esta é a sala ativa dele
                                        // 3. A sala não está ocupada por outro paciente
                                        const isClickable = hasPermission &&
                                            (!activeRoomKey || activeRoomKey === col.key) &&
                                            !isOccupiedByOther;

                                        // Tooltips descritivos para orientar o usuário
                                        let tooltip = !isClickable ? 'Bloqueado' : 'Ação';
                                        if (status === 'atendido') tooltip = 'Em atendimento';
                                        if (isOccupiedByOther) tooltip = 'Sala ocupada por outro paciente';

                                        // Célula vazia para salas sem status relevante
                                        if (!isVisible) return <td key={col.key} className="px-6 py-5" />;

                                        return (
                                            <td key={col.key} className="px-6 py-5 whitespace-nowrap text-center">
                                                {/* Botão circular colorido — clicável ou desabilitado conforme permissão/concorrência */}
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
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CallDesktopTable;
