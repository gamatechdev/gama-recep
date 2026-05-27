// Importa o React, biblioteca principal para criação de componentes
import React from 'react';
// Importa as tags essenciais da biblioteca @react-pdf/renderer que transformam JSX em um documento PDF real
import { Document, Page, Text, View, StyleSheet, Image, Svg, Line, Circle, Path } from '@react-pdf/renderer';
// Importa a imagem estática da assinatura do fonoaudiólogo a partir do diretório local
import sigImage from '../ui/grade/sig.png';
// Importa a imagem do logotipo oficial da clínica para exibir no cabeçalho do PDF
import gamaIcon from '../ui/grade/gamaicon.png';
// Importa a imagem de fundo oficial do gráfico da audiometria
import audiometriaBg from '../ui/grade/image_audiometria.png';

// ---- Paleta de Cores ----
// Define a cor de destaque (AZUL) usada nas marcações "X" e respostas ativas das condicionais
const AZUL = '#080808ff';   // Azul Gama Center para valores marcados
// Define a cor preta absoluta para textos base e títulos
const PRETO = '#000000';
// Define uma cor cinza médio para elementos menos importantes como bordas e descrições
const CINZA = '#9b9898ff';
// Define a cor das bordas das caixas e divisórias do layout
const BORDA = '#cccccc';

// Define os tipos das propriedades (Props) que o template PDF vai receber da tela pai
export interface AudiometriaPDFProps {
  // Guarda os dados de identificação do paciente (nome, empresa, etc)
  patientData: any;
  // Guarda o estado exato das respostas do formulário de anamnese (usado para desenhar os (X))
  anamneseAnswers: Record<string, string>;
  // Guarda as marcações feitas no gráfico do audiômetro
  audiometroData: any;
  // Guarda os valores da tabela de logoaudiometria
  logoAudiometriaData: any;
  // Guarda o parecer final (limiares e perdas auditivas)
  laudoData: any;
  // Guarda os vetores gerados pelo componente da grade para desenhar as linhas no SVG do PDF
  gradeData: any;
  // Guarda o texto livre da caixa de observações
  observacoes: string;
  // Guarda a resposta para o exame de meatoscopia da orelha direita
  meatoscopiaOD: string;
  // Guarda a resposta para o exame de meatoscopia da orelha esquerda
  meatoscopiaOE: string;
  // Guarda a string base64 da assinatura desenhada pelo paciente no tablet/tela
  employeeSignature?: string | null;
  // Guarda o tipo do exame selecionado (Admissional, Demissional, etc)
  tipoExame: string;
  // Guarda as informações marcadas na página 3 (Termo de reconhecimento)
  termoData: any;
  // Imagem mesclada em base64 da grade OD
  gradeImageOD?: string;
  // Imagem mesclada em base64 da grade OE
  gradeImageOE?: string;
}

// ---- Estilos globais (Baseado em Flexbox do React Native) ----
// Cria a folha de estilos que o react-pdf utiliza para diagramar os elementos sem usar HTML/CSS padrão
const S = StyleSheet.create({
  // Estilo principal da página, organiza de cima para baixo com cor branca, margens físicas de 40px e tamanho de fonte de 10px
  page: { flexDirection: 'column', backgroundColor: '#ffffff', paddingTop: 40, paddingBottom: 40, paddingLeft: 40, paddingRight: 40, fontSize: 10 },

  // --- Novos estilos de grade e tabela unificada ---
  // Moldura externa da página que engloba todo o conteúdo
  containerPagina: { borderWidth: 1, borderColor: '#000000', flex: 1, flexDirection: 'column' },
  // Faixa de título com fundo cinza e borda inferior preta
  secaoTituloFundo: { backgroundColor: '#f2f2f2', borderBottomWidth: 1, borderBottomColor: '#000000', paddingVertical: 4, paddingHorizontal: 8, alignItems: 'center', justifyContent: 'center' },
  // Texto do título da faixa cinza centralizado e negrito
  secaoTituloTexto: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', color: '#000000', textAlign: 'center' },
  // Linha de tabela da grade com borda inferior
  gradeLinha: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#000000' },
  // Seção de conteúdo com preenchimento e borda inferior
  gradeSecaoConteudo: { padding: 8, borderBottomWidth: 1, borderBottomColor: '#000000' },

  // --- Cabeçalho ---
  // Estilo da barra do cabeçalho que fica no topo de toda página (disposição horizontal)
  // Configura o cabeçalho como uma linha flexível, alinha os itens no centro verticalmente, define borda inferior de 1px preta, preenchimento interno de 8px e sem margem inferior para colar na seção seguinte
  cabecalho: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#000000', padding: 8 },
  // Container de texto do cabeçalho, ocupa o restante do espaço (flex: 1) e alinha os textos à direita
  cabecalhoTextos: { flex: 1, alignItems: 'flex-end' },
  // Título da clínica em negrito e sublinhado
  cabecalhoTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center' },
  // Linhas de endereço e contato com tamanho de fonte menor e cor suave
  cabecalhoLinha: { fontSize: 7, color: '#444', marginTop: 1, textAlign: 'center' },

  // --- Títulos e Caixas ---
  // Título de destaque de cada página (ex: "ANAMNESE OCUPACIONAL")
  tituloPagina: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 10, letterSpacing: 0.8 },
  // Caixa delimitadora genérica para agrupar as seções, criando as bordas finas envolta
  caixa: { borderWidth: 1, borderColor: BORDA, padding: 7, marginBottom: 10 },
  // Título interno da caixa (ex: "DADOS DO PACIENTE")
  // Define o tamanho da fonte em 8.5px, estilo negrito, margem inferior de 10px, texto em caixa alta, borda inferior de 0.5px preta, preenchimento inferior de 6px e alinhamento centralizado
  caixaTitulo: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 10, textTransform: 'uppercase', borderBottomWidth: 0.5, borderBottomColor: PRETO, paddingBottom: 6, textAlign: 'center' },

  // --- Linhas e Campos ---
  // Um container genérico que deixa os elementos lado a lado (horizontal)
  linha: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  // Texto descritivo de um campo (Label) como "EMPRESA:"
  campoLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginRight: 4, textTransform: 'uppercase', color: PRETO },
  // Texto do valor preenchido de um campo, com a linha sublinhada (borderBottom) e ocupando o espaço restante (flex: 1)
  campoValor: { fontSize: 8, flex: 1, borderBottomWidth: 1, borderBottomColor: '#cccccc', paddingBottom: 1, paddingRight: 2, marginRight: 2, color: PRETO },

  // --- Fontes ampliadas específicas para a Anamnese (Página 1) ---
  // Pergunta principal da anamnese em negrito e tamanho 10px
  anamneseLabel: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: PRETO, marginRight: 4 },
  // Pergunta adicional/condicional em tamanho 9.5px
  anamneseSubLabel: { fontSize: 9.5, color: '#444', marginRight: 4 },
  // Texto em destaque azul com tamanho 10px
  anamneseValorDestaque: { fontSize: 10, fontFamily: 'Helvetica-Bold', color: AZUL },
  // Opção desmarcada na cor preta com tamanho 10px
  anamneseOpcaoTexto: { fontSize: 10, color: PRETO },
  // Opção marcada na cor azul com tamanho 10px e negrito
  anamneseOpcaoTextoChecked: { fontSize: 10, color: AZUL, fontFamily: 'Helvetica-Bold' },
  // Marca desmarcada "( )" com tamanho 10px
  anamneseOpcaoMarca: { fontSize: 10, color: PRETO, marginRight: 2 },
  // Marca marcada "(X)" com tamanho 10px e negrito
  anamneseOpcaoMarcaChecked: { fontSize: 10, color: AZUL, fontFamily: 'Helvetica-Bold', marginRight: 2 },
  // Bloco de pergunta na anamnese, garantindo padding-bottom de 4px para separação entre elas
  blocoPergunta: { paddingBottom: 4 },

  // --- Questionário da Anamnese Padrão (Usado nas demais páginas) ---
  // Texto negrito para as perguntas principais
  qLabel: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: PRETO, marginRight: 4 },
  // Texto menor e recuado para as condicionais (ex: "Se alterado, em qual ouvido?")
  subLabel: { fontSize: 8, color: '#444', marginRight: 4 },
  // Valor digitado livremente nas condicionais (texto em azul)
  valorDestaque: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: AZUL },

  // Container para desenhar as opções com cruz "(X) Sim" ou vazio "( ) Não"
  opcaoView: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  // O formato da marca "X" e "(" ")" se a opção estiver MARCADA (Fica azul e negrito)
  opcaoMarcaChecked: { fontSize: 8.5, color: AZUL, fontFamily: 'Helvetica-Bold', marginRight: 2 },
  // O formato da marca "X" e "(" ")" se a opção estiver DESMARCADA (Fica preto normal)
  opcaoMarcaEmpty: { fontSize: 8.5, color: PRETO, marginRight: 2 },
  // O texto acompanhante se marcado
  opcaoTextoChecked: { fontSize: 8.5, color: AZUL, fontFamily: 'Helvetica-Bold' },
  // O texto acompanhante se desmarcado
  opcaoTextoEmpty: { fontSize: 8.5, color: PRETO },

  // Uma linha contendo a pergunta da anamnese, para não quebrar a organização
  qLinha: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  // Um grupo de checkboxes que vão se posicionar em linha
  qChecks: { flexDirection: 'row', alignItems: 'center' },
  // Margem à esquerda usada para deslocar e evidenciar que a pergunta é filha de uma opção condicional (recuo visual)
  recuo: { marginLeft: 18, marginBottom: 3 },

  // --- Tabelas Auxiliares ---
  // Estrutura raiz da tabela usada na LogoAudiometria
  table: { width: '100%', borderWidth: 1, borderColor: BORDA, marginBottom: 8 },
  // Container que representa uma linha na tabela
  // Organiza os itens da linha da tabela horizontalmente (flex row), define uma borda inferior de 1px na cor cinza claro (BORDA), e adiciona um espaçamento à direita de 2px
  tableRowView: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDA, paddingRight: 2 },
  // Cabeçalho de uma coluna, com borda na direita
  tableColHeader: { flex: 1, borderRightWidth: 1, borderRightColor: BORDA, padding: 3, alignItems: 'center' },
  // Corpo de dados da coluna
  tableColData: { flex: 1, borderRightWidth: 1, borderRightColor: BORDA, padding: 3, alignItems: 'center' },
  // Fonte para texto dentro do cabeçalho da tabela
  tableHeaderText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  // Fonte para valores da tabela
  tableCellText: { fontSize: 7.5, textAlign: 'center' },

  // --- Gráfico SVG ---
  // Container delimitador para proteger o desenho SVG (os quadrados do gráfico) sem borda cinza externa
  gradeContainer: { width: '100%', height: 195, position: 'relative', borderWidth: 0 },
  // Oculta o fundo deixando apenas as linhas visíveis do SVG, dimensionado a 100% da caixa
  gradeSvg: { width: '100%', height: '100%', position: 'absolute' },
});

