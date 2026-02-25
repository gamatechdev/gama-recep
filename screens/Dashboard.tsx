/**
 * Dashboard.tsx (Orquestrador)
 * -----------------------------
 * Tela principal do Dashboard — atua exclusivamente como ORQUESTRADOR.
 *
 * Responsabilidade deste arquivo:
 *  - Invocar o hook useDashboardStats para obter dados e métricas calculadas
 *  - Exibir o spinner de carregamento enquanto os dados chegam do Supabase
 *  - Repassar os dados como props para os componentes visuais filhos
 *
 * O que NÃO está mais neste arquivo:
 *  - Fetch de dados (agendamentos, usuário)    → useDashboardStats
 *  - Cálculos de métricas e gráficos          → useDashboardStats
 *  - JSX do cabeçalho de saudação             → DashboardHeader
 *  - JSX dos cards de total e taxa de presença → StatCards
 *  - JSX do gráfico de barras de ocupação     → OccupancyChart
 */

import React from 'react';

// ─── Hook de Dados e Cálculos ─────────────────────────────────────────────────
import { useDashboardStats } from '../hooks/useDashboardStats';

// ─── Subcomponentes de UI ─────────────────────────────────────────────────────
import DashboardHeader from '../components/dashboard/DashboardHeader';
import StatCards from '../components/dashboard/StatCards';
import OccupancyChart from '../components/dashboard/OccupancyChart';

// ─── Componente Orquestrador ──────────────────────────────────────────────────

const Dashboard: React.FC = () => {
    /**
     * Único ponto de acesso a dados desta tela.
     * O hook busca os agendamentos do dia, calcula as métricas e a ocupação,
     * e retorna tudo pronto para ser repassado aos subcomponentes.
     */
    const { loading, userName, stats, roomOccupancy } = useDashboardStats();

    // ── Estado de Carregamento ────────────────────────────────────────────────
    // Exibido enquanto o hook ainda não terminou de buscar os dados do Supabase
    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ios-primary" />
                <p className="text-ios-subtext animate-pulse">Carregando painel...</p>
            </div>
        );
    }

    // ── Render Principal ──────────────────────────────────────────────────────
    return (
        // Animação de entrada suave ao montar o componente
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/*
       * DashboardHeader: Exibe a saudação "Bem vindo(a), [nome]"
       * e a data de hoje por extenso em português.
       */}
            <DashboardHeader userName={userName} />

            {/*
       * StatCards: Grid de 2 cards com as métricas do dia.
       * — Card 1: Total de pacientes agendados hoje
       * — Card 2: Taxa de presença com gráfico circular animado
       */}
            <StatCards stats={stats} />

            {/*
       * OccupancyChart: Gráfico de barras em tempo real.
       * Cada barra representa uma sala e sua altura é proporcional
       * ao número de pacientes ainda ativos (Aguardando ou atendido).
       */}
            <OccupancyChart roomOccupancy={roomOccupancy} />
        </div>
    );
};

export default Dashboard;
