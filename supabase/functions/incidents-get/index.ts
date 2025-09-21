import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, ok, fail, readJson } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'GET' && req.method !== 'POST') return new Response('Not Found', { status: 404, headers: corsHeaders });
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    await getUserOr401(supabase);
    let page = 1; let pageSize = 10; let status: string | null = null; let typeId: string | null = null; let assigneeId: string | null = null; let priority: 'low'|'medium'|'high'|'critical' | null = null;
    if (req.method === 'GET') {
      const url = new URL(req.url);
      page = Math.max(parseInt(url.searchParams.get('page') || '1'), 1);
      pageSize = Math.min(Math.max(parseInt(url.searchParams.get('pageSize') || '10'), 1), 50);
      status = url.searchParams.get('status');
      typeId = url.searchParams.get('type');
      assigneeId = url.searchParams.get('assignee');
      const p = url.searchParams.get('priority');
      priority = (p === 'low' || p === 'medium' || p === 'high' || p === 'critical') ? p : null;
    } else {
      const body = await readJson<any>(req);
      page = Math.max(parseInt(String(body?.page ?? '1')), 1);
      pageSize = Math.min(Math.max(parseInt(String(body?.pageSize ?? '10')), 1), 50);
      status = body?.status ?? null;
      typeId = body?.type ?? null;
      assigneeId = body?.assignee ?? null;
      const p = body?.priority;
      priority = (p === 'low' || p === 'medium' || p === 'high' || p === 'critical') ? p : null;
    }
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('incidents')
      .select('id, created_at, incident_at, title, priority, status, due_date, incident_type_id, assigned_to_employee_id, \
        incident_type:incident_type_id(id, name, color_hex), assignee:assigned_to_employee_id(id, name)', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (status) query = query.eq('status', status);
    if (typeId) query = query.eq('incident_type_id', typeId);
    if (assigneeId) query = query.eq('assigned_to_employee_id', assigneeId);
    if (priority) query = query.eq('priority', priority);

    const { data, error: err, count } = await query;
    if (err) throw err;
    return ok({ items: data, total: count ?? 0, page, pageSize });
  } catch (e) {
    return fail(e);
  }
});


