/**
 * tvBoardService.ts
 * ------------------
 * Serviço de banco de dados para a tela de Painel de Chamada (Modo TV).
 * Encapsula a query ao Supabase que busca os agendamentos a serem exibidos
 * no painel, já com os dados do colaborador inclusos (join).
 *
 * Função exportada:
 *  - fetchTvBoardData → Busca os agendamentos com posicao_tela não nulo,
 *                       ordenados por posição crescente (1 = chamada atual).
 */

import { supabase } from './supabaseClient'; // Cliente Supabase canônico
import { Agendamento } from '../types';        // Tipo global do agendamento

/**
 * Busca até 6 agendamentos que estão atualmente no painel de chamada (Modo TV).
 *
 * Critérios de filtro:
 *  - posicao_tela IS NOT NULL → apenas registros em exibição no painel
 *  - sala_chamada != 'nenhuma' → filtra chamadas sem sala definida
 *
 * Ordenação:
 *  - posicao_tela ASC → posição 1 = chamada ativa no display principal
 *
 * @returns Array de Agendamento com dados de colaborador (nome) ou array vazio em caso de erro
 */
export async function fetchTvBoardData(): Promise<Agendamento[]> {
    const { data, error } = await supabase
        .from('agendamentos')
        .select(`
      *,
      colaboradores:colaboradores!agendamentos_colaborador_id_fkey (id, nome)
    `)                                          // Join com colaboradores para obter o nome
        .not('posicao_tela', 'is', null)            // Apenas registros com posição definida no painel
        .neq('sala_chamada', 'nenhuma')             // Exclui chamadas sem sala
        .order('posicao_tela', { ascending: true }) // Posição 1 primeiro (chamada ativa)
        .limit(6);                                  // Máximo de 6 itens: 1 ativo + 5 no histórico

    if (error) {
        console.error('[tvBoardService] Erro ao buscar dados do painel:', error);
        return [];
    }

    return (data as unknown as Agendamento[]) ?? [];
}
