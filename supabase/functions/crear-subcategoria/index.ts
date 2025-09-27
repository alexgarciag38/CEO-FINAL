// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const BodySchema = z.object({
  nombre: z.string().trim().min(1, 'Nombre requerido').max(140),
  categoria_id: z.string().uuid('UUID inválido')
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Falta autenticación' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const role = (user.user_metadata as any)?.role;
    if (role !== 'admin') return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const json = await req.json();
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Validación', details: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { nombre, categoria_id } = parsed.data;

    // Verificar que la categoría exista y pertenezca al usuario
    const { data: cat, error: catErr } = await supabase
      .from('categorias_financieras')
      .select('id, usuario_id, activa')
      .eq('id', categoria_id)
      .single();
    if (catErr || !cat) return new Response(JSON.stringify({ error: 'Categoría no encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (cat.usuario_id !== user.id) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // Duplicados por (categoria_id, nombre)
    const { data: dup, error: dupErr } = await supabase
      .from('subcategorias_financieras')
      .select('id')
      .eq('categoria_id', categoria_id)
      .ilike('nombre', nombre)
      .limit(1);
    if (dupErr) throw dupErr;
    if (dup && dup.length > 0) {
      return new Response(JSON.stringify({ error: 'Duplicado', message: 'Ya existe una subcategoría con ese nombre en esta categoría.' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: inserted, error } = await supabase
      .from('subcategorias_financieras')
      .insert({ nombre, categoria_id })
      .select('id, nombre, categoria_id, activa, created_at')
      .single();
    if (error) throw error;

    return new Response(JSON.stringify({ subcategoria: inserted }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Error interno', details: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


