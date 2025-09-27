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

    // Usar service role para acceder a auth.users
    const adminKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '', 
      adminKey
    );

    // Obtener todos los usuarios
    const { data: users, error } = await adminClient.auth.admin.listUsers();

    if (error) throw error;

    // Filtrar solo colaboradores y formatear
    const colaboradores = users.users
      .filter(u => {
        const meta = u.user_metadata || u.raw_user_meta_data || {};
        const userRole = meta.role || meta.app_role;
        return userRole === 'colaborador';
      })
      .map(u => {
        const meta = u.user_metadata || u.raw_user_meta_data || {};
        return {
          id: u.id,
          nombre: meta.full_name || meta.name || u.email || `Usuario ${u.id.slice(0, 8)}`,
          email: u.email
        };
      })
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return new Response(JSON.stringify({ 
      colaboradores
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









