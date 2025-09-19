// --- CEO COMMAND CENTER - EDGE FUNCTION: procesar-analisis-ventas ---
// --- VERSIÓN FINAL, DEFINITIVA Y AUDITADA (ARQUITECTURA CORRECTA) ---

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
        const possibleNames = columnMappings[fileType][reqCol];
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

const isDomicilio = (agente: string) => clean(agente).includes('domicilio');

const isCampo = (agente: string) => {
  const a = clean(agente);
  return a.includes('telemarketing') || a.includes('valentin') || a.includes('ruben') || a.includes('julio') || a.includes('mercado libre');
};

const isMostradorExact = (agente: string) => isSantaAnita(agente) || isCaminoReal(agente) || isDomicilio(agente);

// Excluir clientes internos de mostrador (no reflejan ventas reales)
const isInternalClient = (cliente: string) => {
  const c = clean(cliente);
  return c.includes('empleados') || c.includes('error');
};

// --- SECCIÓN 2: SERVIDOR PRINCIPAL CON TODA LA LÓGICA DE NEGOCIO ---
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
  }

  try {
        // --- AUTENTICACIÓN DIRECTA Y ROBUSTA ---
        const authHeader = req.headers.get('authorization');
        if (!authHeader) return new Response(JSON.stringify({ error: 'Falta autenticación' }), { status: 401, headers: corsHeaders });
        const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_ANON_KEY'));
        const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (!user) return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: corsHeaders });

        // --- PROCESAMIENTO DE DATOS ---
    const formData = await req.formData();
        const [pedidosFile, productosFile, cobranzaFile] = [formData.get('pedidos'), formData.get('productos'), formData.get('cobranza')];
        if (!pedidosFile || !productosFile || !cobranzaFile) return new Response(JSON.stringify({ error: 'Se requieren los tres archivos.' }), { status: 400, headers: corsHeaders });

        const [pedidosText, productosText, cobranzaText] = await Promise.all([pedidosFile.text(), productosFile.text(), cobranzaFile.text()]);
        const pedidosParsed = Papa.parse(pedidosText, { header: true, skipEmptyLines: true });
        const productosParsed = Papa.parse(productosText, { header: true, skipEmptyLines: true });
        const cobranzaParsed = Papa.parse(cobranzaText, { header: true, skipEmptyLines: true });

        // VALIDACIÓN
        const valPedidos = validateFileStructure(pedidosParsed?.meta?.fields, 'pedidos');
        if (!valPedidos.valid) return new Response(JSON.stringify({ error: 'Archivo de Pedidos inválido', message: `Faltan columnas: ${valPedidos.missingColumns.join(', ')}` }), { status: 400, headers: corsHeaders });
        const valProductos = validateFileStructure(productosParsed?.meta?.fields, 'productos');
        if (!valProductos.valid) return new Response(JSON.stringify({ error: 'Archivo de Productos-Utilidad inválido', message: `Faltan columnas: ${valProductos.missingColumns.join(', ')}` }), { status: 400, headers: corsHeaders });
        const valCobranza = validateFileStructure(cobranzaParsed?.meta?.fields, 'cobranza');
        if (!valCobranza.valid) return new Response(JSON.stringify({ error: 'Archivo de Cobranza inválido', message: `Faltan columnas: ${valCobranza.missingColumns.join(', ')}` }), { status: 400, headers: corsHeaders });

        // NORMALIZACIÓN
        const pedidosData = (pedidosParsed.data || []).map(row => ({ cliente: sanitizeText(row[valPedidos.columnMap['cliente']]), agente: sanitizeText(row[valPedidos.columnMap['agente']]), total: sanitizeAmount(row[valPedidos.columnMap['total']]) }));
        const productosData = (productosParsed.data || []).map(row => ({ descripcion: sanitizeText(row[valProductos.columnMap['descripcion']]), costo: sanitizeAmount(row[valProductos.columnMap['costo']]), cantidad: sanitizeAmount(row[valProductos.columnMap['cantidad']]), importe: sanitizeAmount(row[valProductos.columnMap['importe']]), utilidad: sanitizeAmount(row[valProductos.columnMap['utilidad']]) }));
        const cobranzaData = (cobranzaParsed.data || []).map(row => ({ saldo_pendiente: sanitizeAmount(row[valCobranza.columnMap['saldo_pendiente']]) }));

        // --- CÁLCULOS CENTRALES ---
        const ventasTotales = pedidosData.reduce((sum, p) => sum + p.total, 0);
        const totalPedidos = pedidosData.length;
        const unidadesVendidas = productosData.reduce((sum, p) => sum + p.cantidad, 0);
        const margenBruto = productosData.reduce((sum, p) => sum + p.utilidad, 0);
        const totalImporteProductos = productosData.reduce((sum, p) => sum + p.importe, 0);
        const margenBrutoPct = totalImporteProductos > 0 ? (margenBruto / totalImporteProductos) * 100 : 0;
        const carteraVencida = cobranzaData.reduce((sum, c) => sum + c.saldo_pendiente, 0);

        // --- SEGMENTACIÓN ---
        const ventasMostrador = pedidosData.filter(p => isMostradorExact(p.agente)).reduce((s, p) => s + p.total, 0);
        const ventasConAgente = pedidosData.filter(p => isCampo(p.agente)).reduce((s, p) => s + p.total, 0);
        const ventasDomicilio = pedidosData.filter(p => isDomicilio(p.agente)).reduce((s, p) => s + p.total, 0);

        const clientesCampoTop = Object.values(
          pedidosData.filter(p => isCampo(p.agente)).reduce((acc: any, p) => {
            if (!p.cliente) return acc;
            acc[p.cliente] = acc[p.cliente] || { cliente: p.cliente, ventas: 0 };
            acc[p.cliente].ventas += p.total;
            return acc;
          }, {})
        ).sort((a: any, b: any) => b.ventas - a.ventas).slice(0, 10);

        const clientesMostradorTop = Object.values(
          pedidosData.filter(p => isMostradorExact(p.agente) && p.cliente && !clean(p.cliente).includes('nota') && !isInternalClient(p.cliente)).reduce((acc: any, p) => {
            acc[p.cliente] = acc[p.cliente] || { cliente: p.cliente, ventas: 0 };
            acc[p.cliente].ventas += p.total;
            return acc;
          }, {})
        ).sort((a: any, b: any) => b.ventas - a.ventas).slice(0, 10);

        // Clientes de Campo con más pedidos (frecuencia)
        const clientesCampoFrecuenciaTop = Object.values(
          pedidosData.filter(p => isCampo(p.agente) && p.cliente).reduce((acc: any, p) => {
            acc[p.cliente] = acc[p.cliente] || { cliente: p.cliente, pedidos: 0, ventas: 0 };
            acc[p.cliente].pedidos += 1;
            acc[p.cliente].ventas += p.total;
        return acc;
          }, {})
        ).sort((a: any, b: any) => b.pedidos - a.pedidos).slice(0, 10);

        // Clientes de Mostrador con más pedidos (excluyendo 'nota' y clientes internos)
        const clientesMostradorFrecuenciaTop = Object.values(
          pedidosData
            .filter(p => isMostradorExact(p.agente) && p.cliente && !clean(p.cliente).includes('nota') && !isInternalClient(p.cliente))
            .reduce((acc: any, p) => {
              acc[p.cliente] = acc[p.cliente] || { cliente: p.cliente, pedidos: 0, ventas: 0 };
              acc[p.cliente].pedidos += 1;
              acc[p.cliente].ventas += p.total;
        return acc;
            }, {})
        ).sort((a: any, b: any) => b.pedidos - a.pedidos).slice(0, 10);

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

        const ventasPorSucursal = (() => {
          const totales: Record<string, number> = {
            'Sucursal SANTA ANITA': 0,
            'Sucursal CAMINO REAL': 0,
            'Domicilio': 0
          };
          pedidosData.forEach(p => {
            if (isSantaAnita(p.agente)) totales['Sucursal SANTA ANITA'] += p.total;
            else if (isCaminoReal(p.agente)) totales['Sucursal CAMINO REAL'] += p.total;
            else if (isDomicilio(p.agente)) totales['Domicilio'] += p.total;
          });
          return Object.entries(totales).map(([sucursal, ventas]) => ({ sucursal, ventas })).sort((a, b) => b.ventas - a.ventas);
        })();

        // --- TICKETS PROMEDIO ---
        const CLIENTES_MOSTRADOR_SA_SET = new Set([
          clean('#102 nota 2 MAGGI'),
          clean('#101 nota 1 MAGGI'),
          clean('#105 nota 1 SARAHI'),
          clean('#106 nota 2 SARAHI')
        ]);

        const pedidosMostradorSantaAnita = pedidosData.filter(p => p.cliente && CLIENTES_MOSTRADOR_SA_SET.has(clean(p.cliente)));
        const pedidosDomicilio = pedidosData.filter(p => isDomicilio(p.agente));
        const pedidosCampo = pedidosData.filter(p => isCampo(p.agente));
        const pedidosCaminoRealVicki = pedidosData.filter(p => clean(p.agente) === clean('#5 A - VICKI caja 5 mostrador'));

        const calcProm = (arr: typeof pedidosData) => arr.length ? arr.reduce((s, x) => s + x.total, 0) / arr.length : 0;

        const ticketPromedio = {
          mostradorSantaAnita: calcProm(pedidosMostradorSantaAnita),
          domicilio: calcProm(pedidosDomicilio),
          campo: calcProm(pedidosCampo),
          caminoReal: calcProm(pedidosCaminoRealVicki)
        };

        const rankingABC = (() => {
            const productosOrdenados = [...productosData].sort((a, b) => b.importe - a.importe);
            const totalVentasProductos = productosOrdenados.reduce((sum, p) => sum + p.importe, 0);
            if(totalVentasProductos === 0) return { A:[], B:[], C:[] };
            const resultado = { A: [], B: [], C: [] };
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

        // --- ABC AVANZADO (Ventas x Rentabilidad x Rotación) ---
        const computeABCMap = (arr: number[]) => {
          const total = arr.reduce((s, x) => s + x, 0);
          const idxSorted = arr
            .map((v, i) => ({ v, i }))
            .sort((a, b) => b.v - a.v);
          let cum = 0;
          const cls: ('A' | 'B' | 'C')[] = new Array(arr.length).fill('C');
          for (let k = 0; k < idxSorted.length; k++) {
            cum += idxSorted[k].v;
            const pct = total > 0 ? (cum / total) * 100 : 0;
            cls[idxSorted[k].i] = pct <= 80 ? 'A' : pct <= 95 ? 'B' : 'C';
          }
          return cls;
        };

        const ventasArr = productosData.map(p => p.importe);
        const utilidadArr = productosData.map(p => Math.max(0, p.utilidad));
        const unidadesArr = productosData.map(p => p.cantidad);

        const ventasClass = computeABCMap(ventasArr);
        const rentabClass = computeABCMap(utilidadArr);
        const rotacionClass = computeABCMap(unidadesArr);

        const diasPeriodo = 30;
        const porProducto = productosData.map((p, idx) => {
          const margenPct = p.importe > 0 ? (p.utilidad / p.importe) * 100 : 0;
          const etiqueta = (() => {
            const vA = ventasClass[idx] === 'A';
            const rC = rotacionClass[idx] === 'C';
            const rA = rotacionClass[idx] === 'A';
            if (vA && rC && margenPct >= 20) return 'Estrella Dormida';
            if (vA && !rA && margenPct >= 15) return 'Vaca Lechera';
            if (!vA && rA) return 'Interrogante';
            if (margenPct < 5 && rotacionClass[idx] !== 'A') return 'Perro';
            return 'Mantener';
          })();
          return {
            descripcion: p.descripcion,
            ventas: p.importe,
            utilidad: p.utilidad,
            margenPct,
            unidades: p.cantidad,
            velocity: diasPeriodo > 0 ? p.cantidad / diasPeriodo : 0,
            ventasClase: ventasClass[idx],
            rentabilidadClase: rentabClass[idx],
            rotacionClase: rotacionClass[idx],
            etiqueta,
          };
        });

        const sumReduce = (arr: any[], key: string) => arr.reduce((s, x) => s + (x[key] || 0), 0);
        const ventasTot = sumReduce(porProducto, 'ventas');
        const utilidadTot = sumReduce(porProducto, 'utilidad');
        const unidadesTot = sumReduce(porProducto, 'unidades');

        const clases: ('A'|'B'|'C')[] = ['A','B','C'];
        const agregadosPorClase = clases.map(cl => {
          const items = porProducto.filter(p => p.ventasClase === cl);
          const v = sumReduce(items, 'ventas');
          const u = sumReduce(items, 'utilidad');
          const q = sumReduce(items, 'unidades');
          return {
            clase: cl,
            ventas: v,
            utilidad: u,
            margenPct: v > 0 ? (u / v) * 100 : 0,
            unidades: q,
            coberturaPct: ventasTot > 0 ? (v / ventasTot) * 100 : 0
          };
        });

        // Heatmap de oportunidades (Ventas alta/baja vs Rotación alta/baja)
        const heatmap = (() => {
          const high = { ventas: (p: any) => p.ventasClase === 'A', rot: (p: any) => p.rotacionClase === 'A' };
          const buckets = { estrellas: 0, vacas: 0, interrogantes: 0, perros: 0 } as Record<string, number>;
          porProducto.forEach(p => {
            const key = high.ventas(p) && high.rot(p) ? 'estrellas'
              : high.ventas(p) && !high.rot(p) ? 'vacas'
              : !high.ventas(p) && high.rot(p) ? 'interrogantes'
              : 'perros';
            buckets[key] += p.ventas;
          });
          return buckets;
        })();

        // Speedometers por clase = cobertura vs total ventas
        const speedometers = agregadosPorClase.reduce((acc: any, x) => {
          acc[x.clase] = Math.round(x.coberturaPct);
          return acc;
        }, {} as Record<string, number>);

        // Alertas y Top Oportunidades (alta rentabilidad + baja rotación)
        const oportunidades = porProducto
          .map(p => ({
            ...p,
            score: (p.margenPct) / (p.unidades + 1)
          }))
          .filter(p => p.margenPct >= 20 && p.rotacionClase === 'C')
          .sort((a, b) => b.score - a.score)
          .slice(0, 10)
          .map(p => ({
            producto: p.descripcion,
            ventas: p.ventas,
            utilidad: p.utilidad,
            margenPct: p.margenPct,
            unidades: p.unidades,
            etiqueta: p.etiqueta
          }));

        const alertas = oportunidades.slice(0, 3).map(p => `Oportunidad: ${p.producto} (margen ${p.margenPct.toFixed(1)}% con ${p.unidades} uds)`).concat(
          agregadosPorClase.map(c => `Clase ${c.clase}: ${c.coberturaPct.toFixed(1)}% de ventas`)
        );

        const abc_avanzado = {
          porProducto,
          agregadosPorClase,
          heatmap,
          speedometers,
          oportunidades,
          alertas
        };

        // --- ENSAMBLAJE FINAL ---
        const analisis = {
            version: 'v3-clientes-por-area',
            kpis: { ventasTotales, unidadesVendidas, margenBruto, margenBrutoPct: isNaN(margenBrutoPct) ? 0 : margenBrutoPct, totalPedidos, carteraVencida, ventasMostrador, ventasConAgente, ventasDomicilio, ticketPromedio },
            rankingABC,
            clientesTop: Object.values(pedidosData.reduce((acc: any, p) => { if(p.cliente){ acc[p.cliente] = acc[p.cliente] || { cliente: p.cliente, ventas: 0 }; acc[p.cliente].ventas += p.total; } return acc; }, {})).sort((a: any, b: any) => b.ventas - a.ventas).slice(0, 10),
            clientesCampoTop,
            clientesMostradorTop,
            clientesCampoFrecuenciaTop,
            clientesMostradorFrecuenciaTop,
            rendimientoAgentes,
            agentesMostrador,
            ventasPorSucursal,
            catalogoProductos,
            abc_avanzado,
            analisisSucursales: {
              resumen: ventasPorSucursal,
              detalleVendedores: agentesMostrador.map(a => ({ vendedor: a.agente, ventas: a.ventas }))
            }
        };

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