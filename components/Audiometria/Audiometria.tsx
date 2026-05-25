import React, { useState, useEffect, useRef } from "react";
// Importamos os ícones do lucide-react para enriquecer a interface visual
import {
  Stethoscope,
  User,
  Briefcase,
  FileText,
  Activity,
  Headphones,
  CheckCircle2,
  Trash2,
  Undo2,
  PencilIcon,
  Check,
  X,
} from "lucide-react";

import { Agendamento } from "../../types";

// Importamos a assinatura padrão digitalizada do fonoaudiólogo
import sigImage from "../ui/grade/sig.png";

// Importamos os novos componentes modularizados criados para desacoplar a lógica
import { GradeAudiometria, GradeAudiometriaRef, Point, Line } from "./GradeAudiometria";
import { SignatureScreen } from "./SignatureScreen";
import { LaudoPerda } from "./LaudoPerda";
// Importamos o tipo PatientData compartilhado entre exames
import { PatientData } from "./AudiometriaMenu";

// Importa o cliente de conexão do Supabase
import { supabase } from "../../supabaseClient";
// Importa a função pdf do react-pdf para renderização em memória
import { pdf } from '@react-pdf/renderer';
// Importa o componente template que renderiza as páginas do PDF
import { AudiometriaPDFTemplate } from "./AudiometriaPDFTemplate";
// Importa a biblioteca de notificações do Sonner para exibir feedbacks de sucesso e erro
import { toast } from "sonner";

interface AudiometriaProps {
  // O agendamento recebido (opcional) do banco de dados
  appointment?: Agendamento | null;
  // Estado compartilhado dos dados cadastrais do paciente
  patientData?: PatientData;
  // Respostas da anamnese passadas do menu
  anamneseAnswers?: Record<string, string>;
  // Função reativa para alterar o estado do paciente de forma global
  setPatientData?: React.Dispatch<React.SetStateAction<PatientData>>;
  // Callback para retornar à aba anterior
  onBack?: () => void;
  // Callback disparado quando o documento for salvo com sucesso
  onSaveSuccess?: () => void;
}

// Função auxiliar para adicionar sufixo (dB ou %)
const formatInputWithSuffix = (value: string, suffix: string) => {
  const onlyNumbers = value.replace(/\D/g, "");
  if (!onlyNumbers) return "";
  return `${onlyNumbers}${suffix}`;
};

