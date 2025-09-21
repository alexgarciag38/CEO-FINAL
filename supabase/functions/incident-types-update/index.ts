import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, readJson, ok, fail } from "../_shared/mod.ts";

type Body = { id: string; name?: string; description?: string; is_active?: boolean; color_hex?: string };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'PUT' && req.method !== 'PATCH' && req.method !== 'POST') return new Response('Not Found', { status: 404, headers: corsHeaders });
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    await getUserOr401(supabase);
    const body = await readJson<Body>(req);
    if (!body.id) return ok({ error: 'ID requerido' }, 400);
    const updates: Record<string, unknown> = {};
    if (typeof body.name === 'string') updates.name = body.name.trim();
    if (typeof body.description !== 'undefined') updates.description = body.description || null;
    if (typeof body.is_active === 'boolean') updates.is_active = body.is_active;
    if (typeof body.color_hex === 'string' && /^#([0-9a-fA-F]{6})$/.test(body.color_hex)) updates.color_hex = body.color_hex;
    const { data, error: err } = await supabase.from('incident_types').update(updates).eq('id', body.id).select('*').single();
    if (err) throw err;
    return ok({ item: data });
  } catch (e) {
    return fail(e);
  }
});


