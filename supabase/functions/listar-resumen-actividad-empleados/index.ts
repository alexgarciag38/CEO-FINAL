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

    const { dias_atras = 30 } = await req.json().catch(() => ({}));
    const fechaInicio = new Date();
    fechaInicio.setDate(fechaInicio.getDate() - dias_atras);

    // Obtener movimientos (sin join a auth.users para evitar problemas de RLS)
    const { data: movimientos, error } = await supabase
      .from('movimientos_financieros')
      .select('*')
      .gte('created_at', fechaInicio.toISOString());

    if (error) throw error;

    // Agrupar por empleado y tipo
    const actividadPorEmpleado: Record<string, { ingresos: number; egresos: number; nombre: string }> = {};

    // Preparar mapa de nombres con admin client (service role)
    const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminClient = adminKey
      ? createClient(Deno.env.get('SUPABASE_URL') ?? '', adminKey)
      : null;

    const uniqueUserIds = Array.from(new Set((movimientos || []).map((m: any) => m.usuario_id).filter(Boolean)));
    const userNames: Record<string, string> = {};
    if (adminClient && uniqueUserIds.length > 0) {
      // Cargar en lotes pequeños para evitar límites
      for (const userId of uniqueUserIds) {
        try {
          const { data: u } = await adminClient.auth.admin.getUserById(userId);
          const meta: any = u?.user?.user_metadata || u?.user?.raw_user_meta_data || {};
          const name = meta.full_name || meta.name || meta.user_name || u?.user?.email || `Usuario ${userId.slice(0,8)}`;
          if (name) userNames[userId] = name;
        } catch (_e) {
          userNames[userId] = `Usuario ${userId.slice(0,8)}`;
        }
      }
    }

    for (const movimiento of movimientos || []) {
      const usuarioId = movimiento.usuario_id;
      const tipo = movimiento.tipo as 'Ingreso' | 'Egreso';
      const monto = Number(movimiento.monto) || 0;
      
      // Obtener nombre del usuario (preferir admin lookup)
      const nombre = userNames[usuarioId] || `Usuario ${usuarioId?.slice(0, 8)}`;

      if (!actividadPorEmpleado[usuarioId]) {
        actividadPorEmpleado[usuarioId] = {
          ingresos: 0,
          egresos: 0,
          nombre
        };
      }

      if (tipo === 'Ingreso') {
        actividadPorEmpleado[usuarioId].ingresos += monto;
      } else {
        actividadPorEmpleado[usuarioId].egresos += monto;
      }
    }

    // Convertir a array y ordenar por total
    const resumenActividad = Object.entries(actividadPorEmpleado).map(([usuarioId, datos]) => ({
      usuarioId,
      nombre: datos.nombre,
      ingresos: datos.ingresos,
      egresos: datos.egresos,
      neto: datos.ingresos - datos.egresos,
      total: datos.ingresos + datos.egresos
    })).sort((a, b) => b.total - a.total);

    return new Response(JSON.stringify({ 
      resumenActividad,
      periodo: {
        dias: dias_atras,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: new Date().toISOString()
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
