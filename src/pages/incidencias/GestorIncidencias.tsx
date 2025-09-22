import React, { useEffect, useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PlusCircle, Settings, BarChart3, ClipboardList } from 'lucide-react';
import { IncidentsDashboard } from './components/IncidentsDashboard';
import { IncidentsList } from './components/IncidentsList';
import { IncidentForm } from './components/IncidentForm';
import { IncidentsConfig } from './components/IncidentsConfig';
import { Toaster } from '@/components/ui/sonner';
import { IncidentDetail } from './components/IncidentDetail';

export const GestorIncidencias: React.FC = () => {
  const [tab, setTab] = useState('dashboard');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (tab !== 'list') {
      setSelectedId(null);
    }
  }, [tab]);

  return (
    <div className="p-4 sm:p-6">
      <Toaster richColors position="top-right" toastOptions={{
        className: 'border border-blue-200 bg-white text-blue-700 shadow-md',
        style: { boxShadow: '0 6px 20px rgba(30, 64, 175, 0.15)' }
      }} />
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <CardTitle className="text-blue-700">Centro de Incidencias</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button onClick={() => setTab('create')} className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                <PlusCircle className="w-4 h-4 mr-2" /> Crear Incidencia
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <div className="overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] no-scrollbar">
              <TabsList className="flex w-max gap-2 whitespace-nowrap">
                <TabsTrigger value="dashboard" className="px-3 py-1 text-sm shrink-0 flex items-center gap-1 whitespace-nowrap truncate overflow-hidden max-w-[160px] leading-tight data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <BarChart3 className="w-4 h-4 mr-2" /> Dashboard
                </TabsTrigger>
                <TabsTrigger value="list" className="px-3 py-1 text-sm shrink-0 flex items-center gap-1 whitespace-nowrap truncate overflow-hidden max-w-[160px] leading-tight data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <ClipboardList className="w-4 h-4 mr-2" /> Mis Incidencias
                </TabsTrigger>
                {/* Oculto para evitar duplicidad: solo dejamos el botón azul grande del header
                <TabsTrigger value="create" className="px-3 py-1 text-sm shrink-0 flex items-center gap-1 whitespace-nowrap truncate overflow-hidden max-w-[160px] leading-tight data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <PlusCircle className="w-4 h-4 mr-2" /> Crear Incidencia
                </TabsTrigger>
                */}
                <TabsTrigger value="config" className="px-3 py-1 text-sm shrink-0 flex items-center gap-1 whitespace-nowrap truncate overflow-hidden max-w-[160px] leading-tight data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Settings className="w-4 h-4 mr-2" /> Configuración
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dashboard">
              <IncidentsDashboard />
            </TabsContent>
            <TabsContent value="list">
              {selectedId ? (
                <IncidentDetail id={selectedId} onBack={() => setSelectedId(null)} />
              ) : (
                <IncidentsList onCreate={() => setTab('create')} onSelect={(id) => { setSelectedId(id); }} />
              )}
            </TabsContent>
            <TabsContent value="create">
              <IncidentForm onCreated={() => setTab('list')} />
            </TabsContent>
            <TabsContent value="config">
              <IncidentsConfig />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default GestorIncidencias;


