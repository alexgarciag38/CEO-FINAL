import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

// FUNCIÓN SIMPLIFICADA SIN VALIDACIÓN
async function validateUserRole(req: Request, allowedRoles: string[]) {
  // TEMPORAL: SIN VALIDACIÓN
  return { user: { id: 'temp-user', email: 'alexgarciag38@gmail.com' } };
}

function generateAIResponse(contexto: any, pregunta?: string): string {
  // Si no hay pregunta, generar insights proactivos
  if (!pregunta) {
    return generateProactiveInsights(contexto);
  }

  // Si hay pregunta, responder específicamente
  return answerSpecificQuestion(contexto, pregunta);
}

function generateProactiveInsights(contexto: any): string {
  const kpis = contexto?.kpis;
  const clientesTop = contexto?.clientesTop || [];
  const rendimientoAgentes = contexto?.rendimientoAgentes || [];
  const rankingABC = contexto?.rankingABC;

  let insights = "🧠 **ANÁLISIS INTELIGENTE DE VENTAS**\n\n";

  // Análisis de KPIs principales
  if (kpis) {
    const ventasTotales = kpis.ventasTotales || 0;
    const margenBruto = kpis.margenBruto || 0;
    const carteraVencida = kpis.carteraVencida || 0;
    const totalPedidos = kpis.totalPedidos || 0;

    insights += "📊 **KPIs PRINCIPALES:**\n";
    insights += `• Ventas Totales: $${ventasTotales.toLocaleString('es-MX')}\n`;
    insights += `• Margen Bruto: $${margenBruto.toLocaleString('es-MX')}\n`;
    insights += `• Total de Pedidos: ${totalPedidos}\n`;
    insights += `• Cartera Vencida: $${carteraVencida.toLocaleString('es-MX')}\n\n`;

    // Análisis de rentabilidad
    const margenBrutoPct = kpis.margenBrutoPct || 0;
    if (margenBrutoPct > 20) {
      insights += "✅ **EXCELENTE RENTABILIDAD:** Tu margen bruto está por encima del 20%, lo que indica una operación muy saludable.\n\n";
    } else if (margenBrutoPct > 10) {
      insights += "⚠️ **RENTABILIDAD ACEPTABLE:** Tu margen bruto está entre 10-20%. Considera optimizar costos para mejorar la rentabilidad.\n\n";
    } else {
      insights += "🔴 **RENTABILIDAD BAJA:** Tu margen bruto está por debajo del 10%. Revisa precios y costos urgentemente.\n\n";
    }

    // Análisis de cartera vencida
    const pctCartera = ventasTotales > 0 ? (carteraVencida / ventasTotales) * 100 : 0;
    if (pctCartera > 10) {
      insights += "🔴 **ALERTA CARTERA VENCIDA:** La cartera vencida representa más del 10% de tus ventas. Implementa estrategias de cobranza.\n\n";
    } else if (pctCartera > 5) {
      insights += "⚠️ **ATENCIÓN CARTERA:** La cartera vencida está entre 5-10%. Monitorea de cerca los pagos pendientes.\n\n";
    } else {
      insights += "✅ **CARTERA SALUDABLE:** La cartera vencida está bajo control (menos del 5%).\n\n";
    }
  }

  // Análisis de clientes top
  if (clientesTop.length > 0) {
    insights += "👥 **ANÁLISIS DE CLIENTES:**\n";
    const topCliente = clientesTop[0];
    insights += `• Tu mejor cliente es **${topCliente.cliente}** con ventas de $${topCliente.ventas.toLocaleString('es-MX')}\n`;
    insights += `• Representa el ${((topCliente.ventas / (kpis?.ventasTotales || 1)) * 100).toFixed(1)}% de tus ventas totales\n`;
    insights += "💡 **RECOMENDACIÓN:** Desarrolla estrategias de retención para este cliente clave.\n\n";
  }

  // Análisis de agentes
  if (rendimientoAgentes.length > 0) {
    insights += "🎯 **RENDIMIENTO DE AGENTES:**\n";
    const topAgente = rendimientoAgentes[0];
    insights += `• Tu mejor agente es **${topAgente.agente}** con ventas de $${topAgente.ventas.toLocaleString('es-MX')}\n`;
    insights += "💡 **RECOMENDACIÓN:** Replica las mejores prácticas de este agente en el equipo.\n\n";
  }

  // Análisis ABC
  if (rankingABC) {
    const productosA = rankingABC.A?.length || 0;
    const productosB = rankingABC.B?.length || 0;
    const productosC = rankingABC.C?.length || 0;

    insights += "📦 **ANÁLISIS ABC DE PRODUCTOS:**\n";
    insights += `• Productos Clase A (críticos): ${productosA}\n`;
    insights += `• Productos Clase B (importantes): ${productosB}\n`;
    insights += `• Productos Clase C (menores): ${productosC}\n`;
    insights += "💡 **RECOMENDACIÓN:** Enfócate en mantener stock de productos Clase A y optimizar inventario de Clase C.\n\n";
  }

  insights += "🚀 **PRÓXIMOS PASOS RECOMENDADOS:**\n";
  insights += "1. Revisa la cartera vencida y mejora procesos de cobranza\n";
  insights += "2. Analiza los productos Clase A para optimizar inventario\n";
  insights += "3. Desarrolla estrategias de retención para clientes top\n";
  insights += "4. Replica mejores prácticas del agente líder\n";

  return insights;
}

