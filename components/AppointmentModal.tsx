
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../services/supabaseClient';
import { Colaborador, Unidade, ChatTag, User } from '../types';

const EXAMES_LIST = [
  {"idx":0,"id":447,"nome":"Avaliação Clínica"},
  {"idx":1,"id":448,"nome":"Audiometria"},
  {"idx":2,"id":449,"nome":"Acuidade Visual"},
  {"idx":3,"id":450,"nome":"Espirometria"},
  {"idx":4,"id":451,"nome":"Eletrocardiograma"},
  {"idx":5,"id":452,"nome":"Eletrencefalograma"},
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
  {"idx":42,"id":489,"nome":"Avaliação Psicosocial"},
  {"idx":43,"id":490,"nome":"Avaliação Psicológica"},
  {"idx":44,"id":491,"nome":"Aspecto da Pele"},
  {"idx":45,"id":492,"nome":"Questionário Epilepsia"},
  {"idx":46,"id":493,"nome":"Teste Palográfico"},
  {"idx":47,"id":494,"nome":"Teste de Atenção"},
  {"idx":48,"id":495,"nome":"Teste Romberg"},
  {"idx":49,"id":496,"nome":"Exame Toxicológico Urina"}
];

interface AppointmentModalProps {
    onClose?: () => void;
    currentUser?: User | null;
    initialData?: {
        nome?: string;
        cpf?: string;
        data_nascimento?: string;
        cargo?: string;
        setor?: string;
        empresa?: string;
        tipo_exame?: string;
        data_agendamento?: string;
        unidade_id?: string;
    } | null;
    isPublic?: boolean;
    selectedChat?: ChatTag; // Add this to know which chat is active (optional now since we pick contact)
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({ onClose, currentUser, initialData, isPublic = false }) => {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const unitsLoadedRef = useRef(false);
  
  // Unified Colaborador Form State (used for both New and Edit)
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
  const [unitSearchTerm, setUnitSearchTerm] = useState('');
  const [showUnitList, setShowUnitList] = useState(false);
  const unitWrapperRef = useRef<HTMLDivElement>(null);

  const [appointmentData, setAppointmentData] = useState({
    data_atendimento: new Date().toISOString().split('T')[0],
    tipo: 'Admissional',
    unidade: ''
  });

  // Exam Selection State
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [examSearchTerm, setExamSearchTerm] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // --- Notification Workflow States ---
  const [savedContext, setSavedContext] = useState<any>(null); // Holds data after save for the modal flow
  const [showNotifyModal, setShowNotifyModal] = useState(false);
  const [showContactListModal, setShowContactListModal] = useState(false);
  const [showConfirmSendModal, setShowConfirmSendModal] = useState(false);
  const [showPublicSuccessModal, setShowPublicSuccessModal] = useState(false); // Public success popup
  
  const [contactsList, setContactsList] = useState<ChatTag[]>([]);
  const [selectedContact, setSelectedContact] = useState<ChatTag | null>(null);
  const [contactSearchQuery, setContactSearchQuery] = useState(''); // Search for contacts
  const [sendingMsg, setSendingMsg] = useState(false);

  useEffect(() => {
    // Scroll to top animation on mount to ensure visibility
    window.scrollTo({ top: 0, behavior: 'smooth' });

    fetchInitialData();
    // If public, default to new mode
    if (isPublic) {
        setMode('new');
    }

    function handleClickOutside(event: MouseEvent) {
      if (unitWrapperRef.current && !unitWrapperRef.current.contains(event.target as Node)) {
        setShowUnitList(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isPublic]);

  // Pre-fill Logic
  useEffect(() => {
    if (initialData) {
        // If coming from link or pre-filled, usually implies 'new'/edit
        setMode('new'); 
        setColabFormData(prev => ({
            ...prev,
            nome: initialData.nome || '',
            cpf: initialData.cpf || '',
            data_nascimento: initialData.data_nascimento || '',
            funcao: initialData.cargo || '',
            setor: initialData.setor || '',
        }));

        setAppointmentData(prev => ({
            ...prev,
            data_atendimento: initialData.data_agendamento || new Date().toISOString().split('T')[0],
            tipo: initialData.tipo_exame || 'Admissional'
        }));

        if (initialData.empresa) {
            setUnitSearchTerm(initialData.empresa);
        }

        // Handle Unidade ID lock
        if (initialData.unidade_id) {
             setAppointmentData(prev => ({ ...prev, unidade: initialData.unidade_id! }));
        }
    }
  }, [initialData]);

  // Try to match unit name to ID after units fetch if prefilled
  useEffect(() => {
      if (unitsLoadedRef.current) {
          // If we have an ID directly
          if (initialData?.unidade_id) {
             const u = unidades.find(unit => unit.id.toString() === initialData.unidade_id);
             if (u) setUnitSearchTerm(u.nome_unidade);
          } 
          // Else if we have a name
          else if (initialData?.empresa) {
             const matchedUnit = unidades.find(u => u.nome_unidade && u.nome_unidade.toLowerCase().includes(initialData.empresa!.toLowerCase()));
             if (matchedUnit) {
                setAppointmentData(prev => ({ ...prev, unidade: matchedUnit.id.toString() }));
                setUnitSearchTerm(matchedUnit.nome_unidade);
             }
          }
      }
  }, [unidades, initialData]);


  const fetchInitialData = async () => {
    const { data: colabs } = await supabase.from('colaboradores').select('id, nome, cpf, data_nascimento, sexo, setor, cargo');
    const { data: units } = await supabase.from('unidades').select('id, nome_unidade');
    
    if (colabs) setColaboradores(colabs as Colaborador[]);
    if (units) {
        setUnidades(units);
        unitsLoadedRef.current = true;
    }
  };

  const toggleExam = (examName: string) => {
    if (selectedExams.includes(examName)) {
      setSelectedExams(selectedExams.filter(e => e !== examName));
    } else {
      setSelectedExams([...selectedExams, examName]);
    }
  };

  const handleSelectColab = (colab: Colaborador) => {
    setSelectedColabId(colab.id);
    setColabFormData({
      nome: colab.nome,
      cpf: colab.cpf,
      data_nascimento: colab.data_nascimento,
      sexo: colab.sexo || 'M',
      setor: colab.setor || '',
      funcao: colab.cargo ? String(colab.cargo) : '' 
    });
    setColabSearchTerm(''); 
  };

  const handleSelectUnit = (unit: Unidade) => {
    setAppointmentData({ ...appointmentData, unidade: unit.id.toString() });
    setUnitSearchTerm(unit.nome_unidade);
    setShowUnitList(false);
  };

  const resetForm = () => {
    setColabFormData({ nome: '', cpf: '', data_nascimento: '', sexo: 'M', setor: '', funcao: '' });
    setSelectedExams([]);
    setSelectedColabId('');
    setColabSearchTerm('');
    // Only clear unit if not locked by initialData
    if (!initialData?.unidade_id) {
        setUnitSearchTerm('');
        setAppointmentData(prev => ({ ...prev, unidade: '' }));
    }
    setSavedContext(null);
    if(mode === 'new') fetchInitialData(); 
  };

  const filteredExams = EXAMES_LIST.filter(exame => 
    (exame.nome && exame.nome.toLowerCase().includes(examSearchTerm.toLowerCase()))
  );

  const filteredColabs = colaboradores.filter(c => 
    (c.nome && c.nome.toLowerCase().includes(colabSearchTerm.toLowerCase())) || 
    (c.cpf && c.cpf.includes(colabSearchTerm))
  );

  const filteredUnits = unidades.filter(u => 
    (u.nome_unidade && u.nome_unidade.toLowerCase().includes(unitSearchTerm.toLowerCase()))
  );

  const generatePDF = async (payload: any) => {
    try {
      const response = await fetch("https://gerador-ficha-api.vercel.app/api/generate-pdf", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("Falha na geração do PDF");
      
      const data = await response.json();
      
      if (data.publicUrl) return data.publicUrl;
      if (data.url) return data.url;
      if (data.pdf_url) return data.pdf_url;
      if (typeof data === 'string') return data;
      
      return null;
    } catch (error) {
      console.error("PDF Generation Error:", error);
      return null;
    }
  };

  // --- Notification Workflow Logic ---

  const handleNotifyYes = async () => {
    setShowNotifyModal(false);
    
    if (!currentUser) return;

    // Fetch all contacts (chat_tags)
    const { data, error } = await supabase
        .from('chat_tags')
        .select('*');

    if (error || !data || data.length === 0) {
        alert("Nenhum contato encontrado.");
        resetForm();
        if(onClose) onClose();
        return;
    }

    setContactsList(data as ChatTag[]);
    setContactSearchQuery('');
    setShowContactListModal(true);
  };

  const handleNotifyNo = () => {
    setShowNotifyModal(false);
    resetForm();
    if(onClose) onClose();
  };

  const handleContactSelect = (contact: ChatTag) => {
    setSelectedContact(contact);
    setShowContactListModal(false);
    setShowConfirmSendModal(true);
  };

  const handleSendMessage = async () => {
    if (!selectedContact || !savedContext || !currentUser) return;
    
    setSendingMsg(true);

    const formattedDate = new Date(savedContext.data).toLocaleDateString('pt-BR');
    const examsListString = savedContext.exames.map((e: string) => `- ${e}`).join('\n');
    
    const messageBody = `*${currentUser.username}:*\n\nExame Ocupacional do(a) paciente *${savedContext.pacienteName}* está agendado para *${formattedDate}*, *ás 7:00*:\n_Atendimento por ordem de chegada!_\n\n*Exames Solicitados:*\n${examsListString}\n\n*Orientações dos exames ocupacionais:*\n- Levar RG e CPF!\n- Fazer repouso auditivo de 12 horas.\n\n_Endereço da Clínica Gama Center: Rua Barão de Pouso Alegre, 90, São Sebastião, Conselheiro Lafaiete (ao lado da Igreja São Sebastião)._`;

    try {
        const response = await fetch("https://api.z-api.io/instances/3E8112AFC26DD1A98FF7B2116B9188C4/token/A5112854C9B41DACC9EA5B85/send-text", {
            method: "POST",
            headers: {
                "Client-Token": "F53f53bad10a9494f92d5e33804220a26S",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                phone: selectedContact.phone,
                message: messageBody
            })
        });

        if (response.ok) {
            alert("Notificação enviada com sucesso!");
        } else {
            alert("Erro ao enviar notificação.");
        }

    } catch (e) {
        console.error("API Send Error", e);
        alert("Erro de conexão ao enviar mensagem.");
    } finally {
        setSendingMsg(false);
        setShowConfirmSendModal(false);
        resetForm();
        if(onClose) onClose();
    }
  };

  // Filter and Sort contacts for notification
  const filteredContacts = !contactSearchQuery.trim()
    ? [] // Empty list if no search query
    : contactsList
    .filter(c => 
        (c.chatname && c.chatname.toLowerCase().includes(contactSearchQuery.toLowerCase())) || 
        (c.phone && c.phone.includes(contactSearchQuery))
    )
    .sort((a, b) => {
        const query = contactSearchQuery.toLowerCase();
        
        const nameA = a.chatname ? a.chatname.toLowerCase() : '';
        const nameB = b.chatname ? b.chatname.toLowerCase() : '';
        
        // Prioritize exact start match
        const startA = nameA.startsWith(query);
        const startB = nameB.startsWith(query);
        
        if (startA && !startB) return -1;
        if (!startA && startB) return 1;
        
        return nameA.localeCompare(nameB);
    });

  // -------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      let finalColabId = selectedColabId;
      const unitId = appointmentData.unidade ? parseInt(appointmentData.unidade) : null;

      if (mode === 'new') {
        const { data: newColabData, error: colabError } = await supabase
          .from('colaboradores')
          .insert([{
            nome: colabFormData.nome,
            cpf: colabFormData.cpf,
            data_nascimento: colabFormData.data_nascimento,
            sexo: colabFormData.sexo,
            setor: colabFormData.setor,
            unidade: unitId
          }])
          .select()
          .single();

        if (colabError) throw colabError;
        finalColabId = newColabData.id;
      } else {
        if (!finalColabId) throw new Error("Selecione um colaborador existente.");
        
        const { error: updateError } = await supabase
          .from('colaboradores')
          .update({
            nome: colabFormData.nome,
            cpf: colabFormData.cpf,
            data_nascimento: colabFormData.data_nascimento,
            sexo: colabFormData.sexo,
            setor: colabFormData.setor,
            unidade: unitId
          })
          .eq('id', finalColabId);

        if (updateError) throw updateError;
      }

      const selectedUnidade = unidades.find(u => u.id === unitId);
      
      const pdfPayload = {
        empresa: "Gama Center",
        unidade: selectedUnidade?.nome_unidade || "Matriz",
        paciente: {
          nome: colabFormData.nome,
          cpf: colabFormData.cpf,
          funcao: colabFormData.funcao || colabFormData.setor || "Não informado",
          sexo: colabFormData.sexo,
          nascimento: `${colabFormData.data_nascimento}`,
          setor: colabFormData.setor || "Operacional"
        },
        tipo_exame: [appointmentData.tipo],
        exames_requisitados: selectedExams,
        observacoes: "Nenhuma",
        data: appointmentData.data_atendimento
      };

      const generatedUrl = await generatePDF(pdfPayload);

      const { error: aptError } = await supabase
        .from('agendamentos')
        .insert([{
          colaborador_id: finalColabId,
          data_atendimento: appointmentData.data_atendimento,
          tipo: appointmentData.tipo,
          unidade: unitId,
          status: 'pendente',
          recepcao: 'Aguardando',
          exames_snapshot: selectedExams,
          ficha_url: generatedUrl
        }]);

      if (aptError) throw aptError;

      if (currentUser) {
          setMessage({ type: 'success', text: 'Agendamento salvo com sucesso!' });
          // Prepare context for notification
          setSavedContext({
              pacienteName: colabFormData.nome,
              data: appointmentData.data_atendimento,
              exames: selectedExams
          });
          // ASK user to notify company
          setShowNotifyModal(true);
      } else {
          // Public mode: Show Success Popup and reset form
          setShowPublicSuccessModal(true);
          resetForm();
      }

    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err.message || 'Erro ao realizar agendamento.' });
    } finally {
      setLoading(false);
    }
  };

