/**
 * StatsScreen.tsx (Orquestrador)
 * --------------------------------
 * Tela de Estatísticas de Desempenho — atua exclusivamente como ORQUESTRADOR.
 *
 * Responsabilidades deste arquivo:
 *  1. Invocar o hook useStats() para obter todos os dados e utilitários de formatação
 *  2. Exibir o spinner enquanto os dados estão sendo carregados
 *  3. Renderizar ordenadamente: StatsHeader → StatsKpiCards → StatsComparisonChart
 *
 * O que NÃO está mais neste arquivo:
 *  - Queries ao Supabase (auth + users + atendimentos)  → statsService.ts
 *  - Estados e useEffect                                → useStats.ts
 *  - Lógica de processamento de métricas               → useStats.ts / processMetrics
 *  - Funções formatDuration e formatMinutesOnly         → useStats.ts
 *  - JSX do cabeçalho                                  → StatsHeader.tsx
 *  - JSX dos cards KPI                                 → StatsKpiCards.tsx
 *  - JSX do gráfico de comparação                      → StatsComparisonChart.tsx
 */

import React from 'react';

// ─── Hook de Dados e Lógica ───────────────────────────────────────────────────
import { useStats } from '../hooks/useStats';

// ─── Subcomponentes de UI ─────────────────────────────────────────────────────
import StatsHeader from '../components/stats/StatsHeader';
import StatsKpiCards from '../components/stats/StatsKpiCards';
import StatsComparisonChart from '../components/stats/StatsComparisonChart';

// ─── Componente Orquestrador ──────────────────────────────────────────────────

const StatsScreen: React.FC = () => {
    /**
     * Único ponto de acesso a dados e utilitários desta tela.
     * O hook encapsula: 6 estados, fetch de usuário + atendimentos, processMetrics
     * e as funções de formatação de duração.
     */
    const {
        loading,
        averageTime,
        globalAverage,
        totalServices,
        ranking,
        userName,
        formatDuration,
        formatMinutesOnly,
    } = useStats();

    // ── Estado de Carregamento ─────────────────────────────────────────────────
    // Exibido enquanto as queries de usuário e atendimentos estão em andamento
    if (loading) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-ios-subtext">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ios-primary" />
                Calculando comparativo da equipe...
            </div>
        );
    }

    // ── Renderização Principal ─────────────────────────────────────────────────
    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/*
       * StatsHeader: Título "Desempenho Diário" e data de hoje.
       * Componente estático, sem props.
       */}
            <StatsHeader />

            {/*
       * StatsKpiCards: Dois cards superiores (total atendimentos + tempo médio).
       * Recebe os valores brutos e a função de formatação de minutos.
       */}
            <StatsKpiCards
                totalServices={totalServices}
                averageTime={averageTime}
                formatMinutesOnly={formatMinutesOnly}
            />

            {/*
       * StatsComparisonChart: Gráfico de barra com comparativo vs. equipe.
       * Recebe ranking, média global, nome do usuário e ambas funções de formatação.
       */}
            <StatsComparisonChart
                ranking={ranking}
                globalAverage={globalAverage}
                userName={userName}
                formatDuration={formatDuration}
                formatMinutesOnly={formatMinutesOnly}
            />
        </div>
    );
};

export default StatsScreen;
