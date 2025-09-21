import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, ok, fail, readJson } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'GET' && req.method !== 'POST') return new Response('Not Found', { status: 404, headers: corsHeaders });
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    await getUserOr401(supabase);
    let includeInactive = false;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      includeInactive = url.searchParams.get('all') === 'true';
    } else {
      const body = await readJson<any>(req);
      includeInactive = String(body?.all) === 'true' || body?.all === true;
    }
    const query = supabase.from('incident_types').select('id, name, description, color_hex, is_active, created_at').order('name');
    if (!includeInactive) query.eq('is_active', true);
    const { data, error: err } = await query;
    if (err) throw err;
    return ok({ items: data });
  } catch (e) {
    return fail(e);
  }
});


