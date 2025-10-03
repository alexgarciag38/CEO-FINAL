// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const BodySchema = z.object({
  id: z.string().uuid('UUID inválido'),
  nombre: z.string().trim().min(1, 'Nombre requerido').max(140)
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
    
    console.log('Usuario:', user.id, 'Email:', user.email);
    console.log('User metadata:', user.user_metadata);
    
    const role = (user.user_metadata as any)?.role;
    console.log('Rol del usuario:', role);
    
    if (role !== 'admin') {
      console.log('Acceso denegado - rol no es admin');
      return new Response(JSON.stringify({ error: 'Acceso denegado', details: `Rol actual: ${role}, se requiere: admin` }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const json = await req.json();
    console.log('Datos recibidos:', json);
    
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      console.log('Error de validación:', parsed.error.flatten());
      return new Response(JSON.stringify({ error: 'Validación', details: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const { id, nombre } = parsed.data;

    // Verificar que la subcategoría exista y pertenezca al usuario
    const { data: sub, error: subErr } = await supabase
      .from('subcategorias_financieras')
      .select('id, categoria_id, categorias_financieras!inner(usuario_id)')
      .eq('id', id)
      .single();
    
    if (subErr) {
      console.log('Error buscando subcategoría:', subErr);
      return new Response(JSON.stringify({ error: 'Subcategoría no encontrada', details: subErr.message }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (!sub) {
      return new Response(JSON.stringify({ error: 'Subcategoría no encontrada' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    
    if (sub.categorias_financieras.usuario_id !== user.id) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Verificar duplicados por (categoria_id, nombre) excluyendo la actual
    const { data: dup, error: dupErr } = await supabase
      .from('subcategorias_financieras')
      .select('id')
      .eq('categoria_id', sub.categoria_id)
      .ilike('nombre', nombre)
      .neq('id', id)
      .limit(1);
    
    if (dupErr) {
      console.log('Error verificando duplicados:', dupErr);
      throw dupErr;
    }
    
    if (dup && dup.length > 0) {
      return new Response(JSON.stringify({ error: 'Duplicado', message: 'Ya existe una subcategoría con ese nombre en esta categoría.' }), { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: updated, error } = await supabase
      .from('subcategorias_financieras')
      .update({ nombre })
      .eq('id', id)
      .select('id, nombre, categoria_id, activa, updated_at')
      .single();
    
    if (error) {
      console.log('Error actualizando:', error);
      throw error;
    }

    console.log('Subcategoría actualizada exitosamente:', updated);
    return new Response(JSON.stringify({ subcategoria: updated }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.log('Error general:', e);
    return new Response(JSON.stringify({ error: 'Error interno', details: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});