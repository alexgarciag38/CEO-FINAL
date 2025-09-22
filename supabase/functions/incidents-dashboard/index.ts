import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, ok, fail } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'GET' && req.method !== 'POST') return new Response('Not Found', { status: 404, headers: corsHeaders });
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    await getUserOr401(supabase);

    let companyId: string | null = null;
    try {
      if (req.method === 'POST') {
        const body = await req.json();
        companyId = body?.company_id ?? null;
      } else {
        const url = new URL(req.url);
        companyId = url.searchParams.get('company_id');
      }
    } catch {}

    // Pull all incidents for this company (or all if not provided)
    let incidentsQ = supabase.from('incidents').select(`
      id, created_at, resolved_at, status, priority, company_id,
      incident_type:incident_type_id(id, name, color_hex),
      assigned:assigned_to_employee_id(id, name)
    `);
    if (companyId) incidentsQ = incidentsQ.eq('company_id', companyId);
    const { data: incidents, error: incErr } = await incidentsQ;
    if (incErr) throw incErr;

    // Comments recent (not critical to company filter as text feed)
    const { data: recentCommentsQ } = await supabase
      .from('incident_comments')
      .select('created_at, comment, incident:incident_id(id, title)')
      .order('created_at', { ascending: false })
      .limit(5);

    // Aggregations
    const byStatusMap: Record<string, number> = {};
    const byTypeMap: Record<string, { name: string; count: number; color_hex: string }> = {};
    const byAssigneeMap: Record<string, { name: string; count: number }> = {};
    const byPriorityMap: Record<string, number> = {};

    let openCount = 0;
    let criticalOpenInProgress = 0;
    let resolvedLast7 = 0;

    const now = Date.now();
    const sevenDaysAgo = now - 7*24*3600*1000;

    for (const it of (incidents || [])) {
      const st = it.status || 'open';
      byStatusMap[st] = (byStatusMap[st] || 0) + 1;
      if (st === 'open') openCount += 1;
      if ((st === 'open' || st === 'in_progress') && it.priority === 'critical') criticalOpenInProgress += 1;
      if (it.resolved_at && new Date(it.resolved_at).getTime() >= sevenDaysAgo) resolvedLast7 += 1;

      const pr = it.priority || 'medium';
      byPriorityMap[pr] = (byPriorityMap[pr] || 0) + 1;

      const t = it.incident_type || { id: 'unknown', name: 'Desconocido', color_hex: '#3B82F6' };
      const typeKey = t.id as string;
      if (!byTypeMap[typeKey]) byTypeMap[typeKey] = { name: t.name, count: 0, color_hex: t.color_hex || '#3B82F6' };
      byTypeMap[typeKey].count += 1;

      const a = it.assigned || { id: 'unknown', name: '—' };
      const aKey = a.id as string;
      if (!byAssigneeMap[aKey]) byAssigneeMap[aKey] = { name: a.name, count: 0 };
      byAssigneeMap[aKey].count += 1;
    }

    // avg resolution days
    const durations: number[] = [];
    for (const it of (incidents || [])) {
      if (it.resolved_at) {
        const ms = new Date(it.resolved_at).getTime() - new Date(it.created_at).getTime();
        durations.push(ms / 86400000);
      }
    }
    const avgResolutionDays = durations.length ? durations.reduce((a,b)=>a+b,0) / durations.length : 0;

    // Top 5 critical open oldest
    const topCritical = (incidents || [])
      .filter((it: any) => it.priority === 'critical' && it.status === 'open')
      .sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      .slice(0, 5);

    // Pareto from byType
    const typeItems = Object.values(byTypeMap);
    const sorted = typeItems.sort((a, b) => b.count - a.count);
    const total = sorted.reduce((acc, x) => acc + x.count, 0) || 1;
    const labels: string[] = [];
    const freqs: number[] = [];
    const colors: string[] = [];
    const cum: number[] = [];
    let running = 0;
    for (const it of sorted) {
      labels.push(it.name);
      freqs.push(it.count);
      colors.push(it.color_hex);
      running += it.count;
      cum.push(Number(((running / total) * 100).toFixed(1)));
    }

    return ok({
      kpis: {
        open: openCount,
        criticalOpenOrInProgress: criticalOpenInProgress,
        avgResolutionDays,
        resolvedLast7,
      },
      byStatus: Object.entries(byStatusMap).map(([status, count]) => ({ status, count })),
      byType: Object.entries(byTypeMap).map(([type_id, v]) => ({ type_id, name: v.name, count: v.count, color_hex: v.color_hex })),
      byAssignee: Object.entries(byAssigneeMap).map(([employee_id, v]) => ({ employee_id, name: v.name, count: v.count })),
      byPriority: Object.entries(byPriorityMap).map(([priority, count]) => ({ priority, count })),
      topCritical,
      recent: (recentCommentsQ || []).map((r: any) => ({ type: 'comment', created_at: r.created_at, text: r.comment, incident: r.incident })),
      pareto_data: { labels, frequencies: freqs, cumulative_percentages: cum, colors }
    });
  } catch (e) {
    return fail(e);
  }
});


