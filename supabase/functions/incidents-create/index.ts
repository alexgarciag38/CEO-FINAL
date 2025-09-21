import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, readJson, ok, fail } from "../_shared/mod.ts";

type Body = {
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  due_date?: string; // ISO date
  incident_type_id: string;
  assigned_to_employee_id: string;
  attachments_url?: string[];
  incident_at?: string; // ISO datetime
  status?: 'open' | 'in_progress' | 'resolved' | 'closed';
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST') return new Response('Not Found', { status: 404, headers: corsHeaders });
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    await getUserOr401(supabase);
    const body = await readJson<Body>(req);
    if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 3) {
      return ok({ error: 'Título inválido' }, 400);
    }
    if (!['low','medium','high','critical'].includes(body.priority)) {
      return ok({ error: 'Prioridad inválida' }, 400);
    }
    if (!body.incident_type_id || !body.assigned_to_employee_id) {
      return ok({ error: 'Tipo y Asignado A son requeridos' }, 400);
    }
    const insertPayload: Record<string, unknown> = {
      title: body.title.trim(),
      description: body.description ?? null,
      priority: body.priority,
      due_date: body.due_date ?? null,
      incident_type_id: body.incident_type_id,
      assigned_to_employee_id: body.assigned_to_employee_id,
      attachments_url: Array.isArray(body.attachments_url) ? body.attachments_url : []
    };
    if (typeof body.incident_at === 'string' && body.incident_at.length > 0) {
      insertPayload.incident_at = body.incident_at;
    }
    if (typeof body.status !== 'undefined') {
      if (!['open','in_progress','resolved','closed'].includes(body.status)) {
        return ok({ error: 'Estado inválido' }, 400);
      }
      insertPayload.status = body.status;
      if (body.status === 'resolved') {
        insertPayload['resolved_at'] = new Date().toISOString();
      }
    }
    const { data, error: err } = await supabase
      .from('incidents')
      .insert(insertPayload)
      .select('*, incident_types(name), employees:assigned_to_employee_id(name)')
      .single();
    if (err) throw err;
    return ok({ item: data });
  } catch (e) {
    return fail(e);
  }
});


