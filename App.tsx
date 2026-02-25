
import React, { useState, useEffect } from 'react';
import { supabase } from './services/supabaseClient'; // Importando o client Supabase canônico
import Auth from './screens/Auth'; // Tela de autenticação
import Layout from './components/layout/Layout'; // Layout principal da aplicação
import Dashboard from './screens/Dashboard'; // Tela de dashboard
import Agenda from './screens/Agenda'; // Tela de agenda
import AppointmentForm from './components/agenda/AppointmentForm'; // Formulário de agendamento
import CallScreen from './screens/CallScreen'; // Tela de chamada
import ServiceScreen from './screens/ServiceScreen'; // Tela de atendimento (TV)
import StatsScreen from './screens/StatsScreen'; // Tela de estatísticas
import AsoDocument from './screens/AsoDocument'; // Tela de geração de ASO
import { Agendamento } from './types'; // Tipos globais da aplicação

const App: React.FC = () => {
  const [session, setSession] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'agenda' | 'novo' | 'chamada' | 'atendimento' | 'stats' | 'aso'>('dashboard');
  const [loading, setLoading] = useState(true);
  
  // State for editing
  const [editingAppointment, setEditingAppointment] = useState<Agendamento | null>(null);
  
  // State for ASO Generation
  const [asoAppointment, setAsoAppointment] = useState<Agendamento | null>(null);

  useEffect(() => {
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleNewAppointment = () => {
    setEditingAppointment(null);
    setActiveTab('novo');
  };

  const handleEditAppointment = (appointment: Agendamento) => {
    setEditingAppointment(appointment);
    setActiveTab('novo');
  };

  const handleGenerateAso = (appointment: Agendamento) => {
    setAsoAppointment(appointment);
    setActiveTab('aso');
  };

  const renderContent = () => {
    switch (activeTab) {
        case 'dashboard':
            return <Dashboard />;
        case 'agenda':
            return <Agenda onNewAppointment={handleNewAppointment} onEditAppointment={handleEditAppointment} onGenerateAso={handleGenerateAso} />;
        case 'novo':
            return (
                <AppointmentForm 
                    initialAppointment={editingAppointment} 
                    onCancel={() => {
                        setEditingAppointment(null);
                        setActiveTab('agenda');
                    }}
                />
            );
        case 'chamada':
            return <CallScreen />;
        case 'atendimento':
            return <ServiceScreen />;
        case 'stats':
            return <StatsScreen />;
        case 'aso':
            return asoAppointment ? (
                <AsoDocument 
                    appointment={asoAppointment} 
                    onBack={() => {
                        setAsoAppointment(null);
                        setActiveTab('agenda');
                    }} 
                />
            ) : <Agenda onNewAppointment={handleNewAppointment} onEditAppointment={handleEditAppointment} onGenerateAso={handleGenerateAso} />;
        default:
            return <Dashboard />;
    }
  };

  if (loading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-ios-bg text-ios-primary font-medium animate-pulse">Iniciando Gama OS...</div>;
  }

  if (!session) {
    return <Auth onSuccess={() => {
        // Force session refresh implicitly handled by onAuthStateChange or just reload logic
        window.location.reload(); 
    }} />;
  }

  return (
    <Layout 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onLogout={handleLogout}
        userId={session.user.id} 
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
