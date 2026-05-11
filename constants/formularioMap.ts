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
export const EXAM_TO_FORMULARIO_MAP: Record<string, string> = {
  "Audiometria":             "AUDIOMETRIA",
  "Acuidade Visual":         "ACUIDADE_VISUAL",
  "Avaliação Psicossocial":  "AVALIACAO_PSICOSSOCIAL_SIMPLES",
  "Avaliação Psicológica":   "AVALIACAO_PSICOSSOCIAL_SIMPLES",
  "Questionário Epilepsia":  "QUESTIONARIO_EPILEPSIA",
  "Avaliação Vocal":         "AVALIACAO_VOCAL",
  "Teste Romberg":           "TESTE_ROMBERG",
  "Escala de Epworth":       "EPWORTH"
};

// Formulários fixos: nunca serão removidos pela sincronização automática,
// mesmo que nenhum exame correspondente esteja selecionado.
export const FORMULARIOS_FIXOS: string[] = ["FICHA_CLINICA"];
