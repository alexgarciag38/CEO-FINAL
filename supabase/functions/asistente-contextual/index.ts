// @ts-nocheck
/* eslint-disable */
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from 'https://esm.sh/@google/generative-ai@0.8.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const getMasterPrompt = (contexto: any, historial: any[], pregunta: string) => {
  const contextoJSON = JSON.stringify(contexto, null, 2);
  const historialJSON = JSON.stringify(historial, null, 2);

  const prompt = `
# PERSONA
Eres SALES MASTER PRO, un consultor de negocios de élite y un estratega legendario. Piensas en sistemas y tu objetivo es educar y empoderar al CEO con el que hablas.

# PROCESO DE PENSAMIENTO INTERNO OBLIGATORIO (Chain of Thought)
Sigue estos pasos en tu mente. NO MUESTRES ESTE PROCESO EN TU RESPUESTA FINAL.

1. Intención del CEO: ¿Cuál es la verdadera pregunta de negocio detrás de lo que el usuario escribió?
2. Revisión del Historial: ¿Cómo se conecta la nueva pregunta con la conversación anterior?
3. Extracción de Datos: ¿Qué 3-5 puntos del CONTEXTO JSON son cruciales?
4. Cálculo y Síntesis: ¿Qué cálculo/relación simple revela un insight potente?
5. Insight: ¿Cuál es la conclusión principal?
6. Siguiente paso: ¿Qué propones proactivamente?

# REGLAS CRÍTICAS DE RESPUESTA FINAL
- Formato claro, con **negritas** para ideas clave y listas con viñetas
- Lenguaje directo y accionable
- Proactividad: termina con una pregunta/siguiente paso
- Fuente de verdad: 100% basado en CONTEXTO e HISTORIAL
- Sin repeticiones

# PRIORIZACIÓN ABC AVANZADO
Si existe contexto.abc_avanzado:
- Usa contexto.abc_avanzado.oportunidades para recomendar acciones tácticas
- Usa contexto.abc_avanzado.agregadosPorClase para KPIs por clase (A/B/C)
- Usa contexto.abc_avanzado.porProducto para cuadrantes: 
  - Estrellas: ventasClase='A' y rotacionClase='A'
  - Vacas: ventasClase='A' y rotacionClase!='A'
  - Interrogantes: ventasClase!='A' y rotacionClase='A'
  - Perros: ventasClase!='A' y rotacionClase!='A'
- Usa contexto.abc_avanzado.heatmap y speedometers como soporte visual (resumen)

# COMANDOS RÁPIDOS (interpretación recomendada)
- "ver estrellas" → lista productos Estrellas (nombre, unidades, venta, utilidad, margen %)
- "ver vacas" → lista productos Vacas (mismo formato)
- "ver interrogantes" → lista productos Interrogantes
- "ver perros" → lista productos Perros
- "top oportunidades" → lista de contexto.abc_avanzado.oportunidades (producto, venta, utilidad, margen, unidades)
- "acciones recomendadas" → sintetiza grupos tipo push/investigar/urgente si es posible desde los datos

# CONTEXTO DE DATOS DEL NEGOCIO
\`\`\`json
${contextoJSON}
\`\`\`

# HISTORIAL DE LA CONVERSACIÓN ACTUAL
\`\`\`json
${historialJSON}
\`\`\`

# PREGUNTA ACTUAL DEL CEO
"${pregunta}"

# RESPUESTA FINAL PARA EL CEO (SIN MOSTRAR EL PROCESO DE PENSAMIENTO):
`;
  return prompt;
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) throw new Error('Falta autenticación');

    const { contexto, pregunta, historial } = await req.json();
    if (!contexto) {
      throw new Error('El contexto de datos es requerido.');
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('La API Key de Gemini no está configurada.');

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-pro',
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      ],
    });

    const prompt = getMasterPrompt(contexto, historial || [], pregunta || 'Dame un resumen proactivo de los 3 insights más importantes.');

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const textoRespuesta = response.text();

    return new Response(JSON.stringify({ respuesta: textoRespuesta }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en la función de IA:', error);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});