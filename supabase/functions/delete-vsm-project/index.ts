import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, ok, fail, readJson } from "../_shared/mod.ts";

const BodySchema = z.object({ projectId: z.string().uuid() });

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST' && req.method !== 'DELETE') return new Response('Not Found', { status: 404, headers: corsHeaders });

    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    const user = await getUserOr401(supabase);

    const body = await readJson(req);
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Datos inválidos' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { projectId } = parsed.data;

    const { error: dbError } = await supabase
      .from('vsm_projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', user.id);
    if (dbError) throw dbError;

    return ok({ success: true }, 200);
  } catch (e) {
    return fail(e);
  }
});



