// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const BodySchema = z.object({ ids: z.array(z.string().uuid()).optional() });

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

    let query = supabase.from('financial_payments')
      .select('*')
      .eq('usuario_id', user.id);
    if (parsed.data.ids && parsed.data.ids.length > 0) {
      // @ts-ignore (Deno)
      query = query.in('id', parsed.data.ids);
    }
    const { data: rows, error: selErr } = await query;
    if (selErr) throw selErr;
    if (!rows || rows.length === 0) return new Response(JSON.stringify({ success: true, moved: 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const historyRows = rows.map((r: any) => ({
      usuario_id: r.usuario_id,
      tipo: r.tipo,
      categoria_id: r.categoria_id,
      subcategoria_id: r.subcategoria_id,
      fiscal: r.fiscal,
      descripcion: r.descripcion,
      proveedor_cliente: r.proveedor_cliente,
      forma_pago: r.forma_pago,
      monto: r.monto,
      fecha_programada: r.fecha_programada,
      fecha_efectiva_pago: r.fecha_efectiva_pago || r.fecha_programada,
      notas: r.notas,
      scope_tipo: r.scope_tipo ?? null,
    }));

    const { error: insErr } = await supabase
      .from('financial_payments_history')
      .insert(historyRows);
    if (insErr) throw insErr;

    const ids = rows.map((r: any) => r.id);
    const { error: delErr } = await supabase
      .from('financial_payments')
      .delete()
      .in('id', ids)
      .eq('usuario_id', user.id);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ success: true, moved: ids.length }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('excel-move-to-history error:', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


