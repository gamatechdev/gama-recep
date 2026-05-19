import React, { useState } from "react";
import { Headphones, ClipboardList } from "lucide-react";
import { Audiometria } from "./Audiometria";
import { Anamnese } from "./Anamnese";
import { Agendamento } from "../../types";

// Interface para os dados cadastrais do paciente compartilhados entre as abas
export interface PatientData {
  // Nome completo do colaborador
  nome: string;
  // Documento principal (CPF ou identificador)
  documento: string;
  // Registro Geral do colaborador
  rg: string;
  // Nome da empresa contratante
  empresa: string;
  // Cargo ou setor de atuação
  funcao: string;
  // Sexo biológico (Feminino ou Masculino)
  sexo: string;
  // Data de nascimento do paciente
  dataNascimento: string;
  // Data de realização do atendimento/exame
  dataExame: string;
  // Tempo de repouso acústico anterior ao exame
  repouso: string;
}

// Interface das propriedades do menu de audiometria
interface AudiometriaMenuProps {
  // Dados do agendamento carregados
  appointment?: Agendamento | null;
}

// Componente de menu principal que gerencia as abas da área de exames audiométricos e anamnese
export function AudiometriaMenu({ appointment }: AudiometriaMenuProps) {
  // Estado para controlar a aba ativa (audiometria por padrão)
  const [activeTab, setActiveTab] = useState< "anamnese" |"audiometria">(
    "anamnese",
  );

  // Estado compartilhado para os dados cadastrais do paciente (garante sincronização automática em tempo real entre exames)
  const [patientData, setPatientData] = useState<PatientData>({
    // Inicializa o nome do colaborador
    nome: appointment?.colaboradores?.nome || "",
    // Inicializa o CPF do colaborador
    documento: appointment?.colaboradores?.cpf || "",
    // Inicializa o RG vazio para preenchimento manual
    rg: "",
    // Inicializa o nome da empresa/unidade
    empresa: appointment?.unidades?.nome_unidade || "",
    // Inicializa a função/setor do colaborador
    funcao: appointment?.colaboradores?.setor || "",
    // Inicializa a descrição textual do sexo do colaborador
    sexo:
      appointment?.colaboradores?.sexo === "F"
        ? "Feminino"
        : appointment?.colaboradores?.sexo === "M"
          ? "Masculino"
          : "",
    // Inicializa a data de nascimento
    dataNascimento: appointment?.colaboradores?.data_nascimento || "",
    // Inicializa a data do exame
    dataExame: appointment?.data_atendimento || "",
    // Inicializa o repouso acústico padrão vazio
    repouso: "",
  });

  return (
    <div className="w-full space-y-6">
      {/* Header com Seletor de Abas Estilo iOS */}
      <div className="flex justify-center pt-2 print:hidden">
        <div className="bg-gray-100/80 backdrop-blur-md p-1 rounded-ios flex w-full max-w-md border border-gray-200 shadow-sm">
          {/* Aba Anamnese */}
          <button
            onClick={() => setActiveTab("anamnese")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-ios-sm transition-all duration-300 ${
              activeTab === "anamnese"
                ? "bg-white text-ios-primary shadow-md scale-100"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 scale-95"
            }`}
          >
            <ClipboardList
              className={`w-4 h-4 ${activeTab === "anamnese" ? "text-ios-primary" : "text-gray-400"}`}
            />
            <span className="text-sm font-semibold">Anamnese</span>
          </button>

          {/* Aba Audiometria */}
          <button
            onClick={() => setActiveTab("audiometria")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-ios-sm transition-all duration-300 ${
              activeTab === "audiometria"
                ? "bg-white text-ios-primary shadow-md scale-100"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 scale-95"
            }`}
          >
            <Headphones
              className={`w-4 h-4 ${activeTab === "audiometria" ? "text-ios-primary" : "text-gray-400"}`}
            />
            <span className="text-sm font-semibold">Audiometria</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Dinâmico */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "audiometria" ? (
          // Renderiza a ficha de audiometria passando o estado comum de cadastro do paciente
          <Audiometria
            appointment={appointment}
            patientData={patientData}
            setPatientData={setPatientData}
          />
        ) : (
          // Renderiza o questionário de anamnese passando o mesmo estado comum de cadastro do paciente
          <Anamnese
            appointment={appointment}
            patientData={patientData}
            setPatientData={setPatientData}
          />
        )}
      </div>
    </div>
  );
}
