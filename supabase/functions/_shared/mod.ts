import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS'
};

export function getSupabaseWithAuth(req: Request) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) {
    return { error: new Response(JSON.stringify({ error: 'Falta autenticación' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }) };
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
    throw new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
  return data.user;
}

export async function readJson<T = any>(req: Request): Promise<T> {
  try {
    const body = await req.json();
    return body as T;
  } catch (_e) {
    throw new Response(JSON.stringify({ error: 'JSON inválido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
}

export function ok(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

export function fail(e: unknown) {
  if (e instanceof Response) return e;
  return new Response(JSON.stringify({ error: 'Error interno', details: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}


