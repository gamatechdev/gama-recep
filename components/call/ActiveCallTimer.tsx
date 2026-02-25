/**
 * ActiveCallTimer.tsx
 * --------------------
 * Botão flutuante que exibe o cronômetro de atendimento em andamento.
 * Aparece no canto inferior direito da tela quando há um paciente sendo atendido.
 *
 * Visual:
 *  - Fundo amarelo (indica atenção / atendimento ativo)
 *  - Nome do paciente truncado
 *  - Cronômetro MM:SS em fonte monospace
 *  - Ponto vermelho pulsando (indicador de atividade em tempo real)
 *
 * Este componente é puramente visual: recebe activeCallData e elapsedTime
 * via props e não possui estado nem lógica interna.
 * O cálculo do tempo decorrido é feito pelo hook useAttendanceTimer.
 */

import React from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface ActiveCallTimerProps {
    /** Dados do atendimento ativo — o componente só renderiza quando não é null */
    activeCallData: {
        startTime: Date;      // Usado externamente pelo hook, não diretamente aqui
        patientName: string;  // Nome exibido no botão para o profissional saber quem está atendendo
    } | null;

    /** String do tempo decorrido já formatada pelo hook useAttendanceTimer (ex: '05:42') */
    elapsedTime: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const ActiveCallTimer: React.FC<ActiveCallTimerProps> = ({ activeCallData, elapsedTime }) => {
    // Não renderiza nada quando não há atendimento ativo
    if (!activeCallData) return null;

    return (
        // Posicionamento fixo no canto inferior direito, acima de outros elementos (z-50)
        <div className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 z-50 animate-in fade-in slide-in-from-bottom-4">
            <div className="bg-yellow-400 text-yellow-900 rounded-full shadow-float px-6 py-4 flex items-center gap-4 border-2 border-white transform hover:scale-105 transition-transform cursor-pointer group">

                {/* Informações do paciente: label + nome */}
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-70">
                        Em atendimento
                    </span>
                    {/* Trunca nomes longos para não quebrar o layout do botão */}
                    <span className="text-sm font-bold truncate max-w-[150px]">
                        {activeCallData.patientName}
                    </span>
                </div>

                {/* Divisor vertical entre nome e cronômetro */}
                <div className="h-8 w-px bg-yellow-900/10" />

                {/* Cronômetro: tempo decorrido + indicador de gravação pulsando */}
                <div className="flex items-center gap-2">
                    {/* Valor formatado recebido do hook useAttendanceTimer */}
                    <span className="text-2xl font-mono font-bold tracking-tight">
                        {elapsedTime}
                    </span>
                    {/* Ponto vermelho pulsante — indica que o atendimento está ativo */}
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                </div>
            </div>
        </div>
    );
};

export default ActiveCallTimer;
