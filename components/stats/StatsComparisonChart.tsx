/**
 * StatsComparisonChart.tsx
 * -------------------------
 * Gráfico de barras de comparação de desempenho do usuário vs. média da equipe.
 *
 * Lógica de renderização da barra (preservada intacta do original):
 *  - maxVisualScale = globalAverage * 2 → o ponto médio visual (50%) = média global
 *  - percentage = (userTime / maxVisualScale) * 100, clamped entre 5% e 100%
 *  - Cor VERDE  → usuário <= média da equipe (mais rápido ou igual)
 *  - Cor VERMELHA → usuário > média da equipe (mais lento)
 *  - Cor CINZA  → sem dados da equipe para comparação
 *
 * Componente puramente visual — sem lógica de fetch ou cálculo próprios.
 */

import React from 'react';
import { ProfissionalMetric } from '../../services/statsService';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatsComparisonChartProps {
    ranking: ProfissionalMetric[];   // Array com a métrica do usuário atual
    globalAverage: number;           // Média global da equipe em segundos
    userName: string;                // Nome do usuário atual (para avatar e label)
    formatDuration: (totalSeconds: number) => string;    // "Xm YYs"
    formatMinutesOnly: (totalSeconds: number) => number; // Minutos inteiros
}

// ─── Componente ───────────────────────────────────────────────────────────────

const StatsComparisonChart: React.FC<StatsComparisonChartProps> = ({
    ranking,
    globalAverage,
    userName,
    formatDuration,
    formatMinutesOnly,
}) => {
    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-ios-text mb-6">Comparativo com a Equipe</h3>

            <div className="space-y-6">
                {/* ── Renderiza um item por profissional no ranking ────────────────── */}
                {ranking.map((prof) => {

                    /**
                     * Cálculo da largura relativa da barra de progresso.
                     *
                     * maxVisualScale = globalAverage * 2:
                     *   Quando o usuário tem exatamente a média global → barra em 50% (ponto médio)
                     *   Tempo < média → barra < 50% (mais à esquerda = mais rápido)
                     *   Tempo > média → barra > 50% (mais à direita = mais lento)
                     *
                     * O clamp de 5% garante que a barra sempre apareça visualmente,
                     * mesmo que o tempo do usuário seja muito baixo.
                     */
                    const referenceTime = globalAverage > 0 ? globalAverage : 1;
                    const maxVisualScale = referenceTime * 2;
                    let percentage = (prof.avgTimeSeconds / maxVisualScale) * 100;

                    // Clamp entre 5% (visibilidade mínima) e 100% (limite da barra)
                    if (percentage < 5) percentage = 5;
                    if (percentage > 100) percentage = 100;

                    /**
                     * Código de cor da barra:
                     *  - Verde  → usuário mais rápido ou igual à média (bom desempenho)
                     *  - Vermelho → usuário mais lento que a média (atenção)
                     *  - Cinza  → sem dados da equipe para comparação
                     */
                    let barColor = 'bg-ios-primary';
                    let statusText = '';

                    if (prof.avgTimeSeconds <= globalAverage) {
                        // Usuário está na média ou mais rápido — barra verde
                        barColor = 'bg-green-500';
                        const diff = Math.floor(globalAverage - prof.avgTimeSeconds);
                        statusText = `Você está ${diff}s mais rápido que a média da equipe.`;
                    } else {
                        // Usuário está acima da média — barra vermelha como alerta
                        barColor = 'bg-red-400';
                        const diff = Math.floor(prof.avgTimeSeconds - globalAverage);
                        statusText = `Atenção: Você está ${diff}s acima da média da equipe hoje.`;
                    }

                    if (globalAverage === 0) {
                        // Sem dados da equipe — barra cinza e mensagem neutra
                        barColor = 'bg-gray-300';
                        statusText = 'Ainda não há dados suficientes da equipe para comparação.';
                        percentage = 0;
                    }

                    return (
                        <div key={prof.id} className="group">
                            {/* ── Cabeçalho da barra: avatar + nome + médias ──────────── */}
                            <div className="flex justify-between items-end mb-2">
                                <div className="flex items-center gap-3">
                                    {/* Avatar com inicial do nome */}
                                    <span className="w-10 h-10 rounded-full bg-ios-primary/10 text-ios-primary text-sm font-bold flex items-center justify-center border border-ios-primary/20">
                                        {userName.charAt(0).toUpperCase()}
                                    </span>
                                    <div>
                                        {/* Nome do usuário com "(Você)" para identificação */}
                                        <span className="font-bold text-gray-800 block">{userName} (Você)</span>
                                        {/* Média global da equipe como referência contextual */}
                                        <span className="text-xs text-gray-400 font-medium">
                                            Média da Equipe hoje: {formatDuration(globalAverage)}
                                        </span>
                                    </div>
                                </div>
                                {/* Média pessoal do usuário no canto direito */}
                                <div className="text-right">
                                    <span className="block font-bold text-gray-900">{formatDuration(prof.avgTimeSeconds)}</span>
                                    <span className="text-[10px] text-gray-400 font-medium uppercase">Sua Média</span>
                                </div>
                            </div>

                            {/* ── Barra de Progresso ──────────────────────────────────── */}
                            <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200 mt-3">
                                {/* Marcador vertical da média global (fixo em 50% pois maxScale = 2x a média) */}
                                {globalAverage > 0 && (
                                    <div
                                        className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10"
                                        style={{ left: '50%' }}
                                        title="Média da Equipe"
                                    />
                                )}
                                {/* Barra preenchida com cor dinâmica e transição suave */}
                                <div
                                    style={{ width: `${percentage}%` }}
                                    className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out shadow-sm`}
                                />
                            </div>

                            {/* ── Legenda da escala: 0 | Média da Equipe | 2x Média ────── */}
                            <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                                <span>0m</span>
                                <span>Média da Equipe</span>
                                {/* 2x a média global como limite visual máximo da escala */}
                                <span>{formatMinutesOnly(globalAverage * 2)}m+</span>
                            </div>

                            {/* ── Mensagem de status: verde (rápido) ou vermelha (lento) ─ */}
                            <p className={`text-xs mt-3 text-right font-medium ${prof.avgTimeSeconds <= globalAverage ? 'text-green-600' : 'text-red-500'}`}>
                                {statusText}
                            </p>
                        </div>
                    );
                })}

                {/* ── Estado Vazio: sem atendimentos finalizados ──────────────────── */}
                {ranking.length === 0 && (
                    <div className="text-center py-12 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-2xl">
                            📊
                        </div>
                        <p className="font-medium">Sem dados suficientes.</p>
                        <p className="text-xs mt-1">Finalize atendimentos para gerar o comparativo.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StatsComparisonChart;
