
// Interface que representa um contato/chat do WhatsApp
export interface ChatTag {
  chatname: string;         // Nome do contato/chat
  phone: string;            // Número de telefone do contato
  tag: number;              // Tag de classificação/setor do chat
  senderphoto?: string;     // Foto do remetente (opcional)
  last_message?: string;    // Prévia da última mensagem enviada (opcional)
  updated_at?: string;      // Timestamp da última atualização em ISO string (opcional)
  notificado?: boolean;     // Indica se há mensagem não lida (opcional)
  matched_message?: string; // Mensagem que correspondeu à busca por conteúdo (opcional)
  matched_time?: string;    // Timestamp da mensagem que correspondeu à busca (opcional)
}

// Interface que representa uma mensagem trocada em um chat
export interface Message {
  id: string;                  // ID único da mensagem (pode ser temporário para otimismo)
  chatname: string;            // Chat ao qual a mensagem pertence
  text_message: string;        // Conteúdo textual da mensagem
  status: string;              // Status da mensagem (ex: SENT, READ)
  criado_em: string;           // Timestamp de criação em ISO string
  enviado_por?: string;        // user_id de quem enviou (opcional)
  is_img?: boolean;            // Se a mensagem contém imagem
  img_path?: string;           // Caminho da imagem no storage (opcional)
  audio_url?: string;          // URL do áudio gravado (opcional)
  video_path?: string;         // URL do vídeo enviado (opcional)
  pdf_path?: string;           // URL do PDF enviado (opcional)
  sender_lid?: string;         // Identificador auxiliar do remetente
  message_id?: string;         // ID da mensagem no sistema de chat externo
  raw_payload?: any;           // Payload bruto da mensagem (ex: reply reference)
}

// Interface que representa um usuário autenticado da aplicação
export interface User {
  id: number;
  username: string;
  user_id: string; // Referência ao usuário do auth.users do Supabase
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
  prioridade?: boolean;
  valor?: number | null; // Valor para lançamentos avulsos
  metodo_pagamento?: string | null; // Metodo de pagamento para avulsos
  enviado_empresa?: boolean | null; // Indica se foi agendado pela empresa via sistema
}

export interface Cargo {
  id: number;
  nome: string;
}

export enum AccessRole {
  REQUIRED_SECTOR = 2,
  REQUIRED_ROLE = 7
}
