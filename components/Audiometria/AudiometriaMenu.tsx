import React, { useState, useEffect, useRef } from "react";
// Importamos o ícone de atividade do Lucide para o botão flutuante de testes
import { Activity } from "lucide-react";
import { Audiometria } from "./Audiometria";
import { Anamnese } from "./Anamnese";
import { Agendamento } from "../../types";
import gamaicon from "../ui/grade/gamaicon.png";
// Importa o cliente do Supabase para sincronização do rascunho com o banco de dados
import { supabase } from "../../supabaseClient";
// Importa os tipos de Point e Line usados na grade audiométrica para tipagem do estado elevado
import { Point, Line } from "./GradeAudiometria";

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
  // Callback opcional para reverter a chamada de audiometria de volta para Aguardando
  onRevertCall?: () => void;
}

// Gera a chave única do rascunho no localStorage com base no ID do agendamento
const getDraftKey = (agendamentoId: number | string) =>
  `gama_audio_draft_${agendamentoId}`;

// Componente de menu principal que gerencia as abas da área de exames audiométricos e anamnese
export function AudiometriaMenu({ appointment, onClose, onRevertCall }: AudiometriaMenuProps) {
  // Estado para controlar a aba ativa (anamnese por padrão)
  // Elevado ao menu para que seja persistido no rascunho
  const [activeTab, setActiveTab] = useState<"anamnese" | "audiometria">(
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
    // Inicializa a função/setor do colaborador com o nome do cargo, ou converte o ID do cargo para string caso não tenha o nome
    funcao: appointment?.colaboradores?.cargos?.nome || (appointment?.colaboradores?.cargo ? String(appointment?.colaboradores?.cargo) : ""),
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

  // --- Estados elevados de Audiometria.tsx para permitir persistência centralizada ---

  // Estado para o campo de Meatoscopia da Orelha Direita
  const [meatoscopiaOD, setMeatoscopiaOD] = useState("");
  // Estado para o campo de Meatoscopia da Orelha Esquerda
  const [meatoscopiaOE, setMeatoscopiaOE] = useState("");
  // Estado para o campo de observações clínicas gerais
  const [observacoes, setObservacoes] = useState("");
  // Estado para o tipo de exame (Admissional, Periódico, etc.)
  const [tipoExame, setTipoExame] = useState<string>(
    appointment?.tipo || "Admissional",
  );
  // Estado para os dados do equipamento audiômetro utilizado
  const [audiometroData, setAudiometroData] = useState({
    marca: "VIBRASOM",
    modelo: "AVS-500",
    calibracao: "",
  });
  // Estado para os dados das tabelas de logoaudiometria (LRF e IPRF)
  const [logoAudiometriaData, setLogoAudiometriaData] = useState({
    lrfODIntensidade: "", lrfODMonossil: "", lrfODDissil: "",
    lrfOEIntensidade: "", lrfOEMonossil: "", lrfOEDissil: "",
    iprfODIntensidade: "", iprfODMonossil: "", iprfODDissil: "",
    iprfOEIntensidade: "", iprfOEMonossil: "", iprfOEDissil: "",
  });
  // Estado para os dados do laudo audiométrico (limiares e perdas por orelha)
  const [laudoData, setLaudoData] = useState({
    limiaresAceitaveis: { od: false, oe: false, bilateral: false },
    perdaOD: { checked: false, neurosensorial: false, mista: false, condutiva: false, h6000: false, h8000: false },
    perdaOE: { checked: false, neurosensorial: false, mista: false, condutiva: false, h6000: false, h8000: false },
  });
  // Estado para os dados da grade audiométrica (pontos e linhas OD/OE desenhados)
  const [gradeData, setGradeData] = useState<{
    pointsOD: Point[];
    pointsOE: Point[];
    linesOD: Line[];
    linesOE: Line[];
  } | null>(null);

  // Flag para controlar se o rascunho já foi carregado (evita sobrescrever com estado vazio na montagem)
  const [draftLoaded, setDraftLoaded] = useState(false);

  // Ref para armazenar o timer de debounce do Supabase sem causar re-renderizações
  const supabaseDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Flag para rastrear se houve alteração desde o último sync com o Supabase
  const hasPendingChangesRef = useRef(false);

  // Garante que toda vez que a aba ativa mudar (ou ao montar o componente), a tela será posicionada no topo
  useEffect(() => {
    // Timeout para garantir que a renderização do novo painel já começou
    const timer = setTimeout(() => {
      const scrollContainer = document.getElementById('main-scroll-container');
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // -----------------------------------------------------------------------
  // PASSO 1: Restaurar rascunho ao montar o componente
  // Tenta recuperar primeiro do localStorage (mais rápido) e depois do Supabase
  // -----------------------------------------------------------------------
  useEffect(() => {
    // Só executa se houver um agendamento com ID válido
    if (!appointment?.id) {
      // Marca como carregado para não bloquear os outros efeitos
      setDraftLoaded(true);
      return;
    }

    // Monta a chave do localStorage para este agendamento específico
    const draftKey = getDraftKey(appointment.id);
    // Tenta buscar o rascunho salvo localmente no navegador
    const localDraftRaw = localStorage.getItem(draftKey);

    if (localDraftRaw) {
      try {
        // Converte o JSON armazenado em objeto JavaScript
        const localDraft = JSON.parse(localDraftRaw);

        // Restaura a aba ativa (anamnese ou audiometria)
        if (localDraft.activeTab) setActiveTab(localDraft.activeTab);
        // Restaura os dados cadastrais do paciente
        if (localDraft.patientData) setPatientData(localDraft.patientData);
        // Restaura as respostas da anamnese
        if (localDraft.anamneseAnswers) setAnamneseAnswers(localDraft.anamneseAnswers);
        // Restaura o campo de meatoscopia OD
        if (localDraft.meatoscopiaOD !== undefined) setMeatoscopiaOD(localDraft.meatoscopiaOD);
        // Restaura o campo de meatoscopia OE
        if (localDraft.meatoscopiaOE !== undefined) setMeatoscopiaOE(localDraft.meatoscopiaOE);
        // Restaura as observações clínicas
        if (localDraft.observacoes !== undefined) setObservacoes(localDraft.observacoes);
        // Restaura o tipo do exame
        if (localDraft.tipoExame) setTipoExame(localDraft.tipoExame);
        // Restaura os dados do audiômetro
        if (localDraft.audiometroData) setAudiometroData(localDraft.audiometroData);
        // Restaura os dados da logoaudiometria
        if (localDraft.logoAudiometriaData) setLogoAudiometriaData(localDraft.logoAudiometriaData);
        // Restaura o laudo audiométrico
        if (localDraft.laudoData) setLaudoData(localDraft.laudoData);
        // Restaura os pontos e linhas da grade
        if (localDraft.gradeData) setGradeData(localDraft.gradeData);

        // Marca como carregado para liberar os outros efeitos de salvar
        setDraftLoaded(true);
        return;
      } catch {
        // Se houver erro no parse, ignora o rascunho corrompido e tenta o Supabase
        localStorage.removeItem(draftKey);
      }
    }

    // Se não há rascunho local válido, tenta buscar no Supabase
    const fetchDraftFromSupabase = async () => {
      const { data, error } = await supabase
        .from("audiometria")
        .select("documento, id")
        // Filtra pelo colaborador do agendamento atual
        .eq("colaborador", appointment.colaborador_id)
        // Filtra apenas os registros marcados como rascunho via operador JSONB
        .filter("documento->>is_draft", "eq", "true")
        // Ordena pelo mais recente primeiro
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!error && data?.documento) {
        // Encontrou um rascunho no banco, restaura os estados
        const doc = data.documento as any;
        // Restaura cada campo individualmente com verificação de existência
        if (doc.activeTab) setActiveTab(doc.activeTab);
        if (doc.patientData) setPatientData(doc.patientData);
        if (doc.anamneseAnswers) setAnamneseAnswers(doc.anamneseAnswers);
        if (doc.meatoscopiaOD !== undefined) setMeatoscopiaOD(doc.meatoscopiaOD);
        if (doc.meatoscopiaOE !== undefined) setMeatoscopiaOE(doc.meatoscopiaOE);
        if (doc.observacoes !== undefined) setObservacoes(doc.observacoes);
        if (doc.tipoExame) setTipoExame(doc.tipoExame);
        if (doc.audiometroData) setAudiometroData(doc.audiometroData);
        if (doc.logoAudiometriaData) setLogoAudiometriaData(doc.logoAudiometriaData);
        if (doc.laudoData) setLaudoData(doc.laudoData);
        if (doc.gradeData) setGradeData(doc.gradeData);
      }

      // Marca como carregado independentemente do resultado da busca
      setDraftLoaded(true);
    };

    fetchDraftFromSupabase();
  // Executa apenas uma vez ao montar o componente (sem dependências para evitar loops)
  }, []);

  // -----------------------------------------------------------------------
  // PASSO 2: Salvar no localStorage de forma instantânea a cada mudança de estado
  // Só executa após o rascunho ter sido carregado para evitar sobrescrever com estado vazio
  // -----------------------------------------------------------------------
  useEffect(() => {
    // Aguarda o carregamento inicial do draft antes de começar a salvar
    if (!draftLoaded || !appointment?.id) return;

    // Monta o objeto de rascunho completo com todos os estados relevantes
    const draft = {
      // Marca o timestamp da última alteração para fins de debug e ordenação
      timestamp: new Date().toISOString(),
      // ID do agendamento para recuperação automática na tela inicial
      agendamentoId: appointment.id,
      // Aba ativa (anamnese ou audiometria) para restaurar exatamente onde parou
      activeTab,
      // Dados cadastrais do paciente
      patientData,
      // Respostas do formulário de anamnese
      anamneseAnswers,
      // Campo de meatoscopia da orelha direita
      meatoscopiaOD,
      // Campo de meatoscopia da orelha esquerda
      meatoscopiaOE,
      // Observações clínicas gerais
      observacoes,
      // Tipo do exame audiométrico (Admissional, Periódico, etc.)
      tipoExame,
      // Dados do equipamento audiômetro utilizado
      audiometroData,
      // Dados da logoaudiometria (tabelas LRF e IPRF)
      logoAudiometriaData,
      // Dados do laudo (limiares aceitáveis e perdas por orelha)
      laudoData,
      // Dados da grade audiométrica (pontos e linhas OD/OE)
      gradeData,
    };

    // Grava o JSON serializado no localStorage de forma instantânea (menos de 1ms)
    localStorage.setItem(getDraftKey(appointment.id), JSON.stringify(draft));

    // Sinaliza que há mudanças pendentes para serem enviadas ao Supabase
    hasPendingChangesRef.current = true;
  }, [
    // Reage a qualquer mudança nos estados persistíveis
    draftLoaded, activeTab, patientData, anamneseAnswers,
    meatoscopiaOD, meatoscopiaOE, observacoes, tipoExame,
    audiometroData, logoAudiometriaData, laudoData, gradeData,
  ]);

  // -----------------------------------------------------------------------
  // PASSO 3: Sincronizar com o Supabase a cada 5 segundos (debounced)
  // Garante backup em nuvem imune a limpeza de cache ou troca de dispositivo
  // -----------------------------------------------------------------------
  useEffect(() => {
    // Aguarda o carregamento do draft e a existência do agendamento
    if (!draftLoaded || !appointment?.id) return;

    // Função que realiza o upsert no Supabase com o estado atual do rascunho
    const syncToSupabase = async () => {
      // Não sincroniza se não houver mudanças pendentes desde o último sync
      if (!hasPendingChangesRef.current) return;

      // Monta o payload completo com is_draft = true para distinguir do salvo final
      const documentoJson = {
        // Flag que indica que este registro ainda é um rascunho (não finalizado)
        is_draft: true,
        // Aba ativa para restauração fiel da interface
        activeTab,
        // Dados cadastrais do paciente
        patientData,
        // Respostas da anamnese
        anamneseAnswers,
        // Meatoscopia da Orelha Direita
        meatoscopiaOD,
        // Meatoscopia da Orelha Esquerda
        meatoscopiaOE,
        // Observações clínicas
        observacoes,
        // Tipo do exame
        tipoExame,
        // Dados do audiômetro
        audiometroData,
        // Dados da logoaudiometria
        logoAudiometriaData,
        // Laudo audiométrico
        laudoData,
        // Grade audiométrica (pontos e linhas)
        gradeData,
      };

      // Verifica se já existe um rascunho para este colaborador no Supabase
      const { data: existing } = await supabase
        .from("audiometria")
        .select("id")
        .eq("colaborador", appointment.colaborador_id)
        // Usa o operador de extração de texto JSONB para filtrar is_draft = true
        .filter("documento->>is_draft", "eq", "true")
        .maybeSingle();

      if (existing?.id) {
        // Se já existe um rascunho, atualiza o registro com os dados mais recentes
        await supabase
          .from("audiometria")
          .update({ documento: documentoJson })
          .eq("id", existing.id);
      } else {
        // Se não existe, cria um novo registro de rascunho no banco de dados
        await supabase
          .from("audiometria")
          .insert({
            // Vincula o rascunho ao colaborador do agendamento ativo
            colaborador: appointment.colaborador_id,
            // Salva o JSON do rascunho no campo documento (JSONB)
            documento: documentoJson,
            // URL fica nula enquanto o PDF final não foi gerado
            audiometria_url: null,
          });
      }

      // Reseta a flag após o envio bem-sucedido para evitar syncs desnecessários
      hasPendingChangesRef.current = false;
    };

    // Cancela o timer anterior para evitar múltiplos disparos simultâneos (técnica debounce)
    if (supabaseDebounceRef.current) {
      clearTimeout(supabaseDebounceRef.current);
    }

    // Agenda a sincronização para ocorrer após 5 segundos de inatividade nos estados
    supabaseDebounceRef.current = setTimeout(syncToSupabase, 5000);

    // Cancela o timer ao desmontar ou quando os estados mudarem antes do timeout expirar
    return () => {
      if (supabaseDebounceRef.current) {
        clearTimeout(supabaseDebounceRef.current);
      }
    };
  }, [
    // Reage às mesmas dependências do efeito do localStorage
    draftLoaded, activeTab, patientData, anamneseAnswers,
    meatoscopiaOD, meatoscopiaOE, observacoes, tipoExame,
    audiometroData, logoAudiometriaData, laudoData, gradeData,
  ]);

  // -----------------------------------------------------------------------
  // Função chamada pelo componente Audiometria quando o exame é salvo com sucesso
  // Remove o rascunho do localStorage e do Supabase para não aparecer mais
  // -----------------------------------------------------------------------
  const handleExameSalvo = async () => {
    // Remove o rascunho do armazenamento local do navegador imediatamente
    if (appointment?.id) {
      localStorage.removeItem(getDraftKey(appointment.id));
    }

    // Remove o rascunho do Supabase (o registro final já foi inserido por Audiometria.tsx)
    if (appointment?.colaborador_id) {
      await supabase
        .from("audiometria")
        .delete()
        .eq("colaborador", appointment.colaborador_id)
        // Deleta apenas o rascunho (is_draft = true), nunca o registro final
        .filter("documento->>is_draft", "eq", "true");
    }

    // Chama o callback original de fechamento para redirecionar o usuário
    if (onClose) onClose();
  };

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
            // Ao salvar a anamnese com sucesso, avança para a aba de audiometria
            onSaveSuccess={() => setActiveTab("audiometria")}
            // Repassa o callback de reverter chamada recebido pelo menu
            onRevertCall={onRevertCall}
          />
        </div>

        {/* Painel da Audiometria: visível na tela quando a aba ativa for "audiometria" */}
        <div className={`animate-in fade-in duration-500 ${activeTab === "audiometria" ? "block" : "hidden"}`}>
          {/* Componente Audiometria recebendo todas as props elevadas para persistência */}
          <Audiometria
            // Dados do agendamento carregados do banco de dados
            appointment={appointment}
            // Estado contendo os dados cadastrais em tempo real do paciente
            patientData={patientData}
            // Função para atualizar os dados cadastrais do paciente de forma global
            setPatientData={setPatientData}
            // Respostas do formulário de anamnese
            anamneseAnswers={anamneseAnswers}
            // Callback disparado ao acionar o botão de retornar para a anamnese
            onBack={() => setActiveTab("anamnese")}
            // Callback disparado quando o exame for salvo com sucesso (limpa o rascunho)
            onSaveSuccess={handleExameSalvo}
            // --- Props elevadas para persistência centralizada de rascunho ---
            // Estado e setter do campo de meatoscopia OD
            meatoscopiaOD={meatoscopiaOD}
            setMeatoscopiaOD={setMeatoscopiaOD}
            // Estado e setter do campo de meatoscopia OE
            meatoscopiaOE={meatoscopiaOE}
            setMeatoscopiaOE={setMeatoscopiaOE}
            // Estado e setter das observações clínicas
            observacoes={observacoes}
            setObservacoes={setObservacoes}
            // Estado e setter do tipo do exame
            tipoExame={tipoExame}
            setTipoExame={setTipoExame}
            // Estado e setter dos dados do audiômetro
            audiometroData={audiometroData}
            setAudiometroData={setAudiometroData}
            // Estado e setter da logoaudiometria
            logoAudiometriaData={logoAudiometriaData}
            setLogoAudiometriaData={setLogoAudiometriaData}
            // Estado e setter do laudo audiométrico
            laudoData={laudoData}
            setLaudoData={setLaudoData}
            // Estado e setter da grade audiométrica
            gradeData={gradeData}
            setGradeData={setGradeData}
          />
        </div>
      </div>
    </div>
  );
}
