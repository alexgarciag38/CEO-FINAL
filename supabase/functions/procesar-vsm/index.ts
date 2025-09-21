import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { z } from "https://esm.sh/zod@3.23.8";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, ok, fail, readJson } from "../_shared/mod.ts";

// Types mirrored from frontend (src/types/vsm.ts). Keep in sync.
const VSMProcessSchema = z.object({
  id: z.string().min(1),
  nombre: z.string().min(1),
  tiempo_ciclo_seg: z.number().nonnegative(),
  tiempo_cambio_seg: z.number().nonnegative(),
  num_operarios: z.number().int().nonnegative(),
  inventario_piezas: z.number().nonnegative(),
  tasa_scrap: z.number().min(0).max(1)
});

const VSMDataSchema = z.object({
  projectId: z.string().uuid().optional(),
  nombre: z.string().min(1),
  procesos: z.array(VSMProcessSchema).nonempty(),
  demanda_cliente_unidades_mes: z.number().positive()
});

type VSMProcess = z.infer<typeof VSMProcessSchema>;
type VSMData = z.infer<typeof VSMDataSchema>;

function sanitizeNumberLike(input: unknown): number {
  if (typeof input === 'number' && isFinite(input)) return input;
  const str = String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/€/g, '')
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .replace(/segundos?|segs?|secs?|s\b/g, '')
    .replace(/minutos?|mins?|m\b/g, (m) => m)
    .replace(/horas?|hrs?|h\b/g, (m) => m)
    .replace(/d[ií]as?|days?/g, '')
    .replace(/unidades?|uds?/g, '')
    .replace(/[a-zA-Z]/g, '')
    .replace(/\s+/g, '');
  const value = Number(str);
  return isFinite(value) && !isNaN(value) ? value : 0;
}

// Convert inputs that could be specified in various units to seconds
function coerceToSeconds(value: unknown, unitHint?: string): number {
  const raw = String(value ?? '').toLowerCase();
  const n = sanitizeNumberLike(value);
  if (raw.includes('h')) return n * 3600;
  if (raw.includes('min')) return n * 60;
  if (raw.includes('día') || raw.includes('dia') || raw.includes('day')) return n * 86400;
  return n; // assume already seconds
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST') return new Response('Not Found', { status: 404, headers: corsHeaders });

    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) return error;
    const user = await getUserOr401(supabase);

    const body = await readJson<any>(req);

    // Sanitize incoming VSM payload
    const sanitized: VSMData = {
      projectId: body.projectId,
      nombre: String(body.nombre ?? '').trim(),
      demanda_cliente_unidades_mes: sanitizeNumberLike(body.demanda_cliente_unidades_mes),
      procesos: (Array.isArray(body.procesos) ? body.procesos : []).map((p: any) => ({
        id: String(p.id ?? '').trim(),
        nombre: String(p.nombre ?? '').trim(),
        tiempo_ciclo_seg: coerceToSeconds(p.tiempo_ciclo_seg ?? p.tiempo_ciclo ?? p.cycle_time),
        tiempo_cambio_seg: coerceToSeconds(p.tiempo_cambio_seg ?? p.tiempo_cambio ?? p.changeover_time),
        num_operarios: Math.max(0, Math.trunc(sanitizeNumberLike(p.num_operarios))),
        inventario_piezas: sanitizeNumberLike(p.inventario_piezas ?? p.inventario),
        tasa_scrap: (() => {
          const v = String(p.tasa_scrap ?? p.scrap_rate ?? '0').toLowerCase();
          if (v.includes('%')) return Math.min(1, Math.max(0, sanitizeNumberLike(v) / 100));
          const n = Number(v);
          if (isFinite(n) && n <= 1) return Math.min(1, Math.max(0, n));
          return Math.min(1, Math.max(0, sanitizeNumberLike(v)));
        })()
      }))
    } as VSMData;

    // Validate with Zod
    const parsed = VSMDataSchema.safeParse(sanitized);
    if (!parsed.success) {
      console.error('[VSM] Zod validation error', parsed.error);
      return new Response(JSON.stringify({ error: 'Datos inválidos', details: parsed.error.format() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const vsm = parsed.data;

    // Calculations
    const SECONDS_PER_WORKING_DAY = 8 * 3600; // 8h
    const WORKING_DAYS_PER_MONTH = 22; // standard
    const SECONDS_PER_MONTH_WORKING = SECONDS_PER_WORKING_DAY * WORKING_DAYS_PER_MONTH;

    const totalProcessTime = vsm.procesos.reduce((acc, p) => acc + p.tiempo_ciclo_seg, 0);
    const demandPerSecond = vsm.demanda_cliente_unidades_mes / (30 * 24 * 3600);
    const totalLeadTime = vsm.procesos.reduce((acc, p) => {
      const waitFromInventory = demandPerSecond > 0 ? (p.inventario_piezas / (vsm.demanda_cliente_unidades_mes / (30 * 24 * 3600))) : 0;
      return acc + p.tiempo_ciclo_seg + p.tiempo_cambio_seg + waitFromInventory;
    }, 0);
    const pce = totalLeadTime > 0 ? (totalProcessTime / totalLeadTime) * 100 : 0;
    const taktTime = vsm.demanda_cliente_unidades_mes > 0 ? (SECONDS_PER_MONTH_WORKING / vsm.demanda_cliente_unidades_mes) : 0;

    const result = {
      ...vsm,
      kpis: {
        total_process_time_seg: Number(totalProcessTime.toFixed(2)),
        total_lead_time_seg: Number(totalLeadTime.toFixed(2)),
        process_cycle_efficiency_pct: Number(pce.toFixed(2)),
        takt_time_seg: Number(taktTime.toFixed(2))
      }
    };

    // Persist into Supabase
    try {
      const { data: upserted, error: upsertError } = await supabase
        .from('vsm_projects')
        .upsert({
          id: vsm.projectId ?? crypto.randomUUID(),
          project_name: vsm.nombre,
          user_id: user.id,
          vsm_data: result
        }, { onConflict: 'id' })
        .select('id')
        .single();
      if (upsertError) throw upsertError;
      // Ensure id is returned in result
      (result as any).projectId = upserted?.id ?? vsm.projectId;
    } catch (dbErr) {
      console.error('[VSM] DB upsert error', dbErr);
      return new Response(JSON.stringify({ error: 'Error al guardar VSM' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    return ok(result, 200);
  } catch (e) {
    console.error('[VSM] Unexpected error', e);
    return fail(e);
  }
});


