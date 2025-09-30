import { describe, it, expect } from 'vitest';
import { PricingInput } from '@/schema/pricing';
import { simulate } from '@/utils/pricingEngine';
import amazonFees from '@/utils/fees/mx/amazon.json';
import meliFees from '@/utils/fees/mx/meli.json';

describe('pricingEngine', () => {
  it('computes positive margin for reasonable Amazon scenario', () => {
    const input = PricingInput.parse({
      platform: 'amazon_mx',
      sku: 'SKU-1',
      category: 'electronics',
      costOfGoods: 200,
      price: 500,
      shippingMethod: 'own',
      weightKg: 0.5,
      lengthCm: 20,
      widthCm: 15,
      heightCm: 10,
      ivaPct: 0.16,
      paymentFeePct: 0.035,
      returnsRatePct: 0.02,
      adsCostPerOrder: 0,
      fixedOverheadPerUnit: 0
    });
    const r = simulate(input, amazonFees as any);
    expect(r.marginPct).toBeGreaterThan(0);
  });

  it('applies MELI fixed fee for low price range', () => {
    const input = PricingInput.parse({
      platform: 'meli_mx',
      sku: 'SKU-2',
      category: 'default',
      costOfGoods: 50,
      price: 140,
      shippingMethod: 'own',
      weightKg: 0.3,
      lengthCm: 10,
      widthCm: 10,
      heightCm: 5,
      ivaPct: 0.16,
      paymentFeePct: 0.035,
      returnsRatePct: 0.02,
      adsCostPerOrder: 0,
      fixedOverheadPerUnit: 0
    });
    const r = simulate(input, meliFees as any);
    expect(r.breakdown.platformCommission).toBeGreaterThan(28); // includes fixed fee
  });
});
















