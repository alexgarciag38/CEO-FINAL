import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, ok, fail } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'GET' && req.method !== 'POST') return new Response('Not Found', { status: 404, headers: corsHeaders });
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    await getUserOr401(supabase);
    const url = new URL(req.url);
    let incidentId = url.searchParams.get('incident_id');
    if (!incidentId && req.method === 'POST') {
      try {
        const body = await req.json();
        incidentId = body?.incident_id ?? null;
      } catch { /* ignore */ }
    }
    if (!incidentId) return new Response(JSON.stringify({ error: 'incident_id requerido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data, error: err } = await supabase
      .from('incident_comments')
      .select('id, created_at, comment, user_id')
      .eq('incident_id', incidentId)
      .order('created_at', { ascending: true });
    if (err) throw err;
    return ok({ items: data });
  } catch (e) {
    return fail(e);
  }
});


