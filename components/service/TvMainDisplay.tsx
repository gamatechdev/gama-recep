/**
 * TvMainDisplay.tsx
 * ------------------
 * Painel principal do Modo TV: exibe o nome do paciente chamado e a sala de destino.
 * Ocupa a maior parte da tela com um gradiente vibrante (ios-primary → ios-secondary).
 *
 * Estados visuais:
 *  - currentCall com dados → Exibe nome e sala com animações de entrada
 *  - currentCall === null  → Exibe estado de aguardo com ícone ⏳
 *
 * Componente puramente visual — sem lógica e sem estado próprios.
 */

import React from 'react';
import { Agendamento } from '../../types';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TvMainDisplayProps {
    currentCall: Agendamento | null; // Chamada ativa (posicao_tela === 1) ou null
}

// ─── Componente ───────────────────────────────────────────────────────────────

const TvMainDisplay: React.FC<TvMainDisplayProps> = ({ currentCall }) => {
    return (
        // Container principal: flex, gradiente, bordas arredondadas, responsivo
        <div className="flex-1 flex flex-col justify-center items-center bg-gradient-to-br from-ios-primary to-ios-secondary rounded-[32px] lg:rounded-[40px] shadow-2xl p-6 lg:p-10 relative overflow-hidden text-white transition-all duration-700 min-h-[50vh]">

            {/* ── Decorações de fundo (blobs animados) ──────────────────────── */}
            {/* Blob superior direito — cria profundidade e movimento */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2 animate-pulse" />
            {/* Blob inferior esquerdo — complementa o efeito de profundidade */}
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-black/10 rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />

            {/* ── Estado com chamada ativa ──────────────────────────────────── */}
            {currentCall ? (
                <div className="relative z-10 text-center space-y-8 lg:space-y-12 animate-in fade-in zoom-in duration-700 w-full">

                    {/* Bloco do nome do paciente */}
                    <div className="space-y-2 lg:space-y-4">
                        <p className="text-white/80 text-lg lg:text-3xl uppercase font-bold tracking-[0.2em]">
                            Chamada Atual
                        </p>
                        {/* Nome do colaborador em destaque — tamanho máximo para visibilidade a distância */}
                        <h1 className="text-4xl md:text-6xl lg:text-8xl font-black leading-tight drop-shadow-xl break-words w-full px-2">
                            {currentCall.colaboradores?.nome}
                        </h1>
                    </div>

                    {/* Separador visual entre nome e sala */}
                    <div className="w-32 lg:w-48 h-1.5 lg:h-2 bg-white/30 mx-auto rounded-full" />

                    {/* Bloco da sala de destino */}
                    <div className="space-y-2 lg:space-y-4">
                        <p className="text-white/80 text-base lg:text-2xl uppercase font-bold tracking-[0.2em]">
                            Dirija-se à
                        </p>
                        {/* Sala em card destacado com backdrop blur para legibilidade */}
                        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl px-8 lg:px-16 py-4 lg:py-8 inline-block shadow-2xl">
                            <h2 className="text-4xl md:text-7xl lg:text-9xl font-black tracking-tighter text-white drop-shadow-lg">
                                {currentCall.sala_chamada}
                            </h2>
                        </div>
                    </div>
                </div>
            ) : (
                /* ── Estado sem chamada: aguardando ────────────────────────────── */
                <div className="relative z-10 text-center opacity-70">
                    <div className="w-24 h-24 lg:w-40 lg:h-40 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6 lg:mb-8 text-5xl lg:text-7xl shadow-inner border border-white/10">
                        ⏳
                    </div>
                    <h1 className="text-3xl lg:text-5xl font-bold tracking-tight">Aguardando...</h1>
                </div>
            )}
        </div>
    );
};

export default TvMainDisplay;
