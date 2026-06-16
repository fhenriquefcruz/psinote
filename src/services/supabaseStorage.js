import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const uploadToSupabase = async (file, psychologistId, patientId = null) => {
  const folder = patientId ? `${psychologistId}/${patientId}` : `${psychologistId}/geral`;
  const path = `${folder}/${Date.now()}_${file.name}`;

  console.log('🔍 Enviando arquivo para:', path);

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream'
    });

  if (error) {
    console.error('❌ Erro no upload Supabase:', error);
    throw error;
  }

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

export const deleteFromSupabase = async (path) => {
  const { error } = await supabase.storage
    .from('documents')
    .remove([path]);
  if (error) throw error;
};
