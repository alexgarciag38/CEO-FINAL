import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, ok, fail } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'DELETE') return new Response('Not Found', { status: 404, headers: corsHeaders });
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    await getUserOr401(supabase);
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const soft = url.searchParams.get('soft') !== 'false';
    if (!id) return ok({ error: 'ID requerido' }, 400);
    if (soft) {
      const { error: err } = await supabase.from('employees').update({ is_active: false }).eq('id', id);
      if (err) throw err;
      return ok({ success: true });
    }
    const { error: err2 } = await supabase.from('employees').delete().eq('id', id);
    if (err2) throw err2;
    return ok({ success: true });
  } catch (e) {
    return fail(e);
  }
});


