import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://wofipjazcxwxzzxjsflh.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndvZmlwamF6Y3h3eHp6eGpzZmxoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg4MDA2NjcsImV4cCI6MjA3NDM3NjY2N30.gKjTEhXbrvRxKcn3cNvgMlbigXypbshDWyVaLqDjcpQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanData() {
  const nomes = ['AQUI Arthur (TESTE)', 'Arthurrrrrr222333'];
  
  for (const nome of nomes) {
    console.log(`\n=================================================`);
    console.log(`Iniciando limpeza para: "${nome}"...`);
    
    // 1. Achar os colaboradores
    const { data: cols, error: errCol } = await supabase
      .from('colaboradores')
      .select('id, nome')
      .ilike('nome', `%${nome}%`);
      
    if (errCol) {
      console.error('Erro ao buscar colaborador:', errCol);
      continue;
    }
    
    if (!cols || cols.length === 0) {
      console.log('Nenhum colaborador encontrado com esse nome.');
      continue;
    }
    
    console.log(`Encontrados ${cols.length} colaboradores.`);
    const colIds = cols.map(c => c.id);
    
    // 2. Achar os agendamentos
    console.log('Buscando agendamentos...');
    const { data: agendamentos, error: errAg } = await supabase
      .from('agendamentos')
      .select('id')
      .in('colaborador_id', colIds);
      
    if (errAg) {
      console.error('Erro ao buscar agendamentos:', errAg);
      continue;
    }
    
    if (!agendamentos || agendamentos.length === 0) {
      console.log('Nenhum agendamento encontrado para esses colaboradores.');
    } else {
      const agIds = agendamentos.map(a => a.id);
      console.log(`Encontrados ${agIds.length} agendamentos. IDs:`, agIds);
      
      // 3. Deletar atendimentos relacionados aos agendamentos
      console.log('Deletando atendimentos relacionados...');
      const { error: errAtend } = await supabase
        .from('atendimentos')
        .delete()
        .in('agendamento_id', agIds);
        
      if (errAtend) console.error('Erro ao deletar atendimentos:', errAtend);
      else console.log('Atendimentos deletados.');
      
      // 4. Deletar audiometrias relacionadas ao colaborador
      console.log('Deletando audiometrias relacionadas...');
      const { error: errAudio } = await supabase
        .from('audiometria')
        .delete()
        .in('colaborador', colIds);
        
      if (errAudio) console.error('Erro ao deletar audiometria:', errAudio);
      else console.log('Audiometrias deletadas.');
      
      // 5. Deletar agendamentos
      console.log('Deletando agendamentos...');
      const { error: errDelAg } = await supabase
        .from('agendamentos')
        .delete()
        .in('id', agIds);
        
      if (errDelAg) console.error('Erro ao deletar agendamentos:', errDelAg);
      else console.log('Agendamentos deletados.');
    }
    
    // 6. Deletar colaboradores
    console.log('Deletando colaboradores...');
    const { error: errDelCol } = await supabase
      .from('colaboradores')
      .delete()
      .in('id', colIds);
      
    if (errDelCol) console.error('Erro ao deletar colaboradores:', errDelCol);
    else console.log('Colaboradores deletados.');
  }
  
  console.log('\n=================================================');
  console.log('Limpeza geral concluída!');
}

cleanData();
