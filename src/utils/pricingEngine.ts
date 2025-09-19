import { PricingInput, Fees, SimulationResult, SuggestionOutput, PlatformFeeRule } from '@/schema/pricing';

function volumetricWeightKg(lengthCm: number, widthCm: number, heightCm: number, divisor: number): number {
  const vol = (lengthCm * widthCm * heightCm) / divisor; // cm^3 / divisor
  return vol / 1000; // convert to kg (since divisor is cm-based, normalize approx)
}

function calcShippingCost(input: PricingInput, fees: Fees): number {
  const rule = fees.shippingFees.find((r) => r.method === input.shippingMethod);
  if (!rule) return 0;
  const dimW = volumetricWeightKg(input.lengthCm, input.widthCm, input.heightCm, rule.dimensionalDivisor);
  const billableKg = Math.max(input.weightKg, dimW);
  const raw = rule.base + rule.perKg * billableKg;
  return raw * (1 - rule.subsidyPct);
}

function pickTier(rule: PlatformFeeRule, price: number, publicationType?: 'classic' | 'premium'):
  { commissionPct: number; minCommission: number; fixedFee: number } {
  if (rule.tiers && rule.tiers.length > 0) {
    const t = rule.tiers.find(t => price >= t.minPrice && (t.maxPrice === undefined || price <= t.maxPrice));
    if (t) {
      return { commissionPct: t.commissionPct, minCommission: t.minCommission ?? (rule.minCommission ?? 0), fixedFee: t.fixedFee ?? 0 };
    }
    // fallback to highest tier
    const sorted = [...rule.tiers].sort((a, b) => (b.minPrice - a.minPrice));
    const last = sorted[0];
    return { commissionPct: last.commissionPct, minCommission: last.minCommission ?? (rule.minCommission ?? 0), fixedFee: last.fixedFee ?? 0 };
  }
  // Variant tiers (ML Classic/Premium)
  if (rule.variants && publicationType && rule.variants[publicationType]) {
    const vt = rule.variants[publicationType].find(t => price >= t.minPrice && (t.maxPrice === undefined || price <= t.maxPrice));
    if (vt) {
      return {
        commissionPct: vt.commissionPct + (vt.extraPct ?? 0),
        minCommission: vt.minCommission ?? (rule.minCommission ?? 0),
        fixedFee: vt.fixedFee ?? 0
      };
    }
  }
  return { commissionPct: rule.commissionPct ?? 0, minCommission: rule.minCommission ?? 0, fixedFee: 0 };
}

function calcPlatformCommission(input: PricingInput, fees: Fees): number {
  const rule = fees.platformFees.find((r) => r.category === input.category) || fees.platformFees[0];
  const { commissionPct, minCommission, fixedFee } = pickTier(rule, input.price, input.publicationType);
  const commission = input.price * commissionPct;
  return Math.max(commission, minCommission) + fixedFee;
}

function calcPaymentFee(input: PricingInput): number {
  return input.price * input.paymentFeePct;
}

function calcTaxes(input: PricingInput, fees: Fees): { iva: number; isr: number; total: number } {
  const ivaPct = fees.taxOverrides?.ivaPct ?? input.ivaPct;
  const isrPct = fees.taxOverrides?.isrPct ?? 0;
  // Mercado Libre retiene sobre precio sin IVA base (16%)
  const taxBase = input.platform === 'meli_mx' ? (input.price / 1.16) : input.price;
  const iva = taxBase * ivaPct;
  const isr = taxBase * isrPct;
  return { iva, isr, total: iva + isr };
}

function calcReturnsCost(input: PricingInput): number {
  return (input.costOfGoods + input.fixedOverheadPerUnit) * input.returnsRatePct;
}

