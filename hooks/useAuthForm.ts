/**
 * useAuthForm.ts
 * ---------------
 * Custom hook que centraliza TODA a lógica de estado e autenticação da tela Auth.
 * O componente Auth.tsx apenas consome este hook e repassa os dados para a UI.
 *
 * Estados gerenciados:
 *  - email, password → Campos do formulário
 *  - isLogin         → Alterna entre modo Login e Cadastro
 *  - loading         → Indica que uma operação async está em andamento
 *  - error           → Mensagem de erro/informação para o usuário
 *
 * Função principal:
 *  - handleAuth → Chamada no submit do formulário. Executa login ou cadastro
 *                 via authService e trata o fluxo de acesso e erros.
 */

import { useState } from 'react';
import { loginUser, registerUser, verifyUserAccess, logoutUser } from '../services/authService';

// ─── Interface de Retorno ─────────────────────────────────────────────────────

export interface UseAuthFormReturn {
    // Estados do formulário
    email: string;
    password: string;
    isLogin: boolean;
    loading: boolean;
    error: string | null;

    // Setters expostos para os inputs e botão de toggle
    setEmail: (val: string) => void;
    setPassword: (val: string) => void;

    // Handlers de ação
    handleAuth: (e: React.FormEvent) => Promise<void>;
    toggleMode: () => void; // Alterna entre Login e Cadastro, limpando o erro
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

/**
 * Hook de formulário de autenticação.
 *
 * @param onSuccess - Callback chamado pelo orquestrador (Auth.tsx) após login bem-sucedido.
 *                    Normalmente navega para a tela principal da aplicação.
 */
export function useAuthForm(onSuccess: () => void): UseAuthFormReturn {
    // ── Estados do Formulário ─────────────────────────────────────────────────
    const [email, setEmail] = useState('');     // Valor do input de email
    const [password, setPassword] = useState('');   // Valor do input de senha
    const [isLogin, setIsLogin] = useState(true);   // true = modo Login, false = modo Cadastro
    const [loading, setLoading] = useState(false);  // Bloqueia o botão durante operações async
    const [error, setError] = useState<string | null>(null); // null = sem erro

    // ── Handler de Submit ─────────────────────────────────────────────────────
    /**
     * Função principal do formulário — executada ao submeter o form.
     *
     * Fluxo de Login:
     *  1. Chama loginUser() no authService
     *  2. Se sucesso, chama verifyUserAccess() para checar sector/role na tabela 'users'
     *  3a. Se acesso permitido → chama onSuccess() para avançar a aplicação
     *  3b. Se acesso negado → chama logoutUser() e exibe mensagem de erro
     *
     * Fluxo de Cadastro:
     *  1. Chama registerUser() no authService
     *  2. Exibe mensagem informando que o cadastro foi feito e aguarda aprovação
     *
     * Tratamento de Erros:
     *  - Qualquer exceção ou erro do Supabase é capturado e exibido no campo 'error'
     */
    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();     // Impede o reload padrão do formulário HTML
        setLoading(true);       // Ativa o estado de loading (desabilita o botão)
        setError(null);         // Limpa qualquer mensagem de erro anterior

        try {
            if (isLogin) {
                // ── Modo Login ──────────────────────────────────────────────────────
                const { user, error: loginError } = await loginUser(email, password);

                if (loginError) throw new Error(loginError); // Propaga o erro para o catch

                if (user) {
                    // Verifica se o usuário tem sector/role permitidos na tabela 'users'
                    const hasAccess = await verifyUserAccess(user.id);

                    if (hasAccess) {
                        // Acesso confirmado: notifica o orquestrador para avançar a tela
                        onSuccess();
                    } else {
                        // Acesso negado: faz logout imediato por segurança e exibe erro
                        await logoutUser();
                        setError('Acesso negado. Permissão insuficiente.');
                    }
                }
            } else {
                // ── Modo Cadastro ───────────────────────────────────────────────────
                const { user, error: registerError } = await registerUser(email, password);

                if (registerError) throw new Error(registerError);

                if (user) {
                    // Informa que o cadastro foi feito — acesso ainda pendente de aprovação
                    setError('Cadastro realizado! Aguarde aprovação.');
                }
            }
        } catch (err: any) {
            // Captura qualquer exceção e exibe a mensagem para o usuário
            setError(err.message);
        } finally {
            setLoading(false); // Sempre libera o botão ao finalizar (sucesso ou erro)
        }
    };

    // ── Toggle de Modo (Login ↔ Cadastro) ─────────────────────────────────────
    /**
     * Alterna entre modo Login e Cadastro.
     * Limpa o erro ao trocar para evitar mensagens descontextualizadas.
     */
    const toggleMode = () => {
        setIsLogin(prev => !prev);
        setError(null); // Limpa o erro ao trocar de modo
    };

    // ── Retorno do Hook ───────────────────────────────────────────────────────
    return {
        email, password, isLogin, loading, error,
        setEmail, setPassword,
        handleAuth, toggleMode,
    };
}
