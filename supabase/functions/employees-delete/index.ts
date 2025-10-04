import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, ok, fail, readJson } from "../_shared/mod.ts";

// @ts-nocheck
interface Body { id?: string; hard?: boolean }

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (!['DELETE','POST'].includes(req.method)) return new Response('Not Found', { status: 404, headers: corsHeaders });

    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    await getUserOr401(supabase);

    let id: string | null = null; let hard = false;

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      id = url.searchParams.get('id');
      hard = url.searchParams.get('hard') === 'true';
    } else {
      const body = await readJson<Body>(req.clone());
      id = typeof body?.id === 'string' && body.id.trim().length > 0 ? body.id.trim() : null;
      hard = Boolean(body?.hard);
    }

    if (!id) return ok({ error: 'ID requerido' }, 400);

    if (!hard) {
      const { data, error: err } = await supabase
        .from('employees')
        .update({ is_active: false })
        .eq('id', id)
        .select('id')
        .single();
      if (err) {
        const anyErr = err as any;
        return ok({ error: anyErr?.message || 'Error desactivando', code: anyErr?.code ?? null, details: anyErr?.details ?? null, hint: anyErr?.hint ?? null }, 400);
      }
      return ok({ success: true, soft: true, id: data?.id });
    }

    // Hard delete: manejar FK
    const { error: delErr } = await supabase
      .from('employees')
      .delete()
      .eq('id', id);
    if (delErr) {
      const anyErr = delErr as any;
      // Si hay FK, sugerir soft delete
      return ok({ error: anyErr?.message || 'Error eliminando', code: anyErr?.code ?? null, fk_conflict: true, suggestion: 'Intenta eliminación suave (hard=false)' }, 400);
    }
    return ok({ success: true, soft: false });
  } catch (e) {
    return fail(e);
  }
});


