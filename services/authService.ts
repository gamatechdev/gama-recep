/**
 * authService.ts
 * ---------------
 * Serviço de autenticação — encapsula todas as chamadas ao Supabase
 * relacionadas ao login, cadastro e verificação de acesso de usuários.
 *
 * Funções exportadas:
 *  - loginUser        → signInWithPassword + retorna o User autenticado
 *  - registerUser     → signUp + retorna o User criado
 *  - verifyUserAccess → consulta a tabela 'users' e valida sector/role
 *  - logoutUser       → signOut (usado no fluxo de acesso negado)
 *
 * Este arquivo NÃO conhece React — trabalha apenas com dados e Supabase.
 */

import { supabase } from './supabaseClient'; // Cliente Supabase canônico
import { AccessRole } from '../types';        // Enums de controle de acesso

// ─── Tipos ────────────────────────────────────────────────────────────────────

/** Resultado padronizado para operações de autenticação */
export interface AuthResult {
    user: { id: string } | null; // Usuário autenticado/criado (ou null em caso de erro)
    error: string | null;        // Mensagem de erro legível ou null em caso de sucesso
}

// ─── Funções Exportadas ───────────────────────────────────────────────────────

/**
 * Realiza o login do usuário com email e senha.
 * Encapsula supabase.auth.signInWithPassword e retorna um resultado padronizado.
 *
 * @param email    - Email do usuário
 * @param password - Senha do usuário
 * @returns AuthResult com o usuário autenticado ou mensagem de erro
 */
export async function loginUser(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        // Repassa a mensagem de erro em português via o chamador (useAuthForm)
        return { user: null, error: error.message };
    }

    // Retorna apenas o ID do usuário — dados adicionais são buscados em verifyUserAccess
    return { user: data.user ? { id: data.user.id } : null, error: null };
}

/**
 * Realiza o cadastro de um novo usuário com email e senha.
 * Encapsula supabase.auth.signUp e retorna um resultado padronizado.
 *
 * O novo usuário criado ainda não tem acesso — precisa de aprovação manual
 * (o campo 'sector' ou 'role' precisa ser preenchido pelo administrador).
 *
 * @param email    - Email do novo usuário
 * @param password - Senha do novo usuário
 * @returns AuthResult com o usuário criado ou mensagem de erro
 */
export async function registerUser(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        return { user: null, error: error.message };
    }

    return { user: data.user ? { id: data.user.id } : null, error: null };
}

/**
 * Verifica se o usuário autenticado tem permissão para acessar o sistema.
 * Consulta a tabela 'users' buscando o 'sector' e o 'role' do usuário.
 *
 * Regras de acesso (definidas nos enums de AccessRole em types.ts):
 *  - sector === AccessRole.REQUIRED_SECTOR → acesso liberado
 *  - role   === AccessRole.REQUIRED_ROLE   → acesso liberado
 *  - demais casos                          → acesso negado
 *
 * @param userId - ID do usuário autenticado (auth.uid)
 * @returns true se o usuário tem acesso, false caso contrário
 */
export async function verifyUserAccess(userId: string): Promise<boolean> {
    const { data: userRecord, error: dbError } = await supabase
        .from('users')
        .select('sector, role')  // Seleciona apenas os campos necessários para a verificação
        .eq('user_id', userId)   // Filtra pelo UUID do usuário autenticado
        .single();               // Espera exatamente um registro

    if (dbError) {
        // Loga o erro internamente mas retorna false para bloquear o acesso por segurança
        console.error('[authService] Erro ao verificar acesso:', dbError);
        return false;
    }

    // Se não encontrou o registro na tabela 'users', nega o acesso
    if (!userRecord) return false;

    // Verifica se o setor ou o papel do usuário corresponde aos valores requeridos
    return (
        userRecord.sector === AccessRole.REQUIRED_SECTOR ||
        userRecord.role === AccessRole.REQUIRED_ROLE
    );
}

/**
 * Realiza o logout do usuário autenticado.
 * Chamado no fluxo de login quando o usuário existe mas não tem acesso,
 * para garantir que a sessão seja encerrada imediatamente.
 */
export async function logoutUser(): Promise<void> {
    await supabase.auth.signOut();
}
