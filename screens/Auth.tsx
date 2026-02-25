/**
 * Auth.tsx (Orquestrador)
 * ------------------------
 * Tela de login/cadastro — atua exclusivamente como ORQUESTRADOR.
 *
 * Responsabilidades deste arquivo:
 *  1. Manter o container visual com o efeito de glassmorphism animado no fundo
 *  2. Invocar o hook useAuthForm para obter estados e handlers
 *  3. Renderizar AuthHeader (logo + títulos) e AuthForm (formulário + botões)
 *
 * O que NÃO está mais neste arquivo:
 *  - Chamadas ao supabaseClient        → authService.ts
 *  - Funções checkAccess / handleAuth  → useAuthForm.ts  (consome authService)
 *  - Estados email, password, loading  → useAuthForm.ts
 *  - JSX do logo e títulos             → AuthHeader.tsx
 *  - JSX do formulário e botões        → AuthForm.tsx
 */

import React from 'react';

// ─── Hook de Estado e Lógica ──────────────────────────────────────────────────
import { useAuthForm } from '../hooks/useAuthForm';

// ─── Subcomponentes de UI ─────────────────────────────────────────────────────
import AuthHeader from '../components/auth/AuthHeader';
import AuthForm from '../components/auth/AuthForm';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AuthProps {
  onSuccess: () => void; // Callback chamado após login bem-sucedido
}

// ─── Componente Orquestrador ──────────────────────────────────────────────────

const Auth: React.FC<AuthProps> = ({ onSuccess }) => {
  /**
   * Único ponto de acesso à lógica desta tela.
   * O hook encapsula: estados do formulário, fluxo de login/cadastro,
   * verificação de acesso e tratamento de erros.
   * onSuccess é repassado para que o hook possa chamar a navegação.
   */
  const {
    email, password, isLogin, loading, error,
    setEmail, setPassword,
    handleAuth, toggleMode,
  } = useAuthForm(onSuccess);

  return (
    // Container principal: tela cheia + centralização + fundo glassmorphism
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden bg-[#F2F2F7]">

      {/*
       * Blobs de fundo para o efeito glassmorphism animado.
       * Dois gradientes circulares com blur e animação de pulse
       * criam a aparência translúcida característica.
       */}
      {/* Blob superior esquerdo — cor primária */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-ios-primary/20 blur-[100px] animate-pulse" />
      {/* Blob inferior direito — cor secundária, delay para efeito alternado */}
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-ios-secondary/20 blur-[100px] animate-pulse delay-1000" />

      {/* Card principal com glassmorphism: fundo branco translúcido + blur */}
      <div className="w-full max-w-[400px] bg-white/70 backdrop-blur-3xl rounded-[32px] p-10 shadow-float border border-white/60 relative z-10">

        {/*
         * AuthHeader: Logo da Gama Center + "Health OS 26".
         * Componente estático, sem props.
         */}
        <AuthHeader />

        {/*
         * AuthForm: Formulário completo (email, senha, erro, submit, toggle).
         * Recebe todos os dados e handlers do hook useAuthForm.
         */}
        <AuthForm
          email={email}
          password={password}
          isLogin={isLogin}
          loading={loading}
          error={error}
          setEmail={setEmail}
          setPassword={setPassword}
          handleAuth={handleAuth}
          toggleMode={toggleMode}
        />
      </div>
    </div>
  );
};

export default Auth;