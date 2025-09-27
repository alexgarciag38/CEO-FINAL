import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { GestionCategorias } from '@/components/finanzas/GestionCategorias';
import { GestionMisMovimientos } from '@/components/finanzas/GestionMisMovimientos';
import { DashboardActividadFinanciera } from '@/components/finanzas/DashboardActividadFinanciera';
import { MovimientosContainer } from '@/components/finanzas/MovimientosContainer';

type Role = 'admin' | 'colaborador' | string | undefined;


export const FinanzasModule: React.FC = () => {
  const [role, setRole] = useState<Role>(undefined);
  const [roleReady, setRoleReady] = useState(false);
  const [tab, setTab] = useState<'dashboard' | 'mis' | 'movimientos' | 'categorias'>('dashboard');

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const meta: any = user?.user_metadata || {};
      const r = (meta.role || meta.app_role) as Role;
      setRole(r === 'admin' ? 'admin' : 'colaborador');
      setRoleReady(true);
    })();
  }, []);

  useEffect(() => {
    if (!roleReady) return;
    setTab(role === 'admin' ? 'dashboard' : 'mis');
  }, [roleReady, role]);


  const renderTabs = () => (
    <div className="flex gap-3 border-b mb-4">
      <button className={`px-3 py-2 ${tab==='dashboard'?'border-b-2 border-blue-600':''}`} onClick={() => setTab('dashboard')}>Dashboard</button>
      {role === 'admin' && (
        <button className={`px-3 py-2 ${tab==='movimientos'?'border-b-2 border-blue-600':''}`} onClick={() => setTab('movimientos')}>Movimientos</button>
      )}
      {role === 'admin' && (
        <button className={`px-3 py-2 ${tab==='categorias'?'border-b-2 border-blue-600':''}`} onClick={() => setTab('categorias')}>Categorías</button>
      )}
      <button className={`px-3 py-2 ${tab==='mis'?'border-b-2 border-blue-600':''}`} onClick={() => setTab('mis')}>Mis movimientos</button>
    </div>
  );

  if (!roleReady) {
    return <div className="p-4">Cargando…</div>;
  }

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-2">Finanzas</h1>
      {renderTabs()}

      {tab === 'dashboard' && (role === 'admin' ? <DashboardActividadFinanciera /> : <div className="text-sm text-gray-600">Se requiere rol administrador para ver el dashboard.</div>)}

      {role === 'admin' && tab === 'categorias' && (
        <GestionCategorias />
      )}

      {role === 'colaborador' && tab === 'mis' && (<GestionMisMovimientos />)}

      {role === 'admin' && tab === 'movimientos' && (<MovimientosContainer />)}
    </div>
  );
};


