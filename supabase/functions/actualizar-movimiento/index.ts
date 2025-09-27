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
  cambios: z.object({
    tipo: z.enum(['Ingreso','Egreso']).optional(),
    categoria_id: z.string().uuid().nullable().optional(),
    subcategoria_id: z.string().uuid().nullable().optional(),
    proveedor_cliente: z.string().trim().max(140).nullable().optional(),
    descripcion: z.string().trim().max(500).nullable().optional(),
    monto: z.number().positive().optional(),
    fecha_movimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    fecha_programada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    fecha_efectiva: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
    forma_pago: z.string().trim().max(60).nullable().optional(),
    fiscal: z.boolean().optional(),
    notas: z.string().trim().max(1000).nullable().optional(),
    estado: z.enum(['Registrado','Completado','Cancelado']).optional()
  }).refine(obj => Object.keys(obj).length > 0, { message: 'Sin cambios' })
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Falta autenticación' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Validación', details: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { id, cambios } = parsed.data;

    const { data: updated, error } = await supabase
      .from('movimientos_financieros')
      .update(cambios as any)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return new Response(JSON.stringify({ movimiento: updated }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Error interno', details: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});



