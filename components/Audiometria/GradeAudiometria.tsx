import React, { useState, useRef, useEffect } from "react";
// Importamos os ícones do lucide-react necessários para a barra de ferramentas
import { Activity, Circle, FileSignature, Undo2, Trash2 } from "lucide-react";
// Importamos a imagem da grade audiométrica que servirá de fundo para os canvases
import gradeImage from "../ui/grade/image_audiometria.png";

// Interface para estruturar as coordenadas e o símbolo de cada ponto clínico
export interface Point {
  // Coordenada horizontal X lógica do ponto no canvas
  x: number;
  // Coordenada vertical Y lógica do ponto no canvas
  y: number;
  // Símbolo clínico associado ao ponto cadastrado
  symbol: "bolinha" | "X" | "<" | ">";
}

// Interface para estruturar uma conexão de reta sólida ou pontilhada entre dois pontos
export interface Line {
  // Índice do ponto de origem no array correspondente
  fromIndex: number;
  // Índice do ponto de destino no array correspondente
  toIndex: number;
}

// Interface de propriedades para enviar o estado da Grade ao pai
interface GradeAudiometriaProps {
  onStateChange?: (state: {
    pointsOD: Point[];
    pointsOE: Point[];
    linesOD: Line[];
    linesOE: Line[];
  }) => void;
}

