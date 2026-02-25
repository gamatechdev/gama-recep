
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient'; // Cliente Supabase canônico em services/
import { Colaborador, Unidade, Agendamento } from '../../types'; // Tipos globais na raiz do projeto

const EXAMES_LIST = [
  { "idx": 0, "id": 447, "nome": "Avaliação Clínica" },
  { "idx": 1, "id": 448, "nome": "Audiometria" },
  { "idx": 2, "id": 449, "nome": "Acuidade Visual" },
  { "idx": 3, "id": 450, "nome": "Espirometria" },
  { "idx": 4, "id": 451, "nome": "Eletrocardiograma" },
  { "idx": 5, "id": 452, "nome": "Eletroencefalograma" },
  { "idx": 6, "id": 453, "nome": "Raio-X Tórax PA OIT" },
  { "idx": 7, "id": 454, "nome": "Raio-X Coluna L-Sacra" },
  { "idx": 8, "id": 455, "nome": "Raio-X Mãos e Braços" },
  { "idx": 9, "id": 456, "nome": "Raio-X Punho" },
  { "idx": 10, "id": 457, "nome": "Hemograma Completo" },
  { "idx": 11, "id": 458, "nome": "Glicemia em Jejum" },
  { "idx": 12, "id": 459, "nome": "EPF (parasitológico fezes)" },
  { "idx": 13, "id": 460, "nome": "EAS (urina)" },
  { "idx": 14, "id": 461, "nome": "Grupo Sanguíneo + Fator RH" },
  { "idx": 15, "id": 462, "nome": "Gama GT" },
  { "idx": 16, "id": 463, "nome": "TGO / TGP" },
  { "idx": 17, "id": 464, "nome": "Ácido Trans. Muconico" },
  { "idx": 18, "id": 465, "nome": "Ácido Úrico" },
  { "idx": 19, "id": 466, "nome": "Ácido Hipúr. (Tolueno urina)" },
  { "idx": 20, "id": 467, "nome": "Ácido Metil Hipúrico" },
  { "idx": 21, "id": 468, "nome": "Ácido Mandélico" },
  { "idx": 22, "id": 469, "nome": "ALA-U" },
  { "idx": 23, "id": 470, "nome": "Hemoglobina glicada" },
  { "idx": 24, "id": 471, "nome": "Coprocultura" },
  { "idx": 25, "id": 472, "nome": "Colesterol T e F" },
  { "idx": 26, "id": 473, "nome": "Chumbo Sérico" },
  { "idx": 27, "id": 474, "nome": "Creatinina" },
  { "idx": 28, "id": 475, "nome": "Ferro Sérico" },
  { "idx": 29, "id": 476, "nome": "Manganês Urinário" },
  { "idx": 30, "id": 477, "nome": "Manganês Sanguíneo" },
  { "idx": 31, "id": 478, "nome": "Reticulócitos" },
  { "idx": 32, "id": 479, "nome": "Triglicerídeos" },
  { "idx": 33, "id": 480, "nome": "IGE Específica - Abelha" },
  { "idx": 34, "id": 481, "nome": "Acetona Urinária" },
  { "idx": 35, "id": 482, "nome": "Anti HAV" },
  { "idx": 36, "id": 483, "nome": "Anti HBS" },
  { "idx": 37, "id": 484, "nome": "Anti HBSAG" },
  { "idx": 38, "id": 485, "nome": "Anti HCV" },
  { "idx": 39, "id": 486, "nome": "Carboxihemoglobina" },
  { "idx": 40, "id": 487, "nome": "Exame Toxicológico Pelo" },
  { "idx": 41, "id": 488, "nome": "Avaliação Vocal" },
  { "idx": 42, "id": 489, "nome": "Avaliação Psicossocial" },
  { "idx": 43, "id": 490, "nome": "Avaliação Psicológica" },
  { "idx": 44, "id": 491, "nome": "Aspecto da Pele" },
  { "idx": 45, "id": 492, "nome": "Questionário Epilepsia" },
  { "idx": 46, "id": 493, "nome": "Teste Palográfico" },
  { "idx": 47, "id": 494, "nome": "Teste de Atenção" },
  { "idx": 48, "id": 495, "nome": "Teste Romberg" },
  { "idx": 49, "id": 496, "nome": "Exame Toxicológico Urina" },
  { "idx": 50, "id": 497, "nome": "Higidez" },
  { "idx": 51, "id": 498, "nome": "Grupo Sanguíneo" }
];

const FORMULARIOS_OPTIONS = [
  { label: "Ficha Clínica", value: "FICHA_CLINICA" },
  { label: "Prontuário Médico", value: "PRONTUARIO_MEDICO" },
  { label: "Audiometria", value: "AUDIOMETRIA" },
  { label: "Acuidade Visual", value: "ACUIDADE_VISUAL" },
  { label: "Avaliação Psicossocial", value: "AVALIACAO_PSICOSSOCIAL_SIMPLES" }
];

interface ChatTag {
  chatname: string;
  phone: string;
  tag: number;
  senderphoto?: string;
}

interface OptionItem {
  id: string | number;
  label: string;
}

