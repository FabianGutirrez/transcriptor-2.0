/// <reference types="vite/client" />
import { createClient } from '@supabase/supabase-js';

let supabaseClient: ReturnType<typeof createClient> | null = null;

export const getSupabase = () => {
  if (supabaseClient) return supabaseClient;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Configuración de Supabase incompleta. Por favor, configura VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY en la configuración del proyecto.');
  }

  supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseClient;
};

// Re-exportamos una instancia proxy o la función directamente
export const supabase = {
  get auth() { return getSupabase().auth; },
  get storage() { return getSupabase().storage; },
  from: (table: string) => getSupabase().from(table),
};
