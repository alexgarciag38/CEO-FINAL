// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const BodySchema = z.object({
  // opcionalmente permitir pasar ids específicos; si no, procesa todos los completados
  ids: z.array(z.string().uuid()).optional()
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json().catch(() => ({}));
    const { ids } = BodySchema.parse(body);

    // Seleccionar movimientos completados del usuario
    const filtroIds = ids && ids.length > 0 ? { in: ids } : null;
    let query = supabase.from('movimientos_financieros')
      .select('*')
      .eq('usuario_id', user.id)
      .eq('estado', 'Completado');
    if (filtroIds) {
      // @ts-ignore - Deno
      query = query.in('id', ids);
    }
    const { data: completados, error: selErr } = await query;
    if (selErr) throw selErr;

    if (!completados || completados.length === 0) {
      return new Response(JSON.stringify({ success: true, moved: 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Mapear a historial
    const historialRows = completados.map((m: any) => ({
      usuario_id: m.usuario_id,
      tipo: m.tipo,
      categoria_id: m.categoria_id,
      subcategoria_id: m.subcategoria_id,
      proveedor_cliente: m.proveedor_cliente,
      descripcion: m.descripcion,
      monto: m.monto,
      fecha_movimiento: m.fecha_movimiento,
      fecha_programada: m.fecha_programada,
      fecha_efectiva: m.fecha_efectiva ?? m.fecha_programada ?? m.fecha_movimiento,
      forma_pago: m.forma_pago,
      fiscal: m.fiscal,
      notas: m.notas,
      estado: 'Completado',
      origen: m.origen || 'unico',
      regla_id: m.regla_id ?? null,
      n_orden_ocurrencia: m.n_orden_ocurrencia ?? null,
      total_planeadas: m.total_planeadas ?? null,
      procesado_at: new Date().toISOString(),
    }));

    // Insertar historial
    const { error: insErr } = await supabase.from('movimientos_historial').insert(historialRows);
    if (insErr) throw insErr;

    // Borrar los originales
    const idsToDelete = completados.map((m: any) => m.id);
    const { error: delErr } = await supabase.from('movimientos_financieros').delete().in('id', idsToDelete);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ success: true, moved: idsToDelete.length }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('procesar-pagos error:', e);
    const msg = e?.message || String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


