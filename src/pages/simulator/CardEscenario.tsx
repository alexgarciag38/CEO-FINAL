import React from 'react';

interface EscenarioState {
  unidades: number;
  acos: number; // porcentaje humano 0-100
  adsSharePct: number; // % de ventas atribuibles a publicidad (0-100)
}

interface EscenarioResults {
  revenue: number; // ventas brutas
  expectedIncome: number; // ingresos esperados
  productTotal: number; // costo del producto total
  adsCost: number;
  grossBeforeAds: number; // ganancia bruta antes de publicidad
  net: number;
  margin: number; // % sobre revenue
}

interface Props {
  title: string;
  state: EscenarioState;
  onChange: (next: EscenarioState) => void;
  results: EscenarioResults;
}

const CardEscenario: React.FC<Props> = ({ title, state, onChange, results }) => {
  const badge = results.margin >= 20 ? 'bg-green-100 text-green-700 border-green-200' : results.margin >= 10 ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-red-100 text-red-700 border-red-200';
  const currency = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

  return (
    <div className="border rounded-lg shadow-md p-4 bg-white">
      <h3 className="font-semibold text-slate-800 mb-3">{title}</h3>
      <div className="grid grid-cols-1 gap-3 mb-3">
        <div>
          <label className="block text-sm font-medium text-slate-600">Unidades a Vender</label>
          <input
            type="number"
            step="1"
            className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
            value={state.unidades}
            onChange={(e) => onChange({ ...state, unidades: Number(e.target.value) })}
            placeholder="Ej. 100"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">ACOS Objetivo (%)</label>
          <input
            type="number"
            step="0.1"
            className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
            value={state.acos}
            onChange={(e) => onChange({ ...state, acos: Number(e.target.value) })}
            placeholder="Ej. 10"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-600">% de ventas por publicidad</label>
          <input
            type="number"
            step="1"
            min={0}
            max={100}
            className="w-full h-10 bg-white border border-slate-300 rounded-md p-2 mt-1 focus:ring-blue-500 focus:border-blue-500"
            value={state.adsSharePct}
            onChange={(e) => onChange({ ...state, adsSharePct: Number(e.target.value) })}
            placeholder="Ej. 30"
          />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600"><span className="inline-flex w-5 h-5 items-center justify-center text-xs font-semibold bg-blue-100 text-blue-700 rounded mr-2">1</span>Ventas brutas proyectadas</span>
          <span className="tabular-nums text-lg font-semibold text-slate-900">{currency.format(results.revenue)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600"><span className="inline-flex w-5 h-5 items-center justify-center text-xs font-semibold bg-blue-100 text-blue-700 rounded mr-2">2</span>Ingresos esperados (aprox.)</span>
          <span className="tabular-nums text-lg font-semibold text-slate-900">{currency.format(results.expectedIncome)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600"><span className="inline-flex w-5 h-5 items-center justify-center text-xs font-semibold bg-blue-100 text-blue-700 rounded mr-2">3</span>Costo de producto total</span>
          <span className="tabular-nums text-lg font-semibold text-slate-900">{currency.format(results.productTotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600"><span className="inline-flex w-5 h-5 items-center justify-center text-xs font-semibold bg-blue-100 text-blue-700 rounded mr-2">4</span>Ganancia bruta (antes de publicidad)</span>
          <span className="tabular-nums text-lg font-semibold text-slate-900">{currency.format(results.grossBeforeAds)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-slate-600"><span className="inline-flex w-5 h-5 items-center justify-center text-xs font-semibold bg-blue-100 text-blue-700 rounded mr-2">5</span>Inversión publicitaria estimada</span>
          <span className="tabular-nums text-lg font-semibold text-red-500">{currency.format(results.adsCost)}</span>
        </div>
        <div className="border-t border-slate-200 pt-2 flex items-center justify-between">
          <span className="text-sm text-slate-700 font-medium">Ganancia neta mensual (después de publicidad)</span>
          <span className="tabular-nums text-2xl font-bold text-green-600">{currency.format(results.net)}</span>
        </div>
        <div className="text-xs text-slate-600 flex items-center gap-2">
          <span>Margen neto mensual</span>
          <span className={`tabular-nums font-semibold px-2 py-0.5 rounded border ${badge}`}>{results.margin.toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};

export default CardEscenario;
