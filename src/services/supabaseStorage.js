import { createClient } from '@supabase/supabase-js';

// Coloque diretamente (mas NÃO COMMITE se puder evitar - mas como é pública, não há problema grave)
const supabaseUrl = 'https://niqazhglxdaizhvtxreh.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5pcWF6aGdseGRhaXpodnR4cmVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MTA0MTIsImV4cCI6MjA5NzE4NjQxMn0.Zc3ligVxemi-vxYMxK9dJPSTxLOcI7Ynw6RIySDgwh0';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Upload de arquivo
export const uploadToSupabase = async (file, psychologistId, patientId = null) => {
  // Caminho: psychologistId/patientId/timestamp_nome
  const folder = patientId ? `${psychologistId}/${patientId}` : `${psychologistId}/geral`;
  const path = `${folder}/${Date.now()}_${file.name}`;

  const { data, error } = await supabase.storage
    .from('documents') // nome do bucket
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Pega URL pública
  const { data: urlData } = supabase.storage
    .from('documents')
    .getPublicUrl(path);

  return {
    fileURL: urlData.publicUrl,
    fileType: file.type,
    fileSize: file.size,
    path: path,
  };
};

// Deletar (opcional)
export const deleteFromSupabase = async (path) => {
  const { error } = await supabase.storage
    .from('documents')
    .remove([path]);
  if (error) throw error;
};
