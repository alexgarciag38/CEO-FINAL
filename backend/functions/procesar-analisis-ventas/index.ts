// --- CEO COMMAND CENTER - EDGE FUNCTION: procesar-analisis-ventas ---
// --- VERSIÓN FINAL, DEFINITIVA Y AUDITADA ---

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import Papa from 'https://esm.sh/papaparse';

// --- SECCIÓN 1: CONFIGURACIÓN Y FUNCIONES DE AYUDA (ROBUSTAS) ---

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const columnMappings = {
    pedidos: {
        'cliente': ['cliente'],
        'agente': ['agente'],
        'total': ['total']
    },
    productos: {
        'descripcion': ['descripcion', 'producto'],
        'costo': ['costo'],
        'cantidad': ['cantidad'],
        'importe': ['importe'],
        'utilidad': ['utilidad', 'margen']
    },
    cobranza: {
        'saldo_pendiente': ['saldo_pendiente', 'monto']
    }
};

function normalizeHeader(h) {
    return typeof h === 'string'
        ? h.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        : '';
}

function validateFileStructure(headers, fileType) {
    const safeHeaders = headers || [];
    const requiredColumns = Object.keys(columnMappings[fileType] || {});
    const columnMap = {};
    const missingColumns = [];

    for (const reqCol of requiredColumns) {
        const possibleNames = columnMappings[fileType][reqCol] || [];
        const originalHeader = safeHeaders.find(h => possibleNames.includes(normalizeHeader(h)));
        if (originalHeader) {
            columnMap[reqCol] = originalHeader;
        } else {
            missingColumns.push(reqCol);
        }
    }
    return { valid: missingColumns.length === 0, missingColumns, columnMap };
}

function sanitizeAmount(amount) {
    if (amount === null || amount === undefined) return 0;
    const num = parseFloat(String(amount).replace(/[$,€\s]/g, ''));
    return isNaN(num) ? 0 : num;
}

function sanitizeText(text) {
    return text ? String(text).trim() : '';
}

// Helpers de segmentación (robustos por tokens)
const baseNormalize = (s: string) => (s || '').toString().trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
const clean = (s: string) => baseNormalize(s).replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();

const isSantaAnita = (agente: string) => {
  const a = clean(agente);
  return (a.includes('maggi') && a.includes('mostrador'))
      || (a.includes('sarahi') && a.includes('mostrador'))
      || (a.includes('facturacion') && a.includes('santa anita'));
};

const isCaminoReal = (agente: string) => {
  const a = clean(agente);
  return (a.includes('vicki') && a.includes('mostrador'))
      || (a.includes('facturacion') && a.includes('mostrador') && !a.includes('santa anita'));
};

const isDomicilio = (agente: string) => {
  const a = clean(agente);
  return a.includes('domicilio');
};

const isCampo = (agente: string) => {
  const a = clean(agente);
  return a.includes('telemarketing')
      || a.includes('valentin')
      || a.includes('ruben')
      || a.includes('julio')
      || a.includes('mercado libre');
};

const isMostradorExact = (agente: string) => isSantaAnita(agente) || isCaminoReal(agente) || isDomicilio(agente);

// --- SECCIÓN 2: SERVIDOR PRINCIPAL ---

