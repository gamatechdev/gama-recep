
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const ROOM_MAPPING = [
  { key: 'consultorio', label: 'Médico' },
  { key: 'salaexames', label: 'Exames' },
  { key: 'salacoleta', label: 'Coleta' },
  { key: 'audiometria', label: 'Audio' },
  { key: 'raiox', label: 'Raio-X' }
];

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    waiting: 0
  });
  const [roomOccupancy, setRoomOccupancy] = useState<{ label: string; count: number; height: number }[]>([]);

  useEffect(() => {
    fetchDashboardData();
    getUserInfo();
  }, []);

  const getUserInfo = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase.from('users').select('username').eq('user_id', user.id).single();
      if (data) setUserName(data.username);
    }
  };

  const fetchDashboardData = async () => {
    setLoading(true);
    const today = new Date().toISOString().split('T')[0];

    // Select specific columns to minimize data transfer
    const { data: agendamentos, error } = await supabase
      .from('agendamentos')
      .select('compareceu, consultorio, salaexames, salacoleta, audiometria, raiox')
      .eq('data_atendimento', today);

    if (error || !agendamentos) {
      console.error('Error fetching dashboard data', error);
      setLoading(false);
      return;
    }

    const typedAgendamentos = agendamentos as any[];

    // 1. Calculate Summary Stats
    const total = typedAgendamentos.length;
    const present = typedAgendamentos.filter(a => a.compareceu).length;

    // 2. Calculate Real-Time Room Occupancy
    // Logic: Count appointments where 'compareceu' is true AND status is 'Aguardando' or 'atendido' for each room
    let maxCount = 0;
    const occupancyData = ROOM_MAPPING.map(room => {
        const count = typedAgendamentos.filter(a => 
            a.compareceu && 
            (a[room.key] === 'Aguardando' || a[room.key] === 'atendido')
        ).length;
        
        if (count > maxCount) maxCount = count;
        return { label: room.label, count };
    });

    const finalOccupancyData = occupancyData.map(d => ({
        ...d,
        height: maxCount === 0 ? 0 : (d.count / maxCount) * 100
    }));

    setStats({
      total,
      present,
      waiting: total - present
    });

    setRoomOccupancy(finalOccupancyData);
    setLoading(false);
  };

  const todayDisplay = new Date().toLocaleDateString('pt-BR', { 
    weekday: 'long', 
    day: 'numeric', 
    month: 'long' 
  });

  // Calculate percentage for circular chart
  const attendanceRate = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;
  const circleCircumference = 2 * Math.PI * 54; // r=54
  const circleOffset = circleCircumference - (attendanceRate / 100) * circleCircumference;

  if (loading) {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center space-y-4">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-ios-primary"></div>
            <p className="text-ios-subtext animate-pulse">Carregando painel...</p>
        </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-ios-text tracking-tight mb-2">
            Bem vindo(a), {userName || 'Usuário'} 👋
        </h1>
        <p className="text-lg text-ios-subtext font-medium">
            Hoje é <span className="capitalize text-ios-text font-semibold">{todayDisplay}</span>. 
            <br className="hidden md:block"/> Aqui está um resumo da sua operação:
        </p>
      </div>

      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Card 1: Total Scheduled */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-float transition-all duration-500">
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <svg className="w-32 h-32 text-ios-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.89-1.99 2L3 20a2 2 0 002 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM9 14H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2zm-8 4H7v-2h2v2zm4 0h-2v-2h2v2zm4 0h-2v-2h2v2z"/></svg>
            </div>
            <div className="relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-ios-primary/10 flex items-center justify-center text-ios-primary mb-6">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                </div>
                <h3 className="text-ios-subtext font-semibold text-sm uppercase tracking-wider mb-1">Agendados Hoje</h3>
                <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-ios-text tracking-tighter">{stats.total}</span>
                    <span className="text-sm font-medium text-gray-400">pacientes</span>
                </div>
                <div className="mt-4 flex gap-2">
                    <span className="px-3 py-1 rounded-full bg-gray-50 text-xs font-bold text-gray-500 border border-gray-100">{stats.waiting} aguardando</span>
                </div>
            </div>
        </div>

        {/* Card 2: Attendance Rate (Centered) */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex items-center justify-between hover:shadow-float transition-all duration-500">
             <div className="flex flex-col justify-center h-full">
                <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center text-green-600 mb-4">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <div>
                    <h3 className="text-ios-subtext font-semibold text-sm uppercase tracking-wider mb-1">Taxa de Presença</h3>
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold text-ios-text tracking-tighter">{stats.present}</span>
                        <span className="text-sm font-medium text-gray-400">/ {stats.total}</span>
                    </div>
                    <p className="text-xs text-gray-400 font-medium mt-2">Colaboradores presentes</p>
                </div>
             </div>
             
             {/* Circular Chart */}
             <div className="relative w-32 h-32 flex-shrink-0 ml-4">
                 <svg className="w-full h-full transform -rotate-90" viewBox="0 0 128 128">
                     <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="10" fill="transparent" className="text-gray-100" />
                     <circle cx="64" cy="64" r="54" stroke="currentColor" strokeWidth="10" fill="transparent" strokeDasharray={circleCircumference} strokeDashoffset={circleOffset} className="text-green-500 transition-all duration-1000 ease-out" strokeLinecap="round" />
                 </svg>
                 <div className="absolute inset-0 flex items-center justify-center">
                     <span className="text-2xl font-black text-gray-800 tracking-tight leading-none">{attendanceRate}%</span>
                 </div>
             </div>
        </div>

      </div>

      {/* Real-time Occupancy Chart (Replaces Hourly & Quick Access) */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 flex flex-col hover:shadow-float transition-all duration-500">
            <div className="mb-6 flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-xl bg-ios-secondary/10 flex items-center justify-center text-ios-secondary">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        </div>
                        <h3 className="text-ios-subtext font-semibold text-sm uppercase tracking-wider">Ocupação em Tempo Real</h3>
                    </div>
                    <p className="text-ios-text font-bold text-2xl">Colaboradores na Clínica</p>
                </div>
                <div className="text-right hidden sm:block">
                    <span className="text-sm font-medium text-green-500 flex items-center gap-1 justify-end">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                        Atualizado agora
                    </span>
                </div>
            </div>
            
            <div className="flex-1 flex items-end justify-between gap-4 h-48 pt-4 pb-2 border-b border-gray-50">
                {roomOccupancy.map((data, index) => (
                    <div key={index} className="flex flex-col items-center gap-3 flex-1 group h-full justify-end">
                        <div className="w-full max-w-[80px] bg-gray-50 rounded-2xl relative flex items-end overflow-hidden h-full group-hover:bg-gray-100 transition-colors">
                            <div 
                                style={{ height: `${data.height}%` }} 
                                className="w-full bg-gradient-to-t from-ios-primary to-ios-secondary rounded-2xl transition-all duration-1000 ease-out relative shadow-lg shadow-ios-primary/20"
                            >
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-sm font-bold text-ios-text bg-white px-2 py-0.5 rounded-lg shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                                    {data.count} pessoas
                                </div>
                            </div>
                        </div>
                        <span className="text-xs md:text-sm font-bold text-gray-500">{data.label}</span>
                    </div>
                ))}
            </div>
            <div className="mt-4 text-center text-xs text-gray-400 font-medium">
                Quantidade de colaboradores com status "Aguardando" ou "Atendido" por setor.
            </div>
      </div>

    </div>
  );
};

export default Dashboard;