  // Determine wrapper classes based on isPublic prop
  // Updated z-index to z-[100] to ensure it sits on top of everything
  const wrapperClasses = isPublic 
    ? "min-h-screen flex items-center justify-center p-4 bg-[#f2f2f7] dark:bg-black animate-fadeIn" // Full screen for public
    : "fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn"; // Modal overlay for internal

  const containerClasses = isPublic
    ? "bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-sm border border-white dark:border-white/5 p-6 w-full max-w-4xl overflow-y-auto animate-scaleIn relative my-4"
    : "bg-white dark:bg-[#1c1c1e] rounded-[24px] shadow-2xl p-6 w-full max-w-5xl max-h-[90vh] overflow-y-auto custom-scrollbar animate-scaleIn relative border border-white dark:border-white/5";

  return createPortal(
    <div className={wrapperClasses}>
      <div className={containerClasses}>
          
          {/* Close button - only show if NOT public */}
          {!isPublic && onClose && (
            <button 
                onClick={onClose}
                className="absolute top-6 right-6 p-2 bg-slate-100 hover:bg-slate-200 dark:bg-white/10 dark:hover:bg-white/20 rounded-full text-slate-500 dark:text-slate-400 z-10"
            >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
          )}

          {isPublic && (
               <div className="flex flex-col items-center mb-6">
                    <div className="w-16 h-16 rounded-[18px] overflow-hidden shadow-lg shadow-[#04a7bd]/20 mb-4">
                        <img src="https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/public/Media/Image/image-removebg-preview%20(2).png" alt="Gama Talk" className="w-full h-full object-cover" />
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight text-center">Autoagendamento</h2>
               </div>
          )}

          {!isPublic && <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-8 tracking-tight">Novo Agendamento</h2>}

          <div className="bg-white dark:bg-[#1c1c1e] rounded-xl p-2">
            {message && (
            <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === 'success' ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400'}`}>
                <span className="w-2 h-2 rounded-full bg-current"></span>
                {message.text}
            </div>
            )}

            {/* Toggle Mode (Hide in Public Mode) */}
            {!isPublic && (
                <div className="flex bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl mb-8">
                <button
                    type="button"
                    onClick={() => { setMode('existing'); resetForm(); }}
                    className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    mode === 'existing' 
                    ? 'bg-white dark:bg-[#1c1c1e] text-[#04a7bd] shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                    }`}
                >
                    Colaborador Existente
                </button>
                <button
                    type="button"
                    onClick={() => { setMode('new'); resetForm(); }}
                    className={`flex-1 py-3 text-sm font-semibold rounded-xl transition-all duration-300 ${
                    mode === 'new' 
                    ? 'bg-white dark:bg-[#1c1c1e] text-[#04a7bd] shadow-sm' 
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white'
                    }`}
                >
                    Novo Cadastro
                </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Section: Colaborador Search (Only in Existing Mode) */}
            {mode === 'existing' && !selectedColabId && (
                <div className="relative mb-8">
                <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide ml-1">Buscar Colaborador</label>
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-400 group-focus-within:text-[#04a7bd] transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input 
                        type="text"
                        placeholder="Pesquisar por nome ou CPF..."
                        value={colabSearchTerm}
                        onChange={(e) => setColabSearchTerm(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-4 focus:ring-[#04a7bd]/10 outline-none transition-all text-slate-800 dark:text-white placeholder-gray-400 font-medium"
                    />
                    
                    {/* Search Results Dropdown */}
                    {colabSearchTerm && (
                        <div className="absolute z-20 w-full mt-2 bg-white dark:bg-[#2c2c2e] border border-gray-100 dark:border-white/5 rounded-xl shadow-lg max-h-60 overflow-y-auto custom-scrollbar">
                            {filteredColabs.length > 0 ? (
                                filteredColabs.map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => handleSelectColab(c)}
                                        className="w-full text-left px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-50 dark:border-white/5 last:border-0 flex justify-between items-center group"
                                    >
                                        <div>
                                            <p className="font-bold text-gray-800 dark:text-white">{c.nome}</p>
                                            <p className="text-xs text-gray-400 font-mono mt-0.5">{c.cpf}</p>
                                        </div>
                                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center group-hover:bg-[#04a7bd] group-hover:text-white transition-all">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                            </svg>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-6 text-center text-gray-400 text-sm">
                                    Nenhum colaborador encontrado.
                                </div>
                            )}
                        </div>
                    )}
                </div>
                </div>
            )}

            {/* Section: Colaborador Form Data */}
            {(mode === 'new' || selectedColabId) && (
                <div className="space-y-6 animate-fadeIn">
                    <div className="flex justify-between items-center border-b border-gray-100 dark:border-white/5 pb-2">
                        <h3 className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">
                            {mode === 'existing' ? 'Editar Dados' : 'Dados Pessoais'}
                        </h3>
                        {mode === 'existing' && selectedColabId && (
                            <button 
                                type="button" 
                                onClick={resetForm}
                                className="text-xs text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                Cancelar / Trocar
                            </button>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Nome Completo</label>
                            <input
                                type="text"
                                required
                                value={colabFormData.nome}
                                onChange={e => setColabFormData({...colabFormData, nome: e.target.value})}
                                className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-4 focus:ring-[#04a7bd]/10 outline-none transition-all text-slate-800 dark:text-white"
                            />
                        </div>
                        <div className="col-span-2 md:col-span-1">
                            <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">CPF</label>
                            <input
                                type="text"
                                required
                                value={colabFormData.cpf}
                                onChange={e => setColabFormData({...colabFormData, cpf: e.target.value})}
                                className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-4 focus:ring-[#04a7bd]/10 outline-none transition-all text-slate-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Data de Nascimento</label>
                            <input
                                type="date"
                                required
                                value={colabFormData.data_nascimento}
                                onChange={e => setColabFormData({...colabFormData, data_nascimento: e.target.value})}
                                className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-4 focus:ring-[#04a7bd]/10 outline-none transition-all text-gray-600 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Sexo</label>
                            <div className="relative">
                                <select
                                    required
                                    value={colabFormData.sexo}
                                    onChange={e => setColabFormData({...colabFormData, sexo: e.target.value})}
                                    className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-4 focus:ring-[#04a7bd]/10 outline-none transition-all text-gray-600 dark:text-white appearance-none"
                                >
                                    <option value="M">Masculino</option>
                                    <option value="F">Feminino</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                    <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Setor</label>
                            <input
                                type="text"
                                value={colabFormData.setor}
                                onChange={e => setColabFormData({...colabFormData, setor: e.target.value})}
                                className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-4 focus:ring-[#04a7bd]/10 outline-none transition-all text-slate-800 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Função</label>
                            <input
                                type="text"
                                value={colabFormData.funcao}
                                onChange={e => setColabFormData({...colabFormData, funcao: e.target.value})}
                                className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-4 focus:ring-[#04a7bd]/10 outline-none transition-all text-slate-800 dark:text-white"
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="h-px bg-gray-100 dark:bg-white/5 w-full"></div>

            {/* Section: Dados do Atendimento */}
            <div className="space-y-6">
                <h3 className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold border-b border-gray-100 dark:border-white/5 pb-2">Detalhes do Atendimento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Data</label>
                    <input
                        type="date"
                        required
                        value={appointmentData.data_atendimento}
                        onChange={e => setAppointmentData({...appointmentData, data_atendimento: e.target.value})}
                        className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-4 focus:ring-[#04a7bd]/10 outline-none transition-all text-gray-600 dark:text-white"
                    />
                </div>
                
                {/* Searchable Unit Selection (Locked if Public and Unit Provided) */}
                <div ref={unitWrapperRef} className="relative">
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Empresa / Unidade</label>
                    <div className="relative group">
                        <input
                            type="text"
                            required
                            placeholder="Selecione a unidade..."
                            value={unitSearchTerm}
                            readOnly={!!initialData?.unidade_id} // Lock if ID provided
                            onChange={(e) => {
                                if(!initialData?.unidade_id) {
                                    setUnitSearchTerm(e.target.value);
                                    setAppointmentData(prev => ({ ...prev, unidade: '' }));
                                    setShowUnitList(true);
                                }
                            }}
                            onFocus={() => {
                                if(!initialData?.unidade_id) setShowUnitList(true);
                            }}
                            className={`w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-4 focus:ring-[#04a7bd]/10 outline-none transition-all text-gray-600 dark:text-white ${initialData?.unidade_id ? 'cursor-not-allowed opacity-70 bg-gray-100 dark:bg-white/10' : ''}`}
                        />
                        {!initialData?.unidade_id && (
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                                <svg className="h-4 w-4 text-gray-400 group-focus-within:text-[#04a7bd]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        )}
                    </div>

                    {showUnitList && !initialData?.unidade_id && (
                        <div className="absolute z-30 w-full mt-2 bg-white dark:bg-[#2c2c2e] border border-gray-100 dark:border-white/5 rounded-xl shadow-lg max-h-48 overflow-y-auto custom-scrollbar">
                            {filteredUnits.length > 0 ? (
                                filteredUnits.map(u => (
                                    <button
                                        key={u.id}
                                        type="button"
                                        onClick={() => handleSelectUnit(u)}
                                        className="w-full text-left px-5 py-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-b border-gray-50 dark:border-white/5 last:border-0 text-sm text-gray-700 dark:text-white font-medium flex justify-between items-center"
                                    >
                                        {u.nome_unidade}
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-3 text-center text-gray-400 text-xs">
                                    Nenhuma unidade encontrada.
                                </div>
                            )}
                        </div>
                    )}
                    {/* Hidden validation input */}
                    <input type="text" className="sr-only" required value={appointmentData.unidade} onChange={() => {}} />
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Tipo</label>
                    <div className="relative">
                        <select
                            value={appointmentData.tipo}
                            onChange={(e) => setAppointmentData({...appointmentData, tipo: e.target.value})}
                            className="w-full h-12 px-4 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-4 focus:ring-[#04a7bd]/10 outline-none transition-all appearance-none text-gray-600 dark:text-white"
                        >
                            <option value="Admissional">Admissional</option>
                            <option value="Demissional">Demissional</option>
                            <option value="Periódico">Periódico</option>
                            <option value="Retorno">Retorno ao Trabalho</option>
                            <option value="Mudança">Mudança de Função</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                            <svg className="h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
                </div>
            </div>

            <div className="h-px bg-gray-100 dark:bg-white/5 w-full"></div>

            {/* Section: Exames */}
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h3 className="text-sm uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold">Exames a Realizar</h3>
                    <span className="text-xs text-[#04a7bd] font-bold bg-[#04a7bd]/10 px-3 py-1.5 rounded-lg">
                        {selectedExams.length} selecionado(s)
                    </span>
                </div>
                
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-gray-400 group-focus-within:text-[#04a7bd]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input 
                        type="text"
                        placeholder="Filtrar exames..."
                        value={examSearchTerm}
                        onChange={(e) => setExamSearchTerm(e.target.value)}
                        className="w-full h-12 pl-10 px-4 mb-4 rounded-xl bg-gray-50 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-4 focus:ring-[#04a7bd]/10 outline-none transition-all text-sm font-medium placeholder-gray-400 text-slate-800 dark:text-white"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar p-1">
                    {filteredExams.map((exame) => {
                        const isSelected = selectedExams.includes(exame.nome);
                        return (
                            <button
                                key={exame.id}
                                type="button"
                                onClick={() => toggleExam(exame.nome)}
                                className={`
                                    relative flex items-center p-3 rounded-xl border text-left transition-all duration-200 group
                                    ${isSelected 
                                        ? 'bg-[#04a7bd] text-white border-[#04a7bd] shadow-lg shadow-[#04a7bd]/30' 
                                        : 'bg-white dark:bg-white/5 hover:bg-gray-50 dark:hover:bg-white/10 text-gray-600 dark:text-slate-300 border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 hover:shadow-sm'
                                    }
                                `}
                            >
                                <div className={`
                                    w-5 h-5 rounded-full border mr-3 flex items-center justify-center flex-shrink-0 transition-colors
                                    ${isSelected ? 'border-white bg-white/20' : 'border-gray-300 dark:border-white/20 group-hover:border-[#04a7bd]'}
                                `}>
                                    {isSelected && (
                                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-sm font-medium leading-tight">{exame.nome}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="pt-6">
                <button
                type="submit"
                disabled={loading}
                className={`w-full h-14 rounded-2xl font-bold text-lg shadow-xl hover:shadow-2xl transition-all transform active:scale-[0.98] flex items-center justify-center gap-2
                    ${loading ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'bg-[#04a7bd] hover:bg-[#149890] text-white shadow-[#04a7bd]/30'}`}
                >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    </>
                ) : (
                    'Confirmar Agendamento'
                )}
                </button>
            </div>
            </form>
          </div>

      {/* --- Notification Modals (Rendered here) --- */}
      
      {/* 1. Notify Yes/No */}
      {showNotifyModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#2c2c2e] rounded-[24px] p-6 max-w-sm w-full shadow-2xl scale-100 border border-white dark:border-white/5">
                <div className="w-12 h-12 rounded-full bg-[#04a7bd]/10 flex items-center justify-center text-[#04a7bd] mb-4 mx-auto">
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Enviar notificação?</h3>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-6 text-sm">Deseja enviar uma mensagem de confirmação para a empresa via WhatsApp?</p>
                <div className="flex gap-3">
                    <button onClick={handleNotifyNo} className="flex-1 py-3 font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl transition-colors">
                        Não
                    </button>
                    <button onClick={handleNotifyYes} className="flex-1 py-3 font-semibold text-white bg-[#04a7bd] hover:bg-[#149890] rounded-xl transition-colors shadow-lg shadow-[#04a7bd]/30">
                        Sim
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 2. Contact Selection */}
      {showContactListModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#2c2c2e] rounded-[24px] p-6 max-w-md w-full shadow-2xl h-[600px] flex flex-col border border-white dark:border-white/5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">Selecione o Contato</h3>
                    <button onClick={() => { setShowContactListModal(false); resetForm(); if(onClose) onClose(); }} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Search for Contacts */}
                <input 
                    type="text"
                    placeholder="Buscar contato..."
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl bg-slate-100 dark:bg-white/5 border-transparent focus:bg-white dark:focus:bg-black focus:border-[#04a7bd] focus:ring-4 focus:ring-[#04a7bd]/10 outline-none transition-all text-slate-800 dark:text-white mb-4"
                />

                <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                    {filteredContacts.map(contact => (
                        <button
                            key={contact.chatname}
                            onClick={() => handleContactSelect(contact)}
                            className="w-full p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors border border-slate-100 dark:border-white/5 group text-left"
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-white/10 overflow-hidden flex-shrink-0">
                                {contact.senderphoto ? (
                                    <img src={contact.senderphoto} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500 dark:text-slate-300 font-bold">
                                        {contact.chatname.charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="font-bold text-slate-900 dark:text-white group-hover:text-[#04a7bd] transition-colors truncate">{contact.chatname}</p>
                                <p className="text-xs text-slate-400 dark:text-slate-500 font-mono truncate">{contact.phone}</p>
                            </div>
                        </button>
                    ))}
                    {filteredContacts.length === 0 && (
                        <div className="text-center text-slate-400 py-8">
                            {contactSearchQuery.trim() ? 'Nenhum contato encontrado.' : 'Digite para pesquisar...'}
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* 3. Confirm Send */}
      {showConfirmSendModal && selectedContact && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#2c2c2e] rounded-[24px] p-6 max-w-sm w-full shadow-2xl border border-white dark:border-white/5">
                 <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-500/10 flex items-center justify-center text-green-600 dark:text-green-400 mb-4 mx-auto text-2xl shadow-inner">
                    📲
                </div>
                <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white mb-2">Enviar Confirmação</h3>
                <p className="text-center text-slate-500 dark:text-slate-400 mb-6 text-sm">
                    Enviar mensagem automática para <span className="font-bold text-slate-800 dark:text-white">{selectedContact.chatname}</span>?
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={() => { setShowConfirmSendModal(false); resetForm(); if(onClose) onClose(); }} 
                        className="flex-1 py-3 font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:hover:bg-white/20 rounded-xl transition-colors"
                        disabled={sendingMsg}
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={handleSendMessage} 
                        className="flex-1 py-3 font-semibold text-white bg-green-500 hover:bg-green-600 rounded-xl transition-colors shadow-lg shadow-green-500/30 flex items-center justify-center gap-2"
                        disabled={sendingMsg}
                    >
                        {sendingMsg ? (
                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        ) : 'Enviar'}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* 4. Public Success Modal */}
      {showPublicSuccessModal && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fadeIn">
            <div className="bg-white dark:bg-[#2c2c2e] rounded-[24px] p-8 max-w-sm w-full shadow-2xl text-center border border-white dark:border-white/5 animate-scaleIn">
                <div className="w-20 h-20 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                </div>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Agendamento Confirmado!</h3>
                <p className="text-slate-500 dark:text-slate-400 mb-8">
                    Seu pré-agendamento foi realizado com sucesso. Aguarde a confirmação da clínica.
                </p>
                <button 
                    onClick={() => { setShowPublicSuccessModal(false); window.location.reload(); }} // Simple reload to clear/reset public view
                    className="w-full py-3.5 font-bold text-white bg-green-500 hover:bg-green-600 rounded-[18px] shadow-lg shadow-green-500/30 transition-all active:scale-95"
                >
                    Fechar
                </button>
            </div>
          </div>
      )}

      </div>
    </div>,
    document.body
  );
};
