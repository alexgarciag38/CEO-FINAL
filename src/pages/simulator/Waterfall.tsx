import React from 'react';

type Props = {
  price: number;
  breakdown: {
    platformCommission: number;
    shippingCost: number;
    paymentFee: number;
    taxes: number;
    ads: number;
    returnsCost: number;
    overhead: number;
    cogs: number;
  };
};

export const Waterfall: React.FC<Props> = ({ price, breakdown }) => {
  const items = [
    { label: 'Comisión', value: breakdown.platformCommission, color: 'bg-red-500' },
    { label: 'Envío', value: breakdown.shippingCost, color: 'bg-orange-500' },
    { label: 'Pago', value: breakdown.paymentFee, color: 'bg-amber-500' },
    { label: 'Impuestos', value: breakdown.taxes, color: 'bg-yellow-500' },
    { label: 'Ads', value: breakdown.ads, color: 'bg-lime-500' },
    { label: 'Devoluciones', value: breakdown.returnsCost, color: 'bg-green-500' },
    { label: 'Overhead', value: breakdown.overhead, color: 'bg-emerald-500' },
    { label: 'COGS', value: breakdown.cogs, color: 'bg-teal-500' }
  ];

  const totalCost = items.reduce((a, b) => a + b.value, 0);
  const segments = items.map((i) => ({ ...i, widthPct: Math.min(100, (i.value / price) * 100) }));

  return (
    <div className="mt-3">
      <div className="text-sm text-gray-700 mb-2">Cascada de costos (sobre precio)</div>
      <div className="w-full h-4 bg-gray-100 rounded overflow-hidden flex">
        {segments.map((s, idx) => (
          <div key={idx} className={`${s.color}`} style={{ width: `${s.widthPct}%` }} title={`${s.label}: $${s.value.toFixed(2)}`} />
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-gray-600">
        <div>Precio: ${price.toFixed(2)}</div>
        <div>Costo total: ${totalCost.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default Waterfall;
