// Componente principal para o formulário de Audiometria Ocupacional
export function Audiometria({
  appointment,
  patientData,
  anamneseAnswers,
  setPatientData,
  onBack,
  onSaveSuccess
}: AudiometriaProps) {
  // Estados para os campos de Meatoscopia (OD e OE) para sincronização e exibição duplicada no PDF
  const [meatoscopiaOD, setMeatoscopiaOD] = useState("");
  const [meatoscopiaOE, setMeatoscopiaOE] = useState("");

  // Estado para o campo de observações
  const [observacoes, setObservacoes] = useState("");

  // Estado para mostrar o preview do PDF no Modal
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);

  // Estado para controlar a visibilidade do modal de assinatura do funcionário
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  // Estado para armazenar o traçado final da assinatura em formato Base64 (DataURL)
  const [employeeSignature, setEmployeeSignature] = useState<string | null>(
    null,
  );
  // Estado para controlar a visibilidade do modal do Termo de Reconhecimento de Perda Auditiva
  const [isTermoModalOpen, setIsTermoModalOpen] = useState(false);
  // Estado para armazenar o tipo de exame selecionado (Admissional, Periódico, etc.)
  const [tipoExame, setTipoExame] = useState<string>(
    appointment?.tipo || "Admissional",
  );
  // Estado para armazenar os dados preenchidos e confirmados do Termo de Perda Auditiva
  const [termoData, setTermoData] = useState<{
    // Nome completo do colaborador
    nome: string;
    // CPF ou documento de identificação do colaborador
    documento: string;
    // Nome fantasia ou razão social da empresa do colaborador
    empresa: string;
    // Função ou cargo atual ocupado pelo colaborador
    funcao: string;
    // Detalhes sobre as alterações da orelha direita (OD)
    odAlterations: {
      // Estado indicando se a orelha direita possui alguma alteração
      checked: boolean;
      // Indicador se a alteração na OD é do tipo neurossensorial
      neurosensorial: boolean;
      // Indicador se a alteração na OD é do tipo condutiva
      condutiva: boolean;
      // Indicador se a alteração na OD é do tipo mista
      mista: boolean;
      // Indicador de presença de cerume no conduto da OD
      cerume: boolean;
      // Indicador de perda na frequência de 6000Hz na OD
      h6000?: boolean;
      // Indicador de perda na frequência de 8000Hz na OD
      h8000?: boolean;
    };
    // Detalhes sobre as alterações da orelha esquerda (OE)
    oeAlterations: {
      // Estado indicando se a orelha esquerda possui alguma alteração
      checked: boolean;
      // Indicador se a alteração na OE é do tipo neurossensorial
      neurosensorial: boolean;
      // Indicador se a alteração na OE é do tipo condutiva
      condutiva: boolean;
      // Indicador se a alteração na OE é do tipo mista
      mista: boolean;
      // Indicador de presença de cerume no conduto da OE
      cerume: boolean;
      // Indicador de perda na frequência de 6000Hz na OE
      h6000?: boolean;
      // Indicador de perda na frequência de 8000Hz na OE
      h8000?: boolean;
    };
    // Campo de texto livre contendo observações clínicas adicionais
    observacoes: string;
    // Assinatura digitalizada em formato Base64 do colaborador ou nulo se não assinado
    employeeSignature: string | null;
  } | null>(null);

  // Novos estados para mapear os campos não controlados e enviar em JSON
  const [gradeData, setGradeData] = useState<{ pointsOD: Point[], pointsOE: Point[], linesOD: Line[], linesOE: Line[] } | null>(null);
  
  // Referência para o componente GradeAudiometria, permitindo exportar as imagens desenhadas
  const gradeAudiometriaRef = useRef<GradeAudiometriaRef>(null);

  const [audiometroData, setAudiometroData] = useState({
    marca: "VIBRASOM",
    modelo: "AVS-500",
    calibracao: ""
  });

  const [logoAudiometriaData, setLogoAudiometriaData] = useState({
    lrfODIntensidade: "", lrfODMonossil: "", lrfODDissil: "",
    lrfOEIntensidade: "", lrfOEMonossil: "", lrfOEDissil: "",
    iprfODIntensidade: "", iprfODMonossil: "", iprfODDissil: "",
    iprfOEIntensidade: "", iprfOEMonossil: "", iprfOEDissil: ""
  });

  const [laudoData, setLaudoData] = useState({
    limiaresAceitaveis: { od: false, oe: false, bilateral: false },
    perdaOD: { checked: false, neurosensorial: false, mista: false, condutiva: false, h6000: false, h8000: false },
    perdaOE: { checked: false, neurosensorial: false, mista: false, condutiva: false, h6000: false, h8000: false }
  });

  const [isGenerating, setIsGenerating] = useState(false);



  // Toda a lógica de desenho da grade audiométrica (OD/OE) e da assinatura digital foi transferida para componentes dedicados.

  // Função para salvar os dados da audiometria no Supabase
  // Declara a função assíncrona responsável por salvar o exame e fazer upload do PDF
  const handleSaveAudiometria = async () => {
    // Verifica se existe um colaborador associado ao agendamento
    if (!appointment?.colaborador_id) {
      // Exibe notificação flutuante de erro se o colaborador não for encontrado
      toast.error("Erro: Colaborador não identificado.");
      // Aborta a execução do salvamento
      return;
    }

    setIsGenerating(true);

    try {
      console.log("[DEBUG] Capturando imagens da grade de audiometria...");
      let capturedGrids = { imageOD: '', imageOE: '' };
      
      if (gradeAudiometriaRef.current) {
        capturedGrids = await gradeAudiometriaRef.current.exportImages();
      }

      console.log("[DEBUG] Renderizando o Template PDF em memória com React-PDF...");
      
      const doc = <AudiometriaPDFTemplate 
        patientData={patientData}
        anamneseAnswers={anamneseAnswers || {}}
        audiometroData={audiometroData}
        logoAudiometriaData={logoAudiometriaData}
        laudoData={laudoData}
        gradeData={gradeData}
        observacoes={observacoes}
        meatoscopiaOD={meatoscopiaOD}
        meatoscopiaOE={meatoscopiaOE}
        employeeSignature={employeeSignature}
        tipoExame={tipoExame}
        termoData={termoData}
        gradeImageOD={capturedGrids.imageOD}
        gradeImageOE={capturedGrids.imageOE}
      />;

      // Chama a biblioteca para desenhar e empacotar como BLOB nativo
      const pdfBlob = await pdf(doc).toBlob();

      // [NOVO] Mostra o PDF no modal gerado pelo React-PDF
      const pdfUrl = URL.createObjectURL(pdfBlob);
      setPdfPreviewUrl(pdfUrl);

      console.log("[DEBUG] Iniciando upload para o Supabase...");
      // 2. Upload para o Supabase Storage (bucket: audiometria)
      const timestamp = new Date().getTime();
      const fileName = `${appointment.colaborador_id}_${timestamp}.pdf`;

      const arrayBuffer = await pdfBlob.arrayBuffer();

      console.log("[DEBUG] Arquivo preparado. Tamanho:", (arrayBuffer.byteLength / 1024 / 1024).toFixed(2), "MB. Enviando API nativa...");

      // Pegamos o token do Supabase para fazer um fetch direto (mais confiável que o wrapper .upload() com arquivos grandes)
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;

      // Faz o upload direto do buffer do PDF para a API REST do Supabase Storage
      const response = await fetch(`${supabaseUrl}/storage/v1/object/audiometria/${fileName}`, {
        // Define o método POST para criação de novo objeto no bucket
        method: 'POST',
        // Define os headers de autorização e o tipo de conteúdo como PDF
        headers: {
          // Passa o token de acesso (sessão do usuário ou anon key) no Bearer
          'Authorization': `Bearer ${token}`,
          // Passa a chave anônima nos headers exigida pelo gateway REST do Supabase
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
          // Define que o corpo da requisição é um arquivo do tipo PDF
          'Content-Type': 'application/pdf',
        },
        // Envia o arrayBuffer contendo os bytes do PDF
        body: arrayBuffer
      });

      if (!response.ok) {
        const errJson = await response.json();
        console.error("[DEBUG] Erro no upload:", errJson);
        throw new Error(errJson.message || "Falha ao fazer upload da audiometria.");
      }
      console.log("[DEBUG] Upload concluído com sucesso!");

      // Pegar a URL pública do PDF salvo
      const { data: publicUrlData } = supabase.storage
        .from('audiometria')
        .getPublicUrl(fileName);
        
      const publicUrl = publicUrlData.publicUrl;

      // 3. Montar o payload JSON que será salvo na coluna 'documento'
      const documentoJson = {
        // Contém os dados cadastrais do paciente (nome, cpf, rg, empresa, etc)
        patientData,
        // Inclui as respostas completas coletadas na etapa de anamnese
        anamneseAnswers: anamneseAnswers || {},
        // Contém o diagnóstico clínico visual da orelha direita
        meatoscopiaOD,
        // Contém o diagnóstico clínico visual da orelha esquerda
        meatoscopiaOE,
        // Contém o laudo e considerações clínicas gerais escritas pela fonoaudióloga
        observacoes,
        // Contém o tipo do exame ocupacional (admissional, periódico, demissional, etc)
        tipoExame,
        // Contém as opções e assinaturas confirmadas no Termo de Perda Auditiva
        termoData,
        // Contém a imagem em Base64 da assinatura capturada do funcionário
        employeeSignature,
        // Contém a lista de coordenadas e símbolos das linhas e pontos da grade OD/OE
        gradeData,
        // Contém a marca, modelo e calibração do equipamento audiômetro utilizado
        audiometroData,
        // Contém as tabelas de limiar de recepção de fala (LRF) e índice de reconhecimento de fala (IPRF)
        logoAudiometriaData,
        // Contém a classificação do laudo de limiares aceitáveis e perdas por frequência
        laudoData,
        // Base64 gerado a partir do Canvas mesclado com o Background
        gradeImageOD: capturedGrids.imageOD,
        gradeImageOE: capturedGrids.imageOE
      };

      // Fazemos a inserção na tabela 'audiometria'
      const { data, error } = await supabase
        .from('audiometria')
        .insert([
          {
            colaborador: appointment.colaborador_id,
            documento: documentoJson,
            audiometria_url: publicUrl // Link gerado pelo storage
          }
        ]);

      if (error) throw error;

      // 4. Marcar o agendamento como finalizado na tabela de agendamentos
      await supabase
        .from('agendamentos')
        .update({ audiometria: 'Finalizado' })
        .eq('id', appointment.id);

      // Loga no console do navegador para depuração
      console.log("Audiometria salva com sucesso!", data);
      // Apresenta notificação de sucesso na interface visual do usuário
      toast.success("Audiometria salva com sucesso!");
      
      if (onSaveSuccess) {
        onSaveSuccess();
      }
    // Captura qualquer erro disparado em qualquer etapa do fluxo try
    } catch (err: any) {
      // Registra o erro no console para análise do desenvolvedor
      console.error("Erro inesperado na requisição:", err);
      // Apresenta notificação contendo o erro técnico para o usuário na interface
      toast.error(`Erro inesperado ao tentar salvar: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Retornamos a estrutura principal do componente com uma div que ocupa todo o espaço
  return (
    // Div principal com padding, fundo claro, permitindo scroll caso necessário (Ajustado para max-w-4xl para perfeita centralização das grades empilhadas de 750px)
    <div id="pdf-container" className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Botão de Voltar - Topo (Exibido no fundo da página, fora do card) */}
      {onBack && (
        <div className="flex justify-start -mb-2">
          <button
            onClick={onBack}
            className="group flex items-center justify-center space-x-2 text-gray-500 hover:text-ios-primary transition-colors hover:bg-white/60 px-4 py-2 rounded-lg active:scale-95 font-medium shadow-sm border border-transparent hover:border-gray-200/60"
            title="Voltar para Anamnese"
          >
            <Undo2 className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span>Voltar para Anamnese</span>
          </button>
        </div>
      )}



      {/* Formal Print Header (Hidden on screen) */}
      <div className="hidden text-center mb-4">
        <h1 className="text-xl font-bold uppercase pb-2 tracking-widest text-black">
          Protocolo de Audiometria Ocupacional
        </h1>
      </div>

      {/* Cabeçalho principal com efeito de vidro e sombra flutuante */}
      <div className="glass-panel p-6 rounded-ios shadow-float border border-ios-primary/20 flex items-center justify-center bg-white/80">
        {/* Ícone de fone de ouvido para remeter a audiometria */}
        <Headphones className="w-8 h-8 text-ios-primary mr-3" />
        {/* Título do documento */}
        <h1 className="text-2xl font-bold text-ios-text tracking-tight uppercase">
          Protocolo de Audiometria Ocupacional
        </h1>
      </div>

      {/* Seção 1: Dados do Paciente e Empresa */}
      {/* Container com fundo branco arredondado para agrupar as informações */}
      <div className="bg-white rounded-ios shadow-sm border border-ios-divider p-6 space-y-4 relative overflow-hidden">
        {/* Barra lateral de cor azul para dar um charme visual premium */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-primary rounded-l-ios"></div>

        {/* Cabeçalho da seção com ícone de usuário */}
        <div className="flex items-center text-ios-primary font-semibold mb-4 border-b border-ios-divider pb-2">
          <User className="w-5 h-5 mr-2" />
          <span className="uppercase">
            DADOS DO PACIENTE
          </span>
        </div>

        {/* Contêiner de Dados do Paciente organizado em fluxo de blocos adaptáveis */}
        <div className="flex flex-col gap-4">
          {/* Linha 1: Pareamento de Empresa e Nome na impressão, mantendo grid responsivo em tela */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Bloco do Campo Empresa */}
            <div className="flex flex-col">
              {/* Rótulo descritivo com cor padrão iOS e largura mínima na impressão */}
              <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider">
                Empresa
              </label>
              {/* Input reativo conectado ao estado global do paciente */}
              <input
                type="text"
                value={patientData?.empresa || ""}
                onChange={(e) =>
                  setPatientData &&
                  setPatientData((prev) => ({ ...prev, empresa: e.target.value }))
                }
                className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm"
                placeholder="Nome da Empresa"
              />
            </div>

            {/* Bloco do Campo Nome */}
            <div className="flex flex-col">
              {/* Rótulo descritivo com cor padrão iOS e largura mínima na impressão */}
              <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider">
                Nome
              </label>
              {/* Input reativo conectado ao estado global do paciente */}
              <input
                type="text"
                value={patientData?.nome || ""}
                onChange={(e) =>
                  setPatientData &&
                  setPatientData((prev) => ({ ...prev, nome: e.target.value }))
                }
                className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm"
                placeholder="Nome completo"
              />
            </div>
          </div>

          {/* Linha 2: Pareamento de Função e Sexo na impressão, mantendo grid responsivo em tela */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Bloco do Campo Função */}
            <div className="flex flex-col">
              {/* Rótulo descritivo com cor padrão iOS e largura mínima na impressão */}
              <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider">
                Função
              </label>
              {/* Input reativo de função conectado ao estado global */}
              <input
                type="text"
                value={patientData?.funcao || ""}
                onChange={(e) =>
                  setPatientData &&
                  setPatientData((prev) => ({ ...prev, funcao: e.target.value }))
                }
                className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm"
                placeholder="Função do Colaborador"
              />
            </div>

            {/* Bloco do Grupo de Sexo */}
            <div className="flex flex-col">
              {/* Rótulo descritivo com cor padrão iOS e largura mínima na impressão */}
              <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider">
                Sexo
              </label>
              {/* Contêiner de seleção com radio buttons para masculino e feminino */}
              <div className="flex space-x-4 items-center h-full pt-1">
                {/* Seleção Feminino */}
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="sexo"
                    value="Feminino"
                    checked={patientData?.sexo === "Feminino"}
                    onChange={() =>
                      setPatientData &&
                      setPatientData((prev) => ({ ...prev, sexo: "Feminino" }))
                    }
                    className="text-ios-primary focus:ring-ios-primary accent-ios-primary w-4 h-4"
                  />
                  <span className="text-sm text-ios-text group-hover:text-ios-primary transition-colors">
                    Feminino
                  </span>
                </label>
                {/* Seleção Masculino */}
                <label className="flex items-center space-x-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="sexo"
                    value="Masculino"
                    checked={patientData?.sexo === "Masculino"}
                    onChange={() =>
                      setPatientData &&
                      setPatientData((prev) => ({ ...prev, sexo: "Masculino" }))
                    }
                    className="text-ios-primary focus:ring-ios-primary accent-ios-primary w-4 h-4"
                  />
                  <span className="text-sm text-ios-text group-hover:text-ios-primary transition-colors">
                    Masculino
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Linha 3: Pareamento de CPF e RG lado a lado (tanto na tela quanto na impressão) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
            {/* Bloco de CPF e RG aninhados */}
            <div className="grid grid-cols-2 gap-4">
              {/* Campo CPF */}
              <div className="flex flex-col">
                <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider">
                  CPF
                </label>
                <input
                  type="text"
                  value={patientData?.documento || ""}
                  onChange={(e) =>
                    setPatientData &&
                    setPatientData((prev) => ({
                      ...prev,
                      documento: e.target.value,
                    }))
                  }
                  className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm"
                  placeholder="000.000.000-00"
                />
              </div>
              {/* Campo RG */}
              <div className="flex flex-col">
                <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider">
                  RG
                </label>
                <input
                  type="text"
                  value={patientData?.rg || ""}
                  onChange={(e) =>
                    setPatientData &&
                    setPatientData((prev) => ({ ...prev, rg: e.target.value }))
                  }
                  className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm"
                  placeholder="RG"
                />
              </div>
            </div>
            {/* Bloco em branco para equilibrar o grid lateral na tela normal */}
            <div className="hidden md:block"></div>
          </div>

          {/* Linha 4: Pareamento de Nascimento, Exame e Repouso na impressão, mantendo grid na tela */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
            {/* Bloco do Campo Data de Nascimento */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider">
                Nasc.
              </label>
              <input
                type="date"
                value={patientData?.dataNascimento || ""}
                onChange={(e) =>
                  setPatientData &&
                  setPatientData((prev) => ({
                    ...prev,
                    dataNascimento: e.target.value,
                  }))
                }
                className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm text-ios-text"
              />
            </div>

            {/* Bloco do Campo Data do Exame */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider">
                Exame
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
                className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm text-ios-text"
              />
            </div>

            {/* Bloco do Campo Repouso Auditivo */}
            <div className="flex flex-col">
              <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider">
                Repouso
              </label>
              <input
                type="text"
                value={patientData?.repouso || "14 horas"}
                readOnly
                className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm text-ios-text"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Seção 2: Tipo de Exame */}
      <div className="bg-white rounded-ios shadow-sm border border-ios-divider p-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-secondary rounded-l-ios"></div>
        <div className="flex items-center text-ios-secondary font-semibold mb-4 border-b border-ios-divider pb-2">
          <Briefcase className="w-5 h-5 mr-2" />
          <span className="uppercase">
            TIPO DE EXAME
          </span>
        </div>

        {/* Grid de checkboxes para exibição em tela (oculto na impressão) */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Opção de Exame Admissional */}
          <label className="flex items-center space-x-2 cursor-pointer bg-ios-bg p-3 rounded-ios-sm border border-transparent hover:border-ios-secondary/30 transition-colors">
            <input
              type="checkbox"
              checked={tipoExame === "Admissional"}
              onChange={() => setTipoExame("Admissional")}
              className="text-ios-secondary focus:ring-ios-secondary rounded accent-ios-secondary w-4 h-4"
            />
            <span className="text-sm font-medium text-ios-text">
              Admissional
            </span>
          </label>
          {/* Opção de Exame Periódico */}
          <label className="flex items-center space-x-2 cursor-pointer bg-ios-bg p-3 rounded-ios-sm border border-transparent hover:border-ios-secondary/30 transition-colors">
            <input
              type="checkbox"
              checked={tipoExame === "Periódico"}
              onChange={() => setTipoExame("Periódico")}
              className="text-ios-secondary focus:ring-ios-secondary rounded accent-ios-secondary w-4 h-4"
            />
            <span className="text-sm font-medium text-ios-text">Periódico</span>
          </label>
          {/* Opção de Exame Demissional */}
          <label className="flex items-center space-x-2 cursor-pointer bg-ios-bg p-3 rounded-ios-sm border border-transparent hover:border-ios-secondary/30 transition-colors">
            <input
              type="checkbox"
              checked={tipoExame === "Demissional"}
              onChange={() => setTipoExame("Demissional")}
              className="text-ios-secondary focus:ring-ios-secondary rounded accent-ios-secondary w-4 h-4"
            />
            <span className="text-sm font-medium text-ios-text">
              Demissional
            </span>
          </label>
          {/* Opção de Exame de Retorno ao Trabalho */}
          <label className="flex items-center space-x-2 cursor-pointer bg-ios-bg p-3 rounded-ios-sm border border-transparent hover:border-ios-secondary/30 transition-colors">
            <input
              type="checkbox"
              checked={tipoExame === "Retorno"}
              onChange={() => setTipoExame("Retorno")}
              className="text-ios-secondary focus:ring-ios-secondary rounded accent-ios-secondary w-4 h-4"
            />
            <span className="text-sm font-medium text-ios-text leading-tight">
              Retorno ao Trabalho
            </span>
          </label>
          {/* Opção de Exame de Mudança de Riscos */}
          <label className="flex items-center space-x-2 cursor-pointer bg-ios-bg p-3 rounded-ios-sm border border-transparent hover:border-ios-secondary/30 transition-colors">
            <input
              type="checkbox"
              checked={tipoExame === "Mudança"}
              onChange={() => setTipoExame("Mudança")}
              className="text-ios-secondary focus:ring-ios-secondary rounded accent-ios-secondary w-4 h-4"
            />
            <span className="text-sm font-medium text-ios-text leading-tight">
              Mudança de Riscos
            </span>
          </label>
        </div>

        {/* Versão estruturada exclusivamente para impressão (PDF/A4) organizada em uma única linha contendo todos os 5 tipos de exames */}
        <div className="hidden">
          {/* Opção 1: Admissional */}
          <div className="flex items-center gap-1.5">
            {/* Checkbox somente leitura para exibir marcação formal no PDF */}
            <input
              type="checkbox"
              checked={tipoExame === "Admissional"}
              readOnly={true}
              className="text-ios-secondary accent-ios-secondary w-3 h-3 border-gray-400"
            />
            {/* Rótulo correspondente em negrito, caixa alta e sem quebra de linha */}
            <span className="text-[9px] font-bold text-black uppercase whitespace-nowrap">
              Admissional
            </span>
          </div>

          {/* Opção 2: Periódico */}
          <div className="flex items-center gap-1.5">
            {/* Checkbox somente leitura para exibir marcação formal no PDF */}
            <input
              type="checkbox"
              checked={tipoExame === "Periódico"}
              readOnly={true}
              className="text-ios-secondary accent-ios-secondary w-3 h-3 border-gray-400"
            />
            {/* Rótulo correspondente em negrito, caixa alta e sem quebra de linha */}
            <span className="text-[9px] font-bold text-black uppercase whitespace-nowrap">
              Periódico
            </span>
          </div>

          {/* Opção 3: Demissional */}
          <div className="flex items-center gap-1.5">
            {/* Checkbox somente leitura para exibir marcação formal no PDF */}
            <input
              type="checkbox"
              checked={tipoExame === "Demissional"}
              readOnly={true}
              className="text-ios-secondary accent-ios-secondary w-3 h-3 border-gray-400"
            />
            {/* Rótulo correspondente em negrito, caixa alta e sem quebra de linha */}
            <span className="text-[9px] font-bold text-black uppercase whitespace-nowrap">
              Demissional
            </span>
          </div>

          {/* Opção 4: Retorno ao Trabalho */}
          <div className="flex items-center gap-1.5">
            {/* Checkbox somente leitura para exibir marcação formal no PDF */}
            <input
              type="checkbox"
              checked={tipoExame === "Retorno"}
              readOnly={true}
              className="text-ios-secondary accent-ios-secondary w-3 h-3 border-gray-400"
            />
            {/* Rótulo correspondente em negrito, caixa alta e sem quebra de linha */}
            <span className="text-[9px] font-bold text-black uppercase whitespace-nowrap">
              Retorno ao Trabalho
            </span>
          </div>

          {/* Opção 5: Mudança de Riscos */}
          <div className="flex items-center gap-1.5">
            {/* Checkbox somente leitura para exibir marcação formal no PDF */}
            <input
              type="checkbox"
              checked={tipoExame === "Mudança"}
              readOnly={true}
              className="text-ios-secondary accent-ios-secondary w-3 h-3 border-gray-400"
            />
            {/* Rótulo correspondente em negrito, caixa alta e sem quebra de linha */}
            <span className="text-[9px] font-bold text-black uppercase whitespace-nowrap">
              Mudança de Riscos
            </span>
          </div>
        </div>
      </div>

      {/* Seção 3: Meatoscopia */}
      <div className="bg-white rounded-ios shadow-sm border border-ios-divider p-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-text rounded-l-ios"></div>
        <div className="flex items-center text-ios-text font-semibold mb-4 border-b border-ios-divider pb-2">
          <Stethoscope className="w-5 h-5 mr-2" />
          <span className="uppercase tracking-widest text-sm">
            MEATOSCOPIA
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-ios-subtext uppercase">
              Orelha Direita (OD)
            </label>
            {/* Input reativo de Meatoscopia OD agora controlado via estado */}
            <input
              type="text"
              value={meatoscopiaOD}
              onChange={(e) => setMeatoscopiaOD(e.target.value)}
              className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm focus:outline-none focus:border-ios-primary focus:ring-1 transition-all text-sm"
              placeholder="Normal, Presença de cerúmen, etc..."
            />
          </div>
          <div className="flex flex-col space-y-2">
            <label className="text-sm font-semibold text-ios-subtext uppercase">
              Orelha Esquerda (OE)
            </label>
            {/* Input reativo de Meatoscopia OE agora controlado via estado */}
            <input
              type="text"
              value={meatoscopiaOE}
              onChange={(e) => setMeatoscopiaOE(e.target.value)}
              className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm focus:outline-none focus:border-ios-primary focus:ring-1 transition-all text-sm"
              placeholder="Normal, Presença de cerúmen, etc..."
            />
          </div>
        </div>
      </div>

      {/* Seção 4: Grade Audiométrica (Canvas Interativo Modularizado) */}
      <div className="bg-white rounded-ios shadow-sm border border-ios-divider p-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-ios"></div>
        {/* Renderiza o componente independente contendo a lousa interativa (OD/OE) com callback para o estado */}
        <GradeAudiometria ref={gradeAudiometriaRef} onStateChange={setGradeData} />
      </div>

      {/* Seção 5: Sinais Convencionais, Audiômetro e Logoaudiometria */}
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Sinais Convencionais */}
          <div className="bg-white h-[348px] rounded-ios shadow-sm border border-ios-divider p-5 flex flex-col">
            <h4 className="text-sm font-bold text-center text-ios-text mb-4 border-b pb-2 uppercase tracking-wide">
              Sinais Convencionais
            </h4>

            {/* Tabela de símbolos para referência visual */}
            <div className="w-full overflow-hidden border border-ios-divider rounded-ios-sm text-sm">
              {/* Linha de cabeçalho da tabela */}
              <div className="grid grid-cols-5 bg-ios-bg text-center font-medium text-ios-subtext border-b border-ios-divider divide-x divide-ios-divider">
                <div className="py-2 text-xs">Máscara</div>
                <div className="py-2">VA</div>
                <div className="py-2">VO</div>
                <div className="py-2">VA</div>
                <div className="py-2">VO</div>
              </div>
              {/* Linha de Sem Mascaramento */}
              <div className="grid grid-cols-5 text-center items-center border-b border-ios-divider divide-x divide-ios-divider bg-white">
                <div className="py-2 text-xs font-medium text-ios-subtext bg-ios-bg/50">
                  Sem
                </div>
                <div className="py-2 font-bold text-red-500 text-lg">O</div>
                <div className="py-2 font-bold text-red-500 text-lg">&lt;</div>
                <div className="py-2 font-bold text-blue-500 text-lg">X</div>
                <div className="py-2 font-bold text-blue-500 text-lg">&gt;</div>
              </div>
              {/* Linha de Com Mascaramento */}
              <div className="grid grid-cols-5 text-center items-center divide-x divide-ios-divider bg-white">
                <div className="py-2 text-xs font-medium text-ios-subtext bg-ios-bg/50">
                  Com
                </div>
                <div className="py-2 font-bold text-red-500 text-lg">△</div>
                <div className="py-2 font-bold text-red-500 text-lg">[</div>
                <div className="py-2 font-bold text-blue-500 text-lg">□</div>
                <div className="py-2 font-bold text-blue-500 text-lg">]</div>
              </div>
            </div>
            <div className="mt-2 text-center text-xs text-ios-subtext">
              Vermelho: OD | Azul: OE
            </div>
          </div>

          {/* Audiômetro */}
          <div className="bg-white h-[348px] rounded-ios shadow-sm border border-ios-divider p-5 flex flex-col">
            <h4 className="text-sm font-bold text-center text-ios-text mb-4 border-b pb-2 uppercase tracking-wide">
              Audiômetro
            </h4>
            <div className="space-y-4 mt-4">
              <div className="flex items-center">
                <label className="w-24 text-xs font-semibold text-ios-subtext">
                  Marca:
                </label>
                <input
                  type="text"
                  value={audiometroData.marca}
                  onChange={(e) => setAudiometroData({...audiometroData, marca: e.target.value})}
                  className="flex-1 focus:outline-none px-1 py-1 text-sm bg-transparent font-semibold"
                />
              </div>
              <div className="flex items-center">
                <label className="w-24 text-xs font-semibold text-ios-subtext">
                  Modelo:
                </label>
                <input
                  type="text"
                  value={audiometroData.modelo}
                  onChange={(e) => setAudiometroData({...audiometroData, modelo: e.target.value})}
                  className="flex-1 focus:outline-none px-1 py-1 text-sm bg-transparent font-semibold"
                />
              </div>
              <div className="flex items-center">
                <label className="w-24 text-xs font-semibold text-ios-subtext">
                  Calibração:
                </label>
                <input
                  type="text"
                  placeholder="Insira aqui a Calibração"
                  value={audiometroData.calibracao}
                  onChange={(e) => setAudiometroData({...audiometroData, calibracao: e.target.value})}
                  className="flex-1 focus:outline-none px-1 py-1 text-sm bg-transparent font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Bloco de Identificação Repetido para Impressão (PDF/A4) - Exibido novamente antes da Logoaudiometria */}
        <div className="hidden"></div>
        <div className="hidden">
          {/* Título de Identificação Repetida no topo do bloco */}
          <div className="text-center border-b border-gray-400 pb-1 mb-2">
            <span className="text-[10px] font-bold uppercase text-black">
              Identificação do Exame
            </span>
          </div>

          {/* 1. Dados do Paciente (Repetido e Somente Leitura para Impressão) */}
          <div className="flex flex-col gap-1 w-full">
            {/* Linha 1: Empresa e Nome lado a lado */}
            <div className="flex flex-row gap-4 w-full">
              {/* Campo Empresa */}
              <div className="flex flex-row items-baseline gap-2 flex-1">
                <span className="text-[9px] font-bold text-black uppercase">Empresa:</span>
                <span className="text-[9px] text-black border-b border-gray-400 flex-1 min-h-[14px]">
                  {patientData?.empresa || ""}
                </span>
              </div>
              {/* Campo Nome */}
              <div className="flex flex-row items-baseline gap-2 flex-1">
                <span className="text-[9px] font-bold text-black uppercase">Nome:</span>
                <span className="text-[9px] text-black border-b border-gray-400 flex-1 min-h-[14px]">
                  {patientData?.nome || ""}
                </span>
              </div>
            </div>

            {/* Linha 2: Função e Sexo lado a lado */}
            <div className="flex flex-row gap-4 w-full">
              {/* Campo Função */}
              <div className="flex flex-row items-baseline gap-2 flex-1">
                <span className="text-[9px] font-bold text-black uppercase">Função:</span>
                <span className="text-[9px] text-black border-b border-gray-400 flex-1 min-h-[14px]">
                  {patientData?.funcao || ""}
                </span>
              </div>
              {/* Campo Sexo */}
              <div className="flex flex-row items-baseline gap-2 flex-1">
                <span className="text-[9px] font-bold text-black uppercase">Sexo:</span>
                <span className="text-[9px] text-black border-b border-gray-400 flex-1 min-h-[14px]">
                  {patientData?.sexo || ""}
                </span>
              </div>
            </div>

            {/* Linha 3: CPF e RG lado a lado */}
            <div className="flex flex-row gap-4 w-full">
              {/* Campo CPF */}
              <div className="flex flex-row items-baseline gap-2 flex-1">
                <span className="text-[9px] font-bold text-black uppercase">CPF:</span>
                <span className="text-[9px] text-black border-b border-gray-400 flex-1 min-h-[14px]">
                  {patientData?.documento || ""}
                </span>
              </div>
              {/* Campo RG */}
              <div className="flex flex-row items-baseline gap-2 flex-1">
                <span className="text-[9px] font-bold text-black uppercase">RG:</span>
                <span className="text-[9px] text-black border-b border-gray-400 flex-1 min-h-[14px]">
                  {patientData?.rg || ""}
                </span>
              </div>
            </div>

            {/* Linha 4: Nascimento, Exame e Repouso */}
            <div className="flex flex-row gap-4 w-full">
              {/* Campo Data de Nascimento */}
              <div className="flex flex-row items-baseline gap-2 flex-1">
                <span className="text-[9px] font-bold text-black uppercase">Nasc:</span>
                <span className="text-[9px] text-black border-b border-gray-400 flex-1 min-h-[14px]">
                  {patientData?.dataNascimento || ""}
                </span>
              </div>
              {/* Campo Data do Exame */}
              <div className="flex flex-row items-baseline gap-2 flex-1">
                <span className="text-[9px] font-bold text-black uppercase">Exame:</span>
                <span className="text-[9px] text-black border-b border-gray-400 flex-1 min-h-[14px]">
                  {patientData?.dataExame || ""}
                </span>
              </div>
              {/* Campo Repouso Auditivo */}
              <div className="flex flex-row items-baseline gap-2 flex-1">
                <span className="text-[9px] font-bold text-black uppercase">Repouso:</span>
                <span className="text-[9px] text-black border-b border-gray-400 flex-1 min-h-[14px]">
                  {patientData?.repouso || ""}
                </span>
              </div>
            </div>
          </div>

          {/* Divisor Interno Tracejado */}
          <div className="border-t border-dashed border-gray-300 my-1.5"></div>

          {/* 2. Tipo de Exame (Repetido e Somente Leitura) */}
          <div className="flex flex-row justify-between items-center w-full gap-2 py-0.5">
            <span className="text-[9px] font-bold text-black uppercase">Tipo de Exame:</span>
            {/* Opção 1: Admissional */}
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={tipoExame === "Admissional"}
                readOnly={true}
                className="text-ios-secondary accent-ios-secondary w-2.5 h-2.5 border-gray-400 pointer-events-none"
              />
              <span className="text-[8px] font-bold text-black uppercase">Admissional</span>
            </div>
            {/* Opção 2: Periódico */}
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={tipoExame === "Periódico"}
                readOnly={true}
                className="text-ios-secondary accent-ios-secondary w-2.5 h-2.5 border-gray-400 pointer-events-none"
              />
              <span className="text-[8px] font-bold text-black uppercase">Periódico</span>
            </div>
            {/* Opção 3: Demissional */}
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={tipoExame === "Demissional"}
                readOnly={true}
                className="text-ios-secondary accent-ios-secondary w-2.5 h-2.5 border-gray-400 pointer-events-none"
              />
              <span className="text-[8px] font-bold text-black uppercase">Demissional</span>
            </div>
            {/* Opção 4: Retorno ao Trabalho */}
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={tipoExame === "Retorno"}
                readOnly={true}
                className="text-ios-secondary accent-ios-secondary w-2.5 h-2.5 border-gray-400 pointer-events-none"
              />
              <span className="text-[8px] font-bold text-black uppercase">Retorno</span>
            </div>
            {/* Opção 5: Mudança de Riscos */}
            <div className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={tipoExame === "Mudança"}
                readOnly={true}
                className="text-ios-secondary accent-ios-secondary w-2.5 h-2.5 border-gray-400 pointer-events-none"
              />
              <span className="text-[8px] font-bold text-black uppercase">Mudança</span>
            </div>
          </div>

          {/* Divisor Interno Tracejado */}
          <div className="border-t border-dashed border-gray-300 my-1.5"></div>

          {/* 3. Meatoscopia (Repetido e Somente Leitura) */}
          <div className="grid grid-cols-2 gap-4 w-full">
            {/* Orelha Direita (OD) */}
            <div className="flex flex-row items-baseline gap-2 flex-1">
              <span className="text-[9px] font-bold text-black uppercase min-w-[110px]">Orelha Direita (OD):</span>
              <span className="text-[9px] text-black border-b border-gray-400 flex-1 min-h-[14px]">
                {meatoscopiaOD || ""}
              </span>
            </div>
            {/* Orelha Esquerda (OE) */}
            <div className="flex flex-row items-baseline gap-2 flex-1">
              <span className="text-[9px] font-bold text-black uppercase min-w-[110px]">Orelha Esquerda (OE):</span>
              <span className="text-[9px] text-black border-b border-gray-400 flex-1 min-h-[14px]">
                {meatoscopiaOE || ""}
              </span>
            </div>
          </div>
        </div>

        



        {/* Logoaudiometria */}
        <div className="bg-white rounded-ios shadow-sm border border-ios-divider p-5 space-y-6">
          <h4 className="text-sm font-bold text-center text-ios-text mb-2 border-b pb-2 uppercase tracking-wide">
            Logoaudiometria
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tabela LRF (Limiar de Reconhecimento de Fala) */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-ios-subtext uppercase tracking-widest text-center">
                LRF - Limiar de Reconhecimento de Fala
              </h5>
              <div className="border border-ios-divider rounded-ios-sm overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-ios-bg font-bold text-ios-subtext border-b border-t border-ios-divider text-center">
                  <div className="py-1"></div>
                  <div className="py-1 flex items-center justify-center">
                    Intensid.
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    Monossil.
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    Dissil.
                  </div>
                </div>
                {/* Linha Palavras Faladas (Header secundário da imagem) */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider text-center italic text-ios-subtext">
                  <div className="py-1 font-semibold bg-ios-bg/30 flex items-center justify-center">
                    Pal. Faladas
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    ---
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    25
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    25
                  </div>
                </div>
                {/* Linha OD (Orelha Direita) */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider text-center items-center">
                  <div className="py-2 font-bold text-red-500 bg-red-50/30 flex items-center justify-center">
                    OD
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      value={logoAudiometriaData.lrfODIntensidade}
                      onChange={(e) => setLogoAudiometriaData({...logoAudiometriaData, lrfODIntensidade: formatInputWithSuffix(e.target.value, "dB")})}
                      className="w-full text-center focus:outline-none text-red-600 font-medium"
                      placeholder="dB"
                    />
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      value={logoAudiometriaData.lrfODMonossil}
                      onChange={(e) => setLogoAudiometriaData({...logoAudiometriaData, lrfODMonossil: formatInputWithSuffix(e.target.value, "%")})}
                      className="w-full text-center focus:outline-none text-red-600 font-medium"
                      placeholder="%"
                    />
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      value={logoAudiometriaData.lrfODDissil}
                      onChange={(e) => setLogoAudiometriaData({...logoAudiometriaData, lrfODDissil: formatInputWithSuffix(e.target.value, "%")})}
                      className="w-full text-center focus:outline-none text-red-600 font-medium"
                      placeholder="%"
                    />
                  </div>
                </div>
                {/* Linha OE (Orelha Esquerda) */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider text-center items-center">
                  <div className="py-2 font-bold text-blue-500 bg-blue-50/30 flex items-center justify-center">
                    OE
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      value={logoAudiometriaData.lrfOEIntensidade}
                      onChange={(e) => setLogoAudiometriaData({...logoAudiometriaData, lrfOEIntensidade: formatInputWithSuffix(e.target.value, "dB")})}
                      className="w-full text-center focus:outline-none text-blue-600 font-medium"
                      placeholder="dB"
                      
                    />
                   
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      value={logoAudiometriaData.lrfOEMonossil}
                      onChange={(e) => setLogoAudiometriaData({...logoAudiometriaData, lrfOEMonossil: formatInputWithSuffix(e.target.value, "%")})}
                      className="w-full text-center focus:outline-none text-blue-600 font-medium"
                      placeholder="%"
                    />
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      value={logoAudiometriaData.lrfOEDissil}
                      onChange={(e) => setLogoAudiometriaData({...logoAudiometriaData, lrfOEDissil: formatInputWithSuffix(e.target.value, "%")})}
                      className="w-full text-center focus:outline-none text-blue-600 font-medium"
                      placeholder="%"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela IPRF (Índice Percentual de Reconhecimento de Fala) */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-ios-subtext uppercase tracking-widest text-center">
                IPRF - Índice Percentual de Reconhecimento de Fala
              </h5>
              <div className="border border-ios-divider rounded-ios-sm overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-ios-bg font-bold text-ios-subtext border-b border-t border-ios-divider text-center">
                  <div className="py-1"></div>
                  <div className="py-1 flex items-center justify-center">
                    Intensid.
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    Monossil.
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    Dissil.
                  </div>
                </div>
                {/* Linha Palavras Faladas */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider text-center italic text-ios-subtext">
                  <div className="py-1 font-semibold bg-ios-bg/30 flex items-center justify-center">
                    Pal. Faladas
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    ---
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    25
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    25
                  </div>
                </div>
                {/* Linha OD */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider text-center items-center">
                  <div className="py-2 font-bold text-red-500 bg-red-50/30 flex items-center justify-center">
                    OD
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      value={logoAudiometriaData.iprfODIntensidade}
                      onChange={(e) => setLogoAudiometriaData({...logoAudiometriaData, iprfODIntensidade: formatInputWithSuffix(e.target.value, "dB")})}
                      className="w-full text-center focus:outline-none text-red-600 font-medium"
                      placeholder="dB"
                    />
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      value={logoAudiometriaData.iprfODMonossil}
                      onChange={(e) => setLogoAudiometriaData({...logoAudiometriaData, iprfODMonossil: formatInputWithSuffix(e.target.value, "%")})}
                      className="w-full text-center focus:outline-none text-red-600 font-medium"
                      placeholder="%"
                    />
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      value={logoAudiometriaData.iprfODDissil}
                      onChange={(e) => setLogoAudiometriaData({...logoAudiometriaData, iprfODDissil: formatInputWithSuffix(e.target.value, "%")})}
                      className="w-full text-center focus:outline-none text-red-600 font-medium"
                      placeholder="%"
                    />
                  </div>
                </div>
                {/* Linha OE */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider text-center items-center">
                  <div className="py-2 font-bold text-blue-500 bg-blue-50/30 flex items-center justify-center">
                    OE
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      value={logoAudiometriaData.iprfOEIntensidade}
                      onChange={(e) => setLogoAudiometriaData({...logoAudiometriaData, iprfOEIntensidade: formatInputWithSuffix(e.target.value, "dB")})}
                      className="w-full text-center focus:outline-none text-blue-600 font-medium"
                      placeholder="dB"
                    />
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      value={logoAudiometriaData.iprfOEMonossil}
                      onChange={(e) => setLogoAudiometriaData({...logoAudiometriaData, iprfOEMonossil: formatInputWithSuffix(e.target.value, "%")})}
                      className="w-full text-center focus:outline-none text-blue-600 font-medium"
                      placeholder="%"
                    />
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      value={logoAudiometriaData.iprfOEDissil}
                      onChange={(e) => setLogoAudiometriaData({...logoAudiometriaData, iprfOEDissil: formatInputWithSuffix(e.target.value, "%")})}
                      className="w-full text-center focus:outline-none text-blue-600 font-medium"
                      placeholder="%"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 6: Laudo */}
      <div className="bg-white rounded-ios shadow-sm border border-ios-divider p-6 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-ios"></div>
        <div className="flex items-center text-green-600 font-semibold mb-6 border-b border-ios-divider pb-2">
          <FileText className="w-5 h-5 mr-2" />
          <span className="uppercase tracking-widest text-sm">
            Laudo
          </span>
        </div>

        <div className="space-y-5">
          {/* Limiares auditivos */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <span className="text-sm font-semibold text-ios-text">
              Limiares auditivos dentro dos limites aceitáveis:
            </span>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={laudoData.limiaresAceitaveis.od}
                  onChange={(e) => setLaudoData({...laudoData, limiaresAceitaveis: {...laudoData.limiaresAceitaveis, od: e.target.checked}})}
                  className="text-green-500 focus:ring-green-500 rounded w-4 h-4"
                />
                <span className="text-sm">
                  OD
                </span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={laudoData.limiaresAceitaveis.oe}
                  onChange={(e) => setLaudoData({...laudoData, limiaresAceitaveis: {...laudoData.limiaresAceitaveis, oe: e.target.checked}})}
                  className="text-green-500 focus:ring-green-500 rounded w-4 h-4"
                />
                <span className="text-sm">
                  OE
                </span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={laudoData.limiaresAceitaveis.bilateral}
                  onChange={(e) => setLaudoData({...laudoData, limiaresAceitaveis: {...laudoData.limiaresAceitaveis, bilateral: e.target.checked}})}
                  className="text-green-500 focus:ring-green-500 rounded w-4 h-4"
                />
                <span className="text-sm">
                  Bilateral
                </span>
              </label>
            </div>
          </div>

          {/* Perda auditiva */}
          <div className="flex flex-col space-y-3">
            <span className="text-sm font-semibold text-ios-text">
              Perda auditiva:
            </span>

            {/* Perda OD */}
            <div className="flex flex-col sm:flex-row sm:items-center ml-2 sm:ml-4 space-y-2 sm:space-y-0 sm:space-x-4">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={laudoData.perdaOD.checked}
                  onChange={(e) => setLaudoData({...laudoData, perdaOD: {...laudoData.perdaOD, checked: e.target.checked}})}
                  className="text-ios-primary focus:ring-ios-primary rounded w-4 h-4"
                />
                <span className="text-sm font-medium w-6">
                  OD
                </span>
              </label>
              <div className="flex flex-wrap gap-4 pl-6 sm:pl-0">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laudoData.perdaOD.neurosensorial}
                    onChange={(e) => setLaudoData({...laudoData, perdaOD: {...laudoData.perdaOD, neurosensorial: e.target.checked}})}
                    className="rounded text-ios-subtext"
                  />
                  <span className="text-sm">
                    Neurossensorial
                  </span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laudoData.perdaOD.mista}
                    onChange={(e) => setLaudoData({...laudoData, perdaOD: {...laudoData.perdaOD, mista: e.target.checked}})}
                    className="rounded text-ios-subtext"
                  />
                  <span className="text-sm">
                    Mista
                  </span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laudoData.perdaOD.condutiva}
                    onChange={(e) => setLaudoData({...laudoData, perdaOD: {...laudoData.perdaOD, condutiva: e.target.checked}})}
                    className="rounded text-ios-subtext"
                  />
                  <span className="text-sm">
                    Condutiva
                  </span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laudoData.perdaOD.h6000}
                    onChange={(e) => setLaudoData({...laudoData, perdaOD: {...laudoData.perdaOD, h6000: e.target.checked}})}
                    className="rounded text-ios-subtext"
                  />
                  <span className="text-sm">
                    6000Hz
                  </span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laudoData.perdaOD.h8000}
                    onChange={(e) => setLaudoData({...laudoData, perdaOD: {...laudoData.perdaOD, h8000: e.target.checked}})}
                    className="rounded text-ios-subtext"
                  />
                  <span className="text-sm">
                    8000Hz
                  </span>
                </label>
              </div>
            </div>

            {/* Perda OE */}
            <div className="flex flex-col sm:flex-row sm:items-center ml-2 sm:ml-4 space-y-2 sm:space-y-0 sm:space-x-4">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={laudoData.perdaOE.checked}
                  onChange={(e) => setLaudoData({...laudoData, perdaOE: {...laudoData.perdaOE, checked: e.target.checked}})}
                  className="text-ios-primary focus:ring-ios-primary rounded w-4 h-4"
                />
                <span className="text-sm font-medium w-6">
                  OE
                </span>
              </label>
              <div className="flex flex-wrap gap-4 pl-6 sm:pl-0">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laudoData.perdaOE.neurosensorial}
                    onChange={(e) => setLaudoData({...laudoData, perdaOE: {...laudoData.perdaOE, neurosensorial: e.target.checked}})}
                    className="rounded text-ios-subtext"
                  />
                  <span className="text-sm">
                    Neurossensorial
                  </span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laudoData.perdaOE.mista}
                    onChange={(e) => setLaudoData({...laudoData, perdaOE: {...laudoData.perdaOE, mista: e.target.checked}})}
                    className="rounded text-ios-subtext"
                  />
                  <span className="text-sm">
                    Mista
                  </span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laudoData.perdaOE.condutiva}
                    onChange={(e) => setLaudoData({...laudoData, perdaOE: {...laudoData.perdaOE, condutiva: e.target.checked}})}
                    className="rounded text-ios-subtext"
                  />
                  <span className="text-sm">
                    Condutiva
                  </span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laudoData.perdaOE.h6000}
                    onChange={(e) => setLaudoData({...laudoData, perdaOE: {...laudoData.perdaOE, h6000: e.target.checked}})}
                    className="rounded text-ios-subtext"
                  />
                  <span className="text-sm">
                    6000Hz
                  </span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={laudoData.perdaOE.h8000}
                    onChange={(e) => setLaudoData({...laudoData, perdaOE: {...laudoData.perdaOE, h8000: e.target.checked}})}
                    className="rounded text-ios-subtext"
                  />
                  <span className="text-sm">
                    8000Hz
                  </span>
                </label>


              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="flex flex-col pt-2">
            <label className="text-sm font-semibold text-ios-text mb-2">
              Obs.:
            </label>
            <div className="flex-1 flex flex-col">
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full min-h-[80px] p-3 bg-ios-bg border border-ios-divider rounded-ios-sm focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm resize-y custom-scrollbar"
                placeholder="Observações adicionais..."
              />
              {/* Versão para impressão com duas linhas */}
              <div className="hidden flex-col w-full text-[10px] text-black">
                <div className="border-b border-gray-400 min-h-[1.2rem] py-0.5 px-1">
                  {observacoes}
                </div>
                <div className="border-b border-gray-400 min-h-[1.2rem]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 7: Assinaturas - Captura interativa em tela e exibição no laudo impresso (Adicionado a classe 'relative' para o termo posicionado no canto inferior direito) */}
      <div className="relative bg-white/60 backdrop-blur-sm rounded-ios shadow-sm border border-ios-divider p-12 mt-12">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Assinatura do Funcionário/Colaborador (Interativa em tela) */}
          <div className="flex flex-col items-center">
            {employeeSignature ? (
              // Se o colaborador já tiver assinado, exibe a assinatura física na tela e na impressão
              <div className="relative flex flex-col items-center group">
                <img
                  src={employeeSignature}
                  alt="Assinatura do Colaborador"
                  // Altura calibrada para se enquadrar perfeitamente no espaço do laudo técnico
                  className="h-14 object-contain mb-1"
                />
                {/* Botão flutuante na tela para refazer a assinatura */}
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="absolute -top-3 -right-6 p-1 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full border border-gray-200 shadow-sm transition-all active:scale-90"
                  title="Refazer assinatura"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              // Caso não tenha assinatura capturada, exibe o ícone interativo de caneta para clique
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(true)}
                className="flex flex-col items-center group focus:outline-none transition-all active:scale-95 mb-1"
                title="Clique para assinar"
              >
                {/* Ícone PencilIcon interativo com transição premium ao passar o mouse */}
                <PencilIcon className="w-8 h-8 text-ios-subtext group-hover:text-ios-primary group-hover:scale-110 transition-all mb-2" />
                <span className="text-[10px] text-ios-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  CLIQUE PARA ASSINAR
                </span>
              </button>
            )}

            {/* Espaço reservado para visualização impressa em papel quando não assinado */}
            {!employeeSignature && (
              <div className="hidden h-14 w-full"></div>
            )}

            {/* Linha horizontal delimitadora da assinatura */}
            <div className="w-full max-w-[250px] border-b border-ios-text mb-2"></div>
            <span className="text-sm text-ios-subtext uppercase font-bold text-center">
              Assinatura do Funcionário(a)
            </span>
          </div>

          {/* Assinatura do Fonoaudiólogo(a) */}
          <div className="flex flex-col items-center">
            {/* Assinatura digitalizada padrão do profissional técnico */}
            <img
              src={sigImage}
              alt="Assinatura do Fonoaudiólogo"
              className="h-14 object-contain mb-1"
            />
            <div className="w-full max-w-[250px] border-b border-ios-text mb-2"></div>
            <span className="text-sm text-ios-subtext mb-4 uppercase font-bold text-center">
              Assinatura do Fonoaudiólogo(a)
            </span>
          </div>
        </div>

        {/* Ícone de arquivo e rótulo "Termo de Perda auditiva" no canto inferior direito do card */}
        <div
          // Aciona a abertura do termo de reconhecimento de perda auditiva
          onClick={() => setIsTermoModalOpen(true)}
          // Contêiner absoluto posicionado no canto inferior direito com padding, borda e fundo estilizado no padrão iOS
          className={`absolute bottom-2 right-3 flex items-center space-x-1.5 px-3 py-1.5 rounded-full transition-all duration-200 cursor-pointer select-none  border shadow-sm group active:scale-95 ${termoData
            ? "bg-emerald-50 hover:bg-emerald-100 border-emerald-100 text-emerald-600"
            : "bg-blue-50 hover:bg-blue-100 border-blue-100 text-ios-primary"
            }`}
          // Título informativo exibido como dica de tela
          title={
            termoData
              ? "Termo Preenchido e Confirmado"
              : "Visualizar Termo de Perda Auditiva"
          }
        >
          {/* Ícone de arquivo ou check com micro-animação de escala no hover do mouse */}
          {termoData ? (
            <Check className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          ) : (
            <FileText className="w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
          )}
          {/* Rótulo de texto descritivo com tipografia em negrito e tamanho reduzido elegante */}
          <span className="text-xs font-bold tracking-wide">
            Termo de Perda auditiva
          </span>
        </div>
      </div>

      {/* Botão de salvar provisório */}
      <div className="flex justify-between pt-4 pb-8">
        {onBack && (
          <div className="flex justify-start">
            <button
              onClick={onBack}
              className="group flex items-center justify-center space-x-2 text-gray-500 hover:text-ios-primary transition-colors hover:bg-white/60 px-4 py-2 rounded-lg active:scale-95 font-medium shadow-sm border border-transparent hover:border-gray-200/60"
              title="Voltar para Anamnese"
            >
              <Undo2 className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Voltar para Anamnese</span>
            </button>
          </div>
        )}
        <button
          onClick={handleSaveAudiometria}
          disabled={isGenerating}
          className={`flex items-center px-6 py-3 rounded-ios-btn font-semibold shadow-lg transition-all transform  ${isGenerating ? 'bg-gray-400 cursor-not-allowed text-white' : 'bg-ios-primary hover:bg-ios-primary/90 text-white shadow-ios-primary/30 hover:scale-100 active:scale-95'}`}
        >
          {isGenerating ? (
             <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
          ) : (
            <CheckCircle2 className="w-5 h-5 mr-2" />
          )}
          {isGenerating ? "Gerando PDF..." : "Salvar Audiometria"}
        </button>


      </div>

      {/* Modal de Visualização do PDF Gerado */}
      {pdfPreviewUrl && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white w-full max-w-5xl h-[90vh] rounded-lg shadow-xl flex flex-col overflow-hidden relative">
            <div className="flex justify-between items-center p-4 border-b bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-800">Visualização do Documento (PDF)</h2>
              <button onClick={() => setPdfPreviewUrl(null)} className="text-gray-500 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-gray-200">
                <X className="w-6 h-6" />
              </button>
            </div>
            <iframe src={pdfPreviewUrl} className="flex-1 w-full h-full border-none" title="PDF Gerado" />
          </div>
        </div>
      )}


      {/* Modal Premium de Assinatura do Funcionário */}
      <SignatureScreen
        isOpen={isSignatureModalOpen}
        onClose={() => setIsSignatureModalOpen(false)}
        onSave={(signatureData) => {
          setEmployeeSignature(signatureData);
          setIsSignatureModalOpen(false);
        }}
      />

      {/* Modal do Termo de Reconhecimento de Perda Auditiva */}
      <LaudoPerda
        isOpen={isTermoModalOpen}
        onClose={() => setIsTermoModalOpen(false)}
        appointment={appointment}
        tipoExame={tipoExame}
        savedData={termoData}
        patientData={patientData}
        onSave={(data) => {
          setTermoData(data);
          setIsTermoModalOpen(false);
        }}
      />

      {/* Exibição para Impressão Conjunta do Termo de Perda Auditiva (Apenas se preenchido e confirmado) */}
      {termoData && (
        <div className="hidden w-full text-black">
          <div className="w-full text-center font-bold text-black mb-2"></div>
          {/* Título Oficial */}
          <div className="text-center space-y-1 border-b pb-4 border-black mb-6">
            <h1 className="text-lg font-black uppercase">
              Termo de Reconhecimento de Perda Auditiva
            </h1>
            <h2 className="text-xs font-bold uppercase tracking-widest">
              (NR 7 – Portaria 19, Anexo I)
            </h2>
          </div>

          {/* Dados de Identificação */}
          <div className="border border-black p-4 space-y-4 mb-6 text-xs">
            <div className="flex items-center text-xs font-bold border-b border-black pb-1 uppercase tracking-wider mb-2">
              Dados de Identificação do Colaborador
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-baseline gap-2">
                <span className="font-bold min-w-[60px]">Nome:</span>
                <span className="border-b border-black flex-1 font-semibold">
                  {termoData.nome}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold min-w-[60px]">Documento:</span>
                <span className="border-b border-black flex-1 font-semibold">
                  {termoData.documento}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold min-w-[60px]">Empresa:</span>
                <span className="border-b border-black flex-1 font-semibold">
                  {termoData.empresa}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="font-bold min-w-[60px]">Função:</span>
                <span className="border-b border-black flex-1 font-semibold">
                  {termoData.funcao}
                </span>
              </div>
            </div>
          </div>

          {/* Declaração Principal */}
          <div className="border border-black p-4 space-y-4 mb-6 text-xs">
            <div className="leading-normal flex flex-wrap items-baseline gap-1">
              <span>
                Declaro que estou ciente que houve no exame audiométrico
              </span>
              <span className="font-extrabold underline uppercase px-1">
                {tipoExame}
              </span>
              <span>, onde foi detectada alteração:</span>
            </div>

            {/* Orelhas */}
            <div className="grid grid-cols-2 gap-6 pt-2">
              {/* Orelha Direita (OD) */}
              <div className="border border-black p-2">
                <div className="flex items-center space-x-2 mb-2 border-b pb-0.5 border-black">
                  <input
                    type="checkbox"
                    checked={termoData.odAlterations.checked}
                    readOnly
                    className="w-3.5 h-3.5 accent-black"
                  />
                  <span className="font-extrabold uppercase">
                    Orelha Direita (OD)
                  </span>
                </div>
                <div className="space-y-1 pl-4">
                  {/* Opção para exibição impressa de alteração neurossensorial na OD */}
                  <label className="flex items-center space-x-2">
                    {/* Elemento de input de apenas leitura com estado vindo de termoData */}
                    <input
                      type="checkbox"
                      checked={termoData.odAlterations.neurosensorial}
                      readOnly
                      className="w-3 h-3 accent-black"
                    />
                    {/* Descrição em texto do tipo de perda */}
                    <span className="font-medium">Neurosensorial</span>
                  </label>
                  {/* Opção para exibição impressa de alteração condutiva na OD */}
                  <label className="flex items-center space-x-2">
                    {/* Elemento de input de apenas leitura com estado vindo de termoData */}
                    <input
                      type="checkbox"
                      checked={termoData.odAlterations.condutiva}
                      readOnly
                      className="w-3 h-3 accent-black"
                    />
                    {/* Descrição em texto do tipo de perda */}
                    <span className="font-medium">Condutiva</span>
                  </label>
                  {/* Opção para exibição impressa de alteração mista na OD */}
                  <label className="flex items-center space-x-2">
                    {/* Elemento de input de apenas leitura com estado vindo de termoData */}
                    <input
                      type="checkbox"
                      checked={termoData.odAlterations.mista}
                      readOnly
                      className="w-3 h-3 accent-black"
                    />
                    {/* Descrição em texto do tipo de perda */}
                    <span className="font-medium">Mista</span>
                  </label>
                  {/* Opção para exibição impressa de presença de cerume na OD */}
                  <label className="flex items-center space-x-2">
                    {/* Elemento de input de apenas leitura com estado vindo de termoData */}
                    <input
                      type="checkbox"
                      checked={termoData.odAlterations.cerume}
                      readOnly
                      className="w-3 h-3 accent-black"
                    />
                    {/* Descrição em texto indicando cerume */}
                    <span className="font-medium">Presença de cerume</span>
                  </label>
                </div>
              </div>

              {/* Orelha Esquerda (OE) */}
              <div className="border border-black p-2">
                <div className="flex items-center space-x-2 mb-2 border-b pb-0.5 border-black">
                  {/* Checkbox indicativo se a orelha esquerda em si possui alguma alteração no termo */}
                  <input
                    type="checkbox"
                    checked={termoData.oeAlterations.checked}
                    readOnly
                    className="w-3.5 h-3.5 accent-black"
                  />
                  {/* Rótulo identificando a orelha esquerda */}
                  <span className="font-extrabold uppercase">
                    Orelha Esquerda (OE)
                  </span>
                </div>
                <div className="space-y-1 pl-4">
                  {/* Opção para exibição impressa de alteração neurossensorial na OE */}
                  <label className="flex items-center space-x-2">
                    {/* Elemento de input de apenas leitura com estado vindo de termoData */}
                    <input
                      type="checkbox"
                      checked={termoData.oeAlterations.neurosensorial}
                      readOnly
                      className="w-3 h-3 accent-black"
                    />
                    {/* Descrição em texto do tipo de perda */}
                    <span className="font-medium">Neurosensorial</span>
                  </label>
                  {/* Opção para exibição impressa de alteração condutiva na OE */}
                  <label className="flex items-center space-x-2">
                    {/* Elemento de input de apenas leitura com estado vindo de termoData */}
                    <input
                      type="checkbox"
                      checked={termoData.oeAlterations.condutiva}
                      readOnly
                      className="w-3 h-3 accent-black"
                    />
                    {/* Descrição em texto do tipo de perda */}
                    <span className="font-medium">Condutiva</span>
                  </label>
                  {/* Opção para exibição impressa de alteração mista na OE */}
                  <label className="flex items-center space-x-2">
                    {/* Elemento de input de apenas leitura com estado vindo de termoData */}
                    <input
                      type="checkbox"
                      checked={termoData.oeAlterations.mista}
                      readOnly
                      className="w-3 h-3 accent-black"
                    />
                    {/* Descrição em texto do tipo de perda */}
                    <span className="font-medium">Mista</span>
                  </label>
                  {/* Opção para exibição impressa de presença de cerume na OE */}
                  <label className="flex items-center space-x-2">
                    {/* Elemento de input de apenas leitura com estado vindo de termoData */}
                    <input
                      type="checkbox"
                      checked={termoData.oeAlterations.cerume}
                      readOnly
                      className="w-3 h-3 accent-black"
                    />
                    {/* Descrição em texto indicando cerume */}
                    <span className="font-medium">Presença de cerume</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Nova Seção Impressa Separada: Detalhamento da Perda Auditiva por Frequência */}
          <div className="border border-black p-4 space-y-2 mb-6 text-xs">
            {/* Título da seção impressa em caixa alta */}
            <div className="flex items-center text-xs font-bold border-b border-black pb-1 uppercase tracking-wider mb-2">
              Perda Auditiva por Frequência
            </div>
            {/* Grid flexível contendo as duas orelhas lado a lado */}
            <div className="flex gap-12 pt-1">
              {/* Orelha Direita */}
              <div className="flex items-center gap-4">
                {/* Rótulo identificando Orelha Direita */}
                <span className="font-bold">OD:</span>
                {/* Exibição impressa para a opção 6000Hz da OD */}
                <label className="flex items-center space-x-1.5">
                  <input
                    type="checkbox"
                    checked={termoData.odAlterations.h6000}
                    readOnly
                    className="w-3 h-3 accent-black"
                  />
                  <span className="font-medium">6000Hz</span>
                </label>
                {/* Exibição impressa para a opção 8000Hz da OD */}
                <label className="flex items-center space-x-1.5">
                  <input
                    type="checkbox"
                    checked={termoData.odAlterations.h8000}
                    readOnly
                    className="w-3 h-3 accent-black"
                  />
                  <span className="font-medium">8000Hz</span>
                </label>
              </div>
              {/* Orelha Esquerda */}
              <div className="flex items-center gap-4">
                {/* Rótulo identificando Orelha Esquerda */}
                <span className="font-bold">OE:</span>
                {/* Exibição impressa para a opção 6000Hz da OE */}
                <label className="flex items-center space-x-1.5">
                  <input
                    type="checkbox"
                    checked={termoData.oeAlterations.h6000}
                    readOnly
                    className="w-3 h-3 accent-black"
                  />
                  <span className="font-medium">6000Hz</span>
                </label>
                {/* Exibição impressa para a opção 8000Hz da OE */}
                <label className="flex items-center space-x-1.5">
                  <input
                    type="checkbox"
                    checked={termoData.oeAlterations.h8000}
                    readOnly
                    className="w-3 h-3 accent-black"
                  />
                  <span className="font-medium">8000Hz</span>
                </label>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="border border-black p-4 space-y-2 mb-6 text-xs">
            <span className="font-bold">OBS:</span>
            <div className="border-b border-black py-0.5 font-medium">
              {termoData.observacoes ||
                "Nenhuma observação clínica registrada."}
            </div>
            <div className="border-b border-black min-h-[1.2rem]"></div>
          </div>

          {/* Bloco Normativo */}
          <div className="border border-black p-4 text-justify text-xs leading-normal mb-6">
            Declaro ainda que, fui orientado (a) quanto a obrigatoriedade do uso
            contínuo dos Protetores Auditivos, dos riscos que estarei exposto e
            dos cuidados que deverei ter com a audição estando consciente de que
            o não cumprimento as orientações poderão acarretar agravamento da
            perda auditiva.
          </div>

          {/* Cidade e Data */}
          <div className="text-xs font-semibold pt-2 mb-2">
            Conselheiro Lafaiete,{" "}
            <span className="underline font-bold px-1">
              {new Date().getDate()}
            </span>{" "}
            de{" "}
            <span className="underline font-bold px-1">
              {
                [
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
                ][new Date().getMonth()]
              }
            </span>{" "}
            de{" "}
            <span className="underline font-bold px-1">
              {new Date().getFullYear()}
            </span>
            .
          </div>

          {/* Assinaturas */}
          <div className="grid grid-cols-2 gap-12 pt-2">
            {/* Examinador */}
            <div className="flex flex-col items-center justify-end h-full">
              <img
                src={sigImage}
                alt="Assinatura Fonoaudióloga"
                className="h-12 object-contain mb-1"
              />
              <div className="w-full max-w-[250px] border-b border-black mb-2"></div>
              <div className="flex flex-col items-center text-center h-[36px] justify-start mt-1">
                <span className="text-[10px] font-black uppercase">
                  Jordânia G. S. Rodrigues
                </span>
                <span className="text-[8px] font-bold text-gray-700 uppercase">
                  FONOAUDIÓLOGA - CRFa-MG 4566
                </span>
                <span className="text-[7px] font-semibold text-gray-500 uppercase">
                  Assinatura e carimbo do examinador
                </span>
              </div>
            </div>

            {/* Funcionário */}
            <div className="flex flex-col items-center justify-end h-full">
              {termoData.employeeSignature ? (
                <img
                  src={termoData.employeeSignature}
                  alt="Assinatura do Funcionário"
                  className="h-12 object-contain mb-1"
                />
              ) : (
                <div className="h-12 w-full"></div>
              )}
              <div className="w-full max-w-[250px] border-b border-black mb-2"></div>
              <div className="flex flex-col items-center text-center h-[36px] justify-start mt-1">
                <span className="text-[10px] font-bold text-gray-700 uppercase tracking-widest text-center">
                  Assinatura do Funcionário
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
