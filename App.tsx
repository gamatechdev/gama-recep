import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import Auth from "./components/Auth";
import Layout from "./components/Layout";
import Dashboard from "./components/Dashboard";
import Agenda from "./components/Agenda";
import AppointmentForm from "./components/AppointmentForm";
import CallScreen from "./components/CallScreen";
import ServiceScreen from "./components/ServiceScreen";
import StatsScreen from "./components/StatsScreen";
import AsoDocument from "./components/AsoDocument";
import { AudiometriaMenu } from "./components/Audiometria/AudiometriaMenu";
import { Agendamento } from "./types";
import { TabType } from "./components/Sidebar";
// Importa o componente de toast e a função de notificação do Sonner
import { Toaster, toast } from "sonner";

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>("dashboard");
  const [loading, setLoading] = useState(true);

  // State for editing
  const [editingAppointment, setEditingAppointment] =
    useState<Agendamento | null>(null);

  // State for ASO Generation
  const [asoAppointment, setAsoAppointment] = useState<Agendamento | null>(
    null,
  );

  // State for Audiometria Generation
  const [audiometriaAppointment, setAudiometriaAppointment] =
    useState<Agendamento | null>(null);

  useEffect(() => {
    // Inicializa a sessão do Supabase e monitora mudanças de autenticação
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Ref para evitar restaurações duplicadas (especialmente em Strict Mode)
  const hasRestoredDraftRef = React.useRef(false);

  // Efeito que verifica se há um rascunho de audiometria ativo ao recarregar a página
  // Procura por qualquer chave com o padrão 'gama_audio_draft_*' no localStorage
  useEffect(() => {
    // Só executa após a sessão estar carregada, usuário autenticado e se ainda não restaurou
    if (loading || !session || hasRestoredDraftRef.current) return;

    // Itera sobre todas as chaves do localStorage para encontrar um rascunho ativo
    for (let i = 0; i < localStorage.length; i++) {
      // Obtém cada chave armazenada no navegador
      const key = localStorage.key(i);

      // Verifica se a chave corresponde ao padrão de rascunho de audiometria
      if (key && key.startsWith("gama_audio_draft_")) {
        try {
          // Lê o conteúdo JSON do rascunho
          const draftRaw = localStorage.getItem(key);
          if (!draftRaw) continue;

          // Converte o JSON armazenado em objeto
          const draft = JSON.parse(draftRaw);
          // Verifica se o rascunho contém o ID do agendamento
          if (!draft.agendamentoId) continue;

          // Marca como restaurado para evitar múltiplas execuções e toasts duplicados
          hasRestoredDraftRef.current = true;

          // Busca o agendamento completo no Supabase pelo ID armazenado no rascunho
          supabase
            .from("agendamentos")
            .select(`
              *,
              colaboradores:colaboradores!agendamentos_colaborador_id_fkey (id, nome, cpf, data_nascimento, sexo, cargos(nome), setor),
              unidades:unidades!agendamentos_unidade_fkey (id, nome_unidade)
            `)
            .eq("id", draft.agendamentoId)
            .single()
            .then(({ data: agendamento, error }) => {
              // Se encontrou o agendamento e não há erro, restaura a tela de audiometria
              if (!error && agendamento) {
                // Define o agendamento restaurado como o agendamento ativo de audiometria
                setAudiometriaAppointment(agendamento as unknown as Agendamento);
                // Redireciona para a tela de audiometria automaticamente
                setActiveTab("audiometriamenu");
                
                // Informa a fonoaudióloga que o rascunho foi restaurado
                toast.info("Rascunho de audiometria restaurado! Continue de onde parou.", {
                  id: "draft-restore",
                  duration: 2000
                });
              }
            });

          // Sai do loop após encontrar o primeiro rascunho ativo
          break;
        } catch {
          // Ignora rascunhos corrompidos silenciosamente
          continue;
        }
      }
    }
  // Reexecuta somente quando a sessão ou o estado de carregamento mudar
  }, [loading, session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setActiveTab("novo");
  };

  const handleEditAppointment = (appointment: Agendamento) => {
    setEditingAppointment(appointment);
    setActiveTab("novo");
  };

  const handleGenerateAso = (appointment: Agendamento) => {
    setAsoAppointment(appointment);
    setActiveTab("aso");
  };

  // Abre a tela de audiometria para um agendamento específico
  const handleOpenAudiometria = (appointment: Agendamento) => {
    setAudiometriaAppointment(appointment);
    setActiveTab("audiometriamenu");
  };

  // Reverte a chamada de audiometria: volta o status para Aguardando e retorna à tela de chamada
  const handleRevertAudiometria = async () => {
    // Verifica se há um agendamento ativo para reverter
    if (!audiometriaAppointment?.id) return;

    // Monta o objeto de atualização: zera a posição na TV e volta ao status de espera
    const updates = {
      audiometria: 'Aguardando', // Retorna o status da sala de audiometria para a fila de espera
      posicao_tela: null,        // Remove o paciente da posição exibida na TV de chamada
      sala_chamada: null,        // Limpa o nome da sala associada ao chamado
    };

    // Atualiza o status no banco de dados do agendamento
    const { error: updateError } = await supabase
      .from('agendamentos')
      .update(updates)
      .eq('id', audiometriaAppointment.id);

    if (updateError) {
      // Loga o erro e exibe feedback visual de falha para o usuário
      console.error('Erro ao reverter chamada de audiometria:', updateError);
      toast.error('Erro ao reverter chamada. Tente novamente.');
      return;
    }

    // Remove o registro de atendimento aberto (finalizou_em nulo) para não deixar sessão fantasma
    const { error: deleteError } = await supabase
      .from('atendimentos')
      .delete()
      .eq('agendamento_id', audiometriaAppointment.id)
      .is('finalizou_em', null);

    if (deleteError) {
      // Loga o erro sem bloquear o usuário, pois o status já foi revertido com sucesso
      console.error('Erro ao remover registro de atendimento:', deleteError);
    }

    // Limpa o agendamento ativo de audiometria no estado global
    setAudiometriaAppointment(null);

    // Redireciona o usuário de volta para a tela de chamada
    setActiveTab('chamada');

    // Exibe toast de confirmação da reversão
    toast.success('Chamada revertida para Aguardando!');
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard />;
      case "agenda":
        return (
          <Agenda
            onNewAppointment={handleNewAppointment}
            onEditAppointment={handleEditAppointment}
            onGenerateAso={handleGenerateAso}
          />
        );
      case "novo":
        return (
          <AppointmentForm
            initialAppointment={editingAppointment}
            onCancel={() => {
              setEditingAppointment(null);
              setActiveTab("agenda");
            }}
          />
        );
      case "chamada":
        return <CallScreen onOpenAudiometria={handleOpenAudiometria} />;
      case "atendimento":
        return <ServiceScreen />;
      case "stats":
        return <StatsScreen />;
      case "aso":
        return asoAppointment ? (
          <AsoDocument
            appointment={asoAppointment}
            onBack={() => {
              setAsoAppointment(null);
              setActiveTab("agenda");
            }}
          />
        ) : (
          <Agenda
            onNewAppointment={handleNewAppointment}
            onEditAppointment={handleEditAppointment}
            onGenerateAso={handleGenerateAso}
          />
        );
      case "audiometriamenu":
        return (
          <AudiometriaMenu
            appointment={audiometriaAppointment}
            // Fecha o menu e volta para a tela de chamada ao concluir o exame
            onClose={() => setActiveTab("chamada")}
            // Callback para reverter a chamada de audiometria de dentro da tela de anamnese
            onRevertCall={handleRevertAudiometria}
          />
        );
      default:
        return <Dashboard />;
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-ios-bg text-ios-primary font-medium animate-pulse">
        Iniciando Gama OS...
      </div>
    );
  }

  if (!session) {
    return (
      <Auth
        onSuccess={() => {
          // Force session refresh implicitly handled by onAuthStateChange or just reload logic
          window.location.reload();
        }}
      />
    );
  }

  return (
    <Layout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      onLogout={handleLogout}
      userId={session.user.id}
    >
      {renderContent()}
      <Toaster richColors position="top-right" />
    </Layout>
  );
};

export default App;
