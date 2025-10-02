// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

// Esquema para movimiento único (entrada del cliente)
const MovimientoInputSchema = z.object({
  id: z.string().uuid().optional(), // si viene uuid, se usa como upsert target; si no, se tratará como nuevo
  client_id: z.string().optional(), // id local/temporal para mapping de vuelta

  tipo: z.enum(['Ingreso','Egreso']),
  categoria_id: z.string().uuid().nullable().optional(),
  subcategoria_id: z.string().uuid().nullable().optional(),
  metodo_categoria_id: z.string().uuid().nullable().optional(),
  metodo_subcategoria_id: z.string().uuid().nullable().optional(),
  proveedor_cliente: z.string().max(255).nullable().optional(),
  descripcion: z.string().min(0).max(500),
  monto: z.number().nonnegative().refine((v) => Number.isFinite(v), 'Monto inválido').optional(),
  fecha_movimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  fecha_programada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  fecha_efectiva: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  forma_pago: z.string().max(100).nullable().optional(),
  fiscal: z.boolean().default(false),
  notas: z.string().max(1000).nullable().optional(),
  estado: z.enum(['Registrado','Completado','Cancelado']).default('Registrado'),
  origen: z.enum(['unico','recurrente']).default('unico'),

  // Metadatos de recurrencia (si aplica)
  regla_id: z.string().uuid().nullable().optional(),
  n_orden_ocurrencia: z.number().int().nullable().optional(),
  total_planeadas: z.number().int().nullable().optional(),
});

const UpsertMovimientosSchema = z.object({
  movimientos: z.array(MovimientoInputSchema).min(1).max(200)
});

type MovimientoInput = z.infer<typeof MovimientoInputSchema>;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Falta autenticación' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const role = (user.user_metadata as any)?.role || (user.user_metadata as any)?.app_role;
    if (!['admin','colaborador','authenticated'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = UpsertMovimientosSchema.safeParse(body);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validación', details: parsed.error.flatten() }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const movimientos: MovimientoInput[] = parsed.data.movimientos;

    const results: any[] = [];
    const mappings: Array<{ client_id: string | null; id: string }> = [];

    // Procesar secuencialmente para mantener mapping determinístico client_id -> id
    for (const m of movimientos) {
      try {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      const todayStr = `${yyyy}-${mm}-${dd}`;

      const safeFechaMov = (m.fecha_movimiento && m.fecha_movimiento.trim().length > 0)
        ? m.fecha_movimiento
        : (m.fecha_programada && m.fecha_programada.trim().length > 0)
          ? m.fecha_programada
          : todayStr;

      const dbRow: Record<string, any> = {
        // id: usar si es UUID válido (upsert). Si no, dejar que la DB genere.
        ...(m.id && isUuid(m.id) ? { id: m.id } : {}),
        usuario_id: user.id,
        tipo: m.tipo,
        categoria_id: m.categoria_id ?? null,
        subcategoria_id: m.subcategoria_id ?? null,
        proveedor_cliente: m.proveedor_cliente ?? null,
        descripcion: m.descripcion,
        monto: typeof m.monto === 'number' ? m.monto : 0,
        fecha_movimiento: safeFechaMov,
        fecha_programada: m.fecha_programada ?? null,
        fecha_efectiva: m.fecha_efectiva ?? null,
      metodo_categoria_id: m.metodo_categoria_id ?? null,
      metodo_subcategoria_id: m.metodo_subcategoria_id ?? null,
        forma_pago: m.forma_pago ?? null,
        fiscal: !!m.fiscal,
        notas: m.notas ?? null,
        estado: m.estado ?? 'Registrado',
        origen: m.origen ?? 'unico',
        regla_id: m.regla_id ?? null,
        n_orden_ocurrencia: m.n_orden_ocurrencia ?? null,
        total_planeadas: m.total_planeadas ?? null,
      };

      const { data, error } = await supabase
        .from('movimientos_financieros')
        .upsert(dbRow, { onConflict: 'id' })
        .select(`
          id, tipo, categoria_id, subcategoria_id, proveedor_cliente,
          descripcion, monto, fecha_movimiento, fecha_programada, fecha_efectiva,
          forma_pago, fiscal, notas, estado, origen,
          regla_id, n_orden_ocurrencia, total_planeadas,
          created_at, updated_at
        `)
        .single();

      if (error) throw error;

      results.push(data);
      mappings.push({ client_id: m.client_id ?? (m.id && !isUuid(m.id) ? m.id : null) ?? null, id: data.id });
      } catch (itemErr) {
        console.error('upsert-movimientos-en-lote item error:', itemErr);
        // Responder error controlado (400) con detalles del item que falló
        const errObj: any = itemErr || {};
        return new Response(JSON.stringify({
          error: 'UPSERT_FAILED',
          message: String(errObj.message || itemErr),
          details: errObj.details ?? null,
          hint: errObj.hint ?? null,
          code: errObj.code ?? null,
          item: {
            client_id: m.client_id ?? null,
            id: m.id ?? null,
            tipo: m.tipo,
            categoria_id: m.categoria_id ?? null,
            subcategoria_id: m.subcategoria_id ?? null
          }
        }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    return new Response(JSON.stringify({ success: true, rows: results, mappings }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (e: any) {
    console.error('upsert-movimientos-en-lote error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});


