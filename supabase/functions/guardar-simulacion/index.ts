// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'Falta autenticación' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const body = await req.json();
    const id = body?.id as string | undefined;
    const payload = {
      id,
      user_id: user.id,
      nombre_simulacion: String(body?.nombre_simulacion || '').slice(0, 200),
      platform: body?.platform ?? null,
      product_sku: body?.product_sku ?? null,
      product_name: String(body?.product_name || '').slice(0, 200),
      publication_price: body?.publication_price ?? null,
      net_profit: body?.net_profit ?? null,
      net_margin: body?.net_margin ?? null,
      total_estimated_costs: body?.total_estimated_costs ?? null,
      raw_simulation_data: body?.raw_simulation_data ?? {},
      scenario_desfavorable: body?.scenario_desfavorable ?? null,
      scenario_realista: body?.scenario_realista ?? null,
      scenario_optimista: body?.scenario_optimista ?? null,
    } as any;

    const { data, error } = await supabase
      .from('simulaciones')
      .upsert(payload, { onConflict: 'id' })
      .select('id')
      .single();
    if (error) throw error;

    return new Response(JSON.stringify({ id: data.id }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Error interno', details: String(e) }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});


