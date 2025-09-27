import React from 'react';
import DashboardCard from './DashboardCard';

interface DashboardGridProps {
  data: {
    dineroActualDisponible: number;
    ingresosPorVenir: number;
    pagosPorHacer: number;
    flujoProyectado: number;
    saldosVencidos: number;
    vencidosPorCobrar?: number;
    vencidosDebe?: number;
  };
  onVencidosClick?: () => void;
}

const DashboardGrid: React.FC<DashboardGridProps> = ({ data, onVencidosClick }) => {
  const getVencidosSubtitle = () => {
    const dv = data.vencidosPorCobrar || 0;
    const db = data.vencidosDebe || 0;
    
    if (dv === 0 && db === 0) return 'No hay saldos vencidos';
    if (dv > 0 && db === 0) return `Te deben (vencido): ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(dv)}`;
    if (db > 0 && dv === 0) return `Debes (vencido): ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(db)}`;
    return `Te deben: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(dv)} · Debes: ${new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(db)}`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
      {/* Dinero Actual Disponible */}
      <DashboardCard
        title="DINERO ACTUAL DISPONIBLE"
        value={data.dineroActualDisponible}
        subtitle="(Efectivo + Cuentas Bancarias)"
        type="dinero"
      />

      {/* Ingresos por Venir */}
      <DashboardCard
        title="INGRESOS POR VENIR"
        value={data.ingresosPorVenir}
        subtitle="en facturas programadas"
        type="ingresos"
      />

      {/* Pagos por Hacer */}
      <DashboardCard
        title="PAGOS POR HACER"
        value={data.pagosPorHacer}
        subtitle="en pagos programados"
        type="pagos"
      />

      {/* Flujo Proyectado */}
      <DashboardCard
        title="FLUJO PROYECTADO"
        value={data.flujoProyectado}
        subtitle="Balance para los próximos días"
        type="flujo"
      />

      {/* Saldos Vencidos */}
      <DashboardCard
        title="SALDOS VENCIDOS"
        value={data.saldosVencidos}
        subtitle={getVencidosSubtitle()}
        type="vencidos"
        onClick={onVencidosClick}
      />
    </div>
  );
};

export default DashboardGrid;
