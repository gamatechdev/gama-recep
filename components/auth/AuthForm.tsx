/**
 * AuthForm.tsx
 * -------------
 * Formulário visual de autenticação: inputs de email/senha,
 * mensagem de erro/informação, botão de submit e toggle Login↔Cadastro.
 *
 * Não possui lógica própria — recebe tudo via props do hook useAuthForm.
 */

import React from 'react';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AuthFormProps {
    // ── Dados do formulário ───────────────────────────────────────────────────
    email: string;
    password: string;
    isLogin: boolean;   // true = modo Login, false = modo Cadastro
    loading: boolean;   // true = botão desabilitado (operação async em andamento)
    error: string | null; // Mensagem de erro/informação ou null

    // ── Handlers recebidos do useAuthForm ─────────────────────────────────────
    setEmail: (val: string) => void;
    setPassword: (val: string) => void;
    handleAuth: (e: React.FormEvent) => Promise<void>;
    toggleMode: () => void; // Alterna entre Login e Cadastro
}

// ─── Componente ───────────────────────────────────────────────────────────────

const AuthForm: React.FC<AuthFormProps> = ({
    email, password, isLogin, loading, error,
    setEmail, setPassword, handleAuth, toggleMode,
}) => {
    return (
        <>
            {/* ── Formulário de Login/Cadastro ──────────────────────────────────── */}
            <form onSubmit={handleAuth} className="space-y-5">

                {/* Campo de Email */}
                <div className="space-y-1">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full h-14 px-5 rounded-2xl bg-white border border-gray-200 focus:border-ios-primary focus:ring-4 focus:ring-ios-primary/10 outline-none transition-all placeholder-gray-400 text-ios-text text-lg shadow-sm"
                        placeholder="Email"
                    />
                </div>

                {/* Campo de Senha */}
                <div className="space-y-1">
                    <input
                        type="password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full h-14 px-5 rounded-2xl bg-white border border-gray-200 focus:border-ios-primary focus:ring-4 focus:ring-ios-primary/10 outline-none transition-all placeholder-gray-400 text-ios-text text-lg shadow-sm"
                        placeholder="Senha"
                    />
                </div>

                {/*
         * Mensagem de feedback (erro ou informação).
         * Aparece tanto para erros (ex: "Acesso negado") quanto para
         * mensagens de sucesso informativas (ex: "Cadastro realizado!").
         * O campo 'error' é reaproveitado para ambos os casos no hook.
         */}
                {error && (
                    <div className="p-4 bg-red-50 text-red-600 text-xs font-semibold rounded-2xl text-center border border-red-100">
                        {error}
                    </div>
                )}

                {/* Botão de submit: desabilitado durante operações async */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-14 bg-ios-text hover:bg-black text-white font-bold text-lg rounded-2xl shadow-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                    {/* Texto dinâmico baseado no estado de loading e modo atual */}
                    {loading ? 'Processando...' : (isLogin ? 'Entrar' : 'Criar Conta')}
                </button>
            </form>

            {/* ── Toggle Login ↔ Cadastro ───────────────────────────────────────── */}
            {/*
       * Botão de texto para alternar entre os modos Login e Cadastro.
       * toggleMode() no hook limpa o erro ao chamar setIsLogin(!isLogin).
       */}
            <div className="mt-8 text-center">
                <button
                    onClick={toggleMode}
                    className="text-sm font-medium text-ios-subtext hover:text-ios-primary transition-colors"
                >
                    {isLogin ? 'Criar uma conta' : 'Voltar para login'}
                </button>
            </div>
        </>
    );
};

export default AuthForm;
