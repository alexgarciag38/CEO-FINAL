// Esta función ha sido reemplazada por 'upsert-movimientos-en-lote'.
// Se mantiene el archivo para evitar 404 temporales durante el despliegue escalonado.
// Responderá 410 Gone indicando al cliente que use la nueva función.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

export default {} as any;

// deno-lint-ignore no-explicit-any
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  return new Response(JSON.stringify({
    error: 'Esta función fue reemplazada. Use upsert-movimientos-en-lote.'
  }), { status: 410, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});








