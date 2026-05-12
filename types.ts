export interface ChatTag {
  phone: string;
  name?: string;
  chatname?: string;
  senderphoto?: string;
}

export interface Message {
  id: string | number;
  message_id?: string;
  chatname: string;
  text_message: string;
  status?: string;
  criado_em: string;
  enviado_por?: string;
  is_img?: boolean;
  img_path?: string;
  video_path?: string;
  audio_url?: string;
  pdf_path?: string;
  sender_lid?: string;
  raw_payload?: any;
}

export interface User {
  id: number;
  username: string;
  user_id: string; // references auth.users
  role: number | null;
  sector: number | null;
  email: string;
  img_url: string;
  acesso_med?: number | null; // Controle de permissão na tela de chamada
}

export interface Colaborador {
  id: string; // uuid
  nome: string;
  cpf: string;
  data_nascimento: string;
  sexo?: string;
  setor?: string;
  setorid?: number;
  unidade?: number;
  cargo?: number;
  // Join fields
  cargos?: { nome: string };
}

export interface Unidade {
  id: number;
  nome_unidade: string;
  empresaid?: string; // uuid reference to clientes
}

export interface Agendamento {
  id: number;
  colaborador_id: string;
  data_atendimento: string;
  status: string;
  tipo: string | null;
  consultorio: string;
  recepcao: string;
  unidade: number | null;
  compareceu: boolean | null;
  chegou_em?: string | null;
  ficha_url: string | null;
  exames_snapshot?: string[];
  // Queue Display Logic
  posicao_tela: number | null;
  sala_chamada: string | null;
  // Rooms/Stations
  salaexames: string;
  salacoleta: string;
  audiometria: string;
  raiox: string;
  // Joins
  colaboradores?: Colaborador;
  unidades?: Unidade;
  // New fields
  aso_liberado?: string | null;
  aso_feito?: boolean; // Novo campo para controle de status do ASO
  aso_url?: string | null; // URL do PDF do ASO
  obs_agendamento?: string | null;
  foto_obs?: string | null; // URL da imagem de observação
  prioridade?: boolean;
  valor?: number | null; // Valor para lançamentos avulsos
  metodo_pagamento?: string | null; // Metodo de pagamento para avulsos
  enviado_empresa?: boolean | null; // Indica se foi agendado pela empresa via sistema
  aso_qtd_cobrar?: number;
  rac_qtd_cobrar?: number;
  prontuario_id?: string[] | null;
}

export interface Cargo {
  id: number;
  nome: string;
}

export enum AccessRole {
  REQUIRED_SECTOR = 2,
  REQUIRED_ROLE = 7
}