function answerSpecificQuestion(contexto: any, pregunta: string): string {
  const preguntaLower = pregunta.toLowerCase();
  const kpis = contexto?.kpis;
  const clientesTop = contexto?.clientesTop || [];
  const rendimientoAgentes = contexto?.rendimientoAgentes || [];
  const rankingABC = contexto?.rankingABC;

  // Preguntas sobre ventas totales
  if (preguntaLower.includes('ventas totales') || preguntaLower.includes('ventas') || preguntaLower.includes('total ventas')) {
    const ventas = kpis?.ventasTotales || 0;
    return `📊 **VENTAS TOTALES:** $${ventas.toLocaleString('es-MX')}\n\nEste es el total de todas las ventas registradas en el período analizado.`;
  }

  // Preguntas sobre margen
  if (preguntaLower.includes('margen') || preguntaLower.includes('utilidad') || preguntaLower.includes('ganancia')) {
    const margen = kpis?.margenBruto || 0;
    const margenPct = kpis?.margenBrutoPct || 0;
    return `💰 **MARGEN BRUTO:** $${margen.toLocaleString('es-MX')} (${margenPct.toFixed(1)}%)\n\nEste es el margen bruto total de todas las ventas.`;
  }

  // Preguntas sobre cartera vencida
  if (preguntaLower.includes('cartera') || preguntaLower.includes('vencida') || preguntaLower.includes('pendiente')) {
    const cartera = kpis?.carteraVencida || 0;
    const ventas = kpis?.ventasTotales || 0;
    const pct = ventas > 0 ? (cartera / ventas) * 100 : 0;
    return `⚠️ **CARTERA VENCIDA:** $${cartera.toLocaleString('es-MX')} (${pct.toFixed(1)}% de las ventas totales)\n\nEsta es la cantidad de dinero pendiente de cobro.`;
  }

  // Preguntas sobre mejores clientes
  if (preguntaLower.includes('mejor cliente') || preguntaLower.includes('clientes top') || preguntaLower.includes('top cliente')) {
    if (clientesTop.length === 0) {
      return "📋 No hay datos de clientes disponibles para el análisis.";
    }
    
    let respuesta = "👥 **TOP 5 CLIENTES:**\n\n";
    clientesTop.slice(0, 5).forEach((cliente: any, index: number) => {
      respuesta += `${index + 1}. **${cliente.cliente}** - $${cliente.ventas.toLocaleString('es-MX')}\n`;
    });
    return respuesta;
  }

  // Preguntas sobre mejores agentes
  if (preguntaLower.includes('mejor agente') || preguntaLower.includes('agentes top') || preguntaLower.includes('top agente')) {
    if (rendimientoAgentes.length === 0) {
      return "📋 No hay datos de agentes disponibles para el análisis.";
    }
    
    let respuesta = "🎯 **TOP 5 AGENTES:**\n\n";
    rendimientoAgentes.slice(0, 5).forEach((agente: any, index: number) => {
      respuesta += `${index + 1}. **${agente.agente}** - $${agente.ventas.toLocaleString('es-MX')}\n`;
    });
    return respuesta;
  }

  // Preguntas sobre productos ABC
  if (preguntaLower.includes('productos a') || preguntaLower.includes('clase a') || preguntaLower.includes('abc')) {
    if (!rankingABC) {
      return "📋 No hay datos de análisis ABC disponibles.";
    }
    
    const productosA = rankingABC.A || [];
    let respuesta = "📦 **PRODUCTOS CLASE A (CRÍTICOS):**\n\n";
    if (productosA.length === 0) {
      respuesta += "No hay productos clasificados como Clase A en este período.";
    } else {
      productosA.slice(0, 5).forEach((producto: any, index: number) => {
        respuesta += `${index + 1}. **${producto.descripcion || producto.producto}** - $${(producto.ventas || producto.importe || 0).toLocaleString('es-MX')}\n`;
      });
    }
    return respuesta;
  }

  // Pregunta general sobre el negocio
  if (preguntaLower.includes('cómo va') || preguntaLower.includes('estado') || preguntaLower.includes('resumen')) {
    return generateProactiveInsights(contexto);
  }

  // Respuesta por defecto
  return `🤖 **RESPUESTA DE IA:**\n\nHe analizado tu pregunta sobre "${pregunta}" pero necesito más contexto específico. Puedes preguntarme sobre:\n\n• Ventas totales y márgenes\n• Cartera vencida\n• Mejores clientes y agentes\n• Análisis ABC de productos\n• Estado general del negocio\n\n¿En qué aspecto específico te gustaría que me enfoque?`;
}

