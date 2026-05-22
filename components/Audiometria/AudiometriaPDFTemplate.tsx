import React from 'react';
import { Document, Page, Text, View, StyleSheet, Image, Svg, Line, Circle, Path } from '@react-pdf/renderer';
import sigImage from '../ui/grade/sig.png';

// ---- Paleta de Cores ----
const AZUL = '#080808ff';   // Azul Gama Center para valores marcados
const PRETO = '#000000';
const CINZA = '#888888';
const BORDA = '#cccccc';

export interface AudiometriaPDFProps {
  patientData: any;
  anamneseAnswers: Record<string, string>;
  audiometroData: any;
  logoAudiometriaData: any;
  laudoData: any;
  gradeData: any;
  observacoes: string;
  meatoscopiaOD: string;
  meatoscopiaOE: string;
  employeeSignature?: string | null;
  tipoExame: string;
  termoData: any;
}

// ---- Estilos globais ----
const S = StyleSheet.create({
  // Página A4
  page: { flexDirection: 'column', backgroundColor: '#ffffff', paddingHorizontal: 28, paddingVertical: 22, fontSize: 8.5 },

  // Cabeçalho
  cabecalho: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: CINZA, paddingBottom: 6, marginBottom: 12 },
  logoBox: { width: 44, height: 44, marginRight: 10, backgroundColor: '#e8f4fb', justifyContent: 'center', alignItems: 'center' },
  logoLetra: { fontSize: 22, color: AZUL },
  cabecalhoTextos: { flex: 1, alignItems: 'center' },
  cabecalhoTitulo: { fontSize: 9, fontFamily: 'Helvetica-Bold', textDecoration: 'underline', textAlign: 'center' },
  cabecalhoLinha: { fontSize: 7, color: '#444', marginTop: 1, textAlign: 'center' },

  // Título da Página
  tituloPagina: { fontSize: 13, fontFamily: 'Helvetica-Bold', textAlign: 'center', marginBottom: 10, letterSpacing: 0.8 },

  // Caixa / Seção
  caixa: { borderWidth: 1, borderColor: BORDA, padding: 7, marginBottom: 8 },
  caixaTitulo: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', marginBottom: 6, textTransform: 'uppercase' },

  // Linha genérica
  linha: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },

  // Campo com underline
  campoLabel: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', marginRight: 4, textTransform: 'uppercase', color: PRETO },
  campoValor: { fontSize: 8, flex: 1, borderBottomWidth: 1, borderBottomColor: PRETO, paddingBottom: 1, color: PRETO },

  // Questão principal (negrito)
  qLabel: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: PRETO, marginRight: 4 },

  // Texto da condicional (recuado, menor)
  subLabel: { fontSize: 8, color: '#444', marginRight: 4 },

  // Texto do valor destaque (azul negrito)
  valorDestaque: { fontSize: 8.5, fontFamily: 'Helvetica-Bold', color: AZUL },

  // Opção de checkbox: "( ) Label" ou "(X) Label"
  opcaoView: { flexDirection: 'row', alignItems: 'center', marginRight: 10 },
  opcaoMarcaChecked: { fontSize: 8.5, color: AZUL, fontFamily: 'Helvetica-Bold', marginRight: 2 },
  opcaoMarcaEmpty: { fontSize: 8.5, color: PRETO, marginRight: 2 },
  opcaoTextoChecked: { fontSize: 8.5, color: AZUL, fontFamily: 'Helvetica-Bold' },
  opcaoTextoEmpty: { fontSize: 8.5, color: PRETO },

  // Linha de questão sem wrap para compatibilidade
  qLinha: { flexDirection: 'row', alignItems: 'center', marginBottom: 5 },
  // Container de checkbox em linha que simula wrap se necessário (melhor evitar flexWrap no react-pdf em Views que tem Text variados)
  qChecks: { flexDirection: 'row', alignItems: 'center' },

  // Recuo para condicionais
  recuo: { marginLeft: 18, marginBottom: 3 },

  // Separador horizontal
  separador: { borderBottomWidth: 1, borderBottomColor: BORDA, marginBottom: 6, marginTop: 2 },

  // Tabelas
  table: { width: '100%', borderWidth: 1, borderColor: BORDA, marginBottom: 8 },
  tableRowView: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: BORDA },
  tableColHeader: { flex: 1, borderRightWidth: 1, borderRightColor: BORDA, padding: 3, alignItems: 'center' },
  tableColData: { flex: 1, borderRightWidth: 1, borderRightColor: BORDA, padding: 3, alignItems: 'center' },
  tableHeaderText: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', textAlign: 'center' },
  tableCellText: { fontSize: 7.5, textAlign: 'center' },

  // Grade audiométrica
  gradeContainer: { width: '100%', height: 195, position: 'relative', borderWidth: 1, borderColor: BORDA },
  gradeSvg: { width: '100%', height: '100%', position: 'absolute' },
});

