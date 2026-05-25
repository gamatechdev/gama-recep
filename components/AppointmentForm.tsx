
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Colaborador, Unidade, Agendamento } from '../types';
// Importação de componentes de UI reutilizáveis
import { Button } from './Button';
import { SearchableSelect } from './ui/SearchableSelect';
import { toast } from 'sonner';
// Importação de ícones do Lucide React para melhorar a UI, incluindo o ícone de copiar
import { ChevronDown, ImageIcon, Plus, Check, Trash2, Download, X, File, Loader2, Search, Copy } from 'lucide-react';
// Importa o mapeamento entre exames e formulários do arquivo de configuração
import { EXAM_TO_FORMULARIO_MAP } from '../constants/formularioMap';
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
  { "idx": 51, "id": 498, "nome": "Grupo Sanguíneo" },
  { "idx": 52, "id": 499, "nome": "Escala de Epworth" }
];

const FORMULARIOS_OPTIONS = [
  { label: "Ficha Clínica", value: "FICHA_CLINICA" },
  { label: "Prontuário Médico", value: "PRONTUARIO_MEDICO" },
  { label: "Audiometria", value: "AUDIOMETRIA" },
  { label: "Acuidade Visual", value: "ACUIDADE_VISUAL" },
  { label: "Avaliação Psicossocial", value: "AVALIACAO_PSICOSSOCIAL_SIMPLES" },
  { label: "Questionário de Epilepsia", value: "QUESTIONARIO_EPILEPSIA" },
  { label: "Avaliação Vocal", value: "AVALIACAO_VOCAL" },
  { label: "Teste Romberg", value: "TESTE_ROMBERG" },
  { label: "Escala de Epworth", value: "EPWORTH" }
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
      {showList && (
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
  // Define o estado para controlar se a data de nascimento foi copiada para exibir feedback visual
  const [copiedNascimento, setCopiedNascimento] = useState(false);
  // Define o estado para controlar se a data do atendimento foi copiada para exibir feedback visual
  const [copiedAtendimento, setCopiedAtendimento] = useState(false);

  // Processa e converte as datas coladas em diversos formatos comuns para o formato ISO yyyy-MM-dd
  const handlePasteDate = (e: React.ClipboardEvent<HTMLInputElement>, setValue: (val: string) => void) => {
    // Recupera o valor de texto copiado na área de transferência e limpa espaços adicionais
    const pastedText = e.clipboardData.getData('text').trim();
    // Regex para validar formato brasileiro com separadores barra, traço ou ponto (dd/MM/yyyy)
    const regexBR = /^(\d{2})[/\-.](\d{2})[/\-.](\d{4})$/;
    // Regex para validar formato brasileiro sem separadores, contendo apenas os 8 dígitos (ddMMyyyy)
    const regexBRDigits = /^(\d{2})(\d{2})(\d{4})$/;
    // Regex para validar o formato de data padrão HTML/ISO (yyyy-MM-dd)
    const regexISO = /^(\d{4})-(\d{2})-(\d{2})$/;
    // Variável que armazenará a data final convertida
    let formattedDate = '';
    // Condição para converter formato brasileiro tradicional com separadores
    if (regexBR.test(pastedText)) {
      // Divide e obtém o dia, mês e ano capturados na regex
      const [, day, month, year] = pastedText.match(regexBR) || [];
      // Reordena para montar a data no formato esperado pelo input (yyyy-MM-dd)
      formattedDate = `${year}-${month}-${day}`;
    // Condição para converter formato brasileiro apenas com dígitos
    } else if (regexBRDigits.test(pastedText)) {
      // Divide e obtém o dia, mês e ano capturados a partir dos dígitos sequenciais
      const [, day, month, year] = pastedText.match(regexBRDigits) || [];
      // Reordena para montar a data no formato esperado pelo input (yyyy-MM-dd)
      formattedDate = `${year}-${month}-${day}`;
    // Condição para caso a data colada já esteja no formato esperado ISO
    } else if (regexISO.test(pastedText)) {
      // Atribui diretamente a data de origem por já estar no formato padrão
      formattedDate = pastedText;
    }
    // Verifica se a conversão resultou em uma string de data válida
    if (formattedDate) {
      // Evita o comportamento de colagem padrão para que não ocorra dupla inserção ou erro
      e.preventDefault();
      // Atualiza o estado da data correspondente usando a função de callback
      setValue(formattedDate);
    }
  };

  // Copia a data convertida no formato BR amigável para a área de transferência do usuário
  const copyToClipboard = (value: string, setCopiedState: (val: boolean) => void) => {
    // Interrompe o processo se o campo correspondente não possuir nenhum valor
    if (!value) return;
    // Divide o valor do input em partes (ano, mês e dia)
    const parts = value.split('-');
    // Reconstrói no padrão brasileiro se estiver completa, caso contrário preserva o valor atual
    const formatted = parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
    // Tenta gravar o texto formatado na área de transferência do dispositivo do usuário
    navigator.clipboard.writeText(formatted).then(() => {
      // Modifica o estado para exibir o feedback visual de sucesso da cópia
      setCopiedState(true);
      // Exibe uma notificação do tipo toast avisando ao usuário que a cópia foi realizada
      toast.success("Data copiada para a área de transferência!");
      // Agenda para restaurar o estado após 2 segundos, ocultando o feedback visual de sucesso
      setTimeout(() => setCopiedState(false), 2000);
    }).catch(() => {
      // Exibe uma notificação de erro caso ocorra falha na gravação do clipboard
      toast.error("Erro ao copiar a data.");
    });
  };
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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // New Company (Unit) Modal State
  const [showNewCompanyModal, setShowNewCompanyModal] = useState(false);
  const [newCompanyName, setNewCompanyName] = useState('');
  const [clientsList, setClientsList] = useState<OptionItem[]>([]);
  const [selectedClientName, setSelectedClientName] = useState('');
  const [newCompanyType, setNewCompanyType] = useState<'empresa' | 'unidade'>('unidade');
  const [selectedClientId, setSelectedClientId] = useState<string | number | null>(null);

  // Error Modal State
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');

  // Exam Selection State
  const [selectedExams, setSelectedExams] = useState<string[]>([]);
  const [examSearchTerm, setExamSearchTerm] = useState('');

  // New Fields: Forms and Observations
  // Define o estado inicial da lista de formulários selecionados como vazia
  const [selectedFormularios, setSelectedFormularios] = useState<string[]>([]);
  const [obsClinica, setObsClinica] = useState('');
  const [obsLaboratorial, setObsLaboratorial] = useState('');
  const [asoQtdCobrar, setAsoQtdCobrar] = useState(0);
  const [racQtdCobrar, setRacQtdCobrar] = useState(0);

  const [selectedSetorName, setSelectedSetorName] = useState('');
  const [selectedSetorId, setSelectedSetorId] = useState<number | null>(null);
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
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [showNewContactModal, setShowNewContactModal] = useState(false);
  const [newContactData, setNewContactData] = useState({ chatname: '', phone: '' });
  const [hasMoreContacts, setHasMoreContacts] = useState(true);

  // --- Delete Modal State ---
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const isPrefeitura = unitSearchTerm === "Prefeitura/ Estado";

  useEffect(() => {
    fetchInitialData();
    fetchCurrentUser();
  }, []);

  // Auto-search in database if local search has no results
  useEffect(() => {
    if (!showContactListModal || !contactSearchTerm.trim() || contactSearchTerm.length < 3) return;

    // Check if we have results locally
    const searchTerm = contactSearchTerm.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const localResults = contactsList.filter(contact => {
      const chatName = (contact.chatname || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
      const phone = (contact.phone || "").replace(/\D/g, "");
      const searchDigits = contactSearchTerm.replace(/\D/g, "");
      return chatName.includes(searchTerm) || (searchDigits !== "" && phone.includes(searchDigits));
    });

    if (localResults.length === 0 && !loadingContacts) {
      const timer = setTimeout(() => {
        searchAllContacts();
      }, 600); // 600ms debounce to avoid spamming
      return () => clearTimeout(timer);
    }
  }, [contactSearchTerm, showContactListModal, contactsList.length]);

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

      if ((initialAppointment as any).observacoes_laboratorial) {
        setObsLaboratorial((initialAppointment as any).observacoes_laboratorial);
      }

      if (initialAppointment.prioridade) {
        setPrioridade(initialAppointment.prioridade);
      }

      if ((initialAppointment as any).foto_obs) {
        setCurrentImageUrl((initialAppointment as any).foto_obs);
      }

      if ((initialAppointment as any).formularios_snapshot && (initialAppointment as any).formularios_snapshot.length > 0) {
        // Agendamento interno: carrega os formulários salvos normalmente
        setSelectedFormularios((initialAppointment as any).formularios_snapshot);
      } else if (initialAppointment.exames_snapshot && initialAppointment.exames_snapshot.length > 0) {
        // Agendamento externo (ex: Gama Clientes): deriva os formulários a partir dos exames
        // mapeando cada exame para seu formulário correspondente
        const formulariosDerived = initialAppointment.exames_snapshot
          .map((exame: string) => EXAM_TO_FORMULARIO_MAP[exame]) // Busca o formulário correspondente
          .filter(Boolean); // Remove os exames sem mapeamento (undefined)

        // Garante que não haja valores duplicados na lista de formulários derivados
        setSelectedFormularios([...new Set(formulariosDerived)]);
      }

      if (initialAppointment.valor && initialAppointment.valor > 0) {
        setValorAvulso(initialAppointment.valor.toString());
      }

      // Load obsClinica if present in initialAppointment
      if ((initialAppointment as any).observacoes) {
        setObsClinica((initialAppointment as any).observacoes);
      }

      if (initialAppointment.aso_qtd_cobrar !== undefined) setAsoQtdCobrar(initialAppointment.aso_qtd_cobrar);
      if (initialAppointment.rac_qtd_cobrar !== undefined) setRacQtdCobrar(initialAppointment.rac_qtd_cobrar);

      if (initialAppointment.prontuario_id) {
        setSelectedFormularios(initialAppointment.prontuario_id);
      }

     fetchCollaboratorDetails(
      initialAppointment.colaborador_id,
      // Prioriza o cargo/funcao vindo do proprio agendamento, o que também cobre agendamentos externos ("AGENDADO VIA SISTEMA")
      // Depois tenta puxar do join (cargos?.nome)
      // Em nenhuma hipótese deve puxar o nome do setor como substituto de cargo
      (initialAppointment as any).cargo ||
      (initialAppointment as any).funcao ||
      (initialAppointment as any).colaboradores?.cargos?.nome ||
      undefined
    );
    }
  }, [initialAppointment]);

  const fetchCollaboratorDetails = async (id: string,funcaoOverride?: string) => {
    const { data, error } = await supabase
      .from('colaboradores')
      .select(`*, cargos ( nome ), setor_ref:setorid ( nome )`)
      .eq('id', id)
      .single();

    if (data) {
      handleSelectColab(data as Colaborador,funcaoOverride);
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
    const { data: colabs } = await supabase.from('colaboradores').select('id, nome, cpf, data_nascimento, sexo, setor, cargo, setorid');
    const { data: units } = await supabase.from('unidades').select('id, nome_unidade');
    const { data: setores } = await supabase.from('setor').select('id, nome');
    const { data: cargos } = await supabase.from('cargos').select('id, nome');

    if (colabs) setColaboradores(colabs);
    if (units) setUnidades(units);
    if (setores) setSetoresList(setores.map(s => ({ id: s.id, label: s.nome })));
    if (cargos) setCargosList(cargos.map(c => ({ id: c.id, label: c.nome })));
  };

  const toggleExam = (examName: string) => {
    // Verifica se existe um formulário de prontuário mapeado para este exame
    const formularioAssociado = EXAM_TO_FORMULARIO_MAP[examName];

    if (selectedExams.includes(examName)) {
      // Remove o exame da lista de exames selecionados
      setSelectedExams(prev => prev.filter(e => e !== examName));

      // Se houver formulário associado, remove-o também da seleção
      if (formularioAssociado) {
        setSelectedFormularios(prev => prev.filter(f => f !== formularioAssociado));
      }
    } else {
      // Adiciona o exame à lista de exames selecionados
      setSelectedExams(prev => [...prev, examName]);

      // Se houver formulário associado e ainda não estiver marcado, adiciona-o
      if (formularioAssociado && !selectedFormularios.includes(formularioAssociado)) {
        setSelectedFormularios(prev => [...prev, formularioAssociado]);
      }
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const removeImage = () => {
    setImageFile(null);
    setImagePreview('');
    setCurrentImageUrl('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Define a função que alterna a seleção manual de formulários de prontuário e sincroniza com os exames
  const toggleFormulario = (formValue: string) => {
    // Busca na constante de mapeamento quais exames resultam neste formulário específico
    const examesAssociados = Object.keys(EXAM_TO_FORMULARIO_MAP).filter(
      exam => EXAM_TO_FORMULARIO_MAP[exam] === formValue
    );

    // Verifica se o formulário correspondente já está na lista dos selecionados
    if (selectedFormularios.includes(formValue)) {
      // Remove o formulário da seleção caso já estivesse marcado
      setSelectedFormularios(selectedFormularios.filter(f => f !== formValue));
      // Se houver exames associados a esse formulário, remove-os da lista de exames também
      setSelectedExams(prev => prev.filter(e => !examesAssociados.includes(e)));
    } else {
      // Insere o formulário na lista dos selecionados caso não estivesse marcado
      setSelectedFormularios([...selectedFormularios, formValue]);
      // Se houver exames associados a esse formulário, adiciona-os à lista de exames automaticamente
      setSelectedExams(prev => [...new Set([...prev, ...examesAssociados])]);
    }
  };

  const handleSelectColab = async (colab: any,funcaoOverride?: string) => {
    setSelectedColabId(colab.id);

    // Resolve Setor Name and ID
    if (colab.setor_ref) {
      setSelectedSetorName(colab.setor_ref.nome);
      setSelectedSetorId(colab.setorid);
    } else if (colab.setorid) {
      const { data } = await supabase.from('setor').select('nome').eq('id', colab.setorid).maybeSingle();
      if (data) {
        setSelectedSetorName(data.nome);
        setSelectedSetorId(colab.setorid);
      } else {
        setSelectedSetorName('');
        setSelectedSetorId(null);
      }
    } else {
      setSelectedSetorName('');
      setSelectedSetorId(null);
    }

    setColabFormData({
      nome: colab.nome,
      cpf: colab.cpf,
      data_nascimento: colab.data_nascimento,
      sexo: colab.sexo || 'M',
      setor: colab.setor || '',
      // Se funcaoOverride for definido, o agendamento veio de um sistema externo (ex: Gama Clientes)
      // → usa somente o cargo do payload, NUNCA o nome do setor como substituto
      // Se funcaoOverride for undefined, o agendamento é interno (Gama Recep)
      // → usa o comportamento original, com fallback para setor caso não haja cargo/funcao
      funcao: funcaoOverride !== undefined
        ? funcaoOverride
        : (colab.cargos?.nome || colab.funcao || colab.setor || colab.setor_ref?.nome || '')
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
    // 1. Validate if unit name is provided
    if (!newCompanyName.trim()) {
      setErrorModalMessage("Informe o nome da unidade.");
      setShowErrorModal(true);
      return;
    }

    setLoading(true);
    try {
      let finalClientId = selectedClientId;

      // Se for do tipo Empresa, primeiro criamos o registro na tabela clientes
      if (newCompanyType === 'empresa') {
        const { data: clientData, error: clientError } = await supabase
          .from('clientes')
          .insert({ nome_fantasia: newCompanyName.trim() })
          .select('id').single();

        if (clientError) throw clientError;
        finalClientId = clientData.id;
      } else {
        // Se for do tipo Unidade, precisamos de um cliente selecionado
        if (!finalClientId && selectedClientName.trim()) {
          const found = clientsList.find(c => c.label.toLowerCase() === selectedClientName.trim().toLowerCase());
          if (found) finalClientId = found.id;
        }

        if (!finalClientId) {
          throw new Error("Selecione um cliente (Matriz) para continuar.");
        }
      }

      // Agora criamos a unidade vinculada ao cliente (novo ou existente)
      const { data: unitData, error: unitError } = await supabase
        .from('unidades')
        .insert({ nome_unidade: newCompanyName.trim(), empresaid: finalClientId })
        .select('id, nome_unidade').single();

      if (unitError) throw unitError;

      if (unitData) {
        setUnidades(prev => [...prev, unitData]);
        setAppointmentData(prev => ({ ...prev, unidade: unitData.id.toString() }));
        setUnitSearchTerm(unitData.nome_unidade);
        setShowNewCompanyModal(false);
        setNewCompanyName('');
        setSelectedClientId(null);
        setSelectedClientName('');
        setMessage({ type: 'success', text: 'Cadastrado com sucesso!' });
      }
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const clearFields = () => {
    setColabFormData({ nome: '', cpf: '', data_nascimento: '', sexo: 'M', setor: '', funcao: '' });
    setSelectedExams([]);
    // Limpa a lista de formulários selecionados deixando-a vazia
    setSelectedFormularios([]);
    setObsClinica(''); setObsLaboratorial(''); setSelectedColabId('');
    setColabSearchTerm(''); setUnitSearchTerm('');
    setAppointmentData(prev => ({ ...prev, unidade: '' }));
    setObsAgendamento(''); setPrioridade(false);
    setImageFile(null); setCurrentImageUrl(''); setImagePreview('');
    setSelectedSetorName('');
    setSelectedSetorId(null);
    setIsAvulso(false); setValorAvulso(''); setMetodoPagamento('Pix'); setOutroMetodoPagamento('');
    setSavedContext(null);
    setAsoQtdCobrar(0);
    setRacQtdCobrar(0);
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
      if (count === 0) toast.error("Erro ao excluir.");
      else if (onCancel) onCancel();

    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
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
    console.log("--- INICIANDO GERAÇÃO DE PDF ---");
    console.log("Payload:", payload);
    toast.info("Iniciando geração de PDF na API local...");
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
      toast.error("Erro ao conectar com a API local (Porta 3002). Verifique se o terminal está rodando.");
      return null;
    }
  };

  // --- Notification Logic ---
  const PAGE_SIZE = 300;

  const handleNotifyYes = async () => {
    setShowNotifyModal(false);
    setShowContactListModal(true);
    setLoadingContacts(true);
    setHasMoreContacts(true);
    setContactsList([]);

    try {
      const { data: contacts, error } = await supabase
        .from('chat_tags')
        .select('*')
        .order('chatname')
        .range(0, PAGE_SIZE - 1);

      if (error) throw error;

      if (contacts && contacts.length > 0) {
        setContactsList(contacts);
        setContactSearchTerm('');
        if (contacts.length < PAGE_SIZE) setHasMoreContacts(false);
      } else {
        toast.error("Nenhum contato encontrado.");
        setShowContactListModal(false);
        handleCancelAndExit();
      }
    } catch (e: any) {
      toast.error("Erro ao buscar contatos: " + e.message);
      handleCancelAndExit();
    } finally {
      setLoadingContacts(false);
    }
  };

  const loadMoreContacts = async () => {
    if (loadingContacts || !hasMoreContacts) return;
    setLoadingContacts(true);

    try {
      const from = contactsList.length;
      const to = from + PAGE_SIZE - 1;

      const { data: nextContacts, error } = await supabase
        .from('chat_tags')
        .select('*')
        .order('chatname')
        .range(from, to);

      if (error) throw error;

      if (nextContacts && nextContacts.length > 0) {
        setContactsList(prev => [...prev, ...nextContacts]);
        if (nextContacts.length < PAGE_SIZE) setHasMoreContacts(false);
      } else {
        setHasMoreContacts(false);
      }
    } catch (e: any) {
      console.error("Erro ao carregar mais contatos:", e.message);
    } finally {
      setLoadingContacts(false);
    }
  };

  const searchAllContacts = async () => {
    if (!contactSearchTerm.trim()) return;
    setLoadingContacts(true);

    try {
      // Busca global usando ilike (case-insensitive) na base de dados
      const { data, error } = await supabase
        .from('chat_tags')
        .select('*')
        .or(`chatname.ilike.%${contactSearchTerm}%,phone.ilike.%${contactSearchTerm}%`)
        .order('chatname')
        .limit(300);

      if (error) throw error;

      if (data && data.length > 0) {
        // Mescla com a lista atual, evitando duplicatas por telefone
        setContactsList(prev => {
          const existingPhones = new Set(prev.map(c => c.phone));
          const newOnes = data.filter(c => !existingPhones.has(c.phone));
          return [...prev, ...newOnes];
        });
      } else {
        toast.error("Nenhum contato encontrado na base de dados.");
      }
    } catch (e: any) {
      console.error("Erro na busca global:", e.message);
      toast.error("Erro ao buscar na base: " + e.message);
    } finally {
      setLoadingContacts(false);
    }
  };

  const handleSaveNewContact = async () => {
    if (!newContactData.chatname.trim() || !newContactData.phone.trim()) {
      toast.error("Informe nome e telefone.");
      return;
    }

    setLoadingContacts(true);
    try {
      // Clean phone: keep only digits
      let digits = newContactData.phone.replace(/\D/g, '');

      // Auto-prepend Brazil country code if missing (standard 10 or 11 digit numbers)
      if ((digits.length === 11 || digits.length === 10) && !digits.startsWith('55')) {
        digits = '55' + digits;
      }

      const { data, error } = await supabase
        .from('chat_tags')
        .insert({
          chatname: newContactData.chatname.trim(),
          phone: digits,
          tag: 1 // Default tag
        })
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setContactsList(prev => [data as ChatTag, ...prev]);
        handleContactSelect(data as ChatTag);
        setShowNewContactModal(false);
        setNewContactData({ chatname: '', phone: '' });
        toast.success("Contato salvo!");
      }
    } catch (e: any) {
      toast.error("Erro ao salvar: " + e.message);
    } finally {
      setLoadingContacts(false);
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
      toast.success("Notificação enviada com sucesso!");
    } catch (e) {
      toast.error("Erro ao enviar mensagem.");
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

      // Sector logic: if it's a new name (no ID), create it first
      let finalSetorId = selectedSetorId;
      if (!finalSetorId && selectedSetorName.trim()) {
        const { data: existingSetor } = await supabase.from('setor').select('id').ilike('nome', selectedSetorName.trim()).maybeSingle();
        if (existingSetor) {
          finalSetorId = existingSetor.id;
        } else {
          const { data: newSetor, error: sErr } = await supabase.from('setor').insert({ nome: selectedSetorName.trim() }).select().single();
          if (sErr) throw sErr;
          finalSetorId = newSetor.id;
        }
      }

      const colabPayload = {
        nome: colabFormData.nome,
        cpf: colabFormData.cpf,
        data_nascimento: colabFormData.data_nascimento,
        sexo: colabFormData.sexo,
        setor: colabFormData.funcao, // Salvando o texto da Função na coluna Setor
        setorid: finalSetorId, // Vinculando ao ID do setor (novo ou existente)
        unidade: unitId,
        cargo: null // Não estamos mais usando a tabela auxiliar de cargos
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

      // Monta o payload que será enviado para a API de geração de PDF
      const pdfPayloadDebug = {
        agendamentoId: generateRandomId(23),
        empresa: selectedUnidade?.nome_unidade || "Matriz",
        nome: colabFormData.nome,
        dataExame: appointmentData.data_atendimento,
        funcao: colabFormData.funcao || "Não informado",
        cpf: colabFormData.cpf,
        dataNascimento: colabFormData.data_nascimento,
        sexo: colabFormData.sexo,
        tipoExame: appointmentData.tipo,
        setor: selectedSetorName || "Operacional",
        tipo_exame: [appointmentData.tipo],
        exames_requisitados: examsForPdf,
        observacoesClinica: obsClinica,
        observacoesLaboratorial: obsLaboratorial,
        formularios: selectedFormularios
      };
      // Log detalhado do payload enviado para a API de geração de PDF (JSON expandido)
      console.log("\n========== PAYLOAD GERAÇÃO DE PDF ==========");
      console.log(JSON.stringify(pdfPayloadDebug, null, 2));
      console.log("=============================================\n");

      // Usa o payload já montado acima para garantir que o log corresponde ao envio real
      const generatedUrl = await generatePDF(pdfPayloadDebug);

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

      // --- Lógica de Upload de Imagem ---
      let finalFotoObs = currentImageUrl;
      if (imageFile) {
        // Gera um nome único para o arquivo
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `foto_obs/${fileName}`;

        // Faz o upload para o bucket 'documents'
        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // Obtém a URL pública da imagem salva
        const { data: { publicUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
        
        finalFotoObs = publicUrl;
      }

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
          observacoes_laboratorial: obsLaboratorial || null,
          aso_qtd_cobrar: asoQtdCobrar,
          rac_qtd_cobrar: racQtdCobrar,
          prontuario_id: selectedFormularios,
          foto_obs: finalFotoObs || null,
          // Salas recalculadas automaticamente baseado nos exames selecionados
          ...salasCalculadas,
        };

        // Log detalhado do payload de atualização do agendamento (JSON expandido)
        console.log("\n========== PAYLOAD ATUALIZAÇÃO AGENDAMENTO (SUPABASE) ==========");
        console.log(JSON.stringify(updatePayload, null, 2));
        console.log("================================================================\n");

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
          observacoes_laboratorial: obsLaboratorial || null,
          compareceu: false,
          status: 'pendente',
          recepcao: 'Aguardando',
          aso_qtd_cobrar: asoQtdCobrar,
          rac_qtd_cobrar: racQtdCobrar,
          prontuario_id: selectedFormularios,
          foto_obs: finalFotoObs || null,
          // Salas calculadas automaticamente baseado nos exames selecionados
          ...salasCalculadas,
        };

        // Log detalhado do payload de inserção do novo agendamento (JSON expandido)
        console.log("\n========== PAYLOAD INSERÇÃO NOVO AGENDAMENTO (SUPABASE) ==========");
        console.log(JSON.stringify(insertPayload, null, 2));
        console.log("=================================================================\n");

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
    if (!contactSearchTerm.trim()) return true;

    const searchTerm = contactSearchTerm.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const chatName = (contact.chatname || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    // const name = (contact.name || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const phone = (contact.phone || "").replace(/\D/g, "");
    const searchDigits = contactSearchTerm.replace(/\D/g, "");

    return chatName.includes(searchTerm) || (searchDigits !== "" && phone.includes(searchDigits));
  });

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formatted = digits;
    if (digits.length <= 11) {
      formatted = digits.replace(/^(\d{2})(\d)/g, '($1) $2');
      formatted = formatted.replace(/(\d{5})(\d)/, '$1-$2');
    }
    return formatted.substring(0, 15);
  };

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
                <div>
                  {/* Rótulo descritivo do campo de data de nascimento */}
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Nascimento</label>
                  {/* Container posicionado de forma relativa para acomodar o botão de cópia dentro do input */}
                  <div className="relative flex items-center">
                    {/* Input do tipo data para data de nascimento */}
                    <input
                      type="date"
                      required
                      value={colabFormData.data_nascimento}
                      // Atualiza a propriedade data_nascimento do formulário ao digitar ou selecionar manualmente
                      onChange={e => setColabFormData({ ...colabFormData, data_nascimento: e.target.value })}
                      // Intercepta o evento de colagem do teclado ou mouse para formatar a data corretamente
                      onPaste={(e) => handlePasteDate(e, (val) => setColabFormData({ ...colabFormData, data_nascimento: val }))}
                      // Classe css para espaçamento correto, incluindo padding extra à direita para o botão
                      className="w-full h-12 pl-4 pr-12 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none transition-all text-gray-800"
                    />
                    {/* Renderiza o botão apenas se houver uma data de nascimento válida preenchida */}
                    {colabFormData.data_nascimento && (
                      <button
                        type="button"
                        // Executa a cópia da data para a área de transferência ao clicar
                        onClick={() => copyToClipboard(colabFormData.data_nascimento, setCopiedNascimento)}
                        // Alinha o botão absolutamente na lateral direita interna do container
                        className="absolute right-3 p-1.5 rounded-lg text-gray-400 hover:text-ios-primary hover:bg-gray-100 transition-colors"
                        title="Copiar data"
                      >
                        {/* Exibe o ícone correspondente ao status da cópia (Check ou Copy) */}
                        {copiedNascimento ? (
                          // Ícone de check de sucesso na cor verde
                          <Check size={16} className="text-green-500" />
                        ) : (
                          // Ícone de copiar padrão
                          <Copy size={16} />
                        )}
                      </button>
                    )}
                  </div>
                </div>
                <div><label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Sexo</label><select required value={colabFormData.sexo} onChange={e => setColabFormData({ ...colabFormData, sexo: e.target.value })} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none"><option value="M">Masculino</option><option value="F">Feminino</option></select></div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Função</label>
                  <input
                    type="text"
                    value={colabFormData.funcao}
                    onChange={e => setColabFormData({ ...colabFormData, funcao: e.target.value })}
                    className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none transition-all"
                    placeholder="Digite a função..."
                  />
                </div>
                <div>
                  <SearchableSelect
                    label="Setor"
                    value={selectedSetorName}
                    options={setoresList}
                    placeholder="Pesquisar ou digite setor..."
                    onSelect={(val) => {
                      setSelectedSetorName(val);
                      const found = setoresList.find(s => s.label === val);
                      setSelectedSetorId(found ? (found.id as number) : null);
                    }}
                    addNewLabel="+ Usar como novo Setor"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="h-px bg-gray-100 w-full"></div>

          <div className="space-y-6">
            <h3 className="text-sm uppercase tracking-wider text-ios-subtext font-bold border-b border-gray-100 pb-2">Detalhes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                {/* Rótulo descritivo do campo de data de atendimento */}
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Data</label>
                {/* Container posicionado de forma relativa para acomodar o botão de cópia dentro do input */}
                <div className="relative flex items-center">
                  {/* Input do tipo data para data de atendimento */}
                  <input
                    type="date"
                    required
                    value={appointmentData.data_atendimento}
                    // Atualiza a propriedade data_atendimento do agendamento ao digitar ou selecionar manualmente
                    onChange={e => setAppointmentData({ ...appointmentData, data_atendimento: e.target.value })}
                    // Intercepta o evento de colagem do teclado ou mouse para formatar a data corretamente
                    onPaste={(e) => handlePasteDate(e, (val) => setAppointmentData({ ...appointmentData, data_atendimento: val }))}
                    // Classe css para espaçamento correto, incluindo padding extra à direita para o botão
                    className="w-full h-12 pl-4 pr-12 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none transition-all text-gray-800"
                  />
                  {/* Renderiza o botão apenas se houver uma data de atendimento válida preenchida */}
                  {appointmentData.data_atendimento && (
                    <button
                      type="button"
                      // Executa a cópia da data para a área de transferência ao clicar
                      onClick={() => copyToClipboard(appointmentData.data_atendimento, setCopiedAtendimento)}
                      // Alinha o botão absolutamente na lateral direita interna do container
                      className="absolute right-3 p-1.5 rounded-lg text-gray-400 hover:text-ios-primary hover:bg-gray-100 transition-colors"
                      title="Copiar data"
                    >
                      {/* Exibe o ícone correspondente ao status da cópia (Check ou Copy) */}
                      {copiedAtendimento ? (
                        // Ícone de check de sucesso na cor verde
                        <Check size={16} className="text-green-500" />
                      ) : (
                        // Ícone de copiar padrão
                        <Copy size={16} />
                      )}
                    </button>
                  )}
                </div>
              </div>
              <div>
                {!isAvulso ? (
                  <>
                    <SearchableSelect
                      label="Empresa / Unidade"
                      value={unitSearchTerm}
                      onSelect={handleSelectUnit}
                      options={unitOptions}
                      required={!isAvulso}
                      onAddNew={async (val) => {
                        setNewCompanyName(val || "");
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">ASO's a cobrar</label>
                <input type="number" min="0" value={asoQtdCobrar} onChange={e => setAsoQtdCobrar(parseInt(e.target.value) || 0)} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">RAC a cobrar</label>
                <input type="number" min="0" value={racQtdCobrar} onChange={e => setRacQtdCobrar(parseInt(e.target.value) || 0)} className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white outline-none" />
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-6">
              <div className="w-full">
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Obs. Agendamento</label>
                <div className="flex items-start gap-2">
                  <textarea rows={2} value={obsAgendamento} onChange={(e) => setObsAgendamento(e.target.value)} className="w-full p-4 rounded-xl bg-yellow-50 border-transparent focus:bg-white outline-none resize-none" />
                  <div className="flex flex-col items-center gap-2 mt-1">
                    <button type="button" onClick={() => fileInputRef.current?.click()} className="w-12 h-12 flex-shrink-0 bg-yellow-50 hover:bg-yellow-100 text-yellow-600 rounded-xl flex items-center justify-center transition-colors relative" title="Anexar Imagem">
                      <ImageIcon size={20} />
                      {(imagePreview || currentImageUrl) && (
                        <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full border-2 border-white p-0.5">
                          <Check size={10} className="text-white" strokeWidth={4} />
                        </div>
                      )}
                    </button>
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  </div>
                </div>
                {(imagePreview || currentImageUrl) && (
                  <div className="mt-2 relative inline-block">
                    <img src={imagePreview || currentImageUrl} alt="Anexo" className="h-20 w-20 object-cover rounded-lg border border-gray-200 shadow-sm" />
                    <button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 shadow-md">
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
              <div className="md:w-64"><label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1">Prioridade</label><div onClick={() => setPrioridade(!prioridade)} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer ${prioridade ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-transparent'}`}><div className={`w-6 h-6 rounded-md border flex items-center justify-center ${prioridade ? 'bg-red-500 border-red-500' : 'bg-white border-gray-300'}`}>{prioridade && <span className="text-white font-bold">✓</span>}</div><span className="text-sm font-bold text-gray-500">Marcar Prioridade</span></div></div>
            </div>
          </div>

          <div className="h-px bg-gray-100 w-full"></div>

          <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-wider text-ios-subtext font-bold">Prontuários</h3>

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
            <button
              type="submit"
              disabled={loading}
              className={`w-full h-14 rounded-2xl font-bold text-lg text-white shadow-xl flex items-center justify-center gap-2 transition-all ${loading ? 'bg-gray-300' : 'bg-ios-primary hover:bg-ios-secondary'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  {initialAppointment ? 'Atualizando...' : 'Confirmando...'}
                </>
              ) : (
                initialAppointment ? 'Atualizar Agendamento' : 'Confirmar'
              )}
            </button>
            {initialAppointment && (<button type="button" onClick={handleDeleteRequest} disabled={loading} className="w-full h-14 rounded-2xl font-bold text-lg text-red-500 bg-red-50 border border-red-100">Excluir</button>)}
          </div>
        </form>
      </div>

      {showNewCompanyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-ios p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <h3 className="text-xl font-bold text-gray-900">Novo Cadastro</h3>
              <button onClick={() => setShowNewCompanyModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>

            <div className="flex bg-gray-100 p-1.5 rounded-2xl">
              <button
                type="button"
                onClick={() => setNewCompanyType('empresa')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${newCompanyType === 'empresa' ? 'bg-white text-ios-primary shadow-sm' : 'text-gray-500'}`}
              >
                Empresa (Matriz)
              </button>
              <button
                type="button"
                onClick={() => setNewCompanyType('unidade')}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all ${newCompanyType === 'unidade' ? 'bg-white text-ios-primary shadow-sm' : 'text-gray-500'}`}
              >
                Unidade (Filial)
              </button>
            </div>

            <div className="space-y-5">
              {newCompanyType === 'unidade' && (
                <div className="animate-in slide-in-from-top-2 duration-300">
                  <SearchableSelect
                    label="Selecione a Matriz"
                    value={selectedClientName}
                    onSelect={handleSelectClient}
                    options={clientsList}
                    placeholder="Pesquisar empresa matriz..."
                    required
                    noResultText="Nenhuma empresa encontrada"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase tracking-wide">
                  {newCompanyType === 'empresa' ? "Nome da Empresa" : "Nome da Unidade"}
                </label>
                <input
                  type="text"
                  value={newCompanyName}
                  onChange={e => setNewCompanyName(e.target.value)}
                  className="w-full h-14 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-ios-primary focus:ring-4 focus:ring-ios-primary/10 outline-none transition-all text-gray-800 font-medium"
                  placeholder={newCompanyType === 'empresa' ? "Ex: Coca-Cola, Vale..." : "Ex: Filial Centro, Obra 01..."}
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button onClick={() => setShowNewCompanyModal(false)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 rounded-2xl hover:bg-gray-200 transition-colors">Cancelar</button>
              <button
                onClick={handleSaveNewUnit}
                disabled={loading}
                className="flex-1 py-4 font-bold text-white bg-ios-primary rounded-2xl shadow-lg shadow-ios-primary/20 hover:bg-ios-secondary transition-all flex items-center justify-center gap-2"
              >
                {loading && <Loader2 className="w-5 h-5 animate-spin" />}
                Salvar
              </button>
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
            <div className="flex items-center justify-between gap-4 p-4 border-b border-gray-100 bg-gray-50/30">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  autoFocus
                  placeholder="Pesquisar por nome ou celular..."
                  className="w-full h-12 pl-12 pr-4 rounded-2xl bg-white border border-gray-200 focus:border-ios-primary focus:ring-4 focus:ring-ios-primary/10 outline-none transition-all text-sm font-medium"
                  value={contactSearchTerm}
                  onChange={(e) => setContactSearchTerm(e.target.value)}
                />
              </div>
              <button
                onClick={() => setShowNewContactModal(true)}
                className="h-12 px-4 bg-green-500 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all whitespace-nowrap text-sm"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                Novo Contato
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2 bg-gray-50">
              {loadingContacts && contactsList.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full space-y-3">
                  <Loader2 className="w-10 h-10 text-ios-primary animate-spin" />
                  <p className="text-ios-subtext font-medium">Buscando contatos...</p>
                </div>
              ) : filteredContacts.length > 0 ? (
                filteredContacts.map((contact, index) => (
                  <button key={`${contact.phone}-${index}`} onClick={() => handleContactSelect(contact)} className="w-full p-4 flex items-center gap-4 bg-white hover:bg-ios-primary/5 rounded-xl transition-all border border-gray-100 hover:border-ios-primary/20 text-left">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold text-gray-500">{contact.chatname.charAt(0)}</div>
                    <div><p className="font-bold text-gray-900">{contact.chatname}</p><p className="text-xs text-gray-400">{contact.phone}</p></div>
                  </button>
                ))
              ) : (
                <div className="text-center py-10">
                  {contactSearchTerm.trim() ? (
                    <div className="space-y-4">
                      {loadingContacts ? (
                        <div className="flex flex-col items-center gap-3 animate-in fade-in">
                          <Loader2 className="w-8 h-8 text-ios-primary animate-spin" />
                          <p className="text-gray-400 font-medium">Buscando na base de dados...</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-gray-400">Nenhum contato encontrado.</p>
                          <button
                            onClick={searchAllContacts}
                            className="px-6 py-3 bg-ios-primary text-white rounded-xl font-bold shadow-lg shadow-ios-primary/20 hover:bg-ios-secondary transition-all flex items-center gap-2 mx-auto"
                          >
                            <Search size={18} />
                            Tentar busca profunda
                          </button>
                        </>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-400">Nenhum contato disponível.</p>
                  )}
                </div>
              )}

              {hasMoreContacts && !contactSearchTerm.trim() && (
                <button
                  onClick={loadMoreContacts}
                  disabled={loadingContacts}
                  className="w-full py-4 text-ios-primary font-bold text-sm bg-white hover:bg-gray-50 rounded-xl transition-all border border-dashed border-ios-primary/30 mt-2 flex items-center justify-center gap-2"
                >
                  {loadingContacts ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Carregando...
                    </>
                  ) : "Carregar mais contatos"}
                </button>
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

      {showNewContactModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-ios p-6 max-w-sm w-full shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-gray-900 border-b border-gray-100 pb-3">Adicionar Novo Contato</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase">Nome Completo</label>
                <input
                  type="text"
                  value={newContactData.chatname}
                  onChange={e => setNewContactData({ ...newContactData, chatname: e.target.value })}
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-ios-primary focus:ring-4 focus:ring-ios-primary/10 outline-none transition-all font-medium"
                  placeholder="Nome do responsável..."
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-400 mb-1.5 ml-1 uppercase">Celular (WhatsApp)</label>
                <input
                  type="tel"
                  value={newContactData.phone}
                  onChange={e => setNewContactData({ ...newContactData, phone: formatPhone(e.target.value) })}
                  className="w-full h-12 px-4 rounded-xl bg-gray-50 border-transparent focus:bg-white focus:border-ios-primary focus:ring-4 focus:ring-ios-primary/10 outline-none transition-all font-medium"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowNewContactModal(false)}
                className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors"
                disabled={loadingContacts}
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveNewContact}
                disabled={loadingContacts}
                className="flex-1 py-3 font-bold text-white bg-green-500 rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                {loadingContacts ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar e Enviar'}
              </button>
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
