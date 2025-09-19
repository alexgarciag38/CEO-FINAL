import React, { useEffect, useMemo, useState } from 'react';
import { saveSimulationViaEdge } from '@/utils/simulationsClient';
import { searchProducts } from '@/utils/catalogClient';
import GraficoComparativoEscenarios from './GraficoComparativoEscenarios';
import CardEscenario from './CardEscenario';

// Tipos de la UI
type Platform = 'meli' | 'amazon' | 'tiktok' | 'shein';
type PublicationType = 'classic' | 'premium';
type LogisticsType = 'full' | 'flex' | 'own';

// Reglas simples para comisiones por plataforma
// Nota: valores de referencia aproximados; ajústalos según tus fuentes internas
const COMMISSION_RULES: Record<Platform, { defaultPct: number; classicPct?: number; premiumPct?: number; fixedFee?: number }> = {
  // Mercado Libre: Clásica 12%, Premium 16.5%
  meli: { defaultPct: 0.165, classicPct: 0.12, premiumPct: 0.165, fixedFee: 0 },
  amazon: { defaultPct: 0.15 },
  tiktok: { defaultPct: 0.12 },
  shein: { defaultPct: 0.15 }
};

// Costos de logística por plataforma (valores base de ejemplo)
const LOGISTICS_RULES: Record<Platform, { full: number; flex: number }> = {
  meli: { full: 30, flex: 25 },
  amazon: { full: 35, flex: 28 },
  tiktok: { full: 28, flex: 24 },
  shein: { full: 25, flex: 22 }
};

// Tabla de envíos Mercado Libre (productos nuevos). Valores MXN por tramo de peso
// Columnas: <299, 299–498.99, >=499
const MELI_SHIPPING_TABLE: Array<{ maxKg: number; lt299: number; between299to498: number; gte499: number }> = [
  { maxKg: 0.3, lt299: 91.7, between299to498: 52.4, gte499: 65.5 },
  { maxKg: 0.5, lt299: 98.0, between299to498: 56.0, gte499: 70.0 },
  { maxKg: 1, lt299: 104.3, between299to498: 59.6, gte499: 74.5 },
  { maxKg: 2, lt299: 118.3, between299to498: 67.6, gte499: 84.5 },
  { maxKg: 3, lt299: 133.0, between299to498: 76.0, gte499: 95.0 },
  { maxKg: 4, lt299: 144.2, between299to498: 82.4, gte499: 103.0 },
  { maxKg: 5, lt299: 154.0, between299to498: 88.0, gte499: 110.0 },
  { maxKg: 7, lt299: 171.5, between299to498: 98.0, gte499: 122.5 },
  { maxKg: 9, lt299: 195.3, between299to498: 111.6, gte499: 139.5 },
  { maxKg: 12, lt299: 226.1, between299to498: 129.2, gte499: 161.5 },
  { maxKg: 15, lt299: 266.0, between299to498: 152.0, gte499: 190.0 },
  { maxKg: 20, lt299: 311.5, between299to498: 178.0, gte499: 222.5 },
  { maxKg: 30, lt299: 394.1, between299to498: 225.2, gte499: 281.5 }
];

function calcMeliShippingFlex(price: number, weightKg: number): number {
  const row = MELI_SHIPPING_TABLE.find(r => weightKg <= r.maxKg) || MELI_SHIPPING_TABLE[MELI_SHIPPING_TABLE.length - 1];
  if (price < 299) return row.lt299;
  if (price < 499) return row.between299to498;
  return row.gte499;
}

const PLATFORM_LABEL: Record<Platform, string> = {
  meli: 'Mercado Libre',
  amazon: 'Amazon',
  tiktok: 'TikTok Shop',
  shein: 'Shein'
};

// Tarifas diarias de almacenamiento Full (MXN por unidad/día)
type FullSize = 'small' | 'medium' | 'large' | 'xlarge';
const FULL_STORAGE_DAILY: Record<FullSize, number> = {
  small: 0.011,
  medium: 0.036,
  large: 0.075,
  xlarge: 0.5
};

