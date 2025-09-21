import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, readJson, ok, fail } from "../_shared/mod.ts";

type Body = { name: string; email?: string };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST') return new Response('Not Found', { status: 404, headers: corsHeaders });
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    const user = await getUserOr401(supabase);
    const body = await readJson<Body>(req);
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
      return ok({ error: 'Nombre inválido' }, 400);
    }
    const { data, error: err } = await supabase.from('employees').insert({ name: body.name.trim(), email: body.email ?? null }).select('*').single();
    if (err) throw err;
    return ok({ item: data });
  } catch (e) {
    return fail(e);
  }
});