// ============================
// Componente: Checkbox Opção (Customizado)
// Explicação: Este componente encapsula a lógica visual para desenhar marcadores de múltipla escolha ou checkboxes.
// Se a propriedade 'marcado' vier true, ele printa "(X) Label" na cor AZUL. Se não, printa "( ) Label" na cor PRETA.
// Isso garante compatibilidade perfeita com o renderizador de texto do PDF sem precisar usar SVG ou imagens.
// ============================
const Opcao = ({ marcado, texto }: { marcado: boolean; texto: string }) => (
  // Agrupa os símbolos "()" e o texto na mesma linha horizontal
  <View style={S.opcaoView}>
    {/* Renderiza a marca com base na condicional 'marcado' verificada ternariamente */}
    <Text style={marcado ? S.opcaoMarcaChecked : S.opcaoMarcaEmpty}>
      {marcado ? '(X)' : '( )'}
    </Text>
    {/* Renderiza o texto associado com a mesma lógica ternária de cor */}
    <Text style={marcado ? S.opcaoTextoChecked : S.opcaoTextoEmpty}>{texto}</Text>
  </View>
);

// ============================
// Componente: Checkbox Opção Anamnese (Customizado e Ampliado)
// Explicação: Este componente é idêntico ao Opcao original, porém utiliza
// as fontes ampliadas da Anamnese (Página 1) para proporcionar melhor legibilidade.
// ============================
const OpcaoAnamnese = ({ marcado, texto }: { marcado: boolean; texto: string }) => (
  // Agrupa os símbolos "()" e o texto na mesma linha horizontal
  <View style={S.opcaoView}>
    {/* Renderiza a marca do checkbox com base na condicional 'marcado' usando fontes de 10px */}
    <Text style={marcado ? S.anamneseOpcaoMarcaChecked : S.anamneseOpcaoMarca}>
      {marcado ? '(X)' : '( )'}
    </Text>
    {/* Renderiza o texto associado com a mesma lógica usando fontes de 10px */}
    <Text style={marcado ? S.anamneseOpcaoTextoChecked : S.anamneseOpcaoTexto}>{texto}</Text>
  </View>
);

// ============================
// Componente: Campo Célula (Customizado para Layout de Grade)
// Explicação: Este componente desenha a célula de uma tabela horizontal sem traço inferior individual.
// Permite personalizar os tamanhos de fonte dos rótulos e valores para se adequar ao cabeçalho da anamnese.
// ============================
const CampoCelula = ({ label, valor, largura = '100%', borderRight = false, paddingLeft = 0, fontSizeLabel = 7.5, fontSizeValor = 8 }: { label: string; valor?: string; largura?: string | number; borderRight?: boolean; paddingLeft?: number; fontSizeLabel?: number; fontSizeValor?: number }) => (
  // Define a célula com largura flexível, direção horizontal, preenchimento interno e borda lateral direita opcional
  <View style={{
    width: largura as any,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    paddingLeft: paddingLeft > 0 ? paddingLeft : 6,
    borderRightWidth: borderRight ? 1 : 0,
    borderRightColor: '#000000',
  }}>
    {/* Rótulo estático do campo com fonte customizável */}
    <Text style={{ fontSize: fontSizeLabel, fontFamily: 'Helvetica-Bold', marginRight: 4, textTransform: 'uppercase', color: '#000000' }}>{label}:</Text>
    {/* Texto do valor preenchido dentro da célula com fonte customizável */}
    <Text style={{ fontSize: fontSizeValor, color: '#000000', flex: 1 }}>{valor || ''}</Text>
  </View>
);

