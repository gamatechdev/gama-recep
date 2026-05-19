import React, { useState } from "react";
// Importamos os ícones do lucide-react para compor uma interface rica e intuitiva
import {
  FileText,
  User,
  Briefcase,
  Calendar,
  CheckCircle2,
  X,
  Printer,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
// Importamos a tipagem global de agendamentos
import { Agendamento } from "../../types";
// Importamos o tipo PatientData compartilhado entre exames
import { PatientData } from "./AudiometriaMenu";
// Importamos a assinatura digitalizada padrão da fonoaudióloga
import sigImage from "../ui/grade/sig.png";
// Importamos o componente de captura de assinatura digital modularizado
import { SignatureScreen } from "./SignatureScreen";

// Interface descrevendo as propriedades aceitas pelo componente
interface LaudoPerdaProps {
  // Define se o modal/tela do termo está aberto
  isOpen: boolean;
  // Callback de fechamento do componente
  onClose: () => void;
  // Dados do agendamento atual para autopreenchimento
  appointment?: Agendamento | null;
  // Tipo de exame vindo fixo de Audiometria.tsx
  tipoExame?: string;
  // Dados do paciente compartilhados e sincronizados em tempo real entre os exames
  patientData?: PatientData;
  // Dados já salvos/preenchidos anteriormente para reabertura com estado mantido
  savedData?: {
    // Nome do colaborador
    nome: string;
    // Documento (CPF ou RG)
    documento: string;
    // Nome da empresa associada
    empresa: string;
    // Função ocupada na empresa
    funcao: string;
    // Alterações da orelha direita
    odAlterations: {
      // Indica se possui alteração ativa na OD
      checked: boolean;
      // Alteração neurossensorial na OD
      neurosensorial: boolean;
      // Alteração condutiva na OD
      condutiva: boolean;
      // Alteração mista na OD
      mista: boolean;
      // Cerume presente na OD
      cerume: boolean;
      // Perda de frequência em 6000Hz na OD
      h6000?: boolean;
      // Perda de frequência em 8000Hz na OD
      h8000?: boolean;
    };
    // Alterações da orelha esquerda
    oeAlterations: {
      // Indica se possui alteração ativa na OE
      checked: boolean;
      // Alteração neurossensorial na OE
      neurosensorial: boolean;
      // Alteração condutiva na OE
      condutiva: boolean;
      // Alteração mista na OE
      mista: boolean;
      // Cerume presente na OE
      cerume: boolean;
      // Perda de frequência em 6000Hz na OE
      h6000?: boolean;
      // Perda de frequência em 8000Hz na OE
      h8000?: boolean;
    };
    // Observações adicionais descritas pelo fonoaudiólogo
    observacoes: string;
    // Assinatura do colaborador no formato base64
    employeeSignature: string | null;
  } | null;
  // Callback disparado ao salvar/confirmar o termo
  onSave?: (data: {
    // Nome do colaborador
    nome: string;
    // Documento do colaborador
    documento: string;
    // Empresa associada
    empresa: string;
    // Função do colaborador
    funcao: string;
    // Alterações mapeadas para a orelha direita
    odAlterations: {
      // Estado geral de alteração na OD
      checked: boolean;
      // Tipo neurossensorial na OD
      neurosensorial: boolean;
      // Tipo condutivo na OD
      condutiva: boolean;
      // Tipo misto na OD
      mista: boolean;
      // Presença de cerume na OD
      cerume: boolean;
      // Frequência de 6000Hz na OD
      h6000?: boolean;
      // Frequência de 8000Hz na OD
      h8000?: boolean;
    };
    // Alterações mapeadas para a orelha esquerda
    oeAlterations: {
      // Estado geral de alteração na OE
      checked: boolean;
      // Tipo neurossensorial na OE
      neurosensorial: boolean;
      // Tipo condutivo na OE
      condutiva: boolean;
      // Tipo misto na OE
      mista: boolean;
      // Presença de cerume na OE
      cerume: boolean;
      // Frequência de 6000Hz na OE
      h6000?: boolean;
      // Frequência de 8000Hz na OE
      h8000?: boolean;
    };
    // Observações adicionais para salvamento
    observacoes: string;
    // Assinatura digital a ser gravada
    employeeSignature: string | null;
  }) => void;
}

// Componente principal para o Termo de Perda Auditiva
export function LaudoPerda({
  isOpen,
  onClose,
  appointment,
  tipoExame,
  savedData,
  onSave,
  patientData,
}: LaudoPerdaProps) {
  // Estado para controlar a abertura da lousa de assinatura digital do funcionário
  const [isEmployeeSigOpen, setIsEmployeeSigOpen] = useState(false);
  // Estado para armazenar o traçado final da assinatura do funcionário
  const [employeeSignature, setEmployeeSignature] = useState<string | null>(
    savedData?.employeeSignature ?? null,
  );

  // Dados cadastrais derivados diretamente do patientData/appointment da tela de Audiometria (não editáveis localmente)
  const nome =
    savedData?.nome ??
    patientData?.nome ??
    appointment?.colaboradores?.nome ??
    "";
  const documento =
    savedData?.documento ??
    patientData?.documento ??
    appointment?.colaboradores?.cpf ??
    "";
  const empresa =
    savedData?.empresa ??
    patientData?.empresa ??
    appointment?.unidades?.nome_unidade ??
    "";
  const funcao =
    savedData?.funcao ??
    patientData?.funcao ??
    appointment?.colaboradores?.setor ??
    "";

  // Estado de controle das alterações identificadas na orelha direita do paciente
  const [odAlterations, setOdAlterations] = useState({
    // Estado inicial de alteração geral na orelha direita
    checked: false,
    // Estado inicial para tipo neurossensorial na orelha direita
    neurosensorial: false,
    // Estado inicial para tipo condutivo na orelha direita
    condutiva: false,
    // Estado inicial para tipo misto na orelha direita
    mista: false,
    // Estado inicial para presença de cerume na orelha direita
    cerume: false,
    // Estado inicial para frequência de 6000Hz na orelha direita
    h6000: false,
    // Estado inicial para frequência de 8000Hz na orelha direita
    h8000: false,
    // Espalha as propriedades já salvas anteriormente caso existam no banco ou tela
    ...savedData?.odAlterations,
  });

  // Estado de controle das alterações identificadas na orelha esquerda do paciente
  const [oeAlterations, setOeAlterations] = useState({
    // Estado inicial de alteração geral na orelha esquerda
    checked: false,
    // Estado inicial para tipo neurossensorial na orelha esquerda
    neurosensorial: false,
    // Estado inicial para tipo condutivo na orelha esquerda
    condutiva: false,
    // Estado inicial para tipo misto na orelha esquerda
    mista: false,
    // Estado inicial para presença de cerume na orelha esquerda
    cerume: false,
    // Estado inicial para frequência de 6000Hz na orelha esquerda
    h6000: false,
    // Estado inicial para frequência de 8000Hz na orelha esquerda
    h8000: false,
    // Espalha as propriedades já salvas anteriormente caso existam no banco ou tela
    ...savedData?.oeAlterations,
  });

  // Estado para o campo livre de observações clínicas
  const [observacoes, setObservacoes] = useState(savedData?.observacoes ?? "");

  // Recupera a data local atual formatada por extenso no padrão brasileiro
  const localDate = new Date();
  const dia = localDate.getDate();
  const meses = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  const mes = meses[localDate.getMonth()];
  const ano = localDate.getFullYear();

  // Aborta renderização se o componente estiver fechado
  if (!isOpen) return null;

  // Renderiza a estrutura do modal com fundo translúcido e design ultra premium
  return (
    <>
      {/* Wrapper principal do LaudoPerda (Ocultado se o modal de assinatura estiver ativo para visual livre de distrações) */}
      <div
        className={`fixed -inset-6 z-[100] overflow-y-auto bg-slate-900/60 backdrop-blur-md flex items-start justify-center p-4 sm:p-6 md:p-10 print:static print:bg-transparent print:p-0 print:overflow-visible ${
          isEmployeeSigOpen ? "hidden" : ""
        }`}
      >
        {/* Container principal do Laudo com bordas arredondadas e sombra flutuante */}
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col my-0 print:my-0 print:border-0 print:shadow-none print:rounded-none print:w-full">
          {/* Cabeçalho do painel de controle (Oculto ao imprimir) */}
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-2 flex items-center justify-between shrink-0 print:hidden">
            <div className="flex items-center space-x-3">
              {/* Ícone representando o Termo de Perda */}
              <FileText className="w-6 h-6 text-ios-primary animate-pulse" />
              {/* Título de navegação do modal */}
              <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wider">
                Termo de Perda Auditiva
              </h3>
            </div>
            {/* Botão de fechamento simples no canto superior direito */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all active:scale-90"
              title="Fechar Termo"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Corpo principal do formulário com rolagem e espaçamento confortável */}
          <div className="flex-1 p-8 md:p-12 space-y-8 bg-slate-50/50 print:bg-transparent print:p-0 print:space-y-4">
            {/* Título Oficial Centralizado do Laudo no Padrão Normativo */}
            <div className="text-center space-y-2 border-b pb-6 border-slate-200 print:pb-3 print:border-gray-400">
              {/* Título Principal em Negrito */}
              <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-wide uppercase print:text-base print:text-black">
                Termo de Reconhecimento de Perda Auditiva
              </h1>
              {/* Subtítulo Normativo da NR 7 */}
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest print:text-[10px] print:text-black">
                (NR 7 – Portaria 19, Anexo I)
              </h2>
            </div>

            {/* Seção 1: Dados de Identificação com Fundo Branco Arredondado */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm relative overflow-hidden print:border-gray-300 print:rounded-none print:shadow-none print:p-3 print:mb-2">
              {/* Barra lateral de cor azul para dar um charme visual premium */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-primary rounded-l-xl print:hidden"></div>

              {/* Título interno do bloco com ícone de usuário */}
              <div className="flex items-center text-ios-primary font-bold border-b border-slate-100 pb-3 print:border-gray-400 print:pb-1 print:text-black">
                <User className="w-5 h-5 mr-2 print:hidden" />
                <span className="text-sm uppercase tracking-wider print:text-xs">
                  Dados de Identificação do Colaborador
                </span>
              </div>

              {/* Grid responsivo de campos de dados de preenchimento */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:gap-3">
                {/* Campo Nome */}
                <div className="flex flex-col space-y-1.5 print:flex-row print:space-y-0 print:items-baseline print:gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider print:text-[9px] print:text-black print:min-w-[60px]">
                    Nome:
                  </label>
                  <input
                    type="text"
                    value={nome}
                    readOnly={true}
                    className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none text-slate-500 cursor-not-allowed text-sm print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1 font-semibold"
                    placeholder="Nome Completo"
                  />
                </div>

                {/* Campo Documento */}
                <div className="flex flex-col space-y-1.5 print:flex-row print:space-y-0 print:items-baseline print:gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider print:text-[9px] print:text-black print:min-w-[60px]">
                    Documento:
                  </label>
                  <input
                    type="text"
                    value={documento}
                    readOnly={true}
                    className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none text-slate-500 cursor-not-allowed text-sm print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1 font-semibold"
                    placeholder="CPF ou RG"
                  />
                </div>

                {/* Campo Empresa */}
                <div className="flex flex-col space-y-1.5 print:flex-row print:space-y-0 print:items-baseline print:gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider print:text-[9px] print:text-black print:min-w-[60px]">
                    Empresa:
                  </label>
                  <input
                    type="text"
                    value={empresa}
                    readOnly={true}
                    className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none text-slate-500 cursor-not-allowed text-sm print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1 font-semibold"
                    placeholder="Nome da Empresa"
                  />
                </div>

                {/* Campo Função */}
                <div className="flex flex-col space-y-1.5 print:flex-row print:space-y-0 print:items-baseline print:gap-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider print:text-[9px] print:text-black print:min-w-[60px]">
                    Função:
                  </label>
                  <input
                    type="text"
                    value={funcao}
                    readOnly={true}
                    className="px-3.5 py-2 bg-slate-100 border border-slate-200 rounded-lg focus:outline-none text-slate-500 cursor-not-allowed text-sm print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1 font-semibold"
                    placeholder="Cargo/Função"
                  />
                </div>
              </div>
            </div>

            {/* Seção 2: Declaração Principal e Alterações de Ouvido */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-6 shadow-sm relative overflow-hidden print:border-gray-300 print:rounded-none print:shadow-none print:p-3 print:mb-2">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-primary rounded-l-xl print:hidden"></div>

              {/* Texto de Declaração de Ciência */}
              <div className="text-slate-700 text-sm md:text-base leading-relaxed flex flex-wrap items-baseline gap-1 print:text-[10px] print:text-black print:leading-normal">
                <span>
                  Declaro que estou ciente que houve no exame audiométrico
                </span>
                {/* Exibe o tipo de exame de forma fixa e elegante, sem dropdown interativo */}
                <span className="font-bold   px-1">
                  {tipoExame || appointment?.tipo || "admissional"}
                </span>
                <span>, onde foi detectada alteração:</span>
              </div>

              {/* Quadro de Orelhas e Tipos de Alterações Clínicas (OD / OE) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-2 print:gap-4">
                {/* Orelha Direita (OD) */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 print:border-gray-300 print:rounded-none print:p-2">
                  <div className="flex items-center space-x-2.5 mb-4 border-b pb-2 border-slate-100 print:mb-1.5 print:pb-0.5 print:border-gray-200">
                    {/* Checkbox interativo para indicar se OD tem alteração */}
                    <input
                      type="checkbox"
                      id="od-check"
                      checked={odAlterations.checked}
                      onChange={(e) =>
                        setOdAlterations({
                          ...odAlterations,
                          checked: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary accent-ios-primary print:w-3.5 print:h-3.5"
                    />
                    <label
                      htmlFor="od-check"
                      className="text-sm font-extrabold text-red-600 uppercase tracking-widest cursor-pointer select-none print:text-[10px] print:text-black"
                    >
                      Orelha Direita (OD)
                    </label>
                  </div>

                  {/* Sub-opções de alteração para OD */}
                  <div className="space-y-2.5 pl-6 print:space-y-1.5">
                    {/* Neurosensorial */}
                    <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-slate-700 select-none print:text-[9px] print:text-black">
                      <input
                        type="checkbox"
                        disabled={!odAlterations.checked}
                        checked={odAlterations.neurosensorial}
                        onChange={(e) =>
                          setOdAlterations({
                            ...odAlterations,
                            neurosensorial: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary disabled:opacity-40 accent-ios-primary print:w-3 print:h-3"
                      />
                      <span
                        className={
                          !odAlterations.checked
                            ? "text-slate-400"
                            : "font-medium"
                        }
                      >
                        Neurosensorial
                      </span>
                    </label>

                    {/* Condutiva */}
                    <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-slate-700 select-none print:text-[9px] print:text-black">
                      <input
                        type="checkbox"
                        disabled={!odAlterations.checked}
                        checked={odAlterations.condutiva}
                        onChange={(e) =>
                          setOdAlterations({
                            ...odAlterations,
                            condutiva: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary disabled:opacity-40 accent-ios-primary print:w-3 print:h-3"
                      />
                      <span
                        className={
                          !odAlterations.checked
                            ? "text-slate-400"
                            : "font-medium"
                        }
                      >
                        Condutiva
                      </span>
                    </label>

                    {/* Mista */}
                    <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-slate-700 select-none print:text-[9px] print:text-black">
                      <input
                        type="checkbox"
                        disabled={!odAlterations.checked}
                        checked={odAlterations.mista}
                        onChange={(e) =>
                          setOdAlterations({
                            ...odAlterations,
                            mista: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary disabled:opacity-40 accent-ios-primary print:w-3 print:h-3"
                      />
                      <span
                        className={
                          !odAlterations.checked
                            ? "text-slate-400"
                            : "font-medium"
                        }
                      >
                        Mista
                      </span>
                    </label>

                    {/* Presença de cerume */}
                    <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-slate-700 select-none print:text-[9px] print:text-black">
                      <input
                        type="checkbox"
                        disabled={!odAlterations.checked}
                        checked={odAlterations.cerume}
                        onChange={(e) =>
                          setOdAlterations({
                            ...odAlterations,
                            cerume: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary disabled:opacity-40 accent-ios-primary print:w-3 print:h-3"
                      />
                      <span
                        className={
                          !odAlterations.checked
                            ? "text-slate-400"
                            : "font-medium"
                        }
                      >
                        Presença de cerume
                      </span>
                    </label>
                  </div>
                </div>

                {/* Orelha Esquerda (OE) */}
                <div className="border border-slate-100 rounded-xl p-4 bg-slate-50/30 print:border-gray-300 print:rounded-none print:p-2">
                  <div className="flex items-center space-x-2.5 mb-4 border-b pb-2 border-slate-100 print:mb-1.5 print:pb-0.5 print:border-gray-200">
                    {/* Checkbox interativo para indicar se OE tem alteração */}
                    <input
                      type="checkbox"
                      id="oe-check"
                      checked={oeAlterations.checked}
                      onChange={(e) =>
                        setOeAlterations({
                          ...oeAlterations,
                          checked: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary accent-ios-primary print:w-3.5 print:h-3.5"
                    />
                    <label
                      htmlFor="oe-check"
                      className="text-sm font-extrabold text-blue-600 uppercase tracking-widest cursor-pointer select-none print:text-[10px] print:text-black"
                    >
                      Orelha Esquerda (OE)
                    </label>
                  </div>

                  {/* Sub-opções de alteração para OE */}
                  <div className="space-y-2.5 pl-6 print:space-y-1.5">
                    {/* Neurosensorial */}
                    <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-slate-700 select-none print:text-[9px] print:text-black">
                      <input
                        type="checkbox"
                        disabled={!oeAlterations.checked}
                        checked={oeAlterations.neurosensorial}
                        onChange={(e) =>
                          setOeAlterations({
                            ...oeAlterations,
                            neurosensorial: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary disabled:opacity-40 accent-ios-primary print:w-3 print:h-3"
                      />
                      <span
                        className={
                          !oeAlterations.checked
                            ? "text-slate-400"
                            : "font-medium"
                        }
                      >
                        Neurosensorial
                      </span>
                    </label>

                    {/* Condutiva */}
                    <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-slate-700 select-none print:text-[9px] print:text-black">
                      <input
                        type="checkbox"
                        disabled={!oeAlterations.checked}
                        checked={oeAlterations.condutiva}
                        onChange={(e) =>
                          setOeAlterations({
                            ...oeAlterations,
                            condutiva: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary disabled:opacity-40 accent-ios-primary print:w-3 print:h-3"
                      />
                      <span
                        className={
                          !oeAlterations.checked
                            ? "text-slate-400"
                            : "font-medium"
                        }
                      >
                        Condutiva
                      </span>
                    </label>

                    {/* Mista */}
                    <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-slate-700 select-none print:text-[9px] print:text-black">
                      <input
                        type="checkbox"
                        disabled={!oeAlterations.checked}
                        checked={oeAlterations.mista}
                        onChange={(e) =>
                          setOeAlterations({
                            ...oeAlterations,
                            mista: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary disabled:opacity-40 accent-ios-primary print:w-3 print:h-3"
                      />
                      <span
                        className={
                          !oeAlterations.checked
                            ? "text-slate-400"
                            : "font-medium"
                        }
                      >
                        Mista
                      </span>
                    </label>

                    {/* Presença de cerume */}
                    <label className="flex items-center space-x-2.5 cursor-pointer text-sm text-slate-700 select-none print:text-[9px] print:text-black">
                      <input
                        type="checkbox"
                        disabled={!oeAlterations.checked}
                        checked={oeAlterations.cerume}
                        onChange={(e) =>
                          setOeAlterations({
                            ...oeAlterations,
                            cerume: e.target.checked,
                          })
                        }
                        className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary disabled:opacity-40 accent-ios-primary print:w-3 print:h-3"
                      />
                      <span
                        className={
                          !oeAlterations.checked
                            ? "text-slate-400"
                            : "font-medium"
                        }
                      >
                        Presença de cerume
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Nova Seção Separada: Card para Detalhamento de Perda Auditiva por Frequência */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-4 shadow-sm relative overflow-hidden print:border-gray-300 print:rounded-none print:shadow-none print:p-3 print:mb-2">
                {/* Barra de cor decorativa na lateral esquerda do card */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-primary rounded-l-xl print:hidden"></div>

                {/* Título de identificação da nova seção de Perda Auditiva */}
                <div className="flex items-center text-ios-primary font-bold border-b border-slate-100 pb-3 print:border-gray-400 print:pb-1 print:text-black">
                  {/* Ícone de representação visual do bloco */}
                  <FileText className="w-5 h-5 mr-2 print:hidden" />
                  {/* Texto do rótulo da seção */}
                  <span className="text-sm uppercase tracking-wider print:text-xs">
                    Perda Auditiva
                  </span>
                </div>

                {/* Contêiner de seleção para perda auditiva específica por frequência em cada orelha */}
                <div className="text-slate-700 text-sm md:text-base leading-relaxed flex flex-wrap items-center gap-6 print:text-[10px] print:text-black print:leading-normal">
                  {/* Grupo de inputs e rótulo para a Orelha Direita (OD) */}
                  <div className="flex items-center space-x-3">
                    {/* Rótulo em negrito indicando orelha direita e cor vermelha característica */}
                    <span className="font-bold print:text-black">Perda Auditiva <span className="text-red-600 ml-5">OD:</span></span>
                    {/* Opção para frequência de 6000Hz na Orelha Direita */}
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                      {/* Elemento do input checkbox para controle de frequência 6000Hz no OD */}
                      <input
                        type="checkbox"
                        // Controla se a opção 6000Hz da orelha direita está checada (independente do card de alterações clínicas acima)
                        checked={odAlterations.h6000}
                        // Atualiza a chave h6000 mantendo o restante do estado da orelha direita intacto
                        onChange={(e) =>
                          setOdAlterations({
                            ...odAlterations,
                            h6000: e.target.checked,
                          })
                        }
                        // Classes do Tailwind para estilização em tela e na impressão
                        className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary disabled:opacity-40 accent-ios-primary print:w-3 print:h-3"
                      />
                      {/* Texto informativo de frequência */}
                      <span className="font-medium">6000Hz</span>
                    </label>
                    {/* Opção para frequência de 8000Hz na Orelha Direita */}
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                      {/* Elemento do input checkbox para controle de frequência 8000Hz no OD */}
                      <input
                        type="checkbox"
                        // Controla se a opção 8000Hz da orelha direita está checada (independente do card de alterações clínicas acima)
                        checked={odAlterations.h8000}
                        // Atualiza a chave h8000 mantendo o restante do estado da orelha direita intacto
                        onChange={(e) =>
                          setOdAlterations({
                            ...odAlterations,
                            h8000: e.target.checked,
                          })
                        }
                        // Classes do Tailwind para estilização em tela e na impressão
                        className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary disabled:opacity-40 accent-ios-primary print:w-3 print:h-3"
                      />
                      {/* Texto informativo de frequência */}
                      <span className="font-medium">8000Hz</span>
                    </label>
                  </div>

                  {/* Grupo de inputs e rótulo para a Orelha Esquerda (OE) */}
                  <div className="flex items-center space-x-3">
                    {/* Rótulo em negrito indicando orelha esquerda e cor azul característica */}
                    <span className="font-bold text-blue-600 print:text-black">OE:</span>
                    {/* Opção para frequência de 6000Hz na Orelha Esquerda */}
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                      {/* Elemento do input checkbox para controle de frequência 6000Hz no OE */}
                      <input
                        type="checkbox"
                        // Controla se a opção 6000Hz da orelha esquerda está checada (independente do card de alterações clínicas acima)
                        checked={oeAlterations.h6000}
                        // Atualiza a chave h6000 mantendo o restante do estado da orelha esquerda intacto
                        onChange={(e) =>
                          setOeAlterations({
                            ...oeAlterations,
                            h6000: e.target.checked,
                          })
                        }
                        // Classes do Tailwind para estilização em tela e na impressão
                        className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary disabled:opacity-40 accent-ios-primary print:w-3 print:h-3"
                      />
                      {/* Texto informativo de frequência */}
                      <span className="font-medium">6000Hz</span>
                    </label>
                    {/* Opção para frequência de 8000Hz na Orelha Esquerda */}
                    <label className="flex items-center space-x-1.5 cursor-pointer select-none">
                      {/* Elemento do input checkbox para controle de frequência 8000Hz no OE */}
                      <input
                        type="checkbox"
                        // Controla se a opção 8000Hz da orelha esquerda está checada (independente do card de alterações clínicas acima)
                        checked={oeAlterations.h8000}
                        // Atualiza a chave h8000 mantendo o restante do estado da orelha esquerda intacto
                        onChange={(e) =>
                          setOeAlterations({
                            ...oeAlterations,
                            h8000: e.target.checked,
                          })
                        }
                        // Classes do Tailwind para estilização em tela e na impressão
                        className="w-4 h-4 text-ios-primary border-slate-300 rounded focus:ring-ios-primary disabled:opacity-40 accent-ios-primary print:w-3 print:h-3"
                      />
                      {/* Texto informativo de frequência */}
                      <span className="font-medium">8000Hz</span>
                    </label>
                  </div>
                </div>
              </div>

            {/* Seção 3: Observações do Laudo com Textarea Interativo */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 space-y-3 shadow-sm relative overflow-hidden print:border-gray-300 print:rounded-none print:shadow-none print:p-3 print:mb-2">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-primary rounded-l-xl print:hidden"></div>

              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider print:text-[9px] print:text-black">
                OBS:
              </label>
              <div className="flex-1 flex flex-col">
                <textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  className="w-full min-h-[80px] p-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 text-sm resize-y custom-scrollbar print:hidden"
                  placeholder="Descreva quaisquer observações clínicas adicionais do laudo..."
                />
                {/* Layout de linhas de pauta de observações estilizado exclusivamente para impressão */}
                <div className="hidden print:flex flex-col w-full text-[10px] text-black">
                  <div className="border-b border-gray-400 min-h-[1.2rem] py-0.5 px-1 font-medium">
                    {observacoes || "Nenhuma observação clínica registrada."}
                  </div>
                  <div className="border-b border-gray-400 min-h-[1.2rem]"></div>
                </div>
              </div>
            </div>

            {/* Seção 4: Bloco de Texto Normativo Final */}
            <div className="bg-slate-100/50 border border-slate-200/60 rounded-xl p-6 text-slate-600 text-sm leading-relaxed text-justify print:bg-transparent print:border-0 print:p-0 print:text-[10px] print:text-black print:leading-normal print:text-justify">
              Declaro ainda que, fui orientado (a) quanto a obrigatoriedade do
              uso contínuo dos Protetores Auditivos, dos riscos que estarei
              exposto e dos cuidados que deverei ter com a audição estando
              consciente de que o não cumprimento as orientações poderão
              acarretar agravamento da perda auditiva.
            </div>

            {/* Seção 5: Cidade e Data Atual com Formatação Dinâmica por Extenso */}
            <div className="flex items-center text-slate-800 text-sm font-semibold pt-2 print:text-[10px] print:text-black print:pt-4">
              <span className="tracking-wide">
                Conselheiro Lafaiete,{" "}
                <span className="underline font-bold px-1">{dia}</span> de{" "}
                <span className="underline font-bold px-1">{mes}</span> de{" "}
                <span className="underline font-bold px-1">{ano}</span>.
              </span>
            </div>

            {/* Seção 6: Assinaturas Delimitadas em Duas Colunas */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-8 print:grid-cols-2 print:gap-12 print:pt-10">
              {/* Assinatura do Examinador (Fonoaudióloga) */}
              <div className="flex flex-col items-center justify-end">
                {/* Imagem física de assinatura da examinadora com escala calibrada */}
                <img
                  src={sigImage}
                  alt="Assinatura Fonoaudióloga"
                  className="h-14 object-contain mb-1"
                />
                {/* Linha delimitadora da assinatura no laudo */}
                <div className="w-full max-w-[280px] border-b border-slate-400 mb-2 print:border-black"></div>
                {/* Bloco de Rótulo identificativo do profissional e Conselho */}
                <div className="flex flex-col items-center space-y-0.5 text-center">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wide print:text-[8px] print:text-black">
                    Jordânia G. S. Rodrigues
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider print:text-[7px] print:text-black">
                    FONOAUDIÓLOGA - CRFa-MG 4566
                  </span>
                  <span className="text-[9px] font-semibold text-slate-400 uppercase print:text-[6px] print:text-black">
                    Assinatura e carimbo do examinador
                  </span>
                </div>
              </div>

              {/* Assinatura do Funcionário/Colaborador (Interativa com Modal) */}
              <div className="flex flex-col items-center pt-1">
                {employeeSignature ? (
                  // Exibe a assinatura capturada no modal
                  <div className="relative group flex flex-col items-center">
                    <img
                      src={employeeSignature}
                      alt="Assinatura do Funcionário"
                      className="h-14 object-contain mb-1"
                    />
                    {/* Botão flutuante para refazer ou limpar a assinatura em tela */}
                    <button
                      type="button"
                      onClick={() => setIsEmployeeSigOpen(true)}
                      className="absolute -top-3 -right-6 p-1 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full border border-gray-200 shadow-sm transition-all active:scale-90 print:hidden animate-bounce"
                      title="Refazer assinatura"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  // Exibe botão de chamada interativo quando não houver assinatura registrada
                  <button
                    type="button"
                    onClick={() => setIsEmployeeSigOpen(true)}
                    className="flex flex-col items-center group focus:outline-none transition-all active:scale-95 mb-1 print:hidden"
                    title="Clique para assinar"
                  >
                    {/* Ícone de caneta do lucide-react para clique com transição estilizada */}
                    <ClipboardList className="w-8 h-8 text-slate-300 group-hover:text-ios-primary group-hover:scale-110 transition-all mb-1" />
                    <span className="text-[9px] text-ios-primary font-black opacity-0 group-hover:opacity-100 transition-opacity">
                      CLIQUE PARA ASSINAR
                    </span>
                  </button>
                )}

                {/* Espaço reservado invisível para manter altura harmônica no laudo técnico impresso */}
                {!employeeSignature && (
                  <div className="hidden print:block h-14  w-full"></div>
                )}

                {/* Linha delimitadora da assinatura do colaborador */}
                <div className="w-full max-w-[280px] border-b border-slate-400 mb-2 print:border-black"></div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest text-center print:text-[8px] print:text-black">
                  Assinatura do Funcionário
                </span>
              </div>
            </div>
          </div>

          {/* Rodapé do Modal com Botões de Controle e Ações Especiais (Oculto na Impressão) */}
          <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0 print:hidden">
            {/* Botão de Fechar */}
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-lg border border-slate-300 hover:bg-slate-100 active:scale-95 transition-all text-xs font-bold text-slate-600"
            >
              Fechar
            </button>

            <div className="flex items-center space-x-3">
              {/* Botão de Confirmar Termo (Dispara o callback onSave) */}
              <button
                type="button"
                onClick={() => {
                  if (onSave) {
                    onSave({
                      nome,
                      documento,
                      empresa,
                      funcao,
                      odAlterations,
                      oeAlterations,
                      observacoes,
                      employeeSignature,
                    });
                  }
                  onClose();
                }}
                className="px-6 py-2.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 active:scale-95 transition-all text-xs font-bold flex items-center shadow-md shadow-emerald-600/20"
              >
                <CheckCircle2 className="w-4 h-4 mr-2" />
                Confirmar Termo
              </button>

              {/* Botão de Impressão Direta do Termo */}
              <button
                type="button"
                onClick={() => window.print()}
                className="px-6 py-2.5 rounded-lg bg-ios-primary text-white hover:bg-ios-primary/95 shadow-md shadow-ios-primary/20 active:scale-95 transition-all text-xs font-bold flex items-center"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir Termo
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Assinatura do Funcionário (Declarado fora do wrapper principal para se manter visível quando ele for ocultado) */}
      <SignatureScreen
        isOpen={isEmployeeSigOpen}
        onClose={() => setIsEmployeeSigOpen(false)}
        onSave={(dataUrl) => {
          setEmployeeSignature(dataUrl);
          setIsEmployeeSigOpen(false);
        }}
      />
    </>
  );
}
