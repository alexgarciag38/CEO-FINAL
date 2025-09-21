import { supabase } from '@/lib/supabase';

export async function invoke<T = any>(name: string, options?: { body?: any; searchParams?: Record<string, string | number | boolean> }) {
  const mergedBody = options?.body ?? (options?.searchParams ? options.searchParams : undefined);
  const { data: sessionData } = await supabase.auth.getSession();
  const token = sessionData?.session?.access_token;
  const { data, error } = await supabase.functions.invoke(name, {
    body: mergedBody,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  } as any);
  if (error) throw error;
  return data as T;
}


