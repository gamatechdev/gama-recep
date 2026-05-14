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
} from "lucide-react";

// Importamos a imagem da grade audiométrica para usar como fundo do canvas
import gradeImage from "./ui/grade/image_audiometria.png";

// Componente principal para o formulário de Audiometria Ocupacional
export function Audiometria() {
  // Estado para controlar o modo de desenho na grade (livre ou bolinha)
  const [drawMode, setDrawMode] = useState<"livre" | "bolinha">("bolinha");
  // Estado para rastrear se o usuário está desenhando no modo livre
  const [isDrawing, setIsDrawing] = useState(false);

  // Referências para capturar os elementos canvas diretamente do DOM
  const canvasODRef = useRef<HTMLCanvasElement>(null);
  const canvasOERef = useRef<HTMLCanvasElement>(null);

  // Estado para o campo de observações
  const [observacoes, setObservacoes] = useState("");

  // Função disparada ao clicar no canvas para iniciar o desenho
  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement>,
    ear: "OD" | "OE",
  ) => {
    // Seleciona o canvas correto dependendo da orelha clicada
    const canvas = ear === "OD" ? canvasODRef.current : canvasOERef.current;
    if (!canvas) return;

    // Obtém as coordenadas do clique relativas ao canvas e ajusta a escala para precisão do cursor
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Define a cor: OD é sempre vermelho, OE é sempre azul
    const color = ear === "OD" ? "#ef4444" : "#3b82f6";
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (drawMode === "bolinha") {
      // Se for modo bolinha, desenha um pequeno círculo preenchido
      ctx.beginPath();
      ctx.arc(x, y, 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Se for modo livre, inicia o traçado a partir deste ponto
      setIsDrawing(true);
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  // Função disparada ao arrastar o mouse no canvas (modo livre)
  const draw = (e: React.MouseEvent<HTMLCanvasElement>, ear: "OD" | "OE") => {
    // Só desenha se estiver com o clique pressionado e no modo livre
    if (!isDrawing || drawMode !== "livre") return;

    const canvas = ear === "OD" ? canvasODRef.current : canvasOERef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Cria uma linha do ponto anterior até a nova coordenada
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  // Função para parar de desenhar quando soltar o clique ou sair do canvas
  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Função para apagar tudo dos dois canvases
  const clearCanvas = () => {
    const ctxOD = canvasODRef.current?.getContext("2d");
    const ctxOE = canvasOERef.current?.getContext("2d");

    // Limpa o canvas inteiro, mantendo apenas a imagem de fundo (que está no CSS)
    if (ctxOD && canvasODRef.current) {
      ctxOD.clearRect(
        0,
        0,
        canvasODRef.current.width,
        canvasODRef.current.height,
      );
    }
    if (ctxOE && canvasOERef.current) {
      ctxOE.clearRect(
        0,
        0,
        canvasOERef.current.width,
        canvasOERef.current.height,
      );
    }
  };

  // Retornamos a estrutura principal do componente com uma div que ocupa todo o espaço
  return (
    // Div principal com padding, fundo claro, permitindo scroll caso necessário
    <div className="w-full max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6 print:p-0 print:pt-[10px] print:m-0 print:space-y-1 print:max-w-none print:w-full">
      {/* Formal Print Header (Hidden on screen) */}
      <div className="hidden print:block text-center mb-4">
        <h1 className="text-xl font-bold uppercase border-b border-gray-400 pb-2 tracking-widest text-black">Protocolo de Audiometria Ocupacional</h1>
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
          <span className="print:text-xs print:font-bold uppercase">DADOS DO PACIENTE</span>
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
          <span className="print:text-xs print:font-bold uppercase">TIPO DE EXAME</span>
        </div>

        {/* Grid de checkboxes para facilitar seleção */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {/* Opção Admissional */}
          <label className="flex items-center space-x-2 cursor-pointer bg-ios-bg p-3 rounded-ios-sm border border-transparent hover:border-ios-secondary/30 transition-colors print:bg-transparent print:p-0 print:border-0 print:gap-1">
            <input
              type="checkbox"
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
              className="text-ios-secondary focus:ring-ios-secondary rounded accent-ios-secondary w-4 h-4"
            />
            <span className="text-sm font-medium text-ios-text">Periódico</span>
          </label>
          {/* Opção Demissional */}
          <label className="flex items-center space-x-2 cursor-pointer bg-ios-bg p-3 rounded-ios-sm border border-transparent hover:border-ios-secondary/30 transition-colors print:bg-transparent print:p-0 print:border-0 print:gap-1">
            <input
              type="checkbox"
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
          <span className="uppercase tracking-widest text-sm print:text-xs print:font-bold">MEATOSCOPIA</span>
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

        {/* Cabeçalho da Grade com a Barra de Ferramentas de Desenho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 border-b border-ios-divider pb-4 gap-4">
          <div className="flex items-center text-blue-600 font-semibold print:hidden">
            <Activity className="w-5 h-5 mr-2 print:hidden" />
            <span className="uppercase tracking-widest text-sm print:text-xs print:font-bold print:text-black">
              Audiometria Tonal
            </span>
          </div>

          {/* Barra de Ferramentas do Canvas */}
          <div className="flex flex-wrap items-center gap-2 bg-ios-bg p-1.5 rounded-lg border border-ios-divider print:hidden">
            <button
              onClick={() => setDrawMode("livre")}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${drawMode === "livre" ? "bg-ios-primary text-white shadow-sm" : "text-ios-subtext hover:bg-gray-200"}`}
            >
              <PenTool className="w-3.5 h-3.5 mr-1.5" />
              Desenho Livre
            </button>
            <button
              onClick={() => setDrawMode("bolinha")}
              className={`flex items-center px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${drawMode === "bolinha" ? "bg-ios-primary text-white shadow-sm" : "text-ios-subtext hover:bg-gray-200"}`}
            >
              <Circle className="w-3.5 h-3.5 mr-1.5" />
              Bolinha
            </button>
            <div className="w-px h-5 bg-gray-300 mx-1 hidden sm:block"></div>
            <button
              onClick={clearCanvas}
              className="flex items-center px-3 py-1.5 rounded-md text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 mr-1.5" />
              Limpar
            </button>
          </div>
        </div>

        {/* Container das grades lado a lado usando CSS Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-8 print:gap-4 justify-items-center">
          {/* Orelha Direita (Canvas Vermelho) */}
          <div className="flex flex-col items-center w-full max-w-[450px] print:max-w-[250px]">
            <h3 className="text-center font-bold text-red-500 mb-3 text-sm tracking-widest print:text-[10px] print:mb-1">
              ORELHA DIREITA (OD)
            </h3>
            <div className="relative border border-gray-300 shadow-sm overflow-hidden bg-white w-full rounded print:border-gray-300 print:border print:rounded-none print:shadow-none">
              <img src={gradeImage} alt="Grade Audiometria" className="absolute inset-0 w-full h-full object-fill pointer-events-none print:block" />
              {/* O canvas ocupa o mesmo espaço da imagem e fica transparente */}
              <canvas
                ref={canvasODRef}
                width={450}
                height={350}
                className="relative z-10 cursor-crosshair w-full h-auto touch-none"
                style={{ display: "block" }}
                onMouseDown={(e) => startDrawing(e, "OD")}
                onMouseMove={(e) => draw(e, "OD")}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-2 text-center w-full print:hidden">
              Cor do traço: Vermelho
            </p>
          </div>

          {/* Orelha Esquerda (Canvas Azul) */}
          <div className="flex flex-col items-center w-full max-w-[450px] print:max-w-[250px]">
            <h3 className="text-center font-bold text-blue-500 mb-3 text-sm tracking-widest print:text-[10px] print:mb-1">
              ORELHA ESQUERDA (OE)
            </h3>
            <div className="relative border border-gray-300 shadow-sm overflow-hidden bg-white w-full rounded print:border-gray-300 print:border print:rounded-none print:shadow-none">
              <img src={gradeImage} alt="Grade Audiometria" className="absolute inset-0 w-full h-full object-fill pointer-events-none print:block" />
              {/* O canvas ocupa o mesmo espaço da imagem e fica transparente */}
              <canvas
                ref={canvasOERef}
                width={450}
                height={350}
                className="relative z-10 cursor-crosshair w-full h-auto touch-none"
                style={{ display: "block" }}
                onMouseDown={(e) => startDrawing(e, "OE")}
                onMouseMove={(e) => draw(e, "OE")}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
              />
            </div>
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
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">Intensid.</div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">Monossil.</div>
                  <div className="py-1 flex items-center justify-center">Dissil.</div>
                </div>
                {/* Linha Palavras Faladas (Header secundário da imagem) */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider print:border-b print:border-t print:border-gray-400 text-center italic text-ios-subtext print:items-stretch">
                  <div className="py-1 font-semibold bg-ios-bg/30 print:bg-gray-100 print:text-black print:border-r print:border-gray-400 flex items-center justify-center">
                    Pal. Faladas
                  </div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">---</div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">25</div>
                  <div className="py-1 flex items-center justify-center">25</div>
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
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">Intensid.</div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">Monossil.</div>
                  <div className="py-1 flex items-center justify-center">Dissil.</div>
                </div>
                {/* Linha Palavras Faladas */}
                <div className="grid grid-cols-4 bg-white border-b border-t border-ios-divider print:border-b print:border-t print:border-gray-400 text-center italic text-ios-subtext print:items-stretch">
                  <div className="py-1 font-semibold bg-ios-bg/30 print:bg-gray-100 print:text-black print:border-r print:border-gray-400 flex items-center justify-center">
                    Pal. Faladas
                  </div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">---</div>
                  <div className="py-1 print:border-r print:border-gray-400 flex items-center justify-center">25</div>
                  <div className="py-1 flex items-center justify-center">25</div>
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
          <span className="uppercase tracking-widest text-sm print:text-xs print:font-bold">Laudo</span>
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
                <span className="text-sm print:text-[10px] print:text-black">OD</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="text-green-500 focus:ring-green-500 rounded w-4 h-4 print:w-3 print:h-3"
                />
                <span className="text-sm print:text-[10px] print:text-black">OE</span>
              </label>
              <label className="flex items-center space-x-1 cursor-pointer">
                <input
                  type="checkbox"
                  className="text-green-500 focus:ring-green-500 rounded w-4 h-4 print:w-3 print:h-3"
                />
                <span className="text-sm print:text-[10px] print:text-black">Bilateral</span>
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
                <span className="text-sm font-medium w-6 print:text-[10px] print:text-black">OD</span>
              </label>
              <div className="flex flex-wrap gap-4 pl-6 sm:pl-0 print:pl-0 print:gap-2">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="rounded text-ios-subtext print:w-3 print:h-3" />
                  <span className="text-sm print:text-[10px] print:text-black">Neurossensorial</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="rounded text-ios-subtext print:w-3 print:h-3" />
                  <span className="text-sm print:text-[10px] print:text-black">Mista</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="rounded text-ios-subtext print:w-3 print:h-3" />
                  <span className="text-sm print:text-[10px] print:text-black">Condutiva</span>
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
                <span className="text-sm font-medium w-6 print:text-[10px] print:text-black">OE</span>
              </label>
              <div className="flex flex-wrap gap-4 pl-6 sm:pl-0 print:pl-0 print:gap-2">
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="rounded text-ios-subtext print:w-3 print:h-3" />
                  <span className="text-sm print:text-[10px] print:text-black">Neurossensorial</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="rounded text-ios-subtext print:w-3 print:h-3" />
                  <span className="text-sm print:text-[10px] print:text-black">Mista</span>
                </label>
                <label className="flex items-center space-x-1 cursor-pointer">
                  <input type="checkbox" className="rounded text-ios-subtext print:w-3 print:h-3" />
                  <span className="text-sm print:text-[10px] print:text-black">Condutiva</span>
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

      {/* Seção 7: Assinaturas - Visível apenas no PDF */}
      <div className="hidden print:block bg-white/60 backdrop-blur-sm rounded-ios shadow-sm border border-ios-divider p-8 mt-8 print:bg-transparent print:border-0 print:p-0 print:pt-20 print:mt-0 print:shadow-none print:break-inside-avoid">
        <div className="grid  grid-cols-1 md:grid-cols-2 print:grid-cols-2 gap-12 mt-4 print:gap-12">
          <div className="flex flex-col items-center">
            <div className="w-full  max-w-[250px] border-b border-ios-text mb-2 print:border-black"></div>
            <span className="text-sm  text-ios-subtext print:text-[10px] print:text-black uppercase font-bold">Assinatura do Funcionário(a)</span>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-full max-w-[250px] border-b border-ios-text mb-2 print:border-black"></div>
            <span className="text-sm text-ios-subtext print:text-[10px] print:text-black uppercase font-bold">Assinatura do Fonoaudiólogo(a)</span>
          </div>
        </div>
      </div>

      {/* Botão de salvar provisório */}
      <div className="flex justify-end pt-4 pb-8">
        <button onClick={() => window.print()} className="flex items-center px-6 py-3 bg-ios-primary hover:bg-ios-primary/90 text-white rounded-ios-btn font-semibold shadow-lg shadow-ios-primary/30 transition-all transform hover:scale-105 active:scale-95 print:hidden">
          <CheckCircle2 className="w-5 h-5 mr-2" />
          Salvar Audiometria
        </button>
      </div>
    </div>
  );
}
