// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders, getSupabaseWithAuth, getUserOr401, readJson, ok, fail } from "../_shared/mod.ts";

type Body = { name: string; email?: string; company_id?: string };

// Validación robusta de entrada
const validateEmployeeData = (body: any): { isValid: boolean; error?: string } => {
  if (!body.name || typeof body.name !== 'string' || body.name.trim().length < 2) {
    return { isValid: false, error: 'Nombre inválido: debe tener al menos 2 caracteres' };
  }
  
  if (body.email && (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))) {
    return { isValid: false, error: 'Email inválido: formato incorrecto' };
  }
  // company_id es opcional y libre: permitir cualquier string no vacío si viene
  if (typeof body.company_id !== 'undefined' && body.company_id !== null && typeof body.company_id !== 'string') {
    return { isValid: false, error: 'company_id inválido' };
  }
  
  return { isValid: true };
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  
  try {
    if (req.method !== 'POST') {
      console.error('❌ Método no permitido:', req.method);
      return new Response('Not Found', { status: 404, headers: corsHeaders });
    }
    
    const { supabase, error } = getSupabaseWithAuth(req);
    if (error) {
      console.error('❌ Error de autenticación:', error);
      return error;
    }
    
    const user = await getUserOr401(supabase);
    console.log('✅ Usuario autenticado:', { id: user.id, email: user.email });
    
    // Parseo del body: usar un único flujo con clone() para evitar consumir el stream
    const body = await readJson<Body>(req.clone());

    // Normalizar campos
    if (typeof body?.email === 'string' && body.email.trim() === '') {
      body.email = undefined;
    }
    const originalName = body?.name;
    const trimmedName = typeof body?.name === 'string' ? body.name.trim() : '';
    if (typeof body?.name === 'string') {
      body.name = trimmedName;
    }

    console.log('📝 Datos recibidos (normalizados):', { name: body.name, name_length: body?.name?.length ?? 0, email: body.email, company_id: body.company_id });
    
    // Validación robusta
    const validation = validateEmployeeData(body);
    if (!validation.isValid) {
      const message = validation.error || 'Solicitud inválida';
      console.error('❌ Validación fallida:', message, { originalName, trimmedName, nameLength: trimmedName.length });
      return ok({ 
        error: message, 
        details: { 
          name_original: originalName ?? null,
          name_trimmed: trimmedName,
          name_length: trimmedName.length,
          email: body?.email ?? null, 
          company_id: body?.company_id ?? null 
        } 
      }, 400);
    }
    
    // Preparar datos para inserción
    const employeeData = {
      name: body.name,
      email: (typeof body.email === 'string' ? body.email.trim() : undefined) || null,
      company_id: body.company_id ?? null,
      user_id: user.id,
      is_active: true
    } as const;
    
    console.log('💾 Insertando empleado:', employeeData);
    
    const { data, error: err } = await supabase
      .from('employees')
      .insert(employeeData)
      .select('*')
      .single();
    
    if (err) {
      // Exponer detalles del error para diagnóstico
      const anyErr = err as any;
      console.error('❌ Error insertando empleado:', {
        message: anyErr?.message,
        code: anyErr?.code,
        details: anyErr?.details,
        hint: anyErr?.hint
      });
      return ok({
        error: anyErr?.message || 'DB error',
        code: anyErr?.code ?? null,
        details: anyErr?.details ?? null,
        hint: anyErr?.hint ?? null
      }, 400);
    }
    
    console.log('✅ Empleado creado exitosamente:', data);
    return ok({ item: data });
    
  } catch (e) {
    console.error('❌ Error en employees-create:', e);
    return fail(e);
  }
});


