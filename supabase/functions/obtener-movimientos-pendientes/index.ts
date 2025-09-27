// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

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

    const meta: any = user.user_metadata || {};
    const role = meta.role || meta.app_role;
    if (role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const { 
      tipo_movimiento, 
      estado, 
      usuario_id_filtro, 
      busqueda, 
      pagina = 1, 
      limite = 50 
    } = await req.json().catch(() => ({}));

    // Construir query base
    let query = supabase
      .from('movimientos_financieros')
      .select(`
        *,
        categoria:categorias_financieras(nombre),
        subcategoria:subcategorias_financieras(nombre)
      `)
      .in('estado', ['Registrado']); // Solo movimientos pendientes

    // Aplicar filtros
    if (tipo_movimiento) {
      query = query.eq('tipo', tipo_movimiento);
    }

    if (usuario_id_filtro) {
      query = query.eq('usuario_id', usuario_id_filtro);
    }

    if (busqueda) {
      query = query.or(`descripcion.ilike.%${busqueda}%,proveedor_cliente.ilike.%${busqueda}%`);
    }

    // Ordenar por fecha_programada ascendente (más urgentes primero)
    query = query.order('fecha_programada', { ascending: true });

    // Aplicar paginación
    const offset = (pagina - 1) * limite;
    query = query.range(offset, offset + limite - 1);

    const { data: movimientos, error } = await query;

    if (error) throw error;

    // Obtener total para paginación
    let countQuery = supabase
      .from('movimientos_financieros')
      .select('*', { count: 'exact', head: true })
      .in('estado', ['Registrado']);

    if (tipo_movimiento) {
      countQuery = countQuery.eq('tipo', tipo_movimiento);
    }

    if (usuario_id_filtro) {
      countQuery = countQuery.eq('usuario_id', usuario_id_filtro);
    }

    if (busqueda) {
      countQuery = countQuery.or(`descripcion.ilike.%${busqueda}%,proveedor_cliente.ilike.%${busqueda}%`);
    }

    const { count, error: countError } = await countQuery;

    if (countError) throw countError;

    return new Response(JSON.stringify({ 
      movimientos: movimientos || [],
      paginacion: {
        pagina,
        limite,
        total: count || 0,
        totalPaginas: Math.ceil((count || 0) / limite)
      }
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (e: any) {
    return new Response(JSON.stringify({ 
      error: 'Error interno', 
      details: String(e?.message || e) 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});









