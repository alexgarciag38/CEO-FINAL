import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, ok, fail } from "../_shared/mod.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'GET' && req.method !== 'POST') return new Response('Not Found', { status: 404, headers: corsHeaders });
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    await getUserOr401(supabase);

    // Aggregations & lists
    const [byStatus, byType, byAssignee, resolutionTime, openCountQ, criticalCountQ, resolved7Q, priorityRowsQ, topCriticalQ, recentCommentsQ, typesQ, activeByEmployeeQ] = await Promise.all([
      supabase.rpc('incidents_group_by_status'),
      supabase.rpc('incidents_group_by_type'),
      supabase.rpc('incidents_group_by_assignee'),
      supabase.rpc('incidents_resolution_time'),
      supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      supabase.from('incidents').select('id', { count: 'exact', head: true })
        .in('status', ['open','in_progress']).eq('priority', 'critical'),
      supabase.from('incidents').select('id', { count: 'exact', head: true })
        .not('resolved_at', 'is', null).gte('resolved_at', new Date(Date.now() - 7*24*3600*1000).toISOString()),
      supabase.from('incidents').select('priority'),
      supabase.from('incidents')
        .select('id, title, created_at, assigned:assigned_to_employee_id(id, name)')
        .eq('priority','critical').eq('status','open').order('created_at', { ascending: true }).limit(5),
      supabase.from('incident_comments')
        .select('created_at, comment, incident:incident_id(id, title)')
        .order('created_at', { ascending: false }).limit(5),
      supabase.from('incident_types').select('id, name, color_hex'),
      supabase.from('incidents').select('assigned_to_employee_id, status').in('status', ['open','in_progress'])
    ]);

    return ok({
      kpis: {
        open: openCountQ.count ?? 0,
        criticalOpenOrInProgress: criticalCountQ.count ?? 0,
        avgResolutionDays: (resolutionTime.data ?? []).reduce((acc: number, r: any) => acc + Number(r.avg_days || 0), 0) / Math.max((resolutionTime.data ?? []).length, 1),
        resolvedLast7: resolved7Q.count ?? 0
      },
      byStatus: byStatus.data ?? [],
      byType: (() => {
        const tmap: Record<string, { name: string; color_hex: string }> = {};
        for (const t of typesQ.data ?? []) {
          tmap[t.id] = { name: t.name, color_hex: t.color_hex };
        }
        return (byType.data ?? []).map((r: any) => ({
          type_id: r.type_id,
          name: r.name,
          count: Number(r.count),
          color_hex: tmap[r.type_id]?.color_hex || '#3B82F6'
        }));
      })(),
      byAssignee: byAssignee.data ?? [],
      byPriority: (() => {
        const counts: Record<string, number> = {};
        for (const row of priorityRowsQ.data ?? []) {
          const key = (row.priority || 'medium');
          counts[key] = (counts[key] || 0) + 1;
        }
        return Object.entries(counts).map(([priority, count]) => ({ priority, count }));
      })(),
      topCritical: topCriticalQ.data ?? [],
      recent: (recentCommentsQ.data ?? []).map((r: any) => ({ type: 'comment', created_at: r.created_at, text: r.comment, incident: r.incident })),
      pareto_data: (() => {
        const items = ((byType.data ?? []) as any[]).map((r: any) => {
          const color = (typesQ.data ?? []).find((t: any) => t.id === r.type_id)?.color_hex || '#3B82F6';
          return { name: r.name, count: Number(r.count) || 0, color_hex: color };
        });
        const sorted = items.sort((a, b) => b.count - a.count);
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
        return { labels, frequencies: freqs, cumulative_percentages: cum, colors };
      })(),
      employee_load_data: (() => {
        const counts: Record<string, number> = {};
        const names: Record<string, string> = {};
        for (const row of (byAssignee.data ?? [])) {
          if (row?.employee_id && row?.name) names[row.employee_id] = row.name;
        }
        for (const row of (activeByEmployeeQ.data ?? [])) {
          const id = (row as any).assigned_to_employee_id as string;
          if (!id) continue;
          counts[id] = (counts[id] || 0) + 1;
        }
        const entries = Object.entries(counts).sort((a,b) => b[1]-a[1]);
        const labels = entries.map(([id]) => names[id] || '—');
        const incident_counts = entries.map(([,c]) => c);
        const employee_ids = entries.map(([id]) => id);
        return { labels, incident_counts, employee_ids };
      })()
    });
  } catch (e) {
    return fail(e);
  }
});


