// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const HistoryRowSchema = z.object({
  id: z.string().uuid(),
  scope_tipo: z.enum(['PERSONAL','MANUCAR','CARBOX']).nullable().optional(),
  descripcion: z.string().min(1).max(500),
  proveedor_cliente: z.string().max(255).nullable().optional(),
  forma_pago: z.string().max(120),
  monto: z.number().positive().refine(Number.isFinite),
  fecha_programada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_efectiva_pago: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  notas: z.string().max(1000).nullable().optional()
});

const BodySchema = z.object({ rows: z.array(HistoryRowSchema).min(1).max(500) });

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

    const body = await req.json().catch(() => ({}));
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Validación', details: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const rows = parsed.data.rows.map(r => ({
      id: r.id,
      usuario_id: user.id,
      scope_tipo: r.scope_tipo ?? null,
      descripcion: r.descripcion,
      proveedor_cliente: r.proveedor_cliente ?? null,
      forma_pago: r.forma_pago,
      monto: r.monto,
      fecha_programada: r.fecha_programada,
      fecha_efectiva_pago: r.fecha_efectiva_pago,
      notas: r.notas ?? null
    }));

    const { data, error } = await supabase
      .from('financial_payments_history')
      .upsert(rows, { onConflict: 'id' })
      .select('*');
    if (error) throw error;

    return new Response(JSON.stringify({ success: true, rows: data }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('excel-upsert-history error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


