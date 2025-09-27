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
    if (!authHeader) return new Response(JSON.stringify({ error: 'Falta autenticación' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const meta: any = user.user_metadata || {};
    const role = meta.role || meta.app_role;
    if (role !== 'admin') return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { limit = 12 } = await req.json().catch(() => ({}));

    // Join básico con categorías/subcategorías para nombre; employees no está en BD, usamos usuario_id por ahora
    const { data, error } = await supabase
      .from('movimientos_financieros')
      .select('id, usuario_id, tipo, monto, created_at, categoria_id, subcategoria_id')
      .order('created_at', { ascending: false })
      .limit(Math.max(1, Math.min(50, Number(limit) || 12)));
    if (error) throw error;

    // Mapeos de nombres opcionales (si existen tablas)
    // Para mantener simple, devolvemos categoria como id por ahora
    const items = (data || []).map((r: any) => ({
      id: r.id,
      empleado: r.usuario_id,
      tipo: r.tipo,
      categoria: r.categoria_id,
      monto: r.monto,
      created_at: r.created_at
    }));

    return new Response(JSON.stringify({ items }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Error interno', details: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});










