/**
 * useCallPermissions.ts
 * ----------------------
 * Custom hook que gerencia as regras de permissão de acesso
 * às salas da Tela de Chamada.
 *
 * Responsabilidades:
 *  - Busca o usuário autenticado via Supabase Auth
 *  - Recupera o nível de acesso (acesso_med), ID interno e username do usuário
 *  - Verifica sessões de atendimento ativas (para restaurar o timer após reload)
 *  - Expõe a função canInteract() para que os subcomponentes saibam quais salas são clicáveis
 *
 * Mapa de Permissões (acesso_med):
 *  1 = Acesso Total (todas as salas)
 *  2 = Apenas Consultório Médico
 *  3 = Apenas Sala de Exames
 *  4 = Apenas Sala de Coleta
 *  5 = Apenas Audiometria
 *  6 = Apenas Raio-X
 */

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient'; // Cliente Supabase canônico

// ─── Interface de Retorno ─────────────────────────────────────────────────────

interface ActiveCallData {
    startTime: Date;      // Momento em que o atendimento foi iniciado
    patientName: string;  // Nome do paciente em atendimento (para o timer flutuante)
}

interface UseCallPermissionsReturn {
    userAccessLevel: number | null;        // Nível de permissão do usuário (null = carregando)
    currentDbUserId: number | null;        // ID interno do usuário (tabela 'users')
    currentUsername: string;               // Username para logs e inserção na tabela financeiro_despesas
    activeCallData: ActiveCallData | null; // Sessão ativa restaurada (se houver, após reload de página)
    setActiveCallData: React.Dispatch<React.SetStateAction<ActiveCallData | null>>; // Controle do timer
    canInteract: (columnKey: string) => boolean; // Verifica se o usuário pode clicar em determinada sala
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

export function useCallPermissions(): UseCallPermissionsReturn {
    // Nível de acesso recuperado do campo 'acesso_med' da tabela 'users'
    const [userAccessLevel, setUserAccessLevel] = useState<number | null>(null);
    // ID numérico do usuário na tabela 'users' (diferente do auth.uid)
    const [currentDbUserId, setCurrentDbUserId] = useState<number | null>(null);
    // Username para registrar despesas financeiras e logs
    const [currentUsername, setCurrentUsername] = useState<string>('');
    // Dados da sessão ativa (paciente em atendimento) — pode ter sido restaurada do DB após reload
    const [activeCallData, setActiveCallData] = useState<ActiveCallData | null>(null);

    /**
     * Verifica se existe uma sessão de atendimento aberta para este usuário.
     * Chamada após fetchUserAccess para restaurar o timer caso a página tenha sido recarregada.
     * Um atendimento "aberto" é aquele com finalizou_em = NULL na tabela 'atendimentos'.
     *
     * @param userId - ID interno do usuário (tabela 'users')
     */
    const checkForActiveSession = useCallback(async (userId: number) => {
        const { data } = await supabase
            .from('atendimentos')
            .select(`
        chamou_em,
        agendamentos (
            colaboradores ( nome )
        )
      `)
            .eq('user_id', userId)
            .is('finalizou_em', null) // Sessão ainda aberta (não finalizada)
            .maybeSingle();            // Retorna null em vez de erro se não encontrar

        if (data) {
            // Restaura o dado da sessão para que o timer retome de onde parou
            const patientName = (data.agendamentos as any)?.colaboradores?.nome || 'Paciente';
            setActiveCallData({
                startTime: new Date(data.chamou_em), // Hora original em que o profissional chamou
                patientName,
            });
        }
    }, []);

    /**
     * Busca os dados do usuário autenticado no Supabase:
     * - Nível de acesso às salas (acesso_med)
     * - ID interno (para inserção em 'atendimentos')
     * - Username (para inserção em 'financeiro_despesas')
     *
     * Após obter o ID, dispara checkForActiveSession para restaurar sessão aberta.
     */
    const fetchUserAccess = useCallback(async () => {
        // Recupera o usuário autenticado na sessão atual
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Busca dados complementares do usuário na tabela customizada 'users'
        const { data } = await supabase
            .from('users')
            .select('id, acesso_med, username')
            .eq('user_id', user.id) // user_id é o UUID do Supabase Auth
            .single();

        if (data) {
            setUserAccessLevel(data.acesso_med);
            setCurrentDbUserId(data.id);
            setCurrentUsername(data.username);

            // Verifica se há um atendimento em andamento para restaurar o timer
            checkForActiveSession(data.id);
        }
    }, [checkForActiveSession]);

    // ── Effect: Busca inicial dos dados do usuário ────────────────────────────
    useEffect(() => {
        fetchUserAccess();
    }, [fetchUserAccess]);

    /**
     * Verifica se o usuário logado tem permissão para interagir com uma sala específica.
     * Utilizado para controlar quais botões ficam habilitados na tabela/cards.
     *
     * Regras:
     *  - null → ainda carregando, bloqueia tudo
     *  - 1    → acesso total a todas as salas
     *  - 2–6  → acesso exclusivo a uma sala específica
     *
     * @param columnKey - Chave da coluna/sala (ex: 'consultorio', 'raiox')
     * @returns true se o usuário pode clicar nesta sala, false caso contrário
     */
    const canInteract = useCallback((columnKey: string): boolean => {
        // Ainda carregando ou nenhuma permissão configurada → bloqueia
        if (userAccessLevel === null) return false;

        // Nível 1 = Administrador / Acesso Total a todas as salas
        if (userAccessLevel === 1) return true;

        // Mapa de nível de acesso → sala permitida
        switch (columnKey) {
            case 'consultorio': return userAccessLevel === 2;
            case 'salaexames': return userAccessLevel === 3;
            case 'salacoleta': return userAccessLevel === 4;
            case 'audiometria': return userAccessLevel === 5;
            case 'raiox': return userAccessLevel === 6;
            default: return false;
        }
    }, [userAccessLevel]);

    return {
        userAccessLevel,
        currentDbUserId,
        currentUsername,
        activeCallData,
        setActiveCallData,
        canInteract,
    };
}
