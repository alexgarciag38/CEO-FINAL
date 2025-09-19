// Financial data for the financial module
export interface FinancialKPI {
  id: string;
  title: string;
  value: number;
  format: 'currency' | 'number' | 'percentage';
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  target?: number;
  icon: string;
}

export interface CashFlowItem {
  month: string;
  ingresos: number;
  gastos: number;
  flujoNeto: number;
  acumulado: number;
}

export interface ProfitLossItem {
  concepto: string;
  actual: number;
  presupuesto: number;
  variacion: number;
  porcentaje: number;
}

export interface BalanceSheetItem {
  concepto: string;
  actual: number;
  anterior: number;
  variacion: number;
}

// Generate financial KPIs
export const generateFinancialKPIs = (): FinancialKPI[] => [
  {
    id: 'revenue',
    title: 'Ingresos Totales',
    value: 1268000,
    format: 'currency',
    change: 12.5,
    changeType: 'increase',
    target: 1300000,
    icon: 'TrendingUp'
  },
  {
    id: 'gross_profit',
    title: 'Beneficio Bruto',
    value: 538800,
    format: 'currency',
    change: 15.2,
    changeType: 'increase',
    target: 550000,
    icon: 'DollarSign'
  },
  {
    id: 'operating_margin',
    title: 'Margen Operativo',
    value: 18.3,
    format: 'percentage',
    change: -1.2,
    changeType: 'decrease',
    target: 20,
    icon: 'PieChart'
  },
  {
    id: 'net_profit',
    title: 'Beneficio Neto',
    value: 156000,
    format: 'currency',
    change: 8.7,
    changeType: 'increase',
    target: 180000,
    icon: 'Target'
  },
  {
    id: 'cash_flow',
    title: 'Flujo de Caja',
    value: 189000,
    format: 'currency',
    change: 22.1,
    changeType: 'increase',
    target: 200000,
    icon: 'Banknote'
  },
  {
    id: 'roa',
    title: 'ROA',
    value: 12.8,
    format: 'percentage',
    change: 1.5,
    changeType: 'increase',
    target: 15,
    icon: 'Calculator'
  }
];

// Generate cash flow data
export const generateCashFlowData = (): CashFlowItem[] => {
  const months = ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'];
  let acumulado = 0;
  
  return months.map((month, index) => {
    const baseIngresos = 105000 + (index * 3000);
    const baseGastos = 78000 + (index * 2000);
    
    const ingresos = Math.round(baseIngresos * (0.9 + Math.random() * 0.2));
    const gastos = Math.round(baseGastos * (0.9 + Math.random() * 0.2));
    const flujoNeto = ingresos - gastos;
    acumulado += flujoNeto;
    
    return {
      month,
      ingresos,
      gastos,
      flujoNeto,
      acumulado
    };
  });
};

// Generate profit & loss data
export const generateProfitLossData = (): ProfitLossItem[] => [
  {
    concepto: 'Ingresos por Ventas',
    actual: 1268000,
    presupuesto: 1200000,
    variacion: 68000,
    porcentaje: 5.7
  },
  {
    concepto: 'Costo de Ventas',
    actual: 729200,
    presupuesto: 720000,
    variacion: -9200,
    porcentaje: -1.3
  },
  {
    concepto: 'Beneficio Bruto',
    actual: 538800,
    presupuesto: 480000,
    variacion: 58800,
    porcentaje: 12.3
  },
  {
    concepto: 'Gastos Operativos',
    actual: 306400,
    presupuesto: 320000,
    variacion: 13600,
    porcentaje: 4.3
  },
  {
    concepto: 'Gastos de Marketing',
    actual: 89500,
    presupuesto: 85000,
    variacion: -4500,
    porcentaje: -5.3
  },
  {
    concepto: 'Gastos Administrativos',
    actual: 67200,
    presupuesto: 70000,
    variacion: 2800,
    porcentaje: 4.0
  },
  {
    concepto: 'Beneficio Operativo',
    actual: 232400,
    presupuesto: 160000,
    variacion: 72400,
    porcentaje: 45.3
  },
  {
    concepto: 'Gastos Financieros',
    actual: 12800,
    presupuesto: 15000,
    variacion: 2200,
    porcentaje: 14.7
  },
  {
    concepto: 'Impuestos',
    actual: 63600,
    presupuesto: 40000,
    variacion: -23600,
    porcentaje: -59.0
  },
  {
    concepto: 'Beneficio Neto',
    actual: 156000,
    presupuesto: 105000,
    variacion: 51000,
    porcentaje: 48.6
  }
];

