// deno-lint-ignore-file no-explicit-any
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4';
import Papa from 'https://esm.sh/papaparse@5.4.1';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { z } from 'https://deno.land/x/zod@v3.22.4/mod.ts';

const RowSchema = z.object({
  codigo: z.string().min(1),
  descripcion: z.string().min(1),
  costo: z.union([z.string(), z.number()])
});

function sanitizeCost(value: string | number): number {
  if (typeof value === 'number') return value;
  const cleaned = value
    .replace(/\$/g, '')
    .replace(/,/g, '')
    .replace(/\s+/g, '')
    .trim();
  const parsed = Number(cleaned);
  if (!Number.isFinite(parsed)) throw new Error('Costo inválido');
  return parsed;
}

async function readFileAsText(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const decoder = new TextDecoder('utf-8');
  return decoder.decode(buf);
}

function parseCSV(text: string): Array<Record<string, any>> {
  const result = Papa.parse(text, { header: true, skipEmptyLines: true });
  if (result.errors?.length) {
    const first = result.errors[0];
    throw new Error(`CSV inválido: ${first.message}`);
  }
  return result.data as Array<Record<string, any>>;
}

function parseExcel(buf: ArrayBuffer): Array<Record<string, any>> {
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames[0];
  const sheet = wb.Sheets[sheetName];
  return XLSX.utils.sheet_to_json(sheet) as Array<Record<string, any>>;
}

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

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

    const form = await req.formData();
    const file = form.get('file') as File | null;
    if (!file) return new Response('Archivo requerido', { status: 400, headers: corsHeaders });

    const name = file.name?.toLowerCase() || '';
    let rows: Array<Record<string, any>> = [];
    if (name.endsWith('.csv')) {
      const text = await readFileAsText(file);
      rows = parseCSV(text);
    } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const buf = await file.arrayBuffer();
      rows = parseExcel(buf);
    } else {
      // intentar CSV por defecto
      const text = await readFileAsText(file);
      rows = parseCSV(text);
    }

    let ok = 0;
    let errores = 0;
    const toInsert: Array<{ user_id: string; sku: string; nombre: string; costo: number }> = [];

    for (const raw of rows) {
      try {
        const parsed = RowSchema.parse({
          codigo: String(raw.codigo ?? raw.sku ?? raw.CODIGO ?? raw.Codigo ?? '').trim(),
          descripcion: String(raw.descripcion ?? raw.nombre ?? raw.DESCRIPCION ?? raw.Descripcion ?? '').trim(),
          costo: raw.costo ?? raw.COSTO ?? raw.Costo ?? raw.precio ?? raw.PRECIO
        });
        const costo = sanitizeCost(parsed.costo);
        if (!parsed.codigo || !parsed.descripcion) throw new Error('Faltan campos');
        toInsert.push({ user_id: user.id, sku: parsed.codigo, nombre: parsed.descripcion, costo });
        ok++;
      } catch (_) {
        errores++;
      }
    }

    // upsert por lotes
    const chunkSize = 500;
    for (let i = 0; i < toInsert.length; i += chunkSize) {
      const chunk = toInsert.slice(i, i + chunkSize);
      const { error } = await supabase
        .from('productos')
        .upsert(chunk, { onConflict: 'user_id,sku' });
      if (error) {
        // degradar: contar como errores pero continuar
        errores += chunk.length;
      }
    }

    return new Response(JSON.stringify({ productosCargados: ok, errores }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  } catch (e) {
    return new Response(String(e?.message || e), { status: 500, headers: corsHeaders });
  }
});
