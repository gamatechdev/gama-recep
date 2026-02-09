
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Agendamento } from '../types';

// Copied from AppointmentForm to ensure consistency for export columns
const EXAMES_LIST_EXPORT = [
  {"idx":0,"id":447,"nome":"Avaliação Clínica"},
  {"idx":1,"id":448,"nome":"Audiometria"},
  {"idx":2,"id":449,"nome":"Acuidade Visual"},
  {"idx":3,"id":450,"nome":"Espirometria"},
  {"idx":4,"id":451,"nome":"Eletrocardiograma"},
  {"idx":5,"id":452,"nome":"Eletroencefalograma"},
  {"idx":6,"id":453,"nome":"Raio-X Tórax PA OIT"},
  {"idx":7,"id":454,"nome":"Raio-X Coluna L-Sacra"},
  {"idx":8,"id":455,"nome":"Raio-X Mãos e Braços"},
  {"idx":9,"id":456,"nome":"Raio-X Punho"},
  {"idx":10,"id":457,"nome":"Hemograma Completo"},
  {"idx":11,"id":458,"nome":"Glicemia em Jejum"},
  {"idx":12,"id":459,"nome":"EPF (parasitológico fezes)"},
  {"idx":13,"id":460,"nome":"EAS (urina)"},
  {"idx":14,"id":461,"nome":"Grupo Sanguíneo + Fator RH"},
  {"idx":15,"id":462,"nome":"Gama GT"},
  {"idx":16,"id":463,"nome":"TGO / TGP"},
  {"idx":17,"id":464,"nome":"Ácido Trans. Muconico"},
  {"idx":18,"id":465,"nome":"Ácido Úrico"},
  {"idx":19,"id":466,"nome":"Ácido Hipúr. (Tolueno urina)"},
  {"idx":20,"id":467,"nome":"Ácido Metil Hipúrico"},
  {"idx":21,"id":468,"nome":"Ácido Mandélico"},
  {"idx":22,"id":469,"nome":"ALA-U"},
  {"idx":23,"id":470,"nome":"Hemoglobina glicada"},
  {"idx":24,"id":471,"nome":"Coprocultura"},
  {"idx":25,"id":472,"nome":"Colesterol T e F"},
  {"idx":26,"id":473,"nome":"Chumbo Sérico"},
  {"idx":27,"id":474,"nome":"Creatinina"},
  {"idx":28,"id":475,"nome":"Ferro Sérico"},
  {"idx":29,"id":476,"nome":"Manganês Urinário"},
  {"idx":30,"id":477,"nome":"Manganês Sanguíneo"},
  {"idx":31,"id":478,"nome":"Reticulócitos"},
  {"idx":32,"id":479,"nome":"Triglicerídeos"},
  {"idx":33,"id":480,"nome":"IGE Específica - Abelha"},
  {"idx":34,"id":481,"nome":"Acetona Urinária"},
  {"idx":35,"id":482,"nome":"Anti HAV"},
  {"idx":36,"id":483,"nome":"Anti HBS"},
  {"idx":37,"id":484,"nome":"Anti HBSAG"},
  {"idx":38,"id":485,"nome":"Anti HCV"},
  {"idx":39,"id":486,"nome":"Carboxihemoglobina"},
  {"idx":40,"id":487,"nome":"Exame Toxicológico Pelo"},
  {"idx":41,"id":488,"nome":"Avaliação Vocal"},
  {"idx":42,"id":489,"nome":"Avaliação Psicossocial"},
  {"idx":43,"id":490,"nome":"Avaliação Psicológica"},
  {"idx":44,"id":491,"nome":"Aspecto da Pele"},
  {"idx":45,"id":492,"nome":"Questionário Epilepsia"},
  {"idx":46,"id":493,"nome":"Teste Palográfico"},
  {"idx":47,"id":494,"nome":"Teste de Atenção"},
  {"idx":48,"id":495,"nome":"Teste Romberg"},
  {"idx":49,"id":496,"nome":"Exame Toxicológico Urina"},
  {"idx":50,"id":497,"nome":"Higidez"},
  {"idx":51,"id":498,"nome":"Grupo Sanguíneo"}
];

interface AgendaProps {
  onNewAppointment: () => void;
  onEditAppointment: (appointment: Agendamento) => void;
  onGenerateAso?: (appointment: Agendamento) => void;
}

type ViewMode = 'day' | 'week' | 'month';

// Extender a interface Agendamento localmente para incluir prontuarios sem quebrar o types.ts global
interface AgendamentoComProntuarios extends Agendamento {
    prontuarios?: {
        id: number;
        created_at: string;
        tipo: string;
        url: string;
    }[];
}

