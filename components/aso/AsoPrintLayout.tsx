/**
 * AsoPrintLayout.tsx
 * -------------------
 * Componente responsável por renderizar todo o layout A4 do documento ASO.
 * Inclui 8 quadros: Cabeçalho, Empresa, Funcionário, Médico Responsável,
 * Riscos Ocupacionais, Tipo de Exame, Avaliação Clínica, Parecer e Assinaturas.
 *
 * Características especiais preservadas:
 *  - CSS de impressão (@media print) embutido via <style>
 *  - Atributos contentEditable nos quadros para edição manual antes de imprimir
 *  - Dimensões A4 (max-w-[21cm], p-[1cm]) para correta formatação na impressão
 *
 * Recebe os dados brutos via props e a função renderRisksByType implementada internamente.
 */

import React from 'react';
import { Agendamento } from '../../types';
import { CompanyInfo, RiskData } from '../../services/asoService';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AsoPrintLayoutProps {
    appointment: Agendamento;   // Dados completos do agendamento (colaborador, exames, etc.)
    companyInfo: CompanyInfo;   // Razão social e CNPJ da empresa
    risks: RiskData[];          // Lista de riscos ocupacionais do setor/unidade
}

// ─── Componente ───────────────────────────────────────────────────────────────

const AsoPrintLayout: React.FC<AsoPrintLayoutProps> = ({ appointment, companyInfo, risks }) => {

    /**
     * Agrupa e formata os riscos por tipo para exibição no quadro de riscos.
     * Filtra o array `risks` pelo tipo numérico (1=Físico, 2=Químico, etc.)
     * e retorna os nomes concatenados por vírgula, ou "Ausência de riscos".
     *
     * @param typeId - Tipo numérico do risco (1-5)
     * @returns String formatada com os riscos do tipo ou "Ausência de riscos"
     */
    const renderRisksByType = (typeId: number): string => {
        const typeRisks = risks.filter(r => r.tipo === typeId);
        if (typeRisks.length === 0) return 'Ausência de riscos';
        return typeRisks.map(r => r.nome).join(', ');
    };

    return (
        // Container A4: largura máxima de 21cm, padding de 1cm, centralizado
        // Em modo de impressão: ocupa 100% da largura, sem sombra e sem margens externas
        <div className="bg-white max-w-[21cm] mx-auto p-[1cm] shadow-lg print:shadow-none print:w-full print:max-w-none print:p-0 text-black font-serif text-sm">

            {/*
       * CSS de impressão embutido.
       * - Oculta todos os elementos da página durante o print
       * - Torna apenas #aso-content visível e posicionado no topo da página
       * - Define margem de 1cm e tamanho A4 para a página impressa
       * - .editable:empty:before → pseudo-elemento para placeholder nos campos editáveis
       */}
            <style>{`
        @media print {
          body * { visibility: hidden; }
          #aso-content, #aso-content * { visibility: visible; }
          #aso-content { position: absolute; left: 0; top: 0; width: 100%; }
          @page { margin: 1cm; size: A4; }
        }
        .editable:empty:before {
          content: attr(placeholder);
          color: #999;
        }
      `}</style>

            {/* Conteúdo principal do ASO — ID usado pelo CSS de impressão para isolamento */}
            <div id="aso-content" className="space-y-4">

                {/* ── Quadro 1: Cabeçalho ──────────────────────────────────────────── */}
                <div className="text-center border-b-2 border-black pb-2 mb-4">
                    <h1 className="text-xl font-bold uppercase">ASO - Atestado de Saúde Ocupacional</h1>
                    {/* Nome da unidade de atendimento */}
                    <h2 className="text-lg font-bold uppercase">{appointment.unidades?.nome_unidade || 'Unidade'}</h2>
                </div>

                {/* ── Quadro 2: Empresa ────────────────────────────────────────────── */}
                <div className="border border-black p-2">
                    <h3 className="font-bold bg-gray-200 p-1 mb-2 text-center uppercase text-xs border-b border-black">Empresa</h3>
                    {/* contentEditable permite edição manual pelo médico antes de imprimir */}
                    <div className="grid grid-cols-1 gap-1" contentEditable suppressContentEditableWarning>
                        <p><strong>Razão Social:</strong> {companyInfo.razao_social || '________________________________'}</p>
                        <p><strong>CNPJ:</strong> {companyInfo.cnpj || '____________________'}</p>
                    </div>
                </div>

                {/* ── Quadro 3: Funcionário ────────────────────────────────────────── */}
                <div className="border border-black p-2">
                    <h3 className="font-bold bg-gray-200 p-1 mb-2 text-center uppercase text-xs border-b border-black">Funcionário</h3>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1" contentEditable suppressContentEditableWarning>
                        <p className="col-span-2"><strong>Nome:</strong> {appointment.colaboradores?.nome}</p>
                        <p>
                            <strong>Nascimento:</strong>{' '}
                            {appointment.colaboradores?.data_nascimento
                                ? new Date(appointment.colaboradores.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' })
                                : ''}
                        </p>
                        <p>
                            <strong>Sexo:</strong>{' '}
                            {appointment.colaboradores?.sexo === 'M' ? 'Masculino'
                                : appointment.colaboradores?.sexo === 'F' ? 'Feminino'
                                    : appointment.colaboradores?.sexo}
                        </p>
                        <p><strong>Cargo:</strong> {appointment.colaboradores?.cargos?.nome}</p>
                        <p><strong>Setor:</strong> {appointment.colaboradores?.setor}</p>
                        <p><strong>CPF:</strong> {appointment.colaboradores?.cpf}</p>
                    </div>
                </div>

                {/* ── Quadro 4: Médico Responsável ─────────────────────────────────── */}
                <div className="border border-black p-2 text-center">
                    <h3 className="font-bold bg-gray-200 p-1 mb-2 uppercase text-xs border-b border-black">Médico Responsável pelo PCMSO</h3>
                    {/* Campo editável — permite substituição do médico antes de imprimir */}
                    <p contentEditable suppressContentEditableWarning>
                        <strong>Mariana Barros Innocente</strong>&nbsp;&nbsp;&nbsp; CRM: 55279 - MG
                    </p>
                </div>

                {/* ── Quadro 5: Perigos / Fatores de Risco ─────────────────────────── */}
                <div className="border border-black p-2">
                    <h3 className="font-bold bg-gray-200 p-1 mb-2 text-center uppercase text-xs border-b border-black">Perigos / Fatores de Risco</h3>
                    {/* Grid de 2 colunas: categoria (esquerda) | riscos do tipo (direita) */}
                    <div className="grid grid-cols-[100px_1fr] gap-y-1 text-xs" contentEditable suppressContentEditableWarning>
                        <div className="font-bold border-r border-gray-300 pr-2">Físicos</div>
                        <div className="pl-2">{renderRisksByType(1)}</div>

                        <div className="font-bold border-r border-gray-300 pr-2">Químicos</div>
                        <div className="pl-2">{renderRisksByType(2)}</div>

                        <div className="font-bold border-r border-gray-300 pr-2">Biológicos</div>
                        <div className="pl-2">{renderRisksByType(5)}</div>

                        <div className="font-bold border-r border-gray-300 pr-2">Ergonômicos</div>
                        <div className="pl-2">{renderRisksByType(3)}</div>

                        <div className="font-bold border-r border-gray-300 pr-2">Acidentes</div>
                        <div className="pl-2">{renderRisksByType(4)}</div>
                    </div>
                </div>

                {/* ── Quadro 6: Tipo de Exame ───────────────────────────────────────── */}
                <div className="border border-black p-2">
                    {/* Texto legal obrigatório (NR7) */}
                    <div className="text-[10px] text-justify mb-2 leading-tight">
                        EM CUMPRIMENTO ÀS PORTARIAS NºS 3214/78, 3164/82, 12/83, 24/94 E 08/96 NR7 DO MINISTÉRIO DO TRABALHO E EMPREGO PARA FINS DE EXAME:
                    </div>
                    {/* Tipo do exame (Admissional, Périodico, etc.) — editável */}
                    <div className="font-bold text-center uppercase text-lg" contentEditable suppressContentEditableWarning>
                        {appointment.tipo || '__________________'}
                    </div>
                </div>

                {/* ── Quadro 7: Avaliação Clínica e Exames Realizados ──────────────── */}
                <div className="border border-black p-2 min-h-[100px]">
                    <h3 className="font-bold bg-gray-200 p-1 mb-2 text-center uppercase text-xs border-b border-black">Avaliação Clínica e Exames Realizados</h3>
                    <div className="text-sm space-y-1" contentEditable suppressContentEditableWarning>
                        {/* Lista cada exame do snapshot (ou Avaliação Clínica como fallback) */}
                        {appointment.exames_snapshot && appointment.exames_snapshot.length > 0 ? (
                            appointment.exames_snapshot.map((exame, idx) => (
                                <div key={idx} className="flex gap-4 border-b border-dashed border-gray-300 py-1">
                                    <span className="font-mono">{new Date(appointment.data_atendimento).toLocaleDateString('pt-BR')}</span>
                                    <span>{exame}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex gap-4 border-b border-dashed border-gray-300 py-1">
                                <span className="font-mono">{new Date(appointment.data_atendimento).toLocaleDateString('pt-BR')}</span>
                                <span>Avaliação Clínica</span>
                            </div>
                        )}
                        {/* Espaços em branco para entradas manuais adicionais */}
                        <div className="h-4" />
                        <div className="h-4" />
                    </div>
                </div>

                {/* ── Quadro 8: Parecer (Apto / Inapto) ───────────────────────────── */}
                <div className="border border-black p-2">
                    <h3 className="font-bold bg-gray-200 p-1 mb-2 text-center uppercase text-xs border-b border-black">Parecer</h3>
                    <div className="flex justify-around py-4">
                        {/* Checkbox visual: Apto */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <div className="w-6 h-6 border border-black rounded-sm flex items-center justify-center" />
                            <span className="font-bold">Apto para função</span>
                        </label>
                        {/* Checkbox visual: Inapto */}
                        <label className="flex items-center gap-2 cursor-pointer">
                            <div className="w-6 h-6 border border-black rounded-sm flex items-center justify-center" />
                            <span className="font-bold">Inapto para função</span>
                        </label>
                    </div>
                </div>

                {/* ── Quadro 9: Área de Assinaturas ────────────────────────────────── */}
                <div className="grid grid-cols-2 gap-8 mt-12 pt-8">
                    {/* Assinatura do Médico */}
                    <div className="text-center">
                        <div className="border-t border-black w-3/4 mx-auto pt-1 mb-1" />
                        <p className="font-bold text-xs uppercase">Assinatura do Médico</p>
                    </div>
                    {/* Assinatura do Colaborador */}
                    <div className="text-center">
                        <div className="border-t border-black w-3/4 mx-auto pt-1 mb-1" />
                        <p className="font-bold text-xs uppercase">{appointment.colaboradores?.nome}</p>
                        <p className="text-[10px] text-gray-500 uppercase">Assinatura do Colaborador</p>
                    </div>
                </div>

                {/* Rodapé com data de geração do documento */}
                <div className="text-[10px] text-center text-gray-400 mt-8">
                    Gerado eletronicamente pelo sistema Gama Center em {new Date().toLocaleDateString('pt-BR')}
                </div>

            </div>
        </div>
    );
};

export default AsoPrintLayout;
