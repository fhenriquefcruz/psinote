import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Transitional legacy client.
// New PsiNote document uploads use Firebase Storage with Firebase Auth rules.
// Supabase remains here only so already-stored legacy objects can be removed
// during the migration window.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const deleteFromSupabase = async (path) => {
  if (!path) return;

  const { error } = await supabase.storage
    .from('documents')
    .remove([path]);

  if (error) throw error;
};
