import { useMemo } from 'react';

const parseNumber = (value: any): number => {
  if (value === null || value === undefined) return 0;
  const num = parseFloat(String(value).replace(/[$,€\s]/g, ''));
  return isNaN(num) ? 0 : num;
};

const sanitizeText = (text: any): string => {
    return text ? String(text).trim() : '';
}

export const useSalesAnalysis = (rawData: any) => {
  return useMemo(() => {
    if (!rawData) return null;
    
    // Datos ya procesados por backend
    if (rawData.kpis && rawData.catalogoProductos) {
      console.log('Procesando datos del backend:', rawData);

      const catalogoProductosProcesado = rawData.catalogoProductos.map((producto: any) => ({
        descripcion: producto.Descripcion || producto.descripcion || '',
        costo: producto.Costo || producto.costo || 0,
        cantidad: producto.Cantidad || producto.cantidad || 0,
        importe: producto.Importe || producto.importe || 0,
        utilidad: producto.Utilidad || producto.utilidad || 0,
        precioVentaPorPieza: (producto.Importe || producto.importe || 0) / (producto.Cantidad || producto.cantidad || 1)
      }));

      // Agentes de mostrador (si vienen en payload ya mapeados) o derivados del resumen de sucursales
      const agentesMostradorFallback = Array.isArray(rawData.agentesMostrador)
        ? rawData.agentesMostrador
        : Array.isArray(rawData.analisisSucursales?.detalleVendedores)
          ? rawData.analisisSucursales.detalleVendedores.map((v: any) => ({ agente: v.vendedor, ventas: v.ventas }))
          : [];

      // Ventas por sucursal
      let ventasPorSucursalFallback = Array.isArray(rawData.ventasPorSucursal)
        ? rawData.ventasPorSucursal
        : Array.isArray(rawData.analisisSucursales?.resumen)
          ? rawData.analisisSucursales.resumen.map((r: any) => ({ sucursal: r.sucursal, ventas: r.ventas }))
          : [];

      // Derivar Domicilio cuando no venga o valga 0
      const domicilioFromAgents = agentesMostradorFallback
        .filter((a: any) => String(a.agente || '').toLowerCase().includes('domicilio'))
        .reduce((sum: number, a: any) => sum + (a.ventas || 0), 0);

      const idxDomicilio = ventasPorSucursalFallback.findIndex((r: any) => String(r.sucursal || '').toLowerCase().includes('domicilio'));
      if (idxDomicilio >= 0) {
        if (!ventasPorSucursalFallback[idxDomicilio].ventas && domicilioFromAgents) {
          ventasPorSucursalFallback[idxDomicilio] = { ...ventasPorSucursalFallback[idxDomicilio], ventas: domicilioFromAgents };
        }
      } else {
        ventasPorSucursalFallback = [
          ...ventasPorSucursalFallback,
          { sucursal: 'Domicilio', ventas: domicilioFromAgents || rawData.kpis?.ventasDomicilio || 0 }
        ];
      }
      
      return {
        ...rawData,
        catalogoProductos: catalogoProductosProcesado,
        ventasPorSucursal: ventasPorSucursalFallback,
        agentesMostrador: agentesMostradorFallback,
        rendimientoAgentes: rawData.rendimientoAgentes || [],
        clientesCampoTop: rawData.clientesCampoTop || [],
        clientesMostradorTop: rawData.clientesMostradorTop || []
      };
    }
    
    // Si no tienen la estructura esperada, devolver null
    if (!rawData.pedidos || !rawData.productos || !rawData.cobranza) {
      return null;
    }

    const pedidosData = rawData.pedidos.map((p: any) => ({
      cliente: sanitizeText(p.cliente),
      agente: sanitizeText(p.agente),
      total: parseNumber(p.total)
    }));

    const productosData = rawData.productos.map((p: any) => ({
      descripcion: sanitizeText(p.descripcion),
      costo: parseNumber(p.costo),
      cantidad: parseNumber(p.cantidad),
      importe: parseNumber(p.importe),
      utilidad: parseNumber(p.utilidad)
    }));
    
    const cobranzaData = rawData.cobranza.map((c: any) => ({
      saldo_pendiente: parseNumber(c.saldo_pendiente)
    }));

    // --- INICIO DE CÁLCULOS ---
    const ventasTotales = pedidosData.reduce((sum, p) => sum + p.total, 0);
    const totalPedidos = pedidosData.length;
    const unidadesVendidas = productosData.reduce((sum, p) => sum + p.cantidad, 0);
    const margenBruto = productosData.reduce((sum, p) => sum + p.utilidad, 0);
    const totalImporteProductos = productosData.reduce((sum, p) => sum + p.importe, 0);
    const margenBrutoPct = totalImporteProductos > 0 ? (margenBruto / totalImporteProductos) * 100 : 0;
    const carteraVencida = cobranzaData.reduce((sum, c) => sum + c.saldo_pendiente, 0);

    // SEPARAR VENTAS DE MOSTRADOR VS AGENTE
    const ventasMostrador = pedidosData
      .filter((p) => p.cliente && p.cliente.toLowerCase().includes('nota'))
      .reduce((sum, p) => sum + p.total, 0);
    
    const ventasConAgente = pedidosData
      .filter((p) => p.cliente && !p.cliente.toLowerCase().includes('nota'))
      .reduce((sum, p) => sum + p.total, 0);

    // TOP CLIENTES REALES (excluyendo "NOTA")
    const clientesTop = Object.values(pedidosData
      .filter((p) => p.cliente && !p.cliente.toLowerCase().includes('nota'))
      .reduce((acc: any, p) => {
        acc[p.cliente] = acc[p.cliente] || { cliente: p.cliente, ventas: 0 };
        acc[p.cliente].ventas += p.total;
        return acc;
      }, {})).sort((a: any, b: any) => b.ventas - a.ventas).slice(0, 10) as Array<{cliente: string, ventas: number}>;
    
    // RENDIMIENTO AGENTES DE VENTAS (excluyendo mostrador)
    const rendimientoAgentes = Object.values(pedidosData
      .filter((p) => p.agente && !p.agente.toLowerCase().includes('mostrador') && !p.cliente?.toLowerCase().includes('nota'))
      .reduce((acc: any, p) => {
        acc[p.agente] = acc[p.agente] || { agente: p.agente, ventas: 0 };
        acc[p.agente].ventas += p.total;
        return acc;
      }, {})).sort((a: any, b: any) => b.ventas - a.ventas) as Array<{agente: string, ventas: number}>;
    
    // AGENTES DE MOSTRADOR
    const agentesMostrador = Object.values(pedidosData
      .filter((p) => p.agente && p.agente.toLowerCase().includes('mostrador'))
      .reduce((acc: any, p) => {
        acc[p.agente] = acc[p.agente] || { agente: p.agente, ventas: 0 };
        acc[p.agente].ventas += p.total;
        return acc;
      }, {})).sort((a: any, b: any) => b.ventas - a.ventas) as Array<{agente: string, ventas: number}>;

    // ANÁLISIS POR SUCURSALES Y CANALES
    const ventasPorSucursal = (() => {
      const canales = {
        'Sucursal 1': 0,
        'Sucursal 2': 0,
        'Domicilio': 0
      };
      pedidosData.forEach(pedido => {
        const agente = pedido.agente.toLowerCase();
        if (agente.includes('mostrador')) {
          if (agente.includes('vicki')) canales['Sucursal 1'] += pedido.total;
          else if (agente.includes('sarahi') || agente.includes('maggi')) canales['Sucursal 2'] += pedido.total;
        } else if (agente.includes('domicilio')) {
          canales['Domicilio'] += pedido.total;
        }
      });
      return Object.entries(canales).map(([sucursal, ventas]) => ({ sucursal, ventas })).sort((a, b) => b.ventas - a.ventas);
    })();

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
    })() as {A: typeof productosData, B: typeof productosData, C: typeof productosData};
    
    const catalogoProductos = productosData.map(p => ({
        ...p,
        precioVentaPorPieza: p.cantidad > 0 ? (p.importe / p.cantidad) : 0
    })).sort((a, b) => b.importe - a.importe) as Array<{
        descripcion: string;
        costo: number;
        cantidad: number;
        importe: number;
        utilidad: number;
        precioVentaPorPieza: number;
    }>;

    const productosMenosVendidos = [...productosData]
        .sort((a, b) => a.cantidad - b.cantidad)
        .slice(0, 10)
        .map(p => ({
            ...p,
            precioVentaPorPieza: p.cantidad > 0 ? (p.importe / p.cantidad) : 0
        }));

    return {
        kpis: { 
          ventasTotales, 
          unidadesVendidas, 
          margenBruto, 
          margenBrutoPct: isNaN(margenBrutoPct) ? 0 : margenBrutoPct, 
          totalPedidos, 
          carteraVencida,
          ventasMostrador,
          ventasConAgente
        },
        rankingABC,
        clientesTop,
        rendimientoAgentes,
        agentesMostrador,
        ventasPorSucursal,
        catalogoProductos,
        productosMenosVendidos
    };
  }, [rawData]);
}; 