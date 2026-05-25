import React, { useState } from "react";
// Importamos o ícone de atividade do Lucide para o botão flutuante de testes
import { Activity } from "lucide-react";
import { Audiometria } from "./Audiometria";
import { Anamnese } from "./Anamnese";
import { Agendamento } from "../../types";
import gamaicon from "../ui/grade/gamaicon.png";

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
  // Função para fechar o menu e voltar à tela anterior
  onClose?: () => void;
}

// Componente de menu principal que gerencia as abas da área de exames audiométricos e anamnese
export function AudiometriaMenu({ appointment, onClose }: AudiometriaMenuProps) {
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

  // Estado das respostas do questionário da Anamnese compartilhado com a impressão do PDF
  const [anamneseAnswers, setAnamneseAnswers] = useState<Record<string, string>>({});
    // Dispara a atualização do trigger local para que a tela de audiometria saiba que deve mockar seus dados internos
  return (
    // Container principal da página de exames
    <div className="w-full space-y-6">
      <div className="relative">
        {/* Painel da Anamnese: visível na tela quando a aba ativa for "anamnese" */}
        <div className={`animate-in fade-in duration-500 ${activeTab === "anamnese" ? "block" : "hidden"}`}>
          <Anamnese
            appointment={appointment}
            patientData={patientData}
            setPatientData={setPatientData}
            answers={anamneseAnswers}
            setAnswers={setAnamneseAnswers}
            onSaveSuccess={() => setActiveTab("audiometria")}
          />
        </div>

        {/* Painel da Audiometria: visível na tela quando a aba ativa for "audiometria" */}
        <div className={`animate-in fade-in duration-500 ${activeTab === "audiometria" ? "block" : "hidden"}`}>
          {/* Componente Audiometria recebendo propriedades cadastrais, respostas e funções de atualização */}
          <Audiometria
            // Dados do agendamento carregados do banco de dados
            appointment={appointment}
            // Estado contendo os dados cadastrais em tempo real do paciente
            patientData={patientData}
            // Função para atualizar os dados cadastrais do paciente de forma global
            setPatientData={setPatientData}
            // Respostas do formulário de anamnese
            anamneseAnswers={anamneseAnswers}
            // Callback disparado ao acionar o botão de retornar
            onBack={() => setActiveTab("anamnese")}
            // Callback disparado quando o documento for salvo com sucesso
            onSaveSuccess={onClose}
          />
        </div>
      </div>
    </div>
  );
}
