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

const VSMInventoryNodeSchema = z.object({
  cantidad: z.number().nonnegative().default(0),
  unidad: z.string().optional(),
  espera_segundos: z.number().nonnegative().optional(),
  espera_dias: z.number().nonnegative().optional()
});

const VSMEndpointNodeSchema = z.object({
  rol: z.enum(['customer', 'supplier']),
  nombre: z.string().optional()
});

const VSMNodeSchema = z.object({
  id: z.string().min(1),
  type: z.enum(['process', 'inventory', 'customer', 'supplier', 'transport', 'info_flow', 'info_flow_manual', 'info_flow_electronic', 'data_box', 'kaizen_burst']),
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  label: z.string().optional(),
  data: z.union([
    z.object({ type: z.literal('process') }).and(VSMProcessSchema.omit({ id: true })),
    z.object({ type: z.literal('inventory') }).and(VSMInventoryNodeSchema),
    z.object({ type: z.literal('customer') }).and(VSMEndpointNodeSchema),
    z.object({ type: z.literal('supplier') }).and(VSMEndpointNodeSchema),
    z.object({ type: z.literal('transport') }).and(z.object({ descripcion: z.string().optional(), tiempo_transporte_seg: z.number().nonnegative().optional(), distancia_unidades: z.number().nonnegative().optional() })),
    z.object({ type: z.literal('info_flow') }).and(z.object({ descripcion: z.string().optional() })),
    z.object({ type: z.literal('info_flow_manual') }).and(z.object({ descripcion: z.string().optional() })),
    z.object({ type: z.literal('info_flow_electronic') }).and(z.object({ descripcion: z.string().optional() })),
    z.object({ type: z.literal('data_box') }).and(z.object({ titulo: z.string().optional() })),
    z.object({ type: z.literal('kaizen_burst') }).and(z.object({ titulo: z.string().optional(), descripcion: z.string().optional() }))
  ])
});

const VSMEdgeSchema = z.object({
  id: z.string().optional(),
  source: z.string().min(1),
  target: z.string().min(1)
});

