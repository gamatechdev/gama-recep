
// Utilitário central de mapeamento: Exames Selecionados → Salas de Atendimento
// Usado por AppointmentForm.tsx e AppointmentModal.tsx para garantir consistência.

/**
 * Recebe a lista de exames selecionados e retorna o status de cada sala.
 * - 'Aguardando': o colaborador deve passar por esta sala
 * - 'nao aplicavel': nenhum exame selecionado exige esta sala
 *
 * REGRA DE SEGURANÇA: se nenhuma sala for mapeada como 'Aguardando',
 * o consultório médico é ativado por padrão, garantindo que o colaborador
 * sempre apareça em ao menos uma sala na tela de chamada.
 */
export const calcularSalasPorExames = (exames: string[]) => {
    // Normaliza: lowercase + remove acentos para comparação robusta
    // Isso evita falhas com 'atenção' vs 'atencao', 'Atenção' etc.
    const normalizar = (str: string) =>
        str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, ''); // Remove diacríticos (acentos)

    const lower = exames.map(normalizar);

    // --- CONSULTÓRIO MÉDICO ---
    // Avaliação Clínica, Higidez, Psicossocial, Psicológica,
    // Questionário Epilepsia, Aspecto da Pele, Avaliação Vocal
    const consultorioAtivo = lower.some(e =>
        e.includes('avaliacao clinica') ||
        e.includes('higidez') ||
        e.includes('psicossocial') ||
        e.includes('psicologica') ||
        e.includes('questionario epilepsia') ||
        e.includes('aspecto da pele') ||
        e.includes('avaliacao vocal')
    );

    // --- SALA DE EXAMES ---
    // Acuidade Visual, Espirometria, Eletrocardiograma, Eletroencefalograma,
    // Teste Palográfico, Teste de Atenção, Teste Romberg
    const salaexamesAtivo = lower.some(e =>
        e.includes('acuidade visual') ||
        e.includes('espirometria') ||
        e.includes('eletrocardiograma') ||
        e.includes('eletroencefalograma') ||
        e.includes('teste palografico') ||
        e.includes('teste de atencao') ||
        e.includes('teste romberg')
    );

    // --- SALA DE COLETA ---
    // Exames de sangue, urina, fezes e toxicológicos
    const salacoletaAtivo = lower.some(e =>
        e.includes('hemograma') ||
        e.includes('glicemia') ||
        e.includes('epf') ||
        e.includes('eas') ||
        e.includes('grupo sanguineo') ||
        e.includes('gama gt') ||
        e.includes('tgo') ||
        e.includes('tgp') ||
        e.includes('acido') ||
        e.includes('ala-u') ||
        e.includes('hemoglobina') ||
        e.includes('coprocultura') ||
        e.includes('colesterol') ||
        e.includes('chumbo') ||
        e.includes('creatinina') ||
        e.includes('ferro serico') ||
        e.includes('manganes') ||
        e.includes('reticulocitos') ||
        e.includes('triglicerideos') ||
        e.includes('ige especifica') ||
        e.includes('acetona') ||
        e.includes('anti hav') ||
        e.includes('anti hbs') ||
        e.includes('anti hbsag') ||
        e.includes('anti hcv') ||
        e.includes('carboxihemoglobina') ||
        e.includes('toxicologico')
    );

    // --- AUDIOMETRIA ---
    const audiometriaAtivo = lower.some(e =>
        e.includes('audiometria')
    );

    // --- RAIO-X ---
    const raioxAtivo = lower.some(e =>
        e.includes('raio-x') || e.includes('raio x')
    );

    return {
        consultorio: consultorioAtivo ? 'Aguardando' : 'nao aplicavel',
        salaexames: salaexamesAtivo ? 'Aguardando' : 'nao aplicavel',
        salacoleta: salacoletaAtivo ? 'Aguardando' : 'nao aplicavel',
        audiometria: audiometriaAtivo ? 'Aguardando' : 'nao aplicavel',
        raiox: raioxAtivo ? 'Aguardando' : 'nao aplicavel',
    };
};
