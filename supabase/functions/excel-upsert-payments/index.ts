// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const isUuid = (v: unknown): v is string => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const PaymentInputSchema = z.object({
  id: z.string().uuid().optional(),
  client_id: z.string().optional(),

  scope_tipo: z.enum(['PERSONAL','MANUCAR','CARBOX']).nullable().optional(),
  tipo: z.enum(['Ingreso','Egreso']),
  categoria_id: z.string().uuid().nullable().optional(),
  subcategoria_id: z.string().uuid().nullable().optional(),
  fiscal: z.boolean().default(false),
  descripcion: z.string().min(1).max(500),
  proveedor_cliente: z.string().max(255).nullable().optional(),
  forma_pago: z.string().max(120).nullable().optional(),
  monto: z.number().positive().refine(Number.isFinite),
  fecha_programada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  frecuencia: z.enum(['Único','Diario','Semanal','Quincenal','Mensual','Bimestral','Trimestral','Semestral','Anual']),
  pagado: z.boolean().default(false),
  fecha_efectiva_pago: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  fecha_inicial_serie: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  notas: z.string().max(1000).nullable().optional()
});

const BodySchema = z.object({ payments: z.array(PaymentInputSchema).min(1).max(500) });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Falta autenticación' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const role = (user.user_metadata as any)?.role || (user.user_metadata as any)?.app_role;
    if (!['admin','colaborador','authenticated'].includes(role)) return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Validación', details: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const rows = parsed.data.payments.map((p) => ({
      ...(p.id && isUuid(p.id) ? { id: p.id } : {}),
      usuario_id: user.id,
      scope_tipo: p.scope_tipo ?? null,
      tipo: p.tipo,
      categoria_id: p.categoria_id ?? null,
      subcategoria_id: p.subcategoria_id ?? null,
      fiscal: !!p.fiscal,
      descripcion: p.descripcion,
      proveedor_cliente: p.proveedor_cliente ?? null,
      forma_pago: p.forma_pago ?? null,
      monto: p.monto,
      fecha_programada: p.fecha_programada,
      frecuencia: p.frecuencia,
      pagado: !!p.pagado,
      fecha_efectiva_pago: p.fecha_efectiva_pago ?? null,
      fecha_inicial_serie: p.fecha_inicial_serie ?? null,
      notas: p.notas ?? null
    }));

    const { data, error } = await supabase
      .from('financial_payments')
      .upsert(rows, { onConflict: 'id' })
      .select('*');
    if (error) throw error;

    // mapping client_id -> id
    const mappings = parsed.data.payments.map((p, idx) => ({ client_id: p.client_id ?? (p.id && !isUuid(p.id) ? p.id : null) ?? null, id: (data as any[])[idx]?.id })).filter((m) => !!m.id);

    return new Response(JSON.stringify({ success: true, rows: data, mappings }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('excel-upsert-payments error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