export function simulate(input: PricingInput, fees: Fees): SimulationResult {
  const safeInput = PricingInput.parse(input);
  const safeFees = Fees.parse(fees);

  const shippingCost = calcShippingCost(safeInput, safeFees);
  const platformCommission = calcPlatformCommission(safeInput, safeFees);
  const paymentFee = calcPaymentFee(safeInput);
  const taxInfo = calcTaxes(safeInput, safeFees);
  const taxes = taxInfo.total;
  const ads = safeInput.adsCostPerOrder;
  const returnsCost = calcReturnsCost(safeInput);
  const overhead = safeInput.fixedOverheadPerUnit;
  const cogs = safeInput.costOfGoods;

  const totalCost = shippingCost + platformCommission + paymentFee + taxes + ads + returnsCost + overhead + cogs;
  const netProfit = safeInput.price - totalCost;
  const marginPct = safeInput.price > 0 ? netProfit / safeInput.price : 0;

  const breakEvenPrice = totalCost; // price where profit = 0

  let competitorMarginPct: number | null = null;
  if (safeInput.competitorPrice) {
    const competitorRevenue = safeInput.competitorPrice;
    // Re-evaluate commission/payment/taxes at competitor price
    const competitorRule = safeFees.platformFees.find(r => r.category === safeInput.category) || safeFees.platformFees[0];
    const { commissionPct: compPct, minCommission: compMin, fixedFee: compFixed } = pickTier(competitorRule, safeInput.competitorPrice, safeInput.publicationType);
    const competitorCommission = Math.max(safeInput.competitorPrice * compPct, compMin) + compFixed;
    const competitorPaymentFee = safeInput.competitorPrice * safeInput.paymentFeePct;
    const competitorTaxes = safeInput.competitorPrice * safeInput.ivaPct;
    const competitorCost = shippingCost + competitorCommission + competitorPaymentFee + competitorTaxes + ads + returnsCost + overhead + cogs;
    const competitorProfit = competitorRevenue - competitorCost;
    competitorMarginPct = competitorRevenue > 0 ? competitorProfit / competitorRevenue : 0;
  }

  const recommendations: string[] = [];
  if (marginPct < 0.05) {
    recommendations.push('Margen bajo: considere ajustar precio o reducir costos de envío/comisión.');
  }
  if (shippingCost / safeInput.price > 0.2) {
    recommendations.push('El costo de envío representa >20% del precio. Evalúe modalidad Full/subsidio.');
  }
  if (platformCommission / safeInput.price > 0.15) {
    recommendations.push('Comisión alta: verifique categoría correcta o estrategia de bundle.');
  }

  return {
    platform: safeInput.platform,
    sku: safeInput.sku,
    category: safeInput.category,
    price: safeInput.price,
    netProfit,
    marginPct,
    breakEvenPrice,
    competitorMarginPct,
    breakdown: {
      price: safeInput.price,
      platformCommission,
      shippingCost,
      paymentFee,
      taxes,
      ads,
      returnsCost,
      overhead,
      cogs,
    },
    recommendations,
  };
}

export function suggestPrices(input: PricingInput, fees: Fees): SuggestionOutput {
  const step = Math.max(1, Math.round(input.price * 0.01));
  let minViablePrice = input.price;
  let recommendedPrice = input.price;
  let ceilingPrice = input.price;

  // Find min price with >= 0 margin
  for (let p = Math.max(1, Math.round(input.price * 0.5)); p <= input.price * 1.2; p += step) {
    const r = simulate({ ...input, price: p }, fees);
    if (r.netProfit >= 0) { minViablePrice = p; break; }
  }

  // Recommended: meets targetMarginPct if provided, else 15%
  const target = input.targetMarginPct ?? 0.15;
  for (let p = minViablePrice; p <= input.price * 1.5; p += step) {
    const r = simulate({ ...input, price: p }, fees);
    if (r.marginPct >= target) { recommendedPrice = p; break; }
  }

  // Ceiling: beyond which margin gains flatten (simple heuristic)
  let lastMargin = 0;
  for (let p = recommendedPrice; p <= input.price * 2; p += step) {
    const r = simulate({ ...input, price: p }, fees);
    if (r.marginPct - lastMargin < 0.01) { ceilingPrice = p; break; }
    lastMargin = r.marginPct;
  }

  return { minViablePrice, recommendedPrice, ceilingPrice };
}


