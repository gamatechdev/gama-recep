// Importa o React e hooks para construção do componente e gestão de estado
import React, { useState } from "react";
// Importa ícones da biblioteca lucide-react para uso visual
import { ClipboardList, User, Activity, Save } from "lucide-react";
// Importa o tipo Agendamento usado na aplicação
import { Agendamento } from "../../types";
// Importa o tipo PatientData compartilhado entre exames
import { PatientData } from "./AudiometriaMenu";

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
}

// Declara o componente funcional Anamnese
export function Anamnese({
  appointment,
  patientData,
  setPatientData,
  onSaveSuccess,
}: AnamneseProps) {
  // Estado para controlar as respostas do questionário e exibir campos condicionais
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Função auxiliar para atualizar o estado das respostas
  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  // Inicia o retorno da estrutura JSX
  return (
    // Container principal da página, com preenchimento superior zerado para elevar ao máximo o cabeçalho
    <div className="w-full max-w-5xl mx-auto pt-0 px-4 pb-4 sm:pt-0 sm:px-6 sm:pb-6 lg:pt-0 lg:px-8 lg:pb-8 space-y-6 print:p-0 print:pt-4 print:m-0 print:space-y-4 print:max-w-none print:w-full">
      {/* Cabeçalho que só aparece durante a impressão */}
      <div className="hidden print:block text-center mb-4">
        {/* Título do documento impresso */}
        <h1 className="text-xl font-bold uppercase border-b border-gray-400 pb-2 tracking-widest text-black">
          Anamnese Ocupacional
        </h1>
      </div>

      {/* Cabeçalho superior na visualização de tela normal, posicionado com margem negativa para aproximar do topo */}
      <div className="glass-panel p-6 rounded-ios shadow-float border border-ios-primary/20 flex items-center justify-center bg-white/80 print:hidden -mt-4 lg:-mt-8">
        {/* Ícone de prancheta representativo de formulário */}
        <ClipboardList className="w-8 h-8  text-ios-primary mr-3" />
        {/* Título em destaque na tela */}
        <h1 className="text-2xl font-bold text-ios-text tracking-tight uppercase">
          Anamnese Ocupacional
        </h1>
      </div>

      {/* Bloco 1: Dados de identificação do paciente */}
      <div className="bg-white rounded-ios shadow-sm border border-gray-400 p-6 space-y-4 relative overflow-hidden print:border-gray-300 print:border print:rounded-none print:shadow-none print:p-3 print:mb-2 print:break-inside-avoid">
        {/* Faixa colorida lateral decorativa para a tela */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-primary rounded-l-ios print:hidden"></div>

        {/* Título da seção Dados do Paciente */}
        <div className="flex items-center text-ios-primary font-semibold mb-4 border-b border-gray-400 pb-2 print:border-gray-400 print:mb-2 print:pb-1 print:text-black print:justify-center">
          <User className="w-5 h-5 mr-2 print:hidden" />
          <span className="print:text-xs print:font-bold uppercase">
            Dados do Paciente
          </span>
        </div>

        {/* Grid para organizar os campos em colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Empresa */}
          <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
            <label className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider print:text-black print:min-w-[60px] print:mb-0">
              Empresa:
            </label>
            <input
              type="text"
              value={patientData?.empresa || ""}
              onChange={(e) =>
                setPatientData &&
                setPatientData((prev) => ({ ...prev, empresa: e.target.value }))
              }
              className="px-3 py-2 bg-ios-bg border border-gray-400 rounded-ios-sm print:border-gray-400 focus:outline-none focus:border-ios-primary focus:ring-1 transition-all text-sm print:bg-transparent print:border-0 print:border-b print:px-0 print:py-0 print:text-[11px] print:text-black print:flex-1"
              placeholder="Nome da Empresa"
            />
          </div>

          {/* Função */}
          <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
            <label className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider print:text-black print:min-w-[60px] print:mb-0">
              Função:
            </label>
            <input
              type="text"
              value={patientData?.funcao || ""}
              onChange={(e) =>
                setPatientData &&
                setPatientData((prev) => ({ ...prev, funcao: e.target.value }))
              }
              className="px-3 py-2 bg-ios-bg border border-gray-400 rounded-ios-sm print:border-gray-400 focus:outline-none focus:border-ios-primary focus:ring-1 transition-all text-sm print:bg-transparent print:border-0 print:border-b print:px-0 print:py-0 print:text-[11px] print:text-black print:flex-1"
              placeholder="Função do Colaborador"
            />
          </div>

          {/* Nome */}
          <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
            <label className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider print:text-black print:min-w-[60px] print:mb-0">
              Nome:
            </label>
            <input
              type="text"
              value={patientData?.nome || ""}
              onChange={(e) =>
                setPatientData &&
                setPatientData((prev) => ({ ...prev, nome: e.target.value }))
              }
              className="px-3 py-2 bg-ios-bg border border-gray-400 rounded-ios-sm print:border-gray-400 focus:outline-none focus:border-ios-primary focus:ring-1 transition-all text-sm print:bg-transparent print:border-0 print:border-b print:px-0 print:py-0 print:text-[11px] print:text-black print:flex-1"
              placeholder="Nome completo"
            />
          </div>

          {/* Data */}
          <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
            <label className="text-xs font-medium text-gray-600 mb-1 uppercase tracking-wider print:text-black print:min-w-[60px] print:mb-0">
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
              className="px-3 py-2 bg-ios-bg border border-gray-400 rounded-ios-sm print:border-gray-400 focus:outline-none focus:border-ios-primary focus:ring-1 transition-all text-sm print:bg-transparent print:border-0 print:border-b print:px-0 print:py-0 print:text-[11px] print:text-black print:flex-1"
            />
          </div>
        </div>
      </div>

      {/* Bloco 2: Questionário da Anamnese */}
      <div className="bg-white rounded-ios shadow-sm border border-gray-400 p-6 space-y-5 relative overflow-hidden print:border-gray-300 print:border print:rounded-none print:shadow-none print:p-3 print:mb-1 print:break-inside-avoid text-ios-text print:text-black">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-secondary rounded-l-ios print:hidden"></div>

        <div className="flex items-center text-ios-secondary font-semibold mb-2 border-b border-gray-400 pb-2 print:hidden">
          <Activity className="w-5 h-5 mr-2" />
          <span className="uppercase">Questionário</span>
        </div>

        {/* Agrupa as questões com espaçamento consistente e maior legibilidade */}
        <div className="space-y-6 print:space-y-4">
          {/* Pergunta 1: Exame audiométrico anterior */}
          <div className="flex flex-col space-y-4 print:space-y-2">
            <span className="text-sm font-bold text-ios-text print:text-xs">
              - Já realizou exame audiométrico anteriormente?
            </span>
            <div className="grid grid-cols-2  sm:grid-cols-4 gap-3 print:flex print:gap-4">
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Sim</span>
              </label>

              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Não</span>
              </label>
            </div>

            {/* Campos condicionais para Exame Anterior */}
            {answers.q1 === "sim" && (
              <div className="pl-3 space-y-4 border-l-2 border-gray-400 ml-2 print:pl-4 print:space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex flex-col space-y-3">
                  <span className="text-sm text-gray-600 print:text-xs">
                    Se respondeu 'sim', qual o resultado?
                  </span>
                  <div className="flex gap-3">
                    <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                      <span className="text-sm font-medium print:text-xs">
                        Normal
                      </span>
                    </label>

                    <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                      <span className="text-sm font-medium print:text-xs">
                        Alterado
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex flex-col space-y-3">
                  <span className="text-sm text-gray-600 print:text-xs">
                    Se alterado, em qual ouvido?
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                      <span className="text-sm font-medium print:text-xs">
                        OD
                      </span>
                    </label>

                    <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                      <span className="text-sm font-medium print:text-xs">
                        OE
                      </span>
                    </label>

                    <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                      <span className="text-sm font-medium print:text-xs">
                        Ambos
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pergunta 2: Exposição ao ruído */}
          <div className="flex flex-col space-y-4 print:space-y-2">
            <span className="text-sm font-bold text-ios-text print:text-xs">
              - Trabalha ou já trabalhou exposto ao ruído?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:flex print:gap-4">
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
                  <input
                    type="radio"
                    name="q2"
                    value="sim"
                    checked={answers.q2 === "sim"}
                    onChange={(e) => handleAnswerChange("q2", e.target.value)}
                    className="peer sr-only"
                  />
                  <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                </div>
                <span className="text-sm font-medium print:text-xs">Sim</span>
              </label>

              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Não</span>
              </label>
            </div>
            {answers.q2 === "sim" && (
              <div className="pl-3 flex flex-col space-y-2 print:pl-4 print:space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-sm text-gray-600 print:text-xs">
                  Por quanto tempo?
                </span>
                <input
                  type="text"
                  className="w-full sm:w-1/2 px-4 py-3 bg-ios-bg border border-gray-400 rounded-ios focus:outline-none focus:border-ios-primary focus:ring-2 focus:ring-0/10 transition-all text-sm print:border-0 print:border-b print:px-0 print:py-1"
                  placeholder="Ex: 5 anos"
                />
              </div>
            )}
          </div>

          {/* Pergunta 3: Uso de protetor */}
          <div className="flex flex-col space-y-4 print:space-y-2">
            <span className="text-sm font-bold text-ios-text print:text-xs">
              - Usa ou já usou protetor no ouvido?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:flex print:gap-4">
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Sim</span>
              </label>

              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Não</span>
              </label>
            </div>
            {answers.q3 === "sim" && (
              <div className="pl-3 space-y-3 print:pl-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-sm text-gray-600 print:text-xs">
                  Qual?
                </span>
                <div className="flex flex-wrap gap-3">
                  <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                    <span className="text-sm font-medium print:text-xs">
                      Plug
                    </span>
                  </label>

                  <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                    <span className="text-sm font-medium print:text-xs">
                      Concha
                    </span>
                  </label>

                  <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                    <span className="text-sm font-medium print:text-xs">
                      Ambos
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Pergunta 4: Hábitos */}
          <div className="flex flex-col space-y-4 print:space-y-2">
            <span className="text-sm font-bold text-ios-text print:text-xs">
              - Possui esses hábitos?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:flex print:wrap print:gap-4">
              {/* Opção: Motociclismo */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-ios-sm border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">
                  Motociclismo
                </span>
              </label>

              {/* Opção: Fone de ouvido */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-ios-sm border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">
                  Fone de ouvido
                </span>
              </label>

              {/* Opção: Músico */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-ios-sm border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">
                  Músico
                </span>
              </label>

              {/* Opção: Nenhum (Lógica de exclusão) */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-ios-sm border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">
                  Nenhum
                </span>
              </label>
            </div>
           
          </div>

          {/* Pergunta 8: Cirurgia */}
          <div className="flex flex-col space-y-4 print:space-y-2">
            <span className="text-sm font-bold text-ios-text print:text-xs">
              - Já realizou cirurgia no ouvido?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:flex print:gap-4">
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Sim</span>
              </label>

              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Não</span>
              </label>
            </div>
            {answers.q8 === "sim" && (
              <div className="pl-3 space-y-3 print:pl-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-sm text-gray-600 print:text-xs">
                  Qual ouvido?
                </span>
                <div className="flex flex-wrap gap-3">
                  <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                    <span className="text-sm font-medium print:text-xs">
                      OD
                    </span>
                  </label>

                  <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                    <span className="text-sm font-medium print:text-xs">
                      OE
                    </span>
                  </label>

                  <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                    <span className="text-sm font-medium print:text-xs">
                      Ambos
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Pergunta 9: Trauma */}
          <div className="flex flex-col space-y-4 print:space-y-2">
            <span className="text-sm font-bold text-ios-text print:text-xs">
              - Já sofreu algum trauma no ouvido?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:flex print:gap-4">
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Sim</span>
              </label>

              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Não</span>
              </label>
            </div>
            {answers.q9 === "sim" && (
              <div className="pl-3 space-y-3 print:pl-4 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-sm text-gray-600 print:text-xs">
                  Qual ouvido?
                </span>
                <div className="flex flex-wrap gap-3">
                  <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                    <span className="text-sm font-medium print:text-xs">
                      OD
                    </span>
                  </label>

                  <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                    <span className="text-sm font-medium print:text-xs">
                      OE
                    </span>
                  </label>

                  <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                    <span className="text-sm font-medium print:text-xs">
                      Ambos
                    </span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Pergunta 10: Doenças de infância */}
          <div className="flex flex-col space-y-4 print:space-y-2">
            {/* Título da questão de doenças de infância */}
            <span className="text-sm font-bold text-ios-text print:text-xs">
              - Já teve:
            </span>
            {/* Grid para exibição responsiva dos itens em tela e flex no modo de impressão */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 print:flex print:gap-4 print:flex-wrap">
              {/* Opção Caxumba */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                {/* Indicador visual de checkbox personalizado (ocultado na impressão) */}
                <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
                  <input
                    type="checkbox"
                    name="q10_caxumba"
                    checked={answers.q10_caxumba === "sim"}
                    onChange={(e) => handleAnswerChange("q10_caxumba", e.target.checked ? "sim" : "nao")}
                    className="peer sr-only"
                  />
                  {/* Quadrado interno que é exibido somente se marcado */}
                  <div className="w-3 h-3 rounded-sm bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                </div>
                {/* Marcador de preenchimento exclusivo para versão impressa */}
                <span className="hidden print:inline mr-1 text-black font-mono">
                  {answers.q10_caxumba === "sim" ? "( X )" : "(   )"}
                </span>
                <span className="text-sm font-medium print:text-xs">caxumba</span>
              </label>

              {/* Opção Sarampo */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                {/* Indicador visual de checkbox personalizado (ocultado na impressão) */}
                <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
                  <input
                    type="checkbox"
                    name="q10_sarampo"
                    checked={answers.q10_sarampo === "sim"}
                    onChange={(e) => handleAnswerChange("q10_sarampo", e.target.checked ? "sim" : "nao")}
                    className="peer sr-only"
                  />
                  {/* Quadrado interno que é exibido somente se marcado */}
                  <div className="w-3 h-3 rounded-sm bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                </div>
                {/* Marcador de preenchimento exclusivo para versão impressa */}
                <span className="hidden print:inline mr-1 text-black font-mono">
                  {answers.q10_sarampo === "sim" ? "( X )" : "(   )"}
                </span>
                <span className="text-sm font-medium print:text-xs">sarampo</span>
              </label>

              {/* Opção Catapora */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                {/* Indicador visual de checkbox personalizado (ocultado na impressão) */}
                <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
                  <input
                    type="checkbox"
                    name="q10_catapora"
                    checked={answers.q10_catapora === "sim"}
                    onChange={(e) => handleAnswerChange("q10_catapora", e.target.checked ? "sim" : "nao")}
                    className="peer sr-only"
                  />
                  {/* Quadrado interno que é exibido somente se marcado */}
                  <div className="w-3 h-3 rounded-sm bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                </div>
                {/* Marcador de preenchimento exclusivo para versão impressa */}
                <span className="hidden print:inline mr-1 text-black font-mono">
                  {answers.q10_catapora === "sim" ? "( X )" : "(   )"}
                </span>
                <span className="text-sm font-medium print:text-xs">catapora</span>
              </label>

              {/* Opção Meningite */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                {/* Indicador visual de checkbox personalizado (ocultado na impressão) */}
                <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
                  <input
                    type="checkbox"
                    name="q10_meningite"
                    checked={answers.q10_meningite === "sim"}
                    onChange={(e) => handleAnswerChange("q10_meningite", e.target.checked ? "sim" : "nao")}
                    className="peer sr-only"
                  />
                  {/* Quadrado interno que é exibido somente se marcado */}
                  <div className="w-3 h-3 rounded-sm bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                </div>
                {/* Marcador de preenchimento exclusivo para versão impressa */}
                <span className="hidden print:inline mr-1 text-black font-mono">
                  {answers.q10_meningite === "sim" ? "( X )" : "(   )"}
                </span>
                <span className="text-sm font-medium print:text-xs">meningite</span>
              </label>

              {/* Opção Rubéola */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                {/* Indicador visual de checkbox personalizado (ocultado na impressão) */}
                <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
                  <input
                    type="checkbox"
                    name="q10_rubeola"
                    checked={answers.q10_rubeola === "sim"}
                    onChange={(e) => handleAnswerChange("q10_rubeola", e.target.checked ? "sim" : "nao")}
                    className="peer sr-only"
                  />
                  {/* Quadrado interno que é exibido somente se marcado */}
                  <div className="w-3 h-3 rounded-sm bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                </div>
                {/* Marcador de preenchimento exclusivo para versão impressa */}
                <span className="hidden print:inline mr-1 text-black font-mono">
                  {answers.q10_rubeola === "sim" ? "( X )" : "(   )"}
                </span>
                <span className="text-sm font-medium print:text-xs">rubéola</span>
              </label>
            </div>
          </div>

          {/* Pergunta 11: Doenças Crônicas ou Recorrentes */}
          <div className="flex flex-col space-y-4 print:space-y-2">
            {/* Título da questão de doenças crônicas */}
            <span className="text-sm font-bold text-ios-text print:text-xs">
              - Já teve ou tem:
            </span>
            {/* Grid para exibição responsiva dos itens em tela e flex no modo de impressão */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 print:flex print:gap-4 print:flex-wrap">
              {/* Opção Hipertensão */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                {/* Indicador visual de checkbox personalizado (ocultado na impressão) */}
                <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="hidden print:inline mr-1 text-black font-mono">
                  {answers.q11_hipertensao === "sim" ? "( X )" : "(   )"}
                </span>
                <span className="text-sm font-medium print:text-xs">hipertensão</span>
              </label>

              {/* Opção Diabetes */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                {/* Indicador visual de checkbox personalizado (ocultado na impressão) */}
                <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="hidden print:inline mr-1 text-black font-mono">
                  {answers.q11_diabetes === "sim" ? "( X )" : "(   )"}
                </span>
                <span className="text-sm font-medium print:text-xs">diabetes</span>
              </label>

              {/* Opção Problemas Cardíacos */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                {/* Indicador visual de checkbox personalizado (ocultado na impressão) */}
                <div className="relative flex items-center justify-center w-5 h-5 rounded border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="hidden print:inline mr-1 text-black font-mono">
                  {answers.q11_cardiacos === "sim" ? "( X )" : "(   )"}
                </span>
                <span className="text-sm font-medium print:text-xs">problemas cardíacos</span>
              </label>
            </div>

            {/* Campo outros problemas de saúde com layout otimizado para preenchimento e impressão */}
            <div className="pl-3 flex flex-col space-y-2 print:pl-0 print:space-y-0 print:flex-row print:items-baseline print:gap-2">
              <span className="text-sm text-gray-600 print:text-xs print:font-bold">
                Outros:
              </span>
              <input
                type="text"
                value={answers.q11_outros || ""}
                onChange={(e) => handleAnswerChange("q11_outros", e.target.value)}
                className="w-full sm:w-1/2 px-4 py-3 bg-ios-bg border border-gray-400 rounded-ios focus:outline-none focus:border-ios-primary focus:ring-2 focus:ring-0/10 transition-all text-sm print:border-0 print:border-b print:border-gray-400 print:px-0 print:py-0 print:text-[11px] print:text-black print:flex-1"
                placeholder="Especifique outros problemas de saúde, se houver"
              />
            </div>
          </div>

          {/* Pergunta 12: Tontura */}
          <div className="flex flex-col space-y-4 print:space-y-2">
            {/* Título da questão de tontura */}
            <span className="text-sm font-bold text-ios-text print:text-xs">
              - Apresenta tontura?
            </span>
            {/* Grid para exibição dos botões Sim e Não */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:flex print:gap-4">
              {/* Opção Sim */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
                  <input
                    type="radio"
                    name="q12_tontura"
                    value="sim"
                    checked={answers.q12_tontura === "sim"}
                    onChange={(e) => handleAnswerChange("q12_tontura", e.target.value)}
                    className="peer sr-only"
                  />
                  <div className="w-3 h-3 rounded-full bg-ios-primary scale-0 peer-checked:scale-100 transition-transform duration-200"></div>
                </div>
                {/* Marcador exclusivo para a impressão */}
                <span className="hidden print:inline mr-1 text-black font-mono">
                  {answers.q12_tontura === "sim" ? "( X )" : "(   )"}
                </span>
                <span className="text-sm font-medium print:text-xs">sim</span>
              </label>

              {/* Opção Não */}
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="hidden print:inline mr-1 text-black font-mono">
                  {answers.q12_tontura === "nao" ? "( X )" : "(   )"}
                </span>
                <span className="text-sm font-medium print:text-xs">não</span>
              </label>
            </div>

            {/* Campo frequência da tontura (exibido apenas se "sim" for selecionado na tela, ou exibido na impressão) */}
            <div className={`pl-3 flex-col space-y-2 print:pl-0 print:space-y-0 print:flex-row print:items-baseline print:gap-2 ${answers.q12_tontura === "sim" ? "flex" : "hidden print:flex"} animate-in fade-in slide-in-from-left-2 duration-300`}>
              <span className="text-sm text-gray-600 print:text-xs print:font-bold">
                Qual a frequência?
              </span>
              <input
                type="text"
                value={answers.q12_tontura_freq || ""}
                onChange={(e) => handleAnswerChange("q12_tontura_freq", e.target.value)}
                className="w-full sm:w-1/2 px-4 py-3 bg-ios-bg border border-gray-400 rounded-ios focus:outline-none focus:border-ios-primary focus:ring-2 focus:ring-0/10 transition-all text-sm print:border-0 print:border-b print:border-gray-400 print:px-0 print:py-0 print:text-[11px] print:text-black print:flex-1"
                placeholder="Informe a frequência da tontura"
              />
            </div>
          </div>

          {/* Pergunta 13: Zumbido */}
          <div className="flex flex-col space-y-4 print:space-y-2">
            <span className="text-sm font-bold text-ios-text print:text-xs">
              - Apresenta zumbido?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:flex print:gap-4">
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Sim</span>
              </label>

              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Não</span>
              </label>
            </div>
            {answers.q13 === "sim" && (
              <div className="pl-3 space-y-4 border-l-2 border-gray-400 ml-2 print:pl-4 print:space-y-2 animate-in fade-in slide-in-from-left-2 duration-300">
                <div className="flex flex-col space-y-3">
                  <span className="text-sm text-gray-600 print:text-xs">
                    Qual ouvido?
                  </span>
                  <div className="flex flex-wrap gap-3">
                    <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                      <span className="text-sm font-medium print:text-xs">
                        OD
                      </span>
                    </label>

                    <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                      <span className="text-sm font-medium print:text-xs">
                        OE
                      </span>
                    </label>

                    <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                      <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                      <span className="text-sm font-medium print:text-xs">
                        Ambos
                      </span>
                    </label>
                  </div>
                </div>
                <div className="flex flex-col space-y-2">
                  <span className="text-sm text-gray-600 print:text-xs">
                    Qual a frequência?
                  </span>
                  <input
                    type="text"
                    className="w-full sm:w-1/2 px-4 py-3 bg-ios-bg border border-gray-400 rounded-ios focus:outline-none focus:border-ios-primary focus:ring-2 focus:ring-0/10 transition-all text-sm print:border-0 print:border-b print:px-0 print:py-1"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Pergunta 14: Histórico Familiar */}
          <div className="flex flex-col space-y-4 print:space-y-2">
            <span className="text-sm font-bold text-ios-text print:text-xs">
              Tem casos de problemas auditivos na família?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:flex print:gap-4">
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Sim</span>
              </label>

              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Não</span>
              </label>
            </div>
            {answers.q14 === "sim" && (
              <div className="pl-3 flex flex-col space-y-2 print:pl-4 print:space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-sm text-gray-600 print:text-xs">
                  Parentesco:
                </span>
                <input
                  type="text"
                  className="w-full sm:w-1/2 px-4 py-3 bg-ios-bg border border-gray-400 rounded-ios focus:outline-none focus:border-ios-primary focus:ring-2 focus:ring-0/10 transition-all text-sm print:border-0 print:border-b print:px-0 print:py-1"
                />
              </div>
            )}
          </div>

          {/* Pergunta 15: Limpeza do ouvido */}
          <div className="flex flex-col space-y-4 print:space-y-2">
            <span className="text-sm font-bold text-ios-text print:text-xs">
              Usa algum objeto para limpar o ouvido?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 print:flex print:gap-4">
              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Sim</span>
              </label>

              <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg p-4 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/5 has-[:checked]:text-ios-primary print:p-0 print:bg-transparent print:border-0">
                <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                <span className="text-sm font-medium print:text-xs">Não</span>
              </label>
            </div>
            {answers.q15 === "sim" && (
              <div className="pl-3 flex flex-col space-y-2 print:pl-4 print:space-y-1 animate-in fade-in slide-in-from-left-2 duration-300">
                <span className="text-sm text-gray-600 print:text-xs">
                  Qual objeto?
                </span>
                <div className="flex flex-wrap items-center gap-3">
                  <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                    <span className="text-sm font-medium print:text-xs">
                      Cotonete
                    </span>
                  </label>

                  <label className="group flex items-center space-x-3 cursor-pointer bg-ios-bg/50 p-3 rounded-ios border border-transparent hover:border-ios-primary/30 transition-all has-[:checked]:border-ios-primary has-[:checked]:bg-ios-primary/10 has-[:checked]:text-ios-primary print:p-0">
                    <div className="relative flex items-center justify-center w-5 h-5 rounded-full border-2 border-gray-400 group-hover:border-ios-primary/30 has-[:checked]:border-ios-primary transition-all bg-white print:hidden">
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
                    <span className="text-sm font-medium print:text-xs">
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
      <div className="bg-white rounded-ios shadow-sm border border-gray-400 p-6 space-y-8 relative overflow-hidden print:border-gray-300 print:border print:rounded-none print:shadow-none print:p-3 print:mb-1 print:break-inside-avoid">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-text rounded-l-ios print:hidden"></div>

        <div className="flex items-start gap-2">
          <label className="font-semibold text-sm mt-1 print:text-xs">
            Observação:
          </label>
          <textarea
            rows={3}
            className="flex-1 w-full bg-transparent border border-dashed border-gray-400 rounded-md p-2 focus:outline-none focus:border-ios-primary text-sm print:text-xs resize-none"
            placeholder="Espaço reservado para observações adicionais"
          />
        </div>
      </div>

      {/* Botão de Ação Principal: Salvar */}
      <div className="flex justify-center pt-0 pb-0 print:hidden">
        <button
          onClick={() => {
            // Exibe um alerta avisando que a anamnese foi salva com sucesso
            alert("Anamnese salva com sucesso!");
            // Caso exista a função onSaveSuccess, executa a navegação para a tela de audiometria
            if (onSaveSuccess) {
              onSaveSuccess();
            }
          }}
          className="group relative flex items-center justify-center space-x-3 bg-ios-primary hover:bg-ios-primary/90 text-white font-bold py-4 px-16 rounded-ios shadow-float hover:shadow-float-lg transition-all transform hover:-translate-y-1 active:scale-95"
        >
          <Save className="w-5 h-5 group-hover:animate-bounce" />
          <span className="text-lg tracking-tight">Salvar Anamnese</span>

          {/* Efeito de brilho sutil no hover */}
        </button>
      </div>
    </div>
  );
}
