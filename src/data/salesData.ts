// Sales data for ABC analysis and sales module
export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  salesVolume: number;
  revenue: number;
  margin: number;
  abcCategory?: 'A' | 'B' | 'C';
  trend: 'up' | 'down' | 'stable';
  seasonality: number;
}

export interface SalesTransaction {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  date: Date;
  customer: string;
  region: string;
  salesperson: string;
}

export interface SalesKPI {
  id: string;
  title: string;
  value: number;
  format: 'currency' | 'number' | 'percentage';
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  target?: number;
  icon: string;
}

// Generate comprehensive product catalog with ABC analysis data
export const generateProductCatalog = (): Product[] => {
  const products: Product[] = [
    // Category A Products (High Revenue, High Volume)
    {
      id: 'PRD-001',
      name: 'Widget Pro Max',
      category: 'Productos Premium',
      price: 299.99,
      cost: 180.00,
      stock: 150,
      salesVolume: 450,
      revenue: 134995.50,
      margin: 39.97,
      trend: 'up',
      seasonality: 1.2
    },
    {
      id: 'PRD-002',
      name: 'Service Enterprise',
      category: 'Servicios',
      price: 899.99,
      cost: 450.00,
      stock: 0, // Service
      salesVolume: 120,
      revenue: 107999.00,
      margin: 50.00,
      trend: 'up',
      seasonality: 0.9
    },
    {
      id: 'PRD-003',
      name: 'Kit Profesional Plus',
      category: 'Kits',
      price: 199.99,
      cost: 120.00,
      stock: 200,
      salesVolume: 380,
      revenue: 75996.20,
      margin: 39.99,
      trend: 'stable',
      seasonality: 1.1
    },
    
    // Category B Products (Medium Revenue, Medium Volume)
    {
      id: 'PRD-004',
      name: 'Widget Standard',
      category: 'Productos Estándar',
      price: 149.99,
      cost: 90.00,
      stock: 300,
      salesVolume: 280,
      revenue: 41997.20,
      margin: 39.99,
      trend: 'stable',
      seasonality: 1.0
    },
    {
      id: 'PRD-005',
      name: 'Service Basic',
      category: 'Servicios',
      price: 299.99,
      cost: 150.00,
      stock: 0,
      salesVolume: 150,
      revenue: 44998.50,
      margin: 50.00,
      trend: 'down',
      seasonality: 0.8
    },
    {
      id: 'PRD-006',
      name: 'Accessory Pack',
      category: 'Accesorios',
      price: 79.99,
      cost: 35.00,
      stock: 500,
      salesVolume: 420,
      revenue: 33596.00,
      margin: 56.25,
      trend: 'up',
      seasonality: 1.3
    },
    {
      id: 'PRD-007',
      name: 'Training Course',
      category: 'Formación',
      price: 399.99,
      cost: 100.00,
      stock: 0,
      salesVolume: 85,
      revenue: 33999.15,
      margin: 75.00,
      trend: 'stable',
      seasonality: 0.7
    },
    
    // Category C Products (Low Revenue, Low Volume)
    {
      id: 'PRD-008',
      name: 'Widget Lite',
      category: 'Productos Básicos',
      price: 49.99,
      cost: 25.00,
      stock: 800,
      salesVolume: 320,
      revenue: 15996.80,
      margin: 49.99,
      trend: 'down',
      seasonality: 0.9
    },
    {
      id: 'PRD-009',
      name: 'Support Basic',
      category: 'Soporte',
      price: 99.99,
      cost: 30.00,
      stock: 0,
      salesVolume: 180,
      revenue: 17998.20,
      margin: 69.99,
      trend: 'stable',
      seasonality: 1.0
    },
    {
      id: 'PRD-010',
      name: 'Manual Digital',
      category: 'Documentación',
      price: 19.99,
      cost: 5.00,
      stock: 0,
      salesVolume: 450,
      revenue: 8995.50,
      margin: 74.99,
      trend: 'up',
      seasonality: 1.1
    },
    {
      id: 'PRD-011',
      name: 'Starter Kit',
      category: 'Kits',
      price: 89.99,
      cost: 45.00,
      stock: 400,
      salesVolume: 200,
      revenue: 17998.00,
      margin: 49.99,
      trend: 'stable',
      seasonality: 1.2
    },
    {
      id: 'PRD-012',
      name: 'Maintenance Basic',
      category: 'Mantenimiento',
      price: 149.99,
      cost: 60.00,
      stock: 0,
      salesVolume: 90,
      revenue: 13499.10,
      margin: 59.99,
      trend: 'down',
      seasonality: 0.8
    }
  ];

  // Calculate ABC categories based on revenue
  const sortedByRevenue = [...products].sort((a, b) => b.revenue - a.revenue);
  const totalRevenue = sortedByRevenue.reduce((sum, p) => sum + p.revenue, 0);
  
  let cumulativeRevenue = 0;
  sortedByRevenue.forEach(product => {
    cumulativeRevenue += product.revenue;
    const cumulativePercentage = (cumulativeRevenue / totalRevenue) * 100;
    
    if (cumulativePercentage <= 80) {
      product.abcCategory = 'A';
    } else if (cumulativePercentage <= 95) {
      product.abcCategory = 'B';
    } else {
      product.abcCategory = 'C';
    }
  });

  return products;
};

