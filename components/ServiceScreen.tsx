import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { Agendamento } from '../types';

const ServiceScreen: React.FC = () => {
  const [currentCall, setCurrentCall] = useState<Agendamento | null>(null);
  const [historyList, setHistoryList] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Refs to track previous state for sound triggers
  const previousCallIdRef = useRef<number | null>(null);
  const previousRoomRef = useRef<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    fetchDisplayData();

    // Listen for ANY update to the table
    const channel = supabase
      .channel('public:agendamentos')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'agendamentos' },
        (payload) => {
          fetchDisplayData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const fetchDisplayData = async () => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select(`
        *,
        colaboradores:colaboradores!agendamentos_colaborador_id_fkey (id, nome)
      `)
      .not('posicao_tela', 'is', null)
      .neq('sala_chamada', 'nenhuma')
      .order('posicao_tela', { ascending: true })
      .limit(6);

    if (error) {
      console.error("Error fetching display data:", error);
    } else if (data) {
      const allCalls = data as unknown as Agendamento[];
      const main = allCalls.find(a => a.posicao_tela === 1) || null;
      const history = allCalls.filter(a => a.posicao_tela !== 1);
      
      const hasChanged = main && (
          main.id !== previousCallIdRef.current || 
          main.sala_chamada !== previousRoomRef.current
      );

      if (hasChanged) {
        previousCallIdRef.current = main.id;
        previousRoomRef.current = main.sala_chamada || null;
        await playAlert();
      }
      
      setCurrentCall(main);
      setHistoryList(history);
      setLoading(false);
    }
  };

  const enableAudio = async () => {
    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        const ctx = new AudioContext();
        audioContextRef.current = ctx;
        
        await ctx.resume();
        setAudioEnabled(true);
        playAlert(); // Play test sound
    } catch (e) {
        console.error("Audio Context Init Error", e);
    }
  };

  const playAlert = async () => {
    const ctx = audioContextRef.current;
    if (!ctx) return;
    
    try {
        if (ctx.state === 'suspended') {
            await ctx.resume();
        }

        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        const now = ctx.currentTime;

        oscillator.frequency.setValueAtTime(880, now);
        oscillator.frequency.exponentialRampToValueAtTime(440, now + 0.8);
        
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(0.5, now + 0.05); 
        gainNode.gain.exponentialRampToValueAtTime(0.01, now + 1.5); 

        oscillator.start(now);
        oscillator.stop(now + 1.5);
    } catch (e) {
        console.error("Audio Play Error", e);
    }
  };

  if (loading) {
     return (
        <div className="w-full h-full flex items-center justify-center bg-black text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-ios-primary mb-4"></div>
        </div>
     );
  }

  return (
    <div className="h-full w-full flex flex-col lg:flex-row gap-6 relative bg-black p-4 lg:p-6">
        
        {/* Audio Permission Overlay */}
        {!audioEnabled && (
            <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                <div className="text-center p-8 border border-white/20 rounded-3xl bg-white/5 shadow-2xl">
                    <div className="text-5xl mb-6">📺</div>
                    <h2 className="text-3xl font-bold mb-4">Painel de Chamada</h2>
                    <p className="text-gray-400 mb-8 max-w-md">Clique abaixo para ativar o som de alerta.</p>
                    <button 
                        onClick={enableAudio}
                        className="bg-ios-primary text-white px-10 py-4 rounded-full font-bold text-lg hover:bg-ios-secondary transition-colors shadow-lg shadow-ios-primary/30"
                    >
                        Ativar Som
                    </button>
                </div>
            </div>
        )}

        {/* Main Display Area (Position 1) */}
        <div className="flex-1 flex flex-col justify-center items-center bg-gradient-to-br from-ios-primary to-ios-secondary rounded-[32px] lg:rounded-[40px] shadow-2xl p-6 lg:p-10 relative overflow-hidden text-white transition-all duration-700 min-h-[50vh]">
             {/* Background decoration */}
             <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 animate-pulse"></div>
             <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2"></div>

             {currentCall ? (
                 <div className="relative z-10 text-center space-y-8 lg:space-y-12 animate-in fade-in zoom-in duration-700 w-full">
                     <div className="space-y-2 lg:space-y-4">
                        <p className="text-white/80 text-lg lg:text-3xl uppercase font-bold tracking-[0.2em]">Chamada Atual</p>
                        <h1 className="text-4xl md:text-6xl lg:text-8xl font-black leading-tight drop-shadow-xl break-words w-full px-2">
                            {currentCall.colaboradores?.nome}
                        </h1>
                     </div>
                     
                     <div className="w-32 lg:w-48 h-1.5 lg:h-2 bg-white/30 mx-auto rounded-full"></div>

                     <div className="space-y-2 lg:space-y-4">
                        <p className="text-white/80 text-base lg:text-2xl uppercase font-bold tracking-[0.2em]">Dirija-se à</p>
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl px-8 lg:px-16 py-4 lg:py-8 inline-block shadow-2xl">
                            <h2 className="text-4xl md:text-7xl lg:text-9xl font-black tracking-tighter text-white drop-shadow-lg">
                                {currentCall.sala_chamada}
                            </h2>
                        </div>
                     </div>
                 </div>
             ) : (
                <div className="relative z-10 text-center opacity-70">
                     <div className="w-24 h-24 lg:w-40 lg:h-40 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8 text-5xl lg:text-7xl shadow-inner border border-white/10">
                        ⏳
                     </div>
                    <h1 className="text-3xl lg:text-5xl font-bold tracking-tight">Aguardando...</h1>
                </div>
             )}
        </div>

        {/* Side List (Positions > 1) */}
        <div className="w-full lg:w-1/3 bg-[#111] rounded-[32px] lg:rounded-[40px] border border-white/10 shadow-glass flex flex-col overflow-hidden max-h-[40vh] lg:max-h-full">
            <div className="p-6 lg:p-8 border-b border-white/10 bg-white/5">
                <h3 className="text-xl lg:text-2xl font-bold text-white flex items-center gap-3">
                    <svg className="w-6 h-6 lg:w-8 lg:h-8 text-ios-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Últimas Chamadas
                </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 lg:p-6 space-y-3 lg:space-y-4 custom-scrollbar">
                {historyList.length > 0 ? (
                    historyList.map((item) => (
                        <div key={item.id} className="bg-white/5 p-4 lg:p-6 rounded-2xl shadow-sm flex items-center justify-between border border-white/5 hover:bg-white/10 transition-colors animate-in slide-in-from-right duration-500 group">
                             <div>
                                <p className="font-bold text-lg lg:text-xl text-white mb-1 lg:mb-2 group-hover:text-ios-primary transition-colors">{item.colaboradores?.nome}</p>
                                <span className="inline-block px-2 lg:px-3 py-0.5 lg:py-1 bg-white/10 rounded-lg text-[10px] lg:text-xs text-gray-300 font-bold uppercase tracking-wide">
                                    Chamado
                                </span>
                             </div>
                             <div className="text-right">
                                <span className="block text-xl lg:text-3xl font-bold text-ios-primary">{item.sala_chamada}</span>
                             </div>
                        </div>
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-500 opacity-60 min-h-[100px]">
                        <p className="text-lg lg:text-xl">Histórico vazio</p>
                    </div>
                )}
            </div>
        </div>

    </div>
  );
};

export default ServiceScreen;