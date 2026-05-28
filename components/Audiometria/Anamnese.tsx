// Importa o React e hooks para construção do componente e gestão de estado
import React, { useState } from "react";
// Importa ícones da biblioteca lucide-react para uso visual
import { ClipboardList, User, Activity, Save } from "lucide-react";
// Importa o tipo Agendamento usado na aplicação
import { Agendamento } from "../../types";
import { PatientData } from "./AudiometriaMenu";
import { ChevronDown, Plus, Minus, TestTube } from "lucide-react";
import { AudiomPopup } from "./AdiomPopup";

// Define a interface das propriedades recebidas pelo componente
interface AnamneseProps {
  // Propriedade opcional para preencher dados do paciente
  appointment?: Agendamento | null;
  // Dados do paciente compartilhados e sincronizados em tempo real
  patientData?: PatientData;
  // Função reativa para alterar o estado do paciente de forma global
  setPatientData?: React.Dispatch<React.SetStateAction<PatientData>>;
  // Callback executado ao salvar as alterações com sucesso
  onSaveSuccess?: () => void;
  // Estado e Setter da anamnese elevados
  answers: Record<string, string>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, string>>>;
}

// Declara o componente funcional Anamnese
export function Anamnese({
  appointment,
  patientData,
  setPatientData,
  onSaveSuccess,
  answers,
  setAnswers,
}: AnamneseProps) {

  // Função auxiliar para atualizar o estado das respostas
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Estado para controlar o PopUp de validação
  const [popupConfig, setPopupConfig] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "error" | "success";
    onConfirm?: () => void;
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "error",
  });

  const showError = (message: string) => {
    setPopupConfig({
      isOpen: true,
      title: "Atenção",
      message,
      type: "error",
    });
  };

  // Ref para o botão de salvar, permitindo scroll automático
  const saveButtonRef = React.useRef<HTMLButtonElement>(null);

  // Efeito para rolar a tela para o topo ao montar o componente
  React.useEffect(() => {
    const scrollContainer = document.getElementById('main-scroll-container');
    if (scrollContainer) {
      scrollContainer.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  // Efeito que escuta o evento disparado pelo botão na Sidebar
  React.useEffect(() => {
    const handleTriggerMock = () => {
      handleMock();
    };

    window.addEventListener("triggerMockExame", handleTriggerMock);
    
    // Limpeza do listener ao desmontar o componente
    return () => {
      window.removeEventListener("triggerMockExame", handleTriggerMock);
    };
  }, []); // Dependências vazias para registrar o listener apenas uma vez

  // Função para simular o preenchimento completo e rolar até o botão salvar
  const handleMock = () => {
    // Preenche dados obrigatórios do paciente caso estejam vazios
    if (setPatientData) {
      setPatientData((prev) => ({
        ...prev,
        nome: prev.nome || "Paciente Teste Mock",
        empresa: prev.empresa || "Empresa Mock",
        funcao: prev.funcao || "Função Mock",
        dataExame: prev.dataExame || new Date().toISOString().split("T")[0],
      }));
    }

    // Preenche as respostas padrão para passar nas validações
    setAnswers({
      q1: "nao",
      q2: "nao",
      q3: "nao",
      q4_nenhum: "sim",
      q8: "nao",
      infeccao_ouvido: "nao",
      q9: "nao",
      q11_nenhum: "sim",
      q12_tontura: "nao",
      q13: "nao",
      q14: "nao",
      q15: "nao",
    });

    // Rola a tela suavemente para o botão Salvar
    setTimeout(() => {
      saveButtonRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
  };

  // Função de validação e salvamento
  const handleSave = () => {
    // 1. Validar Dados do Paciente
    if (!patientData?.empresa || !patientData?.funcao || !patientData?.nome || !patientData?.dataExame) {
      showError("Dados do Paciente: Por favor, preencha todos os dados obrigatórios (Empresa, Função, Nome e Data).");
      return;
    }

    // 2. Validar Q1 e subopções
    if (!answers.q1) {
      showError("Questão 1: Por favor, responda se já realizou exame audiométrico anteriormente.");
      return;
    }
    if (answers.q1 === "sim") {
      if (!answers.q1_result) {
        showError("Questão 1 (Condicional): Você marcou 'Sim'. Por favor, informe o resultado do exame anterior (Normal ou Alterado).");
        return;
      }
      if (answers.q1_result === "alterado" && !answers.q1_ear) {
        showError("Questão 1 (Condicional 2): O resultado foi 'Alterado'. Por favor, informe em qual ouvido o exame deu alterado.");
        return;
      }
    }

    // 3. Validar Q2 e tempo
    // Verifica se a resposta principal da questão 2 foi selecionada
    if (!answers.q2) {
      // Exibe pop-up de erro solicitando resposta para a Q2
      showError("Questão 2: Por favor, responda se trabalha ou já trabalhou exposto ao ruído.");
      // Interrompe a execução do salvamento
      return;
    }
    // Caso a resposta principal seja "sim", valida as condicionais relacionadas ao tempo
    if (answers.q2 === "sim") {
      // Exige o preenchimento do valor numérico do tempo de exposição ao ruído
      if (!answers.q2_tempo_val) {
        // Exibe erro informando que o tempo numérico de exposição é obrigatório
        showError("Questão 2 (Condicional): Você marcou 'Sim'. Por favor, informe o tempo numérico de exposição ao ruído.");
        // Interrompe a execução do salvamento
        return;
      }
      // Se a unidade de tempo estiver vazia no estado, define o padrão "anos" para consistência dos dados salvos
      if (!answers.q2_tempo_unidade) {
        // Define "anos" como unidade padrão no próprio objeto answers
        answers.q2_tempo_unidade = "anos";
      }
    }

    // 4. Validar Q3 e tipo
    if (!answers.q3) {
      showError("Questão 3: Por favor, responda se usa ou já usou protetor no ouvido.");
      return;
    }
    if (answers.q3 === "sim" && !answers.q3_type) {
      showError("Questão 3 (Condicional): Você marcou 'Sim'. Por favor, informe qual o tipo de protetor utilizado (Plug, Concha ou Ambos).");
      return;
    }

    // 5. Validar Q4 (Hábitos)
    if (answers.q4_moto !== "sim" && answers.q4_fone !== "sim" && answers.q4_musico !== "sim" && answers.q4_nenhum !== "sim") {
      showError("Questão 4: Por favor, responda se possui algum dos hábitos listados (se não possuir, marque a opção 'Nenhum').");
      return;
    }

    // 6. Validar Q8 e ouvido
    if (!answers.q8) {
      showError("Questão 8: Por favor, responda se já realizou cirurgia no ouvido.");
      return;
    }
    if (answers.q8 === "sim" && !answers.q8_ear) {
      showError("Questão 8 (Condicional): Você marcou 'Sim'. Por favor, informe em qual ouvido realizou a cirurgia.");
      return;
    }

    // Validar nova pergunta sobre infecção
    if (!answers.infeccao_ouvido) {
      showError("Por favor, responda se já teve infecção no ouvido.");
      return;
    }

    // 7. Validar Q9 e ouvido
    if (!answers.q9) {
      showError("Questão 9: Por favor, responda se já sofreu algum trauma no ouvido.");
      return;
    }
    if (answers.q9 === "sim" && !answers.q9_ear) {
      showError("Questão 9 (Condicional): Você marcou 'Sim'. Por favor, informe em qual ouvido sofreu o trauma.");
      return;
    }

    // 8. Validar Q11 (Doenças)
    if (answers.q11_hipertensao !== "sim" && answers.q11_diabetes !== "sim" && answers.q11_cardiacos !== "sim" && answers.q11_nenhum !== "sim" && !answers.q11_outros) {
      showError("Questão 11: Por favor, responda se possui alguma doença listada (se não possuir, marque 'Nenhum' ou especifique em 'Outros').");
      return;
    }

    // 9. Validar Q12 (Tontura) e frequência
    // Verifica se a resposta principal da questão 12 foi selecionada
    if (!answers.q12_tontura) {
      // Exibe pop-up de erro solicitando resposta para a Q12
      showError("Questão 12: Por favor, responda se apresenta tontura.");
      // Interrompe a execução do salvamento
      return;
    }
    // Caso a resposta principal seja "sim", valida as condicionais de frequência da tontura
    if (answers.q12_tontura === "sim") {
      // Exige o preenchimento da frequência de tontura (em texto)
      if (!answers.q12_frequencia || !answers.q12_frequencia.trim()) {
        // Exibe erro informando que o texto da frequência é obrigatório
        showError("Questão 12 (Condicional): Você marcou 'Sim'. Por favor, especifique a frequência da tontura na caixa de texto.");
        // Interrompe a execução do salvamento
        return;
      }
    }

    // 10. Validar Q13 (Zumbido)
    if (!answers.q13) {
      showError("Questão 13: Por favor, responda se apresenta zumbido.");
      return;
    }
    if (answers.q13 === "sim") {
      if (!answers.q13_ear) {
        showError("Questão 13 (Condicional 1): Você marcou 'Sim'. Por favor, informe em qual ouvido apresenta o zumbido.");
        return;
      }
      if (!answers.q13_frequencia) {
        showError("Questão 13 (Condicional 2): Você informou o ouvido do zumbido, mas falta informar qual a Frequência dele.");
        return;
      }
    }

    // 11. Validar Q14 (Família) e parentesco
    if (!answers.q14) {
      showError("Questão 14: Por favor, responda se tem casos de problemas auditivos na família.");
      return;
    }
    if (answers.q14 === "sim" && !answers.q14_parentesco?.trim()) {
      showError("Questão 14 (Condicional): Você marcou 'Sim'. Por favor, informe o grau de parentesco.");
      return;
    }

    // 12. Validar Q15 (Objeto limpeza) e qual
    if (!answers.q15) {
      showError("Questão 15: Por favor, responda se usa algum objeto para limpar o ouvido.");
      return;
    }
    if (answers.q15 === "sim") {
      if (!answers.q15_object) {
        showError("Questão 15 (Condicional 1): Você marcou 'Sim'. Por favor, informe qual objeto usa para limpar o ouvido.");
        return;
      }
      if (answers.q15_object === "outro" && !answers.q15_outro_text?.trim()) {
        showError("Questão 15 (Condicional 2): Você marcou 'Outro'. Por favor, especifique na caixa de texto qual é o objeto.");
        return;
      }
    }

    // Se chegou até aqui, está tudo válido
    setPopupConfig({
      isOpen: true,
      title: "Sucesso",
      message: "Anamnese salva com sucesso!",
      type: "success",
      onConfirm: () => {
        setPopupConfig((prev) => ({ ...prev, isOpen: false }));
        if (onSaveSuccess) onSaveSuccess();
      },
    });
  };

  // Inicia o retorno da estrutura JSX
  return (
    // Container principal da página, com preenchimento superior zerado para elevar ao máximo o cabeçalho

    <table className="w-full border-collapse block">
      <thead className="hidden">
        <tr>
        
        </tr>
      </thead>
      <tbody className="block">
        <tr className="block">
          <td className="block align-top">

            <div className="w-full max-w-5xl mx-auto pt-0 px-4 pb-4 sm:pt-0 sm:px-6 sm:pb-6 lg:pt-0 lg:px-8 lg:pb-8 space-y-6">

              <style>{`
        @media print {
          @page { margin: 0; }
          body { padding-left: 1.5cm; padding-right: 1.5cm; padding-bottom: 0; }
        }
      `}</style>

              {/* Cabeçalho que só aparece durante a impressão */}
              <div className="hidden text-center mb-4">
                {/* Título do documento impresso */}
                <h1 className="text-xl font-bold uppercase pb-2 tracking-widest text-black print">
                  Anamnese Ocupacional
                </h1>
              </div>

              {/* Cabeçalho superior na visualização de tela normal, posicionado com margem negativa para aproximar do topo */}
              <div className="glass-panel p-6 rounded-ios shadow-float border border-ios-primary/20 flex items-center justify-center bg-white/80 -mt-4 lg:-mt-8">
                {/* Ícone de prancheta representativo de formulário */}
                <ClipboardList className="w-8 h-8 text-ios-primary mr-3" />
                {/* Título em destaque na tela */}
                <h1 className="text-2xl font-bold text-ios-text tracking-tight uppercase">
                  Anamnese Ocupacional
                </h1>
              </div>

              {/* Bloco 1: Dados de identificação do paciente */}
              <div className="bg-white rounded-ios shadow-sm border border-gray-400 p-6 space-y-4 relative overflow-hidden">
                {/* Faixa colorida lateral decorativa para a tela */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-primary rounded-l-ios"></div>

                {/* Título da seção Dados do Paciente */}
                <div className="flex items-center text-ios-primary font-semibold mb-4 pb-2">
                  <User className="w-5 h-5 mr-2" />
                  <span className="uppercase">
                    Dados do Paciente
                  </span>
                </div>

                {/* Grid para organizar os campos em colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Empresa - primeira coluna, primeira linha no PDF */}
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                      Empresa:
                    </span>
                    <input
                      type="text"
                      value={patientData?.empresa || ""}
                      onChange={(e) =>
                        setPatientData &&
                        setPatientData((prev) => ({ ...prev, empresa: e.target.value }))
                      }
                      className="px-3 py-2 bg-ios-bg border-b border-gray-400 focus:outline-none focus:border-ios-primary focus:ring-1 transition-all text-sm"
                      placeholder="Nome da Empresa"
                    />
                  </div>

                  {/* Funcao - segunda coluna, primeira linha no PDF */}
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                      Função:
                    </label>
                    <input
                      type="text"
                      value={patientData?.funcao || ""}
                      onChange={(e) =>
                        setPatientData &&
                        setPatientData((prev) => ({ ...prev, funcao: e.target.value }))
                      }
                      className="px-3 py-2 bg-ios-bg border-b border-gray-400 focus:outline-none focus:border-ios-primary focus:ring-1 transition-all text-sm"
                      placeholder="Função do Colaborador"
                    />
                  </div>

                  {/* Nome - primeira coluna, segunda linha no PDF */}
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                      Nome:
                    </label>
                    <input
                      type="text"
                      value={patientData?.nome || ""}
                      onChange={(e) =>
                        setPatientData &&
                        setPatientData((prev) => ({ ...prev, nome: e.target.value }))
                      }
                      className="px-3 py-2 bg-ios-bg border-b border-gray-400 focus:outline-none focus:border-ios-primary focus:ring-1 transition-all text-sm"
                      placeholder="Nome completo"
                    />
                  </div>

                  {/* Data - segunda coluna, segunda linha no PDF */}
                  <div className="flex flex-col">
                    <label className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider">
                      Data:
                    </label>
                    <input
                      type="date"
                      value={patientData?.dataExame || ""}
                      onChange={(e) =>
                        setPatientData &&
                        setPatientData((prev) => ({
                          ...prev,
                          dataExame: e.target.value,
                        }))
                      }
                      className="px-3 py-2 bg-ios-bg border-b border-gray-400 focus:outline-none focus:border-ios-primary focus:ring-1 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Bloco 2: Questionário da Anamnese */}
              <div className="bg-white rounded-ios shadow-sm border border-gray-400 p-6 space-y-5 relative overflow-hidden text-ios-text">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-secondary rounded-l-ios"></div>

                <div className="flex items-center text-ios-secondary font-semibold mb-2 border-b border-gray-400 pb-2">
                  <Activity className="w-5 h-5 mr-2" />
                  <span className="uppercase">Questionário</span>
                </div>

                {/* Agrupa as questões com espaçamento consistente e maior legibilidade */}
                <div className="space-y-6">
                  {/* Pergunta 1: Exame audiométrico anterior */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-3">
                    <span className="text-sm font-bold text-ios-text">
                      Já realizou exame audiométrico anteriormente?
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q1"
                            value="sim"
                            checked={answers.q1 === "sim"}
                            onChange={(e) => handleAnswerChange("q1", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Sim</span>
                      </label>

                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q1"
                            value="nao"
                            checked={answers.q1 === "nao"}
                            onChange={(e) => handleAnswerChange("q1", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Não</span>
                      </label>
                    </div>
                    </div>

                    {/* Campos condicionais para Exame Anterior */}
                    {answers.q1 === "sim" && (
                      <div className="pl-3 space-y-4 border-l-2 border-gray-400 ml-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex flex-col space-y-3">  {/* print>border-l-0 remove bordas */}
                          <span className="text-sm text-gray-600">
                            Se respondeu 'sim', qual o resultado?
                          </span>
                          <div className="flex gap-3">
                            <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                              <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                                <input
                                  type="radio"
                                  name="q1_result"
                                  value="normal"
                                  checked={answers.q1_result === "normal"}
                                  onChange={(e) =>
                                    handleAnswerChange("q1_result", e.target.value)
                                  }
                                  className="peer sr-only"
                                />
                                <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                              </div>
                              <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                              <span className="text-sm font-medium">
                                Normal
                              </span>
                            </label>

                            <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                              <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                                <input
                                  type="radio"
                                  name="q1_result"
                                  value="alterado"
                                  checked={answers.q1_result === "alterado"}
                                  onChange={(e) =>
                                    handleAnswerChange("q1_result", e.target.value)
                                  }
                                  className="peer sr-only"
                                />
                                <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                              </div>
                              <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                              <span className="text-sm font-medium">
                                Alterado
                              </span>
                            </label>
                          </div>
                        </div>

                        <div className="flex flex-col space-y-3">
                          <span className="text-sm text-gray-600">
                            Se alterado, em qual ouvido?
                          </span>
                          <div className="flex flex-wrap gap-3">
                            <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                              <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                                <input
                                  type="radio"
                                  name="q1_ear"
                                  value="od"
                                  checked={answers.q1_ear === "od"}
                                  onChange={(e) =>
                                    handleAnswerChange("q1_ear", e.target.value)
                                  }
                                  className="peer sr-only"
                                />
                                <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                              </div>
                              <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                              <span className="text-sm font-medium">
                                OD
                              </span>
                            </label>

                            <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                              <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                                <input
                                  type="radio"
                                  name="q1_ear"
                                  value="oe"
                                  checked={answers.q1_ear === "oe"}
                                  onChange={(e) =>
                                    handleAnswerChange("q1_ear", e.target.value)
                                  }
                                  className="peer sr-only"
                                />
                                <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                              </div>
                              <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                              <span className="text-sm font-medium">
                                OE
                              </span>
                            </label>

                            <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                              <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                                <input
                                  type="radio"
                                  name="q1_ear"
                                  value="ambos"
                                  checked={answers.q1_ear === "ambos"}
                                  onChange={(e) =>
                                    handleAnswerChange("q1_ear", e.target.value)
                                  }
                                  className="peer sr-only"
                                />
                                <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                              </div>
                              <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                              <span className="text-sm font-medium">
                                Ambos
                              </span>
                            </label>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pergunta 2: Exposição ao ruído */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-3">
                    <span className="text-sm font-bold text-ios-text">
                      Trabalha ou já trabalhou exposto ao ruído?
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            // Define o tipo do input como rádio
                            type="radio"
                            // Atribui o nome da questão de exposição a ruído
                            name="q2"
                            // Define o valor deste rádio como "sim"
                            value="sim"
                            // Marca o rádio se a resposta no estado for igual a "sim"
                            checked={answers.q2 === "sim"}
                            // Evento disparado quando o usuário escolhe a opção "Sim"
                            onChange={(e) => {
                              // Atualiza o estado principal da questão q2 para "sim"
                              handleAnswerChange("q2", e.target.value);
                              // Caso a unidade de tempo da exposição não exista no estado, inicializa com "anos"
                              if (!answers.q2_tempo_unidade) {
                                // Define a unidade padrão como "anos" no estado
                                handleAnswerChange("q2_tempo_unidade", "anos");
                              }
                            }}
                            // Classe Tailwind CSS para esconder o input nativo mantendo-o acessível
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Sim</span>
                      </label>

                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q2"
                            value="nao"
                            checked={answers.q2 === "nao"}
                            onChange={(e) => handleAnswerChange("q2", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Não</span>
                      </label>
                    </div>
                    {answers.q2 === "sim" && (
                      <div className="pl-3 flex flex-col space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-sm text-gray-600">
                          Por quanto tempo?
                        </span>

                        {/* Container com bordas e flexbox para alinhar os controles de incremento, input e unidade */}
                        <div className="flex items-center w-full max-w-[250px] border border-gray-300 rounded-xl focus-within:ring-4 focus-within:ring-ios-primary/10 focus-within:border-ios-primary transition-all overflow-hidden shadow-sm">
                          <button
                            // Define o botão como botão para evitar submit acidental
                            type="button"
                            // Ação ao clicar no botão de decrementar
                            onClick={() => {
                              // Obtém o valor numérico atual ou assume 0 se for vazio/inválido
                              const valorAtual = parseInt(answers.q2_tempo_val || "0", 10) || 0;
                              // Garante que o novo valor não seja inferior a zero
                              const novoValor = Math.max(0, valorAtual - 1);
                              // Atualiza o valor numérico do tempo no estado de respostas
                              handleAnswerChange("q2_tempo_val", String(novoValor));
                              // Se a unidade de tempo da exposição não estiver definida no estado, define como "anos"
                              if (!answers.q2_tempo_unidade) {
                                // Grava a unidade "anos" no estado
                                handleAnswerChange("q2_tempo_unidade", "anos");
                              }
                            }}
                            // Classes visuais e efeitos de hover e cliques para o botão de menos
                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-200/50 hover:text-gray-700 active:scale-90 transition-all font-semibold"
                          >
                            {/* Ícone de menos */}
                            <Minus className="w-4 h-4" />
                          </button>
                          <input
                            // Define o input como campo de número
                            type="number"
                            // Define o valor mínimo do campo como zero
                            min={0}
                            // Atribui o valor do estado ou string vazia para evitar inputs não controlados
                            value={answers.q2_tempo_val || ""}
                            // Evento disparado quando o usuário digita no input
                            onChange={(e) => {
                              // Atualiza o valor numérico do tempo no estado de respostas
                              handleAnswerChange("q2_tempo_val", e.target.value);
                              // Garante que a unidade de tempo esteja preenchida com a padrão caso esteja ausente
                              if (!answers.q2_tempo_unidade) {
                                // Grava a unidade "anos" no estado
                                handleAnswerChange("q2_tempo_unidade", "anos");
                              }
                            }}
                            // Classes Tailwind para visual limpo e sem setas nativas do input number
                            className="w-12 text-center bg-transparent border-0 outline-none text-sm text-gray-800 font-bold focus:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            // Placeholder textual mostrando zero
                            placeholder="0"
                          />
                          <button
                            // Define como tipo de botão normal
                            type="button"
                            // Ação ao clicar no botão de incrementar
                            onClick={() => {
                              // Obtém o valor numérico atual ou assume 0 se for vazio/inválido
                              const valorAtual = parseInt(answers.q2_tempo_val || "0", 10) || 0;
                              // Soma uma unidade ao valor numérico atual
                              const novoValor = valorAtual + 1;
                              // Atualiza o valor numérico do tempo no estado de respostas
                              handleAnswerChange("q2_tempo_val", String(novoValor));
                              // Garante que a unidade de tempo esteja definida com "anos" caso esteja ausente
                              if (!answers.q2_tempo_unidade) {
                                // Grava a unidade "anos" no estado
                                handleAnswerChange("q2_tempo_unidade", "anos");
                              }
                            }}
                            // Classes visuais e efeitos para o botão de mais
                            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:bg-gray-200/50 hover:text-gray-700 active:scale-90 transition-all border-r border-gray-300"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          <div className="relative flex items-center pr-0">
                            <select
                              value={answers.q2_tempo_unidade || "anos"}
                              onChange={(e) => handleAnswerChange("q2_tempo_unidade", e.target.value)}
                              className="appearance-none pr-8 pl-3 py-2 bg-transparent border-0 outline-none text-sm text-gray-700 font-semibold cursor-pointer focus:ring-0"
                            >
                              <option value="semanas">Semanas</option>
                              <option value="meses">Meses</option>
                              <option value="anos">Anos</option>
                            </select>
                            <div className="absolute right-2.5 pointer-events-none text-gray-400">
                              <ChevronDown className="w-4 h-4" />
                            </div>
                          </div>
                        </div>

                      </div>
                    )}
                    </div>
                  </div>

                  {/* Pergunta 3: Uso de protetor */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-3">
                    <span className="text-sm font-bold text-ios-text">
                      Usa ou já usou protetor no ouvido?
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q3"
                            value="sim"
                            checked={answers.q3 === "sim"}
                            onChange={(e) => handleAnswerChange("q3", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Sim</span>
                      </label>

                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q3"
                            value="nao"
                            checked={answers.q3 === "nao"}
                            onChange={(e) => handleAnswerChange("q3", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Não</span>
                      </label>
                    </div>
                    </div>
                    {answers.q3 === "sim" && (
                      <div className="pl-3 space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-sm text-gray-600">
                          Qual?
                        </span>
                        <div className="flex flex-wrap gap-3">
                          <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                              <input
                                type="radio"
                                name="q3_type"
                                value="plug"
                                checked={answers.q3_type === "plug"}
                                onChange={(e) =>
                                  handleAnswerChange("q3_type", e.target.value)
                                }
                                className="peer sr-only"
                              />
                              <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                            </div>
                            <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                            <span className="text-sm font-medium">
                              Plug
                            </span>
                          </label>

                          <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                              <input
                                type="radio"
                                name="q3_type"
                                value="concha"
                                checked={answers.q3_type === "concha"}
                                onChange={(e) =>
                                  handleAnswerChange("q3_type", e.target.value)
                                }
                                className="peer sr-only"
                              />
                              <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                            </div>
                            <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                            <span className="text-sm font-medium">
                              Concha
                            </span>
                          </label>

                          <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                              <input
                                type="radio"
                                name="q3_type"
                                value="ambos"
                                checked={answers.q3_type === "ambos"}
                                onChange={(e) =>
                                  handleAnswerChange("q3_type", e.target.value)
                                }
                                className="peer sr-only"
                              />
                              <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                            </div>
                            <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                            <span className="text-sm font-medium">
                              Ambos
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pergunta 4: Hábitos */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-3">
                    <span className="text-sm font-bold text-ios-text">
                      Possui esses hábitos?
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Opção: Motociclismo */}
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-ios-sm border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary transition-all bg-white">
                          <input
                            type="checkbox"
                            name="q4_moto"
                            checked={answers.q4_moto === "sim"}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              handleAnswerChange("q4_moto", isChecked ? "sim" : "nao");
                              if (isChecked) handleAnswerChange("q4_nenhum", "nao");
                            }}
                            className="peer sr-only"
                          />
                          <svg
                            className="w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">
                          Motociclismo
                        </span>
                      </label>

                      {/* Opção: Fone de ouvido */}
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-ios-sm border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary transition-all bg-white">
                          <input
                            type="checkbox"
                            name="q4_fone"
                            checked={answers.q4_fone === "sim"}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              handleAnswerChange("q4_fone", isChecked ? "sim" : "nao");
                              if (isChecked) handleAnswerChange("q4_nenhum", "nao");
                            }}
                            className="peer sr-only"
                          />
                          <svg
                            className="w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">
                          Fone de ouvido
                        </span>
                      </label>

                      {/* Opção: Músico */}
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-ios-sm border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary transition-all bg-white">
                          <input
                            type="checkbox"
                            name="q4_musico"
                            checked={answers.q4_musico === "sim"}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              handleAnswerChange(
                                "q4_musico",
                                isChecked ? "sim" : "nao",
                              );
                              if (isChecked) handleAnswerChange("q4_nenhum", "nao");
                            }}
                            className="peer sr-only"
                          />
                          <svg
                            className="w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>

                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">
                          Músico
                        </span>
                      </label>

                      {/* Opção: Nenhum (Lógica de exclusão) */}
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-ios-sm border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary transition-all bg-white">
                          <input
                            type="checkbox"
                            name="q4_nenhum"
                            checked={answers.q4_nenhum === "sim"}
                            onChange={(e) => {
                              const isChecked = e.target.checked;
                              if (isChecked) {
                                // Se marcou "Nenhum", limpa todos os outros
                                handleAnswerChange("q4_moto", "nao");
                                handleAnswerChange("q4_fone", "nao");
                                handleAnswerChange("q4_musico", "nao");
                                handleAnswerChange("q4_nenhum", "sim");
                              } else {
                                handleAnswerChange("q4_nenhum", "nao");
                              }
                            }}
                            className="peer sr-only"
                          />
                          <svg
                            className="w-3 h-3 text-white scale-0 peer-checked:scale-100 transition-transform duration-200"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="4"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">
                          Nenhum
                        </span>
                      </label>
                    </div>
                    </div>

                  </div>

                  {/* Pergunta 8: Cirurgia */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-3">
                    <span className="text-sm font-bold text-ios-text">
                      Já realizou cirurgia no ouvido?
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q8"
                            value="sim"
                            checked={answers.q8 === "sim"}
                            onChange={(e) => handleAnswerChange("q8", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Sim</span>
                      </label>

                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q8"
                            value="nao"
                            checked={answers.q8 === "nao"}
                            onChange={(e) => handleAnswerChange("q8", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Não</span>
                      </label>
                    </div>
                    </div>
                    {answers.q8 === "sim" && (
                      <div className="pl-3 space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-sm text-gray-600">
                          Qual ouvido?
                        </span>
                        <div className="flex flex-wrap gap-3">
                          <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                              <input
                                type="radio"
                                name="q8_ear"
                                value="od"
                                checked={answers.q8_ear === "od"}
                                onChange={(e) =>
                                  handleAnswerChange("q8_ear", e.target.value)
                                }
                                className="peer sr-only"
                              />
                              <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                            </div>
                            <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                            <span className="text-sm font-medium">
                              OD
                            </span>
                          </label>

                          <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                              <input
                                type="radio"
                                name="q8_ear"
                                value="oe"
                                checked={answers.q8_ear === "oe"}
                                onChange={(e) =>
                                  handleAnswerChange("q8_ear", e.target.value)
                                }
                                className="peer sr-only"
                              />
                              <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                            </div>
                            <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                            <span className="text-sm font-medium">
                              OE
                            </span>
                          </label>

                          <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                              <input
                                type="radio"
                                name="q8_ear"
                                value="ambos"
                                checked={answers.q8_ear === "ambos"}
                                onChange={(e) =>
                                  handleAnswerChange("q8_ear", e.target.value)
                                }
                                className="peer sr-only"
                              />
                              <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                            </div>
                            <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                            <span className="text-sm font-medium">
                              Ambos
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pergunta Nova: Infecção no ouvido */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-3">
                    <span className="text-sm font-bold text-ios-text">
                      Já teve infecção no ouvido?
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="infeccao_ouvido"
                            value="sim"
                            checked={answers.infeccao_ouvido === "sim"}
                            onChange={(e) => handleAnswerChange("infeccao_ouvido", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Sim</span>
                      </label>

                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="infeccao_ouvido"
                            value="nao"
                            checked={answers.infeccao_ouvido === "nao"}
                            onChange={(e) => handleAnswerChange("infeccao_ouvido", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Não</span>
                      </label>
                    </div>
                    </div>
                  </div>

                  {/* Pergunta 9: Trauma */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-3">
                    <span className="text-sm font-bold text-ios-text">
                      Já sofreu algum trauma no ouvido?
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q9"
                            value="sim"
                            checked={answers.q9 === "sim"}
                            onChange={(e) => handleAnswerChange("q9", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Sim</span>
                      </label>

                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q9"
                            value="nao"
                            checked={answers.q9 === "nao"}
                            onChange={(e) => handleAnswerChange("q9", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Não</span>
                      </label>
                    </div>
                    </div>
                    {answers.q9 === "sim" && (
                      <div className="pl-3 space-y-3 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-sm text-gray-600">
                          Qual ouvido?
                        </span>
                        <div className="flex flex-wrap gap-3">
                          <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                              <input
                                type="radio"
                                name="q9_ear"
                                value="od"
                                checked={answers.q9_ear === "od"}
                                onChange={(e) =>
                                  handleAnswerChange("q9_ear", e.target.value)
                                }
                                className="peer sr-only"
                              />
                              <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                            </div>
                            <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                            <span className="text-sm font-medium">
                              OD
                            </span>
                          </label>

                          <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                              <input
                                type="radio"
                                name="q9_ear"
                                value="oe"
                                checked={answers.q9_ear === "oe"}
                                onChange={(e) =>
                                  handleAnswerChange("q9_ear", e.target.value)
                                }
                                className="peer sr-only"
                              />
                              <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                            </div>
                            <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                            <span className="text-sm font-medium">
                              OE
                            </span>
                          </label>

                          <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                              <input
                                type="radio"
                                name="q9_ear"
                                value="ambos"
                                checked={answers.q9_ear === "ambos"}
                                onChange={(e) =>
                                  handleAnswerChange("q9_ear", e.target.value)
                                }
                                className="peer sr-only"
                              />
                              <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                            </div>
                            <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                            <span className="text-sm font-medium">
                              Ambos
                            </span>
                          </label>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pergunta 11: Doenças Crônicas ou Recorrentes */}
                  <div className="flex flex-col space-y-4">
                    {/* Título da questão de doenças crônicas */}
                    <span className="text-sm font-bold text-ios-text">
                      Já teve ou tem:
                    </span>
                    {/* Grid para exibição responsiva dos itens em tela e flex no modo de impressão */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                      {/* Opção Hipertensão */}
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        {/* Indicador visual de checkbox personalizado (ocultado na impressão) */}
                        <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="checkbox"
                            name="q11_hipertensao"
                            checked={answers.q11_hipertensao === "sim"}
                            onChange={(e) => handleAnswerChange("q11_hipertensao", e.target.checked ? "sim" : "nao")}
                            className="peer sr-only"
                          />
                          {/* Quadrado interno que é exibido somente se marcado */}
                          <div className="w-3 h-3 rounded-sm bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        {/* Marcador de preenchimento exclusivo para versão impressa */}
                        <span className="hidden text-black font-mono">
                          (<span className="invisible group-has-[:checked]:visible">X</span>)
                        </span>
                        <span className="text-sm font-medium">hipertensão</span>
                      </label>

                      {/* Opção Diabetes */}
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        {/* Indicador visual de checkbox personalizado (ocultado na impressão) */}
                        <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="checkbox"
                            name="q11_diabetes"
                            checked={answers.q11_diabetes === "sim"}
                            onChange={(e) => handleAnswerChange("q11_diabetes", e.target.checked ? "sim" : "nao")}
                            className="peer sr-only"
                          />
                          {/* Quadrado interno que é exibido somente se marcado */}
                          <div className="w-3 h-3 rounded-sm bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        {/* Marcador de preenchimento exclusivo para versão impressa */}
                        <span className="hidden text-black font-mono">
                          (<span className="invisible group-has-[:checked]:visible">X</span>)
                        </span>
                        <span className="text-sm font-medium">diabetes</span>
                      </label>

                      {/* Opção Problemas Cardíacos */}
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        {/* Indicador visual de checkbox personalizado (ocultado na impressão) */}
                        <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="checkbox"
                            name="q11_cardiacos"
                            checked={answers.q11_cardiacos === "sim"}
                            onChange={(e) => handleAnswerChange("q11_cardiacos", e.target.checked ? "sim" : "nao")}
                            className="peer sr-only"
                          />
                          {/* Quadrado interno que é exibido somente se marcado */}
                          <div className="w-3 h-3 rounded-sm bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        {/* Marcador de preenchimento exclusivo para versão impressa */}
                        <span className="hidden text-black font-mono">
                          (<span className="invisible group-has-[:checked]:visible">X</span>)
                        </span>
                        <span className="text-sm font-medium">problemas cardíacos</span>
                      </label>

                      {/* OPÇÃO NENHUM */}
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        {/* Indicador visual de checkbox personalizado (ocultado na impressão) */}
                        <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="checkbox"
                            name="q11_nenhum"
                            checked={answers.q11_nenhum === "sim"}
                            onChange={(e) => handleAnswerChange("q11_nenhum", e.target.checked ? "sim" : "nao")}
                            className="peer sr-only"
                          />
                          {/* Quadrado interno que é exibido somente se marcado */}
                          <div className="w-3 h-3 rounded-sm bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        {/* Marcador de preenchimento exclusivo para versão impressa */}
                        <span className="hidden text-black font-mono">
                          (<span className="invisible group-has-[:checked]:visible">X</span>)
                        </span>
                        <span className="text-sm font-medium">nenhum</span>
                      </label>


                    </div>

                    {/* Campo outros problemas de saúde com layout otimizado para preenchimento e impressão */}
                    <div className="pl-3 flex flex-col space-y-2">
                      {answers.q11_nenhum === "nao" && answers.q11_diabetes === "nao" && answers.q11_cardiacos === "nao" && (
                        <> {/* ADICIONE A ABERTURA DO FRAGMENTO AQUI */}
                          <span className="text-sm text-gray-600">
                            Outros:
                          </span>
                          <input
                            type="text"
                            value={answers.q11_outros || ""}
                            onChange={(e) => handleAnswerChange("q11_outros", e.target.value)}
                            className="w-full sm:w-1/2 px-4 py-3 bg-ios-bg border border-gray-400 rounded-ios focus:outline-none focus:border-ios-primary focus:ring-2 focus:ring-0/10 transition-all text-sm"
                            placeholder="Especifique outros problemas de saúde, se houver"
                          />
                        </>
                      )}
                    </div>

                  </div>

                  {/* Pergunta 12: Tontura */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-3">
                    {/* Título da questão de tontura */}
                    <span className="text-sm font-bold text-ios-text">
                      Apresenta tontura?
                    </span>
                    {/* Grid para exibição dos botões Sim e Não */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {/* Opção Sim */}
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            // Tipo do input como rádio
                            type="radio"
                            // Atribui o nome da questão de tontura
                            name="q12_tontura"
                            // Define o valor deste rádio como "sim"
                            value="sim"
                            // Marca o rádio se a resposta no estado for igual a "sim"
                            checked={answers.q12_tontura === "sim"}
                            // Evento disparado quando o usuário escolhe a opção "Sim"
                            onChange={(e) => {
                              // Atualiza o estado principal da questão q12_tontura para "sim"
                              handleAnswerChange("q12_tontura", e.target.value);
                            }}
                            // Classe Tailwind CSS para esconder o input nativo de rádio
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        {/* Marcador exclusivo para a impressão */}
                        <span className="hidden text-black font-mono">
                          (<span className="invisible group-has-[:checked]:visible">X</span>)
                        </span>
                        <span className="text-sm font-medium">sim</span>
                      </label>

                      {/* Opção Não */}
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q12_tontura"
                            value="nao"
                            checked={answers.q12_tontura === "nao"}
                            onChange={(e) => handleAnswerChange("q12_tontura", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        {/* Marcador exclusivo para a impressão */}
                        <span className="hidden text-black font-mono">
                          (<span className="invisible group-has-[:checked]:visible">X</span>)
                        </span>
                        <span className="text-sm font-medium">não</span>
                      </label>
                    </div>
                    {answers.q12_tontura === "sim" && (
                      <div className="flex flex-col space-y-2">
                          <span className="text-sm text-gray-600">
                            Qual a frequência?
                          </span>
                          <div className="flex-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                            <input
                              type="text"
                              className="w-[60%] px-4 py-2.5 bg-ios-bg border border-gray-400 rounded-ios focus:outline-none focus:border-ios-primary focus:ring-2 focus:ring-ios-primary/10 transition-all text-sm"
                              placeholder="Especifique a frequência..."
                              value={answers.q12_frequencia || ""}
                              onChange={(e) =>
                                handleAnswerChange("q12_frequencia", e.target.value)
                              }
                            />
                          </div>
                        </div>
                    )}
                   
                    </div>
                  </div>

                  {/* Pergunta 13: Zumbido */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-3">
                    <span className="text-sm font-bold text-ios-text">
                      Apresenta zumbido?
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q13"
                            value="sim"
                            checked={answers.q13 === "sim"}
                            onChange={(e) => handleAnswerChange("q13", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Sim</span>
                      </label>

                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q13"
                            value="nao"
                            checked={answers.q13 === "nao"}
                            onChange={(e) => handleAnswerChange("q13", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Não</span>
                      </label>
                    </div>
                    </div>
                    {answers.q13 === "sim" && (
                      <div className="pl-3 space-y-4 border-l-2 border-gray-400 ml-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <div className="flex flex-col space-y-3">
                          <span className="text-sm text-gray-600">
                            Qual ouvido?
                          </span>
                          <div className="flex flex-wrap gap-3">
                            <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                              <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                                <input
                                  type="radio"
                                  name="q13_ear"
                                  value="od"
                                  checked={answers.q13_ear === "od"}
                                  onChange={(e) =>
                                    handleAnswerChange("q13_ear", e.target.value)
                                  }
                                  className="peer sr-only"
                                />
                                <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                              </div>
                              <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                              <span className="text-sm font-medium">
                                OD
                              </span>
                            </label>

                            <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                              <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                                <input
                                  type="radio"
                                  name="q13_ear"
                                  value="oe"
                                  checked={answers.q13_ear === "oe"}
                                  onChange={(e) =>
                                    handleAnswerChange("q13_ear", e.target.value)
                                  }
                                  className="peer sr-only"
                                />
                                <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                              </div>
                              <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                              <span className="text-sm font-medium">
                                OE
                              </span>
                            </label>

                            <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                              <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                                <input
                                  type="radio"
                                  name="q13_ear"
                                  value="ambos"
                                  checked={answers.q13_ear === "ambos"}
                                  onChange={(e) =>
                                    handleAnswerChange("q13_ear", e.target.value)
                                  }
                                  className="peer sr-only"
                                />
                                <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                              </div>
                              <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                              <span className="text-sm font-medium">
                                Ambos
                              </span>
                            </label>
                          </div>
                        </div>
                        <div className="flex flex-col space-y-2">
                          <span className="text-sm text-gray-600">
                            Qual a frequência?
                          </span>
                          <div className="flex-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                            <input
                              type="text"
                              className="w-[60%] px-4 py-2.5 bg-ios-bg border border-gray-400 rounded-ios focus:outline-none focus:border-ios-primary focus:ring-2 focus:ring-ios-primary/10 transition-all text-sm"
                              placeholder="Especifique a frequência..."
                              value={answers.q13_frequencia || ""}
                              onChange={(e) =>
                                handleAnswerChange("q13_frequencia", e.target.value)
                              }
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Pergunta 14: Histórico Familiar */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-3">
                    <span className="text-sm font-bold text-ios-text">
                      Tem casos de problemas auditivos na família?
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q14"
                            value="sim"
                            checked={answers.q14 === "sim"}
                            onChange={(e) => handleAnswerChange("q14", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Sim</span>
                      </label>

                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q14"
                            value="nao"
                            checked={answers.q14 === "nao"}
                            onChange={(e) => handleAnswerChange("q14", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Não</span>
                      </label>
                    </div>
                    {answers.q14 === "sim" && (
                      <div className="pl-3 flex flex-col space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-sm text-gray-600">
                          Parentesco:
                        </span>
                        <input
                          type="text"
                          value={answers.q14_parentesco || ""}
                          onChange={(e) => handleAnswerChange("q14_parentesco", e.target.value)}
                          className="w-[20%] px-4 py-2.5 bg-ios-bg border border-gray-400 rounded-ios focus:outline-none focus:border-ios-primary focus:ring-2 focus:ring-ios-primary/10 transition-all text-sm"
                        />
                      </div>
                    )}
                    </div>
                  </div>

                  {/* Pergunta 15: Limpeza do ouvido */}
                  <div className="flex flex-col space-y-4">
                    <div className="flex flex-col space-y-3">
                    <span className="text-sm font-bold text-ios-text">
                      Usa algum objeto para limpar o ouvido?
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q15"
                            value="sim"
                            checked={answers.q15 === "sim"}
                            onChange={(e) => handleAnswerChange("q15", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Sim</span>
                      </label>

                      <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary">
                        <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                          <input
                            type="radio"
                            name="q15"
                            value="nao"
                            checked={answers.q15 === "nao"}
                            onChange={(e) => handleAnswerChange("q15", e.target.value)}
                            className="peer sr-only"
                          />
                          <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                        </div>
                        <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                        <span className="text-sm font-medium">Não</span>
                      </label>
                    </div>
                    </div>
                    {answers.q15 === "sim" && (
                      <div className="pl-3 flex flex-col space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                        <span className="text-sm text-gray-600">
                          Qual objeto?
                        </span>
                        <div className="flex flex-wrap items-center gap-3">
                          <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                              <input
                                type="radio"
                                name="q15_object"
                                value="cotonete"
                                checked={answers.q15_object === "cotonete"}
                                onChange={(e) =>
                                  handleAnswerChange("q15_object", e.target.value)
                                }
                                className="peer sr-only"
                              />
                              <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                            </div>
                            <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                            <span className="text-sm font-medium">
                              Hastes de Algodão
                            </span>
                          </label>

                          <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary">
                            <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white">
                              <input
                                type="radio"
                                name="q15_object"
                                value="outro"
                                checked={answers.q15_object === "outro"}
                                onChange={(e) =>
                                  handleAnswerChange("q15_object", e.target.value)
                                }
                                className="peer sr-only"
                              />
                              <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                            </div>
                            <span className="hidden text-black font-mono">(<span className="invisible group-has-[:checked]:visible">X</span>)</span>
                            <span className="text-sm font-medium">
                              Outro
                            </span>
                          </label>

                          {answers.q15_object === "outro" && (
                            <div className="flex-1 min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                              <input
                                type="text"
                                className="w-full px-4 py-2.5 bg-ios-bg border border-gray-400 rounded-ios focus:outline-none focus:border-ios-primary focus:ring-2 focus:ring-ios-primary/10 transition-all text-sm"
                                placeholder="Especifique o objeto..."
                                value={answers.q15_outro_text || ""}
                                onChange={(e) =>
                                  handleAnswerChange("q15_outro_text", e.target.value)
                                }
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bloco 3: Observações finais e assinaturas */}
              <div className="bg-white rounded-ios shadow-sm border border-gray-400 p-6 space-y-8 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-text rounded-l-ios"></div>

                <div className="flex items-start gap-2">
                  <label className="font-semibold text-sm mt-1">
                    Observação:
                  </label>
                  <textarea
                    rows={3}
                    className="flex-1 w-full bg-transparent border border-dashed border-gray-400 rounded-md p-2 focus:outline-none focus:border-ios-primary text-sm resize-none"
                    placeholder="Espaço reservado para observações adicionais"
                    value={answers.anamneseObservacao || ""}
                    onChange={(e) => handleAnswerChange("anamneseObservacao", e.target.value)}
                  />
                </div>
              </div>
              
              
              

              {/* Botão de Ação Principal: Salvar */}
              <div className="flex justify-center pt-0 pb-0">
                <button
                  ref={saveButtonRef}
                  onClick={handleSave}
                  className="group relative flex items-center justify-center space-x-3 bg-ios-primary hover:bg-ios-primary/90 text-white font-bold py-4 px-16 rounded-ios shadow-float hover:shadow-float-lg transition-all transform hover:-translate-y-1 active:scale-95"
                >
                  <Save className="w-5 h-5 group-hover:animate-bounce" />
                  <span className="text-lg tracking-tight">Salvar Anamnese</span>

                  {/* Efeito de brilho sutil no hover */}
                </button>
              </div>

              {/* PopUp de validação em vez do alert do navegador */}
              <AudiomPopup
                isOpen={popupConfig.isOpen}
                title={popupConfig.title}
                message={popupConfig.message}
                type={popupConfig.type}
                onClose={() => setPopupConfig((prev) => ({ ...prev, isOpen: false }))}
                onConfirm={popupConfig.onConfirm}
              />
            </div>
          </td>
        </tr>
      </tbody>

      <tfoot className="hidden">
        <tr>
          <td>
            <div className="h-4"></div>
          </td>
        </tr>
      </tfoot>
    </table>
  );
}
