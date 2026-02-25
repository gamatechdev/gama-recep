
import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient'; // Cliente Supabase canônico em services/
import { User } from '../../types'; // Tipos globais na raiz do projeto

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'dashboard' | 'agenda' | 'novo' | 'chamada' | 'atendimento' | 'stats' | 'aso';
  setActiveTab: (tab: 'dashboard' | 'agenda' | 'novo' | 'chamada' | 'atendimento' | 'stats' | 'aso') => void;
  onLogout: () => void;
  userId: string;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, onLogout, userId }) => {
  const isFullScreen = activeTab === 'atendimento';
  const isDocumentView = activeTab === 'aso';
  const [userProfile, setUserProfile] = useState<User | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data) {
      setUserProfile(data as User);
    }
  };

  return (
    <div className={`flex h-screen w-full overflow-hidden ${isFullScreen || isDocumentView ? 'p-0' : 'p-0 lg:p-4 gap-6'} flex-col lg:flex-row`}>

      {/* --- Mobile Header (Visible only on < lg) --- */}
      {!isFullScreen && !isDocumentView && (
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 z-30 sticky top-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ios-primary to-ios-secondary flex items-center justify-center shadow-md shadow-ios-primary/20 overflow-hidden">
              <img
                src="https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/public/Media/Image/image-removebg-preview%20(2).png"
                alt="Logo"
                className="w-5 h-5 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-lg font-bold text-ios-text tracking-tight">Gama Center</h1>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={userProfile?.img_url || `https://ui-avatars.com/api/?name=${userProfile?.username || 'User'}&background=04a7bd&color=fff`}
              alt="Profile"
              className="w-8 h-8 rounded-full bg-gray-100 object-cover ring-2 ring-white shadow-sm"
            />
            <button onClick={onLogout} className="text-red-500">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
            </button>
          </div>
        </header>
      )}

      {/* --- Desktop Sidebar (Hidden on < lg) --- */}
      {!isFullScreen && !isDocumentView && (
        <aside className="hidden lg:flex w-64 flex-shrink-0 glass-sidebar rounded-ios flex-col py-8 px-4 transition-all duration-500 shadow-glass relative overflow-hidden">

          {/* Logo Section */}
          <div className="mb-12 flex flex-col items-start px-4 relative z-10">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-ios-primary to-ios-secondary flex items-center justify-center shadow-lg shadow-ios-primary/30 mb-3 overflow-hidden">
              <img
                src="https://wofipjazcxwxzzxjsflh.supabase.co/storage/v1/object/public/Media/Image/image-removebg-preview%20(2).png"
                alt="Gama Center Logo"
                className="w-8 h-8 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-ios-text">Gama Center</h1>
            <p className="text-[10px] uppercase tracking-wider text-ios-subtext font-semibold mt-0.5">Health OS 26</p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2 relative z-10">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center justify-start gap-4 px-4 py-3.5 rounded-ios-btn transition-all duration-300 group ${activeTab === 'dashboard'
                  ? 'bg-ios-primary text-white shadow-lg shadow-ios-primary/25'
                  : 'text-ios-subtext hover:bg-white hover:text-ios-text'
                }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
              <span className="font-medium tracking-wide">Início</span>
            </button>

            <button
              onClick={() => setActiveTab('agenda')}
              className={`w-full flex items-center justify-start gap-4 px-4 py-3.5 rounded-ios-btn transition-all duration-300 group ${activeTab === 'agenda' || activeTab === 'novo'
                  ? 'bg-ios-primary text-white shadow-lg shadow-ios-primary/25'
                  : 'text-ios-subtext hover:bg-white hover:text-ios-text'
                }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium tracking-wide">Agenda</span>
            </button>

            <button
              onClick={() => setActiveTab('chamada')}
              className={`w-full flex items-center justify-start gap-4 px-4 py-3.5 rounded-ios-btn transition-all duration-300 group ${activeTab === 'chamada'
                  ? 'bg-ios-primary text-white shadow-lg shadow-ios-primary/25'
                  : 'text-ios-subtext hover:bg-white hover:text-ios-text'
                }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              <span className="font-medium tracking-wide">Chamada</span>
            </button>

            <button
              onClick={() => setActiveTab('stats')}
              className={`w-full flex items-center justify-start gap-4 px-4 py-3.5 rounded-ios-btn transition-all duration-300 group ${activeTab === 'stats'
                  ? 'bg-ios-primary text-white shadow-lg shadow-ios-primary/25'
                  : 'text-ios-subtext hover:bg-white hover:text-ios-text'
                }`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="font-medium tracking-wide">Estatísticas</span>
            </button>
          </nav>

          {/* User Profile Section */}
          <div className="mt-auto pt-6 flex flex-col items-start px-2 gap-4 relative z-10 border-t border-gray-100">
            <div className="flex items-center gap-3 w-full bg-white/50 p-2 rounded-2xl border border-white/50 shadow-sm">
              <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden ring-2 ring-white shadow-sm flex-shrink-0">
                <img
                  src={userProfile?.img_url || `https://ui-avatars.com/api/?name=${userProfile?.username || 'User'}&background=04a7bd&color=fff`}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-ios-text truncate leading-tight">
                  {userProfile?.username || 'Carregando...'}
                </p>
                <p className="text-[10px] text-ios-secondary font-medium">Conectado</p>
              </div>
            </div>

            <button
              onClick={onLogout}
              className="w-full text-left py-2 text-xs text-red-500 font-semibold hover:opacity-70 transition-opacity flex items-center justify-start gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
              <span>Encerrar Sessão</span>
            </button>
          </div>
        </aside>
      )}

      {/* --- Main Content --- */}
      <main className={`flex-1 overflow-hidden relative transition-all duration-500 flex flex-col ${isFullScreen || isDocumentView ? 'bg-white' : 'bg-ios-bg lg:rounded-ios'}`}>
        <div className={`flex-1 overflow-y-auto custom-scrollbar ${isFullScreen || isDocumentView ? 'p-0' : 'p-4 pb-24 lg:p-10 lg:pb-10'}`}>
          {/* Back button for FullScreen mode */}
          {isFullScreen && (
            <button
              onClick={() => setActiveTab('agenda')}
              className="absolute top-6 left-6 z-50 p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all border border-white/10 shadow-lg"
              title="Sair do modo TV"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          )}
          {children}
        </div>
      </main>

      {/* --- Mobile Bottom Navigation (Visible only on < lg) --- */}
      {!isFullScreen && !isDocumentView && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-safe pt-2 px-6 flex justify-around items-center z-40 pb-4">
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'dashboard' ? 'text-ios-primary' : 'text-gray-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
            <span className="text-[10px] font-medium">Início</span>
          </button>

          <button
            onClick={() => setActiveTab('agenda')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'agenda' ? 'text-ios-primary' : 'text-gray-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-[10px] font-medium">Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab('novo')}
            className="flex flex-col items-center justify-center -mt-6"
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-ios-primary to-ios-secondary rounded-full shadow-lg shadow-ios-primary/30 flex items-center justify-center text-white transform active:scale-95 transition-transform">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            </div>
          </button>

          <button
            onClick={() => setActiveTab('chamada')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'chamada' ? 'text-ios-primary' : 'text-gray-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" /></svg>
            <span className="text-[10px] font-medium">Chamada</span>
          </button>

          <button
            onClick={() => setActiveTab('stats')}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === 'stats' ? 'text-ios-primary' : 'text-gray-400'}`}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            <span className="text-[10px] font-medium">Stats</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default Layout;
