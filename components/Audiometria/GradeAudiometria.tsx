import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
// Importamos os ícones do lucide-react necessários para a barra de ferramentas
import { Activity, Circle, FileSignature, Eraser, Trash2 } from "lucide-react";
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

export interface Line {
  fromIndex?: number;
  toIndex?: number;
  x1?: number;
  y1?: number;
  x2?: number;
  y2?: number;
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

// Interface para referenciar os métodos expostos para o componente pai
export interface GradeAudiometriaRef {
  exportImages: () => Promise<{ imageOD: string; imageOE: string }>;
}

// Componente GradeAudiometria contendo toda a lógica de desenho tonal clínico
export const GradeAudiometria = forwardRef<GradeAudiometriaRef, GradeAudiometriaProps>(({ onStateChange }, ref) => {
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
  const [drawMode, setDrawMode] = useState<"bolinha" | "X" | "<" | ">" | "ligar" | "apagar">("bolinha");

  // Estado local para controlar se o usuário está com botão pressionado (arrastando)
  const [isDragging, setIsDragging] = useState(false);

  // Estado local para controlar a aba de orelha ativa em exibição ("OE" ou "OD")
  const [activeTab, setActiveTab] = useState<"OE" | "OD">("OE");

  // Referência do React para capturar e desenhar no canvas da Orelha Direita (OD)
  const canvasODRef = useRef<HTMLCanvasElement>(null);
  // Referência do React para capturar e desenhar no canvas da Orelha Esquerda (OE)
  const canvasOERef = useRef<HTMLCanvasElement>(null);

  // Expõe a função de exportar as imagens da grade mesclada (Fundo + Traços do usuário) em Base64
  useImperativeHandle(ref, () => ({
    exportImages: async () => {
      const getMergedDataURL = async (canvasRef: React.RefObject<HTMLCanvasElement>) => {
        return new Promise<string>((resolve) => {
          const offscreenCanvas = document.createElement('canvas');
          offscreenCanvas.width = 750;
          offscreenCanvas.height = 583;
          const ctx = offscreenCanvas.getContext('2d');
          if (!ctx) return resolve('');

          // Carrega a imagem de fundo
          const bgImg = new window.Image();
          // Importante não poluir o canvas para exportação
          bgImg.onload = () => {
            // Desenha o fundo primeiro
            ctx.drawImage(bgImg, 0, 0, 750, 583);
            // Desenha os traços interativos por cima
            if (canvasRef.current) {
              ctx.drawImage(canvasRef.current, 0, 0);
            }
            resolve(offscreenCanvas.toDataURL('image/png', 1.0));
          };
          bgImg.onerror = () => {
            // Se falhar o carregamento do fundo, retorna os traços com fundo transparente
            if (canvasRef.current) {
              ctx.drawImage(canvasRef.current, 0, 0);
            }
            resolve(offscreenCanvas.toDataURL('image/png', 1.0));
          };
          // Fonte da imagem base64 ou URL local contida no import
          bgImg.src = gradeImage;
        });
      };

      const imageOD = await getMergedDataURL(canvasODRef);
      const imageOE = await getMergedDataURL(canvasOERef);

      return { imageOD, imageOE };
    }
  }));

  // Função auxiliar para calcular distância de um ponto a um segmento de reta
  const pointLineDistance = (px: number, py: number, x1: number, y1: number, x2: number, y2: number) => {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;
    const dot = A * C + B * D;
    const len_sq = C * C + D * D;
    let param = -1;
    if (len_sq !== 0) {
      param = dot / len_sq;
    }
    let xx, yy;
    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }
    const dx = px - xx;
    const dy = py - yy;
    return Math.sqrt(dx * dx + dy * dy);
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
        let px1, py1, px2, py2;
        if (line.x1 !== undefined && line.y1 !== undefined && line.x2 !== undefined && line.y2 !== undefined) {
           px1 = line.x1; py1 = line.y1; px2 = line.x2; py2 = line.y2;
        } else if (line.fromIndex !== undefined && line.toIndex !== undefined) {
           const p1 = points[line.fromIndex];
           const p2 = points[line.toIndex];
           if (p1 && p2) {
             px1 = p1.x; py1 = p1.y; px2 = p2.x; py2 = p2.y;
           }
        }
        
        if (px1 !== undefined && py1 !== undefined && px2 !== undefined && py2 !== undefined) {
          drawLineBetween(ctx, { x: px1, y: py1, symbol: "bolinha" }, { x: px2, y: py2, symbol: "bolinha" }, color, ear === "OE");
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

  // Lógica da Ferramenta de Borracha (Apagar)
  const eraseAt = (x: number, y: number, ear: "OD" | "OE") => {
    const setPoints = ear === "OD" ? setPointsOD : setPointsOE;
    const setLines = ear === "OD" ? setLinesOD : setLinesOE;

    // 1. Tentar apagar pontos próximos (achando o mais próximo dentro de um raio de 15px)
    setPoints((prevPoints) => {
      let closestPointIndex = -1;
      let minPointDist = 15; // Threshold máximo de 15px

      prevPoints.forEach((p, idx) => {
        const dist = Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2);
        if (dist < minPointDist) {
          minPointDist = dist;
          closestPointIndex = idx;
        }
      });

      if (closestPointIndex !== -1) {
        // Se encontramos um ponto para apagar, NÃO apagamos as linhas,
        // mas convertemos todas as linhas baseadas em índice para coordenadas absolutas
        // pois a remoção deste ponto mudaria os índices do array.
        setLines((prevLines) => {
          return prevLines.map(l => {
            if (l.x1 !== undefined) return l; // Já é baseada em coordenada
            const p1 = prevPoints[l.fromIndex!];
            const p2 = prevPoints[l.toIndex!];
            if (!p1 || !p2) return l;
            return { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y };
          });
        });
        const newPoints = [...prevPoints];
        newPoints.splice(closestPointIndex, 1);
        return newPoints;
      }
      
      // 2. Se não apagou ponto, tentar apagar linha (achando a mais próxima dentro de 12px)
      setLines((prevLines) => {
        let closestLineIndex = -1;
        let minLineDist = 12; // Threshold máximo de 12px

        prevLines.forEach((l, idx) => {
          let px1, py1, px2, py2;
          if (l.x1 !== undefined && l.y1 !== undefined && l.x2 !== undefined && l.y2 !== undefined) {
             px1 = l.x1; py1 = l.y1; px2 = l.x2; py2 = l.y2;
          } else if (l.fromIndex !== undefined && l.toIndex !== undefined) {
             const p1 = prevPoints[l.fromIndex];
             const p2 = prevPoints[l.toIndex];
             if (!p1 || !p2) return;
             px1 = p1.x; py1 = p1.y; px2 = p2.x; py2 = p2.y;
          }

          if (px1 !== undefined && py1 !== undefined && px2 !== undefined && py2 !== undefined) {
            const dist = pointLineDistance(x, y, px1, py1, px2, py2);
            if (dist < minLineDist) {
              minLineDist = dist;
              closestLineIndex = idx;
            }
          }
        });
        
        if (closestLineIndex !== -1) {
          const newLines = [...prevLines];
          newLines.splice(closestLineIndex, 1);
          return newLines;
        }
        return prevLines;
      });
      
      return prevPoints;
    });
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>, canvas: HTMLCanvasElement) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const rawY = (e.clientY - rect.top) * scaleY;
    return { x, y: snapYToGrid(rawY), rawY };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>, ear: "OD" | "OE") => {
    if (drawMode === "apagar") {
      setIsDragging(true);
      const canvas = ear === "OD" ? canvasODRef.current : canvasOERef.current;
      if (!canvas) return;
      const { x, rawY } = getCanvasCoordinates(e, canvas);
      eraseAt(x, rawY, ear); // Para apagar não precisa do snap vertical
      return;
    }
    
    // Lógica normal de desenho
    const canvas = ear === "OD" ? canvasODRef.current : canvasOERef.current;
    if (!canvas) return;
    const { x, y } = getCanvasCoordinates(e, canvas);

    const points = ear === "OD" ? pointsOD : pointsOE;
    const setPoints = ear === "OD" ? setPointsOD : setPointsOE;
    const setLines = ear === "OD" ? setLinesOD : setLinesOE;

    if (drawMode === "ligar") {
      const clickedPointIndex = points.findIndex(
        (p) => Math.sqrt((p.x - x) ** 2 + (p.y - y) ** 2) <= 25
      );
      if (clickedPointIndex !== -1) {
        if (selectedPoint === null) {
          setSelectedPoint({ ear, index: clickedPointIndex });
        } else {
          if (selectedPoint.ear === ear && selectedPoint.index !== clickedPointIndex) {
            const p1 = points[selectedPoint.index];
            const p2 = points[clickedPointIndex];
            setLines((prev) => [
              ...prev,
              { x1: p1.x, y1: p1.y, x2: p2.x, y2: p2.y },
            ]);
          }
          setSelectedPoint(null);
        }
      } else {
        setSelectedPoint(null);
      }
    } else {
      const newPoint: Point = {
        x,
        y,
        symbol: drawMode as "bolinha" | "X" | "<" | ">",
      };
      setPoints((prev) => {
        const updated = [...prev, newPoint];
        if (autoConnect && prev.length > 0) {
          const lastPoint = prev[prev.length - 1];
          setLines((prevLines) => [
            ...prevLines,
            { x1: lastPoint.x, y1: lastPoint.y, x2: newPoint.x, y2: newPoint.y },
          ]);
        }
        return updated;
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>, ear: "OD" | "OE") => {
    if (!isDragging || drawMode !== "apagar") return;
    const canvas = ear === "OD" ? canvasODRef.current : canvasOERef.current;
    if (!canvas) return;
    const { x, rawY } = getCanvasCoordinates(e, canvas);
    eraseAt(x, rawY, ear);
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
  };

  // Limpa inteiramente todas as informações e traçados de ambas as orelhas
  const clearCanvas = () => {
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
        <div className="flex items-center text-blue-600 font-semibold">
          <Activity className="w-[26px] h-[26px] mr-3" />
          <span className="uppercase tracking-widest text-[18px] items-center flex">
            Audiometria Tonal
          </span>
        </div>
      </div>

      {/* Barra de Ferramentas principal do Canvas interativo com flexibilidade total */}
      <div className="flex flex-wrap items-center justify-center gap-[4px] p-[8px] rounded-lg border border-ios-divider w-full lg:w-auto mx-auto lg:mx-0">
        
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

        {/* Botão de ferramenta: Borracha (Apagar) */}
        <button
          onClick={() => setDrawMode("apagar")}
          className={`flex items-center justify-center w-[46px] h-[46px] rounded-md transition-all ${
            drawMode === "apagar"
              ? "bg-purple-500 text-white shadow-sm border border-purple-600"
              : "text-ios-subtext hover:bg-gray-200 border border-transparent"
          }`}
          title="Borracha"
        >
          <Eraser className="w-[20px] h-[20px]" />
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
      <div className="flex justify-center mb-6 mt-[10px]">
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
      <div className="flex flex-col items-center mt-6">
        
        {/* Orelha Direita (Canvas Vermelho) */}
        <div className={`flex flex-col items-center w-full max-w-[750px]  ${activeTab === "OD" ? "flex" : "hidden "}`}>
          <h3 className="text-center font-bold text-red-500 mb-3 text-sm tracking-widest">
            ORELHA DIREITA (OD)
          </h3>
          <div className="relative border border-gray-300 shadow-sm overflow-hidden bg-white w-full rounded">
            <img
              src={gradeImage}
              alt="Grade Audiometria"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
            <canvas
              ref={canvasODRef}
              width={750}
              height={583}
              className={`relative z-10 w-full h-auto touch-none`}
              style={{
                display: "block",
                cursor: drawMode === "apagar" 
                  ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21'/%3E%3Cpath d='M22 21H7'/%3E%3Cpath d='m5 11 9 9'/%3E%3C/svg%3E\") 0 24, auto"
                  : "crosshair"
              }}
              onMouseDown={(e) => handleMouseDown(e, "OD")}
              onMouseMove={(e) => handleMouseMove(e, "OD")}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center w-full">
            Cor do traço: Vermelho
          </p>
        </div>

        {/* Orelha Esquerda (Canvas Azul) */}
        <div className={`flex flex-col items-center w-full max-w-[750px]  ${activeTab === "OE" ? "flex" : "hidden "}`}>
          <h3 className="text-center font-bold text-blue-500 mb-3 text-sm tracking-widest">
            ORELHA ESQUERDA (OE)
          </h3>
          <div className="relative border border-gray-300 shadow-sm overflow-hidden bg-white w-full rounded">
            <img
              src={gradeImage}
              alt="Grade Audiometria"
              className="absolute inset-0 w-full h-full object-fill pointer-events-none"
            />
            <canvas
              ref={canvasOERef}
              width={750}
              height={583}
              className={`relative z-10 w-full h-auto touch-none`}
              style={{
                display: "block",
                cursor: drawMode === "apagar" 
                  ? "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24' fill='white' stroke='black' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21'/%3E%3Cpath d='M22 21H7'/%3E%3Cpath d='m5 11 9 9'/%3E%3C/svg%3E\") 0 24, auto"
                  : "crosshair"
              }}
              onMouseDown={(e) => handleMouseDown(e, "OE")}
              onMouseMove={(e) => handleMouseMove(e, "OE")}
              onMouseUp={handleMouseUpOrLeave}
              onMouseLeave={handleMouseUpOrLeave}
            />
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center w-full">
            Cor do traço: Azul
          </p>
        </div>
      </div>
    </>
  );
});