// Generate balance sheet data
export const generateBalanceSheetData = () => ({
  activos: [
    {
      concepto: 'Efectivo y Equivalentes',
      actual: 245000,
      anterior: 189000,
      variacion: 29.6
    },
    {
      concepto: 'Cuentas por Cobrar',
      actual: 156000,
      anterior: 142000,
      variacion: 9.9
    },
    {
      concepto: 'Inventario',
      actual: 89000,
      anterior: 95000,
      variacion: -6.3
    },
    {
      concepto: 'Activos Fijos',
      actual: 567000,
      anterior: 523000,
      variacion: 8.4
    },
    {
      concepto: 'Total Activos',
      actual: 1057000,
      anterior: 949000,
      variacion: 11.4
    }
  ],
  pasivos: [
    {
      concepto: 'Cuentas por Pagar',
      actual: 78000,
      anterior: 85000,
      variacion: -8.2
    },
    {
      concepto: 'Deuda a Corto Plazo',
      actual: 45000,
      anterior: 52000,
      variacion: -13.5
    },
    {
      concepto: 'Deuda a Largo Plazo',
      actual: 234000,
      anterior: 267000,
      variacion: -12.4
    },
    {
      concepto: 'Total Pasivos',
      actual: 357000,
      anterior: 404000,
      variacion: -11.6
    }
  ],
  patrimonio: [
    {
      concepto: 'Capital Social',
      actual: 500000,
      anterior: 500000,
      variacion: 0.0
    },
    {
      concepto: 'Utilidades Retenidas',
      actual: 200000,
      anterior: 45000,
      variacion: 344.4
    },
    {
      concepto: 'Total Patrimonio',
      actual: 700000,
      anterior: 545000,
      variacion: 28.4
    }
  ]
});

// Generate financial ratios
export const generateFinancialRatios = () => [
  {
    categoria: 'Liquidez',
    ratios: [
      { nombre: 'Ratio Corriente', valor: 2.8, benchmark: 2.0, estado: 'bueno' },
      { nombre: 'Prueba Ácida', valor: 2.1, benchmark: 1.5, estado: 'bueno' },
      { nombre: 'Ratio de Efectivo', valor: 1.9, benchmark: 1.0, estado: 'excelente' }
    ]
  },
  {
    categoria: 'Rentabilidad',
    ratios: [
      { nombre: 'ROE', valor: 22.3, benchmark: 15.0, estado: 'excelente' },
      { nombre: 'ROA', valor: 14.8, benchmark: 10.0, estado: 'bueno' },
      { nombre: 'Margen Neto', valor: 12.3, benchmark: 8.0, estado: 'bueno' }
    ]
  },
  {
    categoria: 'Endeudamiento',
    ratios: [
      { nombre: 'Deuda/Patrimonio', valor: 0.51, benchmark: 0.60, estado: 'bueno' },
      { nombre: 'Deuda/Activos', valor: 0.34, benchmark: 0.40, estado: 'bueno' },
      { nombre: 'Cobertura Intereses', valor: 18.1, benchmark: 5.0, estado: 'excelente' }
    ]
  },
  {
    categoria: 'Eficiencia',
    ratios: [
      { nombre: 'Rotación Activos', valor: 1.2, benchmark: 1.0, estado: 'bueno' },
      { nombre: 'Rotación Inventario', valor: 8.2, benchmark: 6.0, estado: 'bueno' },
      { nombre: 'Días Cobro', valor: 45, benchmark: 60, estado: 'bueno' }
    ]
  }
];

// Generate budget vs actual data
export const generateBudgetVsActual = () => {
  const categories = [
    'Ventas', 'Marketing', 'Operaciones', 'RRHH', 'Tecnología', 'Administración'
  ];
  
  return categories.map(category => {
    const presupuesto = 50000 + Math.random() * 100000;
    const actual = presupuesto * (0.8 + Math.random() * 0.4);
    const variacion = ((actual - presupuesto) / presupuesto) * 100;
    
    return {
      categoria: category,
      presupuesto: Math.round(presupuesto),
      actual: Math.round(actual),
      variacion: Number(variacion.toFixed(1)),
      estado: variacion > 10 ? 'exceso' : variacion < -10 ? 'ahorro' : 'normal'
    };
  });
};

// Generate expense breakdown
export const generateExpenseBreakdown = () => [
  { categoria: 'Salarios y Beneficios', monto: 245000, porcentaje: 38.5, color: '#3b82f6' },
  { categoria: 'Marketing y Publicidad', monto: 89500, porcentaje: 14.1, color: '#10b981' },
  { categoria: 'Operaciones', monto: 78000, porcentaje: 12.3, color: '#f59e0b' },
  { categoria: 'Tecnología', monto: 67200, porcentaje: 10.6, color: '#ef4444' },
  { categoria: 'Administración', monto: 56000, porcentaje: 8.8, color: '#8b5cf6' },
  { categoria: 'Otros', monto: 100300, porcentaje: 15.7, color: '#6b7280' }
];

// Generate quarterly comparison
export const generateQuarterlyComparison = () => [
  {
    trimestre: 'Q1 2024',
    ingresos: 285000,
    gastos: 198000,
    beneficio: 87000,
    margen: 30.5
  },
  {
    trimestre: 'Q2 2024',
    ingresos: 312000,
    gastos: 215000,
    beneficio: 97000,
    margen: 31.1
  },
  {
    trimestre: 'Q3 2024',
    ingresos: 334000,
    gastos: 228000,
    beneficio: 106000,
    margen: 31.7
  },
  {
    trimestre: 'Q4 2024',
    ingresos: 337000,
    gastos: 235000,
    beneficio: 102000,
    margen: 30.3
  }
];

