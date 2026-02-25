/**
 * useAttendanceTimer.ts
 * ----------------------
 * Custom hook para o cronômetro de atendimento ativo.
 *
 * Responsabilidade única: calcular e formatar o tempo decorrido
 * desde o início de um atendimento (activeCallData.startTime).
 *
 * O hook atualiza o display a cada segundo via setInterval
 * e retorna uma string no formato 'MM:SS' para exibição no botão flutuante.
 *
 * Quando activeCallData é null (sem atendimento ativo), o cronômetro
 * é resetado para '00:00' e o interval é cancelado — evitando vazamentos de memória.
 */

import { useEffect, useState } from 'react';

// ─── Interface de Entrada ─────────────────────────────────────────────────────

interface ActiveCallData {
    startTime: Date;      // Momento exato em que o atendimento foi iniciado
    patientName: string;  // Não utilizado pelo timer, mas mantido para tipagem consistente
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

/**
 * Calcula o tempo decorrido em relação ao início de um atendimento.
 *
 * @param activeCallData - Dados do atendimento ativo, ou null se nenhum estiver ativo
 * @returns String no formato 'MM:SS' (ex: '05:42') ou '00:00' se inativo
 */
export function useAttendanceTimer(activeCallData: ActiveCallData | null): string {
    // Estado que guarda o tempo formatado exibido no timer flutuante
    const [elapsedTime, setElapsedTime] = useState<string>('00:00');

    useEffect(() => {
        let interval: ReturnType<typeof setInterval>;

        if (activeCallData) {
            // Atualiza o display do cronômetro a cada segundo enquanto houver atendimento ativo
            interval = setInterval(() => {
                const now = new Date();

                // Calcula quantos segundos se passaram desde o início do atendimento
                const diffInSeconds = Math.floor(
                    (now.getTime() - activeCallData.startTime.getTime()) / 1000
                );

                // Converte segundos totais em minutos e segundos separados
                const minutes = Math.floor(diffInSeconds / 60);
                const seconds = diffInSeconds % 60;

                // Formata no padrão MM:SS com zero à esquerda (ex: 05:07, 60:00)
                const formatted = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                setElapsedTime(formatted);
            }, 1000);
        } else {
            // Sem atendimento ativo: reseta o display para o estado inicial
            setElapsedTime('00:00');
        }

        // Cleanup: cancela o setInterval ao desmontar ou ao trocar activeCallData
        // Evita acumulação de múltiplos intervals e vazamento de memória
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [activeCallData]); // Re-executa somente quando activeCallData muda

    return elapsedTime;
}
