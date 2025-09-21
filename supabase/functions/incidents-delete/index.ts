import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, ok, fail } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'DELETE' && req.method !== 'POST') return new Response('Not Found', { status: 404, headers: corsHeaders });
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    await getUserOr401(supabase);
    const url = new URL(req.url);
    let id = url.searchParams.get('id');
    if (!id && req.method === 'POST') {
      try { const body = await req.json(); id = body?.id ?? null; } catch {}
    }
    if (!id) return ok({ error: 'ID requerido' }, 400);
    const { error: err } = await supabase.from('incidents').delete().eq('id', id);
    if (err) throw err;
    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
});


