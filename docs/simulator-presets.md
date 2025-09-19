Simulador de Ventas - Presets rápidos (MX)

Estos presets son aproximados y deben ajustarse según la vertical y tu cuenta.

- Amazon MX
  - electronics: 15% hasta $300, 8% arriba, min $5
  - fashion: 10% hasta $20, 17% arriba, min $5
  - Envío propio base $45 + $12/kg, divisor 5000
- Mercado Libre MX
  - default: 16.5% + fijo $28 ($35-$149) / $33 ($149-$299)
  - electronics: 12% + mismos fijos
  - Envío propio base $40 + $10/kg, divisor 5000
- TikTok Shop MX
  - electronics: 11% hasta $300, 9% arriba
  - fashion: 14%

Uso en UI:
- Ingresa SKU, categoría (coincida con el dataset), COGS, precio, método de envío y dimensiones.
- Opcional: precio de competencia y ACOS objetivo %.
- Verás margen, utilidad, break-even, cascada de costos y sugerencias.

Ajuste fino:
- Cambia `src/utils/fees/mx/*.json` para actualizar tasas por categoría.
- Si tu logística tiene otra fórmula, ajusta `shippingFees` o el motor.




