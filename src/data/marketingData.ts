// Marketing data for the marketing module
export interface MarketingKPI {
  id: string;
  title: string;
  value: number;
  format: 'currency' | 'number' | 'percentage';
  change: number;
  changeType: 'increase' | 'decrease' | 'stable';
  target?: number;
  icon: string;
}

export interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'social' | 'ppc' | 'content' | 'display';
  status: 'active' | 'paused' | 'completed' | 'draft';
  budget: number;
  spent: number;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cpc: number;
  roas: number;
  startDate: Date;
  endDate: Date;
}

export interface ChannelPerformance {
  channel: string;
  visitors: number;
  conversions: number;
  revenue: number;
  cost: number;
  roi: number;
  cpa: number;
}

// Generate marketing KPIs
export const generateMarketingKPIs = (): MarketingKPI[] => [
  {
    id: 'marketing_spend',
    title: 'Inversión Marketing',
    value: 89500,
    format: 'currency',
    change: 12.3,
    changeType: 'increase',
    target: 95000,
    icon: 'DollarSign'
  },
  {
    id: 'leads_generated',
    title: 'Leads Generados',
    value: 1247,
    format: 'number',
    change: 18.7,
    changeType: 'increase',
    target: 1300,
    icon: 'Users'
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
    id: 'cpa',
    title: 'Costo por Adquisición',
    value: 71.8,
    format: 'currency',
    change: -8.2,
    changeType: 'decrease',
    target: 65,
    icon: 'Calculator'
  },
  {
    id: 'roas',
    title: 'ROAS',
    value: 4.2,
    format: 'number',
    change: 15.4,
    changeType: 'increase',
    target: 4.5,
    icon: 'TrendingUp'
  },
  {
    id: 'brand_awareness',
    title: 'Conocimiento de Marca',
    value: 67.3,
    format: 'percentage',
    change: 5.8,
    changeType: 'increase',
    target: 70,
    icon: 'Eye'
  }
];

// Generate campaign data
export const generateCampaigns = (): Campaign[] => [
  {
    id: 'CAM-001',
    name: 'Campaña Black Friday 2024',
    type: 'ppc',
    status: 'active',
    budget: 15000,
    spent: 12800,
    impressions: 245000,
    clicks: 3920,
    conversions: 156,
    ctr: 1.6,
    cpc: 3.27,
    roas: 4.8,
    startDate: new Date('2024-11-15'),
    endDate: new Date('2024-12-01')
  },
  {
    id: 'CAM-002',
    name: 'Email Newsletter Diciembre',
    type: 'email',
    status: 'active',
    budget: 2500,
    spent: 1890,
    impressions: 45000,
    clicks: 2250,
    conversions: 89,
    ctr: 5.0,
    cpc: 0.84,
    roas: 6.2,
    startDate: new Date('2024-12-01'),
    endDate: new Date('2024-12-31')
  },
  {
    id: 'CAM-003',
    name: 'Social Media Awareness',
    type: 'social',
    status: 'active',
    budget: 8000,
    spent: 6200,
    impressions: 180000,
    clicks: 2700,
    conversions: 67,
    ctr: 1.5,
    cpc: 2.30,
    roas: 3.4,
    startDate: new Date('2024-11-01'),
    endDate: new Date('2024-12-31')
  },
  {
    id: 'CAM-004',
    name: 'Content Marketing Q4',
    type: 'content',
    status: 'active',
    budget: 5000,
    spent: 4100,
    impressions: 95000,
    clicks: 1900,
    conversions: 45,
    ctr: 2.0,
    cpc: 2.16,
    roas: 2.8,
    startDate: new Date('2024-10-01'),
    endDate: new Date('2024-12-31')
  },
  {
    id: 'CAM-005',
    name: 'Display Retargeting',
    type: 'display',
    status: 'paused',
    budget: 3000,
    spent: 2850,
    impressions: 320000,
    clicks: 1280,
    conversions: 23,
    ctr: 0.4,
    cpc: 2.23,
    roas: 1.9,
    startDate: new Date('2024-11-01'),
    endDate: new Date('2024-11-30')
  },
  {
    id: 'CAM-006',
    name: 'Campaña Año Nuevo 2025',
    type: 'ppc',
    status: 'draft',
    budget: 12000,
    spent: 0,
    impressions: 0,
    clicks: 0,
    conversions: 0,
    ctr: 0,
    cpc: 0,
    roas: 0,
    startDate: new Date('2024-12-26'),
    endDate: new Date('2025-01-15')
  }
];

// Generate channel performance data
export const generateChannelPerformance = (): ChannelPerformance[] => [
  {
    channel: 'Google Ads',
    visitors: 8450,
    conversions: 234,
    revenue: 89500,
    cost: 18600,
    roi: 381,
    cpa: 79.5
  },
  {
    channel: 'Facebook Ads',
    visitors: 6200,
    conversions: 156,
    revenue: 62400,
    cost: 12800,
    roi: 387,
    cpa: 82.1
  },
  {
    channel: 'Email Marketing',
    visitors: 3800,
    conversions: 189,
    revenue: 75600,
    cost: 2400,
    roi: 3050,
    cpa: 12.7
  },
  {
    channel: 'SEO Orgánico',
    visitors: 12500,
    conversions: 298,
    revenue: 119200,
    cost: 8500,
    roi: 1302,
    cpa: 28.5
  },
  {
    channel: 'LinkedIn Ads',
    visitors: 2100,
    conversions: 67,
    revenue: 26800,
    cost: 5200,
    roi: 415,
    cpa: 77.6
  },
  {
    channel: 'Content Marketing',
    visitors: 4500,
    conversions: 89,
    revenue: 35600,
    cost: 6800,
    roi: 424,
    cpa: 76.4
  }
];