// ============================
// Componente: Checkbox Opção
// Renderiza "(X) Texto" se marcado ou "( ) Texto" se não marcado
// ============================
const Opcao = ({ marcado, texto }: { marcado: boolean; texto: string }) => (
  <View style={S.opcaoView}>
    <Text style={marcado ? S.opcaoMarcaChecked : S.opcaoMarcaEmpty}>
      {marcado ? '(X)' : '( )'}
    </Text>
    <Text style={marcado ? S.opcaoTextoChecked : S.opcaoTextoEmpty}>{texto}</Text>
  </View>
);

// ============================
// Componente: Campo com underline
// ============================
const Campo = ({ label, valor, largura = '100%' }: { label: string; valor?: string; largura?: string | number }) => (
  <View style={[S.linha, { width: largura as any }]}>
    <Text style={S.campoLabel}>{label}:</Text>
    <Text style={S.campoValor}>{valor || ''}</Text>
  </View>
);

export const AudiometriaPDFTemplate = ({
  patientData, anamneseAnswers, audiometroData, logoAudiometriaData, laudoData, gradeData, observacoes, meatoscopiaOD, meatoscopiaOE, employeeSignature, tipoExame, termoData
}: AudiometriaPDFProps) => {

  // --- CABEÇALHO GLOBAL ---
  const Header = () => (
    <View style={S.cabecalho}>
      <View style={S.logoBox}>
        <Text style={S.logoLetra}>G</Text>
      </View>
      <View style={S.cabecalhoTextos}>
        <Text style={S.cabecalhoTitulo}>GAMA CENTER MEDICINA OCUPACIONAL E ENGENHARIA DE SEGURANÇA</Text>
        <Text style={S.cabecalhoLinha}>Rua Barão de Pouso Alegre, 90, São Sebastião, Conselheiro Lafaiete/MG</Text>
        <Text style={S.cabecalhoLinha}>Telefone: (31) 3761-2417 / WhatsApp: (31) 97192-0766</Text>
        <Text style={S.cabecalhoLinha}>Email: contato@gamacentersst.com.br Site: www.gamacentersst.com.br</Text>
      </View>
    </View>
  );

  // Helper para SVG da Audiometria
  const renderCross = (cx: number, cy: number, color: string) => {
    const s = 4.5;
    return <Path d={`M ${cx - s} ${cy - s} L ${cx + s} ${cy + s} M ${cx + s} ${cy - s} L ${cx - s} ${cy + s}`} stroke={color} strokeWidth={2} />;
  };
  const renderSetaEsq = (cx: number, cy: number, color: string) => {
    const s = 6;
    return <Path d={`M ${cx + s} ${cy - s} L ${cx} ${cy} L ${cx + s} ${cy + s}`} stroke={color} strokeWidth={2} fill="none" />;
  };
  const renderSetaDir = (cx: number, cy: number, color: string) => {
    const s = 6;
    return <Path d={`M ${cx - s} ${cy - s} L ${cx} ${cy} L ${cx - s} ${cy + s}`} stroke={color} strokeWidth={2} fill="none" />;
  };

  return (
    <Document>
      {/* ======================= PÁGINA 1: ANAMNESE ======================= */}
      <Page size="A4" style={S.page}>
        <Header />
        <Text style={S.tituloPagina}>ANAMNESE OCUPACIONAL</Text>
        
        {/* DADOS DO PACIENTE */}
        <View style={S.caixa}>
          <Text style={S.caixaTitulo}>DADOS DO PACIENTE</Text>
          <View style={[S.linha, {marginBottom: 10}]}>
            <Campo label="EMPRESA" valor={patientData?.empresa} largura="30%" />
            <Campo label="FUNÇÃO" valor={patientData?.funcao} largura="30%" />
          </View>
          <View style={S.linha}>
            <Campo label="NOME" valor={patientData?.nome} largura="30%" />
            <Campo label="DATA" valor={patientData?.dataExame} largura="30%" />
          </View>
        </View>

        {/* QUESTIONÁRIO */}
        <View style={[S.caixa, { paddingBottom: 8 }]}>

          {/* Q1: Exame anterior */}
          <View style={S.qLinha}>
            <Text style={S.qLabel}>Já realizou exame audiométrico anteriormente?</Text>
            <View style={S.qChecks}>
              <Opcao marcado={anamneseAnswers?.q1 === 'sim'} texto="Sim" />
              <Opcao marcado={anamneseAnswers?.q1 === 'nao'} texto="Não" />
            </View>
          </View>
          {anamneseAnswers?.q1 === 'sim' && (
            <View style={S.recuo}>
              <View style={S.qLinha}>
                <Text style={S.subLabel}>Se respondeu 'sim', qual o resultado? </Text>
                <View style={S.qChecks}>
                  <Opcao marcado={anamneseAnswers?.q1_result === 'normal'} texto="Normal" />
                  <Opcao marcado={anamneseAnswers?.q1_result === 'alterado'} texto="Alterado" />
                </View>
              </View>
              {anamneseAnswers?.q1_result === 'alterado' && (
                <View style={S.qLinha}>
                  <Text style={S.subLabel}>Se alterado, em qual ouvido? </Text>
                  <View style={S.qChecks}>
                    <Opcao marcado={anamneseAnswers?.q1_ear === 'od'} texto="OD" />
                    <Opcao marcado={anamneseAnswers?.q1_ear === 'oe'} texto="OE" />
                    <Opcao marcado={anamneseAnswers?.q1_ear === 'ambos'} texto="Ambos" />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* Q2: Exposição ao ruído */}
          <View style={S.qLinha}>
            <Text style={S.qLabel}>Trabalha ou já trabalhou exposto ao ruído?</Text>
            <View style={S.qChecks}>
              <Opcao marcado={anamneseAnswers?.q2 === 'sim'} texto="Sim" />
              <Opcao marcado={anamneseAnswers?.q2 === 'nao'} texto="Não" />
            </View>
            {anamneseAnswers?.q2 === 'sim' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
                <Text style={S.subLabel}>Por quanto tempo?</Text>
                <Text style={S.valorDestaque}> {anamneseAnswers?.q2_tempo_val || '0'} {anamneseAnswers?.q2_tempo_unidade || 'anos'}</Text>
              </View>
            )}
          </View>

          {/* Q3: Protetor auricular */}
          <View style={S.qLinha}>
            <Text style={S.qLabel}>Usa ou já usou protetor no ouvido?</Text>
            <View style={S.qChecks}>
              <Opcao marcado={anamneseAnswers?.q3 === 'sim'} texto="Sim" />
              <Opcao marcado={anamneseAnswers?.q3 === 'nao'} texto="Não" />
            </View>
          </View>
          {anamneseAnswers?.q3 === 'sim' && (
            <View style={S.recuo}>
              <View style={S.qLinha}>
                <Text style={S.subLabel}>Qual? </Text>
                <View style={S.qChecks}>
                  <Opcao marcado={anamneseAnswers?.q3_type === 'plug'} texto="Plug" />
                  <Opcao marcado={anamneseAnswers?.q3_type === 'concha'} texto="Concha" />
                  <Opcao marcado={anamneseAnswers?.q3_type === 'ambos'} texto="Ambos" />
                </View>
              </View>
            </View>
          )}

          {/* Q4: Hábitos */}
          <View style={S.qLinha}>
            <Text style={S.qLabel}>Possui esses hábitos?</Text>
            <View style={S.qChecks}>
              <Opcao marcado={anamneseAnswers?.q4_moto === 'sim'} texto="Motociclismo" />
              <Opcao marcado={anamneseAnswers?.q4_fone === 'sim'} texto="Fone de ouvido" />
              <Opcao marcado={anamneseAnswers?.q4_musico === 'sim'} texto="Músico" />
              <Opcao marcado={anamneseAnswers?.q4_nenhum === 'sim'} texto="Nenhum" />
            </View>
          </View>

          {/* Q8: Cirurgia */}
          <View style={S.qLinha}>
            <Text style={S.qLabel}>Já realizou cirurgia no ouvido?</Text>
            <View style={S.qChecks}>
              <Opcao marcado={anamneseAnswers?.q8 === 'sim'} texto="Sim" />
              <Opcao marcado={anamneseAnswers?.q8 === 'nao'} texto="Não" />
            </View>
          </View>
          {anamneseAnswers?.q8 === 'sim' && (
            <View style={S.recuo}>
              <View style={S.qLinha}>
                <Text style={S.subLabel}>Qual ouvido? </Text>
                <View style={S.qChecks}>
                  <Opcao marcado={anamneseAnswers?.q8_ear === 'od'} texto="OD" />
                  <Opcao marcado={anamneseAnswers?.q8_ear === 'oe'} texto="OE" />
                  <Opcao marcado={anamneseAnswers?.q8_ear === 'ambos'} texto="Ambos" />
                </View>
              </View>
            </View>
          )}

          {/* Q9: Trauma */}
          <View style={S.qLinha}>
            <Text style={S.qLabel}>Já sofreu algum trauma no ouvido?</Text>
            <View style={S.qChecks}>
              <Opcao marcado={anamneseAnswers?.q9 === 'sim'} texto="Sim" />
              <Opcao marcado={anamneseAnswers?.q9 === 'nao'} texto="Não" />
            </View>
          </View>
          {anamneseAnswers?.q9 === 'sim' && (
            <View style={S.recuo}>
              <View style={S.qLinha}>
                <Text style={S.subLabel}>Qual ouvido? </Text>
                <View style={S.qChecks}>
                  <Opcao marcado={anamneseAnswers?.q9_ear === 'od'} texto="OD" />
                  <Opcao marcado={anamneseAnswers?.q9_ear === 'oe'} texto="OE" />
                  <Opcao marcado={anamneseAnswers?.q9_ear === 'ambos'} texto="Ambos" />
                </View>
              </View>
            </View>
          )}

          {/* Q11: Doenças crônicas */}
          <View style={S.qLinha}>
            <Text style={S.qLabel}>Já teve ou tem:</Text>
            <View style={S.qChecks}>
              <Opcao marcado={anamneseAnswers?.q11_hipertensao === 'sim'} texto="hipertensão" />
              <Opcao marcado={anamneseAnswers?.q11_diabetes === 'sim'} texto="diabetes" />
              <Opcao marcado={anamneseAnswers?.q11_cardiacos === 'sim'} texto="problemas cardíacos" />
              <Opcao marcado={anamneseAnswers?.q11_nenhum === 'sim'} texto="nenhum" />
            </View>
          </View>
          {anamneseAnswers?.q11_outros && (
            <View style={S.recuo}>
              <View style={S.qLinha}>
                <Text style={S.subLabel}>Outros:</Text>
                <Text style={S.valorDestaque}> {anamneseAnswers.q11_outros}</Text>
              </View>
            </View>
          )}

          {/* Q12: Tontura */}
          <View style={S.qLinha}>
            <Text style={S.qLabel}>Apresenta tontura?</Text>
            <View style={S.qChecks}>
              <Opcao marcado={anamneseAnswers?.q12_tontura === 'sim'} texto="Sim" />
              <Opcao marcado={anamneseAnswers?.q12_tontura === 'nao'} texto="Não" />
            </View>
            {anamneseAnswers?.q12_tontura === 'sim' && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
                <Text style={S.subLabel}>A cada:</Text>
                <Text style={S.valorDestaque}> {anamneseAnswers?.q12_frequencia_val || '0'} {anamneseAnswers?.q12_frequencia_unidade || 'horas'}</Text>
              </View>
            )}
          </View>

          {/* Q13: Zumbido */}
          <View style={S.qLinha}>
            <Text style={S.qLabel}>Apresenta zumbido?</Text>
            <View style={S.qChecks}>
              <Opcao marcado={anamneseAnswers?.q13 === 'sim'} texto="Sim" />
              <Opcao marcado={anamneseAnswers?.q13 === 'nao'} texto="Não" />
            </View>
          </View>
          {anamneseAnswers?.q13 === 'sim' && (
            <View style={S.recuo}>
              <View style={S.qLinha}>
                <Text style={S.subLabel}>Qual ouvido? </Text>
                <View style={S.qChecks}>
                  <Opcao marcado={anamneseAnswers?.q13_ear === 'od'} texto="OD" />
                  <Opcao marcado={anamneseAnswers?.q13_ear === 'oe'} texto="OE" />
                  <Opcao marcado={anamneseAnswers?.q13_ear === 'ambos'} texto="Ambos" />
                </View>
              </View>
              {anamneseAnswers?.q13_frequencia && (
                <View style={S.qLinha}>
                  <Text style={S.subLabel}>Qual a frequência?</Text>
                  <Text style={S.valorDestaque}> {anamneseAnswers.q13_frequencia}</Text>
                </View>
              )}
            </View>
          )}

          {/* Q14: Histórico familiar */}
          <View style={S.qLinha}>
            <Text style={S.qLabel}>Tem casos de problemas auditivos na família?</Text>
            <View style={S.qChecks}>
              <Opcao marcado={anamneseAnswers?.q14 === 'sim'} texto="Sim" />
              <Opcao marcado={anamneseAnswers?.q14 === 'nao'} texto="Não" />
            </View>
            {anamneseAnswers?.q14 === 'sim' && anamneseAnswers?.q14_parentesco && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginLeft: 6 }}>
                <Text style={S.subLabel}>Parentesco:</Text>
                <Text style={S.valorDestaque}> {anamneseAnswers.q14_parentesco}</Text>
              </View>
            )}
          </View>

          {/* Q15: Objeto para limpar */}
          <View style={S.qLinha}>
            <Text style={S.qLabel}>Usa algum objeto para limpar o ouvido?</Text>
            <View style={S.qChecks}>
              <Opcao marcado={anamneseAnswers?.q15 === 'sim'} texto="Sim" />
              <Opcao marcado={anamneseAnswers?.q15 === 'nao'} texto="Não" />
            </View>
          </View>
          {anamneseAnswers?.q15 === 'sim' && (
            <View style={S.recuo}>
              <View style={S.qLinha}>
                <Text style={S.subLabel}>Qual objeto? </Text>
                <View style={S.qChecks}>
                  <Opcao marcado={anamneseAnswers?.q15_object === 'cotonete'} texto="Hastes de Algodão" />
                  <Opcao marcado={anamneseAnswers?.q15_object === 'outro'} texto="Outro" />
                </View>
                {anamneseAnswers?.q15_object === 'outro' && anamneseAnswers?.q15_outro_text && (
                  <Text style={S.valorDestaque}> {anamneseAnswers.q15_outro_text}</Text>
                )}
              </View>
            </View>
          )}

        </View>

        {/* OBSERVAÇÃO DA ANAMNESE */}
        <View style={[S.caixa, { marginTop: 4 }]}>
          <Campo label="OBSERVAÇÃO" valor={anamneseAnswers?.anamneseObservacao || ''} />
        </View>
      </Page>


      {/* ======================= PÁGINA 2: PROTOCOLO DE AUDIOMETRIA ======================= */}
      <Page size="A4" style={S.page}>
        <Header />
        <Text style={S.tituloPagina}>PROTOCOLO DE AUDIOMETRIA OCUPACIONAL</Text>
        
        {/* IDENTIFICAÇÃO DO EXAME */}
        <View style={S.caixa}>
           <Text style={S.caixaTitulo}>DADOS DO PACIENTE</Text>
           <View style={S.linha}>
             <Campo label="EMPRESA" valor={patientData?.empresa} largura="50%" />
             <Campo label="NOME" valor={patientData?.nome} largura="50%" />
           </View>
           <View style={S.linha}>
             <Campo label="FUNÇÃO" valor={patientData?.funcao} largura="50%" />
             <View style={[S.linha, {width: '50%'}]}>
               <Text style={S.campoLabel}>SEXO: </Text>
               <Opcao marcado={patientData?.sexo === 'Feminino'} texto="Feminino" />
               <Opcao marcado={patientData?.sexo === 'Masculino'} texto="Masculino" />
             </View>
           </View>
           <View style={S.linha}>
             <Campo label="CPF" valor={patientData?.documento} largura="50%" />
             <Campo label="RG" valor={patientData?.rg} largura="50%" />
           </View>
           <View style={S.linha}>
             <Campo label="NASC." valor={patientData?.dataNascimento} largura="33%" />
             <Campo label="EXAME" valor={patientData?.dataExame} largura="33%" />
             <Campo label="REPOUSO" valor={patientData?.repouso || '14 horas'} largura="34%" />
           </View>
        </View>

        {/* TIPO DE EXAME */}
        <View style={S.caixa}>
           <Text style={[S.caixaTitulo, {textAlign: 'center'}]}>TIPO DE EXAME</Text>
           <View style={{flexDirection: 'row', justifyContent: 'space-between', marginTop: 5}}>
              <Opcao marcado={tipoExame === 'Admissional'} texto="ADMISSIONAL" />
              <Opcao marcado={tipoExame === 'Periódico'} texto="PERIÓDICO" />
              <Opcao marcado={tipoExame === 'Demissional'} texto="DEMISSIONAL" />
              <Opcao marcado={tipoExame === 'Retorno'} texto="RETORNO" />
              <Opcao marcado={tipoExame === 'Mudança'} texto="MUDANÇA" />
           </View>
        </View>

        {/* MEATOSCOPIA */}
        <View style={S.caixa}>
           <Text style={[S.caixaTitulo, {textAlign: 'center'}]}>MEATOSCOPIA</Text>
           <View style={{marginBottom: 8}}><Campo label="ORELHA DIREITA (OD)" valor={meatoscopiaOD} /></View>
           <View><Campo label="ORELHA ESQUERDA (OE)" valor={meatoscopiaOE} /></View>
        </View>

        {/* GRÁFICOS (OD e OE lado a lado) */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 }}>
           <View style={[S.caixa, { width: '49%' }]}>
              <Text style={[S.caixaTitulo, {color: 'red', textAlign: 'center'}]}>ORELHA DIREITA (OD)</Text>
              <View style={S.gradeContainer}>
                 <Svg viewBox="0 0 750 583" style={S.gradeSvg}>
                    {/* Desenhar Grade Básica para o PDF se não tiver imagem */}
                    <Line x1="50" y1="52" x2="700" y2="52" stroke="#ccc" strokeWidth="1" />
                    {gradeData?.linesOD?.map((l: any, i: number) => {
                      const p1 = gradeData.pointsOD[l.fromIndex]; const p2 = gradeData.pointsOD[l.toIndex];
                      if(!p1||!p2) return null; return <Line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="red" strokeWidth={3} />
                    })}
                    {gradeData?.pointsOD?.map((p: any, i: number) => {
                      if(p.symbol==='bolinha') return <Circle key={i} cx={p.x} cy={p.y} r={8} stroke="red" strokeWidth={3} fill="none"/>;
                      if(p.symbol==='<') return renderSetaEsq(p.x, p.y, 'red'); return null;
                    })}
                 </Svg>
              </View>
           </View>
           <View style={[S.caixa, { width: '49%' }]}>
              <Text style={[S.caixaTitulo, {color: 'blue', textAlign: 'center'}]}>ORELHA ESQUERDA (OE)</Text>
              <View style={S.gradeContainer}>
                 <Svg viewBox="0 0 750 583" style={S.gradeSvg}>
                    {gradeData?.linesOE?.map((l: any, i: number) => {
                      const p1 = gradeData.pointsOE[l.fromIndex]; const p2 = gradeData.pointsOE[l.toIndex];
                      if(!p1||!p2) return null; return <Line key={i} x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y} stroke="blue" strokeWidth={3} />
                    })}
                    {gradeData?.pointsOE?.map((p: any, i: number) => {
                      if(p.symbol==='X') return renderCross(p.x, p.y, 'blue');
                      if(p.symbol==='>') return renderSetaDir(p.x, p.y, 'blue'); return null;
                    })}
                 </Svg>
              </View>
           </View>
        </View>

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
           {/* LOGOAUDIOMETRIA / LRF */}
           <View style={[S.caixa, { width: '100%' }]}>
              <Text style={[S.caixaTitulo, {textAlign: 'center'}]}>LOGOAUDIOMETRIA</Text>
              <View style={S.table}>
                <View style={S.tableRowView}>
                  <View style={S.tableColHeader}><Text style={S.tableHeaderText}>LRF</Text></View>
                  <View style={S.tableColHeader}><Text style={S.tableHeaderText}>Intensid.</Text></View>
                  <View style={S.tableColHeader}><Text style={S.tableHeaderText}>Monossil.</Text></View>
                  <View style={S.tableColHeader}><Text style={S.tableHeaderText}>Dissil.</Text></View>
                </View>
                <View style={S.tableRowView}>
                  <View style={S.tableColHeader}><Text style={S.tableHeaderText}>OD</Text></View>
                  <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.lrfODIntensidade}</Text></View>
                  <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.lrfODMonossil}</Text></View>
                  <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.lrfODDissil}</Text></View>
                </View>
                <View style={S.tableRowView}>
                  <View style={S.tableColHeader}><Text style={S.tableHeaderText}>OE</Text></View>
                  <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.lrfOEIntensidade}</Text></View>
                  <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.lrfOEMonossil}</Text></View>
                  <View style={S.tableColData}><Text style={S.tableCellText}>{logoAudiometriaData?.lrfOEDissil}</Text></View>
                </View>
              </View>
           </View>
        </View>

        {/* LAUDO FINAL */}
        <View style={S.caixa}>
           <Text style={S.caixaTitulo}>LAUDO</Text>
           <View style={S.qLinha}>
             <Text style={S.campoLabel}>Limiares auditivos aceitáveis: </Text>
             <Opcao marcado={laudoData?.limiaresAceitaveis?.od} texto="OD" />
             <Opcao marcado={laudoData?.limiaresAceitaveis?.oe} texto="OE" />
             <Opcao marcado={laudoData?.limiaresAceitaveis?.bilateral} texto="Bilateral" />
           </View>
           <Text style={[S.campoLabel, {marginTop: 5, marginBottom: 5}]}>Perda auditiva:</Text>
           <View style={S.qLinha}>
             <Text style={S.campoLabel}>OD: </Text>
             <Opcao marcado={laudoData?.perdaOD?.neurosensorial} texto="Neurosensorial" />
             <Opcao marcado={laudoData?.perdaOD?.mista} texto="Mista" />
             <Opcao marcado={laudoData?.perdaOD?.condutiva} texto="Condutiva" />
           </View>
           <View style={S.qLinha}>
             <Text style={S.campoLabel}>OE: </Text>
             <Opcao marcado={laudoData?.perdaOE?.neurosensorial} texto="Neurosensorial" />
             <Opcao marcado={laudoData?.perdaOE?.mista} texto="Mista" />
             <Opcao marcado={laudoData?.perdaOE?.condutiva} texto="Condutiva" />
           </View>
           <View style={{marginTop: 5}}><Campo label="Obs" valor={observacoes} /></View>
        </View>

      </Page>

      {/* ======================= PÁGINA 3: TERMO DE RECONHECIMENTO ======================= */}
      <Page size="A4" style={S.page}>
         <Header />
         <Text style={S.tituloPagina}>TERMO DE RECONHECIMENTO DE PERDA AUDITIVA</Text>
         <Text style={[S.tituloPagina, {fontSize: 10, marginTop: -10}]}>(NR 7 - PORTARIA 19, ANEXO I)</Text>
         
         <View style={S.caixa}>
           <Text style={S.caixaTitulo}>DADOS DE IDENTIFICAÇÃO DO COLABORADOR</Text>
           <View style={S.linha}>
             <Campo label="Nome" valor={termoData?.nome || patientData?.nome} largura="60%" />
             <Campo label="Documento" valor={termoData?.documento || patientData?.documento} largura="40%" />
           </View>
           <View style={S.linha}>
             <Campo label="Empresa" valor={termoData?.empresa || patientData?.empresa} largura="60%" />
             <Campo label="Função" valor={termoData?.funcao || patientData?.funcao} largura="40%" />
           </View>
         </View>

         <View style={S.caixa}>
            <Text style={{fontSize: 9, marginBottom: 10}}>
              Declaro que estou ciente que houve no exame audiométrico {tipoExame.toUpperCase()}, onde foi detectada alteração:
            </Text>
            <View style={{flexDirection: 'row', justifyContent: 'space-between'}}>
               <View style={[S.caixa, {width: '48%'}]}>
                  <Text style={S.caixaTitulo}>ORELHA DIREITA (OD)</Text>
                  <View style={{ flexDirection: 'column' }}>
                    <View style={{ marginBottom: 4 }}><Opcao marcado={termoData?.odAlterations?.neurosensorial} texto="Neurosensorial" /></View>
                    <View style={{ marginBottom: 4 }}><Opcao marcado={termoData?.odAlterations?.condutiva} texto="Condutiva" /></View>
                    <View style={{ marginBottom: 4 }}><Opcao marcado={termoData?.odAlterations?.mista} texto="Mista" /></View>
                    <View style={{ marginBottom: 4 }}><Opcao marcado={termoData?.odAlterations?.cerume} texto="Presença de cerume" /></View>
                  </View>
               </View>
               <View style={[S.caixa, {width: '48%'}]}>
                  <Text style={S.caixaTitulo}>ORELHA ESQUERDA (OE)</Text>
                  <View style={{ flexDirection: 'column' }}>
                    <View style={{ marginBottom: 4 }}><Opcao marcado={termoData?.oeAlterations?.neurosensorial} texto="Neurosensorial" /></View>
                    <View style={{ marginBottom: 4 }}><Opcao marcado={termoData?.oeAlterations?.condutiva} texto="Condutiva" /></View>
                    <View style={{ marginBottom: 4 }}><Opcao marcado={termoData?.oeAlterations?.mista} texto="Mista" /></View>
                    <View style={{ marginBottom: 4 }}><Opcao marcado={termoData?.oeAlterations?.cerume} texto="Presença de cerume" /></View>
                  </View>
               </View>
            </View>
         </View>

         <View style={S.caixa}>
           <Text style={S.caixaTitulo}>PERDA AUDITIVA POR FREQUÊNCIA</Text>
           <View style={S.qLinha}>
              <Text style={S.campoLabel}>OD: </Text>
              <Opcao marcado={termoData?.odAlterations?.h6000} texto="6000Hz" />
              <Opcao marcado={termoData?.odAlterations?.h8000} texto="8000Hz" />
              <Text style={[S.campoLabel, {marginLeft: 20}]}>OE: </Text>
              <Opcao marcado={termoData?.oeAlterations?.h6000} texto="6000Hz" />
              <Opcao marcado={termoData?.oeAlterations?.h8000} texto="8000Hz" />
           </View>
         </View>

         <View style={S.caixa}>
           <Text style={S.caixaTitulo}>OBS:</Text>
           <View style={{borderBottomWidth: 1, borderBottomColor: PRETO, height: 15, marginBottom: 5}}><Text style={{fontSize: 9}}>{termoData?.observacoes}</Text></View>
           <View style={{borderBottomWidth: 1, borderBottomColor: PRETO, height: 15, marginBottom: 5}} />
         </View>

         <View style={S.caixa}>
            <Text style={{fontSize: 8, lineHeight: 1.4}}>
              Declaro ainda que, fui orientado (a) quanto a obrigatoriedade do uso continuo dos Protetores Auditivos, dos riscos que estarei exposto e dos cuidados que deverei ter com a audição estando consciente de que o não cumprimento as orientações poderão acarretar agravamento da perda auditiva.
            </Text>
         </View>

         <Text style={{fontSize: 9, marginTop: 20}}>
            Conselheiro Lafaiete, ____ de _______________ de 202__.
         </Text>

         {/* ASSINATURAS */}
         <View style={{flexDirection: 'row', justifyContent: 'space-around', marginTop: 50}}>
            <View style={{alignItems: 'center', width: '40%'}}>
               {termoData?.employeeSignature && <Image src={termoData.employeeSignature} style={{width: 80, height: 30, marginBottom: -15}} />}
               <View style={{borderTopWidth: 1, borderTopColor: PRETO, width: '100%', marginTop: 20, paddingTop: 5, alignItems: 'center'}}>
                 <Text style={{fontSize: 8, fontFamily: 'Helvetica-Bold'}}>ASSINATURA DO FUNCIONÁRIO(A)</Text>
               </View>
            </View>
            <View style={{alignItems: 'center', width: '40%'}}>
               <Image src={sigImage} style={{width: 80, height: 30, marginBottom: -15}} />
               <View style={{borderTopWidth: 1, borderTopColor: PRETO, width: '100%', marginTop: 20, paddingTop: 5, alignItems: 'center'}}>
                 <Text style={{fontSize: 8, fontFamily: 'Helvetica-Bold'}}>ASSINATURA DO FONOAUDIÓLOGO(A)</Text>
               </View>
            </View>
         </View>
      </Page>
    </Document>
  );
};
