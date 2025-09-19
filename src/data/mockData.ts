import { KPI } from '@/types';

// Generate realistic sales data for the last 12 months
export const generateSalesData = () => {
  const months = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
    'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'
  ];
  
  return months.map((month, index) => {
    const baseRevenue = 80000 + (index * 5000) + (Math.random() * 20000);
    const baseOrders = 150 + (index * 10) + (Math.random() * 50);
    
    return {
      name: month,
      ingresos: Math.round(baseRevenue),
      ordenes: Math.round(baseOrders),
      conversion: Number((2.5 + Math.random() * 2).toFixed(1))
    };
  });
};

// Generate category distribution data
export const generateCategoryData = () => [
  { name: 'Productos A', value: 35, color: '#2563eb' },
  { name: 'Productos B', value: 28, color: '#10b981' },
  { name: 'Productos C', value: 20, color: '#f59e0b' },
  { name: 'Servicios', value: 17, color: '#8b5cf6' }
];

// Generate regional performance data
export const generateRegionalData = () => [
  { name: 'Madrid', ventas: 45000, clientes: 120 },
  { name: 'Barcelona', ventas: 38000, clientes: 95 },
  { name: 'Valencia', ventas: 28000, clientes: 75 },
  { name: 'Sevilla', ventas: 22000, clientes: 60 },
  { name: 'Bilbao', ventas: 18000, clientes: 45 }
];

// Generate quarterly comparison data
export const generateQuarterlyData = () => [
  { name: 'Q1 2023', actual: 285000, objetivo: 300000 },
  { name: 'Q2 2023', actual: 320000, objetivo: 310000 },
  { name: 'Q3 2023', actual: 298000, objetivo: 320000 },
  { name: 'Q4 2023', actual: 365000, objetivo: 350000 }
];

// Generate customer acquisition data
export const generateCustomerData = () => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  
  return months.map(month => ({
    name: month,
    nuevos: Math.round(25 + Math.random() * 15),
    recurrentes: Math.round(45 + Math.random() * 20),
    perdidos: Math.round(8 + Math.random() * 8)
  }));
};

// Generate main KPIs
export const generateMainKPIs = (): KPI[] => [
  {
    id: 'revenue',
    title: 'Ingresos Totales',
    value: 1268000,
    format: 'currency',
    change: 12.5,
    changeType: 'increase',
    icon: 'DollarSign'
  },
  {
    id: 'orders',
    title: 'Órdenes Totales',
    value: 2847,
    format: 'number',
    change: 8.3,
    changeType: 'increase',
    icon: 'ShoppingCart'
  },
  {
    id: 'conversion',
    title: 'Tasa de Conversión',
    value: 3.2,
    format: 'percentage',
    change: -0.5,
    changeType: 'decrease',
    icon: 'Target'
  },
  {
    id: 'customers',
    title: 'Clientes Activos',
    value: 1890,
    format: 'number',
    change: 15.7,
    changeType: 'increase',
    icon: 'Users'
  },
  {
    id: 'avg_order',
    title: 'Ticket Promedio',
    value: 445,
    format: 'currency',
    change: 4.2,
    changeType: 'increase',
    icon: 'CreditCard'
  },
  {
    id: 'satisfaction',
    title: 'Satisfacción Cliente',
    value: 4.6,
    format: 'number',
    change: 0.3,
    changeType: 'increase',
    icon: 'Star'
  }
];

// Generate financial KPIs
export const generateFinancialKPIs = (): KPI[] => [
  {
    id: 'gross_margin',
    title: 'Margen Bruto',
    value: 42.5,
    format: 'percentage',
    change: 2.1,
    changeType: 'increase',
    icon: 'TrendingUp'
  },
  {
    id: 'operating_margin',
    title: 'Margen Operativo',
    value: 18.3,
    format: 'percentage',
    change: -1.2,
    changeType: 'decrease',
    icon: 'Calculator'
  },
  {
    id: 'cash_flow',
    title: 'Flujo de Caja',
    value: 156000,
    format: 'currency',
    change: 8.7,
    changeType: 'increase',
    icon: 'Banknote'
  },
  {
    id: 'roa',
    title: 'ROA',
    value: 12.8,
    format: 'percentage',
    change: 1.5,
    changeType: 'increase',
    icon: 'PieChart'
  }
];

// Generate recent activities
export const generateRecentActivities = () => [
  {
    id: '1',
    type: 'sale',
    title: 'Nueva venta completada',
    description: 'Pedido #2847 por €1,250 - Cliente: Empresa ABC',
    timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
    icon: 'ShoppingCart',
    color: 'green'
  },
  {
    id: '2',
    type: 'customer',
    title: 'Nuevo cliente registrado',
    description: 'María González se ha registrado desde Madrid',
    timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
    icon: 'UserPlus',
    color: 'blue'
  },
  {
    id: '3',
    type: 'alert',
    title: 'Stock bajo detectado',
    description: 'Producto "Widget Pro" tiene solo 5 unidades restantes',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    icon: 'AlertTriangle',
    color: 'yellow'
  },
  {
    id: '4',
    type: 'payment',
    title: 'Pago recibido',
    description: 'Factura #INV-2024-0156 pagada por €3,450',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4), // 4 hours ago
    icon: 'CreditCard',
    color: 'green'
  },
  {
    id: '5',
    type: 'report',
    title: 'Reporte mensual generado',
    description: 'Reporte de ventas de enero 2024 disponible',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6), // 6 hours ago
    icon: 'FileText',
    color: 'purple'
  }
];

// Generate top products data
export const generateTopProducts = () => [
  { name: 'Widget Pro', ventas: 45000, unidades: 180, margen: 35.2 },
  { name: 'Service Plus', ventas: 38000, unidades: 95, margen: 42.8 },
  { name: 'Basic Kit', ventas: 28000, unidades: 220, margen: 28.5 },
  { name: 'Premium Suite', ventas: 22000, unidades: 45, margen: 55.1 },
  { name: 'Starter Pack', ventas: 18000, unidades: 160, margen: 22.3 }
];

// Generate performance trends
export const generatePerformanceTrends = () => {
  const weeks = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4'];
  
  return weeks.map(week => ({
    name: week,
    ventas: Math.round(20000 + Math.random() * 10000),
    visitas: Math.round(1500 + Math.random() * 500),
    leads: Math.round(80 + Math.random() * 40)
  }));
};

