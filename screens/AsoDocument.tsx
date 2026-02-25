
import React, { useEffect, useState } from 'react';
import { Agendamento, Colaborador, Unidade } from '../types'; // Tipos globais na raiz do projeto
import { supabase } from '../services/supabaseClient'; // Cliente Supabase canônico em services/

interface AsoDocumentProps {
    appointment: Agendamento;
    onBack: () => void;
}

interface RiskData {
    tipo: number; // 1-Físico, 2-Químico, etc.
    nome: string;
}

const RISK_TYPES: Record<number, string> = {
    1: 'Físicos',
    2: 'Químicos',
    3: 'Ergonômicos',
    4: 'Acidentes',
    5: 'Biológicos'
};

const AsoDocument: React.FC<AsoDocumentProps> = ({ appointment, onBack }) => {
    const [loading, setLoading] = useState(true);
    const [companyInfo, setCompanyInfo] = useState<{ razao_social: string; cnpj: string }>({ razao_social: '', cnpj: '' });
    const [risks, setRisks] = useState<RiskData[]>([]);

    useEffect(() => {
        fetchAsoData();
    }, [appointment]);

    const fetchAsoData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Company Info
            if (appointment.unidade) {
                const { data: unitData } = await supabase.from('unidades').select('empresaid').eq('id', appointment.unidade).single();
                if (unitData && unitData.empresaid) {
                    const { data: clientData } = await supabase.from('clientes').select('nome_fantasia, cnpj').eq('id', unitData.empresaid).single();
                    if (clientData) {
                        setCompanyInfo({ razao_social: clientData.nome_fantasia, cnpj: clientData.cnpj });
                    }
                }
            }

            // 2. Fetch Risks
            // Logic: Get Setor ID -> Unidade_Setor ID -> Riscos_Unidade -> Riscos
            if (appointment.colaboradores?.setor && appointment.unidade) {
                const setorName = appointment.colaboradores.setor;

                // A. Get Setor ID by Name
                const { data: setorData } = await supabase.from('setor').select('id').ilike('nome', setorName).maybeSingle();

                if (setorData) {
                    // B. Get Unidade_Setor ID
                    // Assuming table 'unidade_setor' has columns: id, unidade_id, setor_id
                    // Note: Schema provided in prompt for 'riscos_unidade' references 'unidade_setor', implying this table exists.
                    const { data: usData } = await supabase
                        .from('unidade_setor')
                        .select('id')
                        .eq('unidade_id', appointment.unidade)
                        .eq('setor_id', setorData.id)
                        .maybeSingle();

                    if (usData) {
                        // C. Get Risk IDs
                        const { data: riskLinks } = await supabase
                            .from('riscos_unidade')
                            .select('risco_id')
                            .eq('unidade_setor', usData.id);

                        if (riskLinks && riskLinks.length > 0) {
                            const riskIds = riskLinks.map(r => r.risco_id);

                            // D. Get Risk Details
                            const { data: riskDetails } = await supabase
                                .from('riscos')
                                .select('nome, tipo')
                                .in('id', riskIds);

                            if (riskDetails) {
                                setRisks(riskDetails);
                            }
                        }
                    }
                }
            }
        } catch (e) {
            console.error("Error fetching ASO data:", e);
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    const renderRisksByType = (typeId: number) => {
        const typeRisks = risks.filter(r => r.tipo === typeId);
        if (typeRisks.length === 0) return "Ausência de riscos";
        return typeRisks.map(r => r.nome).join(', ');
    };

    return (
        <div className="min-h-screen bg-gray-100 py-8 relative">
            {/* Toolbar - Hidden on Print */}
            <div className="fixed top-4 right-4 flex gap-2 print:hidden z-50">
                <button onClick={onBack} className="bg-gray-600 text-white px-4 py-2 rounded shadow hover:bg-gray-700">Voltar</button>
                <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                    Imprimir
                </button>
            </div>

            {/* A4 Document Container */}
            <div className="bg-white max-w-[21cm] mx-auto p-[1cm] shadow-lg print:shadow-none print:w-full print:max-w-none print:p-0 text-black font-serif text-sm">
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

                <div id="aso-content" className="space-y-4">
                    {/* Header */}
                    <div className="text-center border-b-2 border-black pb-2 mb-4">
                        <h1 className="text-xl font-bold uppercase">ASO - Atestado de Saúde Ocupacional</h1>
                        <h2 className="text-lg font-bold uppercase">{appointment.unidades?.nome_unidade || 'Unidade'}</h2>
                    </div>

                    {/* Quadro 1: Empresa */}
                    <div className="border border-black p-2">
                        <h3 className="font-bold bg-gray-200 p-1 mb-2 text-center uppercase text-xs border-b border-black">Empresa</h3>
                        <div className="grid grid-cols-1 gap-1" contentEditable suppressContentEditableWarning>
                            <p><strong>Razão Social:</strong> {companyInfo.razao_social || '________________________________'}</p>
                            <p><strong>CNPJ:</strong> {companyInfo.cnpj || '____________________'}</p>
                        </div>
                    </div>

                    {/* Quadro 2: Funcionario */}
                    <div className="border border-black p-2">
                        <h3 className="font-bold bg-gray-200 p-1 mb-2 text-center uppercase text-xs border-b border-black">Funcionário</h3>
                        <div className="grid grid-cols-2 gap-x-4 gap-y-1" contentEditable suppressContentEditableWarning>
                            <p className="col-span-2"><strong>Nome:</strong> {appointment.colaboradores?.nome}</p>
                            <p><strong>Nascimento:</strong> {appointment.colaboradores?.data_nascimento ? new Date(appointment.colaboradores.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : ''}</p>
                            <p>
                                <strong>Sexo:</strong>{' '}
                                {appointment.colaboradores?.sexo === 'M' ? 'Masculino' :
                                    appointment.colaboradores?.sexo === 'F' ? 'Feminino' :
                                        appointment.colaboradores?.sexo}
                            </p>
                            <p><strong>Cargo:</strong> {appointment.colaboradores?.cargos?.nome}</p>
                            <p><strong>Setor:</strong> {appointment.colaboradores?.setor}</p>
                            <p><strong>CPF:</strong> {appointment.colaboradores?.cpf}</p>
                        </div>
                    </div>

                    {/* Quadro 3: Medico Responsavel */}
                    <div className="border border-black p-2 text-center">
                        <h3 className="font-bold bg-gray-200 p-1 mb-2 uppercase text-xs border-b border-black">Médico Responsável pelo PCMSO</h3>
                        <p contentEditable suppressContentEditableWarning><strong>Mariana Barros Innocente</strong> &nbsp;&nbsp;&nbsp; CRM: 55279 - MG</p>
                    </div>

                    {/* Quadro 4: Riscos */}
                    <div className="border border-black p-2">
                        <h3 className="font-bold bg-gray-200 p-1 mb-2 text-center uppercase text-xs border-b border-black">Perigos / Fatores de Risco</h3>
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

                    {/* Quadro 5: Tipo Exame */}
                    <div className="border border-black p-2">
                        <div className="text-[10px] text-justify mb-2 leading-tight">
                            EM CUMPRIMENTO ÀS PORTARIAS NºS 3214/78, 3164/82, 12/83, 24/94 E 08/96 NR7 DO MINISTÉRIO DO TRABALHO E EMPREGO PARA FINS DE EXAME:
                        </div>
                        <div className="font-bold text-center uppercase text-lg" contentEditable suppressContentEditableWarning>
                            {appointment.tipo || '__________________'}
                        </div>
                    </div>

                    {/* Quadro 6: Avaliacao Clinica */}
                    <div className="border border-black p-2 min-h-[100px]">
                        <h3 className="font-bold bg-gray-200 p-1 mb-2 text-center uppercase text-xs border-b border-black">Avaliação Clínica e Exames Realizados</h3>
                        <div className="text-sm space-y-1" contentEditable suppressContentEditableWarning>
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
                            {/* Extra space for manual entry */}
                            <div className="h-4"></div>
                            <div className="h-4"></div>
                        </div>
                    </div>

                    {/* Quadro 7: Parecer */}
                    <div className="border border-black p-2">
                        <h3 className="font-bold bg-gray-200 p-1 mb-2 text-center uppercase text-xs border-b border-black">Parecer</h3>
                        <div className="flex justify-around py-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className="w-6 h-6 border border-black rounded-sm flex items-center justify-center"></div>
                                <span className="font-bold">Apto para função</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <div className="w-6 h-6 border border-black rounded-sm flex items-center justify-center"></div>
                                <span className="font-bold">Inapto para função</span>
                            </label>
                        </div>
                    </div>

                    {/* Quadro 8: Assinaturas */}
                    <div className="grid grid-cols-2 gap-8 mt-12 pt-8">
                        <div className="text-center">
                            <div className="border-t border-black w-3/4 mx-auto pt-1 mb-1"></div>
                            <p className="font-bold text-xs uppercase">Assinatura do Médico</p>
                        </div>
                        <div className="text-center">
                            <div className="border-t border-black w-3/4 mx-auto pt-1 mb-1"></div>
                            <p className="font-bold text-xs uppercase">{appointment.colaboradores?.nome}</p>
                            <p className="text-[10px] text-gray-500 uppercase">Assinatura do Colaborador</p>
                        </div>
                    </div>

                    <div className="text-[10px] text-center text-gray-400 mt-8">
                        Gerado eletronicamente pelo sistema Gama Center em {new Date().toLocaleDateString('pt-BR')}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AsoDocument;