// Generate sales transactions for the last 6 months
export const generateSalesTransactions = (): SalesTransaction[] => {
  const products = generateProductCatalog();
  const customers = [
    'Empresa ABC S.L.', 'Corporación XYZ', 'Industrias DEF', 'Comercial GHI',
    'Servicios JKL', 'Tecnología MNO', 'Consultoría PQR', 'Distribuidora STU',
    'Logística VWX', 'Innovación YZ1', 'Desarrollo 234', 'Sistemas 567'
  ];
  const regions = ['Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Bilbao', 'Zaragoza'];
  const salespeople = ['Ana García', 'Carlos López', 'María Rodríguez', 'Juan Martín', 'Laura Sánchez'];
  
  const transactions: SalesTransaction[] = [];
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 6);
  
  // Generate transactions for each product based on their sales volume
  products.forEach(product => {
    const transactionCount = Math.floor(product.salesVolume / 10); // Average 10 units per transaction
    
    for (let i = 0; i < transactionCount; i++) {
      const transactionDate = new Date(startDate);
      transactionDate.setDate(transactionDate.getDate() + Math.floor(Math.random() * 180));
      
      const quantity = Math.floor(Math.random() * 15) + 1; // 1-15 units
      const unitPrice = product.price * (0.9 + Math.random() * 0.2); // ±10% price variation
      
      transactions.push({
        id: `TXN-${Date.now()}-${i}`,
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: Math.round(unitPrice * 100) / 100,
        totalAmount: Math.round(quantity * unitPrice * 100) / 100,
        date: transactionDate,
        customer: customers[Math.floor(Math.random() * customers.length)],
        region: regions[Math.floor(Math.random() * regions.length)],
        salesperson: salespeople[Math.floor(Math.random() * salespeople.length)]
      });
    }
  });
  
  return transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
};

// Generate sales KPIs
export const generateSalesKPIs = (): SalesKPI[] => [
  {
    id: 'total_sales',
    title: 'Ventas Totales',
    value: 587450,
    format: 'currency',
    change: 15.3,
    changeType: 'increase',
    target: 600000,
    icon: 'TrendingUp'
  },
  {
    id: 'units_sold',
    title: 'Unidades Vendidas',
    value: 3125,
    format: 'number',
    change: 8.7,
    changeType: 'increase',
    target: 3500,
    icon: 'Package'
  },
  {
    id: 'avg_order_value',
    title: 'Valor Promedio Pedido',
    value: 188.14,
    format: 'currency',
    change: 6.2,
    changeType: 'increase',
    target: 200,
    icon: 'CreditCard'
  },
  {
    id: 'conversion_rate',
    title: 'Tasa de Conversión',
    value: 3.8,
    format: 'percentage',
    change: -0.3,
    changeType: 'decrease',
    target: 4.5,
    icon: 'Target'
  },
  {
    id: 'gross_margin',
    title: 'Margen Bruto',
    value: 52.3,
    format: 'percentage',
    change: 2.1,
    changeType: 'increase',
    target: 55,
    icon: 'PieChart'
  },
  {
    id: 'customer_acquisition',
    title: 'Nuevos Clientes',
    value: 147,
    format: 'number',
    change: 12.8,
    changeType: 'increase',
    target: 160,
    icon: 'UserPlus'
  }
];