// Generate funnel data
export const generateFunnelData = () => [
  { stage: 'Visitantes', count: 45000, percentage: 100, color: '#3b82f6' },
  { stage: 'Leads', count: 4500, percentage: 10, color: '#10b981' },
  { stage: 'Oportunidades', count: 1350, percentage: 3, color: '#f59e0b' },
  { stage: 'Clientes', count: 405, percentage: 0.9, color: '#ef4444' }
];

// Generate monthly marketing data
export const generateMonthlyMarketingData = () => {
  const months = ['Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic', 'Ene'];
  
  return months.map((month, index) => {
    const baseSpend = 7000 + (index * 500);
    const baseLeads = 800 + (index * 50);
    const baseRevenue = 45000 + (index * 3000);
    
    return {
      name: month,
      inversion: Math.round(baseSpend * (0.9 + Math.random() * 0.2)),
      leads: Math.round(baseLeads * (0.9 + Math.random() * 0.2)),
      ingresos: Math.round(baseRevenue * (0.9 + Math.random() * 0.2)),
      roas: Number((3.5 + Math.random() * 2).toFixed(1))
    };
  });
};

// Generate audience segments
export const generateAudienceSegments = () => [
  {
    segment: 'Nuevos Visitantes',
    size: 28500,
    conversionRate: 2.1,
    avgOrderValue: 145,
    revenue: 87150,
    growth: 12.3
  },
  {
    segment: 'Visitantes Recurrentes',
    size: 16500,
    conversionRate: 5.8,
    avgOrderValue: 189,
    revenue: 181071,
    growth: 8.7
  },
  {
    segment: 'Clientes VIP',
    size: 1200,
    conversionRate: 15.2,
    avgOrderValue: 425,
    revenue: 77520,
    growth: 22.1
  },
  {
    segment: 'Abandonos de Carrito',
    size: 3400,
    conversionRate: 8.9,
    avgOrderValue: 167,
    revenue: 50542,
    growth: -3.2
  }
];

// Generate competitor analysis
export const generateCompetitorAnalysis = () => [
  {
    competitor: 'Competidor A',
    marketShare: 28.5,
    digitalPresence: 85,
    socialFollowers: 125000,
    estimatedBudget: 150000,
    strengths: ['SEO fuerte', 'Contenido viral', 'Influencers'],
    weaknesses: ['Email débil', 'Conversión baja']
  },
  {
    competitor: 'Competidor B',
    marketShare: 22.1,
    digitalPresence: 78,
    socialFollowers: 89000,
    estimatedBudget: 120000,
    strengths: ['PPC agresivo', 'Retargeting', 'UX excelente'],
    weaknesses: ['Contenido limitado', 'SEO débil']
  },
  {
    competitor: 'Competidor C',
    marketShare: 18.7,
    digitalPresence: 72,
    socialFollowers: 67000,
    estimatedBudget: 95000,
    strengths: ['Email marketing', 'Automatización', 'CRM'],
    weaknesses: ['Social media', 'Innovación lenta']
  },
  {
    competitor: 'Nuestra Empresa',
    marketShare: 15.2,
    digitalPresence: 82,
    socialFollowers: 78000,
    estimatedBudget: 89500,
    strengths: ['ROI alto', 'Conversión', 'Personalización'],
    weaknesses: ['Alcance limitado', 'Presupuesto menor']
  }
];

// Generate campaign types performance
export const generateCampaignTypesPerformance = () => [
  { type: 'PPC', campaigns: 8, budget: 35000, spent: 31200, conversions: 456, roas: 4.2 },
  { type: 'Email', campaigns: 12, budget: 8000, spent: 6800, conversions: 289, roas: 6.8 },
  { type: 'Social', campaigns: 15, budget: 22000, spent: 19500, conversions: 234, roas: 3.4 },
  { type: 'Content', campaigns: 6, budget: 12000, spent: 10200, conversions: 167, roas: 2.9 },
  { type: 'Display', campaigns: 4, budget: 8000, spent: 7100, conversions: 89, roas: 2.1 }
];

// Generate A/B test results
export const generateABTestResults = () => [
  {
    test: 'Landing Page Headline',
    status: 'completed',
    winner: 'Variant B',
    improvement: 23.5,
    confidence: 95,
    conversions: { control: 156, variant: 193 },
    duration: 14
  },
  {
    test: 'Email Subject Line',
    status: 'completed',
    winner: 'Variant A',
    improvement: 18.2,
    confidence: 92,
    conversions: { control: 89, variant: 105 },
    duration: 7
  },
  {
    test: 'CTA Button Color',
    status: 'running',
    winner: 'TBD',
    improvement: 0,
    confidence: 0,
    conversions: { control: 67, variant: 72 },
    duration: 5
  },
  {
    test: 'Product Page Layout',
    status: 'completed',
    winner: 'Control',
    improvement: -8.7,
    confidence: 88,
    conversions: { control: 234, variant: 214 },
    duration: 21
  }
];

