import React, { useRef, useState } from "react";
// Importamos os ícones necessários do lucide-react para enriquecer a experiência visual
import { Signature, Trash2, CheckCircle2 } from "lucide-react";

// Definição das propriedades que o SignatureScreen aceita para controle do modal
interface SignatureScreenProps {
  // Flag booleana que controla se o modal está visível na tela
  isOpen: boolean;
  // Função callback disparada ao fechar ou cancelar o modal
  onClose: () => void;
  // Função callback que recebe a string Base64 da assinatura capturada
  onSave: (signatureDataUrl: string) => void;
}

// Componente SignatureScreen para captura de assinatura digital caligráfica responsiva
export function SignatureScreen({ isOpen, onClose, onSave }: SignatureScreenProps) {
  // Referência do React para manipular diretamente o elemento <canvas> do DOM
  const signatureCanvasRef = useRef<HTMLCanvasElement>(null);
  // Estado local para rastrear se o usuário está ativamente arrastando o dedo ou mouse (desenhando)
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);

  // Manipulador disparado quando o mouse é pressionado ou o dedo encosta no canvas
  const startSignatureDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    // Evita comportamentos de rolagem ou arrasto nativos de páginas móveis
    e.preventDefault();
    // Obtém o elemento canvas da referência
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    // Obtém o contexto gráfico bidimensional do canvas
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Sinaliza que o traçado foi iniciado
    setIsDrawingSignature(true);

    // Obtém a posição e o retângulo do canvas na janela visual do navegador
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    // Extrai as coordenadas dependendo do tipo de dispositivo (Touch vs Mouse)
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calcula os fatores de proporção para mapear pixels do CSS aos pixels lógicos do canvas
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Mapeia a coordenada do clique/toque exatamente sob a ponta do cursor/dedo
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Inicia um novo demarcador de caminho vetorial no canvas 2D
    ctx.beginPath();
    // Ajusta a espessura da caneta digital para 3 pixels para excelente visualização
    ctx.lineWidth = 3;
    // Define a cor de escrita como ardósia escura premium
    ctx.strokeStyle = "#1e293b";
    // Aplica pontas arredondadas nos traçados caligráficos
    ctx.lineCap = "round";
    // Aplica junções suaves nas curvas geométricas da caligrafia
    ctx.lineJoin = "round";
    // Move a ponta lógica do pincel para o ponto exato inicial
    ctx.moveTo(x, y);
  };

  // Manipulador disparado continuamente enquanto o usuário arrasta o dedo ou mouse
  const drawSignature = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    // Se a flag de desenho ativo for falsa, ignora o movimento
    if (!isDrawingSignature) return;
    // Impede rolagens da tela em celulares durante a caligrafia
    e.preventDefault();

    // Obtém o canvas da referência
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    // Obtém o contexto de desenho 2D
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Obtém o retângulo delimitador na janela visual do navegador
    const rect = canvas.getBoundingClientRect();
    let clientX: number;
    let clientY: number;

    // Discrimina coordenadas de toque móvel ou mouse convencional
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Calcula fatores de mapeamento geométrico proporcional
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Ajusta as coordenadas X e Y em tempo real para precisão absoluta
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    // Adiciona o novo segmento de reta até a posição atualizada
    ctx.lineTo(x, y);
    // Desenha na tela o segmento acumulado
    ctx.stroke();
  };

  // Finaliza a caligrafia ativa quando o clique/toque é liberado
  const stopSignatureDrawing = () => {
    // Reseta a flag de desenho ativo para falso
    setIsDrawingSignature(false);
  };

  // Apaga totalmente todos os traçados desenhados no canvas para reiniciar a escrita
  const clearSignatureCanvas = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Limpa a área total do retângulo
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Exporta a assinatura caligráfica em Base64 PNG e dispara o callback de persistência
  const saveSignature = () => {
    const canvas = signatureCanvasRef.current;
    if (!canvas) return;
    // Converte os pixels lógicos para Data URL de imagem PNG compactada
    const dataUrl = canvas.toDataURL("image/png");
    // Aciona o callback informando os dados da assinatura
    onSave(dataUrl);
  };

  // Se o modal estiver fechado, não renderiza absolutamente nada no DOM
  if (!isOpen) return null;

  return (
    // Backdrop escurecido desfocado ocupando a totalidade da tela visível
    <div className="fixed -inset-6 z-[90] h-full flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-0 print:hidden">
      {/* Contêiner da caixa do modal responsiva com classe de rotação forçada em celular */}
      <div className="mobile-force-landscape bg-white rounded-2xl shadow-2xl border border-slate-200 w-[90%] md:w-[80%] max-w-4xl h-[85vh] md:h-[75vh] flex flex-col overflow-hidden transition-all duration-300 transform scale-100">
        
        {/* Cabeçalho do modal com título descritivo e ícones premium */}
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

        {/* Corpo do modal - Moldura cinza claro que abriga a lousa de escrita digital */}
        <div className="flex-1 bg-slate-50 p-6 flex flex-col justify-center items-center relative overflow-hidden">
          {/* Fundo de marca d'água opaca elegante indicando o propósito da lousa */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none opacity-[0.03]">
            <span className="text-4xl font-bold tracking-widest text-slate-900 uppercase">
              Assinatura Digital
            </span>
          </div>
          
          {/* Quadro branco de escrita caligráfica delimitado por bordas pontilhadas */}
          <div className="w-full h-full bg-white rounded-xl border-2 border-dashed border-slate-300 shadow-inner overflow-hidden relative">
            <canvas
              ref={signatureCanvasRef}
              // Largura e altura internas de alta resolução lógica
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

        {/* Rodapé do modal emparelhado com ações de cancelamento, limpeza e confirmação */}
        <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex items-center justify-between shrink-0">
          {/* Botão para fechar e cancelar o modal sem salvar */}
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg border border-slate-300 hover:bg-slate-100 active:scale-95 transition-all text-sm font-semibold text-slate-600"
          >
            Cancelar
          </button>

          {/* Grupo de botões de ação do canvas */}
          <div className="flex items-center space-x-3">
            {/* Botão com ícone para limpar o canvas e refazer a escrita */}
            <button
              type="button"
              onClick={clearSignatureCanvas}
              className="px-5 py-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 active:scale-95 transition-all text-sm font-semibold flex items-center"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Limpar
            </button>
            
            {/* Botão de confirmação para salvar os traços finais e exportar */}
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

      {/* Tags de estilos acopladas para forçar paisagem em retrato móvel */}
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
