/**
 * AsoDocument.tsx (Orquestrador)
 * --------------------------------
 * Tela do Atestado de Saúde Ocupacional — atua exclusivamente como ORQUESTRADOR.
 *
 * Responsabilidades deste arquivo:
 *  1. Invocar useAsoData(appointment) para obter loading, companyInfo e risks
 *  2. Exibir o spinner enquanto os dados estão sendo carregados
 *  3. Definir handlePrint (window.print())
 *  4. Renderizar AsoToolbar (botões Voltar/Imprimir)
 *  5. Renderizar AsoPrintLayout (documento A4 com os dados)
 *
 * O que NÃO está mais neste arquivo:
 *  - Queries ao Supabase (unidades → clientes, setor → riscos)  → asoService.ts
 *  - Estados loading, companyInfo, risks e useEffect             → useAsoData.ts
 *  - JSX da toolbar (botões Voltar e Imprimir)                   → AsoToolbar.tsx
 *  - JSX do documento A4 com CSS de impressão e 8 quadros        → AsoPrintLayout.tsx
 */

import React from 'react';
import { Agendamento } from '../types';

// ─── Hook de Dados ────────────────────────────────────────────────────────────
import { useAsoData } from '../hooks/useAsoData';

// ─── Subcomponentes de UI ─────────────────────────────────────────────────────
import AsoToolbar from '../components/aso/AsoToolbar';
import AsoPrintLayout from '../components/aso/AsoPrintLayout';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AsoDocumentProps {
    appointment: Agendamento; // Agendamento cujo ASO será gerado
    onBack: () => void;       // Callback para voltar à tela de Agenda
}

// ─── Componente Orquestrador ──────────────────────────────────────────────────

const AsoDocument: React.FC<AsoDocumentProps> = ({ appointment, onBack }) => {
    /**
     * Único ponto de acesso aos dados deste documento.
     * O hook encapsula: estados loading/companyInfo/risks,
     * useEffect de fetch e chamadas ao asoService.
     */
    const { loading, companyInfo, risks } = useAsoData(appointment);

    /**
     * Aciona a impressão nativa do browser.
     * O CSS de impressão embutido no AsoPrintLayout garante que apenas
     * o conteúdo #aso-content seja visível na folha impressa.
     */
    const handlePrint = () => window.print();

    // ── Estado de Carregamento ────────────────────────────────────────────────
    // Exibido enquanto as queries de empresa e riscos estão em andamento
    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900" />
            </div>
        );
    }

    // ── Renderização Principal ────────────────────────────────────────────────
    return (
        // Container de fundo cinza que envolve o "papel" A4
        <div className="min-h-screen bg-gray-100 py-8 relative">

            {/*
       * AsoToolbar: botões fixos no topo-direito.
       * Recebe onBack (navegar de volta) e handlePrint (window.print).
       * Oculta automaticamente durante a impressão via print:hidden.
       */}
            <AsoToolbar onBack={onBack} handlePrint={handlePrint} />

            {/*
       * AsoPrintLayout: documento A4 completo com 8 quadros.
       * Recebe appointment (dados do paciente/exames),
       * companyInfo (empresa/CNPJ) e risks (riscos ocupacionais por tipo).
       */}
            <AsoPrintLayout
                appointment={appointment}
                companyInfo={companyInfo}
                risks={risks}
            />
        </div>
    );
};

export default AsoDocument;
