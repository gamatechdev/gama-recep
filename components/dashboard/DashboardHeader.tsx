/**
 * DashboardHeader.tsx
 * --------------------
 * Componente visual do cabeçalho do Dashboard.
 *
 * Exibe:
 *  - Saudação personalizada com o nome do usuário autenticado
 *  - Data de hoje por extenso em português (ex: "terça-feira, 25 de fevereiro")
 *
 * É um componente puramente estático — apenas recebe dados e os exibe.
 * Toda a lógica de busca do nome está no hook useDashboardStats.
 */

import React from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

export interface DashboardHeaderProps {
    /** Nome do usuário autenticado para exibir na saudação — fallback para 'Usuário' se vazio */
    userName: string;
}

// ─── Componente ───────────────────────────────────────────────────────────────

const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName }) => {
    /**
     * Formata a data de hoje por extenso em português do Brasil.
     * Calculado diretamente no render pois não muda durante a sessão.
     * Exemplo de saída: "terça-feira, 25 de fevereiro"
     */
    const todayDisplay = new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
    });

    return (
        <div>
            {/* Saudação: exibe o nome do usuário ou 'Usuário' como fallback */}
            <h1 className="text-4xl font-bold text-ios-text tracking-tight mb-2">
                Bem vindo(a), {userName || 'Usuário'} 👋
            </h1>

            {/* Data de hoje + CTA para o resumo de operação */}
            <p className="text-lg text-ios-subtext font-medium">
                Hoje é{' '}
                {/* capitalize garante que o dia da semana inicie com letra maiúscula */}
                <span className="capitalize text-ios-text font-semibold">{todayDisplay}</span>.
                {/* Quebra de linha apenas em telas médias para não quebrar o fluxo no mobile */}
                <br className="hidden md:block" /> Aqui está um resumo da sua operação:
            </p>
        </div>
    );
};

export default DashboardHeader;