// Reusable Searchable Input Component
const SearchableInput: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  onSelect: (val: string) => void;
  options: OptionItem[];
  placeholder?: string;
  required?: boolean;
  onAddNew?: () => void; // Optional prop to trigger "Add New" action
  addNewLabel?: string;
  noResultText?: string; // Optional custom text when no results found
}> = ({ label, value, onChange, onSelect, options, placeholder, required, onAddNew, addNewLabel, noResultText }) => {
  const [showList, setShowList] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowList(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt =>
    (opt.label || '').toLowerCase().includes((value || '').toLowerCase())
  );

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">{label}</label>
      <div className="relative group">
        <input
          type="text"
          required={required}
          value={value}
          onChange={(e) => { onChange(e.target.value); setShowList(true); }}
          onFocus={() => setShowList(true)}
          placeholder={placeholder}
          className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-ios-primary focus:ring-4 focus:ring-ios-primary/10 outline-none transition-all text-gray-800"
        />
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <svg className="h-4 w-4 text-gray-400 group-focus-within:text-ios-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      {showList && value && (
        <div className="absolute z-30 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-float max-h-48 overflow-y-auto custom-scrollbar">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => { onSelect(opt.label); setShowList(false); }}
                className="w-full text-left px-5 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-sm text-gray-700 font-medium"
              >
                {opt.label}
              </button>
            ))
          ) : (
            onAddNew ? (
              <button
                type="button"
                onClick={() => { setShowList(false); onAddNew(); }}
                className="w-full text-left px-5 py-3 bg-blue-50 hover:bg-blue-100 transition-colors text-sm text-ios-primary font-bold flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                {addNewLabel || "+ Cadastrar nova"}
              </button>
            ) : (
              <div className="px-4 py-3 text-center text-gray-400 text-xs italic">
                {noResultText || `"${value}" será adicionado como novo.`}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
};

interface AppointmentFormProps {
  initialAppointment?: Agendamento | null;
  onCancel?: () => void;
}

const AppointmentForm: React.FC<AppointmentFormProps> = ({ initialAppointment, onCancel }) => {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);

  // Lists for Dropdowns
  const [setoresList, setSetoresList] = useState<OptionItem[]>([]);
  const [cargosList, setCargosList] = useState<OptionItem[]>([]);

  // User Context
  const [currentUser, setCurrentUser] = useState<{ username: string, sector: number } | null>(null);

  // Unified Colaborador Form State
  const [colabFormData, setColabFormData] = useState({
    nome: '',
    cpf: '',
    data_nascimento: '',
    sexo: 'M',
    setor: '',
    funcao: ''
  });

  // Appointment State
  const [selectedColabId, setSelectedColabId] = useState<string>('');
  const [colabSearchTerm, setColabSearchTerm] = useState('');

  // Unit Search State
  const [appointmentData, setAppointmentData] = useState({
    data_atendimento: new Date().toISOString().split('T')[0],
    tipo: 'Admissional',
    unidade: ''
  });
  const [unitSearchTerm, setUnitSearchTerm] = useState('');

  // Avulso & Prefeitura State
  const [isAvulso, setIsAvulso] = useState(false);
  const [valorAvulso, setValorAvulso] = useState('');
  const [metodoPagamento, setMetodoPagamento] = useState('Pix');
  const [outroMetodoPagamento, setOutroMetodoPagamento] = useState('');

  // New Appointment Fields
  const [obsAgendamento, setObsAgendamento] = useState('');
  const [prioridade, setPrioridade] = useState(false);

  // New Company (Unit) Modal State
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [clientsList, setClientsList] = useState<OptionItem[]>([]);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [selectedClientId, setSelectedClientId] = useState<string | number | null>(null);

  // Error Modal State
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  // Exam Selection State
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [examSearchTerm, setExamSearchTerm] = useState('');

  // New Fields: Forms and Observations
  const [selectedFormularios, setSelectedFormularios] = useState<string[]>(["FICHA_CLINICA"]);
  const [obsClinica, setObsClinica] = useState('');
  const [obsLaboratorial, setObsLaboratorial] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  // --- Notification Workflow States ---
  const [savedContext, setSavedContext] = useState<any>(null);
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showContactListModal, setShowContactListModal] = useState(false);
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false);
  const [contactsList, setContactsList] = useState<ChatTag[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatTag | null>(null);
  const [sendingMsg, setSendingMsg] = useState(false);

  // --- Delete Modal State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isPrefeitura = unitSearchTerm === "Prefeitura/ Estado";

  useEffect(() => {
    fetchInitialData();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (initialAppointment) {
      setMode('existing');
      setAppointmentData({
        data_atendimento: initialAppointment.data_atendimento,
        tipo: initialAppointment.tipo || 'Admissional',
        unidade: initialAppointment.unidade ? String(initialAppointment.unidade) : ''
      });

      if (initialAppointment.unidade) {
        supabase.from('unidades').select('nome_unidade').eq('id', initialAppointment.unidade).single()
          .then(({ data }) => {
            if (data) {
              setUnitSearchTerm(data.nome_unidade);

              // Lógica Avulso
              if (data.nome_unidade.toLowerCase().includes('avulso')) {
                setIsAvulso(true);
                setValorAvulso(initialAppointment.valor ? initialAppointment.valor.toString() : '');
                if (initialAppointment.metodo_pagamento) {
                  setMetodoPagamento(initialAppointment.metodo_pagamento);
                }
              }

              // Lógica Prefeitura/Estado
              if (data.nome_unidade === "Prefeitura/ Estado") {
                if (initialAppointment.valor) {
                  setValorAvulso(initialAppointment.valor.toString());
                }
                if (initialAppointment.metodo_pagamento) {
                  const standardMethods = ['Pix', 'Boleto', 'Cartão', 'Dinheiro'];
                  if (standardMethods.includes(initialAppointment.metodo_pagamento)) {
                    setMetodoPagamento(initialAppointment.metodo_pagamento);
                  } else {
                    setMetodoPagamento('Outro');
                    setOutroMetodoPagamento(initialAppointment.metodo_pagamento);
                  }
                }
              }
            }
          });
      }

      if (initialAppointment.exames_snapshot) {
        setSelectedExams(initialAppointment.exames_snapshot);
      }

      if (initialAppointment.obs_agendamento) {
        setObsAgendamento(initialAppointment.obs_agendamento);
      }

      if (initialAppointment.prioridade) {
        setPrioridade(initialAppointment.prioridade);
      }

      if (initialAppointment.valor && initialAppointment.valor > 0) {
        setValorAvulso(initialAppointment.valor.toString());
      }

      // Load obsClinica if present in initialAppointment
      if ((initialAppointment as any).observacoes) {
        setObsClinica((initialAppointment as any).observacoes);
      }

      fetchCollaboratorDetails(initialAppointment.colaborador_id);
    }
  }, [initialAppointment]);

  const fetchCollaboratorDetails = async (id: string) => {
    const { data, error } = await supabase
      .from('colaboradores')
      .select(`*, cargos ( nome )`)
      .eq('id', id)
      .single();

    if (data) {
      handleSelectColab(data as Colaborador);
    }
  };

  const fetchCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('users').select('username, sector').eq('user_id', user.id).single();
      if (data) setCurrentUser(data);
    }
  };

  const fetchInitialData = async () => {
    const { data: colabs } = await supabase.from('colaboradores').select('id, nome, cpf, data_nascimento, sexo, setor, cargo');
    const { data: units } = await supabase.from('unidades').select('id, nome_unidade');
    const { data: setores } = await supabase.from('setor').select('id, nome');
    const { data: cargos } = await supabase.from('cargos').select('id, nome');

    if (colabs) setColaboradores(colabs);
    if (units) setUnidades(units);
    if (setores) setSetoresList(setores.map(s => ({ id: s.id, label: s.nome })));
    if (cargos) setCargosList(cargos.map(c => ({ id: c.id, label: c.nome })));
  };

  const toggleExam = (examName: string) => {
    if (selectedExams.includes(examName)) {
      setSelectedExams(selectedExams.filter(e => e !== examName));
    } else {
      setSelectedExams([...selectedExams, examName]);
    }
  };

  const toggleFormulario = (formValue: string) => {
    if (selectedFormularios.includes(formValue)) {
      setSelectedFormularios(selectedFormularios.filter(f => f !== formValue));
    } else {
      setSelectedFormularios([...selectedFormularios, formValue]);
    }
  };

  const handleSelectColab = (colab: Colaborador) => {
    setSelectedColabId(colab.id);

    let funcaoText = '';
    if (colab.cargos && colab.cargos.nome) {
      funcaoText = colab.cargos.nome;
    } else if (colab.cargo) {
      const found = cargosList.find(c => c.id === colab.cargo);
      if (found) funcaoText = found.label;
    }

    setColabFormData({
      nome: colab.nome,
      cpf: colab.cpf,
      data_nascimento: colab.data_nascimento,
      sexo: colab.sexo || 'M',
      setor: colab.setor || '',
      funcao: funcaoText
    });
    setColabSearchTerm('');
  };

  const handleSelectUnit = (unitName: string) => {
    const unit = unidades.find(u => u.nome_unidade === unitName);
    if (unit) {
      setAppointmentData({ ...appointmentData, unidade: unit.id.toString() });
      setUnitSearchTerm(unit.nome_unidade);

      // Se selecionar uma unidade que não é Prefeitura/Estado nem avulso, limpa o valor e método
      if (unit.nome_unidade !== "Prefeitura/ Estado") {
        setValorAvulso('');
        setMetodoPagamento('Pix');
        setOutroMetodoPagamento('');
      }
    }
  };

  const handleSelectClient = (clientName: string) => {
    const client = clientsList.find(c => c.label === clientName);
    if (client) {
      setSelectedClientId(client.id);
      setSelectedClientName(client.label);
    }
  };

  const handleSaveNewUnit = async () => {
    let finalClientId = selectedClientId;

    // Fallback: Resolve client ID from name (case insensitive) if ID missing
    if (!finalClientId && selectedClientName.trim()) {
      const found = clientsList.find(c => c.label.toLowerCase() === selectedClientName.trim().toLowerCase());
      if (found) {
        finalClientId = found.id;
      }
    }

    // 1. Validate if unit name is provided
    if (!newCompanyName.trim()) {
      setErrorModalMessage("Informe o nome da unidade.");
      setShowErrorModal(true);
      return;
    }

    // 2. Validate if a client was found/selected
    if (!finalClientId) {
      setErrorModalMessage("Selecione um cliente (Matriz) para continuar.");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      const { data: unitData, error: unitError } = await supabase
        .from('unidades')
        .insert({ nome_unidade: newCompanyName, empresaid: finalClientId })
        .select('id, nome_unidade').single();

      if (unitError) throw unitError;

      if (unitData) {
        setUnidades(prev => [...prev, unitData]);
        setAppointmentData({ ...appointmentData, unidade: unitData.id.toString() });
        setUnitSearchTerm(unitData.nome_unidade);
        setShowNewCompanyModal(false);
        setNewCompanyName('');
        setSelectedClientId(null);
        setSelectedClientName('');
        setMessage({ type: 'success', text: 'Unidade cadastrada!' });
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearFields = () => {
    setColabFormData({ nome: '', cpf: '', data_nascimento: '', sexo: 'M', setor: '', funcao: '' });
    setSelectedExams([]);
    setSelectedFormularios(["FICHA_CLINICA"]);
    setObsClinica(''); setObsLaboratorial(''); setSelectedColabId('');
    setColabSearchTerm(''); setUnitSearchTerm('');
    setAppointmentData(prev => ({ ...prev, unidade: '' }));
    setObsAgendamento(''); setPrioridade(false);
    setIsAvulso(false); setValorAvulso(''); setMetodoPagamento('Pix'); setOutroMetodoPagamento('');
    setSavedContext(null);
  };

  const handleCancelAndExit = () => {
    clearFields();
    if (onCancel) onCancel();
  };

  const handleDeleteRequest = () => setShowDeleteModal(true);

  const executeDelete = async () => {
    setShowDeleteModal(false);
    if (!initialAppointment?.id) return;

    setLoading(true);
    try {
      const { error, count } = await supabase
        .from('agendamentos')
        .delete({ count: 'exact' })
        .eq('id', initialAppointment.id);

      if (error) throw error;
      if (count === 0) alert("Erro ao excluir.");
      else if (onCancel) onCancel();

    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const generateRandomId = (length: number) => {
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) result += characters.charAt(Math.floor(Math.random() * characters.length));
    return result;
  };

  const generatePDF = async (payload: any) => {
    try {
      const response = await fetch("https://ficha-api.vercel.app/prontuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error("Erro PDF");
      const data = await response.json();
      return data.publicUrl || data.url || data.pdf_url || data.link || (typeof data === 'string' && data.startsWith('http') ? data : null);
    } catch (error) {
      console.error("PDF Error:", error);
      return null;
    }
  };

  // --- Notification Logic ---
  const handleNotifyYes = async () => {
    setShowNotifyModal(false);
    setLoading(true);

    try {
      const { data: contacts } = await supabase.from('chat_tags').select('*').order('chatname');
      if (contacts && contacts.length > 0) {
        setContactsList(contacts);
        setContactSearchTerm('');
        setShowContactListModal(true);
      } else {
        alert("Nenhum contato encontrado.");
        handleCancelAndExit();
      }
    } catch (e: any) {
      alert("Erro ao buscar contatos: " + e.message);
      handleCancelAndExit();
    } finally {
      setLoading(false);
    }
  };

  const handleNotifyNo = () => {
    setShowNotifyModal(false);
    handleCancelAndExit();
  };

  const handleContactSelect = (contact: ChatTag) => {
    setSelectedContact(contact);
    setShowContactListModal(false);
    setShowConfirmSendModal(true);
  };

  const handleSendMessage = async () => {
    if (!selectedContact || !savedContext || !currentUser) return;
    setSendingMsg(true);

    const formattedDate = savedContext.data.split('-').reverse().join('/');
    const examsListString = savedContext.exames.map((e: string) => `- ${e}`).join('\n');

    // Orientações Dinâmicas
    let orientacoes = "- Levar RG e CPF!\n- Fazer repouso auditivo de 12 horas.";

    // Verifica se "Hemoglobina glicada" OU "Glicemia" está na lista
    // Isso cobre "Glicemia em Jejum" e "Hemoglobina glicada"
    const needsFasting = savedContext.exames.some((e: string) => {
      const exam = e.toLowerCase();
      return exam.includes("hemoglobina glicada") || exam.includes("glicemia");
    });

    if (needsFasting) {
      orientacoes += "\n- Necessário jejum de 8 horas.";
    }

    const messageBody = `*${currentUser.username}:*\n\nExame Ocupacional do(a) paciente *${savedContext.pacienteName}* está agendado para *${formattedDate}*, *ás 7:00*:\n_Atendimento por ordem de chegada!_\n\n*Exames Solicitados:*\n${examsListString}\n\n*Orientações dos exames ocupacionais:*\n${orientacoes}\n\n_Endereço da Clínica Gama Center: Rua Barão de Pouso Alegre, 90, São Sebastião, Conselheiro Lafaiete (ao lado da Igreja São Sebastião)._`;

    try {
      await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-text", {
        method: "POST",
        headers: { "Client-Token": "F53f53bad10a9494f92d5e33804220a26S", "Content-Type": "application/json" },
        body: JSON.stringify({ phone: selectedContact.phone, message: messageBody })
      });
      alert("Notificação enviada!");
    } catch (e) {
      alert("Erro ao enviar mensagem.");
    } finally {
      setSendingMsg(false);
      setShowConfirmSendModal(false);
      handleCancelAndExit();
    }
  };

  const resolveCargoId = async (nomeCargo: string) => {
    if (!nomeCargo?.trim()) return null;
    const normalized = nomeCargo.trim();
    const { data: exist } = await supabase.from('cargos').select('id').ilike('nome', normalized).maybeSingle();
    if (exist) return exist.id;
    const { data: newC } = await supabase.from('cargos').insert({ nome: normalized, ativo: true }).select().single();
    if (newC) setCargosList(prev => [...prev, { id: newC.id, label: newC.nome }]);
    return newC?.id;
  };

  const resolveSetor = async (nomeSetor: string) => {
    if (!nomeSetor?.trim()) return null;
    const normalized = nomeSetor.trim();
    const { data: exist } = await supabase.from('setor').select('id, nome').ilike('nome', normalized).maybeSingle();
    if (exist) return exist.nome;
    const { data: newS } = await supabase.from('setor').insert({ nome: normalized }).select().single();
    if (newS) setSetoresList(prev => [...prev, { id: newS.id, label: newS.nome }]);
    return newS?.nome;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let finalColabId = selectedColabId;
      let unitId = appointmentData.unidade ? parseInt(appointmentData.unidade) : null;
      let finalValor = 0;
      let finalMetodo = 'medicao';

      if (isAvulso) {
        if (!valorAvulso) throw new Error("Informe o valor.");
        const { data: avulsoData } = await supabase.from('unidades').select('id, empresaid').ilike('nome_unidade', '%Avulsos%').limit(1).maybeSingle();
        if (!avulsoData) throw new Error("Unidade 'Avulsos' não encontrada.");
        unitId = avulsoData.id;
        finalValor = parseFloat(valorAvulso.replace(',', '.'));
        finalMetodo = metodoPagamento;
      }
      else if (isPrefeitura) {
        if (!valorAvulso) throw new Error("Informe o valor.");
        finalValor = parseFloat(valorAvulso.replace(',', '.'));
        // Lógica para definir o método de pagamento final (Dropdown ou Outro)
        finalMetodo = metodoPagamento === 'Outro' ? outroMetodoPagamento : metodoPagamento;
        if (!finalMetodo.trim()) throw new Error("Informe a forma de pagamento.");
      }

      let cargoId = colabFormData.funcao ? await resolveCargoId(colabFormData.funcao) : null;
      let setorName = colabFormData.setor ? (await resolveSetor(colabFormData.setor) || colabFormData.setor) : colabFormData.setor;

      const colabPayload = {
        nome: colabFormData.nome,
        cpf: colabFormData.cpf,
        data_nascimento: colabFormData.data_nascimento,
        sexo: colabFormData.sexo,
        setor: setorName,
        unidade: unitId,
        cargo: cargoId
      };

      if (mode === 'new') {
        const { data: newC, error: cErr } = await supabase.from('colaboradores').insert([colabPayload]).select().single();
        if (cErr) throw cErr;
        finalColabId = newC.id;
      } else {
        await supabase.from('colaboradores').update(colabPayload).eq('id', finalColabId);
      }

      const selectedUnidade = isAvulso ? { nome_unidade: 'Avulsos' } : unidades.find(u => u.id === unitId);

      // Mapeamento específico para a API de PDF: Higidez -> Higidez Mental
      const examsForPdf = selectedExams.map(exam =>
        exam === 'Higidez' ? 'Higidez Mental' : exam
      );

      // Usa examsForPdf (lista transformada) para a geração do PDF
      const generatedUrl = await generatePDF({
        agendamentoId: generateRandomId(23),
        empresa: selectedUnidade?.nome_unidade || "Matriz",
        nome: colabFormData.nome,
        dataExame: appointmentData.data_atendimento,
        funcao: colabFormData.funcao || setorName || "Não informado",
        cpf: colabFormData.cpf,
        dataNascimento: colabFormData.data_nascimento,
        sexo: colabFormData.sexo,
        tipoExame: appointmentData.tipo,
        setor: setorName || "Operacional",
        tipo_exame: [appointmentData.tipo],
        exames_requisitados: examsForPdf, // Lista modificada apenas para o PDF
        observacoesClinica: obsClinica,
        observacoesLaboratorial: obsLaboratorial,
        observacoes: obsClinica,
        formularios: selectedFormularios
      });

      // Usa selectedExams para salvar no banco de dados (Higidez é mantido conforme UI)

      // --- MAPEAMENTO AUTOMÁTICO: Exames → Salas ---
      // Calcula quais salas devem ficar como 'Aguardando' baseado nos exames selecionados.
      // Se um exame que pertence a determinada sala for removido, a sala fica null (não aplicável).
      // Se um exame pertencente a uma sala for adicionado, a sala fica 'Aguardando'.
      // Isso garante que o colaborador apareça na tela de chamada se tiver ao menos 1 sala aplicável.
      const calcularSalasPorExames = (exames: string[]) => {
        // Converte todos os exames para lowercase para comparação
        const lower = exames.map(e => e.toLowerCase());

        // Consultório Médico: Avaliação Clínica, Higidez, Psicossocial, Psicológica, 
        // Questionário Epilepsia, Aspecto da Pele, Avaliação Vocal
        const consultorio = lower.some(e =>
          e.includes('avaliação clínica') || e.includes('avaliacao clinica') ||
          e.includes('higidez') ||
          e.includes('psicossocial') || e.includes('psicológica') || e.includes('psicologica') ||
          e.includes('questionário epilepsia') || e.includes('questionario epilepsia') ||
          e.includes('aspecto da pele') || e.includes('avaliação vocal') || e.includes('avaliacao vocal')
        ) ? 'Aguardando' : 'nao aplicavel';

        // Sala de Exames: Acuidade Visual, Espirometria, Eletrocardiograma, Eletroencefalograma,
        // Teste Palográfico, Teste de Atenção, Teste Romberg
        const salaexames = lower.some(e =>
          e.includes('acuidade visual') ||
          e.includes('espirometria') ||
          e.includes('eletrocardiograma') ||
          e.includes('eletroencefalograma') ||
          e.includes('teste palográfico') || e.includes('teste palografico') ||
          e.includes('teste de atenção') || e.includes('teste de atencao') ||
          e.includes('teste romberg')
        ) ? 'Aguardando' : 'nao aplicavel';

        // Sala de Coleta: Todos os exames de sangue, urina, fezes, toxicológicos
        const salacoleta = lower.some(e =>
          e.includes('hemograma') || e.includes('glicemia') ||
          e.includes('epf') || e.includes('eas') ||
          e.includes('grupo sanguíneo') || e.includes('grupo sanguineo') ||
          e.includes('gama gt') || e.includes('tgo') || e.includes('tgp') ||
          e.includes('ácido') || e.includes('acido') ||
          e.includes('ala-u') || e.includes('hemoglobina') ||
          e.includes('coprocultura') || e.includes('colesterol') ||
          e.includes('chumbo') || e.includes('creatinina') ||
          e.includes('ferro sérico') || e.includes('ferro serico') ||
          e.includes('manganês') || e.includes('manganes') ||
          e.includes('reticulócitos') || e.includes('reticulocitos') ||
          e.includes('triglicerídeos') || e.includes('triglicerideos') ||
          e.includes('ige específica') || e.includes('ige especifica') ||
          e.includes('acetona') ||
          e.includes('anti hav') || e.includes('anti hbs') || e.includes('anti hbsag') || e.includes('anti hcv') ||
          e.includes('carboxihemoglobina') ||
          e.includes('toxicológico') || e.includes('toxicologico')
        ) ? 'Aguardando' : 'nao aplicavel';

        // Audiometria: apenas o exame de Audiometria
        const audiometria = lower.some(e =>
          e.includes('audiometria')
        ) ? 'Aguardando' : 'nao aplicavel';

        // Raio-X: todos os exames de Raio-X
        const raiox = lower.some(e =>
          e.includes('raio-x') || e.includes('raio x')
        ) ? 'Aguardando' : 'nao aplicavel';

        return { consultorio, salaexames, salacoleta, audiometria, raiox };
      };

      // Calcula as salas baseado nos exames selecionados
      const salasCalculadas = calcularSalasPorExames(selectedExams);

      let agendamentoError;

      if (initialAppointment) {
        // --- EDIÇÃO / REAGENDAMENTO ---
        // Envia os campos editáveis do formulário + salas recalculadas pelos exames.
        // NÃO inclui: posicao_tela, sala_chamada, chegou_em, compareceu, status, recepcao
        // para que esses valores de fila/atendimento sejam preservados.
        const updatePayload: any = {
          colaborador_id: finalColabId,
          data_atendimento: appointmentData.data_atendimento,
          tipo: appointmentData.tipo,
          unidade: unitId,
          exames_snapshot: selectedExams,
          ficha_url: generatedUrl || initialAppointment.ficha_url,
          obs_agendamento: obsAgendamento || null,
          prioridade: prioridade,
          valor: finalValor || initialAppointment.valor || 0,
          metodo_pagamento: finalMetodo !== 'medicao' ? finalMetodo : (initialAppointment.metodo_pagamento || 'medicao'),
          observacoes: obsClinica || null,
          // Salas recalculadas automaticamente baseado nos exames selecionados
          ...salasCalculadas,
        };

        const { error } = await supabase.from('agendamentos').update(updatePayload).eq('id', initialAppointment.id);
        agendamentoError = error;
      } else {
        // --- NOVO AGENDAMENTO ---
        // Inclui todos os campos necessários para a criação
        const insertPayload: any = {
          colaborador_id: finalColabId,
          data_atendimento: appointmentData.data_atendimento,
          tipo: appointmentData.tipo,
          unidade: unitId,
          exames_snapshot: selectedExams,
          ficha_url: generatedUrl,
          obs_agendamento: obsAgendamento || null,
          prioridade: prioridade,
          valor: finalValor,
          metodo_pagamento: finalMetodo,
          observacoes: obsClinica || null,
          compareceu: false,
          status: 'pendente',
          recepcao: 'Aguardando',
          // Salas calculadas automaticamente baseado nos exames selecionados
          ...salasCalculadas,
        };

        const { error } = await supabase.from('agendamentos').insert([insertPayload]);
        agendamentoError = error;
      }

      if (agendamentoError) throw agendamentoError;

      setMessage({ type: 'success', text: initialAppointment ? 'Agendamento atualizado!' : 'Agendamento salvo!' });

      setSavedContext({
        pacienteName: colabFormData.nome,
        data: appointmentData.data_atendimento,
        exames: selectedExams, // Enviando lista original (com Higidez) para o WhatsApp
        obsClinica: obsClinica
      });

      setShowNotifyModal(true);

    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  const filteredColabs = colaboradores.filter(c =>
    (c.nome && (c.nome || '').toLowerCase().includes((colabSearchTerm || '').toLowerCase())) ||
    (c.cpf && (c.cpf || '').includes(colabSearchTerm || ''))
  );

  const unitOptions = unidades.map(u => ({ id: u.id, label: u.nome_unidade }));
  const filteredExams = EXAMES_LIST.filter(exame => (exame.nome || '').toLowerCase().includes((examSearchTerm || '').toLowerCase()));

  // Helper function to strip emojis, numbers, and accents
  const cleanText = (text: string) => {
    return text
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
      .replace(/[^a-z\s]/g, "") // Remove everything except letters and spaces (removes numbers/emojis)
      .trim();
  };

  // --- Strict Contact Filtering Logic ---
  const filteredContacts = contactsList.filter(contact => {
    // 1. If input is empty, show NO ONE
    if (!contactSearchTerm.trim()) return false;

    const cleanSearch = cleanText(contactSearchTerm);

    // 2. If search was only numbers/symbols and became empty string, also return false
    if (!cleanSearch) return false;

    const cleanName = cleanText(contact.chatname || '');

    // 3. Strict inclusion on cleaned text
    return cleanName.includes(cleanSearch);
  });

  return (
    <div className="max-w-5xl mx-auto pb-10 relative">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-ios-text tracking-tight">
          {initialAppointment ? 'Editar Agendamento' : 'Novo Agendamento'}
        </h2>
        {onCancel && (
          <button onClick={onCancel} className="text-ios-primary font-semibold hover:underline">
            Voltar
          </button>
        )}
      </div>

      <div className="bg-white rounded-ios p-8 shadow-sm border border-gray-100">
        {message && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            <span className="w-2 h-2 rounded-full bg-current"></span>
            {message.text}
          </div>
        )}

        {!initialAppointment && (
          <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
            <button type="button" onClick={() => { setMode('existing'); clearFields(); }} className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${mode === 'existing' ? 'bg-white text-ios-primary shadow-sm' : 'text-gray-500'}`}>Colaborador Existente</button>
            <button type="button" onClick={() => { setMode('new'); clearFields(); }} className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all ${mode === 'new' ? 'bg-white text-ios-primary shadow-sm' : 'text-gray-500'}`}>Novo Cadastro</button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {!initialAppointment && (
            <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center gap-3 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <input type="checkbox" id="avulsoCheck" checked={isAvulso} onChange={(e) => { setIsAvulso(e.target.checked); e.target.checked ? (setAppointmentData(prev => ({ ...prev, unidade: '' })), setUnitSearchTerm('Avulsos')) : (setUnitSearchTerm(''), setValorAvulso('')); }} className="w-5 h-5 text-ios-primary border-gray-300 rounded focus:ring-ios-primary" />
                <div className="flex flex-col"><label htmlFor="avulsoCheck" className="text-sm font-bold text-gray-700 cursor-pointer select-none">Lançamento Avulso (Particular)</label></div>
              </div>
              {isAvulso && (
                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 animate-in fade-in slide-in-from-top-2 space-y-4">
                  <div><label className="block text-xs font-bold text-yellow-600 mb-1.5 ml-1 uppercase">Valor</label><div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-600 font-bold">R$</span><input type="number" step="0.01" required={isAvulso} value={valorAvulso} onChange={(e) => setValorAvulso(e.target.value)} className="w-full h-12 pl-10 pr-4 rounded-xl bg-white border-2 border-yellow-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all text-gray-800 font-bold text-lg" placeholder="0,00" /></div></div>
                  <div><label className="block text-xs font-bold text-yellow-600 mb-1.5 ml-1 uppercase">Pagamento</label><select value={metodoPagamento} onChange={(e) => setMetodoPagamento(e.target.value)} className="w-full h-12 px-4 rounded-xl bg-white border-2 border-yellow-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-400/20 outline-none transition-all text-gray-800 font-medium"><option value="Pix">Pix</option><option value="Dinheiro">Dinheiro</option><option value="Cartão de Crédito">Cartão de Crédito</option><option value="Cartão de Débito">Cartão de Débito</option></select></div>
                </div>
              )}
            </div>
          )}

          {mode === 'existing' && !selectedColabId && !initialAppointment && (
            <div className="relative mb-8">
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide ml-1">Buscar Colaborador</label>
              <input type="text" placeholder="Pesquisar por nome ou CPF..." value={colabSearchTerm} onChange={(e) => setColabSearchTerm(e.target.value)} className="w-full h-14 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-ios-primary outline-none transition-all text-ios-text font-medium" />
              {colabSearchTerm && (
                <div className="absolute z-20 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-float max-h-60 overflow-y-auto custom-scrollbar">
                  {filteredColabs.map(c => (
                    <button key={c.id} type="button" onClick={() => handleSelectColab(c)} className="w-full text-left px-5 py-4 hover:bg-gray-50 border-b border-gray-50 flex justify-between"><div><p className="font-bold text-gray-800">{c.nome}</p><p className="text-xs text-gray-400 font-mono">{c.cpf}</p></div></button>
                  ))}
                </div>
              )}
            </div>
          )}

          {(mode === 'new' || selectedColabId) && (
            <div className="space-y-6 animate-in fade-in">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2"><h3 className="text-sm uppercase tracking-wider text-ios-subtext font-bold">Dados Pessoais</h3></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div><label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Nome</label><input type="text" required value={colabFormData.nome} onChange={e => setColabFormData({ ...colabFormData, nome: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none" /></div>
                <div><label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">CPF</label><input type="text" required value={colabFormData.cpf} onChange={e => setColabFormData({ ...colabFormData, cpf: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none" /></div>
                <div><label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Nascimento</label><input type="date" required value={colabFormData.data_nascimento} onChange={e => setColabFormData({ ...colabFormData, data_nascimento: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none" /></div>
                <div><label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Sexo</label><select required value={colabFormData.sexo} onChange={e => setColabFormData({ ...colabFormData, sexo: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none"><option value="M">Masculino</option><option value="F">Feminino</option></select></div>
                <div><SearchableInput label="Setor" value={colabFormData.setor} onChange={(val) => setColabFormData({ ...colabFormData, setor: val })} onSelect={(val) => setColabFormData({ ...colabFormData, setor: val })} options={setoresList} /></div>
                <div><SearchableInput label="Função" value={colabFormData.funcao} onChange={(val) => setColabFormData({ ...colabFormData, funcao: val })} onSelect={(val) => setColabFormData({ ...colabFormData, funcao: val })} options={cargosList} /></div>
              </div>
            </div>
          )}

          <div className="h-px bg-gray-100 w-full"></div>

          <div className="space-y-6">
            <h3 className="text-sm uppercase tracking-wider text-ios-subtext font-bold border-b border-gray-100 pb-2">Detalhes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div><label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Data</label><input type="date" required value={appointmentData.data_atendimento} onChange={e => setAppointmentData({ ...appointmentData, data_atendimento: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none" /></div>
              <div>
                {!isAvulso ? (
                  <>
                    <SearchableInput
                      label="Empresa / Unidade"
                      value={unitSearchTerm}
                      onChange={(val) => { setUnitSearchTerm(val); setAppointmentData(prev => ({ ...prev, unidade: '' })); if (val !== "Prefeitura/ Estado") { setValorAvulso(''); setMetodoPagamento('Pix'); setOutroMetodoPagamento(''); } }}
                      onSelect={handleSelectUnit}
                      options={unitOptions}
                      required={!isAvulso}
                      onAddNew={async () => {
                        setNewCompanyName(unitSearchTerm);
                        // Fetch clients for the dropdown
                        const { data } = await supabase.from('clientes').select('id, nome_fantasia').order('nome_fantasia');
                        if (data) {
                          setClientsList(data.map(c => ({ id: c.id, label: c.nome_fantasia })));
                        }
                        setShowNewCompanyModal(true);
                      }}
                      addNewLabel="+ Nova Unidade"
                    />
                    {isPrefeitura && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-top-2 space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-blue-600 mb-1.5 ml-1 uppercase">Valor (R$)</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-600 font-bold">R$</span>
                            <input
                              type="number"
                              step="0.01"
                              required
                              value={valorAvulso}
                              onChange={(e) => setValorAvulso(e.target.value)}
                              className="w-full h-12 pl-10 pr-4 rounded-xl bg-white border border-blue-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all text-gray-800 font-bold text-lg"
                              placeholder="0,00"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-blue-600 mb-1.5 ml-1 uppercase">Forma de Pagamento</label>
                          <select
                            value={metodoPagamento}
                            onChange={(e) => setMetodoPagamento(e.target.value)}
                            className="w-full h-12 px-4 rounded-xl bg-white border border-blue-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all text-gray-800 font-medium"
                          >
                            <option value="Pix">Pix</option>
                            <option value="Dinheiro">Dinheiro</option>
                            <option value="Boleto">Boleto</option>
                            <option value="Cartão">Cartão</option>
                            <option value="Outro">Outro</option>
                          </select>
                        </div>
                        {metodoPagamento === 'Outro' && (
                          <div className="animate-in fade-in slide-in-from-top-1">
                            <label className="block text-xs font-bold text-blue-600 mb-1.5 ml-1 uppercase">Especifique</label>
                            <input
                              type="text"
                              required
                              value={outroMetodoPagamento}
                              onChange={(e) => setOutroMetodoPagamento(e.target.value)}
                              className="w-full h-12 px-4 rounded-xl bg-white border border-blue-200 focus:border-blue-400 focus:ring-4 focus:ring-blue-400/20 outline-none transition-all text-gray-800"
                              placeholder="Digite a forma de pagamento..."
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="opacity-50 pointer-events-none"><label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Empresa</label><input type="text" value="Avulsos" readOnly className="w-full h-12 px-4 rounded-xl bg-gray-100" /></div>
                )}
              </div>
              <div><label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Tipo</label><select value={appointmentData.tipo} onChange={(e) => setAppointmentData({ ...appointmentData, tipo: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none"><option value="Admissional">Admissional</option><option value="Demissional">Demissional</option><option value="Periódico">Periódico</option><option value="Retorno">Retorno ao Trabalho</option><option value="Mudança">Mudança de Função</option><option value="Outros">Outros</option></select></div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full"><label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Obs. Agendamento</label><textarea rows={2} value={obsAgendamento} onChange={(e) => setObsAgendamento(e.target.value)} className="w-full p-4 rounded-xl bg-yellow-50 border-transparent focus:bg-white outline-none resize-none" /></div>
              <div className="md:w-64"><label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Prioridade</label><div onClick={() => setPrioridade(!prioridade)} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${prioridade ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-transparent'}`}><div className={`w-6 h-6 rounded-md border flex items-center justify-center ${prioridade ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`}>{prioridade && <span className="text-white font-bold">✓</span>}</div><span className="text-sm font-bold text-gray-500">Marcar Prioridade</span></div></div>
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">{FORMULARIOS_OPTIONS.map((form) => (<button key={form.value} type="button" onClick={() => toggleFormulario(form.value)} className={`px-4 py-2.5 rounded-xl text-sm font-semibold border ${selectedFormularios.includes(form.value) ? 'bg-ios-secondary text-white border-ios-secondary' : 'bg-white text-gray-600 border-gray-200'}`}>{form.label}</button>))}</div>
          </div>

          <div className="space-y-6">
            <h3 className="text-sm uppercase tracking-wider text-ios-subtext font-bold">Observações Clínicas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <textarea rows={3} value={obsClinica} onChange={(e) => setObsClinica(e.target.value)} className="w-full p-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none" placeholder="Obs Clínicas" />
              <textarea rows={3} value={obsLaboratorial} onChange={(e) => setObsLaboratorial(e.target.value)} className="w-full p-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none" placeholder="Obs Laboratoriais" />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-ios-subtext font-bold">Exames ({selectedExams.length})</h3>
            <input type="text" placeholder="Filtrar exames..." value={examSearchTerm} onChange={(e) => setExamSearchTerm(e.target.value)} className="w-full h-12 px-4 mb-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
              {filteredExams.map(ex => (<button key={ex.id} type="button" onClick={() => toggleExam(ex.nome)} className={`p-3 rounded-xl border text-left text-sm font-medium ${selectedExams.includes(ex.nome) ? 'bg-ios-primary text-white border-ios-primary' : 'bg-white border-gray-100'}`}>{ex.nome}</button>))}
            </div>
          </div>

          <div className="pt-6 space-y-4">
            <button type="submit" disabled={loading} className={`w-full h-14 rounded-2xl font-bold text-lg text-white shadow-xl ${loading ? 'bg-gray-300' : 'bg-ios-primary'}`}>{loading ? '...' : (initialAppointment ? 'Atualizar Agendamento' : 'Confirmar')}</button>
            {initialAppointment && (<button type="button" onClick={handleDeleteRequest} disabled={loading} className="w-full h-14 rounded-2xl font-bold text-lg text-red-500 bg-red-50 border border-red-100">Excluir</button>)}
          </div>
        </form>
      </div>

      {showNewCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-ios p-6 max-w-md w-full shadow-2xl space-y-4">
            <h3 className="text-xl font-bold">Nova Unidade</h3>
            <div className="space-y-4">
              <SearchableInput
                label="Cliente / Empresa Matriz"
                value={selectedClientName}
                onChange={(val) => { setSelectedClientName(val); setSelectedClientId(null); }}
                onSelect={handleSelectClient}
                options={clientsList}
                placeholder="Pesquisar cliente..."
                required
                onAddNew={undefined} // No new client creation here
                noResultText="Entre em contato com a equipe de T.I"
              />
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Nome da Unidade</label>
                <input type="text" value={newCompanyName} onChange={e => setNewCompanyName(e.target.value)} className="w-full h-14 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none" placeholder="Ex: Filial Centro, Obra 01..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowNewCompanyModal(false)} className="flex-1 py-3 font-semibold bg-gray-100 rounded-xl">Cancelar</button>
              <button onClick={handleSaveNewUnit} className="flex-1 py-3 font-semibold text-white bg-ios-primary rounded-xl">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-ios p-6 max-w-sm w-full shadow-2xl text-center border-t-4 border-red-500">
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500 mb-4 mx-auto text-3xl">
              ✕
            </div>
            <h3 className="text-xl font-bold mb-2 text-gray-800">Atenção</h3>
            <p className="text-gray-600 mb-6 px-2">{errorModalMessage}</p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full py-3 font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl transition-colors shadow-lg shadow-red-500/30"
            >
              Entendido
            </button>
          </div>
        </div>
      )}

      {showNotifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-ios p-6 max-w-sm w-full shadow-2xl text-center">
            <div className="w-12 h-12 rounded-full bg-ios-primary/10 flex items-center justify-center text-ios-primary mb-4 mx-auto text-2xl">💬</div>
            <h3 className="text-xl font-bold mb-2">Enviar notificação?</h3>
            <p className="text-gray-500 mb-6">Deseja enviar mensagem via WhatsApp?</p>
            <div className="flex gap-3">
              <button onClick={handleNotifyNo} className="flex-1 py-3 font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl">Não</button>
              <button onClick={handleNotifyYes} className="flex-1 py-3 font-semibold text-white bg-ios-primary hover:bg-ios-secondary rounded-xl shadow-lg">Sim</button>
            </div>
          </div>
        </div>
      )}

      {showContactListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-ios max-w-md w-full shadow-2xl h-[500px] flex flex-col overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Selecione o Contato</h3>
                <button onClick={() => { setShowContactListModal(false); handleCancelAndExit(); }} className="text-gray-400">✕</button>
              </div>
              <input
                type="text"
                placeholder="Pesquisar contato..."
                value={contactSearchTerm}
                onChange={(e) => setContactSearchTerm(e.target.value)}
                className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-ios-primary outline-none"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 bg-gray-50">
              {filteredContacts.length > 0 ? (
                filteredContacts.map(contact => (
                  <button key={contact.phone} onClick={() => handleContactSelect(contact)} className="w-full p-4 flex items-center gap-4 bg-white hover:bg-ios-primary/5 rounded-xl transition-all border border-gray-100 hover:border-ios-primary/20 text-left">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">{contact.chatname.charAt(0)}</div>
                    <div><p className="font-bold text-gray-900">{contact.chatname}</p><p className="text-xs text-gray-400">{contact.phone}</p></div>
                  </button>
                ))
              ) : (
                <div className="text-center py-10 text-gray-400">
                  {!contactSearchTerm.trim() ? "Digite para pesquisar..." : "Nenhum contato encontrado."}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 text-center">
              <button onClick={() => { setShowContactListModal(false); handleCancelAndExit(); }} className="text-gray-500 font-bold text-sm">Pular notificação</button>
            </div>
          </div>
        </div>
      )}

      {showConfirmSendModal && selectedContact && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-ios p-6 max-w-sm w-full shadow-2xl text-center">
            <h3 className="text-xl font-bold mb-2">Enviar Confirmação</h3>
            <p className="text-gray-500 mb-6">Para <span className="font-bold text-gray-800">{selectedContact.chatname}</span>?</p>
            <div className="flex gap-3">
              <button onClick={() => { setShowConfirmSendModal(false); handleCancelAndExit(); }} className="flex-1 py-3 font-semibold bg-gray-100 rounded-xl" disabled={sendingMsg}>Cancelar</button>
              <button onClick={handleSendMessage} className="flex-1 py-3 font-semibold text-white bg-green-500 rounded-xl" disabled={sendingMsg}>{sendingMsg ? '...' : 'Enviar'}</button>
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-ios p-6 max-w-sm w-full shadow-2xl border border-red-100 text-center">
            <h3 className="text-xl font-bold mb-2">Excluir?</h3>
            <p className="text-gray-500 mb-6">Essa ação não pode ser desfeita.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteModal(false)} className="flex-1 py-3 font-semibold bg-gray-100 rounded-xl">Cancelar</button>
              <button onClick={executeDelete} className="flex-1 py-3 font-semibold text-white bg-red-500 rounded-xl">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentForm;