// Editor de item del paquete con búsqueda en catálogo
type PackItem = { sku?: string; name?: string; cost: number; pack: number; labor: number; weightKg: number };
const PackItemEditor: React.FC<{
  item: PackItem;
  index: number;
  currency: Intl.NumberFormat;
  onChange: (idx: number, next: PackItem) => void;
  onRemove: (idx: number) => void;
}> = ({ item, index, currency, onChange, onRemove }) => {
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<Array<{ sku: string; nombre: string; costo: number }>>([]);

  useEffect(() => {
    const q = search.trim();
    if (!q) { setResults([]); return; }
    const id = setTimeout(async () => {
      try {
        setLoading(true);
        const r = await searchProducts(q);
        setResults(r);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [search]);

  return (
    <div className="space-y-2">
      {/* Buscador integrado en el campo Nombre */}
      <div className="grid grid-cols-5 gap-2 items-start">
        <div>
          <label className="block text-xs font-medium text-slate-600">SKU</label>
          <input className="h-10 w-full bg-white border border-slate-300 rounded-md p-2 mt-1" placeholder="Ej. ABC-123" value={item.sku || ''} onChange={(e) => onChange(index, { ...item, sku: e.target.value })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Nombre</label>
          <div className="relative mt-1">
            <input
              className="h-10 w-full bg-white border border-slate-300 rounded-md p-2"
              placeholder="Escribe para buscar por nombre o pega un SKU"
              value={item.name || ''}
              onChange={(e) => {
                const val = e.target.value;
                onChange(index, { ...item, name: val });
                setSearch(val);
              }}
            />
            {loading && <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-slate-500">Buscando…</div>}
            {search && results.length > 0 && (
              <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-md shadow-sm max-h-56 overflow-auto">
                {results.map((p) => (
                  <button
                    key={`${p.sku}`}
                    type="button"
                    className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50"
                    onClick={() => {
                      onChange(index, { ...item, sku: p.sku, name: p.nombre, cost: p.costo });
                      setSearch('');
                      setResults([]);
                    }}
                  >
                    <div className="font-medium text-slate-800">{p.nombre}</div>
                    <div className="text-xs text-slate-500">SKU: {p.sku} · Costo: {currency.format(p.costo)}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Costo (MXN)</label>
          <input type="number" step="0.01" className="h-10 w-full bg-white border border-slate-300 rounded-md p-2 mt-1" placeholder="0.00" value={item.cost} onChange={(e) => onChange(index, { ...item, cost: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Empaque (MXN)</label>
          <input type="number" step="0.01" className="h-10 w-full bg-white border border-slate-300 rounded-md p-2 mt-1" placeholder="0.00" value={item.pack} onChange={(e) => onChange(index, { ...item, pack: Number(e.target.value) })} />
        </div>
        <div>
          <label className="block text-xs font-medium text-slate-600">Mano de obra (MXN)</label>
          <input type="number" step="0.01" className="h-10 w-full bg-white border border-slate-300 rounded-md p-2 mt-1" placeholder="0.00" value={item.labor} onChange={(e) => onChange(index, { ...item, labor: Number(e.target.value) })} />
        </div>
        <div className="col-span-5 grid grid-cols-6 gap-2 items-center mt-1">
          <label className="text-xs font-medium text-slate-600 col-span-2">Peso (kg)</label>
          <input type="number" step="0.01" className="h-10 bg-white border border-slate-300 rounded-md p-2 col-span-2" value={item.weightKg} onChange={(e) => onChange(index, { ...item, weightKg: Number(e.target.value) })} />
          <button className="px-2 py-1 text-sm bg-red-100 text-red-700 rounded-md col-span-2" onClick={() => onRemove(index)}>Eliminar</button>
        </div>
      </div>
    </div>
  );
};

const SimuladorCostos: React.FC = () => {
  const [saving, setSaving] = useState(false);

  // Configuración principal
  const [platform, setPlatform] = useState<Platform>('meli');
  const [publicationPrice, setPublicationPrice] = useState<number>(0);
  const [sku, setSku] = useState<string>('');
  const [productName, setProductName] = useState<string>('');
  const [productSearch, setProductSearch] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Array<{ sku: string; nombre: string; costo: number }>>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // Costos de adquisición y operativos
  const [productCost, setProductCost] = useState<number>(0);
  const [packingCost, setPackingCost] = useState<number>(0);
  const [laborCost, setLaborCost] = useState<number>(0);

  // Modalidad de publicación: individual o paquete
  const [listingMode, setListingMode] = useState<'single' | 'pack'>('single');
  const [packSize, setPackSize] = useState<number>(1);

  // Desglose de plataforma
  const [publicationType, setPublicationType] = useState<PublicationType>('classic');
  const [logisticsType, setLogisticsType] = useState<LogisticsType>('full');
  const [ownShippingCost, setOwnShippingCost] = useState<number>(40);
  const [weightKg, setWeightKg] = useState<number>(0.5);
  const [fullSize, setFullSize] = useState<FullSize>('small');
  const [fullDaysStored, setFullDaysStored] = useState<number>(30);
  const [usePackWeightForShipping, setUsePackWeightForShipping] = useState<boolean>(true);
  // Items del paquete (cuando los productos son distintos)
  const [packItems, setPackItems] = useState<PackItem[]>([]);

  // Comisión según plataforma/publicación (debe declararse antes de funciones que la usan)
  const commissionPct: number = useMemo(() => {
    const rule = COMMISSION_RULES[platform];
    if (platform === 'meli') {
      return publicationType === 'premium' ? (rule.premiumPct ?? rule.defaultPct) : (rule.classicPct ?? rule.defaultPct);
    }
    return rule.defaultPct;
  }, [platform, publicationType]);

  // Impuestos (retenidos por la plataforma)
  // IVA/ISR como porcentaje humano (0–100). Ej: 16 significa 16%.
  const [ivaPct, setIvaPct] = useState<number>(8);
  const [isrPct, setIsrPct] = useState<number>(1);

  // Resultados intermedios (lectura)
  const [saleFee, setSaleFee] = useState<number>(0);
  const [saleFeeCommission, setSaleFeeCommission] = useState<number>(0);
  const [saleFeeFixed, setSaleFeeFixed] = useState<number>(0);
  const [shippingCost, setShippingCost] = useState<number>(0);
  const [ivaAmount, setIvaAmount] = useState<number>(0);
  const [isrAmount, setIsrAmount] = useState<number>(0);
  const [fullStorageCost, setFullStorageCost] = useState<number>(0);

  // Resumen final (por unidad)
  const [totalEstimatedCosts, setTotalEstimatedCosts] = useState<number>(0);
  const [receiveAmount, setReceiveAmount] = useState<number>(0);
  const [netProfit, setNetProfit] = useState<number>(0);
  const [marginPct, setMarginPct] = useState<number>(0);
  const taxesTotal = useMemo(() => ivaAmount + isrAmount, [ivaAmount, isrAmount]);
  // Proyección de ventas (antiguo simulador rápido)
  const [estimatedUnits, setEstimatedUnits] = useState<number>(0);
  const projectedRevenue = useMemo(() => Math.max(0, estimatedUnits) * publicationPrice, [estimatedUnits, publicationPrice]);
  const projectedNetReceive = useMemo(() => Math.max(0, estimatedUnits) * receiveAmount, [estimatedUnits, receiveAmount]);
  const projectedNetProfit = useMemo(() => Math.max(0, estimatedUnits) * netProfit, [estimatedUnits, netProfit]);

  const currency = useMemo(() => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }), []);
  // Badge de margen (color por salud)
  const marginBadgeClass = useMemo(() => {
    const m = marginPct;
    if (m >= 20) return 'bg-green-100 text-green-700 border-green-200';
    if (m >= 10) return 'bg-amber-100 text-amber-700 border-amber-200';
    return 'bg-red-100 text-red-700 border-red-200';
  }, [marginPct]);
  

  // --- Escenarios (pestañas) ---
  type EscState = { unidades: number; acos: number; adsSharePct: number };
  const [escDes, setEscDes] = useState<EscState>({ unidades: 0, acos: 10, adsSharePct: 0 });
  const [escReal, setEscReal] = useState<EscState>({ unidades: 0, acos: 10, adsSharePct: 0 });
  const [escOpt, setEscOpt] = useState<EscState>({ unidades: 0, acos: 10, adsSharePct: 0 });
  // Eliminado el prefill basado en simulador mensual para simplificar; el usuario ajusta cada tarjeta

  // Función de cálculo por escenario (no toca el estado global)
  function computeScenario(units: number, acosPct: number, adsSharePctLocal: number) {
    const safeUnits = Math.max(0, units || 0);
    const safeAcos = Math.max(0, acosPct || 0);
    const revenue = safeUnits * publicationPrice; // ventas brutas
    const expectedIncome = safeUnits * receiveAmount; // ingresos esperados (aprox.)
    // Costos de producto/operativos por venta (pack o individual)
    const opsPerSale = (listingMode === 'pack' && packItems.length > 0)
      ? packItems.reduce((sum, it) => sum + (Math.max(0, it.cost) + Math.max(0, it.pack) + Math.max(0, it.labor)), 0)
      : (productCost + packingCost + laborCost + (logisticsType === 'full' ? fullStorageCost : 0));
    const productTotal = Math.max(0, safeUnits * opsPerSale);
    const grossBeforeAds = Math.max(0, expectedIncome - productTotal);
    // Inversión ads = ventas por publicidad × ACOS
    const adsAttributedRevenue = revenue * (Math.max(0, adsSharePctLocal) / 100);
    const adsCost = Math.max(0, adsAttributedRevenue * (safeAcos / 100));
    const net = grossBeforeAds - adsCost;
    const margin = revenue > 0 ? (net / revenue) * 100 : 0;
    return { revenue, expectedIncome, productTotal, adsCost, grossBeforeAds, net, margin };
  }

  const resDes = computeScenario(escDes.unidades, escDes.acos, escDes.adsSharePct);
  const resReal = computeScenario(escReal.unidades, escReal.acos, escReal.adsSharePct);
  const resOpt = computeScenario(escOpt.unidades, escOpt.acos, escOpt.adsSharePct);

  // Eliminados cálculos mensuales; el comparativo de escenarios reemplaza este simulador

  // Competencia (hasta 5)
  type Competitor = { name: string; price: number };
  const [competitors, setCompetitors] = useState<Competitor[]>([
    { name: '', price: 0 },
    { name: '', price: 0 },
    { name: '', price: 0 },
    { name: '', price: 0 },
    { name: '', price: 0 }
  ]);

  // Autocompletado de productos con debounce
  useEffect(() => {
    const q = productSearch.trim();
    if (!q) { setSearchResults([]); return; }
    const id = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await searchProducts(q);
        setSearchResults(res);
      } catch (e) {
        setSearchResults([]);
      } finally {
        setSearchLoading(false);
      }
    }, 300);
    return () => clearTimeout(id);
  }, [productSearch]);

  const handleSelectProduct = (p: { sku: string; nombre: string; costo: number }) => {
    setProductName(p.nombre);
    setSku(p.sku);
    setProductCost(p.costo);
    setProductSearch(p.nombre);
    setSearchResults([]);
  };

  const handleResetProduct = () => {
    setSku('');
    setProductName('');
    setProductCost(0);
    setProductSearch('');
    setSearchResults([]);
  };

  function meliFixedFeeForPrice(price: number): number {
    if (price < 99) return 25;
    if (price < 149) return 30;
    if (price < 299) return 37;
    return 0;
  }

  function saleFeeAtPrice(price: number): number {
    const fixed = platform === 'meli' ? meliFixedFeeForPrice(price) : 0;
    return price * commissionPct + fixed;
  }

  function shippingAtPrice(price: number): number {
    if (logisticsType === 'own') return Math.max(0, ownShippingCost);
    if (logisticsType === 'full') return 0;
    if (platform === 'meli' && logisticsType === 'flex') {
      let effectiveWeight = weightKg;
      if (listingMode === 'pack' && usePackWeightForShipping) {
        if (packItems.length > 0) {
          effectiveWeight = packItems.reduce((sum, it) => sum + Math.max(0, it.weightKg || 0), 0);
        } else {
          effectiveWeight = weightKg * Math.max(1, packSize);
        }
      }
      return calcMeliShippingFlex(price, Math.max(0, effectiveWeight));
    }
    return LOGISTICS_RULES[platform][logisticsType];
  }

  function taxBaseAtPrice(price: number): number {
    // Mercado Libre retenciones se calculan sobre precio sin IVA (16%)
    if (platform === 'meli') return price / 1.16;
    return price;
  }

  // Nota: removimos la tabla detallada de competencia; calculamos en línea por fila-resumen

  // Guardado de simulación
  const buildPayload = () => ({
    sku,
    productName,
    platform,
    publicationPrice,
    productCost,
    packingCost,
    laborCost,
    publicationType,
    logisticsType,
    ownShippingCost,
    weightKg,
    fullSize,
    fullDaysStored,
    ivaPct,
    isrPct
  });

  const handleSave = async () => {
    try {
      setSaving(true);
      const name = productName || sku || 'Simulación';
      // Build full snapshot for raw_simulation_data
      const raw = {
        inputs: buildPayload(),
        results: {
          saleFee,
          saleFeeCommission,
          saleFeeFixed,
          shippingCost,
          ivaAmount,
          isrAmount,
          fullStorageCost,
          totalEstimatedCosts,
          receiveAmount,
          netProfit,
          marginPct
        },
        scenarios: {
          desfavorable: resDes,
          realista: resReal,
          optimista: resOpt
        }
      };
      await saveSimulationViaEdge({
        nombre_simulacion: name,
        platform,
        product_sku: sku || null,
        product_name: productName || 'Producto',
        publication_price: publicationPrice,
        net_profit: netProfit,
        net_margin: marginPct,
        total_estimated_costs: totalEstimatedCosts,
        raw_simulation_data: raw,
        scenario_desfavorable: resDes,
        scenario_realista: resReal,
        scenario_optimista: resOpt
      });
    } catch (e) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const refreshSaved = async () => {
    try { } catch {}
  };
  useEffect(() => { void refreshSaved(); }, []);

  // Handler to load a saved simulation triggered from parent page
  useEffect(() => {
    const handler = async (e: any) => {
      try {
        const id = e?.detail?.id as string;
        if (!id) return;
        const r = await fetch(`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/obtener-simulacion?id=${encodeURIComponent(id)}`, {
          headers: {
            'Authorization': `Bearer ${(await (await import('@/lib/supabase')).supabase.auth.getSession()).data.session?.access_token || ''}`
          }
        });
        if (!r.ok) return;
        const s = await r.json();
        const p = s?.raw_simulation_data?.inputs || {};
        setSku(p.sku || '');
        setProductName(p.productName || '');
        setPlatform(p.platform || 'meli');
        setPublicationPrice(p.publicationPrice || 0);
        setProductCost(p.productCost || 0);
        setPackingCost(p.packingCost || 0);
        setLaborCost(p.laborCost || 0);
        setPublicationType(p.publicationType || 'classic');
        setLogisticsType(p.logisticsType || 'full');
        setOwnShippingCost(p.ownShippingCost || 0);
        setWeightKg(p.weightKg || 0);
        setFullSize(p.fullSize || 'small');
        setFullDaysStored(p.fullDaysStored || 0);
        setIvaPct(p.ivaPct ?? 16);
        setIsrPct(p.isrPct ?? 1);
      } catch {}
    };
    window.addEventListener('defi:load-simulation', handler as any);
    return () => window.removeEventListener('defi:load-simulation', handler as any);
  }, []);

  // Recalcular cargos de venta, envío e impuestos cuando cambie algo relevante
  useEffect(() => {
    // Cargo por venta = precio * % + costo fijo (si aplica)
    // Mercado Libre: costo fijo por tramos cuando el precio es menor a $299
    let fixedFee = COMMISSION_RULES[platform].fixedFee ?? 0;
    if (platform === 'meli') {
      if (publicationPrice < 99) fixedFee = 25;
      else if (publicationPrice >= 99 && publicationPrice < 149) fixedFee = 30;
      else if (publicationPrice >= 149 && publicationPrice < 299) fixedFee = 37;
      else fixedFee = 0;
    }
    const commissionAmt = publicationPrice * commissionPct;
    const fee = commissionAmt + fixedFee;
    setSaleFee(fee);
    setSaleFeeCommission(commissionAmt);
    setSaleFeeFixed(fixedFee);

    // Costo por envío: depende de logística
    // - full/flex: valor fijo por plataforma (regla simple)
    // - own: usa input del usuario
    let ship = 0;
    if (logisticsType === 'own') {
      ship = Math.max(0, ownShippingCost);
    } else if (logisticsType === 'full') {
      // En Full la plataforma asume el envío (para el vendedor es 0)
      ship = 0;
    } else {
      // Flex: si es Mercado Libre, aplicar tabla por peso y precio; en otras plataformas, usar regla base
      if (platform === 'meli') {
        let effectiveWeight = weightKg;
        if (listingMode === 'pack' && usePackWeightForShipping) {
          if (packItems.length > 0) {
            effectiveWeight = packItems.reduce((sum, it) => sum + Math.max(0, it.weightKg || 0), 0);
          } else {
            effectiveWeight = weightKg * Math.max(1, packSize);
          }
        }
        ship = calcMeliShippingFlex(publicationPrice, Math.max(0, effectiveWeight));
      } else {
        ship = LOGISTICS_RULES[platform][logisticsType];
      }
    }
    setShippingCost(ship);

    // Impuestos retenidos por plataforma: para Mercado Libre usar base sin IVA (16%)
    const taxBaseSelf = platform === 'meli' ? (publicationPrice / 1.16) : publicationPrice;
    const iva = taxBaseSelf * Math.max(0, ivaPct / 100);
    const isr = taxBaseSelf * Math.max(0, isrPct / 100);
    setIvaAmount(iva);
    setIsrAmount(isr);
    // Almacenamiento Full por unidad
    if (logisticsType === 'full') {
      const rate = FULL_STORAGE_DAILY[fullSize] ?? 0;
      setFullStorageCost(rate * Math.max(0, fullDaysStored));
    } else {
      setFullStorageCost(0);
    }
  }, [platform, publicationType, logisticsType, ownShippingCost, publicationPrice, commissionPct, ivaPct, isrPct, weightKg, fullSize, fullDaysStored, listingMode, usePackWeightForShipping, packItems]);

  // Recalcular resumen de rentabilidad cada vez que cambien entradas o intermedios
  useEffect(() => {
    let opsCosts = productCost + packingCost + laborCost;
    if (listingMode === 'pack') {
      if (packItems.length > 0) {
        opsCosts = packItems.reduce((sum, it) => sum + (Math.max(0, it.cost) + Math.max(0, it.pack) + Math.max(0, it.labor)), 0);
      } else {
        const packMult = Math.max(1, packSize);
        opsCosts = (productCost + packingCost + laborCost) * packMult;
      }
    }
    // Total de costos estimados = Cargo por venta + Envío + Impuestos + Operativos (+ almacenamiento)
    const totalCosts = saleFee + shippingCost + ivaAmount + isrAmount + opsCosts + fullStorageCost;
    setTotalEstimatedCosts(totalCosts);

    // Recibirás por venta = Precio - (Cargo por venta + Envío + Impuestos)
    const receive = publicationPrice - (saleFee + shippingCost + ivaAmount + isrAmount);
    setReceiveAmount(receive);

    // Ganancia neta = Recibir - (Costos de adquisición/operativos)
    const net = receive - (opsCosts + fullStorageCost);
    setNetProfit(net);

    // Margen (%) = Ganancia neta / Precio de publicación
    const m = publicationPrice > 0 ? (net / publicationPrice) * 100 : 0;
    setMarginPct(m);
  }, [saleFee, shippingCost, ivaAmount, isrAmount, productCost, packingCost, laborCost, publicationPrice, listingMode, packSize, usePackWeightForShipping, packItems]);

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-6xl mx-auto bg-white text-gray-800 p-8 rounded-xl shadow-lg border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Simulador de Costos</h1>
        </div>

        {/* 1) Configuración */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Configuración</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Plataforma</label>
              <select
                className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                value={platform}
                onChange={(e) => setPlatform(e.target.value as Platform)}
              >
                <option value="meli">Mercado Libre</option>
                <option value="amazon">Amazon</option>
                <option value="tiktok">TikTok Shop</option>
                <option value="shein">Shein</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600">Precio de Publicación</label>
              <input
                type="number"
                step="0.01"
                className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                value={publicationPrice}
                onChange={(e) => setPublicationPrice(Number(e.target.value))}
                placeholder="0.00"
              />
            </div>
            {listingMode === 'single' && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-600">Buscar producto en mi catálogo</label>
                <div className="relative mt-1">
                  <input
                    className={`w-full h-10 rounded-md p-2 pr-20 focus:ring-blue-500 focus:border-blue-500 border ${ (sku || productName) ? 'bg-blue-50 border-blue-300 text-blue-800 font-medium' : 'bg-white border-gray-300'}`}
                    placeholder="Escribe para buscar por nombre"
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                  />
                  {(sku || productName) && (
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded"
                      onClick={handleResetProduct}
                    >Limpiar</button>
                  )}
                  {!sku && productSearch && searchResults.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-sm max-h-64 overflow-auto">
                      {searchResults.map((p) => (
                        <button key={p.sku} type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50" onClick={() => handleSelectProduct(p)}>
                          <div className="font-medium text-slate-800">{p.nombre}</div>
                          <div className="text-xs text-gray-500">SKU: {p.sku} · Costo: {currency.format(p.costo)}</div>
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="absolute right-24 top-1/2 -translate-y-1/2 text-xs text-slate-500">{searchLoading ? 'Buscando…' : ''}</div>
                </div>
              </div>
            )}
          </div>
          {/* Modo de publicación */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600">Modo de publicación</label>
              <select
                className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                value={listingMode}
                onChange={(e) => setListingMode(e.target.value as any)}
              >
                <option value="single">Individual</option>
                <option value="pack">Paquete</option>
              </select>
            </div>
            {listingMode === 'pack' && (
              <div>
                <label className="block text-sm font-medium text-gray-600">Unidades por paquete (si todos son iguales)</label>
                <input
                  type="number"
                  step="1"
                  className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                  value={packSize}
                  onChange={(e) => setPackSize(Math.max(1, Number(e.target.value)))}
                />
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-600">
                  <input type="checkbox" className="accent-blue-600" checked={usePackWeightForShipping} onChange={(e) => setUsePackWeightForShipping(e.target.checked)} />
                  Usar peso total del paquete para el envío
                </label>
                <div className="mt-1 text-xs text-gray-500">El costo fijo de publicación se cobra una sola vez por paquete.</div>
              </div>
            )}
          </div>

          {listingMode === 'pack' && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-slate-700">Items del paquete (productos distintos, opcional)</h3>
                <button
                  className="px-2 py-1 text-sm bg-slate-100 rounded-md"
                  onClick={() => setPackItems([...packItems, { sku: '', name: '', cost: 0, pack: 0, labor: 0, weightKg: 0 }])}
                >Agregar item</button>
              </div>
              {packItems.length > 0 && (
                <div className="space-y-2">
                  {packItems.map((it, idx) => (
                    <PackItemEditor
                      key={idx}
                      item={it}
                      index={idx}
                      currency={currency}
                      onChange={(i, next) => {
                        const arr = [...packItems];
                        arr[i] = next;
                        setPackItems(arr);
                      }}
                      onRemove={(i) => {
                        const arr = [...packItems];
                        arr.splice(i, 1);
                        setPackItems(arr);
                      }}
                    />
                  ))}
                </div>
              )}
              {packItems.length > 0 && (
                <div className="mt-2 text-xs text-gray-500">Usaremos estos items para calcular costos (y peso si está activado). Si no agregas items, se aplicará el multiplicador por "Unidades por paquete".</div>
              )}
            </div>
          )}
          {/* Botón de guardado movido al final */}
        </section>

        
        {/* 2) Costos de adquisición y operativos */}
        {listingMode === 'single' && (
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Costos de Adquisición y Operativos</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600">Costo del Producto (Proveedor)</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                  value={productCost}
                  onChange={(e) => setProductCost(Number(e.target.value))}
                  readOnly={!!sku || !!productName}
                />
                {(sku || productName) && (
                  <div className="text-xs text-gray-500 mt-1">Viene de tu catálogo. Usa "Limpiar" para editar manualmente.</div>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Costo de Empaque</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                  value={packingCost}
                  onChange={(e) => setPackingCost(Number(e.target.value))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Costo de Mano de Obra</label>
                <input
                  type="number"
                  step="0.01"
                  className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                  value={laborCost}
                  onChange={(e) => setLaborCost(Number(e.target.value))}
                />
              </div>
            </div>
          </section>
        )}

        {/* 3) Desglose de Costos de Plataforma */}
        <section className="mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Costos Estimados en {PLATFORM_LABEL[platform]}</h2>

          {/* Cargo por venta */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-3">Cargo por Venta</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-600">Tipo de Publicación</label>
                <select
                  className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                  value={publicationType}
                  onChange={(e) => setPublicationType(e.target.value as PublicationType)}
                >
                  <option value="classic">Clásica</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Monto a descontar</label>
                <div className="bg-gray-100 text-gray-800 tabular-nums font-medium h-10 flex items-center justify-end px-3 rounded-md mt-1">${saleFee.toFixed(2)}</div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <div className="text-gray-600">Comisión ({(commissionPct * 100).toFixed(1)}%): <span className="tabular-nums font-medium">${saleFeeCommission.toFixed(2)}</span></div>
                  <div className="text-gray-600">Cuota fija: <span className="tabular-nums font-medium">${saleFeeFixed.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
            <div className="text-xs text-gray-500 mt-2">
              Fórmula: precio × {Math.round(commissionPct * 1000) / 10}%
              {platform === 'meli' && (
                <>
                  {' '}+ cuota fija según tramo ($25 &lt; $99, $30 entre $99–$149, $37 entre $149–$299, $0 ≥ $299)
                </>
              )}
            </div>
          </div>

          {/* Costo por envío */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-3">Costo por Envío</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <label className="block text-sm font-medium text-gray-600">Tipo de Logística</label>
                <select
                  className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                  value={logisticsType}
                  onChange={(e) => setLogisticsType(e.target.value as LogisticsType)}
                >
                  <option value="full">Mercado Envíos Full / FBA</option>
                  <option value="flex">Mercado Envíos Flex</option>
                  <option value="own">Envío por mi cuenta</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Costo de envío</label>
                {logisticsType === 'own' ? (
                  <input
                    type="number"
                    step="0.01"
                    className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                    value={ownShippingCost}
                    onChange={(e) => setOwnShippingCost(Number(e.target.value))}
                  />
                ) : (
                  <div>
                    <div className="bg-gray-100 text-gray-800 tabular-nums font-medium h-10 flex items-center justify-end px-3 rounded-md mt-1">${shippingCost.toFixed(2)}</div>
                    {logisticsType === 'full' && (
                      <div className="text-xs text-gray-500 mt-1">En Full el costo de envío lo asume la plataforma.</div>
                    )}
                    {platform === 'meli' && logisticsType === 'flex' && (
                      <div className="text-xs text-gray-500 mt-1">Calculado por tabla oficial de peso y precio.</div>
                    )}
                  </div>
                )}
              </div>
              {logisticsType === 'full' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Tamaño (Full)</label>
                    <select
                      className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                      value={fullSize}
                      onChange={(e) => setFullSize(e.target.value as any)}
                    >
                      <option value="small">Pequeño (≈ $0.011/día)</option>
                      <option value="medium">Mediano (≈ $0.036/día)</option>
                      <option value="large">Grande (≈ $0.075/día)</option>
                      <option value="xlarge">Extragrande (≈ $0.500/día)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Días almacenado promedio</label>
                    <input
                      type="number"
                      step="1"
                      className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                      value={fullDaysStored}
                      onChange={(e) => setFullDaysStored(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600">Almacenamiento Full (por unidad)</label>
                    <div className="bg-gray-100 text-gray-800 tabular-nums font-medium h-10 flex items-center justify-end px-3 rounded-md mt-1">${fullStorageCost.toFixed(4)}</div>
                  </div>
                </>
              )}
              {platform === 'meli' && logisticsType === 'flex' && (
                <div>
                  <label className="block text-sm font-medium text-gray-600">Peso del paquete (kg)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
                    value={weightKg}
                    onChange={(e) => setWeightKg(Number(e.target.value))}
                  />
                </div>
              )}
            </div>
          </div>

          {/* Impuestos */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-sm font-semibold text-gray-700 mb-3">Impuestos (Retenciones)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end mb-3">
              <div>
                <label className="block text-sm font-medium text-gray-600">IVA</label>
                <div className="mt-1 inline-flex items-center bg-white border border-slate-300 rounded-md overflow-hidden">
                  <input
                    type="number"
                    step="0.1"
                    className="bg-transparent border-0 p-2 w-24 text-left focus:outline-none focus:ring-0 focus:border-0"
                    value={ivaPct}
                    onChange={(e) => setIvaPct(Number(e.target.value))}
                    aria-label="IVA porcentaje"
                  />
                  <span className="px-2 text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Monto IVA</label>
                <div className="bg-gray-100 text-gray-800 tabular-nums font-medium text-right p-2 rounded-md mt-1">${ivaAmount.toFixed(2)}</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
              <div>
                <label className="block text-sm font-medium text-gray-600">ISR</label>
                <div className="mt-1 inline-flex items-center bg-white border border-slate-300 rounded-md overflow-hidden">
                  <input
                    type="number"
                    step="0.1"
                    className="bg-transparent border-0 p-2 w-24 text-left focus:outline-none focus:ring-0 focus:border-0"
                    value={isrPct}
                    onChange={(e) => setIsrPct(Number(e.target.value))}
                    aria-label="ISR porcentaje"
                  />
                  <span className="px-2 text-slate-500">%</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600">Monto ISR</label>
                <div className="bg-gray-100 text-gray-800 tabular-nums font-medium text-right p-2 rounded-md mt-1">${isrAmount.toFixed(2)}</div>
              </div>
            </div>
          <div className="mt-3 flex justify-between text-sm border-t border-gray-200 pt-2">
            <span className="text-gray-700">Total de impuestos</span>
            <span className="tabular-nums font-semibold text-gray-900">${taxesTotal.toFixed(2)}</span>
          </div>
          </div>
        </section>

        {/* 4) Resumen de rentabilidad */}
        <section>
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Resumen de Rentabilidad</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Precio de Publicación</span>
                <span className="tabular-nums font-medium text-gray-800">${publicationPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Total de Costos Estimados</span>
                <span className="tabular-nums font-semibold text-orange-500">${totalEstimatedCosts.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Recibirás por Venta (aprox.)</span>
                <span className="tabular-nums font-medium text-gray-800">${receiveAmount.toFixed(2)}</span>
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-900">Ganancia Neta</span>
                  <span className={`tabular-nums font-extrabold text-3xl ${netProfit >= 0 ? 'text-green-600' : 'text-red-500'}`}>${netProfit.toFixed(2)}</span>
                </div>
                <div className="mt-2 flex justify-between items-center text-sm">
                  <span className="text-gray-600">Margen de ganancia</span>
                  <span className={`tabular-nums font-semibold px-2 py-0.5 rounded border ${marginBadgeClass}`}>{marginPct.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Cargo por Venta</span>
                <span className="tabular-nums font-medium text-gray-800">${saleFee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Envío</span>
                <span className="tabular-nums font-medium text-gray-800">${shippingCost.toFixed(2)}</span>
              </div>
              {logisticsType === 'full' && (
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600">Almacenamiento Full</span>
                  <span className="tabular-nums font-medium text-gray-800">${fullStorageCost.toFixed(4)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">IVA</span>
                <span className="tabular-nums font-medium text-gray-800">${ivaAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">ISR</span>
                <span className="tabular-nums font-medium text-gray-800">${isrAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mt-4">
                <span className="text-gray-600">Margen de Ganancia</span>
                <span className="tabular-nums font-semibold text-gray-900">{marginPct.toFixed(1)}%</span>
              </div>
            </div>
          </div>
        </section>

    {/* 📊 Dashboard Comparativo de Escenarios (movido debajo del Resumen de Rentabilidad) */}
    <section className="mt-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">📊 Dashboard Comparativo de Escenarios</h2>
      <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-6">
        {/* Gráfico de barras resumen */}
        <div className="w-full h-72">
          <GraficoComparativoEscenarios netDes={resDes.net} netReal={resReal.net} netOpt={resOpt.net} />
        </div>

        {/* Tarjetas lado a lado */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
          <CardEscenario
            title="Desfavorable"
            state={escDes}
            onChange={setEscDes}
            results={resDes}
          />
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
          <CardEscenario
            title="Realista"
            state={escReal}
            onChange={setEscReal}
            results={resReal}
          />
          </div>
          <div className="bg-white p-5 rounded-lg shadow-md border border-gray-200">
          <CardEscenario
            title="Óptimo"
            state={escOpt}
            onChange={setEscOpt}
            results={resOpt}
          />
          </div>
        </div>

        <div className="text-sm text-gray-500">Nota: Los escenarios son comparativos; no modifican los inputs principales.</div>
      </div>
    </section>

        

        {/* 6) Competencia */}
        <section className="mt-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">Competencia (hasta 5)</h2>
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3 mb-3">
              {competitors.map((c, idx) => (
                <div key={idx} className="grid grid-cols-2 md:grid-cols-1 gap-2 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <input
                    className="h-10 bg-white border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={`Competidor ${idx+1}`}
                    value={c.name}
                    onChange={(e) => {
                      const arr = [...competitors]; arr[idx] = { ...arr[idx], name: e.target.value }; setCompetitors(arr);
                    }}
                  />
                  <input
                    type="number"
                    step="0.01"
                    className="h-10 bg-white border border-gray-300 rounded-md p-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="$ precio"
                    value={c.price || 0}
                    onChange={(e) => {
                      const arr = [...competitors]; arr[idx] = { ...arr[idx], price: Number(e.target.value) }; setCompetitors(arr);
                    }}
                  />
                </div>
              ))}
            </div>
            {/* Fila: Ingreso esperado por competidor */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-3">
              {competitors.map((c, i) => {
                const price = Math.max(0, Number(c.price) || 0);
                const fee = saleFeeAtPrice(price);
                const ship = shippingAtPrice(price);
                const taxBase = taxBaseAtPrice(price);
                const ivaC = taxBase * (ivaPct / 100);
                const isrC = taxBase * (isrPct / 100);
                const receiveC = price - (fee + ship + ivaC + isrC);
                return (
                  <div key={`ing-${i}`} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <label className="block text-xs font-medium text-gray-600">Ingreso esperado</label>
                    <div className="mt-1 text-right tabular-nums font-semibold text-gray-700">
                      {currency.format(receiveC)}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Fila: Ganancia estimada según mis costos */}
            <div className="mt-3 grid grid-cols-1 md:grid-cols-5 gap-3">
              {competitors.map((c, i) => {
                const price = Math.max(0, Number(c.price) || 0);
                const fee = saleFeeAtPrice(price);
                const ship = shippingAtPrice(price);
                const taxBase = taxBaseAtPrice(price);
                const ivaC = taxBase * (ivaPct / 100);
                const isrC = taxBase * (isrPct / 100);
                const receiveC = price - (fee + ship + ivaC + isrC);
                const costosMios = (listingMode === 'pack' && packItems.length > 0)
                  ? packItems.reduce((sum, it) => sum + (Math.max(0, it.cost) + Math.max(0, it.pack) + Math.max(0, it.labor)), 0)
                  : (productCost + packingCost + laborCost + (logisticsType === 'full' ? fullStorageCost : 0));
                const gananciaEstimada = receiveC - costosMios;
                const cls = gananciaEstimada >= 0 ? 'text-green-600' : 'text-red-500';
                return (
                  <div key={`gan-${i}`} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                    <label className="block text-xs font-medium text-gray-600">Ganancia estimada</label>
                    <div className={`mt-1 text-right tabular-nums font-semibold ${cls}`}>
                      {currency.format(gananciaEstimada)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

    

        {/* Se eliminó la lista interna de simulaciones; usar la pestaña principal "Mis Simulaciones Guardadas" */}

        {/* Botón guardar al final, alineado a la derecha */}
        <div className="mt-8 flex justify-end">
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm disabled:opacity-50">{saving ? 'Guardando…' : 'Guardar simulación'}</button>
        </div>
      </div>
    </div>
  );
};

export default SimuladorCostos;