Deno.serve(async (req: Request) => {
  // Manejar CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // TEMPORAL: SIN VALIDACIÓN
    const user = { id: 'temp-user', email: 'alexgarciag38@gmail.com' };

    // Obtener datos del body
    const body = await req.json();
    const { contexto, pregunta } = body;

    if (!contexto) {
      return new Response(JSON.stringify({
        error: 'Contexto requerido',
        message: 'Se requiere el contexto de datos para el análisis'
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Generar respuesta de IA
    const respuesta = generateAIResponse(contexto, pregunta);

    // Guardar la interacción en la base de datos (opcional)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    try {
      await supabaseAdmin.from('ai_interactions').insert({
        usuario_id: user.id,
        pregunta: pregunta || 'Insight proactivo',
        respuesta: respuesta.substring(0, 1000), // Limitar longitud
        contexto_tipo: 'ventas',
        timestamp: new Date().toISOString()
      });
    } catch (dbError) {
      console.log('Error guardando interacción (no crítico):', dbError);
    }

    return new Response(JSON.stringify({
      respuesta,
      timestamp: new Date().toISOString(),
      contexto_analizado: {
        tiene_kpis: !!contexto.kpis,
        tiene_clientes: !!(contexto.clientesTop && contexto.clientesTop.length),
        tiene_agentes: !!(contexto.rendimientoAgentes && contexto.rendimientoAgentes.length),
        tiene_abc: !!contexto.rankingABC
      }
    }), {
      status: 200,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('[FATAL] Edge function error:', error);
    return new Response(JSON.stringify({
      error: 'Error interno del servidor',
      message: error.message
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}); 