const VSMDataSchema = z.object({
  projectId: z.string().uuid().optional(),
  nombre: z.string().min(1),
  procesos: z.array(VSMProcessSchema).optional(),
  nodes: z.array(VSMNodeSchema).optional(),
  edges: z.array(VSMEdgeSchema).optional(),
  demanda_cliente_unidades_mes: z.number().positive()
}).refine((v) => (v.procesos && v.procesos.length > 0) || (v.nodes && v.nodes.length > 0), {
  message: 'Debe incluir al menos un proceso o un nodo'
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
    const sanitized: any = {
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
    };

    // Optional nodes/edges (drag-and-drop model)
    if (Array.isArray(body.nodes)) {
      sanitized.nodes = (body.nodes as any[]).map((n) => {
        const type = String(n?.type ?? '').toLowerCase();
        const id = String(n?.id ?? '').trim() || crypto.randomUUID();
        const position = (n?.position && isFinite(Number(n.position.x)) && isFinite(Number(n.position.y))) ? { x: Number(n.position.x), y: Number(n.position.y) } : undefined;
        if (type === 'process') {
          return {
            id, type: 'process', position, label: n?.label,
            data: {
              type: 'process',
              nombre: String(n?.data?.nombre ?? '').trim() || 'Proceso',
              tiempo_ciclo_seg: coerceToSeconds(n?.data?.tiempo_ciclo_seg),
              tiempo_cambio_seg: coerceToSeconds(n?.data?.tiempo_cambio_seg),
              num_operarios: Math.max(0, Math.trunc(sanitizeNumberLike(n?.data?.num_operarios))),
              inventario_piezas: sanitizeNumberLike(n?.data?.inventario_piezas),
              tasa_scrap: Math.min(1, Math.max(0, Number(n?.data?.tasa_scrap) || 0))
            }
          };
        }
        if (type === 'inventory') {
          const esperaSeg = n?.data?.espera_segundos != null ? sanitizeNumberLike(n?.data?.espera_segundos) : undefined;
          const esperaDias = n?.data?.espera_dias != null ? sanitizeNumberLike(n?.data?.espera_dias) : undefined;
          return {
            id, type: 'inventory', position, label: n?.label,
            data: {
              type: 'inventory',
              cantidad: sanitizeNumberLike(n?.data?.cantidad),
              unidad: n?.data?.unidad ? String(n.data.unidad) : undefined,
              espera_segundos: esperaSeg,
              espera_dias: esperaDias
            }
          };
        }
        if (type === 'customer' || type === 'supplier') {
          return {
            id, type, position, label: n?.label,
            data: { type, rol: type, nombre: n?.data?.nombre ? String(n.data.nombre) : undefined }
          } as any;
        }
        if (type === 'transport') {
          return { id, type: 'transport', position, label: n?.label, data: { type: 'transport', descripcion: n?.data?.descripcion, tiempo_transporte_seg: sanitizeNumberLike(n?.data?.tiempo_transporte_seg), distancia_unidades: sanitizeNumberLike(n?.data?.distancia_unidades) } };
        }
        if (type === 'info_flow' || type === 'info_flow_manual' || type === 'info_flow_electronic') {
          return { id, type, position, label: n?.label, data: { type, descripcion: n?.data?.descripcion } } as any;
        }
        if (type === 'data_box') {
          return { id, type: 'data_box', position, label: n?.label, data: { type: 'data_box', titulo: n?.data?.titulo } };
        }
        if (type === 'kaizen_burst') {
          return { id, type: 'kaizen_burst', position, label: n?.label, data: { type: 'kaizen_burst', titulo: n?.data?.titulo, descripcion: n?.data?.descripcion } };
        }
        return { id, type: 'process', position, data: { type: 'process', nombre: 'Proceso', tiempo_ciclo_seg: 0, tiempo_cambio_seg: 0, num_operarios: 0, inventario_piezas: 0, tasa_scrap: 0 } };
      });
    }
    if (Array.isArray(body.edges)) {
      sanitized.edges = (body.edges as any[]).map((e) => ({
        id: e?.id ? String(e.id) : undefined,
        source: String(e?.source ?? '').trim(),
        target: String(e?.target ?? '').trim()
      }));
    }

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

    const demandPerSecond = vsm.demanda_cliente_unidades_mes / (30 * 24 * 3600);

    // Support both legacy procesos[] and new nodes[]
    let totalProcessTime = 0;
    let totalLeadTime = 0;

    if (vsm.nodes && vsm.nodes.length > 0) {
      for (const n of vsm.nodes) {
        if (n.type === 'process') {
          const d: any = (n as any).data;
          totalProcessTime += Number(d.tiempo_ciclo_seg || 0);
          totalLeadTime += Number(d.tiempo_ciclo_seg || 0) + Number(d.tiempo_cambio_seg || 0);
        } else if (n.type === 'inventory') {
          const d: any = (n as any).data;
          let waitSec = 0;
          if (d.espera_segundos != null) waitSec = Number(d.espera_segundos) || 0;
          else if (d.espera_dias != null) waitSec = Number(d.espera_dias) * 86400;
          else if (d.cantidad != null && demandPerSecond > 0) waitSec = Number(d.cantidad) / demandPerSecond;
          totalLeadTime += waitSec;
        } else if (n.type === 'transport') {
          const d: any = (n as any).data;
          totalLeadTime += Number(d.tiempo_transporte_seg || 0);
        }
      }
    } else {
      // Legacy path
      totalProcessTime = (vsm.procesos ?? []).reduce((acc, p) => acc + p.tiempo_ciclo_seg, 0);
      totalLeadTime = (vsm.procesos ?? []).reduce((acc, p) => {
        const waitFromInventory = demandPerSecond > 0 ? (p.inventario_piezas / demandPerSecond) : 0;
        return acc + p.tiempo_ciclo_seg + p.tiempo_cambio_seg + waitFromInventory;
      }, 0);
    }
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


