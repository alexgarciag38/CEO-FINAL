// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

const QuerySchema = z.object({ q: z.string().min(1) });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: req.headers.get('Authorization')! } }
    });

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new Response('No autorizado', { status: 401, headers: corsHeaders });

    const url = new URL(req.url);
    const q = url.searchParams.get('q') || '';
    const { q: query } = QuerySchema.parse({ q });

    const { data, error } = await supabase
      .from('productos')
      .select('sku, nombre, costo')
      .eq('user_id', user.id)
      .ilike('nombre', `%${query}%`)
      .limit(10);
    if (error) throw error;

    return new Response(JSON.stringify(data ?? []), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (e) {
    return new Response(String(e?.message || e), { status: 500, headers: corsHeaders });
  }
});



