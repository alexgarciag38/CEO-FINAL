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
          <div className="flex items-center justify-between">
            <CardTitle className="text-blue-700">Centro de Incidencias</CardTitle>
            <div className="flex gap-2">
              <Button onClick={() => setTab('create')} className="bg-blue-600 hover:bg-blue-700 text-white">
                <PlusCircle className="w-4 h-4 mr-2" /> Crear Incidencia
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid grid-cols-4 w-full">
              <TabsTrigger value="dashboard" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <BarChart3 className="w-4 h-4 mr-2" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="list" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <ClipboardList className="w-4 h-4 mr-2" /> Mis Incidencias
              </TabsTrigger>
              <TabsTrigger value="create" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <PlusCircle className="w-4 h-4 mr-2" /> Crear Incidencia
              </TabsTrigger>
              <TabsTrigger value="config" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
                <Settings className="w-4 h-4 mr-2" /> Configuración
              </TabsTrigger>
            </TabsList>

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


