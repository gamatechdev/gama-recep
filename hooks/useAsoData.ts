/**
 * useAsoData.ts
 * --------------
 * Custom hook que centraliza o carregamento de dados do documento ASO.
 * A tela AsoDocument.tsx consome este hook e passa os dados diretamente
 * para os subcomponentes de renderização.
 *
 * Estados gerenciados:
 *  - loading     → true enquanto as queries estão em andamento
 *  - companyInfo → Razão social e CNPJ da empresa (via getCompanyInfo)
 *  - risks       → Lista de riscos ocupacionais (via getOccupationalRisks)
 *
 * O hook dispara o fetch automaticamente sempre que o objeto `appointment` mudar.
 */

import { useEffect, useState } from 'react';
import { Agendamento } from '../types';
import { CompanyInfo, RiskData, getCompanyInfo, getOccupationalRisks } from '../services/asoService';

// ─── Interface de Retorno ─────────────────────────────────────────────────────

export interface UseAsoDataReturn {
    loading: boolean;         // true enquanto os dados estão sendo buscados
    companyInfo: CompanyInfo; // Dados da empresa (razão social + CNPJ)
    risks: RiskData[];        // Lista de riscos ocupacionais do setor/unidade
}

// ─── Hook Principal ───────────────────────────────────────────────────────────

/**
 * Hook de dados do ASO.
 *
 * @param appointment - Objeto do agendamento — contém unidade, colaborador e setor.
 *                      Dispara novas buscas sempre que mudar.
 * @returns { loading, companyInfo, risks }
 */
export function useAsoData(appointment: Agendamento): UseAsoDataReturn {
    // Estado de carregamento — true até que ambas as queries terminem
    const [loading, setLoading] = useState(true);

    // Dados da empresa: valores padrão evitam problemas de render antes do fetch
    const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({ razao_social: '', cnpj: '' });

    // Lista de riscos ocupacionais do setor do colaborador nesta unidade
    const [risks, setRisks] = useState<RiskData[]>([]);

    // ── Effect: Dispara o fetch sempre que o agendamento mudar ────────────────
    useEffect(() => {
        /**
         * Função async interna para buscar dados de empresa e riscos em paralelo.
         * Usa Promise.all para aguardar ambas as queries simultaneamente,
         * reduzindo o tempo total de carregamento.
         */
        const fetchAsoData = async () => {
            setLoading(true); // Ativa o spinner antes de iniciar as queries

            try {
                // ── Busca de dados da empresa ─────────────────────────────────────
                // Só executa se o agendamento tiver uma unidade associada
                const companyPromise = appointment.unidade
                    ? getCompanyInfo(appointment.unidade)
                    : Promise.resolve<CompanyInfo>({ razao_social: '', cnpj: '' });

                // ── Busca de riscos ocupacionais ──────────────────────────────────
                // Só executa se o colaborador tiver setor preenchido e a unidade existir
                const risksPromise = appointment.colaboradores?.setor && appointment.unidade
                    ? getOccupationalRisks(appointment.unidade, appointment.colaboradores.setor)
                    : Promise.resolve<RiskData[]>([]);

                // Aguarda ambas as queries em paralelo para minimizar o tempo de loading
                const [fetchedCompany, fetchedRisks] = await Promise.all([companyPromise, risksPromise]);

                // Atualiza os estados com os dados retornados
                setCompanyInfo(fetchedCompany);
                setRisks(fetchedRisks);
            } catch (e) {
                // Loga o erro mas não bloqueia a renderização — o documento pode ser editado manualmente
                console.error('[useAsoData] Erro ao buscar dados do ASO:', e);
            } finally {
                setLoading(false); // Desativa o spinner independente de sucesso ou erro
            }
        };

        fetchAsoData(); // Executa imediatamente ao montar ou quando appointment mudar
    }, [appointment]); // Re-executa apenas se o agendamento mudar

    return { loading, companyInfo, risks };
}