// Declara o componente principal do Template que monta a estrutura inteira de páginas PDF
export const AudiometriaPDFTemplate = ({
  patientData, anamneseAnswers, audiometroData, logoAudiometriaData, laudoData, gradeData, observacoes, meatoscopiaOD, meatoscopiaOE, employeeSignature, tipoExame, termoData, gradeImageOD, gradeImageOE
}: AudiometriaPDFProps) => {

  // Calcula a data atual formatada (espelho da lógica do LaudoPerda.tsx)
  let dataFormatada = "____ de _______________ de 202__";
  try {
    const localDate = new Date();
    const dia = localDate.getDate();
    const meses = ["janeiro", "fevereiro", "março", "abril", "maio", "junho", "julho", "agosto", "setembro", "outubro", "novembro", "dezembro"];
    const mes = meses[localDate.getMonth()];
    const ano = localDate.getFullYear();
    dataFormatada = `${dia} de ${mes} de ${ano}`;
  } catch (err) {
    console.error("Erro ao formatar a data do termo:", err);
  }

  // --- CABEÇALHO GLOBAL ---
  // Função que encapsula o header. Reutilizado no topo de cada <Page> para não duplicar código.
  const Header = () => (
    // Agrupa todos os elementos do header numa linha com borda inferior (S.cabecalho)
    <View style={S.cabecalho}>
      {/* Imagem do logotipo oficial carregada com as dimensões de 44x44 e margem direita de 10px */}
      <Image src={gamaIcon} style={{ width: 44, height: 44, marginRight: 10 }} />
      {/* Caixa de textos da clínica, empilhando todos os Text um embaixo do outro por estarem dentro de uma View padrão (column) */}
      <View style={S.cabecalhoTextos}>
        <Text style={S.cabecalhoTitulo}>GAMA CENTER MEDICINA OCUPACIONAL E ENGENHARIA DE SEGURANÇA</Text>
        <Text style={S.cabecalhoLinha}>Rua Barão de Pouso Alegre, 90, São Sebastião, Conselheiro Lafaiete/MG</Text>
        <Text style={S.cabecalhoLinha}>Telefone: (31) 3761-2417 / WhatsApp: (31) 97192-0766</Text>
        <Text style={S.cabecalhoLinha}>Email: contato@gamacentersst.com.br Site: www.gamacentersst.com.br</Text>
      </View>
    </View>
  );

  // --- Funções Auxiliares para o Desenho SVG dos Gráficos ---
  // Função para desenhar o símbolo 'X' da orelha esquerda via SVG Path, baseado nas coordenadas CX, CY passadas
  const renderCross = (cx: number, cy: number, color: string) => {
    // S representa o tamanho da perna da cruz (agora 15 para ficar mais visível)
    const s = 15;
    // Retorna o comando M(Move) e L(Line) formando duas retas que se cruzam
    return <Path key={`cross-${cx}-${cy}`} d={`M ${cx - s} ${cy - s} L ${cx + s} ${cy + s} M ${cx + s} ${cy - s} L ${cx - s} ${cy + s}`} stroke={color} strokeWidth={3} />;
  };
  
  // Função para desenhar a Seta "<" de via óssea da orelha direita
  const renderSetaEsq = (cx: number, cy: number, color: string) => {
    const s = 18; // tamanho da seta aumentado
    // Retorna um caminho que forma a base angular da seta apontada para a esquerda
    return <Path key={`setaesq-${cx}-${cy}`} d={`M ${cx + s} ${cy - s} L ${cx} ${cy} L ${cx + s} ${cy + s}`} stroke={color} strokeWidth={3} fill="none" />;
  };

  // Função para desenhar a Seta ">" de via óssea da orelha esquerda
  const renderSetaDir = (cx: number, cy: number, color: string) => {
    const s = 18; // tamanho da seta aumentado
    // Retorna um caminho que forma a base angular da seta apontada para a direita
    return <Path key={`setadir-${cx}-${cy}`} d={`M ${cx - s} ${cy - s} L ${cx} ${cy} L ${cx - s} ${cy + s}`} stroke={color} strokeWidth={3} fill="none" />;
  };

  // Retorna a estrutura mestre 'Document', englobando todas as páginas a serem exportadas
  return (
    <Document>
      {/* ======================= PÁGINA 1: ANAMNESE ======================= */}
      {/* A tag Page cria uma folha nova fisicamente no PDF final (A4 é o formato mais seguro) */}
      <Page size="A4" style={S.page}>
        {/* Moldura externa preta de 1px envolta de todo o conteúdo */}
        <View style={S.containerPagina}>
          {/* Renderiza o cabeçalho no topo desta página */}
          <Header />
          
          {/* Faixa cinza do título da seção */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>ANAMNESE OCUPACIONAL</Text>
          </View>
          
          {/* --- DADOS DO PACIENTE (Layout em grade integrada com fontes aumentadas) --- */}
          {/* Linha contendo Empresa e Função */}
          <View style={S.gradeLinha}>
            {/* Campo da empresa com 50% de largura horizontal, divisória vertical à direita e fontes maiores */}
            <CampoCelula label="EMPRESA" valor={patientData?.empresa} largura="50%" borderRight={true} fontSizeLabel={9} fontSizeValor={10} />
            {/* Campo da função com 50% de largura horizontal, padding-left de 4px e fontes maiores */}
            <CampoCelula label="FUNÇÃO" valor={patientData?.funcao} largura="50%" paddingLeft={4} fontSizeLabel={9} fontSizeValor={10} />
          </View>
          {/* Linha contendo Nome e Data do exame */}
          <View style={S.gradeLinha}>
            {/* Campo do nome com 50% de largura horizontal, divisória vertical à direita e fontes maiores */}
            <CampoCelula label="NOME" valor={patientData?.nome} largura="50%" borderRight={true} fontSizeLabel={9} fontSizeValor={10} />
            {/* Campo da data com 50% de largura horizontal, padding-left de 4px e fontes maiores */}
            <CampoCelula label="DATA" valor={patientData?.dataExame} largura="50%" paddingLeft={4} fontSizeLabel={9} fontSizeValor={10} />
          </View>

          {/* Faixa cinza do questionário */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>QUESTIONÁRIO OCUPACIONAL</Text>
          </View>

          {/* --- QUESTIONÁRIO (Seção interna de conteúdo colada com fontes maiores e padding de 4px entre as perguntas) --- */}
          <View style={[S.gradeSecaoConteudo, { flex: 1, paddingVertical: 12 }]}>
            {/* Bloco de pergunta principal Q1 */}
            <View style={S.blocoPergunta}>
              {/* Q1: Pergunta sobre exame anterior */}
              <View style={S.qLinha}>
                <Text style={S.anamneseLabel}>Já realizou exame audiométrico anteriormente?</Text>
                <View style={S.qChecks}>
                  <OpcaoAnamnese marcado={anamneseAnswers?.q1 === 'sim'} texto="Sim" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q1 === 'nao'} texto="Não" />
                </View>
              </View>
              {/* Bloco Condicional de Q1: Se a pessoa marcou 'sim', desenhamos o sub-questionário */}
              {anamneseAnswers?.q1 === 'sim' && (
                <View style={S.recuo}>
                  <View style={S.qLinha}>
                    <Text style={S.anamneseSubLabel}>Se respondeu 'sim', qual o resultado? </Text>
                    <View style={S.qChecks}>
                      <OpcaoAnamnese marcado={anamneseAnswers?.q1_result === 'normal'} texto="Normal" />
                      <OpcaoAnamnese marcado={anamneseAnswers?.q1_result === 'alterado'} texto="Alterado" />
                    </View>
                  </View>
                  {/* Bloco Condicional secundário de Q1: Se resultado for alterado, pergunta o ouvido afetado */}
                  {anamneseAnswers?.q1_result === 'alterado' && (
                    <View style={S.qLinha}>
                      <Text style={S.anamneseSubLabel}>Se alterado, em qual ouvido? </Text>
                      <View style={S.qChecks}>
                        <OpcaoAnamnese marcado={anamneseAnswers?.q1_ear === 'od'} texto="OD" />
                        <OpcaoAnamnese marcado={anamneseAnswers?.q1_ear === 'oe'} texto="OE" />
                        <OpcaoAnamnese marcado={anamneseAnswers?.q1_ear === 'ambos'} texto="Ambos" />
                      </View>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Bloco de pergunta principal Q2 */}
            <View style={S.blocoPergunta}>
              {/* Q2: Pergunta sobre tempo de exposição a ruído */}
              <View style={S.qLinha}>
                <Text style={S.anamneseLabel}>Trabalha ou já trabalhou exposto ao ruído?</Text>
                <View style={S.qChecks}>
                  <OpcaoAnamnese marcado={anamneseAnswers?.q2 === 'sim'} texto="Sim" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q2 === 'nao'} texto="Não" />
                </View>
              </View>
              {/* Se trabalha com ruído (Sim), desenhamos o tempo na linha de baixo recuada */}
              {anamneseAnswers?.q2 === 'sim' && (
                <View style={S.recuo}>
                  <View style={S.qLinha}>
                    <Text style={S.anamneseSubLabel}>Por quanto tempo?</Text>
                    <Text style={S.anamneseValorDestaque}>{anamneseAnswers?.q2_tempo_val || '0'} {anamneseAnswers?.q2_tempo_unidade || 'anos'}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Bloco de pergunta principal Q3 */}
            <View style={S.blocoPergunta}>
              {/* Q3: Uso de protetor auricular */}
              <View style={S.qLinha}>
                <Text style={S.anamneseLabel}>Usa ou já usou protetor no ouvido?</Text>
                <View style={S.qChecks}>
                  <OpcaoAnamnese marcado={anamneseAnswers?.q3 === 'sim'} texto="Sim" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q3 === 'nao'} texto="Não" />
                </View>
              </View>
              {/* Condicional do protetor auricular */}
              {anamneseAnswers?.q3 === 'sim' && (
                <View style={S.recuo}>
                  <View style={S.qLinha}>
                    <Text style={S.anamneseSubLabel}>Qual? </Text>
                    <View style={S.qChecks}>
                      <OpcaoAnamnese marcado={anamneseAnswers?.q3_type === 'plug'} texto="Plug" />
                      <OpcaoAnamnese marcado={anamneseAnswers?.q3_type === 'concha'} texto="Concha" />
                      <OpcaoAnamnese marcado={anamneseAnswers?.q3_type === 'ambos'} texto="Ambos" />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Bloco de pergunta principal Q4 */}
            <View style={S.blocoPergunta}>
              {/* Q4: Hábitos comportamentais ou recreativos */}
              <View style={S.qLinha}>
                <Text style={S.anamneseLabel}>Possui esses hábitos?</Text>
                <View style={S.qChecks}>
                  <OpcaoAnamnese marcado={anamneseAnswers?.q4_moto === 'sim'} texto="Motociclismo" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q4_fone === 'sim'} texto="Fone de ouvido" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q4_musico === 'sim'} texto="Músico" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q4_nenhum === 'sim'} texto="Nenhum" />
                </View>
              </View>
            </View>

            {/* Bloco de pergunta principal Q8 */}
            <View style={S.blocoPergunta}>
              {/* Q8: Cirurgia no ouvido */}
              <View style={S.qLinha}>
                <Text style={S.anamneseLabel}>Já realizou cirurgia no ouvido?</Text>
                <View style={S.qChecks}>
                  <OpcaoAnamnese marcado={anamneseAnswers?.q8 === 'sim'} texto="Sim" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q8 === 'nao'} texto="Não" />
                </View>
              </View>
              {/* Condicional cirurgia */}
              {anamneseAnswers?.q8 === 'sim' && (
                <View style={S.recuo}>
                  <View style={S.qLinha}>
                    <Text style={S.anamneseSubLabel}>Qual ouvido? </Text>
                    <View style={S.qChecks}>
                      <OpcaoAnamnese marcado={anamneseAnswers?.q8_ear === 'od'} texto="OD" />
                      <OpcaoAnamnese marcado={anamneseAnswers?.q8_ear === 'oe'} texto="OE" />
                      <OpcaoAnamnese marcado={anamneseAnswers?.q8_ear === 'ambos'} texto="Ambos" />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Bloco de pergunta Nova: Infecção no ouvido */}
            <View style={S.blocoPergunta}>
              <View style={S.qLinha}>
                <Text style={S.anamneseLabel}>Já teve infecção no ouvido?</Text>
                <View style={S.qChecks}>
                  <OpcaoAnamnese marcado={anamneseAnswers?.infeccao_ouvido === 'sim'} texto="Sim" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.infeccao_ouvido === 'nao'} texto="Não" />
                </View>
              </View>
            </View>

            {/* Bloco de pergunta principal Q9 */}
            <View style={S.blocoPergunta}>
              {/* Q9: Trauma no ouvido */}
              <View style={S.qLinha}>
                <Text style={S.anamneseLabel}>Já sofreu algum trauma no ouvido?</Text>
                <View style={S.qChecks}>
                  <OpcaoAnamnese marcado={anamneseAnswers?.q9 === 'sim'} texto="Sim" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q9 === 'nao'} texto="Não" />
                </View>
              </View>
              {/* Condicional trauma */}
              {anamneseAnswers?.q9 === 'sim' && (
                <View style={S.recuo}>
                  <View style={S.qLinha}>
                    <Text style={S.anamneseSubLabel}>Qual ouvido? </Text>
                    <View style={S.qChecks}>
                      <OpcaoAnamnese marcado={anamneseAnswers?.q9_ear === 'od'} texto="OD" />
                      <OpcaoAnamnese marcado={anamneseAnswers?.q9_ear === 'oe'} texto="OE" />
                      <OpcaoAnamnese marcado={anamneseAnswers?.q9_ear === 'ambos'} texto="Ambos" />
                    </View>
                  </View>
                </View>
              )}
            </View>

            {/* Bloco de pergunta principal Q11 */}
            <View style={S.blocoPergunta}>
              {/* Q11: Comorbidades */}
              <View style={S.qLinha}>
                <Text style={S.anamneseLabel}>Já teve ou tem:</Text>
                <View style={S.qChecks}>
                  <OpcaoAnamnese marcado={anamneseAnswers?.q11_hipertensao === 'sim'} texto="hipertensão" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q11_diabetes === 'sim'} texto="diabetes" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q11_cardiacos === 'sim'} texto="problemas cardíacos" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q11_nenhum === 'sim'} texto="nenhum" />
                </View>
              </View>
              {/* Subcampo outros */}
              {anamneseAnswers?.q11_outros && (
                <View style={S.recuo}>
                  <View style={S.qLinha}>
                    <Text style={S.anamneseSubLabel}>Outros:</Text>
                    <Text style={S.anamneseValorDestaque}>{anamneseAnswers.q11_outros}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Bloco de pergunta principal Q12 */}
            <View style={S.blocoPergunta}>
              {/* Q12: Tonturas */}
              <View style={S.qLinha}>
                <Text style={S.anamneseLabel}>Apresenta tontura?</Text>
                <View style={S.qChecks}>
                  <OpcaoAnamnese marcado={anamneseAnswers?.q12_tontura === 'sim'} texto="Sim" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q12_tontura === 'nao'} texto="Não" />
                </View>
              </View>
              {/* Condicional tontura - disposta na linha de baixo com recuo */}
              {anamneseAnswers?.q12_tontura === 'sim' && (
                <View style={S.recuo}>
                  <View style={S.qLinha}>
                    <Text style={S.anamneseSubLabel}>A cada:</Text>
                    <Text style={S.anamneseValorDestaque}>{anamneseAnswers?.q12_frequencia_val || '0'} {anamneseAnswers?.q12_frequencia_unidade || 'horas'}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Bloco de pergunta principal Q13 */}
            <View style={S.blocoPergunta}>
              {/* Q13: Zumbidos */}
              <View style={S.qLinha}>
                <Text style={S.anamneseLabel}>Apresenta zumbido?</Text>
                <View style={S.qChecks}>
                  <OpcaoAnamnese marcado={anamneseAnswers?.q13 === 'sim'} texto="Sim" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q13 === 'nao'} texto="Não" />
                </View>
              </View>
              {/* Condicional zumbido */}
              {anamneseAnswers?.q13 === 'sim' && (
                <View style={S.recuo}>
                  <View style={S.qLinha}>
                    <Text style={S.anamneseSubLabel}>Qual ouvido? </Text>
                    <View style={S.qChecks}>
                      <OpcaoAnamnese marcado={anamneseAnswers?.q13_ear === 'od'} texto="OD" />
                      <OpcaoAnamnese marcado={anamneseAnswers?.q13_ear === 'oe'} texto="OE" />
                      <OpcaoAnamnese marcado={anamneseAnswers?.q13_ear === 'ambos'} texto="Ambos" />
                    </View>
                  </View>
                  {anamneseAnswers?.q13_frequencia && (
                    <View style={S.qLinha}>
                      <Text style={S.anamneseSubLabel}>Qual a frequência?</Text>
                      <Text style={S.anamneseValorDestaque}>{anamneseAnswers.q13_frequencia}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Bloco de pergunta principal Q14 */}
            <View style={S.blocoPergunta}>
              {/* Q14: Histórico Familiar */}
              <View style={S.qLinha}>
                <Text style={S.anamneseLabel}>Tem casos de problemas auditivos na família?</Text>
                <View style={S.qChecks}>
                  <OpcaoAnamnese marcado={anamneseAnswers?.q14 === 'sim'} texto="Sim" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q14 === 'nao'} texto="Não" />
                </View>
              </View>
              {/* Condicional família - disposta na linha de baixo com recuo */}
              {anamneseAnswers?.q14 === 'sim' && anamneseAnswers?.q14_parentesco && (
                <View style={S.recuo}>
                  <View style={S.qLinha}>
                    <Text style={S.anamneseSubLabel}>Parentesco:</Text>
                    <Text style={S.anamneseValorDestaque}>{anamneseAnswers.q14_parentesco}</Text>
                  </View>
                </View>
              )}
            </View>

            {/* Bloco de pergunta principal Q15 */}
            <View style={S.blocoPergunta}>
              {/* Q15: Higiene */}
              <View style={S.qLinha}>
                <Text style={S.anamneseLabel}>Usa algum objeto para limpar o ouvido?</Text>
                <View style={S.qChecks}>
                  <OpcaoAnamnese marcado={anamneseAnswers?.q15 === 'sim'} texto="Sim" />
                  <OpcaoAnamnese marcado={anamneseAnswers?.q15 === 'nao'} texto="Não" />
                </View>
              </View>
              {/* Condicional higiene */}
              {anamneseAnswers?.q15 === 'sim' && (
                <View style={S.recuo}>
                  <View style={S.qLinha}>
                    <Text style={S.anamneseSubLabel}>Qual objeto? </Text>
                    <View style={S.qChecks}>
                      <OpcaoAnamnese marcado={anamneseAnswers?.q15_object === 'cotonete'} texto="Hastes de Algodão" />
                      <OpcaoAnamnese marcado={anamneseAnswers?.q15_object === 'outro'} texto="Outro" />
                    </View>
                    {anamneseAnswers?.q15_object === 'outro' && anamneseAnswers?.q15_outro_text && (
                      <Text style={S.anamneseValorDestaque}>{anamneseAnswers.q15_outro_text}</Text>
                    )}
                  </View>
                </View>
              )}
            </View>
          </View>

          {/* Faixa cinza de Observação */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>OBSERVAÇÃO</Text>
          </View>

          {/* Campo final de observação (encosta na borda inferior do contêiner com tamanho aumentado) */}
          <View style={{ padding: 24 }}>
            <Text style={{ fontSize: 10, color: '#000000' }}>{anamneseAnswers?.anamneseObservacao || ''}</Text>
          </View>
        </View>
      </Page>


      {/* ======================= PÁGINA 2: PROTOCOLO DE AUDIOMETRIA ======================= */}
      <Page size="A4" style={S.page}>
        {/* Moldura externa preta de 1px envolta de todo o conteúdo, adicionando margem inferior de 50px para subir a borda inferior */}
        <View style={[S.containerPagina,]}>
          {/* Renderiza o cabeçalho no topo */}
          <Header />
          
          {/* Faixa cinza do título da seção */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>PROTOCOLO DE AUDIOMETRIA OCUPACIONAL</Text>
          </View>
          
          {/* Tabela de Dados do Paciente */}
          <View style={S.gradeLinha}>
            {/* Campo da empresa com 50% de largura horizontal e divisória vertical à direita */}
            <CampoCelula label="EMPRESA" valor={patientData?.empresa} largura="50%" borderRight={true} />
            {/* Campo do nome do colaborador com 50% de largura horizontal e padding-left de 4px */}
            <CampoCelula label="NOME" valor={patientData?.nome} largura="50%" paddingLeft={4} />
          </View>
          <View style={S.gradeLinha}>
            {/* Campo da função ocupacional com 50% de largura horizontal e divisória vertical à direita */}
            <CampoCelula label="FUNÇÃO" valor={patientData?.funcao} largura="50%" borderRight={true} />
            {/* Opções de sexo na mesma linha usando flex condicional com largura de 50% e padding-left de 4px */}
            <View style={{ width: '50%', flexDirection: 'row', alignItems: 'center', paddingLeft: 4 }}>
              <Text style={S.campoLabel}>SEXO: </Text>
              <Opcao marcado={patientData?.sexo === 'Feminino'} texto="Feminino" />
              <Opcao marcado={patientData?.sexo === 'Masculino'} texto="Masculino" />
            </View>
          </View>
          <View style={S.gradeLinha}>
            {/* Campo do CPF com 50% de largura horizontal e divisória vertical à direita */}
            <CampoCelula label="CPF" valor={patientData?.documento} largura="50%" borderRight={true} />
            {/* Campo do RG com 50% de largura horizontal e padding-left de 4px */}
            <CampoCelula label="RG" valor={patientData?.rg} largura="50%" paddingLeft={4} />
          </View>
          <View style={S.gradeLinha}>
            {/* Campo da data de nascimento com 33% de largura horizontal e divisória vertical à direita */}
            <CampoCelula label="NASC." valor={patientData?.dataNascimento} largura="33%" borderRight={true} />
            {/* Campo da data do exame com 33% de largura horizontal, divisória vertical à direita e padding-left de 4px */}
            <CampoCelula label="EXAME" valor={patientData?.dataExame} largura="33%" borderRight={true} paddingLeft={4} />
            {/* Campo do repouso acústico com 34% de largura horizontal e padding-left de 4px */}
            <CampoCelula label="REPOUSO" valor={patientData?.repouso || '14 horas'} largura="34%" paddingLeft={4} />
          </View>

          {/* Faixa cinza do Tipo de Exame */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>TIPO DE EXAME</Text>
          </View>
          {/* Opções do tipo de exame dispostas horizontalmente e com borda inferior */}
          <View style={[S.gradeLinha, { paddingVertical: 5, paddingHorizontal: 8, justifyContent: 'space-between' }]}>
            <Opcao marcado={tipoExame === 'Admissional'} texto="ADMISSIONAL" />
            <Opcao marcado={tipoExame === 'Periódico'} texto="PERIÓDICO" />
            <Opcao marcado={tipoExame === 'Demissional'} texto="DEMISSIONAL" />
            <Opcao marcado={tipoExame === 'Retorno'} texto="RETORNO" />
            <Opcao marcado={tipoExame === 'Mudança'} texto="MUDANÇA" />
          </View>

          {/* Faixa cinza da Meatoscopia */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>MEATOSCOPIA</Text>
          </View>
          {/* Opções da meatoscopia dispostas em grade divididas horizontalmente */}
          <View style={S.gradeLinha}>
            <CampoCelula label="ORELHA DIREITA (OD)" valor={meatoscopiaOD} largura="50%" borderRight={true} />
            <CampoCelula label="ORELHA ESQUERDA (OE)" valor={meatoscopiaOE} largura="50%" paddingLeft={4} />
          </View>

          {/* Área do Gráfico (Gráficos dispostos lado a lado com divisória vertical no meio) */}
          <View style={S.gradeLinha}>
             {/* Orelha Direita com divisória vertical à direita */}
             <View style={{ width: '50%', borderRightWidth: 1, borderRightColor: '#000000', padding: 6 }}>
                <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: 'red', textAlign: 'center', marginBottom: 4 }}>ORELHA DIREITA (OD)</Text>
                 <View style={S.gradeContainer}>
                   {gradeImageOD ? (
                     <Image src={gradeImageOD} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
                   ) : (
                     <>
                       {/* Imagem de fundo oficial da grade de audiometria para a orelha direita */}
                       <Image src={audiometriaBg} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
                       <Svg viewBox="0 0 750 583" style={S.gradeSvg}>
                          {gradeData?.linesOD?.map((l: any, i: number) => {
                            const p1 = gradeData.pointsOD[l.fromIndex]; 
                            const p2 = gradeData.pointsOD[l.toIndex];
                            if(!p1||!p2) return null; 
                            // Linhas pontilhadas se for via óssea para orelha direita
                            const isBoneLine = l.isBone || (p1.symbol === '<' && p2.symbol === '<');
                            return <Line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="red" strokeWidth={3} strokeDasharray={isBoneLine ? "8,6" : undefined} />
                          })}
                          {gradeData?.pointsOD?.map((p: any, i: number) => {
                            if(p.symbol==='bolinha') return <Circle key={i} cx={p.x} cy={p.y} r={15} stroke="red" strokeWidth={3} fill="none"/>;
                            if(p.symbol==='<') return renderSetaEsq(p.x, p.y, 'red'); 
                            return null;
                          })}
                       </Svg>
                     </>
                   )}
                 </View>
             </View>

             {/* Orelha Esquerda */}
             <View style={{ width: '50%', padding: 6 }}>
                <Text style={{ fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: 'blue', textAlign: 'center', marginBottom: 4 }}>ORELHA ESQUERDA (OE)</Text>
                 <View style={S.gradeContainer}>
                   {gradeImageOE ? (
                     <Image src={gradeImageOE} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
                   ) : (
                     <>
                       {/* Imagem de fundo oficial da grade de audiometria para a orelha esquerda */}
                       <Image src={audiometriaBg} style={{ width: '100%', height: '100%', position: 'absolute', top: 0, left: 0 }} />
                       <Svg viewBox="0 0 750 583" style={S.gradeSvg}>
                          {gradeData?.linesOE?.map((l: any, i: number) => {
                            const p1 = gradeData.pointsOE[l.fromIndex]; 
                            const p2 = gradeData.pointsOE[l.toIndex];
                            if(!p1||!p2) return null; 
                            // A pedido, a linha da orelha esquerda deve ser pontilhada
                            return <Line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="blue" strokeWidth={3} strokeDasharray="8,6" />
                          })}
                          {gradeData?.pointsOE?.map((p: any, i: number) => {
                            if(p.symbol==='X') return renderCross(p.x, p.y, 'blue');
                            if(p.symbol==='>') return renderSetaDir(p.x, p.y, 'blue'); 
                            return null;
                          })}
                       </Svg>
                     </>
                   )}
                 </View>
             </View>
          </View>

          {/* Faixa cinza da Logoaudiometria */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>LOGOAUDIOMETRIA</Text>
          </View>
          {/* Tabela de logoaudiometria contendo os dois quadros dispostos horizontalmente e alinhados */}
          <View style={S.gradeLinha}>
            {/* Contêiner flexível que distribui as duas tabelas lado a lado com espaçamento uniforme */}
            <View style={{ width: '100%', padding: 6, flexDirection: 'row', justifyContent: 'space-between' }}>
              {/* Contêiner do primeiro quadro correspondente ao Limiar de Reconhecimento de Fala (LRF) */}
              <View style={{ width: '49%' }}>
                {/* Tabela com borda que envolve as linhas de dados do LRF */}
                <View style={[S.table, { marginBottom: 0 }]}>
                  {/* Primeira linha da tabela para os cabeçalhos de coluna */}
                  <View style={S.tableRowView}>
                    {/* Cabeçalho da coluna indicando o tipo de teste (LRF) */}
                    <View style={S.tableColHeader}><Text style={S.tableHeaderText}>LRF</Text></View>
                    {/* Cabeçalho para a coluna de Intensidade de som em decibéis */}
                    <View style={S.tableColHeader}><Text style={S.tableHeaderText}>Intensid.</Text></View>
                    {/* Cabeçalho para a coluna de palavras monossilábicas testadas */}
                    <View style={S.tableColHeader}><Text style={S.tableHeaderText}>Monossil.</Text></View>
                    {/* Cabeçalho para a coluna de palavras dissilábicas testadas sem borda direita para evitar linha dupla */}
                    <View style={[S.tableColHeader, { borderRightWidth: 0 }]}><Text style={S.tableHeaderText}>Dissil.</Text></View>
                  </View>
                  {/* Segunda linha da tabela contendo os dados obtidos da orelha direita (OD) */}
                  <View style={S.tableRowView}>
                    {/* Indicador lateral da orelha direita */}
                    <View style={S.tableColHeader}><Text style={S.tableHeaderText}>OD</Text></View>
                    {/* Valor da intensidade mínima ouvida na orelha direita */}
                    <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.lrfODIntensidade}</Text></View>
                    {/* Porcentagem de acertos para palavras monossílabas na orelha direita */}
                    <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.lrfODMonossil}</Text></View>
                    {/* Porcentagem de acertos para palavras dissílabas na orelha direita sem borda direita */}
                    <View style={[S.tableColData, { borderRightWidth: 0 }]}><Text style={S.tableCellText}>{logoAudiometriaData?.lrfODDissil}</Text></View>
                  </View>
                  {/* Terceira linha da tabela contendo os dados obtidos da orelha esquerda (OE) e removendo a borda inferior */}
                  <View style={[S.tableRowView, { borderBottomWidth: 0 }]}>
                    {/* Indicador lateral da orelha esquerda */}
                    <View style={S.tableColHeader}><Text style={S.tableHeaderText}>OE</Text></View>
                    {/* Valor da intensidade mínima ouvida na orelha esquerda */}
                    <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.lrfOEIntensidade}</Text></View>
                    {/* Porcentagem de acertos para palavras monossílabas na orelha esquerda */}
                    <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.lrfOEMonossil}</Text></View>
                    {/* Porcentagem de acertos para palavras dissílabas na orelha esquerda sem borda direita */}
                    <View style={[S.tableColData, { borderRightWidth: 0 }]}><Text style={S.tableCellText}>{logoAudiometriaData?.lrfOEDissil}</Text></View>
                  </View>
                </View>
              </View>

              {/* Contêiner do segundo quadro correspondente ao Índice Percentual de Reconhecimento de Fala (IPRF) */}
              <View style={{ width: '49%' }}>
                {/* Tabela com borda que envolve as linhas de dados do IPRF */}
                <View style={[S.table, { marginBottom: 0 }]}>
                  {/* Primeira linha da tabela para os cabeçalhos de coluna */}
                  <View style={S.tableRowView}>
                    {/* Cabeçalho da coluna indicando o tipo de teste (IPRF) */}
                    <View style={S.tableColHeader}><Text style={S.tableHeaderText}>IPRF</Text></View>
                    {/* Cabeçalho para a coluna de Intensidade de som em decibéis */}
                    <View style={S.tableColHeader}><Text style={S.tableHeaderText}>Intensid.</Text></View>
                    {/* Cabeçalho para a coluna de palavras monossilábicas testadas */}
                    <View style={S.tableColHeader}><Text style={S.tableHeaderText}>Monossil.</Text></View>
                    {/* Cabeçalho para a coluna de palavras dissilábicas testadas sem borda direita para evitar linha dupla */}
                    <View style={[S.tableColHeader, { borderRightWidth: 0 }]}><Text style={S.tableHeaderText}>Dissil.</Text></View>
                  </View>
                  {/* Segunda linha da tabela contendo os dados obtidos da orelha direita (OD) */}
                  <View style={S.tableRowView}>
                    {/* Indicador lateral da orelha direita */}
                    <View style={S.tableColHeader}><Text style={S.tableHeaderText}>OD</Text></View>
                    {/* Valor da intensidade mínima ouvida na orelha direita no teste de discriminação */}
                    <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.iprfODIntensidade}</Text></View>
                    {/* Porcentagem de acertos para palavras monossílabas na orelha direita no teste de discriminação */}
                    <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.iprfODMonossil}</Text></View>
                    {/* Porcentagem de acertos para palavras dissílabas na orelha direita no teste de discriminação sem borda direita */}
                    <View style={[S.tableColData, { borderRightWidth: 0 }]}><Text style={S.tableCellText}>{logoAudiometriaData?.iprfODDissil}</Text></View>
                  </View>
                  {/* Terceira linha da tabela contendo os dados obtidos da orelha esquerda (OE) e removendo a borda inferior */}
                  <View style={[S.tableRowView, { borderBottomWidth: 0 }]}>
                    {/* Indicador lateral da orelha esquerda */}
                    <View style={S.tableColHeader}><Text style={S.tableHeaderText}>OE</Text></View>
                    {/* Valor da intensidade mínima ouvida na orelha esquerda no teste de discriminação */}
                    <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.iprfOEIntensidade}</Text></View>
                    {/* Porcentagem de acertos para palavras monossílabas na orelha esquerda no teste de discriminação */}
                    <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.iprfOEMonossil}</Text></View>
                    {/* Porcentagem de acertos para palavras dissílabas na orelha esquerda no teste de discriminação sem borda direita */}
                    <View style={[S.tableColData, { borderRightWidth: 0 }]}><Text style={S.tableCellText}>{logoAudiometriaData?.iprfOEDissil}</Text></View>
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Faixa cinza do Laudo */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>LAUDO</Text>
          </View>
          {/* Detalhes do Laudo final */}
          <View style={S.gradeSecaoConteudo}>
             <View style={S.qLinha}>
               <Text style={S.campoLabel}>Limiares auditivos aceitáveis: </Text>
               <Opcao marcado={laudoData?.limiaresAceitaveis?.od} texto="OD" />
               <Opcao marcado={laudoData?.limiaresAceitaveis?.oe} texto="OE" />
               <Opcao marcado={laudoData?.limiaresAceitaveis?.bilateral} texto="Bilateral" />
             </View>
             <Text style={[S.campoLabel, {marginTop: 5, marginBottom: 5}]}>Perda auditiva:</Text>
             <View style={[S.qLinha, { flexWrap: 'wrap' }]}>
               <Text style={S.campoLabel}>OD: </Text>
               <Opcao marcado={laudoData?.perdaOD?.neurosensorial} texto="Neurosensorial" />
               <Opcao marcado={laudoData?.perdaOD?.mista} texto="Mista" />
               <Opcao marcado={laudoData?.perdaOD?.condutiva} texto="Condutiva" />
               <Opcao marcado={laudoData?.perdaOD?.h6000} texto="6000Hz" />
               <Opcao marcado={laudoData?.perdaOD?.h8000} texto="8000Hz" />
             </View>
             <View style={[S.qLinha, { flexWrap: 'wrap' }]}>
               <Text style={S.campoLabel}>OE: </Text>
               <Opcao marcado={laudoData?.perdaOE?.neurosensorial} texto="Neurosensorial" />
               <Opcao marcado={laudoData?.perdaOE?.mista} texto="Mista" />
               <Opcao marcado={laudoData?.perdaOE?.condutiva} texto="Condutiva" />
               <Opcao marcado={laudoData?.perdaOE?.h6000} texto="6000Hz" />
               <Opcao marcado={laudoData?.perdaOE?.h8000} texto="8000Hz" />
             </View>
             <View style={{marginTop: 5, flexDirection: 'row', alignItems: 'center'}}>
               <Text style={S.campoLabel}>Obs: </Text>
               <Text style={{fontSize: 8, color: '#000000', flex: 1}}>{observacoes || ''}</Text>
             </View>
          </View>

          {/* Rodapé de Assinaturas (Sem borda inferior para colar no final da moldura externa) */}
          <View style={{flexDirection: 'row', justifyContent: 'space-around', paddingVertical: 20, paddingHorizontal: 10, flex: 1, alignItems: 'flex-end'}}>
             <View style={{alignItems: 'center', width: '40%'}}>
                {termoData?.employeeSignature && <Image src={termoData.employeeSignature} style={{width: 80, height: 30, marginBottom: -15}} />}
                <View style={{borderTopWidth: 1, borderTopColor: PRETO, width: '100%', marginTop: 20, paddingTop: 5, alignItems: 'center'}}>
                  <Text style={{fontSize: 8, fontFamily: 'Helvetica-Bold'}}>ASSINATURA DO FUNCIONÁRIO(A)</Text>
                </View>
             </View>
             <View style={{alignItems: 'center', width: '40%'}}>
                <Image src={sigImage} style={{width: 80, height: 30, marginBottom: -15}} />
                <View style={{borderTopWidth: 1, borderTopColor: PRETO, width: '100%', marginTop: 20, paddingTop: 5, alignItems: 'center'}}>
                  <Text style={{fontSize: 8, fontFamily: 'Helvetica-Bold'}}>ASSINATURA DA FONOAUDIÓLOGA</Text>
                </View>
             </View>
          </View>
        </View>
      </Page>


      {/* ======================= PÁGINA 3: TERMO DE RECONHECIMENTO ======================= */}
      {/* Definimos um padding inferior de 80px na página para empurrar a borda da moldura externa e as assinaturas para cima */}
      <Page size="A4" style={[S.page, { paddingBottom: 180 }]} >
        {/* Moldura externa preta de 1px envolta de todo o conteúdo */}
        <View style={S.containerPagina} >
          {/* Cabeçalho */}
          <Header />
          
          {/* Faixa cinza do título da página */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>TERMO DE RECONHECIMENTO DE PERDA AUDITIVA (NR 7 - PORTARIA 19, ANEXO I)</Text>
          </View>
          
          {/* Tabela de identificação do colaborador */}
          <View style={S.gradeLinha}>
            <CampoCelula label="Nome" valor={termoData?.nome || patientData?.nome} largura="60%" borderRight={true} />
            <CampoCelula label="Documento" valor={termoData?.documento || patientData?.documento} largura="40%" paddingLeft={4} />
          </View>
          <View style={S.gradeLinha}>
            <CampoCelula label="Empresa" valor={termoData?.empresa || patientData?.empresa} largura="60%" borderRight={true} />
            <CampoCelula label="Função" valor={termoData?.funcao || patientData?.funcao} largura="40%" paddingLeft={4} />
          </View>

          {/* Faixa cinza da declaração de ciência */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>DECLARAÇÃO DE CIÊNCIA</Text>
          </View>
          {/* Declaração de ciência de alteração */}
          <View style={S.gradeSecaoConteudo}>
            <Text style={{fontSize: 9, marginBottom: 10}}>
              Declaro que estou ciente que houve no exame audiométrico {tipoExame.toUpperCase()}, onde foi detectada alteração:
            </Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
              {/* Quadro da Orelha Direita estruturado como tabela independente */}
              <View style={{ width: '49%' }}>
                 {/* Cabeçalho da tabela com fundo cinza e estilo de título de seção */}
                 <View style={[S.secaoTituloFundo, { borderBottomWidth: 0 }]}>
                   {/* Texto do cabeçalho em negrito e caixa alta indicando a orelha direita */}
                   <Text style={S.secaoTituloTexto}>ORELHA DIREITA (OD)</Text>
                 </View>
                 {/* Tabela com borda para englobar as alternativas da orelha direita */}
                 <View style={[S.table, { marginBottom: 0 }]}>
                    {/* Linha da tabela correspondente à alteração neurosensorial */}
                    <View style={S.tableRowView}>
                       {/* Célula contendo o checkbox com recuo interno adequado */}
                       <View style={{ flex: 1, padding: 5, paddingLeft: 8 }}>
                          {/* Componente checkbox com status de marcação correspondente */}
                          <Opcao marcado={termoData?.odAlterations?.neurosensorial} texto="Neurosensorial" />
                       </View>
                    </View>
                    {/* Linha da tabela correspondente à alteração condutiva */}
                    <View style={S.tableRowView}>
                       {/* Célula contendo o checkbox com recuo interno adequado */}
                       <View style={{ flex: 1, padding: 5, paddingLeft: 8 }}>
                          {/* Componente checkbox com status de marcação correspondente */}
                          <Opcao marcado={termoData?.odAlterations?.condutiva} texto="Condutiva" />
                       </View>
                    </View>
                    {/* Linha da tabela correspondente à alteração mista */}
                    <View style={S.tableRowView}>
                       {/* Célula contendo o checkbox com recuo interno adequado */}
                       <View style={{ flex: 1, padding: 5, paddingLeft: 8 }}>
                          {/* Componente checkbox com status de marcação correspondente */}
                          <Opcao marcado={termoData?.odAlterations?.mista} texto="Mista" />
                       </View>
                    </View>
                    {/* Linha da tabela correspondente à presença de cerume sem borda inferior para colar no final da tabela */}
                    <View style={[S.tableRowView, { borderBottomWidth: 0 }]}>
                       {/* Célula contendo o checkbox com recuo interno adequado */}
                       <View style={{ flex: 1, padding: 5, paddingLeft: 8 }}>
                          {/* Componente checkbox com status de marcação correspondente */}
                          <Opcao marcado={termoData?.odAlterations?.cerume} texto="Presença de cerume" />
                       </View>
                    </View>
                 </View>
              </View>

              {/* Quadro da Orelha Esquerda estruturado como tabela independente */}
              <View style={{ width: '49%' }}>
                 {/* Cabeçalho da tabela com fundo cinza e estilo de título de seção */}
                 <View style={[S.secaoTituloFundo, { borderBottomWidth: 0 }]}>
                   {/* Texto do cabeçalho em negrito e caixa alta indicando a orelha esquerda */}
                   <Text style={S.secaoTituloTexto}>ORELHA ESQUERDA (OE)</Text>
                 </View>
                 {/* Tabela com borda para englobar as alternativas da orelha esquerda */}
                 <View style={[S.table, { marginBottom: 0 }]}>
                    {/* Linha da tabela correspondente à alteração neurosensorial */}
                    <View style={S.tableRowView}>
                       {/* Célula contendo o checkbox com recuo interno adequado */}
                       <View style={{ flex: 1, padding: 5, paddingLeft: 8 }}>
                          {/* Componente checkbox com status de marcação correspondente */}
                          <Opcao marcado={termoData?.oeAlterations?.neurosensorial} texto="Neurosensorial" />
                       </View>
                    </View>
                    {/* Linha da tabela correspondente à alteração condutiva */}
                    <View style={S.tableRowView}>
                       {/* Célula contendo o checkbox com recuo interno adequado */}
                       <View style={{ flex: 1, padding: 5, paddingLeft: 8 }}>
                          {/* Componente checkbox com status de marcação correspondente */}
                          <Opcao marcado={termoData?.oeAlterations?.condutiva} texto="Condutiva" />
                       </View>
                    </View>
                    {/* Linha da tabela correspondente à alteração mista */}
                    <View style={S.tableRowView}>
                       {/* Célula contendo o checkbox com recuo interno adequado */}
                       <View style={{ flex: 1, padding: 5, paddingLeft: 8 }}>
                          {/* Componente checkbox com status de marcação correspondente */}
                          <Opcao marcado={termoData?.oeAlterations?.mista} texto="Mista" />
                       </View>
                    </View>
                    {/* Linha da tabela correspondente à presença de cerume sem borda inferior para colar no final da tabela */}
                    <View style={[S.tableRowView, { borderBottomWidth: 0 }]}>
                       {/* Célula contendo o checkbox com recuo interno adequado */}
                       <View style={{ flex: 1, padding: 5, paddingLeft: 8 }}>
                          {/* Componente checkbox com status de marcação correspondente */}
                          <Opcao marcado={termoData?.oeAlterations?.cerume} texto="Presença de cerume" />
                       </View>
                    </View>
                 </View>
              </View>
            </View>
          </View>

          {/* Faixa cinza da perda por frequência */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>PERDA AUDITIVA POR FREQUÊNCIA</Text>
          </View>
          {/* Frequências afetadas */}
          <View style={S.gradeLinha}>
            <View style={{ padding: 6, flexDirection: 'row', alignItems: 'center', width: '100%' }}>
               <Text style={S.campoLabel}>OD: </Text>
               <Opcao marcado={termoData?.odAlterations?.h6000} texto="6000Hz" />
               <Opcao marcado={termoData?.odAlterations?.h8000} texto="8000Hz" />
               <Text style={[S.campoLabel, {marginLeft: 20}]}>OE: </Text>
               <Opcao marcado={termoData?.oeAlterations?.h6000} texto="6000Hz" />
               <Opcao marcado={termoData?.oeAlterations?.h8000} texto="8000Hz" />
            </View>
          </View>

          {/* Faixa cinza de Observação do termo */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>OBSERVAÇÕES DO TERMO</Text>
          </View>
          {/* Linhas de observação do termo */}
          <View style={S.gradeSecaoConteudo}>
            <View style={{ paddingRight: 2, height: 15, marginBottom: 5}}><Text style={{fontSize: 9}}>{termoData?.observacoes}</Text></View>
            <View style={{ paddingRight: 2, height: 15}} />
          </View>

          {/* Faixa cinza do Termo de Proteção Auricular */}
          <View style={S.secaoTituloFundo}>
            <Text style={S.secaoTituloTexto}>TERMO DE PROTEÇÃO E ORIENTAÇÃO</Text>
          </View>
          {/* Texto jurídico de compromisso e orientação */}
          <View style={S.gradeSecaoConteudo}>
             <Text style={{fontSize: 8, lineHeight: 1.4}}>
               Declaro ainda que, fui orientado (a) quanto a obrigatoriedade do uso continuo dos Protetores Auditivos, dos riscos que estarei exposto e dos cuidados que deverei ter com a audição estando consciente de que o não cumprimento as orientações poderão acarretar agravamento da perda auditiva.
             </Text>
          </View>

          {/* Data de localidade alinhada à direita e com menor espaçamento vertical da seção acima */}
          <View style={{ padding: 8, marginTop: 10,paddingRight:20 }}>
             <Text style={{fontSize: 9, textAlign: 'right'}}>
                {`Conselheiro Lafaiete, ${dataFormatada}.`}
             </Text>
          </View>

          {/* Assinaturas finais alinhadas mais próximas à data de localidade */}
          <View style={{ padding: 8, marginTop: 35 }}>
             {/* Contêiner flexível para colocar as duas colunas de assinaturas lado a lado com espaçamento uniforme */}
             <View style={{flexDirection: 'row', justifyContent: 'space-around', marginTop: 10}}>
                {/* Coluna da assinatura do funcionário ocupando 40% de largura horizontal */}
                <View style={{alignItems: 'center', width: '40%'}}>
                   {/* Renderiza a assinatura digitalizada se disponível, elevando-a com margem negativa */}
                   {termoData?.employeeSignature && <Image src={termoData.employeeSignature} style={{width: 80, height: 30, marginBottom: -15}} />}
                   {/* Linha preta superior indicando o campo de assinatura do funcionário */}
                   <View style={{borderTopWidth: 1, borderTopColor: PRETO, width: '100%', marginTop: 20, paddingTop: 5, alignItems: 'center'}}>
                     {/* Rótulo em negrito indicando o funcionário */}
                     <Text style={{fontSize: 8, fontFamily: 'Helvetica-Bold'}}>ASSINATURA DO FUNCIONÁRIO(A)</Text>
                   </View>
                </View>
                {/* Coluna da assinatura do fonoaudiólogo ocupando 40% de largura horizontal */}
                <View style={{alignItems: 'center', width: '40%'}}>
                   {/* Renderiza a assinatura oficial do profissional em imagem estática */}
                   <Image src={sigImage} style={{width: 80, height: 30, marginBottom: -15}} />
                   {/* Linha preta superior indicando o campo de assinatura do profissional */}
                   <View style={{borderTopWidth: 1, borderTopColor: PRETO, width: '100%', marginTop: 20, paddingTop: 5, alignItems: 'center'}}>
                     {/* Rótulo em negrito indicando o fonoaudiólogo */}
                     <Text style={{fontSize: 8, fontFamily: 'Helvetica-Bold'}}>ASSINATURA DO FONOAUDIÓLOGO(A)</Text>
                   </View>
                </View>
             </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};
