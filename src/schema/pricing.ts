import { z } from 'zod';

export const Platform = z.enum(['amazon_mx', 'meli_mx', 'tiktok_mx', 'shein_mx']);
export type Platform = z.infer<typeof Platform>;

export const ShippingMethod = z.enum(['own', 'fba_full', 'carrier_subsidized']);
export type ShippingMethod = z.infer<typeof ShippingMethod>;

export const PublicationType = z.enum(['classic', 'premium']);
export type PublicationType = z.infer<typeof PublicationType>;

export const PricingInput = z.object({
  platform: Platform,
  sku: z.string().min(1),
  category: z.string().min(1),
  costOfGoods: z.number().nonnegative(),
  price: z.number().positive(),
  competitorPrice: z.number().positive().optional(),
  targetMarginPct: z.number().min(0).max(0.9).optional(),
  shippingMethod: ShippingMethod,
  publicationType: PublicationType.optional(),
  weightKg: z.number().nonnegative().default(0),
  lengthCm: z.number().nonnegative().default(0),
  widthCm: z.number().nonnegative().default(0),
  heightCm: z.number().nonnegative().default(0),
  ivaPct: z.number().min(0).max(0.5).default(0.16),
  paymentFeePct: z.number().min(0).max(0.2).default(0.035),
  returnsRatePct: z.number().min(0).max(0.5).default(0.02),
  adsCostPerOrder: z.number().min(0).default(0),
  fixedOverheadPerUnit: z.number().min(0).default(0),
});
export type PricingInput = z.infer<typeof PricingInput>;

export const PlatformFeeRule = z.object({
  category: z.string(),
  commissionPct: z.number().min(0).max(0.5).optional(),
  minCommission: z.number().min(0).default(0).optional(),
  tiers: z
    .array(
      z.object({
        minPrice: z.number().min(0).default(0),
        maxPrice: z.number().min(0).optional(),
        commissionPct: z.number().min(0).max(0.5),
        minCommission: z.number().min(0).default(0).optional(),
        fixedFee: z.number().min(0).default(0).optional()
      })
    )
    .optional(),
  variants: z
    .record(
      PublicationType,
      z.array(
        z.object({
          minPrice: z.number().min(0).default(0),
          maxPrice: z.number().min(0).optional(),
          commissionPct: z.number().min(0).max(0.5),
          minCommission: z.number().min(0).default(0).optional(),
          fixedFee: z.number().min(0).default(0).optional(),
          extraPct: z.number().min(0).max(0.5).default(0).optional()
        })
      )
    )
    .optional(),
});
export type PlatformFeeRule = z.infer<typeof PlatformFeeRule>;

export const ShippingFeeRule = z.object({
  method: ShippingMethod,
  base: z.number().min(0).default(0),
  perKg: z.number().min(0).default(0),
  dimensionalDivisor: z.number().min(1).default(5000),
  subsidyPct: z.number().min(0).max(1).default(0),
});
export type ShippingFeeRule = z.infer<typeof ShippingFeeRule>;

export const Fees = z.object({
  platform: Platform,
  currency: z.string().default('MXN'),
  effectiveFrom: z.string(),
  source: z.string().optional(),
  lastCheckedAt: z.string().optional(),
  platformFees: z.array(PlatformFeeRule),
  shippingFees: z.array(ShippingFeeRule),
  taxOverrides: z
    .object({
      ivaPct: z.number().min(0).max(0.5).optional(),
      isrPct: z.number().min(0).max(0.5).optional()
    })
    .optional(),
});
export type Fees = z.infer<typeof Fees>;

export const CostBreakdown = z.object({
  price: z.number(),
  platformCommission: z.number(),
  shippingCost: z.number(),
  paymentFee: z.number(),
  taxes: z.number(),
  ads: z.number(),
  returnsCost: z.number(),
  overhead: z.number(),
  cogs: z.number(),
});
export type CostBreakdown = z.infer<typeof CostBreakdown>;

export const SimulationResult = z.object({
  platform: Platform,
  sku: z.string(),
  category: z.string(),
  price: z.number(),
  netProfit: z.number(),
  marginPct: z.number(),
  breakEvenPrice: z.number(),
  competitorMarginPct: z.number().nullable(),
  breakdown: CostBreakdown,
  recommendations: z.array(z.string()),
});
export type SimulationResult = z.infer<typeof SimulationResult>;

export const SuggestionOutput = z.object({
  minViablePrice: z.number(),
  recommendedPrice: z.number(),
  ceilingPrice: z.number(),
});
export type SuggestionOutput = z.infer<typeof SuggestionOutput>;


