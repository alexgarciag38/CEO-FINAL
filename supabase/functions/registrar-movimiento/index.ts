// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const BodySchema = z.object({
  usuario_id: z.string().uuid().optional(),
  tipo: z.enum(['Ingreso','Egreso']),
  categoria_id: z.string().uuid().optional().nullable(),
  subcategoria_id: z.string().uuid().optional().nullable(),
  proveedor_cliente: z.string().trim().max(140).optional().nullable(),
  descripcion: z.string().trim().max(500).optional().nullable(),
  monto: z.number().positive(),
  fecha_movimiento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fecha_programada: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  fecha_efectiva: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  forma_pago: z.string().trim().max(60).optional().nullable(),
  fiscal: z.boolean().optional(),
  notas: z.string().trim().max(1000).optional().nullable(),
  estado: z.enum(['Registrado','Completado','Cancelado']).optional()
});

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    if (req.method !== 'POST') return new Response(JSON.stringify({ error: 'Método no permitido' }), { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Falta autenticación' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '', { global: { headers: { Authorization: authHeader } } });
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const role = (user.user_metadata as any)?.role;
    if (!['admin','colaborador'].includes(role)) return new Response(JSON.stringify({ error: 'Acceso denegado' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) return new Response(JSON.stringify({ error: 'Validación', details: parsed.error.flatten() }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const payload = parsed.data;

    const usuario_id = role === 'admin' ? (payload.usuario_id ?? user.id) : user.id;

    const insertData: Record<string, any> = { ...payload, usuario_id };

    const { data, error } = await supabase
      .from('movimientos_financieros')
      .insert(insertData)
      .select('*')
      .single();
    if (error) throw error;

    return new Response(JSON.stringify({ movimiento: data }), { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: 'Error interno', details: String(e?.message || e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});



