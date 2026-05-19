import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { User } from "../types";
import Sidebar, { TabType } from "./Sidebar";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  onLogout: () => void;
  userId: string;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  activeTab,
  setActiveTab,
  onLogout,
  userId,
}) => {
  const isFullScreen = activeTab === "atendimento";
  const isDocumentView = activeTab === "aso";
  const [userProfile, setUserProfile] = useState<User | null>(null);

  useEffect(() => {
    if (userId) {
      fetchUserProfile();
    }
  }, [userId]);

  const fetchUserProfile = async () => {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (data) {
      setUserProfile(data as User);
    }
  };

  return (
    <div
      className={`flex h-screen w-full overflow-hidden ${isFullScreen || isDocumentView ? "p-0" : "p-0 lg:p-4 gap-6"} flex-col lg:flex-row print:p-0 print:h-auto print:overflow-visible print:block`}
    >
      {/* --- Mobile Header (Visible only on < lg) --- */}
      {!isFullScreen && !isDocumentView && (
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-gray-100 z-30 sticky top-0 print:hidden">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-ios-primary to-ios-secondary flex items-center justify-center shadow-md shadow-ios-primary/20 overflow-hidden">
              <img
                src="/gc.png"
                alt="Logo"
                className="w-5 h-5 object-contain brightness-0 invert"
              />
            </div>
            <h1 className="text-lg font-bold text-ios-text tracking-tight">
              Gama Center
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <img
              src={
                userProfile?.img_url ||
                `https://ui-avatars.com/api/?name=${userProfile?.username || "User"}&background=04a7bd&color=fff`
              }
              alt="Profile"
              className="w-8 h-8 rounded-full bg-gray-100 object-cover ring-2 ring-white shadow-sm"
            />
            <button onClick={onLogout} className="text-red-500">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
            </button>
          </div>
        </header>
      )}

      {/* --- Desktop Sidebar (Hidden on < lg) --- */}
      {!isFullScreen && !isDocumentView && (
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          onLogout={onLogout} 
          userProfile={userProfile} 
        />
      )}

      {/* --- Main Content --- */}
      <main
        className={`flex-1 overflow-hidden relative transition-all duration-500 flex flex-col ${isFullScreen || isDocumentView ? "bg-white" : "bg-ios-bg lg:rounded-ios"}`}
      >
        <div
          className={`flex-1 overflow-y-auto custom-scrollbar ${isFullScreen || isDocumentView ? "p-0" : "p-4 pb-24 lg:p-10 lg:pb-10"}`}
        >
          {/* Back button for FullScreen mode */}
          {isFullScreen && (
            <button
              onClick={() => setActiveTab("agenda")}
              className="absolute top-6 left-6 z-50 p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all border border-white/10 shadow-lg"
              title="Sair do modo TV"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
          {children}
        </div>
      </main>

      {/* --- Mobile Bottom Navigation (Visible only on < lg) --- */}
      {!isFullScreen && !isDocumentView && (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 pb-safe pt-2 px-6 flex justify-around items-center z-40 pb-4 print:hidden">
          <button
            onClick={() => setActiveTab("dashboard")}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === "dashboard" ? "text-ios-primary" : "text-gray-400"}`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            <span className="text-[10px] font-medium">Início</span>
          </button>

          <button
            onClick={() => setActiveTab("agenda")}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === "agenda" ? "text-ios-primary" : "text-gray-400"}`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span className="text-[10px] font-medium">Agenda</span>
          </button>

          <button
            onClick={() => setActiveTab("novo")}
            className="flex flex-col items-center justify-center -mt-6"
          >
            <div className="w-14 h-14 bg-gradient-to-tr from-ios-primary to-ios-secondary rounded-full shadow-lg shadow-ios-primary/30 flex items-center justify-center text-white transform active:scale-95 transition-transform">
              <svg
                className="w-7 h-7"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("chamada")}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === "chamada" ? "text-ios-primary" : "text-gray-400"}`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
              />
            </svg>
            <span className="text-[10px] font-medium">Chamada</span>
          </button>

          <button
            onClick={() => setActiveTab("stats")}
            className={`flex flex-col items-center gap-1 p-2 transition-colors ${activeTab === "stats" ? "text-ios-primary" : "text-gray-400"}`}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
            <span className="text-[10px] font-medium">Stats</span>
          </button>
        </nav>
      )}
    </div>
  );
};

export default Layout;
