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
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
    if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json().catch(() => ({}));
    const { ids } = BodySchema.parse(body);

    // Seleccionar movimientos a procesar
    let query = supabase.from('movimientos_financieros')
      .select('*')
      .eq('usuario_id', user.id);
    if (ids && ids.length > 0) {
      // Si llegan ids, procesar exactamente esos (independiente del estado)
      // @ts-ignore - Deno
      query = query.in('id', ids);
    } else {
      // Si no, procesar todos los Completado
      query = query.eq('estado', 'Completado');
    }
    const { data: completados, error: selErr } = await query;
    if (selErr) throw selErr;

    if (!completados || completados.length === 0) {
      return new Response(JSON.stringify({ success: true, moved: 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Validaciones de método/submétodo para UX clara
    const categoriasMetodo = Array.from(new Set((completados || []).map((m: any) => m.metodo_categoria_id).filter(Boolean)));
    let categoriasConSub: Set<string> = new Set();
    if (categoriasMetodo.length > 0) {
      const { data: subs } = await supabase
        .from('metodos_pago_subcategorias')
        .select('categoria_id')
        .in('categoria_id', categoriasMetodo as any);
      categoriasConSub = new Set((subs || []).map((s: any) => s.categoria_id));
    }

    const faltanMetodo = (completados || []).filter((m: any) => !m.metodo_categoria_id);
    const faltanSubmetodo = (completados || []).filter((m: any) => m.metodo_categoria_id && categoriasConSub.has(m.metodo_categoria_id) && !m.metodo_subcategoria_id);

    if (faltanMetodo.length > 0 || faltanSubmetodo.length > 0) {
      return new Response(JSON.stringify({
        error: 'VALIDATION_ERROR',
        message: 'Faltan campos requeridos para procesar pagos',
        details: {
          missing_method_ids: faltanMetodo.map((m: any) => m.id),
          missing_submethod_ids: faltanSubmetodo.map((m: any) => m.id)
        }
      }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Mapear a historial
    const historialRows = completados.map((m: any) => ({
      usuario_id: m.usuario_id,
      tipo: m.tipo,
      categoria_id: m.categoria_id,
      subcategoria_id: m.subcategoria_id,
      metodo_categoria_id: m.metodo_categoria_id ?? null,
      metodo_subcategoria_id: m.metodo_subcategoria_id ?? null,
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

    // Insertar historial y recuperar ids insertados
    const { data: inserted, error: insErr } = await supabase
      .from('movimientos_historial')
      .insert(historialRows)
      .select('id');
    if (insErr) {
      console.error('procesar-pagos insert historial error:', insErr);
      throw insErr;
    }

    // Borrar los originales
    const idsToDelete = completados.map((m: any) => m.id);
    if (!idsToDelete || idsToDelete.length === 0) {
      return new Response(JSON.stringify({ success: true, moved: 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { error: delErr } = await supabase
      .from('movimientos_financieros')
      .delete()
      .in('id', idsToDelete)
      .eq('usuario_id', user.id);
    if (delErr) throw delErr;

    return new Response(JSON.stringify({ success: true, moved: idsToDelete.length }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('procesar-pagos error:', e);
    const msg = e?.message || String(e);
    return new Response(JSON.stringify({ error: msg }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


