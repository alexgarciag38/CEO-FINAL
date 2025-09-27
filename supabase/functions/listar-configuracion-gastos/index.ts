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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const [{ data: categorias }, { data: subcategorias }] = await Promise.all([
      supabase.from('categorias_financieras').select('id, nombre, tipo, activa, color').eq('usuario_id', user.id).order('nombre'),
      supabase.from('subcategorias_financieras').select('id, nombre, categoria_id, activa').eq('usuario_id', user.id).order('nombre')
    ]);

    // De-dup robusto por claves normalizadas
    const norm = (s: string) => (s || '').trim().toLowerCase();

    // Subcategorías: único por (categoria_id, nombre)
    const subSeen = new Set<string>();
    const subByCat = new Map<string, any[]>();
    (subcategorias || []).forEach(s => {
      if (s.activa === false) return;
      const key = `${s.categoria_id}||${norm(s.nombre)}`;
      if (subSeen.has(key)) return;
      subSeen.add(key);
      const arr = subByCat.get(s.categoria_id) || [];
      arr.push({ id: s.id, nombre: s.nombre, activa: s.activa });
      subByCat.set(s.categoria_id, arr);
    });

    // Categorías: único por (usuario, nombre, tipo)
    const catSeen = new Set<string>();
    const result = [] as any[];
    for (const c of (categorias || [])) {
      if (c.activa === false) continue;
      const key = `${user.id}||${norm(c.nombre)}||${c.tipo}`;
      if (catSeen.has(key)) continue;
      catSeen.add(key);
      result.push({ id: c.id, nombre: c.nombre, tipo: c.tipo, activa: c.activa, color: c.color || null, subcategorias: subByCat.get(c.id) || [] });
    }

    return new Response(JSON.stringify({ categorias: result }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Error interno', details: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


