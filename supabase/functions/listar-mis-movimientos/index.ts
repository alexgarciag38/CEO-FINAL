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

    const { page = 1, pageSize = 20, filtros = {} } = await req.json().catch(() => ({}));
    let query = supabase.from('movimientos_financieros').select('*').eq('usuario_id', user.id).order('fecha_movimiento', { ascending: false });
    if (filtros.tipo) query = query.eq('tipo', filtros.tipo);
    if (filtros.estado) query = query.eq('estado', filtros.estado);
    if (filtros.desde) query = query.gte('fecha_movimiento', filtros.desde);
    if (filtros.hasta) query = query.lte('fecha_movimiento', filtros.hasta);
    const { data, error } = await query.range((page - 1) * pageSize, page * pageSize - 1);
    if (error) throw error;
    return new Response(JSON.stringify({ items: data ?? [] }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Error interno', details: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});






