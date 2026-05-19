import React, { useState } from "react";
import { Headphones, ClipboardList } from "lucide-react";
import { Audiometria } from "./Audiometria";
import { Anamnese } from "./Anamnese";
import { Agendamento } from "../types";

interface AudiometriaMenuProps {
  appointment?: Agendamento | null;
}

export function AudiometriaMenu({ appointment }: AudiometriaMenuProps) {
  // Estado para controlar a aba ativa (audiometria por padrão)
  const [activeTab, setActiveTab] = useState<"audiometria" | "anamnese">("audiometria");

  return (
    <div className="w-full space-y-6">
      {/* Header com Seletor de Abas Estilo iOS */}
      <div className="flex justify-center pt-2 print:hidden">
        <div className="bg-gray-100/80 backdrop-blur-md p-1 rounded-ios flex w-full max-w-md border border-gray-200 shadow-sm">
          {/* Aba Audiometria */}
          <button
            onClick={() => setActiveTab("audiometria")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-ios-sm transition-all duration-300 ${
              activeTab === "audiometria"
                ? "bg-white text-ios-primary shadow-md scale-100"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 scale-95"
            }`}
          >
            <Headphones className={`w-4 h-4 ${activeTab === "audiometria" ? "text-ios-primary" : "text-gray-400"}`} />
            <span className="text-sm font-semibold">Audiometria</span>
          </button>

          {/* Aba Anamnese */}
          <button
            onClick={() => setActiveTab("anamnese")}
            className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-ios-sm transition-all duration-300 ${
              activeTab === "anamnese"
                ? "bg-white text-ios-primary shadow-md scale-100"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 scale-95"
            }`}
          >
            <ClipboardList className={`w-4 h-4 ${activeTab === "anamnese" ? "text-ios-primary" : "text-gray-400"}`} />
            <span className="text-sm font-semibold">Anamnese</span>
          </button>
        </div>
      </div>

      {/* Conteúdo Dinâmico */}
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
        {activeTab === "audiometria" ? (
          <Audiometria appointment={appointment} />
        ) : (
          <Anamnese appointment={appointment} />
        )}
      </div>
    </div>
  );
}