// Componente GradeAudiometria contendo toda a lógica de desenho tonal clínico
export function GradeAudiometria({ onStateChange }: GradeAudiometriaProps) {
  // Estado local para gerenciar a coleção de pontos da Orelha Direita (OD)
  const [pointsOD, setPointsOD] = useState<Point[]>([]);
  // Estado local para gerenciar a coleção de pontos da Orelha Esquerda (OE)
  const [pointsOE, setPointsOE] = useState<Point[]>([]);

  // Estado local para gerenciar a coleção de conexões de retas da Orelha Direita (OD)
  const [linesOD, setLinesOD] = useState<Line[]>([]);
  // Estado local para gerenciar a coleção de conexões de retas da Orelha Esquerda (OE)
  const [linesOE, setLinesOE] = useState<Line[]>([]);

  // Estado local para ligar ou desligar a conexão automática ao colocar novos pontos
  const [autoConnect, setAutoConnect] = useState(true);

  // Estado local para rastrear qual ponto está selecionado ativamente para conexão manual (Ligar)
  const [selectedPoint, setSelectedPoint] = useState<{ ear: "OD" | "OE"; index: number } | null>(null);

  // Estado local para rastrear qual ferramenta ou modo de desenho está selecionado no momento
  const [drawMode, setDrawMode] = useState<"bolinha" | "X" | "<" | ">" | "ligar">("bolinha");

  // Estado local para controlar a aba de orelha ativa em exibição ("OE" ou "OD")
  const [activeTab, setActiveTab] = useState<"OE" | "OD">("OE");

  // Referência do React para capturar e desenhar no canvas da Orelha Direita (OD)
  const canvasODRef = useRef<HTMLCanvasElement>(null);
  // Referência do React para capturar e desenhar no canvas da Orelha Esquerda (OE)
  const canvasOERef = useRef<HTMLCanvasElement>(null);

  // Estado local que armazena a pilha do histórico para permitir a funcionalidade Desfazer (Undo)
  const [history, setHistory] = useState<{
    pointsOD: Point[];
    pointsOE: Point[];
    linesOD: Line[];
    linesOE: Line[];
  }[]>([]);

  // Função auxiliar para registrar um snapshot do estado atual na pilha do histórico antes de alterações
  const pushToHistory = () => {
    setHistory((prev) => [
      ...prev,
      {
        pointsOD: [...pointsOD],
        pointsOE: [...pointsOE],
        linesOD: [...linesOD],
        linesOE: [...linesOE],
      },
    ]);
  };

  // Função para reverter a última ação, restaurando o snapshot anterior
  const handleUndo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setPointsOD(lastState.pointsOD);
    setPointsOE(lastState.pointsOE);
    setLinesOD(lastState.linesOD);
    setLinesOE(lastState.linesOE);
    setHistory((prev) => prev.slice(0, -1));
    setSelectedPoint(null);
  };

  // Função para alternar a conexão automática, resetando o modo de ligação manual se ativada
  const handleToggleAutoConnect = () => {
    setAutoConnect((prev) => {
      const newValue = !prev;
      if (newValue && drawMode === "ligar") {
        setDrawMode("bolinha");
      }
      return newValue;
    });
  };

  // Função para alternar entre as abas e aplicar inteligência clínica na seleção da ferramenta padrão
  const selectTab = (tab: "OE" | "OD") => {
    setActiveTab(tab);
    if (tab === "OD") {
      if (drawMode === ">" || drawMode === "X") {
        setDrawMode("bolinha");
      }
    } else {
      if (tab === "OE") {
        if (drawMode === "<" || drawMode === "bolinha") {
          setDrawMode("X");
        }
      }
    }
  };

  // Lista de coordenadas Y exatas das 15 linhas horizontais da grade de decibéis (dB) (Resolução 750x583)
  const GRID_Y_LINES = [52, 88, 127, 163, 200, 237, 275, 312, 350, 387, 423, 460, 498, 535, 568];

  // Função para aproximar (snap) verticalmente o ponto clicado à linha horizontal ou ponto médio mais próximo
  const snapYToGrid = (clickedY: number): number => {
    const allowedY: number[] = [];
    GRID_Y_LINES.forEach((yVal) => {
      allowedY.push(yVal);
    });
    for (let i = 0; i < GRID_Y_LINES.length - 1; i++) {
      const mid = (GRID_Y_LINES[i] + GRID_Y_LINES[i + 1]) / 2;
      allowedY.push(Math.round(mid));
    }
    allowedY.sort((a, b) => a - b);
    let closestY = allowedY[0];
    let minDiff = Math.abs(clickedY - closestY);
    for (let j = 1; j < allowedY.length; j++) {
      const diff = Math.abs(clickedY - allowedY[j]);
      if (diff < minDiff) {
        minDiff = diff;
        closestY = allowedY[j];
      }
    }
    return closestY;
  };

  // Função auxiliar para desenhar um segmento de reta entre dois pontos lógicos
  const drawLineBetween = (
    ctx: CanvasRenderingContext2D,
    p1: Point,
    p2: Point,
    color: string,
    dashed?: boolean
  ) => {
    ctx.beginPath();
    ctx.lineWidth = 3;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    if (dashed) {
      ctx.setLineDash([8, 6]);
    } else {
      ctx.setLineDash([]);
    }
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.setLineDash([]);
  };

  // Função auxiliar para desenhar o símbolo clínico no canvas
  const drawSymbol = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    symbol: "bolinha" | "X" | "<" | ">",
    color: string
  ) => {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (symbol === "bolinha") {
      ctx.arc(x, y, 13, 0, Math.PI * 2);
      ctx.stroke();
    } else if (symbol === "X") {
      const size = 13;
      ctx.moveTo(x - size, y - size);
      ctx.lineTo(x + size, y + size);
      ctx.moveTo(x + size, y - size);
      ctx.lineTo(x - size, y + size);
      ctx.stroke();
    } else if (symbol === "<") {
      const size = 17;
      ctx.moveTo(x + size, y - size);
      ctx.lineTo(x - size, y);
      ctx.lineTo(x + size, y + size);
      ctx.stroke();
    } else if (symbol === ">") {
      const size = 17;
      ctx.moveTo(x - size, y - size);
      ctx.lineTo(x + size, y);
      ctx.lineTo(x - size, y + size);
      ctx.stroke();
    }
  };

  // Efeito colateral de desenho que limpa e redesenha todo o conteúdo gráfico sempre que o estado sofre alteração
  useEffect(() => {
    const renderCanvas = (ear: "OD" | "OE") => {
      const canvas = ear === "OD" ? canvasODRef.current : canvasOERef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      // Limpa os pixels anteriores, deixando a imagem de fundo do DOM intocada
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const points = ear === "OD" ? pointsOD : pointsOE;
      const lines = ear === "OD" ? linesOD : linesOE;
      const color = ear === "OD" ? "#ef4444" : "#3b82f6";

      // 1. Desenha primeiro as conexões de reta para que fiquem abaixo dos símbolos
      lines.forEach((line) => {
        const p1 = points[line.fromIndex];
        const p2 = points[line.toIndex];
        if (p1 && p2) {
          drawLineBetween(ctx, p1, p2, color, ear === "OE");
        }
      });

      // 2. Desenha os símbolos caligráficos correspondentes
      points.forEach((p, index) => {
        drawSymbol(ctx, p.x, p.y, p.symbol, color);

        // Desenha um anel de destaque ao redor do ponto se ele estiver selecionado para ligação manual
        if (selectedPoint && selectedPoint.ear === ear && selectedPoint.index === index) {
          ctx.beginPath();
          ctx.strokeStyle = color;
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
          ctx.arc(p.x, p.y, 27, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      });
    };

    renderCanvas("OD");
    renderCanvas("OE");
  }, [pointsOD, pointsOE, linesOD, linesOE, selectedPoint]);

  // Efeito colateral para informar o componente pai sempre que o estado da grade for atualizado
  useEffect(() => {
    if (onStateChange) {
      onStateChange({
        pointsOD,
        pointsOE,
        linesOD,
        linesOE,
      });
    }
  }, [pointsOD, pointsOE, linesOD, linesOE, onStateChange]);

  // Manipulador disparado ao clicar no canvas de desenho interativo
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>, ear: "OD" | "OE") => {
    const canvas = ear === "OD" ? canvasODRef.current : canvasOERef.current;
    if (!canvas) return;

    // Obtém o retângulo do elemento canvas na tela do navegador
    const rect = canvas.getBoundingClientRect();
    // Calcula fatores de proporção para alinhar cliques com o tamanho lógico do canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Converte a posição do cursor em coordenadas lógicas internas
    const x = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;
    // Realiza o snap vertical
    const y = snapYToGrid(rawY);

    const points = ear === "OD" ? pointsOD : pointsOE;
    const setPoints = ear === "OD" ? setPointsOD : setPointsOE;
    const setLines = ear === "OD" ? setLinesOD : setLinesOE;

    // Fluxo para o modo de conexão manual (Ligar)
    if (drawMode === "ligar") {
      // Encontra se o clique ocorreu sobre um ponto existente (colisão de até 25px)
      const clickedPointIndex = points.findIndex(
        (p) => Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) <= 25
      );

      if (clickedPointIndex !== -1) {
        if (selectedPoint === null) {
          // Salva o ponto de partida
          setSelectedPoint({ ear, index: clickedPointIndex });
        } else {
          if (selectedPoint.ear === ear) {
            if (selectedPoint.index !== clickedPointIndex) {
              // Registra snapshot no histórico antes de conectar
              pushToHistory();
              // Registra a nova conexão de linha
              setLines((prev) => [
                ...prev,
                { fromIndex: selectedPoint.index, toIndex: clickedPointIndex },
              ]);
            }
          }
          // Reseta a seleção ativa
          setSelectedPoint(null);
        }
      } else {
        setSelectedPoint(null);
      }
    } else {
      // Inserção padrão de novos símbolos clínicos
      pushToHistory();
      const newPoint: Point = {
        x,
        y,
        symbol: drawMode as "bolinha" | "X" | "<" | ">",
      };

      setPoints((prev) => {
        const updated = [...prev, newPoint];
        // Aplica conexão automática com o ponto imediatamente anterior se ativada
        if (autoConnect && prev.length > 0) {
          const fromIndex = prev.length - 1;
          const toIndex = updated.length - 1;
          setLines((prevLines) => [
            ...prevLines,
            { fromIndex, toIndex },
          ]);
        }
        return updated;
      });
    }
  };

  // Limpa inteiramente todas as informações e traçados de ambas as orelhas
  const clearCanvas = () => {
    pushToHistory();
    setPointsOD([]);
    setPointsOE([]);
    setLinesOD([]);
    setLinesOE([]);
    setSelectedPoint(null);
  };

  return (
    <>
      {/* Cabeçalho da Grade contendo o título e a barra de ferramentas de desenho */}
      <div className="flex flex-col items-center mb-4 gap-5">
        <div className="flex items-center text-blue-600 font-semibold print:hidden">
          <Activity className="w-[26px] h-[26px] mr-3 print:hidden" />
          <span className="uppercase tracking-widest text-[18px] print:text-xs items-center flex print:font-bold print:text-black">
            Audiometria Tonal
          </span>
        </div>
      </div>

      {/* Barra de Ferramentas principal do Canvas interativo com flexibilidade total */}
      <div className="flex flex-wrap items-center justify-center gap-[4px] p-[8px] rounded-lg border border-ios-divider print:hidden w-full lg:w-auto mx-auto lg:mx-0">
        
        {/* Toggle Switch para Conexão Automática */}
        <div className="flex items-center h-[46px] space-x-3.5 px-2 select-none">
          <span className="text-[16px] font-semibold text-ios-text">Conectar Auto</span>
          <button
            onClick={handleToggleAutoConnect}
            className={`relative inline-flex items-center h-[28px] w-[50px] shrink-0 cursor-pointer rounded-full p-[3px] transition-colors duration-200 ease-in-out focus:outline-none ${autoConnect ? "bg-ios-primary" : "bg-gray-300"}`}
          >
            <span
              className={`pointer-events-none inline-block h-[22px] w-[22px] transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${autoConnect ? "translate-x-[22px]" : "translate-x-0"}`}
            />
          </button>
        </div>

        {/* Botão "Ligar" renderizado condicionalmente quando auto-conexão está desligada */}
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

        {/* Botão de ferramenta: Bolinha vazada */}
        <button
          onClick={() => setDrawMode("bolinha")}
          className={`flex items-center justify-center w-[46px] h-[46px] rounded-md text-sm font-semibold transition-all ${drawMode === "bolinha" ? "bg-ios-primary text-white shadow-sm" : "text-ios-subtext hover:bg-gray-200"}`}
        >
          <Circle className="w-[22px] h-[22px]" />
        </button>

        {/* Botão de ferramenta: Símbolo X */}
        <button
          onClick={() => setDrawMode("X")}
          className={`flex items-center justify-center w-[46px] h-[46px] rounded-md text-sm font-semibold transition-all ${drawMode === "X" ? "bg-ios-primary text-white shadow-sm" : "text-ios-subtext hover:bg-gray-200"}`}
        >
          <span className="flex items-center justify-center w-full h-full font-bold text-[20px] select-none text-center leading-none">X</span>
        </button>

        {/* Divisor vertical discreto */}
        <div className="w-px h-[30px] bg-gray-300 mx-1.5 hidden sm:block"></div>

        {/* Botão de ferramenta menor que (<) para a Orelha Direita (OD) */}
        {activeTab === "OD" && (
          <button
            onClick={() => setDrawMode("<")}
            className={`flex items-center justify-center w-[46px] h-[46px] rounded-md text-sm font-semibold transition-all ${drawMode === "<" ? "bg-red-500 text-white shadow-sm" : "text-red-500 hover:bg-gray-200"}`}
          >
            <span className="flex items-center justify-center w-full h-full font-bold text-[32px] select-none text-center leading-none">&lt;</span>
          </button>
        )}

        {/* Botão de ferramenta maior que (>) para a Orelha Esquerda (OE) */}
        {activeTab === "OE" && (
          <button
            onClick={() => setDrawMode(">")}
            className={`flex items-center justify-center w-[46px] h-[46px] rounded-md text-sm font-semibold transition-all ${drawMode === ">" ? "bg-blue-500 text-white shadow-sm" : "text-blue-500 hover:bg-gray-200"}`}
          >
            <span className="flex items-center justify-center w-full h-full font-bold text-[32px] select-none text-center leading-none">&gt;</span>
          </button>
        )}

        {/* Divisor vertical discreto */}
        <div className="w-px h-[30px] bg-gray-300 mx-1.5 hidden sm:block"></div>

        {/* Botão Desfazer (Undo) */}
        <button
          disabled={history.length === 0}
          onClick={handleUndo}
          className={`flex items-center justify-center w-[46px] h-[46px] rounded-md transition-all ${
            history.length === 0
              ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50 border border-ios-divider"
              : "bg-amber-50 text-amber-700 hover:bg-amber-100 active:scale-95 shadow-sm border border-amber-200"
          }`}
        >
          <Undo2 className="w-[20px] h-[20px]" />
        </button>

        {/* Botão de Limpeza Completa */}
        <button
          onClick={clearCanvas}
          className="flex items-center justify-center w-[46px] h-[46px] rounded-md bg-red-50 text-red-600 hover:bg-red-100 active:scale-95 transition-all border border-red-200"
        >
          <Trash2 className="w-[20px] h-[20px]" />
        </button>
      </div>

      {/* Sistema de Abas Premium iOS Segmented Control */}
      <div className="flex justify-center mb-6 mt-[10px] print:hidden">
        <div className="inline-flex p-1 rounded-full border border-gray-200 shadow-inner bg-gray-100/80">
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

      {/* Exibição dos Canvas das grades: alternado na tela e lado a lado na visualização impressa */}
      <div className="flex flex-col items-center mt-6 print:grid print:grid-cols-2 print:gap-4 print:justify-items-center print:mt-4">
        
        {/* Orelha Direita (Canvas Vermelho) */}
        <div className={`flex flex-col items-center w-full max-w-[750px] print:max-w-[288px] ${activeTab === "OD" ? "flex" : "hidden print:flex"}`}>
          <h3 className="text-center font-bold text-red-500 mb-3 text-sm tracking-widest print:text-[10px] print:mb-1">
            ORELHA DIREITA (OD)
          </h3>
          <div className="relative border border-gray-300 shadow-sm overflow-hidden bg-white w-full rounded print:border-gray-300 print:border print:rounded-none print:shadow-none">
            <img
              src={gradeImage}
              alt="Grade Audiometria"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none print:block"
            />
            <canvas
              ref={canvasODRef}
              width={750}
              height={583}
              className="relative z-10 cursor-crosshair w-full h-auto touch-none"
              style={{ display: "block" }}
              onMouseDown={(e) => startDrawing(e, "OD")}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center w-full print:hidden">
            Cor do traço: Vermelho
          </p>
        </div>

        {/* Orelha Esquerda (Canvas Azul) */}
        <div className={`flex flex-col items-center w-full max-w-[750px] print:max-w-[288px] ${activeTab === "OE" ? "flex" : "hidden print:flex"}`}>
          <h3 className="text-center font-bold text-blue-500 mb-3 text-sm tracking-widest print:text-[10px] print:mb-1">
            ORELHA ESQUERDA (OE)
          </h3>
          <div className="relative border border-gray-300 shadow-sm overflow-hidden bg-white w-full rounded print:border-gray-300 print:border print:rounded-none print:shadow-none">
            <img
              src={gradeImage}
              alt="Grade Audiometria"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none print:block"
            />
            <canvas
              ref={canvasOERef}
              width={750}
              height={583}
              className="relative z-10 cursor-crosshair w-full h-auto touch-none"
              style={{ display: "block" }}
              onMouseDown={(e) => startDrawing(e, "OE")}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center w-full print:hidden">
            Cor do traço: Azul
          </p>
        </div>
      </div>
    </>
  );
}
