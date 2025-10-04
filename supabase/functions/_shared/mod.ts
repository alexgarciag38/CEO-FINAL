import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
  'Content-Type': 'application/json'
};

export function getSupabaseWithAuth(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { error: new Response(JSON.stringify({ error: 'Falta autenticación' }), { status: 401, headers: corsHeaders }) };
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    { global: { headers: { Authorization: authHeader } } }
  );
  return { supabase };
}

export async function getUserOr401(supabase: any) {
  const { data } = await supabase.auth.getUser();
  if (!data?.user) {
    throw new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: corsHeaders });
  }
  return data.user;
}

export async function readJson<T = any>(req: Request): Promise<T> {
  try {
    const text = await req.text();
    if (!text || !text.trim()) return {} as T;
    try {
      return JSON.parse(text) as T;
    } catch {
      return {} as T;
    }
  } catch {
    return {} as T;
  }
}

export function ok(data: any = {}, status = 200) {
  return new Response(JSON.stringify(data ?? {}), { status, headers: corsHeaders });
}

export function fail(e: unknown, status = 500) {
  if (e instanceof Response) return e;
  const message =
    e instanceof Error ? e.message :
    typeof e === 'string' ? e :
    'Internal error';
  return new Response(JSON.stringify({ error: message }), { status, headers: corsHeaders });
}


