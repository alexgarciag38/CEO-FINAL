import { supabase } from '@/lib/supabase';

interface EdgeFunctionBody {
  [key: string]: any;
}

interface EdgeFunctionResponse {
  item?: any;
  items?: any[];
  message?: string;
  error?: string;
}
export async function invoke(
  name: string,
  options?: {
    body?: EdgeFunctionBody;
    query?: Record<string, string>;
    headers?: Record<string, string>;
    searchParams?: Record<string, string | number | boolean>;
  }
): Promise<EdgeFunctionResponse | undefined> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      console.error(`❌ invoke(${name}): No hay sesión de usuario activa.`);
      throw new Error('No hay sesión de usuario activa. Por favor, inicia sesión.');
    }

    const mergedBody = options?.body ?? (options?.searchParams ? options.searchParams : undefined);
    const payload = typeof mergedBody === 'undefined' ? undefined : mergedBody;

    const { data, error } = await supabase.functions.invoke(name, {
      body: payload as any,
      headers: {
        // Let supabase-js set proper content-type for JSON automatically
        'Authorization': `Bearer ${session.access_token}`,
        ...(options?.headers || {}),
      },
    } as any);

    if (error) {
      // Extraer detalles del error devueltos por la Edge Function
      const errAny = error as any;
      let detailedMessage: string | undefined;
      
      console.log(`🔍 DEBUG: Error completo para ${name}:`, {
        error: errAny,
        context: errAny?.context,
        message: errAny?.message,
        status: errAny?.status,
        statusText: errAny?.statusText
      });
      
      // 1) Intentar leer del Response real si está disponible
      const resp: Response | undefined = errAny?.context?.response;
      if (resp) {
        try {
          const raw = await resp.clone().text();
          console.log(`🔍 DEBUG: Response body para ${name}:`, raw);
          try {
            const parsed = JSON.parse(raw);
            detailedMessage = parsed?.error || parsed?.message || raw;
          } catch {
            detailedMessage = raw || undefined;
          }
        } catch (e) {
          console.log(`🔍 DEBUG: Error leyendo response:`, e);
        }
      }
      
      // 2) Fallback: intentar body en contexto
      if (!detailedMessage && errAny?.context?.body) {
        try {
          const parsed = typeof errAny.context.body === 'string' ? JSON.parse(errAny.context.body) : errAny.context.body;
          detailedMessage = parsed?.error || parsed?.message || JSON.stringify(parsed);
        } catch {
          detailedMessage = typeof errAny.context.body === 'string' ? errAny.context.body : undefined;
        }
      }
      
      // 3) Intentar extraer más información del error
      if (!detailedMessage) {
        detailedMessage = errAny?.details || errAny?.hint || errAny?.code || JSON.stringify(errAny);
      }
      
      const finalMessage = detailedMessage || errAny?.message || `Error desconocido al invocar '${name}'`;
      console.error(`❌ Error al invocar la Edge Function '${name}':`, { 
        error, 
        detailedMessage: finalMessage,
        fullError: errAny 
      });
      throw new Error(finalMessage);
    }

    if (!data) {
      console.warn(`⚠️ La Edge Function '${name}' no devolvió datos.`);
      return undefined;
    }

    return data as EdgeFunctionResponse;
  } catch (err) {
    console.error(`❌ Error general al invocar la Edge Function '${name}':`, err);
    throw err;
  }
}


