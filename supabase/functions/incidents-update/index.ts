import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, readJson, ok, fail } from "../_shared/mod.ts";

type Body = {
  id: string;
  title?: string;
  description?: string | null;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'open' | 'in_progress' | 'resolved' | 'closed' | 'cancelled';
  due_date?: string | null;
  incident_at?: string | null;
  incident_type_id?: string;
  assigned_to_employee_id?: string;
  verified_by_employee_id?: string | null;
  resolution_details?: string | null;
  root_cause?: string | null;
  attachments_url?: string[];
};

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
    if (typeof body.title === 'string') updates.title = body.title.trim();
    if (typeof body.description !== 'undefined') updates.description = body.description;
    if (typeof body.priority !== 'undefined') updates.priority = body.priority;
    if (typeof body.status !== 'undefined') updates.status = body.status;
    if (typeof body.due_date !== 'undefined') updates.due_date = body.due_date;
    if (typeof body.incident_at !== 'undefined') updates.incident_at = body.incident_at;
    if (typeof body.incident_type_id !== 'undefined') updates.incident_type_id = body.incident_type_id;
    if (typeof body.assigned_to_employee_id !== 'undefined') updates.assigned_to_employee_id = body.assigned_to_employee_id;
    if (typeof body.verified_by_employee_id !== 'undefined') updates.verified_by_employee_id = body.verified_by_employee_id;
    if (typeof body.resolution_details !== 'undefined') updates.resolution_details = body.resolution_details;
    if (typeof body.root_cause !== 'undefined') updates.root_cause = body.root_cause;
    if (typeof body.attachments_url !== 'undefined') updates.attachments_url = body.attachments_url;
    if (body.status === 'resolved' && !updates['resolved_at']) updates['resolved_at'] = new Date().toISOString();
    const { data, error: err } = await supabase.from('incidents').update(updates).eq('id', body.id).select('*').single();
    if (err) throw err;
    return ok({ item: data });
  } catch (e) {
    return fail(e);
  }
});