const Agenda: React.FC<AgendaProps> = ({ onNewAppointment, onEditAppointment, onGenerateAso }) => {
  const [appointments, setAppointments] = useState<AgendamentoComProntuarios[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Date & Filter State
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<ViewMode>('day');
  
  // false = "Todos" (Default), true = "Apenas Pendentes"
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  
  const dateInputRef = useRef<HTMLInputElement>(null);

  // Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  // Export Modal State
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportStartDate, setExportStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [exportEndDate, setExportEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [isExporting, setIsExporting] = useState(false);
  const [includeAbsent, setIncludeAbsent] = useState(true); // Default to including everyone

  // ASO Upload State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const esocFileInputRef = useRef<HTMLInputElement>(null); // Ref for Esoc
  const prontuarioFileInputRef = useRef<HTMLInputElement>(null); // Ref for Prontuario
  
  const [uploadingAsoId, setUploadingAsoId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  // Modal Selection State
  const [uploadModalAppointmentId, setUploadModalAppointmentId] = useState<number | null>(null);
  const [showProcedureListModal, setShowProcedureListModal] = useState(false);

  useEffect(() => {
    // Debounce search or fetch agenda
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        performSearch();
      } else {
        setIsSearching(false);
        fetchAgenda();
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [selectedDate, searchTerm, viewMode, showPendingOnly]);

  const getDateRange = () => {
    const date = new Date(selectedDate + 'T00:00:00');
    let start = selectedDate;
    let end = selectedDate;

    if (viewMode === 'week') {
        // Calculate Sunday to Saturday
        const day = date.getDay(); // 0 (Sun) to 6 (Sat)
        const diffToSun = date.getDate() - day;
        const sunday = new Date(date);
        sunday.setDate(diffToSun);
        
        const saturday = new Date(sunday);
        saturday.setDate(sunday.getDate() + 6);

        start = sunday.toISOString().split('T')[0];
        end = saturday.toISOString().split('T')[0];
    } else if (viewMode === 'month') {
        const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
        const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
        
        start = firstDay.toISOString().split('T')[0];
        end = lastDay.toISOString().split('T')[0];
    }

    return { start, end };
  };

  const fetchAgenda = async () => {
    if (searchTerm.trim()) return; 

    setLoading(true);
    
    const { start, end } = getDateRange();

    let query = supabase
      .from('agendamentos')
      .select(`
        *,
        colaboradores:colaboradores!agendamentos_colaborador_id_fkey (id, nome, cpf, data_nascimento, sexo, cargos(nome), setor),
        unidades:unidades!agendamentos_unidade_fkey (id, nome_unidade),
        prontuarios:prontuarios_agendamentos!prontuarios_agendamentos_agendamento_id_fkey(*)
      `)
      .gte('data_atendimento', start)
      .lte('data_atendimento', end);

    // Filter Logic:
    // If showPendingOnly is TRUE, we filter compareceu = false OR compareceu = null.
    // If showPendingOnly is FALSE (Default), we show everything (no filter applied).
    if (showPendingOnly) {
        query = query.or('compareceu.eq.false,compareceu.is.null');
    }

    // Default Ordering
    query = query
        .order('data_atendimento', { ascending: true }) // Important for ranges
        .order('prioridade', { ascending: false, nullsFirst: false })
        .order('id', { ascending: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching agenda:', JSON.stringify(error, null, 2));
    } else {
      setAppointments(data as unknown as AgendamentoComProntuarios[]);
    }
    setLoading(false);
  };

  const performSearch = async () => {
    setLoading(true);
    setIsSearching(true);

    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        colaboradores:colaboradores!agendamentos_colaborador_id_fkey!inner (id, nome, cpf, data_nascimento, sexo, cargos(nome), setor),
        unidades:unidades!agendamentos_unidade_fkey (id, nome_unidade),
        prontuarios:prontuarios_agendamentos!prontuarios_agendamentos_agendamento_id_fkey(*)
      `)
      .ilike('colaboradores.nome', `%${searchTerm}%`)
      .order('prioridade', { ascending: false, nullsFirst: false })
      .order('data_atendimento', { ascending: false })
      .limit(50);

    if (error) {
      console.error('Error searching:', error);
    } else {
      setAppointments(data as unknown as AgendamentoComProntuarios[]);
    }
    setLoading(false);
  };

  const toggleAttendance = async (id: number, currentStatus: boolean | null) => {
    const originalItem = appointments.find(a => a.id === id);
    if (!originalItem) return;

    // Toggle: if null/false -> true, if true -> false
    const newStatus = !currentStatus;
    
    const now = new Date();
    const pad = (n: number) => n.toString().padStart(2, '0');
    const timeString = `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
    const chegadaTime = newStatus ? timeString : null;
    
    setAppointments(prev => prev.map(a => 
        a.id === id ? { ...a, compareceu: newStatus, chegou_em: chegadaTime } : a
    ));

    try {
        const { error } = await supabase
            .from('agendamentos')
            .update({ 
                compareceu: newStatus,
                chegou_em: chegadaTime
            })
            .eq('id', id);

        if (error) throw error;

        // Se compareceu (newStatus = true) e tem unidade, lança no financeiro
        if (newStatus && originalItem.unidade) {
            // Obtem o 'empresaid' da unidade, que é o ID da tabela clientes
            const { data: unitData } = await supabase
                .from('unidades')
                .select('empresaid')
                .eq('id', originalItem.unidade)
                .single();

            if (unitData && unitData.empresaid) {
                let totalCalculado = 0;
                let statusFinanceiro = 'Pendente';
                let valorEsocCalculado = 0;
                
                // Acumulador para gerencia_meta: { [id_gerencia]: valor }
                const gerenciaTotals: Record<number, number> = {};

                // 1. Buscar dados do cliente (Tabela 'clientes') para verificar ESOC
                const { data: clientData } = await supabase
                    .from('clientes')
                    .select('envia_esoc, valor_esoc')
                    .eq('id', unitData.empresaid)
                    .single();

                // Lógica de cálculo do eSOC (Valor * 2)
                if (clientData && clientData.envia_esoc) {
                    const vEsoc = Number(clientData.valor_esoc || 0);
                    valorEsocCalculado = vEsoc * 2;

                    // Lógica para enviar o valor do eSocial para a gerencia_meta ID 1
                    if (valorEsocCalculado > 0) {
                        gerenciaTotals[1] = (gerenciaTotals[1] || 0) + valorEsocCalculado;
                    }
                }
                
                // --- Lógica Específica para Prefeitura/ Estado ---
                const isPrefeitura = originalItem.unidades?.nome_unidade === 'Prefeitura/ Estado';
                if (isPrefeitura && originalItem.valor && Number(originalItem.valor) > 0) {
                     // Adiciona o valor à gerência 20
                     gerenciaTotals[20] = (gerenciaTotals[20] || 0) + Number(originalItem.valor);
                     // Garante que o total calculado para o financeiro também inclua este valor
                     totalCalculado = Number(originalItem.valor);
                     statusFinanceiro = 'pago';
                }

                // 2. Tenta calcular via tabela de preços (preco_exames) usando 'empresaId'
                // Apenas se não for Prefeitura (ou se Prefeitura puder ter exames além do valor fixo, 
                // mas a lógica atual parece substituir). Mantemos a soma se houver exames E for prefeitura.
                if (originalItem.exames_snapshot && originalItem.exames_snapshot.length > 0) {
                    const { data: precos } = await supabase
                        .from('preco_exames')
                        .select('nome, preco')
                        .eq('empresaId', unitData.empresaid); // Busca tabela de preços do cliente
                    
                    if (precos && precos.length > 0) {
                        originalItem.exames_snapshot.forEach(exameNome => {
                            // Tenta encontrar o exame na tabela de preços (case insensitive)
                            const p = precos.find((price: any) => 
                                price.nome && price.nome.toLowerCase().trim() === exameNome.toLowerCase().trim()
                            );
                            if (p && p.preco) {
                                const valExame = Number(p.preco);
                                totalCalculado += valExame;

                                // --- Lógica de Mapeamento para Gerência Meta ---
                                const lowerName = exameNome.toLowerCase();
                                let gerenciaId = 0;

                                if (lowerName.includes('avaliação clínica') || lowerName.includes('avaliacao clinica')) {
                                    gerenciaId = 25;
                                }
                                else if (lowerName.includes('audiometria')) gerenciaId = 12;
                                else if (lowerName.includes('raio-x') || lowerName.includes('raio x')) gerenciaId = 13;
                                else if (lowerName.includes('eletrocardiograma')) gerenciaId = 15;
                                else if (lowerName.includes('eletroencefalograma')) gerenciaId = 16;
                                else if (lowerName.includes('acuidade visual')) gerenciaId = 17;
                                else if (lowerName.includes('psicossocial') || lowerName.includes('psicológica')) gerenciaId = 18;
                                else if (lowerName.includes('toxicológico')) gerenciaId = 19;
                                else if (lowerName.includes('espirometria')) gerenciaId = 21;
                                else {
                                    // Verificação para Coleta (Exames de Sangue - Gerência 14)
                                    const bloodKeywords = [
                                        'hemograma', 'glicemia', 'sanguíneo', 'colesterol', 'gama gt', 'tgo', 'tgp', 
                                        'ácido', 'creatinina', 'ferro', 'manganês', 'reticulócitos', 'triglicerídeos', 
                                        'anti ', 'chumbo', 'carboxihemoglobina', 'eas', 'epf', 'coprocultura', 'acetona'
                                    ];
                                    if (bloodKeywords.some(k => lowerName.includes(k))) {
                                        gerenciaId = 14;
                                    }
                                }

                                if (gerenciaId > 0) {
                                    // A lógica aqui (+=) garante que se houver mais de um exame para a mesma gerência, 
                                    // os valores serão somados (ex: 2 exames de sangue somam para a gerência 14)
                                    gerenciaTotals[gerenciaId] = (gerenciaTotals[gerenciaId] || 0) + valExame;
                                }
                            }
                        });
                    }
                }

                // 3. Fallback para valor manual (Avulso)
                if (totalCalculado === 0 && originalItem.valor && Number(originalItem.valor) > 0) {
                    totalCalculado = Number(originalItem.valor);
                    statusFinanceiro = 'pago'; 
                }

                // Soma o valor dos exames com o valor do eSOC
                const valorTotalSomado = totalCalculado + valorEsocCalculado;

                // Insert no Financeiro
                await supabase.from('financeiro_receitas').insert({
                    contratante: unitData.empresaid, 
                    unidade_contratante: originalItem.unidade,
                    valor_med: totalCalculado, 
                    valor_total: valorTotalSomado, 
                    valor_esoc: valorEsocCalculado,
                    status: statusFinanceiro,
                    data_executada: new Date().toISOString(),
                    data_projetada: new Date(originalItem.data_atendimento).toISOString(),
                    descricao: `Atendimento - ${originalItem.colaboradores?.nome || 'Desconhecido'}`,
                    empresa_resp: 'Gama medicina',
                    exames_snapshot: originalItem.exames_snapshot || []
                });

                // Atualização da Tabela gerencia_meta
                const date = new Date();
                const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
                // Last day logic: Month + 1, day 0 gives last day of current month
                const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
                lastDay.setHours(23, 59, 59, 999);
                const lastDayISO = lastDay.toISOString();

                for (const [gId, amount] of Object.entries(gerenciaTotals)) {
                    const gerenciaId = Number(gId);
                    
                    // Verifica se já existe meta para este mês e gerência
                    const { data: existingMeta } = await supabase
                        .from('gerencia_meta')
                        .select('id, faturamento')
                        .eq('gerencia', gerenciaId)
                        .gte('created_at', firstDay)
                        .lte('created_at', lastDayISO)
                        .maybeSingle();

                    if (existingMeta) {
                        // Soma ao existente
                        await supabase.from('gerencia_meta').update({
                            faturamento: Number(existingMeta.faturamento) + Number(amount)
                        }).eq('id', existingMeta.id);
                    } else {
                        // Cria novo
                        await supabase.from('gerencia_meta').insert({
                            gerencia: gerenciaId,
                            faturamento: Number(amount),
                            // created_at padrão é now()
                        });
                    }
                }
            }
        }
    } catch (error: any) {
        console.error("Error updating status/financial:", JSON.stringify(error, null, 2));
        setAppointments(prev => prev.map(a => 
            a.id === id ? { ...a, compareceu: originalItem.compareceu, chegou_em: originalItem.chegou_em } : a
        ));
        alert(`Erro ao atualizar status: ${error.message}`);
    }
  };

  const toggleAso = async (id: number, currentAsoFeito: boolean | undefined) => {
    const originalItem = appointments.find(a => a.id === id);
    if (!originalItem) return;
    const newStatus = !currentAsoFeito;

    setAppointments(prev => prev.map(a => a.id === id ? { ...a, aso_feito: newStatus } : a));

    try {
        const { error } = await supabase.from('agendamentos').update({ aso_feito: newStatus }).eq('id', id);
        if (error) throw error;
    } catch (error: any) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, aso_feito: originalItem.aso_feito } : a));
    }
  };

  const handleUpdateAso = async (id: number, newDate: string) => {
    const originalItem = appointments.find(a => a.id === id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, aso_liberado: newDate || null } : a));
    try {
        const { error } = await supabase.from('agendamentos').update({ aso_liberado: newDate || null }).eq('id', id);
        if (error) throw error;
    } catch (error: any) {
        if (originalItem) setAppointments(prev => prev.map(a => a.id === id ? { ...a, aso_liberado: originalItem.aso_liberado } : a));
    }
  };

  const openFicha = (url: string | null) => {
    if (url) window.open(url, '_blank');
    else alert("Ficha não disponível.");
  };

  const handleOpenProcedures = (apt: AgendamentoComProntuarios) => {
      setUploadModalAppointmentId(apt.id);
      setShowProcedureListModal(true);
  };

  // --- ASO Upload Logic ---
  const triggerAsoUpload = (id: number) => {
      setUploadingAsoId(id);
      if (fileInputRef.current) {
          fileInputRef.current.value = ''; // Reset input
          fileInputRef.current.click();
      }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || !uploadingAsoId) return;

      setIsUploading(true);
      try {
          const timestamp = new Date().getTime();
          const fileName = `aso_${uploadingAsoId}_${timestamp}.pdf`;
          
          // 1. Upload to 'asos' bucket
          const { error: uploadError } = await supabase.storage
              .from('asos')
              .upload(fileName, file);

          if (uploadError) throw uploadError;

          // 2. Get Public URL
          const { data: { publicUrl } } = supabase.storage
              .from('asos')
              .getPublicUrl(fileName);

          // 3. Update Agendamento
          const { error: updateError } = await supabase
              .from('agendamentos')
              .update({ aso_url: publicUrl })
              .eq('id', uploadingAsoId);

          if (updateError) throw updateError;

          // 4. Update Local State
          setAppointments(prev => prev.map(a => 
              a.id === uploadingAsoId ? { ...a, aso_url: publicUrl } : a
          ));

          alert("ASO enviado com sucesso!");

      } catch (err: any) {
          console.error("Upload error:", err);
          alert(`Erro ao enviar ASO: ${err.message}`);
      } finally {
          setIsUploading(false);
          setUploadingAsoId(null);
      }
  };
  
  // --- E-social Upload Logic ---
  const triggerEsocUpload = () => {
      if (esocFileInputRef.current) {
          esocFileInputRef.current.value = ''; // Reset
          esocFileInputRef.current.click();
      }
  };

  const handleEsocFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files; // Change to list
      if (!files || files.length === 0 || !uploadModalAppointmentId) return;

      setIsUploading(true);
      let uploadCount = 0;

      try {
          // Convert FileList to Array to iterate easily
          const fileArray = Array.from(files);

          for (const file of fileArray) {
              const timestamp = new Date().getTime();
              const fileName = (file as File).name;
              let folder = 'esoc';
              let eventType = 'Indefinido';

              // Logic 2240/2220
              if (fileName.includes('2240')) {
                  folder = 'esoc/2240';
                  eventType = '2240';
              } else if (fileName.includes('2220')) {
                  folder = 'esoc/2220';
                  eventType = '2220';
              }

              const uniquePath = `${folder}/${uploadModalAppointmentId}_${timestamp}_${fileName}`;

              // 1. Upload
              const { error: uploadError } = await supabase.storage
                  .from('documents')
                  .upload(uniquePath, file as File);

              if (uploadError) throw uploadError;

              // 2. Get URL
              const { data: { publicUrl } } = supabase.storage
                  .from('documents')
                  .getPublicUrl(uniquePath);

              // 3. Insert DB
              const { error: insertError } = await supabase
                  .from('esoc_agendamentos')
                  .insert({
                      agendamento_id: uploadModalAppointmentId,
                      evento: eventType,
                      url: publicUrl
                  });

              if (insertError) throw insertError;
              uploadCount++;
          }

          alert(`${uploadCount} arquivo(s) do E-social enviado(s) com sucesso!`);
          if (!showProcedureListModal) {
              setUploadModalAppointmentId(null);
          }

      } catch (err: any) {
          console.error("Esoc Upload error:", err);
          alert(`Erro ao enviar arquivos: ${err.message}`);
      } finally {
          setIsUploading(false);
          // Clear input
          if (esocFileInputRef.current) {
              esocFileInputRef.current.value = '';
          }
      }
  };

  // --- Prontuario Upload Logic ---
  const triggerProntuarioUpload = () => {
      if (prontuarioFileInputRef.current) {
          prontuarioFileInputRef.current.value = ''; // Reset
          prontuarioFileInputRef.current.click();
      }
  };

  const handleProntuarioFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0 || !uploadModalAppointmentId) return;

      setIsUploading(true);
      let uploadCount = 0;
      const uploadedFiles: any[] = [];

      try {
          const fileArray = Array.from(files);

          for (const file of fileArray) {
              const nameUpper = (file as File).name.toUpperCase();
              let folder = 'outros'; 
              let tipo = 'Outros';

              // Mapping logic based on initial
              if (nameUpper.startsWith('ACU')) { folder = 'acuidade'; tipo = 'Acuidade'; }
              else if (nameUpper.startsWith('AUDIO')) { folder = 'audio'; tipo = 'Audiometria'; }
              else if (nameUpper.startsWith('ECG')) { folder = 'ecg'; tipo = 'Eletrocardiograma'; }
              else if (nameUpper.startsWith('EEG')) { folder = 'eeg'; tipo = 'Eletroencefalograma'; }
              else if (nameUpper.startsWith('ESP')) { folder = 'espiro'; tipo = 'Espirometria'; }
              else if (nameUpper.startsWith('LAB')) { folder = 'lab'; tipo = 'Laboratorio'; }
              else if (nameUpper.startsWith('PSICO')) { folder = 'psico'; tipo = 'Psicossocial'; }
              else if (nameUpper.startsWith('RX')) { folder = 'rx'; tipo = 'Raio X'; }

              const timestamp = new Date().getTime();
              const safeName = (file as File).name.replace(/[^a-zA-Z0-9.-]/g, '_');
              const path = `${folder}/${uploadModalAppointmentId}_${timestamp}_${safeName}`;

              // 1. Upload to 'prontuarios' bucket
              const { error: upErr } = await supabase.storage
                  .from('prontuarios')
                  .upload(path, file as File);
              
              if (upErr) throw upErr;

              // 2. Get URL
              const { data: { publicUrl } } = supabase.storage
                  .from('prontuarios')
                  .getPublicUrl(path);

              // 3. Insert DB
              const { data: inserted, error: dbErr } = await supabase
                  .from('prontuarios_agendamentos')
                  .insert({
                      agendamento_id: uploadModalAppointmentId,
                      tipo: tipo,
                      url: publicUrl
                  })
                  .select()
                  .single();
              
              if (dbErr) throw dbErr;
              if (inserted) uploadedFiles.push(inserted);

              uploadCount++;
          }

          alert(`${uploadCount} prontuário(s) enviado(s) com sucesso!`);
          
          // Update local state instantly
          if (uploadedFiles.length > 0) {
              setAppointments(prev => prev.map(a => {
                  if (a.id === uploadModalAppointmentId) {
                      return {
                          ...a,
                          prontuarios: [...(a.prontuarios || []), ...uploadedFiles]
                      };
                  }
                  return a;
              }));
          }

          if (!showProcedureListModal) {
              setUploadModalAppointmentId(null);
          }

      } catch (err: any) {
          console.error("Prontuario Upload error:", err);
          alert(`Erro ao enviar arquivos: ${err.message}`);
      } finally {
          setIsUploading(false);
          if (prontuarioFileInputRef.current) {
              prontuarioFileInputRef.current.value = '';
          }
      }
  };

  // --- Export Logic ---

  const handleExportXLS = async () => {
    setIsExporting(true);
    try {
        const BATCH_SIZE = 500;
        let allItems: any[] = [];
        let from = 0;
        let hasMore = true;

        while (hasMore) {
            // Rebuild query for each iteration to apply specific range
            let query = supabase
                .from('agendamentos')
                .select(`
                    *,
                    colaboradores:colaboradores!agendamentos_colaborador_id_fkey (id, nome, cpf, data_nascimento, sector:setor, cargos(nome)),
                    unidades:unidades!agendamentos_unidade_fkey (id, nome_unidade)
                `)
                .gte('data_atendimento', exportStartDate)
                .lte('data_atendimento', exportEndDate)
                .order('data_atendimento', { ascending: true });

            if (!includeAbsent) {
                query = query.eq('compareceu', true);
            }
            
            // Apply pagination: fetch next batch
            const { data, error } = await query.range(from, from + BATCH_SIZE - 1);

            if (error) throw error;

            if (data && data.length > 0) {
                allItems = [...allItems, ...data];
                
                // If we got less than the batch size, we've reached the end
                if (data.length < BATCH_SIZE) {
                    hasMore = false;
                } else {
                    // Move cursor
                    from += BATCH_SIZE;
                }
            } else {
                hasMore = false;
            }
        }

        if (allItems.length === 0) {
            alert("Nenhum dado encontrado no período selecionado.");
            setIsExporting(false);
            return;
        }

        const items = allItems;

        // Template HTML para Excel
        const excelTemplate = `
            <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
            <head>
                <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
                <!--[if gte mso 9]>
                <xml>
                <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                <x:ExcelWorksheet>
                <x:Name>Agendamentos</x:Name>
                <x:WorksheetOptions>
                <x:DisplayGridlines/>
                </x:WorksheetOptions>
                </x:ExcelWorksheet>
                </x:ExcelWorksheets>
                </x:ExcelWorkbook>
                </xml>
                <![endif]-->
            </head>
            <body>
        `;

        let table = '<table border="1"><thead><tr>';
        
        // Estilos
        const styleGreen = 'style="background-color:#70AD47; color:white; font-weight:bold; text-align:center;"';
        const styleBlue = 'style="background-color:#4472C4; color:white; font-weight:bold; text-align:center;"';

        // Colunas Fixas (Verde)
        table += `<th ${styleGreen}>Nome</th>`;
        table += `<th ${styleGreen}>Data Atendimento</th>`;
        table += `<th ${styleGreen}>Status</th>`; // Adicionada coluna Status
        table += `<th ${styleGreen}>Cargo</th>`;
        table += `<th ${styleGreen}>Setor</th>`;
        table += `<th ${styleGreen}>Tipo de Exame</th>`;
        table += `<th ${styleGreen}>Unidade</th>`;
        table += `<th ${styleGreen}>Valor</th>`;
        table += `<th ${styleGreen}>Data Nascimento</th>`;
        table += `<th ${styleGreen}>CPF</th>`;
        table += `<th ${styleGreen}>Data de liberação</th>`;
        table += `<th ${styleGreen}>Observações</th>`; // Adicionada coluna Observações

        // Colunas Dinâmicas (Exames - Azul)
        EXAMES_LIST_EXPORT.forEach(exame => {
            table += `<th ${styleBlue}>${exame.nome}</th>`;
        });
        table += '</tr></thead><tbody>';

        items.forEach(item => {
            const nome = item.colaboradores?.nome || 'N/A';
            // Use timeZone: 'UTC' to prevent the date from shifting to the previous day due to local timezone offset
            const dataAtendimento = item.data_atendimento ? new Date(item.data_atendimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
            const cargo = item.colaboradores?.cargos?.nome || 'N/A';
            const setor = item.colaboradores?.sector || 'N/A';
            const unidade = item.unidades?.nome_unidade || 'Avulso';
            const dtNasc = item.colaboradores?.data_nascimento ? new Date(item.colaboradores.data_nascimento).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
            const cpf = item.colaboradores?.cpf || '';
            const dtLib = item.aso_liberado ? new Date(item.aso_liberado).toLocaleDateString('pt-BR', { timeZone: 'UTC' }) : '';
            const observacoes = item.obs_agendamento || ''; // Adicionada coluna Observações
            const tipo = item.tipo || '';
            const valor = item.valor ? item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : '';
            
            // Status Logic for Excel
            let statusText = 'Pendente';
            if (item.compareceu === true) statusText = 'Compareceu';
            else if (item.compareceu === false) statusText = 'Faltou';

            table += '<tr>';
            table += `<td>${nome}</td>`;
            table += `<td>${dataAtendimento}</td>`;
            table += `<td>${statusText}</td>`;
            table += `<td>${cargo}</td>`;
            table += `<td>${setor}</td>`;
            table += `<td>${tipo}</td>`;
            table += `<td>${unidade}</td>`;
            table += `<td>${valor}</td>`;
            table += `<td>${dtNasc}</td>`;
            // Força formato texto para CPF para não perder zeros a esquerda
            table += `<td style="mso-number-format:'\\@'">${cpf}</td>`; 
            table += `<td>${dtLib}</td>`;
            table += `<td>${observacoes}</td>`; // Adicionada coluna Observações

            EXAMES_LIST_EXPORT.forEach(exame => {
                const hasExam = item.exames_snapshot && item.exames_snapshot.includes(exame.nome);
                // X centralizado
                table += `<td style="text-align:center; vertical-align:middle;">${hasExam ? 'X' : ''}</td>`;
            });
            table += '</tr>';
        });

        table += '</tbody></table></body></html>';

        const finalContent = excelTemplate + table;
        const blob = new Blob([finalContent], { type: 'application/vnd.ms-excel' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `agendamentos_${exportStartDate}_${exportEndDate}.xls`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        setShowExportModal(false);
    } catch (err: any) {
        alert(`Erro na exportação: ${err.message}`);
    } finally {
        setIsExporting(false);
    }
  };

  // --- Date Navigation ---
  const handleNav = (direction: 'prev' | 'next') => {
    const date = new Date(selectedDate + 'T00:00:00');
    const modifier = direction === 'next' ? 1 : -1;

    if (viewMode === 'day') {
        date.setDate(date.getDate() + modifier);
    } else if (viewMode === 'week') {
        date.setDate(date.getDate() + (modifier * 7));
    } else if (viewMode === 'month') {
        date.setMonth(date.getMonth() + modifier);
    }
    
    setSelectedDate(date.toISOString().split('T')[0]);
    setSearchTerm('');
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split('T')[0]);
    setSearchTerm('');
  };

  const triggerDatePicker = () => {
    if (dateInputRef.current) {
        if ('showPicker' in (dateInputRef.current as any)) {
            try { (dateInputRef.current as any).showPicker(); } catch (e) { dateInputRef.current.click(); }
        } else {
            dateInputRef.current.click();
        }
    }
  };

  const formatDateDisplay = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    if (viewMode === 'month') {
        return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
    }
    return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
  };
  
  const formatDateShort = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
  };

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Hidden File Input for ASO Upload */}
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="application/pdf"
        onChange={handleFileChange}
      />
      {/* Hidden File Input for Esoc Upload */}
      <input 
        type="file" 
        ref={esocFileInputRef} 
        className="hidden" 
        multiple
        onChange={handleEsocFileChange}
      />
      {/* Hidden File Input for Prontuario Upload */}
      <input 
        type="file" 
        ref={prontuarioFileInputRef} 
        className="hidden" 
        multiple
        onChange={handleProntuarioFileChange}
      />
      
      <div className="flex flex-col gap-6">
        <div className="flex flex-col xl:flex-row xl:items-end justify-between gap-6">
            <div className="flex flex-col gap-4">
                <h2 className="text-3xl font-bold text-ios-text tracking-tight">Agenda</h2>
                
                {!isSearching && (
                    <div className="flex flex-wrap items-center gap-4 animate-in fade-in">
                        {/* Period Selector */}
                        <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner">
                            {(['day', 'week', 'month'] as const).map((mode) => (
                                <button
                                    key={mode}
                                    onClick={() => setViewMode(mode)}
                                    className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === mode ? 'bg-white text-ios-text shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {mode === 'day' ? 'Dia' : mode === 'week' ? 'Semana' : 'Mês'}
                                </button>
                            ))}
                        </div>

                        {/* Date Navigator */}
                        <div className="inline-flex items-center bg-white rounded-full p-1.5 shadow-sm border border-gray-100 gap-2">
                            <button onClick={() => handleNav('prev')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-ios-primary transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                            </button>
                            <div onClick={triggerDatePicker} className="relative group px-4 py-1.5 cursor-pointer hover:bg-gray-50 rounded-xl transition-colors min-w-[140px] text-center">
                                <input ref={dateInputRef} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer -z-10" />
                                <div>
                                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-0.5">{new Date(selectedDate + 'T00:00:00').getFullYear()}</p>
                                    <div className="flex items-center justify-center gap-2">
                                        <p className="text-sm font-bold text-ios-text capitalize whitespace-nowrap">{formatDateDisplay(selectedDate)}</p>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => handleNav('next')} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 hover:text-ios-primary transition-colors">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </button>
                        </div>

                        {!isToday && (<button onClick={handleToday} className="text-sm font-medium text-ios-primary hover:underline">Hoje</button>)}
                    </div>
                )}
                
                {isSearching && (
                    <div className="flex items-center gap-2 h-14 animate-in fade-in">
                         <span className="text-lg font-semibold text-gray-400">Resultados da pesquisa</span>
                    </div>
                )}
            </div>

            <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3 w-full xl:w-auto">
                {/* Status Toggle (Segmented Control) */}
                <div className="bg-gray-100 p-1 rounded-xl flex items-center shadow-inner h-12">
                    <button
                        onClick={() => setShowPendingOnly(false)}
                        className={`h-full px-5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${!showPendingOnly ? 'bg-white text-ios-text shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        Todos
                    </button>
                    <button
                        onClick={() => setShowPendingOnly(true)}
                        className={`h-full px-5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${showPendingOnly ? 'bg-white text-orange-500 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${showPendingOnly ? 'bg-orange-500' : 'bg-gray-300'}`}></span>
                        Pendentes
                    </button>
                </div>

                <div className="relative group w-full lg:w-64 transition-all focus-within:w-full lg:focus-within:w-80">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-ios-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                    </div>
                    <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Pesquisar..." className="w-full h-12 pl-10 pr-10 rounded-full bg-white border border-gray-100 focus:border-ios-primary focus:ring-4 focus:ring-ios-primary/10 outline-none transition-all shadow-sm placeholder-gray-400 text-sm font-medium" />
                    {searchTerm && (<button onClick={() => { setSearchTerm(''); setIsSearching(false); }} className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>)}
                </div>

                <div className="flex items-center gap-3">
                    <button onClick={() => setShowExportModal(true)} className="bg-white text-ios-text border border-gray-200 hover:bg-gray-50 px-6 py-2.5 rounded-full shadow-sm transition-all font-semibold text-sm flex items-center justify-center gap-2 whitespace-nowrap">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                        Exportar Excel
                    </button>
                    <button onClick={onNewAppointment} className="bg-gradient-to-r from-ios-primary to-ios-secondary text-white px-6 py-2.5 rounded-full shadow-lg shadow-ios-primary/30 hover:shadow-ios-primary/50 transition-all font-semibold text-sm flex items-center justify-center gap-2 active:scale-95 transform whitespace-nowrap">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Novo
                    </button>
                </div>
            </div>
        </div>
      </div>

      {loading ? (
        <div className="w-full h-64 flex flex-col items-center justify-center text-ios-subtext">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ios-primary mb-2"></div>
            {isSearching ? 'Pesquisando...' : 'Carregando agenda...'}
        </div>
      ) : appointments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white rounded-ios border border-gray-100 text-center shadow-sm animate-in fade-in zoom-in duration-300">
            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center text-4xl mb-6 shadow-inner text-gray-300">
                {isSearching ? '🔍' : '📅'}
            </div>
            <h3 className="text-xl font-bold text-ios-text">
                {isSearching ? 'Nenhum resultado' : 'Tudo livre por aqui'}
            </h3>
            <p className="text-ios-subtext mt-2">
                {isSearching ? `Não encontramos ninguém com "${searchTerm}"` : showPendingOnly ? 'Todos os pacientes já foram atendidos!' : 'Nenhum agendamento encontrado para este período.'}
            </p>
            {!isSearching && (
                <button onClick={onNewAppointment} className="mt-6 text-ios-primary font-semibold hover:underline">
                    Agendar agora
                </button>
            )}
        </div>
      ) : (
        <div className="grid gap-4 animate-in slide-in-from-bottom-4 duration-500">
            {appointments.map((apt) => (
                <div key={apt.id} className={`group bg-white hover:bg-ios-cardHover p-5 rounded-ios-sm shadow-sm hover:shadow-md border transition-all duration-300 flex flex-col md:flex-row md:items-center justify-between gap-4 ${apt.prioridade ? 'border-l-4 border-l-red-500 border-t-gray-100 border-r-gray-100 border-b-gray-100' : 'border-gray-100'}`}>
                    <div className="flex items-center gap-5 flex-1 cursor-pointer" onClick={() => onEditAppointment(apt)} title="Clique para editar detalhes">
                        <div className={`w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center text-xl font-bold shadow-sm transition-colors ${apt.compareceu ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                            {apt.colaboradores?.nome?.charAt(0) || '?'}
                        </div>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-bold text-lg text-ios-text leading-tight group-hover:text-ios-primary transition-colors">
                                    {apt.colaboradores?.nome || 'Desconhecido'}
                                </h4>
                                {apt.prioridade && (<span className="bg-red-50 text-red-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-red-100">Prioridade</span>)}
                                {apt.enviado_empresa && (
                                    <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-indigo-100 flex items-center gap-1">
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        Agendado via sistema
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 flex items-center gap-1">
                                    📅 {formatDateShort(apt.data_atendimento)}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-ios-primary/10 text-ios-primary">
                                    {apt.unidades?.nome_unidade || 'N/A'}
                                </span>
                                {apt.colaboradores?.cargos?.nome && (
                                    <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 truncate max-w-[150px]">
                                        {apt.colaboradores.cargos.nome}
                                    </span>
                                )}
                                <span className="hidden md:inline text-xs text-ios-subtext">•</span>
                                <span className="text-xs text-ios-subtext font-medium">{apt.tipo || 'Geral'}</span>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                                {apt.obs_agendamento && (
                                    <div className="inline-flex items-center gap-1 text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-md border border-yellow-100 max-w-full md:max-w-xs truncate" title={apt.obs_agendamento}>
                                        <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        <span className="truncate font-medium">{apt.obs_agendamento}</span>
                                    </div>
                                )}
                                {apt.unidades?.nome_unidade === 'Prefeitura/ Estado' && apt.valor && (
                                     <div className="inline-flex items-center gap-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded-md border border-blue-100">
                                        <span className="font-bold">R$ {Number(apt.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                                        {apt.metodo_pagamento && <span className="text-blue-500 border-l border-blue-200 pl-1 ml-1 text-[10px] uppercase font-bold">{apt.metodo_pagamento}</span>}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 md:gap-6 border-t md:border-t-0 border-gray-50 pt-4 md:pt-0 flex-wrap">
                        <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">ASO</span>
                            <button onClick={(e) => { e.stopPropagation(); toggleAso(apt.id, apt.aso_feito); }} className={`w-8 h-8 rounded-full shadow-inner transition-all duration-500 relative flex items-center justify-center ${apt.aso_feito ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200'} hover:scale-105 active:scale-95`} title={apt.aso_feito ? "ASO Feito" : "ASO Pendente"}>
                                {apt.aso_feito ? (<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>) : (<div className="w-2 h-2 bg-white rounded-full opacity-50"></div>)}
                            </button>
                        </div>
                        <div className="flex flex-col items-center gap-1.5">
                            <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">Status</span>
                            <button onClick={(e) => { e.stopPropagation(); toggleAttendance(apt.id, apt.compareceu); }} className={`w-8 h-8 rounded-full shadow-inner transition-all duration-500 relative flex items-center justify-center ${apt.compareceu ? 'bg-green-500 shadow-green-200' : 'bg-red-500 shadow-red-200'} hover:scale-105 active:scale-95`} title={apt.compareceu ? "Presente" : "Ausente"}>
                                {apt.compareceu ? (<svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>) : (<div className="w-2 h-2 bg-white rounded-full opacity-50"></div>)}
                            </button>
                        </div>
                        <div className="hidden md:block h-10 w-px bg-gray-100"></div>
                        <div className="flex flex-col items-center gap-1.5" onClick={e => e.stopPropagation()}>
                             <span className="text-[10px] uppercase font-bold text-gray-300 tracking-wider">Liberado em</span>
                             <div className="flex items-center gap-2 relative">
                                <input type="date" value={apt.aso_liberado || ''} onChange={(e) => handleUpdateAso(apt.id, e.target.value)} className={`h-8 w-28 text-xs font-bold rounded-lg border px-2 outline-none transition-all ${apt.aso_liberado ? 'bg-white border-gray-200 text-gray-800 shadow-sm' : 'bg-gray-50 border-transparent text-gray-400'}`} />
                                <button 
                                    onClick={() => setUploadModalAppointmentId(apt.id)} 
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${apt.aso_url ? 'bg-blue-100 text-blue-600 hover:bg-blue-200' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                    title={apt.aso_url ? "Substituir ASO" : "Enviar ASO"}
                                    disabled={isUploading && uploadingAsoId === apt.id}
                                >
                                    {isUploading && uploadingAsoId === apt.id ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                    )}
                                </button>
                                {/* Botão Novo: Ver/Adicionar Prontuários */}
                                <button 
                                    onClick={() => handleOpenProcedures(apt)}
                                    className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all border ${apt.prontuarios && apt.prontuarios.length > 0 ? 'bg-purple-50 text-purple-600 border-purple-200 hover:bg-purple-100' : 'bg-gray-50 text-gray-400 border-gray-100 hover:bg-gray-100'}`}
                                    title="Prontuários e Exames"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </button>
                                {apt.aso_url && (
                                     <button 
                                        onClick={() => window.open(apt.aso_url || '', '_blank')}
                                        className="w-8 h-8 rounded-lg flex items-center justify-center bg-green-50 text-green-600 hover:bg-green-100 transition-all border border-green-100"
                                        title="Visualizar ASO"
                                     >
                                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                         </svg>
                                     </button>
                                )}
                             </div>
                        </div>
                        <div className="hidden md:block h-10 w-px bg-gray-100"></div>
                        {onGenerateAso && (
                             <button 
                                onClick={(e) => { e.stopPropagation(); onGenerateAso(apt); }} 
                                className="p-3 rounded-xl transition-all text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-100" 
                                title="Gerar ASO"
                             >
                                 <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                 </svg>
                             </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); openFicha(apt.ficha_url); }} className={`p-3 rounded-xl transition-all ${apt.ficha_url ? 'text-ios-primary bg-ios-primary/5 hover:bg-ios-primary/10' : 'text-gray-300 cursor-not-allowed bg-gray-50'}`} title={apt.ficha_url ? "Abrir Ficha Clínica" : "Ficha indisponível"} disabled={!apt.ficha_url}>
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </button>
                    </div>
                </div>
            ))}
        </div>
      )}

      {/* Modal Principal de Seleção de Upload (ASO, Prontuário, E-social) */}
      {uploadModalAppointmentId && !showProcedureListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-ios p-8 max-w-3xl w-full shadow-2xl relative">
                <button 
                    onClick={() => setUploadModalAppointmentId(null)} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold text-gray-800">Enviar Documento</h3>
                    <p className="text-gray-500 mt-1">Selecione o tipo de documento para anexar ao agendamento.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <button 
                        onClick={() => { triggerAsoUpload(uploadModalAppointmentId); setUploadModalAppointmentId(null); }}
                        className="flex flex-col items-center justify-center p-6 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 hover:border-blue-200 rounded-2xl transition-all group"
                    >
                        <div className="w-16 h-16 bg-blue-200 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-blue-600">
                             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        </div>
                        <span className="font-bold text-blue-800 text-lg">Subir ASO</span>
                    </button>

                    <button 
                        onClick={triggerProntuarioUpload} 
                        className="flex flex-col items-center justify-center p-6 bg-gray-50 hover:bg-gray-100 border-2 border-gray-100 hover:border-gray-200 rounded-2xl transition-all group"
                    >
                        <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-gray-600">
                            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" /></svg>
                        </div>
                        <span className="font-bold text-gray-700 text-lg">Prontuário</span>
                    </button>

                    <button 
                        onClick={triggerEsocUpload} 
                        className="flex flex-col items-center justify-center p-6 bg-green-50 hover:bg-green-100 border-2 border-green-100 hover:border-green-200 rounded-2xl transition-all group"
                    >
                        <div className="w-16 h-16 bg-green-200 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-green-600">
                             <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /></svg>
                        </div>
                        <span className="font-bold text-green-800 text-lg">E-social</span>
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Modal de Listagem de Procedimentos */}
      {showProcedureListModal && uploadModalAppointmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-ios p-6 max-w-2xl w-full shadow-2xl relative flex flex-col max-h-[80vh]">
                <button 
                    onClick={() => { setShowProcedureListModal(false); setUploadModalAppointmentId(null); }} 
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
                
                <h3 className="text-xl font-bold text-gray-800 mb-4 px-2">Prontuários / Exames</h3>
                
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                    {appointments.find(a => a.id === uploadModalAppointmentId)?.prontuarios?.length ? (
                        <div className="space-y-3">
                            {appointments.find(a => a.id === uploadModalAppointmentId)?.prontuarios?.map((file) => (
                                <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{file.tipo}</p>
                                            <p className="text-xs text-gray-400">{new Date(file.created_at).toLocaleString('pt-BR')}</p>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={() => window.open(file.url, '_blank')}
                                        className="px-4 py-2 bg-white border border-gray-200 text-gray-600 text-sm font-semibold rounded-lg hover:bg-gray-50 transition-colors"
                                    >
                                        Visualizar
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-gray-400">
                            <p>Nenhum procedimento anexado.</p>
                        </div>
                    )}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-end">
                    <button 
                        onClick={triggerProntuarioUpload}
                        className="flex items-center gap-2 bg-ios-primary text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-ios-primary/30 hover:bg-ios-secondary transition-all"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                        Adicionar Arquivos
                    </button>
                </div>
            </div>
        </div>
      )}

      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-ios p-8 max-w-sm w-full shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 rounded-full bg-ios-primary/10 flex items-center justify-center text-ios-primary mb-4 mx-auto text-3xl">
                        📊
                    </div>
                    <h3 className="text-xl font-bold text-gray-800">Exportar Excel</h3>
                    <p className="text-sm text-gray-500 mt-2">Selecione o intervalo de datas para exportar os agendamentos.</p>
                </div>
                
                <div className="space-y-4 mb-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase">Data Inicial</label>
                        <input type="date" value={exportStartDate} onChange={(e) => setExportStartDate(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white border focus:border-ios-primary outline-none" />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase">Data Final</label>
                        <input type="date" value={exportEndDate} onChange={(e) => setExportEndDate(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white border focus:border-ios-primary outline-none" />
                    </div>
                    
                    <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <input 
                            type="checkbox" 
                            id="includeAbsent" 
                            checked={includeAbsent} 
                            onChange={(e) => setIncludeAbsent(e.target.checked)} 
                            className="w-5 h-5 text-ios-primary border-gray-300 rounded focus:ring-ios-primary cursor-pointer" 
                        />
                        <label htmlFor="includeAbsent" className="text-sm font-semibold text-gray-700 cursor-pointer select-none">
                            Incluir colaboradores que não compareceram
                        </label>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setShowExportModal(false)} className="flex-1 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">Cancelar</button>
                    <button onClick={handleExportXLS} disabled={isExporting} className="flex-1 py-3 font-semibold text-white bg-ios-primary hover:bg-ios-secondary rounded-xl shadow-lg transition-colors flex justify-center">
                        {isExporting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Confirmar'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Agenda;