// Generate monthly sales data for trends
export const generateMonthlySalesData = () => {
  const months = ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'];
  
  return months.map((month, index) => {
    const baseValue = 80000 + (index * 8000);
    const seasonalFactor = month === 'Dic' ? 1.3 : month === 'Ene' ? 0.8 : 1.0;
    
    return {
      name: month,
      ventas: Math.round(baseValue * seasonalFactor * (0.9 + Math.random() * 0.2)),
      unidades: Math.round((baseValue / 180) * seasonalFactor * (0.9 + Math.random() * 0.2)),
      margen: Number((50 + Math.random() * 10).toFixed(1))
    };
  });
};

// Generate ABC analysis summary
export const generateABCAnalysis = () => {
  const products = generateProductCatalog();
  
  const categoryA = products.filter(p => p.abcCategory === 'A');
  const categoryB = products.filter(p => p.abcCategory === 'B');
  const categoryC = products.filter(p => p.abcCategory === 'C');
  
  const totalRevenue = products.reduce((sum, p) => sum + p.revenue, 0);
  
  return {
    categoryA: {
      count: categoryA.length,
      revenue: categoryA.reduce((sum, p) => sum + p.revenue, 0),
      percentage: (categoryA.reduce((sum, p) => sum + p.revenue, 0) / totalRevenue) * 100,
      products: categoryA
    },
    categoryB: {
      count: categoryB.length,
      revenue: categoryB.reduce((sum, p) => sum + p.revenue, 0),
      percentage: (categoryB.reduce((sum, p) => sum + p.revenue, 0) / totalRevenue) * 100,
      products: categoryB
    },
    categoryC: {
      count: categoryC.length,
      revenue: categoryC.reduce((sum, p) => sum + p.revenue, 0),
      percentage: (categoryC.reduce((sum, p) => sum + p.revenue, 0) / totalRevenue) * 100,
      products: categoryC
    },
    total: {
      count: products.length,
      revenue: totalRevenue
    }
  };
};

// Generate sales forecast data
export const generateSalesForecast = () => {
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
  
  return months.map((month, index) => {
    const baseValue = 95000 + (index * 5000);
    const optimistic = baseValue * 1.15;
    const realistic = baseValue;
    const pessimistic = baseValue * 0.85;
    
    return {
      name: month,
      optimista: Math.round(optimistic),
      realista: Math.round(realistic),
      pesimista: Math.round(pessimistic)
    };
  });
};

// Generate sales by region data
export const generateSalesByRegion = () => [
  { region: 'Madrid', ventas: 145000, crecimiento: 12.5, participacion: 24.7 },
  { region: 'Barcelona', ventas: 128000, crecimiento: 8.3, participacion: 21.8 },
  { region: 'Valencia', ventas: 89000, crecimiento: 15.2, participacion: 15.1 },
  { region: 'Sevilla', ventas: 76000, crecimiento: 6.8, participacion: 12.9 },
  { region: 'Bilbao', ventas: 68000, crecimiento: 9.1, participacion: 11.6 },
  { region: 'Otras', ventas: 81450, crecimiento: 11.7, participacion: 13.9 }
];

// Generate sales team performance
export const generateSalesTeamPerformance = () => [
  { 
    name: 'Ana García', 
    ventas: 125000, 
    objetivo: 120000, 
    cumplimiento: 104.2, 
    clientes: 45,
    region: 'Madrid'
  },
  { 
    name: 'Carlos López', 
    ventas: 118000, 
    objetivo: 115000, 
    cumplimiento: 102.6, 
    clientes: 38,
    region: 'Barcelona'
  },
  { 
    name: 'María Rodríguez', 
    ventas: 95000, 
    objetivo: 100000, 
    cumplimiento: 95.0, 
    clientes: 32,
    region: 'Valencia'
  },
  { 
    name: 'Juan Martín', 
    ventas: 87000, 
    objetivo: 90000, 
    cumplimiento: 96.7, 
    clientes: 28,
    region: 'Sevilla'
  },
  { 
    name: 'Laura Sánchez', 
    ventas: 92000, 
    objetivo: 85000, 
    cumplimiento: 108.2, 
    clientes: 35,
    region: 'Bilbao'
  }
];

