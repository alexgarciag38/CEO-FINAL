// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// Schema de validación ULTRA-ROBUSTO para un movimiento
const MovimientoSchema = z.object({
  tipo: z.enum(['Ingreso', 'Egreso'], {
    errorMap: () => ({ message: "Tipo debe ser 'Ingreso' o 'Egreso'" })
  }),
  categoria_id: z.string().uuid().optional().nullable(),
  subcategoria_id: z.string().uuid().optional().nullable(),
  proveedor_cliente: z.string().max(255, "Proveedor/Cliente no puede exceder 255 caracteres").optional().nullable(),
  descripcion: z.string().min(1, "Descripción es requerida").max(500, "Descripción no puede exceder 500 caracteres"),
  monto: z.number()
    .positive("Monto debe ser mayor a 0")
    .max(999999999.99, "Monto no puede exceder 999,999,999.99")
    .refine(val => Number.isFinite(val), "Monto debe ser un número válido"),
  fecha_movimiento: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha debe estar en formato YYYY-MM-DD")
    .refine(date => !isNaN(Date.parse(date)), "Fecha debe ser válida"),
  fecha_programada: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha programada debe estar en formato YYYY-MM-DD")
    .refine(date => !isNaN(Date.parse(date)), "Fecha programada debe ser válida")
    .optional()
    .nullable(),
  fecha_efectiva: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha efectiva debe estar en formato YYYY-MM-DD")
    .refine(date => !isNaN(Date.parse(date)), "Fecha efectiva debe ser válida")
    .optional()
    .nullable(),
  forma_pago: z.string().max(100, "Forma de pago no puede exceder 100 caracteres").optional().nullable(),
  fiscal: z.boolean().default(false),
  notas: z.string().max(1000, "Notas no pueden exceder 1000 caracteres").optional().nullable(),
  estado: z.enum(['Registrado', 'Completado', 'Cancelado'], {
    errorMap: () => ({ message: "Estado debe ser 'Registrado', 'Completado' o 'Cancelado'" })
  }).default('Registrado'),
  origen: z.enum(['unico', 'recurrente']).default('unico')
});

// Schema para el array de movimientos
const LoteMovimientosSchema = z.object({
  movimientos: z.array(MovimientoSchema).min(1).max(50) // Máximo 50 movimientos por lote
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
    const { movimientos } = LoteMovimientosSchema.parse(body);

    // Preparar los movimientos para insertar con timestamps automáticos
    const movimientosParaInsertar = movimientos.map(mov => ({
      ...mov,
      usuario_id: user.id, // Siempre usar el usuario autenticado
      origen: 'unico', // Marcar como movimiento único
      // Los timestamps se manejan automáticamente por la DB
      // created_at: DEFAULT NOW() en la tabla
      // updated_at: DEFAULT NOW() en la tabla, actualizado por trigger
    }));

    // Insertar todos los movimientos en una sola transacción
    const { data: movimientosInsertados, error } = await supabase
      .from('movimientos_financieros')
      .insert(movimientosParaInsertar)
      .select(`
        id,
        tipo,
        categoria_id,
        subcategoria_id,
        proveedor_cliente,
        descripcion,
        monto,
        fecha_movimiento,
        fecha_programada,
        fecha_efectiva,
        forma_pago,
        fiscal,
        notas,
        estado,
        origen,
        created_at,
        updated_at
      `);

    if (error) throw error;

    return new Response(JSON.stringify({ 
      success: true,
      movimientos_creados: movimientosInsertados?.length || 0,
      movimientos: movimientosInsertados
    }), { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    });

  } catch (e: any) {
    console.error('Error en guardar-movimientos-en-lote:', e);
    
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








