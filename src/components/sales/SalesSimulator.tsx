import React, { useState, useEffect } from 'react';
import { LineChart } from '@/components/charts/LineChart';
import { BarChart } from '@/components/charts/BarChart';
import { Calculator, TrendingUp, Target, AlertCircle } from 'lucide-react';

interface SimulationParams {
  baseRevenue: number;
  growthRate: number;
  seasonalityFactor: number;
  marketingBudget: number;
  priceIncrease: number;
  newProducts: number;
  marketExpansion: number;
}

interface SimulationResult {
  month: string;
  baseline: number;
  optimistic: number;
  realistic: number;
  pessimistic: number;
}

export const SalesSimulator: React.FC = () => {
  const [params, setParams] = useState<SimulationParams>({
    baseRevenue: 100000,
    growthRate: 5,
    seasonalityFactor: 1.0,
    marketingBudget: 10000,
    priceIncrease: 0,
    newProducts: 0,
    marketExpansion: 0
  });

  const [results, setResults] = useState<SimulationResult[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);

  // Calculate simulation results
  const runSimulation = () => {
    setIsSimulating(true);
    
    setTimeout(() => {
      const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const simulationResults: SimulationResult[] = [];

      months.forEach((month, index) => {
        const monthlyGrowth = params.growthRate / 100;
        const seasonalMultiplier = params.seasonalityFactor + (Math.sin((index * Math.PI) / 6) * 0.2);
        const marketingImpact = (params.marketingBudget / 10000) * 0.05; // 5% impact per 10k budget
        const priceImpact = params.priceIncrease / 100;
        const newProductImpact = params.newProducts * 0.03; // 3% per new product
        const expansionImpact = params.marketExpansion / 100;

        const baseGrowth = Math.pow(1 + monthlyGrowth, index + 1);
        const totalImpact = 1 + marketingImpact + priceImpact + newProductImpact + expansionImpact;

        const baseline = params.baseRevenue * baseGrowth * seasonalMultiplier;
        const realistic = baseline * totalImpact;
        const optimistic = realistic * 1.15; // 15% optimistic scenario
        const pessimistic = realistic * 0.85; // 15% pessimistic scenario

        simulationResults.push({
          month,
          baseline: Math.round(baseline),
          optimistic: Math.round(optimistic),
          realistic: Math.round(realistic),
          pessimistic: Math.round(pessimistic)
        });
      });

      setResults(simulationResults);
      setIsSimulating(false);
    }, 1000);
  };

  useEffect(() => {
    runSimulation();
  }, [params]);

  const handleParamChange = (key: keyof SimulationParams, value: number) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const totalProjection = results.reduce((sum, r) => sum + r.realistic, 0);
  const totalBaseline = results.reduce((sum, r) => sum + r.baseline, 0);
  const projectedGrowth = totalBaseline > 0 ? ((totalProjection - totalBaseline) / totalBaseline) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Simulation Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center mb-4">
          <Calculator className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold text-gray-900">
            Simulador de Ventas
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Base Revenue */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ingresos Base Mensuales (€)
            </label>
            <input
              type="number"
              value={params.baseRevenue}
              onChange={(e) => handleParamChange('baseRevenue', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              min="0"
              step="1000"
            />
          </div>

          {/* Growth Rate */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tasa de Crecimiento Anual (%)
            </label>
            <input
              type="number"
              value={params.growthRate}
              onChange={(e) => handleParamChange('growthRate', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              min="-50"
              max="100"
              step="0.5"
            />
          </div>

          {/* Marketing Budget */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Presupuesto Marketing (€)
            </label>
            <input
              type="number"
              value={params.marketingBudget}
              onChange={(e) => handleParamChange('marketingBudget', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              min="0"
              step="1000"
            />
          </div>

          {/* Price Increase */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Incremento de Precios (%)
            </label>
            <input
              type="number"
              value={params.priceIncrease}
              onChange={(e) => handleParamChange('priceIncrease', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              min="-50"
              max="50"
              step="0.5"
            />
          </div>

          {/* New Products */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nuevos Productos
            </label>
            <input
              type="number"
              value={params.newProducts}
              onChange={(e) => handleParamChange('newProducts', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              min="0"
              max="20"
            />
          </div>

          {/* Market Expansion */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expansión de Mercado (%)
            </label>
            <input
              type="number"
              value={params.marketExpansion}
              onChange={(e) => handleParamChange('marketExpansion', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              min="0"
              max="100"
              step="1"
            />
          </div>

          {/* Seasonality Factor */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Factor Estacional
            </label>
            <select
              value={params.seasonalityFactor}
              onChange={(e) => handleParamChange('seasonalityFactor', Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value={0.8}>Baja estacionalidad</option>
              <option value={1.0}>Estacionalidad normal</option>
              <option value={1.2}>Alta estacionalidad</option>
            </select>
          </div>

          {/* Simulate Button */}
          <div className="flex items-end">
            <button
              onClick={runSimulation}
              disabled={isSimulating}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSimulating ? 'Simulando...' : 'Simular'}
            </button>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <TrendingUp className="w-5 h-5 text-green-600 mr-2" />
            <h4 className="text-sm font-medium text-green-800">Proyección Anual</h4>
          </div>
          <p className="text-2xl font-bold text-green-900">
            €{totalProjection.toLocaleString()}
          </p>
          <p className="text-sm text-green-700">
            vs. línea base: +{projectedGrowth.toFixed(1)}%
          </p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <Target className="w-5 h-5 text-blue-600 mr-2" />
            <h4 className="text-sm font-medium text-blue-800">Escenario Optimista</h4>
          </div>
          <p className="text-2xl font-bold text-blue-900">
            €{results.reduce((sum, r) => sum + r.optimistic, 0).toLocaleString()}
          </p>
          <p className="text-sm text-blue-700">
            +15% sobre proyección realista
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600 mr-2" />
            <h4 className="text-sm font-medium text-amber-800">Escenario Pesimista</h4>
          </div>
          <p className="text-2xl font-bold text-amber-900">
            €{results.reduce((sum, r) => sum + r.pessimistic, 0).toLocaleString()}
          </p>
          <p className="text-sm text-amber-700">
            -15% sobre proyección realista
          </p>
        </div>
      </div>

      {/* Simulation Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Proyección de Ventas por Escenarios
        </h4>
        {results.length > 0 && (
          <LineChart
            data={results}
            lines={[
              { dataKey: 'baseline', stroke: '#6b7280', name: 'Línea Base' },
              { dataKey: 'pessimistic', stroke: '#f59e0b', name: 'Pesimista' },
              { dataKey: 'realistic', stroke: '#2563eb', name: 'Realista' },
              { dataKey: 'optimistic', stroke: '#10b981', name: 'Optimista' }
            ]}
            height={350}
          />
        )}
      </div>

      {/* Impact Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">
          Análisis de Impacto de Variables
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Variable Impact Chart */}
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Impacto por Variable</h5>
            <BarChart
              data={[
                { name: 'Marketing', impacto: (params.marketingBudget / 10000) * 5 },
                { name: 'Precios', impacto: params.priceIncrease },
                { name: 'Productos', impacto: params.newProducts * 3 },
                { name: 'Expansión', impacto: params.marketExpansion },
                { name: 'Crecimiento', impacto: params.growthRate }
              ]}
              bars={[
                { dataKey: 'impacto', fill: '#3b82f6', name: 'Impacto (%)' }
              ]}
              height={250}
              showLegend={false}
            />
          </div>

          {/* Recommendations */}
          <div>
            <h5 className="font-medium text-gray-900 mb-3">Recomendaciones</h5>
            <div className="space-y-3">
              {projectedGrowth > 20 && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                  <p className="text-sm text-green-800 font-medium">Escenario muy optimista</p>
                  <p className="text-xs text-green-700">
                    Asegúrese de tener capacidad operativa para manejar este crecimiento.
                  </p>
                </div>
              )}
              
              {params.marketingBudget < 5000 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <p className="text-sm text-amber-800 font-medium">Presupuesto de marketing bajo</p>
                  <p className="text-xs text-amber-700">
                    Considere aumentar la inversión en marketing para acelerar el crecimiento.
                  </p>
                </div>
              )}
              
              {params.priceIncrease > 10 && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-800 font-medium">Incremento de precios alto</p>
                  <p className="text-xs text-red-700">
                    Un incremento superior al 10% puede afectar la demanda negativamente.
                  </p>
                </div>
              )}
              
              {params.newProducts > 5 && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-sm text-blue-800 font-medium">Muchos productos nuevos</p>
                  <p className="text-xs text-blue-700">
                    Asegúrese de tener recursos suficientes para el desarrollo y lanzamiento.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

