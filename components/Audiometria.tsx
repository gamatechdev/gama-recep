import React, { useState, useRef } from "react";
// Importamos os ícones do lucide-react para enriquecer a interface visual
import {
  Stethoscope,
  User,
  Briefcase,
  FileText,
  Activity,
  Headphones,
  FileSignature,
  CheckCircle2,
  PenTool,
  Circle,
  Trash2,
  Undo2,
  Signature,
  SignatureIcon,
  PencilIcon,
} from "lucide-react";

import { Agendamento } from "../types";

// Importamos a imagem da grade audiométrica para usar como fundo do canvas
import gradeImage from "./ui/grade/image_audiometria.png";
// Importamos a assinatura padrão digitalizada do fonoaudiólogo
import sigImage from "./ui/grade/sig.png";

interface AudiometriaProps {
  appointment?: Agendamento | null;
}

// Componente principal para o formulário de Audiometria Ocupacional
export function Audiometria({ appointment }: AudiometriaProps) {
  // Interface para estruturar os pontos inseridos nos canvases de audiometria
  interface Point {
    // Coordenada horizontal X do ponto no canvas
    x: number;
    // Coordenada vertical Y do ponto no canvas
    y: number;
    // Símbolo clínico associado ao ponto no canvas
    symbol: "bolinha" | "X" | "<" | ">";
  }

  // Interface para representar uma conexão de linha entre dois pontos
  interface Line {
    // Índice do ponto de origem da linha no array de pontos
    fromIndex: number;
    // Índice do ponto de destino da linha no array de pontos
    toIndex: number;
  }

  // Estado para armazenar os pontos criados na Orelha Direita (OD)
  const [pointsOD, setPointsOD] = useState<Point[]>([]);
  // Estado para armazenar os pontos criados na Orelha Esquerda (OE)
  const [pointsOE, setPointsOE] = useState<Point[]>([]);

  // Estado para armazenar as conexões de linhas criadas na Orelha Direita (OD)
  const [linesOD, setLinesOD] = useState<Line[]>([]);
  // Estado para armazenar as conexões de linhas criadas na Orelha Esquerda (OE)
  const [linesOE, setLinesOE] = useState<Line[]>([]);

  // Estado para ativar ou desativar o mecanismo de conexão automática ao colocar pontos
  const [autoConnect, setAutoConnect] = useState(true);

  // Estado para rastrear qual ponto está atualmente selecionado no modo de conexão manual (Ligar)
  const [selectedPoint, setSelectedPoint] = useState<{ ear: "OD" | "OE"; index: number } | null>(null);

  // Estado para controlar a ferramenta/modo selecionado (bolinha, X, <, > ou ligar)
  const [drawMode, setDrawMode] = useState<"bolinha" | "X" | "<" | ">" | "ligar">("bolinha");

  // Estado para controlar a aba de orelha ativa ("OE" = Esquerda, "OD" = Direita)
  const [activeTab, setActiveTab] = useState<"OE" | "OD">("OE");

  // Função para mudar a aba ativa e ajustar a ferramenta de desenho de forma inteligente e clínica
  const selectTab = (tab: "OE" | "OD") => {
    // Define a aba ativa
    setActiveTab(tab);
    // Ao alternar a aba, se a ferramenta incompatível estiver selecionada, reseta para a padrão da orelha
    if (tab === "OD") {
      // Orelha Direita (OD) só permite <. Se > ou X estiver ativo, muda para bolinha
      if (drawMode === ">" || drawMode === "X") {
        setDrawMode("bolinha");
      }
    } else {
      // Orelha Esquerda (OE) só permite >. Se < ou bolinha estiver ativo, muda para X
      if (drawMode === "<" || drawMode === "bolinha") {
        setDrawMode("X");
      }
    }
  };

  // Referências para capturar os elementos canvas diretamente do DOM
  const canvasODRef = useRef<HTMLCanvasElement>(null);
  const canvasOERef = useRef<HTMLCanvasElement>(null);

  // Referência para o canvas de captura de assinatura
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);

  // Estado para o campo de observações
  const [observacoes, setObservacoes] = useState("");

  // Estado para controlar a visibilidade do modal de assinatura do funcionário
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  // Estado para armazenar o traçado final da assinatura em formato Base64 (DataURL)
  const [employeeSignature, setEmployeeSignature] = useState<string | null>(null);
  // Estado para rastrear se o traçado do cursor ou toque está em andamento no canvas
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);

  // Função disparada no início do toque/clique sobre a área de assinatura
  const startSignatureDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    // Cancela o comportamento de rolagem da tela em dispositivos de toque
    e.preventDefault();
    // Obtém o elemento canvas associado
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    // Obtém o contexto de renderização 2D
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Ativa o estado de desenho ativo
    setIsDrawingSignature(true);

    // Obtém o retângulo delimitador da área de clique
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    // Distingue cliques convencionais de eventos do touch screen
    if ("touches" in e) {
      // Coordenadas absolutas de toque
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Coordenadas de mouse normais
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calcula os fatores de escala proporcional entre o tamanho exibido na tela (CSS) e o tamanho real de pixels do canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Calcula a posição proporcional e snapada ao canvas de desenho da assinatura
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Inicia um novo caminho de desenho geométrico
    ctx.beginPath();
    // Define a espessura do pincel de escrita
    ctx.lineWidth = 3;
    // Define a cor ardósia escura para o traço
    ctx.strokeStyle = "#1e293b";
    // Define pontas arredondadas para melhor estética
    ctx.lineCap = "round";
    // Define junções arredondadas para suavizar a caligrafia
    ctx.lineJoin = "round";
    // Move o cursor de desenho para o ponto inicial
    ctx.moveTo(x, y);
  };

  // Função executada enquanto o cursor/toque desliza sobre a tela
  const drawSignature = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    // Interrompe o processo se a flag de desenho estiver inativa
    if (!isDrawingSignature) return;
    // Previne qualquer rolagem indevida
    e.preventDefault();

    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calcula os fatores de escala proporcional entre o tamanho exibido na tela (CSS) e o tamanho real de pixels do canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Calcula a posição proporcional e snapada ao canvas de desenho da assinatura
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Conecta uma linha até o novo ponto posicionado
    ctx.lineTo(x, y);
    // Renderiza fisicamente o traço no canvas
    ctx.stroke();
  };

  // Finaliza o fluxo de desenho e levanta a caneta/dedo do usuário
  const stopSignatureDrawing = () => {
    setIsDrawingSignature(false);
  };

  // Limpa completamente os pixels do canvas de assinatura para recomeçar
  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Apaga todo o retângulo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Captura o conteúdo do canvas, armazena no estado e fecha o modal
  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    // Converte os pixels para Data URL (Base64 PNG)
    const dataUrl = canvas.toDataURL("image/png");
    // Grava a imagem capturada no estado correspondente
    setEmployeeSignature(dataUrl);
    // Desativa a exibição do modal
    setIsSignatureModalOpen(false);
  };

  // Estado para armazenar a lista histórica de estados passados (snapshots de pontos e conexões) das duas orelhas
  const [history, setHistory] = useState<{
    // Snapshots dos pontos cadastrados na Orelha Direita (OD)
    pointsOD: Point[];
    // Snapshots dos pontos cadastrados na Orelha Esquerda (OE)
    pointsOE: Point[];
    // Snapshots das conexões de retas registradas na Orelha Direita (OD)
    linesOD: Line[];
    // Snapshots das conexões de retas registradas na Orelha Esquerda (OE)
    linesOE: Line[];
  }[]>([]);

  // Função auxiliar para gravar o snapshot atual de pontos e conexões no histórico antes de efetuar alterações
  const pushToHistory = () => {
    // Insere o snapshot contendo cópias rasas dos arrays no array de histórico
    setHistory((prev) => [
      ...prev,
      {
        // Copia a lista atual de pontos da Orelha Direita (OD)
        pointsOD: [...pointsOD],
        // Copia a lista atual de pontos da Orelha Esquerda (OE)
        pointsOE: [...pointsOE],
        // Copia a lista atual de retas da Orelha Direita (OD)
        linesOD: [...linesOD],
        // Copia a lista atual de retas da Orelha Esquerda (OE)
        linesOE: [...linesOE],
      },
    ]);
  };

  // Função disparada pelo botão Desfazer para restaurar o estado imediatamente anterior
  const handleUndo = () => {
    // Aborta se o histórico estiver vazio
    if (history.length === 0) return;

    // Recupera o último snapshot de estado armazenado no final do array de histórico
    const lastState = history[history.length - 1];

    // Restaura a coleção de pontos da Orelha Direita (OD)
    setPointsOD(lastState.pointsOD);
    // Restaura a coleção de pontos da Orelha Esquerda (OE)
    setPointsOE(lastState.pointsOE);
    // Restaura a coleção de linhas da Orelha Direita (OD)
    setLinesOD(lastState.linesOD);
    // Restaura a coleção de linhas da Orelha Esquerda (OE)
    setLinesOE(lastState.linesOE);

    // Remove o último snapshot do array de histórico
    setHistory((prev) => prev.slice(0, -1));
    // Reseta qualquer ponto selecionado no modo Ligar manual para evitar conflitos
    setSelectedPoint(null);
  };

  // Função para alternar o estado do toggle de conexão automática com segurança
  const handleToggleAutoConnect = () => {
    // Atualiza o estado booleano do toggle
    setAutoConnect((prev) => {
      // Calcula o novo valor
      const newValue = !prev;
      // Se a conexão automática for ligada e o modo atual for "ligar", reseta para "bolinha"
      if (newValue && drawMode === "ligar") {
        // Define o modo de desenho padrão como "bolinha"
        setDrawMode("bolinha");
      }
      // Retorna o novo valor
      return newValue;
    });
  };

  // Lista de coordenadas Y exatas das 15 linhas horizontais da grade de decibéis (dB) no canvas redimensionado (750x583)
  const GRID_Y_LINES = [52, 88, 127, 163, 200, 237, 275, 312, 350, 387, 423, 460, 498, 535, 568];

  // Função para aproximar (snap) a coordenada Y clicada para a linha de decibéis mais próxima ou para o ponto médio exato entre elas
  const snapYToGrid = (clickedY: number): number => {
    // Array para consolidar todos os alinhamentos permitidos (valores na linha ou exatamente nos centros)
    const allowedY: number[] = [];

    // Adiciona todas as coordenadas nativas das linhas horizontais
    GRID_Y_LINES.forEach((yVal) => {
      // Insere cada coordenada na lista de alinhamentos permitidos
      allowedY.push(yVal);
    });

    // Calcula a metade exata do espaço entre cada par de linhas consecutivas e adiciona como ponto permitido
    for (let i = 0; i < GRID_Y_LINES.length - 1; i++) {
      // Soma a posição atual e a próxima, dividindo por 2 para achar o ponto médio exato
      const mid = (GRID_Y_LINES[i] + GRID_Y_LINES[i + 1]) / 2;
      // Insere o valor arredondado no array para preservar a escala de inteiros
      allowedY.push(Math.round(mid));
    }

    // Ordena os valores numéricos crescentes para facilitar a busca do elemento mais próximo
    allowedY.sort((a, b) => a - b);

    // Começa assumindo que a primeira coordenada permitida é a mais próxima
    let closestY = allowedY[0];
    // Define a menor diferença absoluta registrada até o momento
    let minDiff = Math.abs(clickedY - closestY);

    // Varre o restante da lista de alinhamentos permitidos
    for (let j = 1; j < allowedY.length; j++) {
      // Calcula a diferença absoluta em relação ao valor atual avaliado
      const diff = Math.abs(clickedY - allowedY[j]);
      // Se a diferença for menor do que a menor diferença registrada
      if (diff < minDiff) {
        // Atualiza a menor diferença com o novo valor mínimo
        minDiff = diff;
        // Salva a coordenada permitida mais próxima correspondente
        closestY = allowedY[j];
      }
    }

    // Retorna a coordenada perfeitamente snapada
    return closestY;
  };

  // Função auxiliar para traçar uma linha reta entre dois pontos geométricos
  const drawLineBetween = (
    // Contexto 2D do canvas onde a linha será desenhada
    ctx: CanvasRenderingContext2D,
    // Ponto geométrico de partida
    p1: Point,
    // Ponto geométrico de chegada
    p2: Point,
    // Cor que será aplicada na linha
    color: string,
    // Determina se o traçado da linha será pontilhado/tracejado
    dashed?: boolean
  ) => {
    // Inicia um novo caminho de desenho no canvas
    ctx.beginPath();
    // Define a espessura da linha de conexão como 3 pixels para maior clareza visual na grade gigante (750px)
    ctx.lineWidth = 3;
    // Define a cor de traço do canvas
    ctx.strokeStyle = color;
    // Define o formato de extremidade arredondado para suavidade visual
    ctx.lineCap = "round";

    // Se o parâmetro dashed for verdadeiro, define o padrão de traçado pontilhado (8px linha, 6px espaço)
    if (dashed) {
      ctx.setLineDash([8, 6]);
    } else {
      // Caso contrário, limpa qualquer padrão de traçado existente para linha contínua sólida
      ctx.setLineDash([]);
    }

    // Move o cursor para o ponto inicial
    ctx.moveTo(p1.x, p1.y);
    // Cria um segmento de reta até o ponto final
    ctx.lineTo(p2.x, p2.y);
    // Aplica o traçado físico da linha no canvas
    ctx.stroke();

    // Sempre reseta o padrão de traço do canvas para evitar afetar outros desenhos posteriores
    ctx.setLineDash([]);
  };

  // Função auxiliar para desenhar o símbolo correspondente no canvas
  const drawSymbol = (
    // Contexto 2D do canvas onde o símbolo será renderizado
    ctx: CanvasRenderingContext2D,
    // Coordenada X centralizada do símbolo
    x: number,
    // Coordenada Y centralizada do símbolo
    y: number,
    // Tipo do símbolo clínico a ser renderizado
    symbol: "bolinha" | "X" | "<" | ">",
    // Cor do símbolo clínico a ser renderizado (Vermelho ou Azul)
    color: string
  ) => {
    // Inicia o caminho de traçado para o símbolo
    ctx.beginPath();
    // Configura a cor de contorno e preenchimento
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    // Configura a espessura da linha do símbolo para 4 pixels para destaque
    // Configura a espessura da linha do símbolo para 5 pixels para destaque
    ctx.lineWidth = 5;
    // Configura junção e extremidades das linhas arredondadas para melhor estética
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Lógica para desenhar o símbolo da circunferência vazada (Bolinha) (Aumentado para a grade gigante -> Raio 13px)
    if (symbol === "bolinha") {
      // Traça o arco completo (360 graus) com raio de 13 pixels
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      // Desenha apenas o contorno, deixando o interior vazio
      ctx.stroke();
    // Lógica para desenhar o símbolo X (Aumentado para a grade gigante -> Size 13px)
    } else if (symbol === "X") {
      // Define a extensão diagonal do X como 13 pixels
      const size = 13;
      // Traça a primeira diagonal (superior esquerda para inferior direita)
      ctx.moveTo(x - size, y - size);
      ctx.lineTo(x + size, y + size);
      // Traça a segunda diagonal (superior direita para inferior esquerda)
      ctx.moveTo(x + size, y - size);
      ctx.lineTo(x - size, y + size);
      // Executa o desenho físico das linhas no canvas
      ctx.stroke();
    // Lógica para desenhar o símbolo menor que (<) (Aumentado para a grade gigante -> Size 17px)
    } else if (symbol === "<") {
      // Define a extensão do símbolo menor que como 17 pixels
      const size = 17;
      // Traça a extremidade superior direita do símbolo menor que
      ctx.moveTo(x + size, y - size);
      // Conecta com o vértice esquerdo centralizado
      ctx.lineTo(x - size, y);
      // Conecta com a extremidade inferior direita do símbolo menor que
      ctx.lineTo(x + size, y + size);
      // Executa o desenho físico da seta no canvas
      ctx.stroke();
    // Lógica para desenhar o símbolo maior que (>) (Aumentado para a grade gigante -> Size 17px)
    } else if (symbol === ">") {
      // Define a extensão do símbolo maior que como 17 pixels
      const size = 17;
      // Traça a extremidade superior esquerda do símbolo maior que
      ctx.moveTo(x - size, y - size);
      // Conecta com o vértice direito centralizado
      ctx.lineTo(x + size, y);
      // Conecta com a extremidade inferior esquerda do símbolo maior que
      ctx.lineTo(x - size, y + size);
      // Executa o desenho físico da seta no canvas
      ctx.stroke();
    }
  };

  // Efeito colateral que escuta as mudanças no estado do desenho e renderiza tudo dinamicamente
  React.useEffect(() => {
    // Função interna para limpar e redesenhar do zero uma orelha específica
    const renderCanvas = (ear: "OD" | "OE") => {
      // Seleciona a referência correta do canvas do DOM
      const canvas = ear === "OD" ? canvasODRef.current : canvasOERef.current;
      // Retorna imediatamente caso o elemento canvas não esteja disponível
      if (!canvas) return;
      // Obtém o contexto de renderização bidimensional
      const ctx = canvas.getContext("2d");
      // Retorna imediatamente caso o contexto não seja inicializado
      if (!ctx) return;

      // Limpa todo o retângulo do canvas mantendo a imagem de fundo invisível ao clear
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Associa as coleções de dados corretas para OD ou OE
      const points = ear === "OD" ? pointsOD : pointsOE;
      const lines = ear === "OD" ? linesOD : linesOE;
      const color = ear === "OD" ? "#ef4444" : "#3b82f6";

      // 1. Renderiza primeiro as conexões de linhas para que os símbolos fiquem em cima
      lines.forEach((line) => {
        // Recupera o ponto inicial
        const p1 = points[line.fromIndex];
        // Recupera o ponto final
        const p2 = points[line.toIndex];
        // Se ambos os pontos existirem na coleção
        if (p1 && p2) {
          // Traça a conexão de linha reta entre os dois pontos (Pontilhada na Orelha Esquerda - OE)
          drawLineBetween(ctx, p1, p2, color, ear === "OE");
        }
      });

      // 2. Renderiza os símbolos e destaques de seleção
      points.forEach((p, index) => {
        // Desenha o símbolo geométrico na coordenada correspondente
        drawSymbol(ctx, p.x, p.y, p.symbol, color);

        // Se o ponto atual for o selecionado no modo Ligar manual
        if (selectedPoint && selectedPoint.ear === ear && selectedPoint.index === index) {
          // Inicia o contorno de destaque
          ctx.beginPath();
          // Define a cor de destaque do contorno
          ctx.strokeStyle = color;
          // Configura a espessura fina para a linha pontilhada
          ctx.lineWidth = 1.5;
          // Configura um padrão tracejado elegante (4px de traço, 4px de espaçamento)
          ctx.setLineDash([4, 4]);
          // Desenha um anel externo com raio 27 pixels ao redor do ponto (Aumentado para a grade gigante)
          ctx.arc(p.x, p.y, 27, 0, Math.PI * 2);
          // Desenha fisicamente o tracejado
          ctx.stroke();
          // Limpa o padrão tracejado para que os próximos desenhos não sejam afetados
          ctx.setLineDash([]);
        }
      });
    };

    // Renderiza a Orelha Direita (OD)
    renderCanvas("OD");
    // Renderiza a Orelha Esquerda (OE)
    renderCanvas("OE");
    // Escuta mudanças em pontos, conexões e seleção ativa para atualizar a tela
  }, [pointsOD, pointsOE, linesOD, linesOE, selectedPoint]);

  // Função principal disparada no clique sobre o canvas (inicia lógica de símbolo ou conexão)
  const startDrawing = (
    // Evento nativo de mouse do React
    e: React.MouseEvent<HTMLCanvasElement>,
    // Identificador da orelha clicada (OD ou OE)
    ear: "OD" | "OE"
  ) => {
    // Recupera a referência correta do canvas no DOM
    const canvas = ear === "OD" ? canvasODRef.current : canvasOERef.current;
    // Aborta se o canvas não estiver renderizado
    if (!canvas) return;

    // Obtém o retângulo delimitador para calcular coordenadas precisas dentro do canvas
    const rect = canvas.getBoundingClientRect();
    // Calcula a escala horizontal entre o tamanho real e o visual do canvas
    const scaleX = canvas.width / rect.width;
    // Calcula a escala vertical entre o tamanho real e o visual do canvas
    const scaleY = canvas.height / rect.height;
    // Obtém a coordenada X final ajustada pelo posicionamento e escala
    const x = (e.clientX - rect.left) * scaleX;
    // Obtém a coordenada Y bruta ajustada pelo posicionamento e escala antes do alinhamento (snap)
    const rawY = (e.clientY - rect.top) * scaleY;
    // Aplica o snap vertical para alinhar a coordenada Y na linha de decibéis ou no centro exato entre elas
    const y = snapYToGrid(rawY);

    // Associa as referências de estado de acordo com a orelha clicada
    const points = ear === "OD" ? pointsOD : pointsOE;
    const setPoints = ear === "OD" ? setPointsOD : setPointsOE;
    const setLines = ear === "OD" ? setLinesOD : setLinesOE;

    // Se a ferramenta selecionada for o modo "Ligar" manual de conexões
    if (drawMode === "ligar") {
      // Varre a lista de pontos para encontrar se o clique foi próximo (25px) de algum símbolo na grade gigante
      const clickedPointIndex = points.findIndex(
        (p) => Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) <= 25
      );

      // Se encontrou algum ponto existente próximo do clique
      if (clickedPointIndex !== -1) {
        // Se ainda não houver nenhum ponto selecionado na fila para conectar
        if (selectedPoint === null) {
          // Registra o ponto de origem da conexão
          setSelectedPoint({ ear, index: clickedPointIndex });
        } else {
          // Se a origem for da mesma orelha do clique atual
          if (selectedPoint.ear === ear) {
            // E se o ponto de destino for diferente do ponto de origem (evita auto-conexão)
            if (selectedPoint.index !== clickedPointIndex) {
              // Grava o snapshot atual no histórico de desfazer antes de conectar
              pushToHistory();
              // Registra a nova conexão de linha reta entre os pontos
              setLines((prev) => [
                ...prev,
                { fromIndex: selectedPoint.index, toIndex: clickedPointIndex },
              ]);
            }
          }
          // Reseta a seleção na memória após a tentativa de conexão
          setSelectedPoint(null);
        }
      } else {
        // Se clicou em um espaço vazio do canvas, cancela qualquer seleção pendente
        setSelectedPoint(null);
      }
    } else {
      // Grava o snapshot atual no histórico antes de inserir um novo ponto
      pushToHistory();
      // Modo de inserção padrão de novos símbolos clínicos (Bolinha, X, < ou >)
      const newPoint: Point = {
        x,
        y,
        symbol: drawMode as "bolinha" | "X" | "<" | ">",
      };

      // Atualiza a lista de pontos adicionando o novo ponto geométrico
      setPoints((prev) => {
        // Cria a nova lista contendo todos os pontos anteriores mais o novo ponto
        const updated = [...prev, newPoint];

        // Se o toggle Conectar Automático estiver ativo e houver pelo menos um ponto anterior
        if (autoConnect && prev.length > 0) {
          // Conecta o penúltimo ponto do array
          const fromIndex = prev.length - 1;
          // Com o último ponto que acaba de ser inserido
          const toIndex = updated.length - 1;
          // Atualiza a lista de conexões inserindo o novo link
          setLines((prevLines) => [
            ...prevLines,
            { fromIndex, toIndex },
          ]);
        }
        // Retorna a nova lista de pontos estruturada
        return updated;
      });
    }
  };

  // Função para apagar tudo dos dois canvases
  const clearCanvas = () => {
    // Grava o snapshot atual no histórico permitindo desfazer a limpeza total
    pushToHistory();
    // Reseta a lista de pontos da Orelha Direita (OD)
    setPointsOD([]);
    // Reseta a lista de pontos da Orelha Esquerda (OE)
    setPointsOE([]);
    // Reseta a lista de conexões da Orelha Direita (OD)
    setLinesOD([]);
    // Reseta a lista de conexões da Orelha Esquerda (OE)
    setLinesOE([]);
    // Reseta a seleção ativa no modo manual
    setSelectedPoint(null);
  };

  // Retornamos a estrutura principal do componente com uma div que ocupa todo o espaço
  return (
    // Div principal com padding, fundo claro, permitindo scroll caso necessário (Ajustado para max-w-4xl para perfeita centralização das grades empilhadas de 750px)
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 print:p-0 print:pt-[10px] print:m-0 print:space-y-1 print:max-w-none print:w-full">
      {/* Formal Print Header (Hidden on screen) */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold uppercase border-b border-gray-400 pb-2 tracking-widest text-black">
          Protocolo de Audiometria Ocupacional
        </h1>
      </div>

      {/* Cabeçalho principal com efeito de vidro e sombra flutuante */}
      <div className="glass-panel p-6 rounded-ios shadow-float border border-ios-primary/20 flex items-center justify-center bg-white/80 print:hidden">
        {/* Ícone de fone de ouvido para remeter a audiometria */}
        <Headphones className="w-8 h-8 text-ios-primary mr-3" />
        {/* Título do documento */}
        <h1 className="text-2xl font-bold text-ios-text tracking-tight uppercase">
          Protocolo de Audiometria Ocupacional
        </h1>
      </div>

      {/* Seção 1: Dados do Paciente e Empresa */}
      {/* Container com fundo branco arredondado para agrupar as informações */}
      <div className="bg-white rounded-ios shadow-sm border border-ios-divider p-6 space-y-4 relative overflow-hidden print:border-gray-300 print:border print:rounded-none print:shadow-none print:p-2 print:mb-1 print:break-inside-avoid">
        {/* Barra lateral de cor azul para dar um charme visual premium */}
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-primary rounded-l-ios print:hidden"></div>

        {/* Cabeçalho da seção com ícone de usuário */}
        <div className="flex items-center text-ios-primary font-semibold mb-4 border-b border-ios-divider pb-2 print:border-gray-400 print:mb-2 print:pb-1 print:text-black print:justify-center">
          <User className="w-5 h-5 mr-2 print:hidden" />
          <span className="print:text-xs print:font-bold uppercase">
            DADOS DO PACIENTE
          </span>
        </div>

        {/* Grid de 2 colunas em telas maiores, 1 em telas menores */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Campo Empresa */}
          <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
            {/* Label descritivo */}
            <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider print:text-black print:min-w-[60px] print:mb-0">
              Empresa
            </label>
            {/* Input de texto com estilos suaves */}
            <input
              type="text"
              defaultValue={appointment?.unidades?.nome_unidade || ""}
              className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1"
              placeholder="Nome da Empresa"
            />
          </div>

          {/* Campo Função */}
          <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
            {/* Label descritivo */}
            <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider print:text-black print:min-w-[60px] print:mb-0">
              Função
            </label>
            {/* Input de texto */}
            <input
              type="text"
              defaultValue={appointment?.colaboradores?.setor || ""}
              className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1"
              placeholder="Função do Colaborador"
            />
          </div>

          {/* Campo Nome */}
          <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
            {/* Label descritivo */}
            <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider print:text-black print:min-w-[60px] print:mb-0">
              Nome
            </label>
            {/* Input de texto */}
            <input
              type="text"
              defaultValue={appointment?.colaboradores?.nome || ""}
              className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1"
              placeholder="Nome completo"
            />
          </div>

          {/* Grupo de Sexo com radio buttons */}
          <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
            {/* Label descritivo */}
            <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider print:text-black print:min-w-[60px] print:mb-0">
              Sexo
            </label>
            {/* Container flex para os radio buttons ficarem lado a lado */}
            <div className="flex space-x-4 items-center h-full pt-1 print:pt-0">
              {/* Label encapsulando o input radio feminino */}
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="radio"
                  name="sexo"
                  value="Feminino"
                  defaultChecked={appointment?.colaboradores?.sexo === "F"}
                  className="text-ios-primary focus:ring-ios-primary accent-ios-primary w-4 h-4 print:w-3 print:h-3"
                />
                <span className="text-sm text-ios-text group-hover:text-ios-primary transition-colors print:text-[10px] print:text-black">
                  Feminino
                </span>
              </label>
              {/* Label encapsulando o input radio masculino */}
              <label className="flex items-center space-x-2 cursor-pointer group">
                <input
                  type="radio"
                  name="sexo"
                  value="Masculino"
                  defaultChecked={appointment?.colaboradores?.sexo === "M"}
                  className="text-ios-primary focus:ring-ios-primary accent-ios-primary w-4 h-4 print:w-3 print:h-3"
                />
                <span className="text-sm text-ios-text group-hover:text-ios-primary transition-colors print:text-[10px] print:text-black">
                  Masculino
                </span>
              </label>
            </div>
          </div>

          {/* Grid aninhado para CPF e RG */}
          <div className="grid grid-cols-2 gap-4">
            {/* Campo CPF */}
            <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
              <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider print:text-black print:min-w-[30px] print:mb-0">
                CPF
              </label>
              <input
                type="text"
                defaultValue={appointment?.colaboradores?.cpf || ""}
                className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1"
                placeholder="000.000.000-00"
              />
            </div>
            {/* Campo RG */}
            <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
              <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider print:text-black print:min-w-[30px] print:mb-0">
                RG
              </label>
              <input
                type="text"
                className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1"
                placeholder="RG"
              />
            </div>
          </div>

          {/* Campo Nascimento */}
          <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
            <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider print:text-black print:min-w-[60px] print:mb-0">
              Nasc.
            </label>
            <input
              type="date"
              defaultValue={appointment?.colaboradores?.data_nascimento || ""}
              className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm text-ios-text print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1"
            />
          </div>

          {/* Campo Data do Exame */}
          <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
            <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider print:text-black print:min-w-[60px] print:mb-0">
              Exame
            </label>
            <input
              type="date"
              defaultValue={appointment?.data_atendimento || ""}
              className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm text-ios-text print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1"
            />
          </div>

          {/* Campo Repouso Auditivo */}
          <div className="flex flex-col print:flex-row print:items-baseline print:gap-2">
            <label className="text-xs font-medium text-ios-subtext mb-1 uppercase tracking-wider print:text-black print:min-w-[60px] print:mb-0">
              Repouso
            </label>
            <input
              type="text"
              className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1"
              placeholder="Ex: 14 horas"
            />
          </div>
        </div>
      </div>

      {/* Seção 2: Tipo de Exame */}
      <div className="bg-white rounded-ios shadow-sm border border-ios-divider p-6 relative overflow-hidden print:border-gray-300 print:border print:rounded-none print:shadow-none print:p-2 print:mb-1 print:break-inside-avoid">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-secondary rounded-l-ios print:hidden"></div>
        <div className="flex items-center text-ios-secondary font-semibold mb-4 border-b border-ios-divider pb-2 print:border-gray-400 print:mb-2 print:pb-1 print:text-black print:justify-center">
          <Briefcase className="w-5 h-5 mr-2 print:hidden" />
          <span className="print:text-xs print:font-bold uppercase">
            TIPO DE EXAME
          </span>
        </div>

        {/* Grid de checkboxes para facilitar seleção */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Opção Admissional */}
          <label className="flex items-center space-x-2 cursor-pointer bg-ios-bg p-3 rounded-ios-sm border border-transparent hover:border-ios-secondary/30 transition-colors print:bg-transparent print:p-0 print:border-0 print:gap-1">
            <input
              type="checkbox"
              defaultChecked={appointment?.tipo === "Admissional"}
              className="text-ios-secondary focus:ring-ios-secondary rounded accent-ios-secondary w-4 h-4"
            />
            <span className="text-sm font-medium text-ios-text">
              Admissional
            </span>
          </label>
          {/* Opção Periódico */}
          <label className="flex items-center space-x-2 cursor-pointer bg-ios-bg p-3 rounded-ios-sm border border-transparent hover:border-ios-secondary/30 transition-colors print:bg-transparent print:p-0 print:border-0 print:gap-1">
            <input
              type="checkbox"
              defaultChecked={appointment?.tipo === "Periódico"}
              className="text-ios-secondary focus:ring-ios-secondary rounded accent-ios-secondary w-4 h-4"
            />
            <span className="text-sm font-medium text-ios-text">Periódico</span>
          </label>
          {/* Opção Demissional */}
          <label className="flex items-center space-x-2 cursor-pointer bg-ios-bg p-3 rounded-ios-sm border border-transparent hover:border-ios-secondary/30 transition-colors print:bg-transparent print:p-0 print:border-0 print:gap-1">
            <input
              type="checkbox"
              defaultChecked={appointment?.tipo === "Demissional"}
              className="text-ios-secondary focus:ring-ios-secondary rounded accent-ios-secondary w-4 h-4"
            />
            <span className="text-sm font-medium text-ios-text">
              Demissional
            </span>
          </label>
          {/* Opção Retorno ao Trabalho */}
          <label className="flex items-center space-x-2 cursor-pointer bg-ios-bg p-3 rounded-ios-sm border border-transparent hover:border-ios-secondary/30 transition-colors print:bg-transparent print:p-0 print:border-0 print:gap-1">
            <input
              type="checkbox"
              defaultChecked={appointment?.tipo === "Retorno"}
              className="text-ios-secondary focus:ring-ios-secondary rounded accent-ios-secondary w-4 h-4"
            />
            <span className="text-sm font-medium text-ios-text leading-tight">
              Retorno ao Trabalho
            </span>
          </label>
          {/* Opção Mudança de Riscos */}
          <label className="flex items-center space-x-2 cursor-pointer bg-ios-bg p-3 rounded-ios-sm border border-transparent hover:border-ios-secondary/30 transition-colors print:bg-transparent print:p-0 print:border-0 print:gap-1">
            <input
              type="checkbox"
              defaultChecked={appointment?.tipo === "Mudança"}
              className="text-ios-secondary focus:ring-ios-secondary rounded accent-ios-secondary w-4 h-4"
            />
            <span className="text-sm font-medium text-ios-text leading-tight">
              Mudança de Riscos
            </span>
          </label>
        </div>
      </div>

      {/* Seção 3: Meatoscopia */}
      <div className="bg-white rounded-ios shadow-sm border border-ios-divider p-6 relative overflow-hidden print:border-gray-300 print:border print:rounded-none print:shadow-none print:p-2 print:mb-1 print:break-inside-avoid">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-ios-text rounded-l-ios print:hidden"></div>
        <div className="flex items-center text-ios-text font-semibold mb-4 border-b border-ios-divider pb-2 print:border-gray-400 print:mb-2 print:pb-1 print:text-black print:justify-center">
          <Stethoscope className="w-5 h-5 mr-2 print:hidden" />
          <span className="uppercase tracking-widest text-sm print:text-xs print:font-bold">
            MEATOSCOPIA
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-2 print:flex-row print:items-baseline print:space-y-0 print:gap-2">
            <label className="text-sm font-semibold text-ios-subtext uppercase print:text-[10px] print:text-black print:min-w-[110px]">
              Orelha Direita (OD)
            </label>
            <input
              type="text"
              className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none focus:outline-none focus:border-ios-primary focus:ring-1 transition-all text-sm print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1"
              placeholder="Normal, Presença de cerúmen, etc..."
            />
          </div>
          <div className="flex flex-col space-y-2 print:flex-row print:items-baseline print:space-y-0 print:gap-2">
            <label className="text-sm font-semibold text-ios-subtext uppercase print:text-[10px] print:text-black print:min-w-[110px]">
              Orelha Esquerda (OE)
            </label>
            <input
              type="text"
              className="px-3 py-2 bg-ios-bg border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none focus:outline-none focus:border-ios-primary focus:ring-1 transition-all text-sm print:bg-transparent print:border-0 print:border-b print:border-gray-400 print:rounded-none print:px-0 print:py-0 print:text-[10px] print:text-black print:flex-1"
              placeholder="Normal, Presença de cerúmen, etc..."
            />
          </div>
        </div>
      </div>

      {/* Seção 4: Grade Audiométrica (Canvas Interativo) */}
      <div className="bg-white rounded-ios shadow-sm border border-ios-divider p-6 relative overflow-hidden print:border-gray-300 print:border print:rounded-none print:shadow-none print:p-2 print:mb-1 print:break-inside-avoid">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 rounded-l-ios print:hidden"></div>

        {/* Cabeçalho da Grade contendo o título e a barra de ferramentas de desenho alinhada centralizadamente (Aumentado em 30%) */}
        {/* Cabeçalho da Grade contendo o título e a barra de ferramentas de desenho alinhada centralizadamente */}
        <div className="flex flex-col items-center mb-4   gap-5">
          {/* Container do título da seção */}
          <div className="flex items-center text-blue-600 font-semibold print:hidden">
            {/* Ícone de batimento/atividade cardíaca representando o teste tonal */}
            <Activity className="w-[26px] h-[26px] mr-3 print:hidden" />
            {/* Texto de identificação da seção de audiometria */}
            <span className="uppercase tracking-widest text-[18px] print:text-xs  items-center flex print:font-bold print:text-black">
              Audiometria Tonal
            </span>
          </div>
       </div>
          {/* Barra de Ferramentas principal do Canvas com flexibilidade total e botões centralizados */}
          <div className="flex flex-wrap items-center justify-center gap-[4px]  p-[8px] rounded-lg border border-ios-divider print:hidden w-full lg:w-auto mx-auto lg:mx-0">
            {/* Toggle Switch para Conectar Automático (Ajustado com p-[3px] e items-center para centralização absoluta sem transbordo) */}
            <div className="flex items-center h-[46px] space-x-3.5 px-2 select-none">
              <span className="text-[16px] font-semibold text-ios-text">Conectar Auto</span>
              <button
                // Alterna o toggle ao clique
                onClick={handleToggleAutoConnect}
                // Contêiner do switch com flexbox centralizado e p-[3px] garantindo posicionamento perfeito do botão interno
                className={`relative inline-flex items-center h-[28px] w-[50px] shrink-0 cursor-pointer rounded-full p-[3px] transition-colors duration-200 ease-in-out focus:outline-none ${autoConnect ? "bg-ios-primary" : "bg-gray-300"}`}
              >
                <span
                  // Círculo deslizante branco com dimensões perfeitas de 22x22px dentro do contêiner sem transbordar
                  className={`pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoConnect ? "translate-x-[22px]" : "translate-x-0"}`}
                />
              </button>
            </div>


           

            
            {/* Renderização condicional do botão "Ligar" */}
            {!autoConnect && (
              <button
                onClick={() => setDrawMode("ligar")}
                className={`flex items-center justify-center h-[46px] px-5 rounded-md text-[16px] font-semibold transition-all ${drawMode === "ligar" ? "bg-green-600 text-white shadow-sm" : "text-ios-subtext hover:bg-gray-200"}`}
              >
                <FileSignature className="w-[20px] h-[20px] mr-2" />
                Ligar
              </button>
            )}

             {/* Divisor vertical discreto */}
            <div className="w-px h-[30px] bg-gray-300 hidden sm:block"></div>

            {/* Botão para ativar a ferramenta de Bolinha vazada */}
            <button
              onClick={() => setDrawMode("bolinha")}
              className={`flex items-center justify-center w-[46px] h-[46px] rounded-md text-sm font-semibold transition-all ${drawMode === "bolinha" ? "bg-ios-primary text-white shadow-sm" : "text-ios-subtext hover:bg-gray-200"}`}
            >
              {/* Ícone Circle da bolinha centrado perfeitamente */}
              <Circle className="w-[22px] h-[22px]" />
            </button>
            

            {/* Botão para ativar a ferramenta de Símbolo X */}
            <button
              onClick={() => setDrawMode("X")}
              className={`flex items-center justify-center w-[46px] h-[46px] rounded-md text-sm font-semibold transition-all ${drawMode === "X" ? "bg-ios-primary text-white shadow-sm" : "text-ios-subtext hover:bg-gray-200"}`}
            
            >
              
              
              {/* Span com flexbox centrado absoluto para evitar assimetrias de renderização de fontes */}
              <span className="flex items-center justify-center w-full h-full font-bold text-[20px] select-none text-center leading-none">X</span>
              
            </button>
             <div className="w-px h-[30px] bg-gray-300 mx-1.5 hidden sm:block"></div>

            {/* Botão para ativar a ferramenta de Símbolo menor que (<) - Só aparece na Orelha Direita (OD) */}
            {activeTab === "OD" && (
              <button
                onClick={() => setDrawMode("<")}
                className={`flex items-center justify-center w-[46px] h-[46px] rounded-md text-sm font-semibold transition-all ${drawMode === "<" ? "bg-red-500 text-white shadow-sm" : " text-red-500 hover:bg-gray-200"}`}
              >
                {/* Span com flexbox centrado absoluto para centralização perfeita de símbolos matemáticos */}
                <span className="flex items-center justify-center w-full h-full font-bold text-[32px] select-none text-center leading-none">&lt;</span>
              </button>
            )}

            {/* Botão para ativar a ferramenta de Símbolo maior que (>) - Só aparece na Orelha Esquerda (OE) */}
            {activeTab === "OE" && (
              <button
                onClick={() => setDrawMode(">")}
                className={`flex items-center justify-center w-[46px] h-[46px] rounded-md text-sm font-semibold transition-all ${drawMode === ">" ? "bg-blue-500 text-white shadow-sm" : " text-blue-500 hover:bg-gray-200"}`}
              >
                {/* Span com flexbox centrado absoluto para centralização perfeita do caractere > */}
                <span className="flex items-center justify-center w-full h-full font-bold text-[32px] select-none text-center leading-none">&gt;</span>
              </button>
            )}


            {/* Divisor vertical discreto */}
            <div className="w-px h-[30px] bg-gray-300 mx-1.5 hidden sm:block"></div>

            {/* Botão para desfazer a última alteração nos canvases */}
            <button
              disabled={history.length === 0}
              onClick={handleUndo}
              className={`flex items-center justify-center w-[46px] h-[46px] rounded-md transition-all ${
                history.length === 0
                  ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 border border-ios-divider"
                  : "bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-95 shadow-sm border border-amber-200"
              }`}
            >
              {/* Ícone Undo2 perfeitamente centrado sem margens desnecessárias */}
              <Undo2 className="w-[20px] h-[20px]" />
            </button>

            {/* Botão para limpar canvases e remover dados */}
            <button
              onClick={clearCanvas}
              className="flex items-center justify-center w-[46px] h-[46px] rounded-md bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all border border-red-200"
            >
              {/* Ícone Trash2 perfeitamente centrado sem margens desnecessárias */}
              <Trash2 className="w-[20px] h-[20px]" />
            </button>
          </div>

        {/* Sistema de Abas Premium no estilo iOS Segmented Control (Oculto na Impressão) (Padding top de 4px) */}
        <div className="flex justify-center mb-6 mt-[10px] print:hidden">
          {/* Contêiner de fundo da barra de abas */}
          <div className="inline-flex p-1 rounded-full border border-gray-200 shadow-inner bg-gray-100/80">
            {/* Aba da Orelha Esquerda (OE) à esquerda do rótulo da Direita, cor azul de destaque */}
            <button
              type="button"
              onClick={() => selectTab("OE")}
              className={`px-8 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase transition-all duration-200 ${
                activeTab === "OE"
                  ? "bg-blue-600 text-white shadow-md scale-[1.02]"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Orelha Esquerda (OE)
            </button>
            {/* Aba da Orelha Direita (OD) à direita, cor vermelha de destaque */}
            <button
              type="button"
              onClick={() => selectTab("OD")}
              className={`px-8 py-2.5 rounded-full text-sm font-bold tracking-wider uppercase transition-all duration-200 ${
                activeTab === "OD"
                  ? "bg-red-500 text-white shadow-md scale-[1.02]"
                  : "text-gray-500 hover:text-gray-800"
              }`}
            >
              Orelha Direita (OD)
            </button>
          </div>
        </div>

        {/* Container das grades: Flex empilhado em tela (mostrando apenas a ativa) e Grid de 2 colunas na impressão */}
        <div className="flex flex-col items-center mt-6 print:grid print:grid-cols-2 print:gap-4 print:justify-items-center print:mt-4">
          {/* Orelha Direita (Canvas Vermelho) (Exibido na tela quando ativo e sempre visível na impressão) */}
          <div className={`flex flex-col items-center w-full max-w-[750px] print:max-w-[288px] ${activeTab === "OD" ? "flex" : "hidden print:flex"}`}>
            {/* Título de identificação da orelha direita */}
            <h3 className="text-center font-bold text-red-500 mb-3 text-sm tracking-widest print:text-[10px] print:mb-1">
              ORELHA DIREITA (OD)
            </h3>
            {/* Box envolvente do canvas e imagem */}
            <div className="relative border border-gray-300 shadow-sm overflow-hidden bg-white w-full rounded print:border-gray-300 print:border print:rounded-none print:shadow-none">
              {/* Imagem estática de grade do audiograma posicionada no fundo */}
              <img
                src={gradeImage}
                alt="Grade Audiometria"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none print:block"
              />
              {/* Canvas transparente interativo posicionado em cima da imagem */}
              <canvas
                // Referência capturada no hook useRef
                ref={canvasODRef}
                // Largura nativa do canvas para proporção matemática de desenho (Grade Gigante -> 750px)
                width={750}
                // Altura nativa do canvas para proporção matemática de desenho (Grade Gigante -> 583px)
                height={583}
                // Classes utilitárias de cursor e redimensionamento responsivo
                className="relative z-10 cursor-crosshair w-full h-auto touch-none"
                // Garante exibição em bloco
                style={{ display: "block" }}
                // Dispara startDrawing apenas ao clicar (pressionar botão do mouse)
                onMouseDown={(e) => startDrawing(e, "OD")}
              />
            </div>
            {/* Rodapé informativo oculto na impressão */}
            <p className="text-[10px] text-gray-400 mt-2 text-center w-full print:hidden">
              Cor do traço: Vermelho
            </p>
          </div>

          {/* Orelha Esquerda (Canvas Azul) (Exibido na tela quando ativo e sempre visível na impressão) */}
          <div className={`flex flex-col items-center w-full max-w-[750px] print:max-w-[288px] ${activeTab === "OE" ? "flex" : "hidden print:flex"}`}>
            {/* Título de identificação da orelha esquerda */}
            <h3 className="text-center font-bold text-blue-500 mb-3 text-sm tracking-widest print:text-[10px] print:mb-1">
              ORELHA ESQUERDA (OE)
            </h3>
            {/* Box envolvente do canvas e imagem */}
            <div className="relative border border-gray-300 shadow-sm overflow-hidden bg-white w-full rounded print:border-gray-300 print:border print:rounded-none print:shadow-none">
              {/* Imagem estática de grade do audiograma posicionada no fundo */}
              <img
                src={gradeImage}
                alt="Grade Audiometria"
                className="absolute inset-0 w-full h-full object-fill pointer-events-none print:block"
              />
              {/* Canvas transparente interativo posicionado em cima da imagem */}
              <canvas
                // Referência capturada no hook useRef
                ref={canvasOERef}
                // Largura nativa do canvas para proporção matemática de desenho (Grade Gigante -> 750px)
                width={750}
                // Altura nativa do canvas para proporção matemática de desenho (Grade Gigante -> 583px)
                height={583}
                // Classes utilitárias de cursor e redimensionamento responsivo
                className="relative z-10 cursor-crosshair w-full h-auto touch-none"
                // Garante exibição em bloco
                style={{ display: "block" }}
                // Dispara startDrawing apenas ao clicar (pressionar botão do mouse)
                onMouseDown={(e) => startDrawing(e, "OE")}
              />
            </div>
            {/* Rodapé informativo oculto na impressão */}
            <p className="text-[10px] text-gray-400 mt-2 text-center w-full print:hidden">
              Cor do traço: Azul
            </p>
          </div>
        </div>
      </div>

      {/* Seção 5: Sinais Convencionais, Audiômetro e Logoaudiometria */}
      <div className="space-y-6 print:space-y-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 print:grid-cols-2 gap-6 print:gap-4">
          {/* Sinais Convencionais */}
          <div className="bg-white h-[348px] print:h-fit rounded-ios shadow-sm border border-ios-divider p-5 flex flex-col print:border-gray-300 print:border print:rounded-none print:shadow-none print:p-2 print:break-inside-avoid">
            <h4 className="text-sm font-bold text-center text-ios-text mb-4 border-b pb-2 print:border-gray-400 print:mb-2 print:pb-1 print:text-black uppercase tracking-wide">
              Sinais Convencionais
            </h4>

            {/* Tabela de símbolos para referência visual */}
            <div className="w-full overflow-hidden border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none print:border-2 text-sm">
              {/* Linha de cabeçalho da tabela */}
              <div className="grid grid-cols-5 bg-ios-bg text-center font-medium text-ios-subtext border-b border-ios-divider divide-x divide-ios-divider print:border-gray-400 print:divide-gray-300 print:bg-gray-100 print:border-gray-400 print:divide-gray-300 print:text-black">
                <div className="py-2 text-xs">Máscara</div>
                <div className="py-2">VA</div>
                <div className="py-2">VO</div>
                <div className="py-2">VA</div>
                <div className="py-2">VO</div>
              </div>
              {/* Linha de Sem Mascaramento */}
              <div className="grid grid-cols-5 text-center items-center border-b border-ios-divider divide-x divide-ios-divider print:border-gray-400 print:divide-gray-300 bg-white print:divide-gray-300 print:border-gray-400 print:divide-gray-300">
                <div className="py-2 text-xs font-medium text-ios-subtext bg-ios-bg/50">
                  Sem
                </div>
                <div className="py-2 font-bold text-red-500 text-lg">O</div>
                <div className="py-2 font-bold text-red-500 text-lg">&lt;</div>
                <div className="py-2 font-bold text-blue-500 text-lg">X</div>
                <div className="py-2 font-bold text-blue-500 text-lg">&gt;</div>
              </div>
              {/* Linha de Com Mascaramento */}
              <div className="grid grid-cols-5 text-center items-center divide-x divide-ios-divider bg-white print:divide-gray-300">
                <div className="py-2 text-xs font-medium text-ios-subtext bg-ios-bg/50">
                  Com
                </div>
                <div className="py-2 font-bold text-red-500 text-lg">△</div>
                <div className="py-2 font-bold text-red-500 text-lg">[</div>
                <div className="py-2 font-bold text-blue-500 text-lg">□</div>
                <div className="py-2 font-bold text-blue-500 text-lg">]</div>
              </div>
            </div>
            <div className="mt-2 text-center text-xs text-ios-subtext">
              Vermelho: OD | Azul: OE
            </div>
          </div>

          {/* Audiômetro */}
          <div className="bg-white h-[348px] print:h-fit rounded-ios shadow-sm border border-ios-divider p-5 flex flex-col print:border-gray-300 print:border print:rounded-none print:shadow-none print:p-2 print:break-inside-avoid">
            <h4 className="text-sm font-bold text-center text-ios-text mb-4 border-b pb-2 print:border-gray-400 print:mb-2 print:pb-1 print:text-black uppercase tracking-wide">
              Audiômetro
            </h4>
            <div className="space-y-4 mt-4">
              <div className="flex items-center">
                <label className="w-24 text-xs font-semibold text-ios-subtext">
                  Marca:
                </label>
                <input
                  type="text"
                  className="flex-1 border-b border-ios-divider focus:border-ios-primary focus:outline-none px-1 py-1 text-sm bg-transparent print:border-gray-400 print:text-[10px] print:text-black"
                />
              </div>
              <div className="flex items-center">
                <label className="w-24 text-xs font-semibold text-ios-subtext">
                  Modelo:
                </label>
                <input
                  type="text"
                  className="flex-1 border-b border-ios-divider focus:border-ios-primary focus:outline-none px-1 py-1 text-sm bg-transparent print:border-gray-400 print:text-[10px] print:text-black"
                />
              </div>
              <div className="flex items-center">
                <label className="w-24 text-xs font-semibold text-ios-subtext">
                  Calibração:
                </label>
                <input
                  type="text"
                  className="flex-1 border-b border-ios-divider focus:border-ios-primary focus:outline-none px-1 py-1 text-sm bg-transparent print:border-gray-400 print:text-[10px] print:text-black"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Logoaudiometria */}
        <div className="bg-white rounded-ios shadow-sm border border-ios-divider p-5 space-y-6 print:border-gray-300 print:border print:rounded-none print:shadow-none print:p-2 print:space-y-1 print:break-inside-avoid">
          <h4 className="text-sm font-bold text-center text-ios-text mb-2 border-b pb-2 print:border-gray-400 print:mb-2 print:pb-1 print:text-black uppercase tracking-wide">
            Logoaudiometria
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tabela LRF (Limiar de Reconhecimento de Fala) */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-ios-subtext uppercase tracking-widest text-center">
                LRF - Limiar de Reconhecimento de Fala
              </h5>
              <div className="border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none print:border-2 overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-ios-bg font-bold text-ios-subtext border-b border-t border-ios-divider print:border-b print:border-t print:border-gray-400 text-center print:items-stretch">
                  <div className="py-1 print:border-r print:border-gray-400"></div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    Intensid.
                  </div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    Monossil.
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    Dissil.
                  </div>
                </div>
                {/* Linha Palavras Faladas (Header secundário da imagem) */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider print:border-b print:border-t print:border-gray-400 text-center italic text-ios-subtext print:items-stretch">
                  <div className="py-1 font-semibold bg-ios-bg/30 print:bg-gray-100 print:text-black print:border-r print:border-gray-400 flex items-center justify-center">
                    Pal. Faladas
                  </div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    ---
                  </div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    25
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    25
                  </div>
                </div>
                {/* Linha OD (Orelha Direita) */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider print:border-b print:border-t print:border-gray-400 text-center items-center print:items-stretch">
                  <div className="py-2 font-bold text-red-500 bg-red-50/30 print:bg-transparent print:text-black print:text-[10px] print:border-r print:border-gray-400 flex items-center justify-center">
                    OD
                  </div>
                  <div className="py-1 px-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    <input
                      type="text"
                      className="w-full text-center focus:outline-none text-red-600 font-medium print:text-black print:text-[10px] print:font-normal"
                      placeholder="dB"
                    />
                  </div>
                  <div className="py-1 px-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    <input
                      type="text"
                      className="w-full text-center focus:outline-none text-red-600 font-medium print:text-black print:text-[10px] print:font-normal"
                      placeholder="%"
                    />
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      className="w-full text-center focus:outline-none text-red-600 font-medium print:text-black print:text-[10px] print:font-normal"
                      placeholder="%"
                    />
                  </div>
                </div>
                {/* Linha OE (Orelha Esquerda) */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider print:border-b print:border-t print:border-gray-400 text-center items-center print:items-stretch">
                  <div className="py-2 font-bold text-blue-500 bg-blue-50/30 print:bg-transparent print:text-black print:text-[10px] print:border-r print:border-gray-400 flex items-center justify-center">
                    OE
                  </div>
                  <div className="py-1 px-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    <input
                      type="text"
                      className="w-full text-center focus:outline-none text-blue-600 font-medium print:text-black print:text-[10px] print:font-normal"
                      placeholder="dB"
                    />
                  </div>
                  <div className="py-1 px-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    <input
                      type="text"
                      className="w-full text-center focus:outline-none text-blue-600 font-medium print:text-black print:text-[10px] print:font-normal"
                      placeholder="%"
                    />
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      className="w-full text-center focus:outline-none text-blue-600 font-medium print:text-black print:text-[10px] print:font-normal"
                      placeholder="%"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tabela IPRF (Índice Percentual de Reconhecimento de Fala) */}
            <div className="space-y-2">
              <h5 className="text-[10px] font-bold text-ios-subtext uppercase tracking-widest text-center">
                IPRF - Índice Percentual de Reconhecimento de Fala
              </h5>
              <div className="border border-ios-divider rounded-ios-sm print:border-gray-400 print:rounded-none print:border-2 overflow-hidden text-xs">
                <div className="grid grid-cols-4 bg-ios-bg font-bold text-ios-subtext border-b border-t border-ios-divider print:border-b print:border-t print:border-gray-400 text-center print:items-stretch">
                  <div className="py-1 print:border-r print:border-gray-400"></div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    Intensid.
                  </div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    Monossil.
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    Dissil.
                  </div>
                </div>
                {/* Linha Palavras Faladas */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider print:border-b print:border-t print:border-gray-400 text-center italic text-ios-subtext print:items-stretch">
                  <div className="py-1 font-semibold bg-ios-bg/30 print:bg-gray-100 print:text-black print:border-r print:border-gray-400 flex items-center justify-center">
                    Pal. Faladas
                  </div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    ---
                  </div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    25
                  </div>
                  <div className="py-1 flex items-center justify-center">
                    25
                  </div>
                </div>
                {/* Linha OD */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider print:border-b print:border-t print:border-gray-400 text-center items-center print:items-stretch">
                  <div className="py-2 font-bold text-red-500 bg-red-50/30 print:bg-transparent print:text-black print:text-[10px] print:border-r print:border-gray-400 flex items-center justify-center">
                    OD
                  </div>
                  <div className="py-1 px-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    <input
                      type="text"
                      className="w-full text-center focus:outline-none text-red-600 font-medium print:text-black print:text-[10px] print:font-normal"
                      placeholder="dB"
                    />
                  </div>
                  <div className="py-1 px-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    <input
                      type="text"
                      className="w-full text-center focus:outline-none text-red-600 font-medium print:text-black print:text-[10px] print:font-normal"
                      placeholder="%"
                    />
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      className="w-full text-center focus:outline-none text-red-600 font-medium print:text-black print:text-[10px] print:font-normal"
                      placeholder="%"
                    />
                  </div>
                </div>
                {/* Linha OE */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider print:border-b print:border-t print:border-gray-400 text-center items-center print:items-stretch">
                  <div className="py-2 font-bold text-blue-500 bg-blue-50/30 print:bg-transparent print:text-black print:text-[10px] print:border-r print:border-gray-400 flex items-center justify-center">
                    OE
                  </div>
                  <div className="py-1 px-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    <input
                      type="text"
                      className="w-full text-center focus:outline-none text-blue-600 font-medium print:text-black print:text-[10px] print:font-normal"
                      placeholder="dB"
                    />
                  </div>
                  <div className="py-1 px-1 print:border-r print:border-gray-400 flex items-center justify-center">
                    <input
                      type="text"
                      className="w-full text-center focus:outline-none text-blue-600 font-medium print:text-black print:text-[10px] print:font-normal"
                      placeholder="%"
                    />
                  </div>
                  <div className="py-1 px-1 flex items-center justify-center">
                    <input
                      type="text"
                      className="w-full text-center focus:outline-none text-blue-600 font-medium print:text-black print:text-[10px] print:font-normal"
                      placeholder="%"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 6: Laudo */}
      <div className="bg-white rounded-ios shadow-sm border border-ios-divider p-6 relative overflow-hidden print:border-gray-300 print:border print:rounded-none print:shadow-none print:p-2 print:mb-1 print:break-inside-avoid">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-green-500 rounded-l-ios print:hidden"></div>
        <div className="flex items-center text-green-600 font-semibold mb-6 border-b border-ios-divider pb-2 print:border-gray-400 print:mb-2 print:pb-1 print:text-black">
          <FileText className="w-5 h-5 mr-2 print:hidden" />
          <span className="uppercase tracking-widest text-sm print:text-xs print:font-bold">
            Laudo
          </span>
        </div>

        <div className="space-y-5">
          {/* Limiares auditivos */}
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 print:flex-row print:items-center print:space-y-0 print:space-x-4">
            <span className="text-sm font-semibold text-ios-text print:text-[10px] print:text-black">
              Limiares auditivos dentro dos limites aceitáveis:
            </span>
            <div className="flex items-center space-x-4">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="text-green-500 focus:ring-green-500 rounded w-4 h-4 print:w-3 print:h-3"
                />
                <span className="text-sm print:text-[10px] print:text-black">
                  OD
                </span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="text-green-500 focus:ring-green-500 rounded w-4 h-4 print:w-3 print:h-3"
                />
                <span className="text-sm print:text-[10px] print:text-black">
                  OE
                </span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="text-green-500 focus:ring-green-500 rounded w-4 h-4 print:w-3 print:h-3"
                />
                <span className="text-sm print:text-[10px] print:text-black">
                  Bilateral
                </span>
              </label>
            </div>
          </div>

          {/* Perda auditiva */}
          <div className="flex flex-col space-y-3">
            <span className="text-sm font-semibold text-ios-text">
              Perda auditiva:
            </span>

            {/* Perda OD */}
            <div className="flex flex-col sm:flex-row sm:items-center ml-2 sm:ml-4 space-y-2 sm:space-y-0 sm:space-x-4 print:flex-row print:items-center print:space-y-0 print:space-x-4 print:ml-0">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="text-ios-primary focus:ring-ios-primary rounded w-4 h-4 print:w-3 print:h-3"
                />
                <span className="text-sm font-medium w-6 print:text-[10px] print:text-black">
                  OD
                </span>
              </label>
              <div className="flex flex-wrap gap-4 pl-6 sm:pl-0 print:pl-0 print:gap-2">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-ios-subtext print:w-3 print:h-3"
                  />
                  <span className="text-sm print:text-[10px] print:text-black">
                    Neurossensorial
                  </span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-ios-subtext print:w-3 print:h-3"
                  />
                  <span className="text-sm print:text-[10px] print:text-black">
                    Mista
                  </span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-ios-subtext print:w-3 print:h-3"
                  />
                  <span className="text-sm print:text-[10px] print:text-black">
                    Condutiva
                  </span>
                </label>
              </div>
            </div>

            {/* Perda OE */}
            <div className="flex flex-col sm:flex-row sm:items-center ml-2 sm:ml-4 space-y-2 sm:space-y-0 sm:space-x-4 print:flex-row print:items-center print:space-y-0 print:space-x-4 print:ml-0">
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="text-ios-primary focus:ring-ios-primary rounded w-4 h-4 print:w-3 print:h-3"
                />
                <span className="text-sm font-medium w-6 print:text-[10px] print:text-black">
                  OE
                </span>
              </label>
              <div className="flex flex-wrap gap-4 pl-6 sm:pl-0 print:pl-0 print:gap-2">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-ios-subtext print:w-3 print:h-3"
                  />
                  <span className="text-sm print:text-[10px] print:text-black">
                    Neurossensorial
                  </span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-ios-subtext print:w-3 print:h-3"
                  />
                  <span className="text-sm print:text-[10px] print:text-black">
                    Mista
                  </span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded text-ios-subtext print:w-3 print:h-3"
                  />
                  <span className="text-sm print:text-[10px] print:text-black">
                    Condutiva
                  </span>
                </label>
              </div>
            </div>
          </div>

          {/* Observações */}
          <div className="flex flex-col pt-2 print:flex-row print:items-start print:gap-2">
            <label className="text-sm font-semibold text-ios-text mb-2 print:text-[10px] print:text-black print:mb-0 print:min-w-[40px] print:mt-1">
              Obs.:
            </label>
            <div className="flex-1 flex flex-col">
              <textarea
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                className="w-full min-h-[80px] p-3 bg-ios-bg border border-ios-divider rounded-ios-sm print:hidden focus:outline-none focus:border-ios-primary focus:ring-1 focus:ring-ios-primary/50 transition-all text-sm resize-y custom-scrollbar"
                placeholder="Observações adicionais..."
              />
              {/* Versão para impressão com duas linhas */}
              <div className="hidden print:flex flex-col w-full text-[10px] text-black">
                <div className="border-b border-gray-400 min-h-[1.2rem] py-0.5 px-1">
                  {observacoes}
                </div>
                <div className="border-b border-gray-400 min-h-[1.2rem]"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Seção 7: Assinaturas - Captura interativa em tela e exibição no laudo impresso */}
      <div className="print:block bg-white/60 backdrop-blur-sm rounded-ios shadow-sm border border-ios-divider p-8 mt-10 print:bg-transparent print:border-0 print:p-0 print:pt-20 print:mt-0 print:shadow-none print:break-inside-avoid">
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-12 mt-4 print:gap-12">
          {/* Assinatura do Funcionário/Colaborador (Interativa em tela) */}
          <div className="flex flex-col items-center">
            {employeeSignature ? (
              // Se o colaborador já tiver assinado, exibe a assinatura física na tela e na impressão
              <div className="relative flex flex-col items-center group">
                <img
                  src={employeeSignature}
                  alt="Assinatura do Colaborador"
                  // Altura calibrada para se enquadrar perfeitamente no espaço do laudo técnico
                  className="h-14 object-contain mb-1"
                />
                {/* Botão flutuante na tela para refazer a assinatura */}
                <button
                  type="button"
                  onClick={() => setIsSignatureModalOpen(true)}
                  className="absolute -top-3 -right-6 p-1 bg-white hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-full border border-gray-200 shadow-sm transition-all active:scale-90 print:hidden"
                  title="Refazer assinatura"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              // Caso não tenha assinatura capturada, exibe o ícone interativo de caneta para clique
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(true)}
                className="flex flex-col items-center group focus:outline-none transition-all active:scale-95 mb-1 print:hidden"
                title="Clique para assinar"
              >
                {/* Ícone PencilIcon interativo com transição premium ao passar o mouse */}
                <PencilIcon className="w-8 h-8 text-ios-subtext group-hover:text-ios-primary group-hover:scale-110 transition-all mb-2" />
                <span className="text-[10px] text-ios-primary font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                  CLIQUE PARA ASSINAR
                </span>
              </button>
            )}

            {/* Espaço reservado para visualização impressa em papel quando não assinado */}
            {!employeeSignature && (
              <div className="hidden print:block h-14 w-full"></div>
            )}

            {/* Linha horizontal delimitadora da assinatura */}
            <div className="w-full max-w-[250px] border-b border-ios-text mb-2 print:border-black"></div>
            <span className="text-sm text-ios-subtext print:text-[10px] print:text-black uppercase font-bold text-center">
              Assinatura do Funcionário(a)
            </span>
          </div>

          {/* Assinatura do Fonoaudiólogo(a) */}
          <div className="flex flex-col items-center">
            {/* Assinatura digitalizada padrão do profissional técnico */}
            <img
              src={sigImage}
              alt="Assinatura do Fonoaudiólogo"
              className="h-14 object-contain mb-1"
            />
            <div className="w-full max-w-[250px] border-b border-ios-text mb-2 print:border-black"></div>
            <span className="text-sm text-ios-subtext print:text-[10px] print:text-black uppercase font-bold text-center">
              Assinatura do Fonoaudiólogo(a)
            </span>
          </div>
        </div>
      </div>

      {/* Botão de salvar provisório */}
      <div className="flex justify-end pt-4 pb-8">
        <button
          onClick={() => window.print()}
          className="flex items-center px-6 py-3 bg-ios-primary hover:bg-ios-primary/90 text-white rounded-ios-btn font-semibold shadow-lg shadow-ios-primary/30 transition-all transform hover:scale-100 active:scale-95 print:hidden"
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Salvar Audiometria
        </button>
      </div>

      {/* Modal Premium de Assinatura do Funcionário */}
      {isSignatureModalOpen && (
        <div className="fixed -inset-6 z-[90]  h-full flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 print:hidden">
          {/* Caixa do Modal - Ocupa 80% do viewport e adiciona classe para forçar paisagem em retrato móvel */}
          <div className="mobile-force-landscape bg-white rounded-2xl shadow-2xl border border-slate-200 w-[90%] md:w-[80%] max-w-4xl h-[5vh] md:h-[75vh] flex flex-col overflow-hidden transition-all duration-300 transform scale-100">
            {/* Cabeçalho do Modal com gradiente suave */}
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <Signature className="w-6 h-6 text-ios-primary" />
                <h3 className="text-lg font-bold text-slate-800">
                  Assinatura do Funcionário(a)
                </h3>
              </div>
              <span className="text-xs text-slate-400 font-medium md:block hidden">
                Utilize o mouse ou tela sensível ao toque
              </span>
            </div>

            {/* Corpo do Modal - Área de desenho do canvas */}
            <div className="flex-1 bg-slate-50 p-6 flex flex-col justify-center items-center relative overflow-hidden">
              {/* Instrução rotacionada opaca para guiar o usuário em celulares */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-5">
                <span className="text-4xl font-bold tracking-widest text-slate-900 uppercase">
                  Assinatura Digital
                </span>
              </div>
              
              {/* Moldura do Canvas de Assinatura */}
              <div className="w-full h-full bg-white rounded-xl border-2 border-dashed border-slate-300 shadow-inner overflow-hidden relative">
                <canvas
                  ref={signatureCanvasRef}
                  // Dimensões nativas generosas para alta fidelidade geométrica
                  width={1000}
                  height={500}
                  onMouseDown={startSignatureDrawing}
                  onMouseMove={drawSignature}
                  onMouseUp={stopSignatureDrawing}
                  onMouseLeave={stopSignatureDrawing}
                  onTouchStart={startSignatureDrawing}
                  onTouchMove={drawSignature}
                  onTouchEnd={stopSignatureDrawing}
                  className="w-full h-full cursor-crosshair touch-none"
                />
              </div>
            </div>

            {/* Rodapé com botões de ação perfeitamente espaçados e expressivos */}
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
              {/* Botão de Cancelar/Fechar */}
              <button
                type="button"
                onClick={() => setIsSignatureModalOpen(false)}
                className="px-6 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 active:scale-95 transition-all text-sm font-semibold text-slate-600"
              >
                Cancelar
              </button>

              {/* Ações de limpar e salvar */}
              <div className="flex items-center space-x-3">
                {/* Limpar Canvas */}
                <button
                  type="button"
                  onClick={clearSignatureCanvas}
                  className="px-5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 active:scale-95 transition-all text-sm font-semibold flex items-center"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Limpar
                </button>
                {/* Salvar Assinatura */}
                <button
                  type="button"
                  onClick={saveSignature}
                  className="px-6 py-2.5 rounded-lg bg-ios-primary text-white hover:bg-ios-primary/95 shadow-md shadow-ios-primary/20 active:scale-95 transition-all text-sm font-semibold flex items-center"
                >
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirmar Assinatura
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Estilos adicionais injetados para forçar paisagem em telas móveis verticais */}
      <style>{`
        @media (max-width: 780px) and (orientation: portrait) {
          .mobile-force-landscape {
            transform: rotate(90deg) !important;
            transform-origin: center !important;
            width: 100vh !important;
            height: 100vw !important;
            position: fixed !important;
            left: 50% !important;
            top: 50% !important;
            margin-left: -50vh !important;
            margin-top: -200vw !important;
            z-index: 100 !important;
          }
        }
      `}</style>
    </div>
  );
}
