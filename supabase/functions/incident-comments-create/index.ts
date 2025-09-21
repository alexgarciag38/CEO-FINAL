import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, readJson, ok, fail } from "../_shared/mod.ts";

type Body = { incident_id: string; comment: string };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST') return new Response('Not Found', { status: 404, headers: corsHeaders });
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    await getUserOr401(supabase);
    const body = await readJson<Body>(req);
    if (!body.incident_id || !body.comment || body.comment.trim().length < 1) {
      return ok({ error: 'Datos inválidos' }, 400);
    }
    const { data, error: err } = await supabase.from('incident_comments').insert({ incident_id: body.incident_id, comment: body.comment.trim() }).select('*').single();
    if (err) throw err;
    return ok({ item: data });
  } catch (e) {
    return fail(e);
  }
});


