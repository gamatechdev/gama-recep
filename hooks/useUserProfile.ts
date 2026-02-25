/**
 * useUserProfile.ts
 * ------------------
 * Custom hook que centraliza a busca e o estado do perfil do utilizador logado.
 * O Layout.tsx (e qualquer outro componente) pode consumir este hook sem
 * conhecer os detalhes da chamada ao Supabase.
 *
 * Estado gerenciado:
 *  - userProfile → Dados completos do utilizador (User | null)
 *
 * Efeito:
 *  - Dispara o fetch do perfil sempre que o userId mudar.
 *    Não executa se userId for uma string vazia.
 */

import { useEffect, useState } from 'react';
import { User } from '../types';
import { getUserProfile } from '../services/userService';

/**
 * Hook de perfil do utilizador.
 *
 * @param userId - UUID do utilizador autenticado (vindo do auth do Supabase).
 *                 Se for vazio (''), o fetch não é executado.
 * @returns userProfile - Dados do utilizador ou null enquanto carrega / em caso de erro.
 */
export function useUserProfile(userId: string): User | null {
    // Estado que guarda o perfil carregado do Supabase
    const [userProfile, setUserProfile] = useState<User | null>(null);

    // Effect disparado a cada mudança de userId
    useEffect(() => {
        // Guarda de segurança: não executa sem um userId válido
        if (!userId) return;

        /**
         * Função async interna para fazer o fetch e atualizar o estado.
         * Definida dentro do useEffect para não precisar de dependências externas.
         */
        const fetchProfile = async () => {
            const { data, error } = await getUserProfile(userId);

            if (error) {
                // Loga o erro no console mas não bloqueia a UI — o layout funciona sem perfil
                console.error('[useUserProfile] Erro ao buscar perfil do utilizador:', error);
                return;
            }

            // Atualiza o estado com os dados recebidos do Supabase
            if (data) setUserProfile(data);
        };

        fetchProfile(); // Executa imediatamente ao montar ou ao mudar o userId
    }, [userId]); // Só re-executa se o userId mudar (ex: logout + novo login)

    return userProfile;
}
