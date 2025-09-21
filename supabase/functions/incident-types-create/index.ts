import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, readJson, ok, fail } from "../_shared/mod.ts";

type Body = { name: string; description?: string; color_hex?: string };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST') return new Response('Not Found', { status: 404, headers: corsHeaders });
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    await getUserOr401(supabase);
    const body = await readJson<Body>(req);
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
      return ok({ error: 'Nombre inválido' }, 400);
    }
    const color = /^#([0-9a-fA-F]{6})$/.test(body.color_hex || '') ? body.color_hex : '#3B82F6';
    const { data, error: err } = await supabase.from('incident_types').insert({ name: body.name.trim(), description: body.description ?? null, color_hex: color }).select('*').single();
    if (err) throw err;
    return ok({ item: data });
  } catch (e) {
    return fail(e);
  }
});


