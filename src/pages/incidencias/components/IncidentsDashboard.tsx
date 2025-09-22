import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AnimatedNumber } from '@/components/ui/AnimatedNumber';
import { invoke } from '@/lib/api';
import { useCompany } from '@/contexts/CompanyContext';
import { Bar, Doughnut } from 'react-chartjs-2';
import { DB_TO_STATUS_KEY, STATUS_CHART_COLORS_HEX, STATUS_CONFIG, STATUS_ORDER } from '@/config/incidentConfig';
import { EmployeeAvatar } from '@/components/EmployeeAvatar';
import Chart from 'chart.js/auto';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

export const IncidentsDashboard: React.FC = () => {
  const { companyId } = useCompany();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [kpis, setKpis] = useState<{ open: number; criticalOpenOrInProgress: number; avgResolutionDays: number; resolvedLast7: number }>({ open: 0, criticalOpenOrInProgress: 0, avgResolutionDays: 0, resolvedLast7: 0 });
  const [byType, setByType] = useState<Array<{ name: string; count: number; color_hex?: string }>>([]);
  const [byPriority, setByPriority] = useState<Array<{ priority: string; count: number }>>([]);
  const [byStatus, setByStatus] = useState<Array<{ status: string; count: number }>>([]);
  const [topCritical, setTopCritical] = useState<any[]>([]);
  const [recent, setRecent] = useState<any[]>([]);
  const [pareto, setPareto] = useState<any>(null);
  const [employeeLoad, setEmployeeLoad] = useState<{ labels: string[]; incident_counts: number[]; employee_ids: string[] } | null>(null);
  const [byAssigneeAgg, setByAssigneeAgg] = useState<Array<{ name: string; count: number }>>([]);
  const paretoKey = useMemo(() => {
    if (!pareto) return 'none';
    return `${(pareto.labels||[]).join('|')}::${(pareto.frequencies||[]).join('|')}::${(pareto.cumulative_percentages||[]).join('|')}`;
  }, [pareto]);
  const chartRef = useRef<any>(null);

  // Ensure previous chart instance is destroyed before creating a new one
  useEffect(() => {
    if (chartRef.current && chartRef.current.destroy) {
      try { chartRef.current.destroy(); } catch { /* noop */ }
      chartRef.current = null;
    }
  }, [paretoKey]);

  // Custom Pareto Chart (manual lifecycle via chart.js/auto)
  const ParetoChart: React.FC<{ data: any; options: any; height?: number }> = ({ data, options, height = 320 }) => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const localChartRef = useRef<any>(null);
    useEffect(() => {
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;
      if (localChartRef.current) {
        try { localChartRef.current.destroy(); } catch {}
        localChartRef.current = null;
      }
      localChartRef.current = new Chart(ctx, { type: 'bar', data, options });
      return () => {
        if (localChartRef.current) {
          try { localChartRef.current.destroy(); } catch {}
          localChartRef.current = null;
        }
      };
    }, [JSON.stringify(data), JSON.stringify(options)]);
    return <canvas ref={canvasRef} style={{ height }} />;
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true); setError(null);
      try {
        const data = await invoke<any>('incidents-dashboard', { body: { company_id: companyId } });
        setKpis(data?.kpis || { open: 0, criticalOpenOrInProgress: 0, avgResolutionDays: 0, resolvedLast7: 0 });
        setByType((data?.byType || []).map((x: any) => ({ name: x.name, count: Number(x.count) })));
        setByPriority((data?.byPriority || []).map((x: any) => ({ priority: x.priority, count: Number(x.count) })));
        setByStatus((data?.byStatus || []).map((x: any) => ({ status: x.status, count: Number(x.count) })));
        setTopCritical(data?.topCritical || []);
        setRecent(data?.recent || []);
        setPareto(data?.pareto_data || null);
        setEmployeeLoad(data?.employee_load_data || null);
        setByAssigneeAgg((data?.byAssignee || []).map((x: any) => ({ name: x.name, count: Number(x.count) })));
      } catch (e: any) {
        setError(e.message || 'Error al cargar');
      } finally { setLoading(false); }
    };
    load();
  }, [companyId]);

  const barData = useMemo(() => ({
    labels: byType.map(t => t.name),
    datasets: [{
      label: 'Incidencias',
      data: byType.map(t => t.count),
      backgroundColor: byType.map(t => (t.color_hex || '#2563eb') + '99'),
      borderColor: byType.map(t => t.color_hex || '#2563eb'),
      borderWidth: 1,
      borderRadius: 6,
    }]
  }), [byType]);

  const barOptions = useMemo(() => ({
    indexAxis: 'y' as const,
    responsive: true,
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true },
    },
    scales: {
      x: { grid: { color: 'rgba(0,0,0,0.05)' } },
      y: { grid: { display: false } }
    }
  }), []);

  const prColors: Record<string, string> = {
    low: '#16a34a',
    medium: '#2563eb',
    high: '#fb923c',
    critical: '#ef4444'
  };

  const doughnutData = useMemo(() => {
    const labels = ['low','medium','high','critical'];
    const counts = labels.map(l => byPriority.find(p => p.priority === l)?.count || 0);
    const bg = labels.map(l => prColors[l]);
    const border = labels.map(l => prColors[l]);
    return {
      labels: ['Baja','Media','Alta','Urgente'],
      datasets: [{ data: counts, backgroundColor: bg, borderColor: border, borderWidth: 1 }]
    };
  }, [byPriority]);

  const doughnutByStatusData = useMemo(() => {
    const countsByDb: Record<string, number> = {};
    for (const r of byStatus) countsByDb[r.status] = (countsByDb[r.status] || 0) + Number(r.count || 0);
    const labels = STATUS_ORDER.map(k => STATUS_CONFIG[k].label);
    const data = STATUS_ORDER.map(k => {
      const db = ({ PENDIENTE: 'open', EN_PROGRESO: 'in_progress', RESUELTA: 'resolved', CERRADA: 'closed' } as const)[k];
      return countsByDb[db] || 0;
    });
    const bg = STATUS_ORDER.map(k => STATUS_CHART_COLORS_HEX[k].fill);
    const border = STATUS_ORDER.map(k => STATUS_CHART_COLORS_HEX[k].stroke);
    return { labels, datasets: [{ data, backgroundColor: bg, borderColor: border, borderWidth: 1 }] };
  }, [byStatus]);

  const employeeLoadData = useMemo(() => {
    let labels = employeeLoad?.labels || [];
    let counts = employeeLoad?.incident_counts || [];
    if ((!labels || labels.length === 0) && (byAssigneeAgg && byAssigneeAgg.length > 0)) {
      // Fallback: usar totales por asignado si el backend aún no devuelve employee_load_data
      const sorted = [...byAssigneeAgg].sort((a: any, b: any) => Number(b.count||0) - Number(a.count||0));
      labels = sorted.map((x: any) => x.name);
      counts = sorted.map((x: any) => Number(x.count||0));
    }
    const palette = ['#DBEAFE','#E9D5FF','#BBF7D0','#FBCFE8','#C7D2FE','#E5E7EB','#FEF3C7','#D1FAE5'];
    const colors = (labels || []).map((_, i) => palette[i % palette.length]);
    return { labels, datasets: [{ data: counts, backgroundColor: colors, borderColor: colors, borderWidth: 1, borderRadius: 6 }] };
  }, [employeeLoad, byAssigneeAgg]);

  const openPlusInProgress = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of byStatus) map[r.status] = Number(r.count || 0);
    return (map['open'] || 0) + (map['in_progress'] || 0);
  }, [byStatus]);

  const formatDaysOpen = (createdAt?: string) => {
    if (!createdAt) return '-';
    const diffMs = Date.now() - new Date(createdAt).getTime();
    return Math.max(1, Math.ceil(diffMs / (1000*60*60*24)));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
      {/* KPIs row */}
      <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6">
        <Card className="bg-white rounded-lg shadow-md">
          <CardHeader><CardTitle className="text-blue-700">Incidencias Abiertas</CardTitle></CardHeader>
          <CardContent>
            <div className="text-5xl font-extrabold text-blue-700"><AnimatedNumber value={openPlusInProgress || kpis.open} /></div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg shadow-md border-l-4 border-orange-400">
          <CardHeader><CardTitle className="text-orange-600">Críticas/Urgentes</CardTitle></CardHeader>
          <CardContent>
            <div className="text-5xl font-extrabold text-orange-600"><AnimatedNumber value={kpis.criticalOpenOrInProgress} /></div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg shadow-md">
          <CardHeader><CardTitle className="text-gray-700">Tiempo Prom. Resolución</CardTitle></CardHeader>
          <CardContent>
            <div className="text-5xl font-extrabold text-gray-700"><span>{Number(kpis.avgResolutionDays?.toFixed?.(1) ?? 0)}</span><span className="ml-2 text-xl">días</span></div>
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg shadow-md">
          <CardHeader><CardTitle className="text-green-700">Resueltas (7 días)</CardTitle></CardHeader>
          <CardContent>
            <div className="text-5xl font-extrabold text-green-700"><AnimatedNumber value={kpis.resolvedLast7} /></div>
          </CardContent>
        </Card>
      </div>

      {/* Main analysis */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        <Card className="bg-white rounded-lg shadow-md">
          <CardHeader><CardTitle className="text-blue-700 text-xl font-bold">Análisis de Pareto por Tipo de Incidencia</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="text-gray-500">Cargando...</div> : error ? <div className="text-red-600">{error}</div> : (
              <div className="h-[320px]">
                {pareto && (
                  <ParetoChart
                    data={{
                      labels: pareto.labels,
                      datasets: [
                        {
                          label: 'Número de Incidencias',
                          data: pareto.frequencies,
                          backgroundColor: pareto.colors,
                          borderColor: pareto.colors,
                          borderWidth: 1,
                          borderRadius: 6,
                          barPercentage: 0.6,
                          categoryPercentage: 0.7,
                          yAxisID: 'y',
                          order: 1,
                        },
                        {
                          label: 'Porcentaje Acumulado',
                          data: pareto.cumulative_percentages,
                          type: 'line',
                          borderColor: '#F97316',
                          backgroundColor: 'transparent',
                          pointBackgroundColor: '#F97316',
                          pointBorderColor: '#FFFFFF',
                          pointRadius: 5,
                          pointHoverRadius: 7,
                          pointBorderWidth: 2,
                          tension: 0.3,
                          yAxisID: 'y1',
                          order: 2,
                        },
                      ],
                    }}
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      interaction: { mode: 'index', intersect: false },
                      scales: {
                        x: { stacked: false },
                        y: {
                          type: 'linear',
                          display: true,
                          position: 'left',
                          beginAtZero: true,
                          title: { display: true, text: 'Número de Incidencias', color: '#6B7280', font: { size: 12, weight: 'normal' } },
                          grid: { color: 'rgba(0,0,0,0.06)' },
                          ticks: { precision: 0 },
                          suggestedMax: (() => {
                            try {
                              const max = Math.max(...(pareto?.frequencies || [0]));
                              return max > 0 ? Math.ceil(max * 1.1) : undefined;
                            } catch { return undefined; }
                          })(),
                        },
                        y1: {
                          type: 'linear',
                          display: true,
                          position: 'right',
                          min: 0,
                          max: 100,
                          title: { display: true, text: 'Porcentaje Acumulado (%)', color: '#6B7280', font: { size: 12, weight: 'normal' } },
                          grid: { drawOnChartArea: false },
                          ticks: { callback: (v: any) => `${v}%` },
                        },
                      },
                      plugins: {
                        legend: { 
                          display: true, 
                          position: 'top',
                          labels: {
                            generateLabels: (chart: any) => {
                              const base = (Chart as any).defaults.plugins.legend.labels.generateLabels(chart);
                              if (base[0]) { base[0].fillStyle = '#6B7280'; base[0].strokeStyle = '#6B7280'; }
                              if (base[1]) { base[1].fillStyle = '#F97316'; base[1].strokeStyle = '#F97316'; }
                              return base;
                            }
                          }
                        },
                        tooltip: {
                          callbacks: {
                            label: (ctx: any) => {
                              const label = ctx.dataset.label || '';
                              const value = ctx.parsed.y;
                              if (label.includes('Porcentaje')) {
                                return `${label}: ${value}%`;
                              }
                              return `${label}: ${value}`;
                            }
                          }
                        }
                      },
                    }}
                  />
                )}
              </div>
            )}
            {pareto && (
              <p className="text-sm text-gray-600 mt-4">
                {(() => {
                  const idx = pareto.cumulative_percentages.findIndex((v: number) => v >= 80);
                  const count = idx === -1 ? pareto.labels.length : (idx + 1);
                  const topLabels = pareto.labels.slice(0, count).join(', ');
                  const perc = pareto.cumulative_percentages[count - 1] || 0;
                  return (
                    <>Análisis: Las <strong>{count}</strong> principales causas (<strong>{topLabels}</strong>) representan el <strong>{perc}%</strong> de todas las incidencias.</>
                  );
                })()}
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg shadow-md">
          <CardHeader><CardTitle className="text-blue-700">Carga de Incidencias por Empleado</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="text-gray-500">Cargando...</div> : error ? <div className="text-red-600">{error}</div> : (
              <Bar
                data={employeeLoadData}
                options={{
                  indexAxis: 'y',
                  responsive: true,
                  plugins: {
                    legend: { display: false },
                    tooltip: {
                      enabled: false,
                      external: (ctx: any) => {
                        const tooltipModel = ctx.tooltip;
                        let el = document.getElementById('employee-load-tooltip');
                        if (!el) {
                          el = document.createElement('div');
                          el.id = 'employee-load-tooltip';
                          el.style.position = 'absolute';
                          el.style.pointerEvents = 'none';
                          el.style.zIndex = '9999';
                          document.body.appendChild(el);
                        }
                        if (tooltipModel.opacity === 0) { el.style.opacity = '0'; return; }
                        const idx = tooltipModel.dataPoints?.[0]?.dataIndex ?? 0;
                        const name = (employeeLoad?.labels || [])[idx] || '';
                        const count = (employeeLoad?.incident_counts || [])[idx] || 0;
                        el.innerHTML = `<div class="px-3 py-2 rounded-md shadow bg-white border border-gray-200 flex items-center gap-2">
                        <span id="avatar-slot"></span>
                        <div class="text-gray-800">${name}</div>
                        <div class="text-blue-700 font-medium ml-2">${count}</div>
                      </div>`;
                        const avatarSlot = el.querySelector('#avatar-slot');
                        if (avatarSlot) {
                          avatarSlot.innerHTML = '';
                          const mount = document.createElement('div');
                          avatarSlot.appendChild(mount);
                          const initials = (name || '?').split(/\s+/).filter(Boolean).slice(0,2).map(s=>s[0]?.toUpperCase()||'').join('') || '?';
                          mount.outerHTML = `<div class="inline-flex items-center justify-center rounded-full h-6 w-6 text-xs bg-gray-200 text-gray-800 font-semibold">${initials}</div>`;
                        }
                        const { offsetLeft: positionX, offsetTop: positionY } = ctx.chart.canvas;
                        el.style.opacity = '1';
                        el.style.left = positionX + tooltipModel.caretX + 'px';
                        el.style.top = positionY + tooltipModel.caretY + 'px';
                      }
                    }
                  },
                  scales: { x: { grid: { color: 'rgba(0,0,0,0.05)' } }, y: { grid: { display: false } } }
                }}
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Donut satellites at right */}
      <div className="lg:col-span-1 flex flex-col gap-6">
        <Card className="bg-white rounded-lg shadow-md">
          <CardHeader><CardTitle className="text-blue-700">Incidencias por Prioridad</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="text-gray-500">Cargando...</div> : error ? <div className="text-red-600">{error}</div> : <Doughnut data={doughnutData} options={{ responsive: true, plugins: { legend: { display: true, position: 'bottom' } } }} />}
          </CardContent>
        </Card>
        <Card className="bg-white rounded-lg shadow-md">
          <CardHeader><CardTitle className="text-blue-700">Incidencias por Estado</CardTitle></CardHeader>
          <CardContent>
            {loading ? <div className="text-gray-500">Cargando...</div> : error ? <div className="text-red-600">{error}</div> : <Doughnut data={doughnutByStatusData} options={{ responsive: true, plugins: { legend: { display: true, position: 'bottom' } } }} />}
          </CardContent>
        </Card>
      </div>

      {/* Action & team row */}
      <Card className="bg-white rounded-lg shadow-md lg:col-span-1">
        <CardHeader><CardTitle className="text-blue-700">Top 5 Incidencias Críticas Abiertas</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-gray-600">
                  <th className="text-left font-medium pb-2">Título</th>
                  <th className="text-left font-medium pb-2">Asignado A</th>
                  <th className="text-left font-medium pb-2">Días Abierta</th>
                </tr>
              </thead>
              <tbody>
                {(topCritical || []).map((it: any) => (
                  <tr key={it.id} className="border-t border-gray-100">
                    <td className="py-2 text-gray-800">{it.title}</td>
                    <td className="py-2 text-gray-700"><div className="inline-flex items-center gap-2"><EmployeeAvatar name={it.assigned?.name || '—'} /><span>{it.assigned?.name || '—'}</span></div></td>
                    <td className="py-2 text-blue-700 font-medium">{formatDaysOpen(it.created_at)}</td>
                  </tr>
                ))}
                {(!topCritical || topCritical.length === 0) && (
                  <tr><td colSpan={3} className="py-4 text-gray-500">Sin registros</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white rounded-lg shadow-md lg:col-span-2">
        <CardHeader><CardTitle className="text-blue-700">Actividad Reciente</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {(recent || []).map((r: any, idx: number) => (
              <li key={idx} className="flex items-start gap-3">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                <div className="flex-1">
                  <div className="text-gray-800">{r.text}</div>
                  <div className="text-xs text-gray-500">{r.incident?.title ? `En: ${r.incident.title}` : ''} · {new Date(r.created_at).toLocaleString()}</div>
                </div>
              </li>
            ))}
            {(!recent || recent.length === 0) && <li className="text-gray-500">Sin actividad reciente</li>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};


