
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

interface AtendimentoStats {
  id: number;
  chamou_em: string;
  finalizou_em: string;
  user_id: number;
}

interface ProfissionalMetric {
  id: number;
  name: string;
  count: number;
  avgTimeSeconds: number;
}

const StatsScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [averageTime, setAverageTime] = useState(0); // User average
  const [globalAverage, setGlobalAverage] = useState(0); // Team average
  const [totalServices, setTotalServices] = useState(0);
  const [ranking, setRanking] = useState<ProfissionalMetric[]>([]);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    
    try {
        // 1. Obter usuário autenticado
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
            setLoading(false);
            return;
        }

        // 2. Obter ID interno da tabela 'users'
        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('id, username')
            .eq('user_id', user.id)
            .single();

        if (userError || !userData) {
            console.error("Erro ao identificar usuário:", userError);
            setLoading(false);
            return;
        }

        const internalUserId = userData.id;
        setUserName(userData.username);

        // 3. Calcular Inicio do Dia (Local Time -> UTC)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        // 4. Buscar TODOS os atendimentos DE HOJE (da equipe inteira)
        // Removemos o filtro .eq('user_id') para poder calcular a média global
        const { data, error } = await supabase
        .from('atendimentos')
        .select('id, chamou_em, finalizou_em, user_id')
        .gte('chamou_em', todayISO) 
        .not('finalizou_em', 'is', null)
        .not('chamou_em', 'is', null);

        if (error) {
            console.error("Erro ao buscar estatísticas:", error);
            setLoading(false);
            return;
        }

        const records = data as unknown as AtendimentoStats[];
        processMetrics(records, userData.username, internalUserId);
    } catch (err) {
        console.error("Erro geral:", err);
    } finally {
        setLoading(false);
    }
  };

  const processMetrics = (records: AtendimentoStats[], currentUserName: string, currentUserId: number) => {
    
    // 1. Processar TODOS os registros válidos do dia (Média Global)
    const validRecords = records.filter(rec => {
        const start = new Date(rec.chamou_em).getTime();
        const end = new Date(rec.finalizou_em).getTime();
        const diffSeconds = (end - start) / 1000;
        return diffSeconds >= 0 && diffSeconds <= 36000; // Filtra erros grosseiros (>10h)
    });

    let globalTotalSeconds = 0;
    validRecords.forEach(rec => {
        const start = new Date(rec.chamou_em).getTime();
        const end = new Date(rec.finalizou_em).getTime();
        globalTotalSeconds += (end - start) / 1000;
    });

    const globalCount = validRecords.length;
    const globalAvg = globalCount > 0 ? globalTotalSeconds / globalCount : 0;
    setGlobalAverage(globalAvg);

    // 2. Processar registros DO USUÁRIO (Média Pessoal)
    const userRecords = validRecords.filter(rec => rec.user_id === currentUserId);
    
    let userTotalSeconds = 0;
    userRecords.forEach(rec => {
        const start = new Date(rec.chamou_em).getTime();
        const end = new Date(rec.finalizou_em).getTime();
        userTotalSeconds += (end - start) / 1000;
    });

    const userCount = userRecords.length;
    const userAvg = userCount > 0 ? userTotalSeconds / userCount : 0;

    setTotalServices(userCount);
    setAverageTime(userAvg);

    // Setamos o ranking apenas com o usuário atual para exibição na barra, 
    // mas usaremos globalAverage para comparação visual
    setRanking([{
        id: currentUserId,
        name: currentUserName,
        count: userCount,
        avgTimeSeconds: userAvg
    }]);
  };

  const formatDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = Math.floor(totalSeconds % 60);
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const formatMinutesOnly = (totalSeconds: number) => {
    return Math.floor(totalSeconds / 60);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center space-y-4 text-ios-subtext">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ios-primary"></div>
        Calculando comparativo da equipe...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-ios-text tracking-tight">Desempenho Diário</h2>
          <p className="text-ios-subtext font-medium mt-1">Estatísticas de hoje ({new Date().toLocaleDateString('pt-BR')})</p>
        </div>
      </div>

      {/* --- Main KPI Cards --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Total Atendimentos Hoje */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-float transition-all duration-300">
             <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
             
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-500 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Seus Atendimentos</h3>
             </div>
             
             <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-ios-text tracking-tight">
                    {totalServices}
                </span>
                <span className="text-xl font-medium text-gray-400">pacientes</span>
             </div>
             <p className="text-sm text-gray-400 mt-2 font-medium">
                 Finalizados com sucesso hoje
             </p>
        </div>

        {/* Média de Tempo Hoje */}
        <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-float transition-all duration-300">
             <div className="absolute right-0 top-0 w-32 h-32 bg-green-50 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
             
             <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                </div>
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Seu Tempo Médio</h3>
             </div>
             
             <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-ios-text tracking-tight">
                    {formatMinutesOnly(averageTime)}
                </span>
                <span className="text-xl font-medium text-gray-400">minutos</span>
             </div>

             <div className="text-sm text-gray-400 mt-2 font-medium">
                {averageTime % 60 > 0 ? `e ${Math.floor(averageTime % 60)} segundos` : 'exatos'} por paciente
             </div>
        </div>
      </div>

      {/* --- Visualização de Barra --- */}
      <div className="bg-white rounded-[32px] p-8 shadow-sm border border-gray-100">
         <h3 className="text-lg font-bold text-ios-text mb-6">Comparativo com a Equipe</h3>
         
         <div className="space-y-6">
            {ranking.map((prof) => {
                // Base para a barra: Média Global.
                // Se o usuário for igual à média, 50% da barra (ponto médio visual).
                // Se o usuário for mais rápido (tempo menor), barra menor.
                // Se o usuário for mais lento (tempo maior), barra maior.
                
                const referenceTime = globalAverage > 0 ? globalAverage : 1;
                
                // Calculamos a porcentagem relativa à média global.
                // Vamos definir que 100% da largura visual é o dobro da média global (para caber quem é mais lento).
                const maxVisualScale = referenceTime * 2; 
                
                let percentage = (prof.avgTimeSeconds / maxVisualScale) * 100;
                // Clamp entre 5% (para aparecer algo) e 100%
                if (percentage < 5) percentage = 5;
                if (percentage > 100) percentage = 100;

                // Color Coding:
                // Se Tempo Usuário <= Média Global: Verde (Bom desempenho/Rápido)
                // Se Tempo Usuário > Média Global: Vermelho (Mais lento que a média)
                let barColor = 'bg-ios-primary';
                let statusText = '';
                
                if (prof.avgTimeSeconds <= globalAverage) {
                    barColor = 'bg-green-500';
                    const diff = Math.floor(globalAverage - prof.avgTimeSeconds);
                    statusText = `Você está ${diff}s mais rápido que a média da equipe.`;
                } else {
                    barColor = 'bg-red-400';
                    const diff = Math.floor(prof.avgTimeSeconds - globalAverage);
                    statusText = `Atenção: Você está ${diff}s acima da média da equipe hoje.`;
                }

                if (globalAverage === 0) {
                    barColor = 'bg-gray-300';
                    statusText = 'Ainda não há dados suficientes da equipe para comparação.';
                    percentage = 0;
                }

                return (
                    <div key={prof.id} className="group">
                        <div className="flex justify-between items-end mb-2">
                            <div className="flex items-center gap-3">
                                <span className="w-10 h-10 rounded-full bg-ios-primary/10 text-ios-primary text-sm font-bold flex items-center justify-center border border-ios-primary/20">
                                    {userName.charAt(0).toUpperCase()}
                                </span>
                                <div>
                                    <span className="font-bold text-gray-800 block">{userName} (Você)</span>
                                    <span className="text-xs text-gray-400 font-medium">
                                        Média da Equipe hoje: {formatDuration(globalAverage)}
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block font-bold text-gray-900">{formatDuration(prof.avgTimeSeconds)}</span>
                                <span className="text-[10px] text-gray-400 font-medium uppercase">Sua Média</span>
                            </div>
                        </div>
                        
                        {/* Container da barra */}
                        <div className="relative w-full h-4 bg-gray-100 rounded-full overflow-hidden border border-gray-200 mt-3">
                            {/* Marcador da Média Global (50% se usarmos maxVisualScale = 2 * average) */}
                            {globalAverage > 0 && (
                                <div 
                                    className="absolute top-0 bottom-0 w-0.5 bg-gray-400 z-10" 
                                    style={{ left: '50%' }}
                                    title="Média da Equipe"
                                ></div>
                            )}

                            <div 
                                style={{ width: `${percentage}%` }} 
                                className={`h-full rounded-full ${barColor} transition-all duration-1000 ease-out shadow-sm`}
                            ></div>
                        </div>
                        
                        <div className="flex justify-between mt-1 text-[10px] text-gray-400 font-medium uppercase tracking-wider">
                            <span>0m</span>
                            <span>Média da Equipe</span>
                            <span>{formatMinutesOnly(globalAverage * 2)}m+</span>
                        </div>

                        <p className={`text-xs mt-3 text-right font-medium ${prof.avgTimeSeconds <= globalAverage ? 'text-green-600' : 'text-red-500'}`}>
                            {statusText}
                        </p>
                    </div>
                );
            })}

            {ranking.length === 0 && (
                <div className="text-center py-12 flex flex-col items-center justify-center text-gray-400">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 text-2xl">
                        📊
                    </div>
                    <p className="font-medium">Sem dados suficientes.</p>
                    <p className="text-xs mt-1">Finalize atendimentos para gerar o comparativo.</p>
                </div>
            )}
         </div>
      </div>
    </div>
  );
};

export default StatsScreen;
