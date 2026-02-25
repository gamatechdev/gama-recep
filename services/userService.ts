/**
 * userService.ts
 * ---------------
 * Serviço de dados do utilizador (perfil).
 * Encapsula a chamada ao Supabase para buscar o perfil do utilizador logado.
 *
 * Funções exportadas:
 *  - getUserProfile → Busca o registo completo do utilizador na tabela 'users'
 *                     filtrando por user_id (UUID do auth).
 *
 * Este ficheiro NÃO conhece React — retorna apenas dados e erros.
 */

import { supabase } from './supabaseClient'; // Cliente Supabase canônico
import { User } from '../types';              // Tipo global do utilizador

/**
 * Busca o perfil completo de um utilizador na tabela 'users'.
 * Utiliza .single() pois cada user_id deve ter exatamente um registo.
 *
 * @param userId - UUID do utilizador autenticado (auth.uid)
 * @returns { data: User | null, error } — perfil do utilizador ou erro do Supabase
 */
export async function getUserProfile(userId: string): Promise<{ data: User | null; error: any }> {
    const { data, error } = await supabase
        .from('users')
        .select('*')           // Seleciona todos os campos do perfil
        .eq('user_id', userId) // Filtra pelo UUID do utilizador autenticado
        .single();             // Espera exatamente um registo; retorna erro se 0 ou mais de 1

    return { data: data as User | null, error };
}