Deno.serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // TEMPORAL: SIN VALIDACIÓN DE AUTENTICACIÓN
        const user = { id: 'temp-user', email: 'alexgarciag38@gmail.com' };
        
        // --- PROCESAMIENTO DE DATOS ---
        const formData = await req.formData();
        const [pedidosFile, productosFile, cobranzaFile] = [formData.get('pedidos'), formData.get('productos'), formData.get('cobranza')];

        // PARSE CSVs
        const pedidosParsed = pedidosFile ? Papa.parse(await pedidosFile.text(), { header: true, skipEmptyLines: true }) : { data: [], meta: { fields: [] } };
        const productosParsed = productosFile ? Papa.parse(await productosFile.text(), { header: true, skipEmptyLines: true }) : { data: [], meta: { fields: [] } };
        const cobranzaParsed = cobranzaFile ? Papa.parse(await cobranzaFile.text(), { header: true, skipEmptyLines: true }) : { data: [], meta: { fields: [] } };

        const valPedidos = validateFileStructure(pedidosParsed.meta?.fields, 'pedidos');
        const valProductos = validateFileStructure(productosParsed.meta?.fields, 'productos');
        const valCobranza = validateFileStructure(cobranzaParsed.meta?.fields, 'cobranza');

        if (!valPedidos.valid) return new Response(JSON.stringify({ error: 'Archivo de Pedidos inválido', message: `Faltan columnas: ${valPedidos.missingColumns.join(', ')}` }), { status: 400, headers: corsHeaders });
        if (!valProductos.valid) return new Response(JSON.stringify({ error: 'Archivo de Productos inválido', message: `Faltan columnas: ${valProductos.missingColumns.join(', ')}` }), { status: 400, headers: corsHeaders });
        if (!valCobranza.valid) return new Response(JSON.stringify({ error: 'Archivo de Cobranza inválido', message: `Faltan columnas: ${valCobranza.missingColumns.join(', ')}` }), { status: 400, headers: corsHeaders });

        // NORMALIZACIÓN
        const pedidosData = (pedidosParsed.data || []).map(row => ({ cliente: sanitizeText(row[valPedidos.columnMap['cliente']]), agente: sanitizeText(row[valPedidos.columnMap['agente']]), total: sanitizeAmount(row[valPedidos.columnMap['total']]) }));
        const productosData = (productosParsed.data || []).map(row => ({ descripcion: sanitizeText(row[valProductos.columnMap['descripcion']]), costo: sanitizeAmount(row[valProductos.columnMap['costo']]), cantidad: sanitizeAmount(row[valProductos.columnMap['cantidad']]), importe: sanitizeAmount(row[valProductos.columnMap['importe']]), utilidad: sanitizeAmount(row[valProductos.columnMap['utilidad']]) }));
        const cobranzaData = (cobranzaParsed.data || []).map(row => ({ saldo_pendiente: sanitizeAmount(row[valCobranza.columnMap['saldo_pendiente']]) }));

        // --- CÁLCULOS ---
        const ventasTotales = pedidosData.reduce((sum, p) => sum + p.total, 0);
        const totalPedidos = pedidosData.length;
        const unidadesVendidas = productosData.reduce((sum, p) => sum + p.cantidad, 0);
        const margenBruto = productosData.reduce((sum, p) => sum + p.utilidad, 0);
        const totalImporteProductos = productosData.reduce((sum, p) => sum + p.importe, 0);
        const margenBrutoPct = totalImporteProductos > 0 ? (margenBruto / totalImporteProductos) * 100 : 0;
        const carteraVencida = cobranzaData.reduce((sum, c) => sum + c.saldo_pendiente, 0);

        // Segmentación
        const ventasMostrador = pedidosData.filter(p => isMostradorExact(p.agente)).reduce((s, p) => s + p.total, 0);
        const ventasConAgente = pedidosData.filter(p => isCampo(p.agente)).reduce((s, p) => s + p.total, 0);
        const ventasDomicilio = pedidosData.filter(p => isDomicilio(p.agente)).reduce((s, p) => s + p.total, 0);

        // Clientes top por universo
        const clientesCampoTop = Object.values(
          pedidosData.filter(p => isCampo(p.agente)).reduce((acc: any, p) => {
            if (!p.cliente) return acc;
            acc[p.cliente] = acc[p.cliente] || { cliente: p.cliente, ventas: 0 };
            acc[p.cliente].ventas += p.total;
            return acc;
          }, {})
        ).sort((a: any, b: any) => b.ventas - a.ventas).slice(0, 10);

        const clientesMostradorTop = Object.values(
          pedidosData.filter(p => isMostradorExact(p.agente)).reduce((acc: any, p) => {
            if (!p.cliente) return acc;
            acc[p.cliente] = acc[p.cliente] || { cliente: p.cliente, ventas: 0 };
            acc[p.cliente].ventas += p.total;
            return acc;
          }, {})
        ).sort((a: any, b: any) => b.ventas - a.ventas).slice(0, 10);

        // Rendimiento de agentes
        const rendimientoAgentes = Object.values(
          pedidosData.filter(p => isCampo(p.agente)).reduce((acc: any, p) => {
            acc[p.agente] = acc[p.agente] || { agente: p.agente, ventas: 0 };
            acc[p.agente].ventas += p.total;
            return acc;
          }, {})
        ).sort((a: any, b: any) => b.ventas - a.ventas);

        const agentesMostrador = Object.values(
          pedidosData.filter(p => isMostradorExact(p.agente)).reduce((acc: any, p) => {
            acc[p.agente] = acc[p.agente] || { agente: p.agente, ventas: 0 };
            acc[p.agente].ventas += p.total;
            return acc;
          }, {})
        ).sort((a: any, b: any) => b.ventas - a.ventas);

        // Ventas por sucursal
        const ventasPorSucursal = (() => {
          const totales: Record<string, number> = {
            'Sucursal Principal (Santa Anita)': 0,
            'Sucursal 2 (Camino Real)': 0,
            'Domicilio': 0
          };
          pedidosData.forEach(p => {
            if (isSantaAnita(p.agente)) totales['Sucursal Principal (Santa Anita)'] += p.total;
            else if (isCaminoReal(p.agente)) totales['Sucursal 2 (Camino Real)'] += p.total;
            else if (isDomicilio(p.agente)) totales['Domicilio'] += p.total;
          });
          return Object.entries(totales).map(([sucursal, ventas]) => ({ sucursal, ventas })).sort((a, b) => b.ventas - a.ventas);
        })();

        const rankingABC = (() => {
            const productosOrdenados = [...productosData].sort((a, b) => b.importe - a.importe);
            const totalVentasProductos = productosOrdenados.reduce((sum, p) => sum + p.importe, 0);
            if(totalVentasProductos === 0) return { A:[], B:[], C:[] };
            const resultado = { A: [], B: [], C: [] } as any;
            let ventasAcumuladas = 0;
            for(const producto of productosOrdenados) {
                ventasAcumuladas += producto.importe;
                const porcentaje = (ventasAcumuladas / totalVentasProductos) * 100;
                resultado[porcentaje <= 80 ? 'A' : porcentaje <= 95 ? 'B' : 'C'].push(producto);
            }
            return resultado;
        })();
        
        const catalogoProductos = productosData.map(p => ({
            ...p,
            precioVentaPorPieza: p.cantidad > 0 ? (p.importe / p.cantidad) : 0
        })).sort((a, b) => b.importe - a.importe);

        // ENSAMBLAJE FINAL
        const analisis = {
            version: 'v3-clientes-por-area',
            kpis: { 
              ventasTotales, 
              unidadesVendidas, 
              margenBruto, 
              margenBrutoPct: isNaN(margenBrutoPct) ? 0 : margenBrutoPct, 
              totalPedidos, 
              carteraVencida,
              ventasMostrador,
              ventasConAgente,
              ventasDomicilio
            },
            rankingABC,
            clientesCampoTop,
            clientesMostradorTop,
            rendimientoAgentes,
            agentesMostrador,
            ventasPorSucursal,
            catalogoProductos,
            analisisSucursales: {
              resumen: ventasPorSucursal,
              detalleVendedores: agentesMostrador.map(a => ({ vendedor: a.agente, ventas: a.ventas }))
            }
        } as const;
        
        // PERSISTENCIA
        const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
        const { error: dbError } = await supabaseAdmin.from('ventas_historico').upsert({ mes: new Date().getMonth() + 1, anio: new Date().getFullYear(), usuario_id: user.id, datos: analisis }, { onConflict: 'mes,anio,usuario_id' });
        if (dbError) throw new Error(`Error en Base de Datos: ${dbError.message}`);

        return new Response(JSON.stringify(analisis), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error('[FATAL] Edge function error:', error.message);
        return new Response(JSON.stringify({ error: 'Error interno del servidor', message: error.message }), { status: 500, headers: corsHeaders });
    }
}); 