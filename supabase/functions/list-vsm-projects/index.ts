import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, ok, fail } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST' && req.method !== 'GET') {
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }

    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    const user = await getUserOr401(supabase);

    const { data, error: dbError } = await supabase
      .from('vsm_projects')
      .select('id, project_name, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (dbError) throw dbError;

    const items = (data ?? []).map((row: any) => ({ id: row.id as string, name: row.project_name as string, created_at: row.created_at as string }));
    return ok({ projects: items }, 200);
  } catch (e) {
    return fail(e);
  }
});



