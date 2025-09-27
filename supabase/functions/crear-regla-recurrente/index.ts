// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Schema de validación para regla recurrente
const ReglaRecurrenteSchema = z.object({
  tipo: z.enum(['Ingreso', 'Egreso']),
  categoria_id: z.string().uuid().optional(),
  subcategoria_id: z.string().uuid().optional(),
  proveedor_cliente: z.string().optional(),
  descripcion: z.string().optional(),
  monto: z.number().positive(),
  forma_pago: z.string().optional(),
  fiscal: z.boolean().optional(),
  notas: z.string().optional(),
  frecuencia: z.enum(['Diaria', 'Semanal', 'Mensual', 'Trimestral', 'Semestral', 'Anual']),
  fecha_inicio_serie: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_fin_serie: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  dia_del_mes: z.number().min(1).max(31).optional(),
  dia_de_la_semana: z.number().min(0).max(6).optional(),
  activo: z.boolean().optional()
});

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
    if (!['admin', 'colaborador'].includes(role)) {
      return new Response(JSON.stringify({ error: 'Acceso denegado' }), { 
        status: 403, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Validar el body de la petición
    const body = await req.json();
    const reglaData = ReglaRecurrenteSchema.parse(body);

    // Validaciones adicionales según la frecuencia
    if (reglaData.frecuencia === 'Mensual' && !reglaData.dia_del_mes) {
      return new Response(JSON.stringify({ 
        error: 'Para frecuencia mensual se requiere especificar el día del mes' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (reglaData.frecuencia === 'Semanal' && reglaData.dia_de_la_semana === undefined) {
      return new Response(JSON.stringify({ 
        error: 'Para frecuencia semanal se requiere especificar el día de la semana' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Preparar los datos para insertar
    const reglaParaInsertar = {
      ...reglaData,
      usuario_id: user.id,
      activo: reglaData.activo ?? true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // Insertar la regla recurrente
    const { data: reglaInsertada, error } = await supabase
      .from('movimientos_recurrentes')
      .insert(reglaParaInsertar)
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ 
      success: true,
      regla: reglaInsertada
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (e: any) {
    console.error('Error en crear-regla-recurrente:', e);
    
    // Si es un error de validación de Zod, devolver mensaje específico
    if (e.name === 'ZodError') {
      return new Response(JSON.stringify({ 
        error: 'Datos inválidos', 
        details: e.issues?.map((issue: any) => `${issue.path.join('.')}: ${issue.message}`) || [e.message]
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    return new Response(JSON.stringify({ 
      error: 'Error interno', 
      details: String(e?.message || e) 
    }), { 
      status: 500, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });
  }
});









