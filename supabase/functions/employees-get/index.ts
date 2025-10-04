import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, ok, fail, readJson } from "../_shared/mod.ts";

const parseParams = (params: any) => {
  const includeInactive = String(params?.all) === 'true' || params?.all === true;
  const rawCompanyId = params?.company_id;
  const companyId = (typeof rawCompanyId === 'string' && rawCompanyId.trim().length > 0)
    ? rawCompanyId.trim()
    : null;
  return { includeInactive, companyId };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    if (req.method !== 'GET' && req.method !== 'POST') {
      console.error('❌ Método no permitido:', req.method);
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
    
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) {
      console.error('❌ Error de autenticación:', error);
      return error;
    }
    
    const user = await getUserOr401(supabase);
    
    let params: any = {};
    if (req.method === 'GET') {
      const url = new URL(req.url);
      params = {
        all: url.searchParams.get('all'),
        company_id: url.searchParams.get('company_id')
      };
    } else {
      params = await readJson<any>(req);
    }
    
    const { includeInactive, companyId } = parseParams(params);
    console.log('📝 employees-get params:', {
      includeInactive, companyId, types: { all: typeof params?.all, company_id: typeof params?.company_id },
      user_id: user.id
    });
    
    // Construir consulta con validación
    let query = supabase
      .from('employees')
      .select('id, name, email, is_active, created_at, company_id, user_id')
      .order('name');
    
    // Filtrar por estado activo si es necesario
    if (!includeInactive) {
      query = query.eq('is_active', true);
    }
    
    // Filtrar por empresa si se especifica
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
    
    const { data, error: err } = await query;
    if (err) throw err;
    return ok({ items: data ?? [] });
    
  } catch (e) {
    console.error('❌ employees-get error:', e);
    return fail(e, 500);
  }
});


