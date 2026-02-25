/**
 * OccupancyChart.tsx
 * -------------------
 * Componente visual do gráfico de barras de ocupação em tempo real das salas.
 *
 * Exibe para cada sala (Médico, Exames, Coleta, Audiometria, Raio-X):
 *  - Uma barra vertical cuja altura é proporcional ao número de pacientes ativos
 *  - Tooltip com o count exato ao passar o mouse (group-hover)
 *  - Label do nome da sala abaixo da barra
 *
 * A normalização das alturas (0–100%) é calculada no hook useDashboardStats,
 * garantindo que a sala mais movimentada sempre ocupe 100% da altura máxima.
 *
 * Este componente é puramente visual — recebe roomOccupancy via props.
 */

import React from 'react';
import { RoomOccupancyItem } from '../../hooks/useDashboardStats';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface OccupancyChartProps {
    /**
     * Array de dados de ocupação por sala, gerado e normalizado pelo hook useDashboardStats.
     * Cada item contém label (nome), count (absoluto) e height (percentual 0–100).
     */
    roomOccupancy: RoomOccupancyItem[];
}

// ─── Componente ───────────────────────────────────────────────────────────────

const OccupancyChart: React.FC<OccupancyChartProps> = ({ roomOccupancy }) => {
    return (
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col hover:shadow-float transition-all duration-500">

            {/* Cabeçalho do card: título + indicador "Atualizado agora" */}
            <div className="mb-6 flex items-center justify-between">
                <div>
                    {/* Linha superior: ícone de grupo + label "Ocupação em Tempo Real" */}
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-ios-secondary/10 flex items-center justify-center text-ios-secondary">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                        </div>
                        <h3 className="text-ios-subtext font-semibold text-sm uppercase tracking-wider">
                            Ocupação em Tempo Real
                        </h3>
                    </div>
                    {/* Título principal do card */}
                    <p className="text-ios-text font-bold text-2xl">Colaboradores na Clínica</p>
                </div>

                {/* Indicador de atualização — visível apenas em telas sm+ */}
                <div className="text-right hidden sm:block">
                    <span className="text-sm font-medium text-green-500 flex items-center gap-1 justify-end">
                        {/* Bolinha pulsante para indicar dados em tempo real */}
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        Atualizado agora
                    </span>
                </div>
            </div>

            {/* Área do gráfico de barras verticais */}
            {/*
       * flex items-end: alinha todas as barras pela base (efeito de crescimento para cima)
       * h-48: altura fixa da área do gráfico para referência das barras proporcionais
       */}
            <div className="flex-1 flex items-end justify-between gap-4 h-48 pt-4 pb-2 border-b border-gray-50">
                {roomOccupancy.map((data, index) => (
                    // Cada coluna = uma sala. group permite o tooltip de hover funcionar nos filhos
                    <div key={index} className="flex flex-col items-center gap-3 flex-1 group h-full justify-end">

                        {/* Container da barra: fundo cinza claro com overflow-hidden para conter a barra */}
                        <div className="w-full max-w-[80px] bg-gray-50 rounded-2xl relative flex items-end overflow-hidden h-full group-hover:bg-gray-100 transition-colors">

                            {/*
               * Barra de preenchimento colorida.
               * height é o percentual calculado pelo hook (0–100% relativo ao máximo).
               * transition-all duration-1000: animação suave ao carregar os dados.
               */}
                            <div
                                style={{ height: `${data.height}%` }}
                                className="w-full bg-gradient-to-t from-ios-primary to-ios-secondary rounded-2xl transition-all duration-1000 ease-out relative shadow-lg shadow-ios-primary/20"
                            >
                                {/*
                 * Tooltip flutuante com o count exato.
                 * Aparece apenas no hover do grupo (opacity-0 → opacity-100).
                 * Posicionado absolutamente acima da barra (-top-8).
                 */}
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-bold text-ios-text bg-white px-2 py-0.5 rounded-lg shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {data.count} pessoas
                                </div>
                            </div>
                        </div>

                        {/* Label da sala abaixo da barra */}
                        <span className="text-xs md:text-sm font-bold text-gray-500">{data.label}</span>
                    </div>
                ))}
            </div>

            {/* Legenda explicativa abaixo do gráfico */}
            <div className="mt-4 text-center text-xs text-gray-400 font-medium">
                Quantidade de colaboradores com status "Aguardando" ou "Atendido" por setor.
            </div>
        </div>
    );
};

export default OccupancyChart;
