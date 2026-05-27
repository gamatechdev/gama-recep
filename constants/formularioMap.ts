// =============================================================================
// formularioMap.ts
// Mapeamento entre o nome do exame e o formulário de prontuário correspondente.
//
// COMO EDITAR:
// - Para adicionar uma nova relação, insira uma nova linha no objeto EXAM_TO_FORMULARIO_MAP.
//   A chave deve ser o nome EXATO do exame como aparece na lista de exames do agendamento.
//   O valor deve ser o `value` correspondente em FORMULARIOS_OPTIONS (AppointmentForm.tsx).
//
// - Para remover uma relação, delete a linha correspondente.
// =============================================================================

// Mapeamento: Nome exato do exame -> value do formulário (FORMULARIOS_OPTIONS)
// Exporta a constante que mapeia o nome do exame para o identificador do prontuário correspondente
export const EXAM_TO_FORMULARIO_MAP: Record<string, string> = {
  // Mapeia o exame "Avaliação Clínica" para o formulário "PRONTUARIO_MEDICO"
  "Avaliação Clínica":       "PRONTUARIO_MEDICO",
  // Mapeia o exame "Audiometria" para o formulário "AUDIOMETRIA"
  "Audiometria":             "AUDIOMETRIA",
  // Mapeia o exame "Acuidade Visual" para o formulário "ACUIDADE_VISUAL"
  "Acuidade Visual":         "ACUIDADE_VISUAL",
  // Mapeia o exame "Avaliação Psicossocial" para o formulário "AVALIACAO_PSICOSSOCIAL_SIMPLES"
  "Avaliação Psicossocial":  "AVALIACAO_PSICOSSOCIAL_SIMPLES",
  // Mapeia o exame "Questionário Epilepsia" para o formulário "QUESTIONARIO_EPILEPSIA"
  "Questionário Epilepsia":  "QUESTIONARIO_EPILEPSIA",
  // Mapeia o exame "Avaliação Vocal" para o formulário "AVALIACAO_VOCAL"
  "Avaliação Vocal":         "AVALIACAO_VOCAL",
  // Mapeia o exame "Teste Romberg" para o formulário "TESTE_ROMBERG"
  "Teste Romberg":           "TESTE_ROMBERG",
  // Mapeia o exame "Escala de Epworth" para o formulário "EPWORTH"
  "Escala de Epworth":       "EPWORTH"
};

// Formulários fixos: nunca serão removidos pela sincronização automática,
// mesmo que nenhum exame correspondente esteja selecionado.
// Exporta a lista de formulários que são fixos e não mudam com a seleção de exames
export const FORMULARIOS_FIXOS: string[] = [
  // Define o formulário "FICHA_CLINICA" como um item fixo da lista
  "FICHA_CLINICA"
];
