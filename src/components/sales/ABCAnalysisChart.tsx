import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

// Función para formatear números grandes (ej. 15000 -> 15k)
const formatNumber = (num: number) => {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num;
};

// Función para formatear moneda mexicana
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Función para formatear porcentaje
const formatPercentage = (value: number) => {
  return `${value.toFixed(1)}%`;
};

interface RawData {
  pedidos?: any[];
  productos?: any[];
  cobranza?: any[];
}

interface ProductData {
  descripcion: string;
  costo: number;
  cantidad: number;
  importe: number;
  utilidad: number;
}

interface ABCAnalysisChartProps {
  rawData?: RawData;
}

export const ABCAnalysisChart: React.FC<ABCAnalysisChartProps> = ({ rawData }) => {
  const [activeTab, setActiveTab] = useState('A');

  // 1. LÓGICA DE CÁLCULO INTERNA (El "Cerebro" del Componente)
  const analysisResult = useMemo(() => {
    // Función para obtener un valor de un objeto, probando múltiples nombres de clave
    const getValue = (obj: any, keys: string[]) => {
      for (const key of keys) {
        if (obj && obj[key] !== undefined) return obj[key];
        // Intenta también con la primera letra en mayúscula
        const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1);
        if (obj && obj[capitalizedKey] !== undefined) return obj[capitalizedKey];
      }
      return undefined;
    };

    // Función para sanitizar y convertir a número de forma segura
    const parseNumber = (value: any) => {
      if (value === null || value === undefined) return 0;
      const num = parseFloat(String(value).replace(/[$,€\s]/g, ''));
      return isNaN(num) ? 0 : num;
    };

    // Blindaje: si no hay datos de productos, no se puede hacer nada.
    if (!rawData || !rawData.productos || !rawData.productos.length) {
      return null;
    }
    
    // Mapear los datos crudos a una estructura limpia y robusta
    const productosData = rawData.productos.map((p: any) => ({
      descripcion: String(getValue(p, ['descripcion', 'producto']) || 'Sin Descripción'),
      costo: parseNumber(getValue(p, ['costo'])),
      cantidad: parseNumber(getValue(p, ['cantidad'])),
      importe: parseNumber(getValue(p, ['importe'])),
      utilidad: parseNumber(getValue(p, ['utilidad', 'margen']))
    }));

    // Cálculo del Ranking ABC
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

    // Cálculo de sumarios para KPIs y gráficos
    const summary = {
      A: {
        count: rankingABC.A.length,
        value: rankingABC.A.reduce((sum, p) => sum + p.importe, 0),
      },
      B: {
        count: rankingABC.B.length,
        value: rankingABC.B.reduce((sum, p) => sum + p.importe, 0),
      },
      C: {
        count: rankingABC.C.length,
        value: rankingABC.C.reduce((sum, p) => sum + p.importe, 0),
      },
    };
    
    const totalValue = summary.A.value + summary.B.value + summary.C.value;

    return { rankingABC, summary, totalValue };
  }, [rawData]);

  // Renderizado condicional si no hay datos
  if (!analysisResult) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No hay datos de productos para analizar
          </h3>
          <p className="text-gray-600">
            Carga archivos CSV con datos de productos para ver el análisis ABC
          </p>
        </div>
      </div>
    );
  }

  const { rankingABC, summary, totalValue } = analysisResult;

  // 2. CÁLCULO DE PORCENTAJES
  const percentages = {
    A: totalValue > 0 ? (summary.A.value / totalValue) * 100 : 0,
    B: totalValue > 0 ? (summary.B.value / totalValue) * 100 : 0,
    C: totalValue > 0 ? (summary.C.value / totalValue) * 100 : 0,
  };

  // 3. DATOS PARA EL GRÁFICO
  const chartData = [
    { 
      name: 'Clase A', 
      'Valor de Venta': summary.A.value, 
      'Productos': summary.A.count, 
      fill: '#3b82f6',
      percentage: percentages.A
    },
    { 
      name: 'Clase B', 
      'Valor de Venta': summary.B.value, 
      'Productos': summary.B.count, 
      fill: '#8b5cf6',
      percentage: percentages.B
    },
    { 
      name: 'Clase C', 
      'Valor de Venta': summary.C.value, 
      'Productos': summary.C.count, 
      fill: '#d946ef',
      percentage: percentages.C
    },
  ];

  // 4. FUNCIÓN PARA RENDERIZAR TABLA DE PRODUCTOS
  const renderProductTable = (products: ProductData[], className: string) => {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Productos {className} - {products.length} productos
          </h3>
          <Badge variant="outline" className="text-sm">
            Total: {formatCurrency(products.reduce((sum, p) => sum + p.importe, 0))}
          </Badge>
        </div>
        
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-semibold">Producto</TableHead>
                <TableHead className="text-right font-semibold">Unidades Vendidas</TableHead>
                <TableHead className="text-right font-semibold">Venta Total</TableHead>
                <TableHead className="text-right font-semibold">Utilidad Total</TableHead>
                <TableHead className="text-right font-semibold">% del Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.length > 0 ? (
                products.map((product, index) => (
                  <TableRow key={index} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {product.descripcion}
                    </TableCell>
                    <TableCell className="text-right">
                      {product.cantidad}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(product.importe)}
                    </TableCell>
                    <TableCell className="text-right">
                      <span className={`font-medium ${
                        product.utilidad >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {formatCurrency(product.utilidad)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatPercentage(totalValue > 0 ? (product.importe / totalValue) * 100 : 0)}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    No hay productos en esta categoría
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      {/* 1. TÍTULO PRINCIPAL */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Dashboard de Análisis ABC por Rendimiento de Ventas
        </h2>
        <p className="text-gray-600">
          Análisis de Pareto para optimización de inventario y estrategia de ventas
        </p>
      </div>

      {/* 2. SECCIÓN DE KPIs Y GRÁFICOS (Layout de 2 Columnas) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Columna Izquierda: KPIs Resumen */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen por Categoría</h3>
          
          {/* Tarjeta Clase A */}
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-blue-700 text-lg">
                Clase A (Top 80% de Ventas)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Productos:</span>
                <span className="font-semibold text-blue-900">{summary.A.count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor de Venta:</span>
                <span className="font-semibold text-blue-900">{formatCurrency(summary.A.value)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">% del Total:</span>
                <span className="font-semibold text-blue-900">{formatPercentage(percentages.A)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta Clase B */}
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-purple-700 text-lg">
                Clase B (Siguiente 15% de Ventas)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Productos:</span>
                <span className="font-semibold text-purple-900">{summary.B.count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor de Venta:</span>
                <span className="font-semibold text-purple-900">{formatCurrency(summary.B.value)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">% del Total:</span>
                <span className="font-semibold text-purple-900">{formatPercentage(percentages.B)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Tarjeta Clase C */}
          <Card className="border-l-4 border-l-pink-500">
            <CardHeader className="pb-3">
              <CardTitle className="text-pink-700 text-lg">
                Clase C (Último 5% de Ventas)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Productos:</span>
                <span className="font-semibold text-pink-900">{summary.C.count}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Valor de Venta:</span>
                <span className="font-semibold text-pink-900">{formatCurrency(summary.C.value)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">% del Total:</span>
                <span className="font-semibold text-pink-900">{formatPercentage(percentages.C)}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Visualización Principal */}
        <div className="space-y-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Distribución de Ventas</h3>
          
          <Card>
            <CardContent className="pt-6">
              <div style={{ height: '400px', width: '100%' }}>
                <ResponsiveContainer>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 14, fontWeight: 500 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value: any) => formatNumber(value).toString()} 
                      tick={{ fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      formatter={(value: any, name: any) => [
                        name === 'Valor de Venta' ? formatCurrency(value) : value, 
                        name
                      ]}
                      cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                      contentStyle={{
                        backgroundColor: 'white',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px',
                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                      }}
                    />
                    <Legend wrapperStyle={{ fontSize: '14px', fontWeight: 500 }} />
                    <Bar 
                      dataKey="Valor de Venta" 
                      radius={[4, 4, 0, 0]}
                      fill="#3b82f6"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 3. SECCIÓN DE TABLAS DETALLADAS */}
      <div className="space-y-6">
        <h3 className="text-lg font-semibold text-gray-900">Detalle de Productos por Categoría</h3>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="A" className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              Clase A ({summary.A.count})
            </TabsTrigger>
            <TabsTrigger value="B" className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              Clase B ({summary.B.count})
            </TabsTrigger>
            <TabsTrigger value="C" className="flex items-center gap-2">
              <div className="w-3 h-3 bg-pink-500 rounded-full"></div>
              Clase C ({summary.C.count})
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="A" className="mt-6">
            {renderProductTable(rankingABC.A, 'Clase A')}
          </TabsContent>
          
          <TabsContent value="B" className="mt-6">
            {renderProductTable(rankingABC.B, 'Clase B')}
          </TabsContent>
          
          <TabsContent value="C" className="mt-6">
            {renderProductTable(rankingABC.C, 'Clase C')}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

