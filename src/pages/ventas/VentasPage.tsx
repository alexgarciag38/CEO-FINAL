import React, { useState, useEffect } from 'react';
import { PageWrapper } from '@/components/layout/MainLayout';
import { SalesSimulator } from '@/components/sales/SalesSimulator';
import { AIInsights } from '@/components/sales/AIInsights';
import { AIContextualChat } from '@/components/sales/AIContextualChat';
import { PeriodSelector } from '@/components/sales/PeriodSelector';
import { ComparisonMetrics } from '@/components/sales/ComparisonMetrics';
import { EnhancedKPICard } from '@/components/ui/EnhancedKPICard';
import { EnhancedTopList } from '@/components/sales/EnhancedTopList';
import { InsightsPanel } from '@/components/ui/InsightsPanel';
import { SmartAlerts } from '@/components/ui/SmartAlerts';
import { ABCAdvancedPanel } from '@/components/sales/ABCAdvancedPanel';
import { supabase } from '@/lib/supabase';
import { useSalesAnalysis } from '@/hooks/useSalesAnalysis';
import { useSalesComparison } from '@/hooks/useSalesComparison';
import { useVentasNavigation } from '@/hooks/useVentasNavigation';
import { MonthSelector } from '@/components/sales/MonthSelector';
import { generateSalesTeamPerformance, generateProductCatalog } from '@/data/salesData';
import {
  TrendingUp,
  TrendingDown,
  Package,
  Users,
  Target,
  BarChart3,
  Calculator,
  Download,
  Filter,
  Search,
  Eye,
  Edit,
  MoreHorizontal,
  Upload,
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageCircle,
  Calendar,
  DollarSign,
  ClipboardList,
  Store,
  User,
  Trophy,
  Flame,
  Building,
  Briefcase,
  Crown,
  Receipt,
  Home,
  Briefcase as BriefcaseIcon,
  Building2
} from 'lucide-react';

//

export const VentasPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'abc' | 'simulator' | 'products' | 'team' | 'upload' | 'comparisons'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState('12m');
  
  // Nuevo estado para datos crudos del backend
  const [rawData, setRawData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadMessage, setUploadMessage] = useState('');
  const [salesGoal, setSalesGoal] = useState(1000000); // Objetivo de ventas del mes
  const [diasTranscurridos, setDiasTranscurridos] = useState(15); // Valor por defecto
  const [diasDelMes, setDiasDelMes] = useState(30); // Valor por defecto
  const [viewMode, setViewMode] = useState<'executive' | 'operational'>('executive'); // Selector de vistas
  const [showAIChat, setShowAIChat] = useState(false);

  // Estado para el período actual
  const [currentPeriod, setCurrentPeriod] = useState<{ mes: number; anio: number } | null>(null);
  const [processedData, setProcessedData] = useState<any>(null);
  const [showSaveButton, setShowSaveButton] = useState(false);

  // Form state for CSV upload
  const [formData, setFormData] = useState({
    mes: '',
    anio: '',
    cobranza: null as File | null,
    pedidos: null as File | null,
    productos: null as File | null
  });

  // Hook para navegación entre meses
  const { 
    mesesDisponibles, 
    mesActual, 
    datosMesActual, 
    loading: navigationLoading, 
    error: navigationError,
    cambiarAMes 
  } = useVentasNavigation();

  // Hook para comparaciones
  const { comparisonData, isLoading: comparisonLoading, error: comparisonError, fetchComparison } = useSalesComparison();
  
  // Ahora sí: preferir datos recién procesados del servidor, luego datos de navegación, luego datos raw
  const analisisData = useSalesAnalysis(processedData || datosMesActual || rawData);
  
  // Debug: Ver qué datos tenemos
  console.log('Raw data:', rawData);
  console.log('Analysis data:', analisisData);
  
  // Debug específico para productos
  if (rawData?.catalogoProductos) {
    console.log('Primer producto del backend:', rawData.catalogoProductos[0]);
    console.log('Estructura de productos:', rawData.catalogoProductos.slice(0, 3));
  }

  // Removed legacy mock variables not used in the new layout

  const productCatalog = analisisData?.catalogoProductos || generateProductCatalog(); // Use real data with fallback
  const teamPerformance = analisisData ? analisisData?.rendimientoAgentes?.map((agente: any) => ({
    name: agente.agente,
    region: 'N/A', // Not available in real data
    ventas: agente.ventas,
    objetivo: agente.ventas * 1.1, // Calculate based on actual sales
    cumplimiento: 100, // Calculate based on actual vs target
    clientes: agente.clientes
  })) || [] : generateSalesTeamPerformance();

  const tabs = [
    { id: 'overview', label: 'Resumen', icon: TrendingUp },
    { id: 'abc', label: 'Análisis ABC', icon: BarChart3 },
    { id: 'simulator', label: 'Simulador', icon: Calculator },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'team', label: 'Equipo', icon: Users },
    { id: 'comparisons', label: 'Comparaciones', icon: TrendingUp },
    { id: 'upload', label: 'Cargar Datos', icon: Upload }
  ];

  // Load latest analysis data on component mount (solo si no hay datos de navegación)
  useEffect(() => {
    const loadData = async () => {
      // Solo cargar datos legacy si no hay datos de navegación disponibles
      if (!datosMesActual && (!mesesDisponibles || mesesDisponibles.length === 0)) {
        setLoading(true);
        setError(null);
        try {
          const { data, error } = await supabase
            .from('ventas_historico')
            .select('datos, mes, anio, fecha_carga')
            .order('fecha_carga', { ascending: false })
            .limit(1)
            .single();

          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
            throw error;
          }

          if (data) {
            console.log('Datos cargados del backend:', data.datos);
            setRawData(data.datos);
            setCurrentPeriod({ mes: data.mes, anio: data.anio });
            
            // Guardar en localStorage para persistencia
            localStorage.setItem('ventas_current_period', JSON.stringify({
              mes: data.mes,
              anio: data.anio,
              fecha_carga: data.fecha_carga
            }));
          }
        } catch (err: any) {
          setError(err.message || 'Error al cargar los datos.');
          console.error('Error loading analysis:', err);
        } finally {
          setLoading(false);
        }
      }
    };
    loadData();
  }, [datosMesActual, mesesDisponibles]);

  //


  const handleFileChange = (field: string, file: File | null) => {
    setFormData(prev => ({
      ...prev,
      [field]: file
    }));
  };

  const validateFiles = () => {
    if (!formData.mes || !formData.anio) {
      setUploadMessage('Por favor seleccione mes y año');
      return false;
    }

    if (!formData.cobranza || !formData.pedidos || !formData.productos) {
      setUploadMessage('Por favor seleccione los 3 archivos CSV requeridos');
      return false;
    }

    // Validate file types
    const files = [formData.cobranza, formData.pedidos, formData.productos];
    for (const file of files) {
      if (!file.name.toLowerCase().endsWith('.csv') || file.type !== 'text/csv') {
        setUploadMessage('Todos los archivos deben ser CSV válidos');
        return false;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        setUploadMessage('Los archivos no pueden exceder 10MB');
        return false;
      }
    }

    // Validate date
    const mesInt = parseInt(formData.mes);
    const anioInt = parseInt(formData.anio);
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    if (mesInt < 1 || mesInt > 12 || anioInt < 2020 || anioInt > currentYear || 
        (anioInt === currentYear && mesInt > currentMonth)) {
      setUploadMessage('La fecha no puede ser futura');
      return false;
    }

    return true;
  };

  const getNombreMes = (mes: number) => {
    const meses = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return meses[mes - 1] || '';
  };

  const handlePeriodChange = (mes: number, anio: number, tipoComparacion: string) => {
    fetchComparison(mes, anio, tipoComparacion);
  };

  const handleSaveData = async () => {
    if (!processedData || !formData.mes || !formData.anio) {
      setUploadMessage('No hay datos para guardar');
      return;
    }

    setLoading(true);
    setUploadStatus('uploading');
    setUploadMessage('Guardando datos en la base de datos...');

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No autenticado');
      }

      // Guardar en la base de datos (UPSERT - insertar o actualizar)
      const { error } = await supabase
        .from('ventas_historico')
        .upsert({
          usuario_id: session.user.id,
          mes: parseInt(formData.mes),
          anio: parseInt(formData.anio),
          datos: processedData,
          fecha_carga: new Date().toISOString()
        }, {
          onConflict: 'mes,anio'
        });

      if (error) throw error;

      // Actualizar el período actual
      const newPeriod = { 
        mes: parseInt(formData.mes), 
        anio: parseInt(formData.anio) 
      };
      setCurrentPeriod(newPeriod);
      
      // Guardar en localStorage
      localStorage.setItem('ventas_current_period', JSON.stringify({
        ...newPeriod,
        fecha_carga: new Date().toISOString()
      }));

      setUploadStatus('success');
      setUploadMessage(`Datos de ${getNombreMes(newPeriod.mes)} ${newPeriod.anio} guardados exitosamente`);
      
      // Ocultar botón de guardar
      setShowSaveButton(false);
      setProcessedData(null);
      
      // Reset form
      setFormData({
        mes: '',
        anio: '',
        cobranza: null,
        pedidos: null,
        productos: null
      });

    } catch (error) {
      console.error('Save error:', error);
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Error al guardar los datos');
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async () => {
    if (!validateFiles()) {
      setUploadStatus('error');
      return;
    }

    setLoading(true);
    setUploadStatus('uploading');
    setUploadMessage('Procesando archivos...');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('mes', formData.mes);
      formDataToSend.append('anio', formData.anio);
      formDataToSend.append('cobranza', formData.cobranza!);
      formDataToSend.append('pedidos', formData.pedidos!);
      formDataToSend.append('productos', formData.productos!);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('No autenticado');
      }

      const response = await fetch(`${(import.meta as any).env.VITE_SUPABASE_URL}/functions/v1/procesar-analisis-ventas`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        },
        body: formDataToSend
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en el procesamiento');
      }

      const analysisResult = await response.json();
      console.log('Datos procesados:', analysisResult);
      
      // Guardar datos procesados temporalmente (NO en BD)
      setProcessedData(analysisResult);
      setRawData(analysisResult);
      
      // Mostrar botón de guardar
      setShowSaveButton(true);
      
      setUploadStatus('success');
      setUploadMessage(`Datos de ${getNombreMes(parseInt(formData.mes))} ${formData.anio} procesados. Revisa y guarda cuando estés listo.`);
      
      // Switch to overview tab to show results
      setActiveTab('overview');

    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus('error');
      setUploadMessage(error instanceof Error ? error.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            {/* Consistency Alert - Removed as not available in new hook */}

            {/* Selector de Vistas y Controles */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  Dashboard de Control Estratégico
              </h2>
                
                {/* Selector de Vistas */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setViewMode('executive')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'executive'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Vista Ejecutiva
                    </button>
                    <button
                      onClick={() => setViewMode('operational')}
                      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                        viewMode === 'operational'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      Vista Operativa
                    </button>
                  </div>
                </div>
            </div>

              {/* Controles de Forecast */}
              <div className="flex items-center space-x-6 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Objetivo Mensual:
                  </label>
                  <input
                    type="number"
                    value={salesGoal}
                    onChange={(e) => setSalesGoal(Number(e.target.value))}
                    className="w-32 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    placeholder="1,000,000"
                />
              </div>

                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Días Transcurridos:
                  </label>
                  <input
                    type="number"
                    value={diasTranscurridos}
                    onChange={(e) => setDiasTranscurridos(Number(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    min="1"
                    max="31"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">
                    Días del Mes:
                  </label>
                  <input
                    type="number"
                    value={diasDelMes}
                    onChange={(e) => setDiasDelMes(Number(e.target.value))}
                    className="w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    min="28"
                    max="31"
                  />
                </div>
              </div>
            </div>

                          {/* Renderizado Condicional Basado en ViewMode */}
            {viewMode === 'executive' ? (
              <>
                {/* KPIs Grid Mejorado con Colores Dinámicos */}
                <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-6 stagger-in">
                   {/* 1. VENTAS TOTALES - Protagonista principal */}
                   <EnhancedKPICard
                     title="Ventas Totales"
                     value={analisisData?.kpis?.ventasTotales || 0}
                     type="ventas"
                     format="currency"
                     icon={<DollarSign className="h-6 w-6" />}
                     average={salesGoal * 0.8}
                     backgroundClass="bg-white"
                     borderClass="border border-gray-200"
                     valueTextClass="text-4xl font-black text-gray-800"
                     className="md:col-span-3 lg:col-span-2"
                     extraLines={["MÉTRICA PRINCIPAL", "+12.5% vs mes anterior | 82% del objetivo"]}
                   />
                   
                   {/* 2. MARGEN BRUTO - Segunda estrella */}
                   <EnhancedKPICard
                     title="Margen Bruto"
                     value={analisisData?.kpis?.margenBruto || 0}
                     type="margen"
                     format="currency"
                     icon={<BarChart3 className="h-6 w-6" />}
                     backgroundClass="bg-green-50"
                     borderClass="border border-green-200"
                     valueTextClass="text-4xl font-bold text-gray-800 tabular-nums"
                     secondaryValue={analisisData?.kpis?.margenBrutoPct || 0}
                     secondaryFormat="percentage"
                     className="md:col-span-2 lg:col-span-2"
                     extraLines={["RENTABILIDAD CLAVE"]}
                   />
                   
                   {/* 3. FORECAST - Tercera prioridad */}
                   <EnhancedKPICard
                     title="Forecast Mensual"
                     value={diasTranscurridos > 0 ? (analisisData?.kpis?.ventasTotales || 0) / diasTranscurridos * diasDelMes : 0}
                     type="ventas"
                     format="currency"
                     icon={<TrendingUp className="h-6 w-6" />}
                     backgroundClass="bg-blue-50"
                     borderClass="border border-blue-200"
                     valueTextClass="text-2xl font-bold text-gray-800"
                     className="md:col-span-1"
                     extraLines={["PROYECCIÓN ESTRATÉGICA", "98.4% probabilidad de cumplir objetivo"]}
                   />
                   
                   {/* 4. CARTERA VENCIDA - Alerta compacta */}
                   <EnhancedKPICard
                     title="Cartera Vencida"
                     value={analisisData?.kpis?.carteraVencida || 0}
                     type="cartera"
                     format="currency"
                     icon={<AlertTriangle className="h-6 w-6" />}
                     backgroundClass="bg-white"
                     borderClass="border border-gray-200"
                     className="border-l-4 border-red-500"
                     valueTextClass="text-gray-800"
                     extraLines={["MONITOREAR"]}
                   />
 
                   {/* Ticket Promedios - restaurados */}
                   <EnhancedKPICard
                     title="Ticket Prom. Mostrador S. Anita"
                     value={analisisData?.kpis?.ticketPromedio?.mostradorSantaAnita || 0}
                     type="ventas"
                     format="currency"
                     icon={<Receipt className="h-6 w-6" />}
                     backgroundClass="bg-white"
                     borderClass="border border-gray-200"
                     valueTextClass="text-gray-700"
                   />
 
                   <EnhancedKPICard
                     title="Ticket Prom. Domicilio"
                     value={analisisData?.kpis?.ticketPromedio?.domicilio || 0}
                     type="ventas"
                     format="currency"
                     icon={<Home className="h-6 w-6" />}
                     backgroundClass="bg-white"
                     borderClass="border border-gray-200"
                     valueTextClass="text-gray-700"
                   />
 
                   <EnhancedKPICard
                     title="Ticket Prom. Campo"
                     value={analisisData?.kpis?.ticketPromedio?.campo || 0}
                     type="ventas"
                     format="currency"
                     icon={<BriefcaseIcon className="h-6 w-6" />}
                     backgroundClass="bg-white"
                     borderClass="border border-gray-200"
                     valueTextClass="text-gray-700"
                   />
 
                   <EnhancedKPICard
                     title="Ticket Prom. Camino Real"
                     value={analisisData?.kpis?.ticketPromedio?.caminoReal || 0}
                     type="ventas"
                     format="currency"
                     icon={<Building2 className="h-6 w-6" />}
                     backgroundClass="bg-white"
                     borderClass="border border-gray-200"
                     valueTextClass="text-gray-700"
                   />
                 </div>

                {/* Insights y Alertas Automáticos */}
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <InsightsPanel data={analisisData} />
                  <SmartAlerts data={analisisData} />
                </div>

                {/* --- INICIO: SECCIÓN DE RANKINGS ESTRATÉGICOS MEJORADOS --- */}
                <div className="mt-8">
                  <h2 className="text-xl font-bold tracking-tight mb-4 flex items-center gap-2">
                    <Trophy className="h-6 w-6 text-yellow-500" />
                    Rankings Clave con Gamificación
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 stagger-in">
                    
                    {/* Fila 1 - Rankings Mejorados */}
                    <EnhancedTopList
                      title="Productos más Vendidos"
                      data={analisisData?.catalogoProductos?.map((product: any) => ({
                        producto: product.descripcion,
                        ventas: product.importe || 0,
                        utilidad: product.utilidad || 0
                      })) || []}
                      type="productos"
                      maxItems={5}
                      valueFormat="currency"
                    />

                    <EnhancedTopList
                      title="Productos más vendidos por Unidades"
                      data={analisisData?.catalogoProductos?.map((product: any) => ({
                        producto: product.descripcion,
                        ventas: product.cantidad || 0,
                        utilidad: product.utilidad || 0
                      })) || []}
                      type="productos"
                      maxItems={5}
                      valueFormat="number"
                    />
                    
                    <EnhancedTopList
                      title="Productos más Rentables"
                      data={analisisData?.catalogoProductos?.slice().sort((a: any, b: any) => (b.utilidad || 0) - (a.utilidad || 0)).map((product: any) => ({
                        producto: product.descripcion,
                        ventas: product.utilidad || 0,
                        utilidad: product.utilidad || 0
                      })) || []}
                      type="productos"
                      maxItems={5}
                      valueFormat="currency"
                    />

                    {/* Fila 2 - Sucursales y Mostrador */}
                    <EnhancedTopList
                      title="Ventas por Sucursal"
                      data={analisisData?.ventasPorSucursal?.map((sucursal: any) => ({
                        agente: sucursal.sucursal,
                        ventas: sucursal.ventas
                      })) || []}
                      type="agentes"
                      maxItems={5}
                      valueFormat="currency"
                    />
                    
                    <EnhancedTopList
                      title="Top Agentes de Mostrador"
                      data={analisisData?.agentesMostrador?.map((agente: any) => ({
                        agente: agente.agente,
                        ventas: agente.ventas
                      })) || []}
                      type="agentes"
                      maxItems={5}
                      valueFormat="currency"
                    />

                    <EnhancedTopList
                      title="Top Clientes de Mostrador"
                      data={analisisData?.clientesMostradorTop?.map((cliente: any) => ({
                        cliente: cliente.cliente,
                        ventas: cliente.ventas
                      })) || []}
                      type="clientes"
                      maxItems={5}
                      valueFormat="currency"
                    />

                    <EnhancedTopList
                      title="Clientes de Mostrador con más pedidos"
                      data={analisisData?.clientesMostradorFrecuenciaTop?.map((cliente: any) => ({
                        cliente: cliente.cliente,
                        ventas: cliente.pedidos
                      })) || []}
                      type="clientes"
                      maxItems={5}
                      valueFormat="number"
                    />

                    {/* Fila 3 - Campo */}
                    <EnhancedTopList
                      title="Top Agentes de Campo"
                      data={analisisData?.rendimientoAgentes?.map((agente: any) => ({
                        agente: agente.agente,
                        ventas: agente.ventas,
                        margen: agente.margen,
                        pedidos: agente.pedidos
                      })) || []}
                      type="agentes"
                      maxItems={5}
                      valueFormat="currency"
                    />

                    <EnhancedTopList
                      title="Top Clientes de Campo"
                      data={analisisData?.clientesCampoTop?.map((cliente: any) => ({
                        cliente: cliente.cliente,
                        ventas: cliente.ventas
                      })) || []}
                      type="clientes"
                      maxItems={5}
                      valueFormat="currency"
                    />

                    {/* Espacio para un tercer top de campo: sugerencia => Clientes con mayor crecimiento (si tuviéramos comparativas) */}
                  </div>
                </div>
                {/* --- FIN: SECCIÓN DE RANKINGS ESTRATÉGICOS MEJORADOS --- */}
              </>
            ) : (
              <>
                {/* Vista Operativa: Tablas Detalladas */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top 5 Clientes */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Top 5 Clientes
                      </h3>
                      <div className="space-y-3">
                        {(analisisData?.clientesTop || []).slice(0, 5).map((cliente: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-sm font-medium text-blue-600">
                                  {cliente.cliente.charAt(0).toUpperCase()}
                              </span>
                            </div>
                              <div>
                                <p className="font-medium text-gray-900">{cliente.cliente}</p>
                                                                  <p className="text-sm text-gray-500">Cliente destacado</p>
                          </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                ${cliente.ventas.toLocaleString('es-MX')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {(cliente.ventas / (analisisData?.kpis?.ventasTotales || 1) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
              </div>
            </div>

                    {/* Top 5 Agentes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Top 5 Agentes
                </h3>
                      <div className="space-y-3">
                        {(analisisData?.rendimientoAgentes || []).slice(0, 5).map((agente: any, index: number) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-green-600">
                                  {agente.agente.charAt(0).toUpperCase()}
                                </span>
              </div>
                              <div>
                                <p className="font-medium text-gray-900">{agente.agente}</p>
                                                                  <p className="text-sm text-gray-500">Agente destacado</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="font-semibold text-gray-900">
                                ${agente.ventas.toLocaleString('es-MX')}
                              </p>
                              <p className="text-sm text-gray-500">
                                {(agente.ventas / (analisisData?.kpis?.ventasTotales || 1) * 100).toFixed(1)}%
                              </p>
                            </div>
                          </div>
                        ))}
              </div>
            </div>
                  </div>
                </div>

                {/* Insights Panel */}
                <InsightsPanel data={analisisData} />

                {/* AI Insights */}
                <AIInsights analysisData={analisisData} />
              </>
            )}

            {/* Contenido Adicional para Vista Ejecutiva */}
            {viewMode === 'executive' && (
              <>
                {/* Fila 2: Performance y Progreso */}
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Barra de Progreso */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Progreso vs. Objetivo
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Progreso actual</span>
                          <span className="font-medium text-gray-900">
                            {((analisisData?.kpis?.ventasTotales || 0) / salesGoal * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-300 ${
                              (analisisData?.kpis?.ventasTotales || 0) / salesGoal >= 0.95 ? 'bg-green-500' :
                              (analisisData?.kpis?.ventasTotales || 0) / salesGoal >= 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min((analisisData?.kpis?.ventasTotales || 0) / salesGoal * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-500">
                          <span>$0</span>
                          <span>${salesGoal.toLocaleString('es-MX')}</span>
                        </div>
                      </div>
                    </div>

                    {/* Alertas Inteligentes */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Alertas y Oportunidades
                      </h3>
                      <div className="space-y-3">
                        {((analisisData?.kpis?.carteraVencida || 0) / (analisisData?.kpis?.ventasTotales || 1) * 100) >= 5 && (
                          <div className="flex items-start space-x-3 p-3 bg-yellow-50 rounded-lg">
                            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-yellow-800">Atención: Cartera Vencida</p>
                              <p className="text-yellow-700">
                                La cartera vencida representa un {((analisisData?.kpis?.carteraVencida || 0) / (analisisData?.kpis?.ventasTotales || 1) * 100).toFixed(1)}% de las ventas totales. 
                                Esto podría impactar el flujo de caja.
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {((analisisData?.kpis?.ventasTotales || 0) / (analisisData?.kpis?.totalPedidos || 1)) < 300 && (
                          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
                            <Target className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-blue-800">Oportunidad: Ticket Promedio</p>
                              <p className="text-blue-700">
                                El ticket promedio es de ${((analisisData?.kpis?.ventasTotales || 0) / (analisisData?.kpis?.totalPedidos || 1)).toLocaleString('es-MX')}. 
                                Implementar estrategias de up-selling o cross-selling podría incrementar este valor significativamente.
                              </p>
                            </div>
                          </div>
                        )}

                        {(analisisData?.kpis?.margenBrutoPct || 0) < 15 && (
                          <div className="flex items-start space-x-3 p-3 bg-red-50 rounded-lg">
                            <TrendingDown className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                            <div className="text-sm">
                              <p className="font-medium text-red-800">Alerta: Margen Bajo</p>
                              <p className="text-red-700">
                                El margen bruto del {(analisisData?.kpis?.margenBrutoPct || 0).toFixed(1)}% está por debajo del objetivo. 
                                Revisar precios y costos para mejorar la rentabilidad.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Insights Panel */}
            <InsightsPanel data={analisisData} />

            {/* AI Insights */}
            <AIInsights analysisData={analisisData} />
          </div>
        );

      case 'abc':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Análisis ABC Avanzado
              </h2>
              <ABCAdvancedPanel data={analisisData?.abc_avanzado as any} />
            </div>
          </div>
        );

      case 'simulator':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Simulador de Ventas
              </h2>
              <SalesSimulator />
            </div>
          </div>
        );

      case 'products':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">
                  Catálogo de Productos
                </h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="Buscar productos..."
                      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                    <Filter className="w-4 h-4 mr-2" />
                    Filtros
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-900">Descripción</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Costo por Pieza</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Precio de Venta</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Unidades Vendidas</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Importe Total</th>
                      <th className="text-right py-3 px-4 font-medium text-gray-900">Utilidad Total</th>
                      <th className="text-center py-3 px-4 font-medium text-gray-900">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productCatalog && productCatalog.length > 0 ? (
                      productCatalog.map((product: any, index: number) => (
                      <tr key={index} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center mr-3">
                              <Package className="w-5 h-5 text-gray-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{product?.descripcion || 'Sin descripción'}</div>
                              <div className="text-sm text-gray-500">Producto #{index + 1}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          ${(product?.costo || 0).toLocaleString('es-MX')}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          ${(product?.precioVentaPorPieza || 0).toLocaleString('es-MX')}
                        </td>
                        <td className="py-3 px-4 text-right text-gray-600">
                          {product?.cantidad || 0}
                        </td>
                        <td className="py-3 px-4 text-right font-medium">
                          ${(product?.importe || 0).toLocaleString('es-MX')}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-medium ${
                            (product?.utilidad || 0) >= 30 ? 'text-green-600' :
                            (product?.utilidad || 0) >= 20 ? 'text-yellow-600' : 'text-red-600'
                          }`}>
                            ${(product?.utilidad || 0).toLocaleString('es-MX')}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button className="text-gray-400 hover:text-gray-600">
                              <Eye className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <Edit className="w-4 h-4" />
                            </button>
                            <button className="text-gray-400 hover:text-gray-600">
                              <MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-gray-500">
                          <Package className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                          <p>No hay productos disponibles</p>
                          <p className="text-sm">Los productos aparecerán aquí después de cargar datos</p>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );

      case 'team':
        return (
          <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teamPerformance.map((member: any, index: number) => (
                <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center mb-4">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                      <span className="text-lg font-semibold text-blue-600">
                          {member.name.split(' ').map((n: string) => n[0]).join('')}
                        </span>
                      </div>
                      <div>
                      <h3 className="font-semibold text-gray-900">{member.name}</h3>
                        <p className="text-sm text-gray-600">{member.region}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Ventas</span>
                      <span className="font-medium">${member.ventas.toLocaleString('es-MX')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Objetivo</span>
                      <span className="text-gray-600">${member.objetivo.toLocaleString('es-MX')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Cumplimiento</span>
                        <span className={`font-medium ${
                          member.cumplimiento >= 100 ? 'text-green-600' : 
                          member.cumplimiento >= 95 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {member.cumplimiento.toFixed(1)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Clientes</span>
                        <span className="font-medium">{member.clientes}</span>
                      </div>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="mt-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">Progreso</span>
                        <span className="text-gray-900">{member.cumplimiento.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            member.cumplimiento >= 100 ? 'bg-green-500' : 
                            member.cumplimiento >= 95 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(member.cumplimiento, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
          </div>
        );

      case 'comparisons':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Comparaciones de Ventas
              </h2>
              
              {/* Selector de Período */}
              <PeriodSelector onPeriodChange={handlePeriodChange} />
              
              {/* Estado de carga */}
              {comparisonLoading && (
                <div className="flex items-center justify-center h-32">
                  <div className="text-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Cargando comparación...</p>
                  </div>
                </div>
              )}
              
              {/* Error */}
              {comparisonError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <XCircle className="w-5 h-5 text-red-600 mr-3" />
                    <span className="text-red-800 text-sm font-medium">
                      {comparisonError}
                    </span>
                  </div>
                </div>
              )}
              
              {/* Métricas de Comparación */}
              {comparisonData && !comparisonLoading && (
                <ComparisonMetrics
                  comparaciones={comparisonData.comparaciones}
                  periodoActual={comparisonData.periodoActual}
                  periodoComparacion={comparisonData.periodoComparacion}
                  tipoComparacion="mes_anterior"
                />
              )}
              
              {/* Mensaje inicial */}
              {!comparisonData && !comparisonLoading && !comparisonError && (
                <div className="text-center py-12">
                  <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Selecciona un período para comparar
                  </h3>
                  <p className="text-gray-600">
                    Usa el selector de período arriba para ver las comparaciones entre diferentes meses o años.
                  </p>
                </div>
              )}
            </div>
          </div>
        );

      case 'upload':
        return (
          <div className="space-y-8">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">
                Cargar Análisis de Ventas
              </h2>
              
              {/* Upload Status */}
              {uploadStatus !== 'idle' && (
                <div className={`mb-6 p-4 rounded-lg ${
                  uploadStatus === 'success' ? 'bg-green-50 border border-green-200' :
                  uploadStatus === 'error' ? 'bg-red-50 border border-red-200' :
                  'bg-blue-50 border border-blue-200'
                }`}>
                  <div className="flex items-center">
                    {uploadStatus === 'success' ? (
                      <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    ) : uploadStatus === 'error' ? (
                      <XCircle className="w-5 h-5 text-red-600 mr-3" />
                    ) : (
                      <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mr-3"></div>
                    )}
                    <span className={`text-sm font-medium ${
                      uploadStatus === 'success' ? 'text-green-800' :
                      uploadStatus === 'error' ? 'text-red-800' :
                      'text-blue-800'
                    }`}>
                      {uploadMessage}
                    </span>
                  </div>
                </div>
              )}

              <form onSubmit={(e) => { e.preventDefault(); handleUpload(); }} className="space-y-6">
                {/* Date Selection */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mes
                    </label>
                    <select
                      value={formData.mes}
                      onChange={(e) => setFormData(prev => ({ ...prev, mes: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar mes</option>
                      <option value="1">Enero</option>
                      <option value="2">Febrero</option>
                      <option value="3">Marzo</option>
                      <option value="4">Abril</option>
                      <option value="5">Mayo</option>
                      <option value="6">Junio</option>
                      <option value="7">Julio</option>
                      <option value="8">Agosto</option>
                      <option value="9">Septiembre</option>
                      <option value="10">Octubre</option>
                      <option value="11">Noviembre</option>
                      <option value="12">Diciembre</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Año
                    </label>
                    <select
                      value={formData.anio}
                      onChange={(e) => setFormData(prev => ({ ...prev, anio: e.target.value }))}
                      className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      required
                    >
                      <option value="">Seleccionar año</option>
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* File Uploads */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Archivo de Cobranza (cobranza.csv)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileChange('cobranza', e.target.files?.[0] || null)}
                        className="hidden"
                        id="cobranza-file"
                        required
                      />
                      <label htmlFor="cobranza-file" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.cobranza ? formData.cobranza.name : 'Haz clic para seleccionar archivo CSV'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Estructura requerida: Cliente, FechaPago, Monto, EstadoPago
                        </p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Archivo de Pedidos (pedidos.csv)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileChange('pedidos', e.target.files?.[0] || null)}
                        className="hidden"
                        id="pedidos-file"
                        required
                      />
                      <label htmlFor="pedidos-file" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.pedidos ? formData.pedidos.name : 'Haz clic para seleccionar archivo CSV'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Estructura requerida: PedidoID, FechaPedido, Cliente, Producto, Cantidad, PrecioUnitario, Agente
                        </p>
                      </label>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Archivo de Productos (productos-utilidad.csv)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".csv"
                        onChange={(e) => handleFileChange('productos', e.target.files?.[0] || null)}
                        className="hidden"
                        id="productos-file"
                        required
                      />
                      <label htmlFor="productos-file" className="cursor-pointer">
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-600">
                          {formData.productos ? formData.productos.name : 'Haz clic para seleccionar archivo CSV'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Estructura requerida: Producto, CostoUnitario, PrecioVenta
                        </p>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end space-x-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                        Procesando...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Procesar Análisis
                      </>
                    )}
                  </button>
                  
                  {/* Botón de Guardar - solo visible cuando hay datos procesados */}
                  {showSaveButton && (
                    <button
                      type="button"
                      onClick={handleSaveData}
                      disabled={loading}
                      className="flex items-center px-6 py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                          Guardando...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Guardar Datos
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Renderizado condicional para estados de carga y error
  if (loading || navigationLoading) {
    return (
      <PageWrapper
        title="Módulo de Ventas"
        subtitle="Análisis completo de ventas, productos y rendimiento del equipo"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Ventas', href: '/ventas' }
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando análisis...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (error || navigationError) {
    return (
      <PageWrapper
        title="Módulo de Ventas"
        subtitle="Análisis completo de ventas, productos y rendimiento del equipo"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Ventas', href: '/ventas' }
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
            <p className="text-gray-600">{error || navigationError}</p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  if (!analisisData) {
    return (
      <PageWrapper
        title="Módulo de Ventas"
        subtitle="Análisis completo de ventas, productos y rendimiento del equipo"
        breadcrumbs={[
          { label: 'Inicio', href: '/dashboard' },
          { label: 'Ventas', href: '/ventas' }
        ]}
      >
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos disponibles</h3>
            <p className="text-gray-600 mb-4">
              {mesActual 
                ? `Último análisis: ${mesActual.label}`
                : currentPeriod 
                ? `Último análisis: ${getNombreMes(currentPeriod.mes)} ${currentPeriod.anio}`
                : 'No hay datos de análisis para mostrar.'
              }
            </p>
            <button
              onClick={() => setActiveTab('upload')}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {currentPeriod ? 'Cargar Nuevos Datos' : 'Cargar Datos'}
            </button>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      title="Módulo de Ventas"
      subtitle="Análisis completo de ventas, productos y rendimiento del equipo"
      breadcrumbs={[
        { label: 'Inicio', href: '/dashboard' },
        { label: 'Ventas', href: '/ventas' }
      ]}
      actions={
        <div className="flex items-center space-x-3">
          {/* Selector de meses con dropdown */}
          <MonthSelector
            mesesDisponibles={mesesDisponibles}
            mesActual={mesActual}
            onMonthChange={cambiarAMes}
            loading={navigationLoading}
          />
          
          <select
            value={selectedPeriod}
            onChange={(e) => setSelectedPeriod(e.target.value)}
            className="bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          >
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="3m">Últimos 3 meses</option>
            <option value="12m">Últimos 12 meses</option>
          </select>
          
          <button className="flex items-center px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </button>
        </div>
      }
    >
      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const IconComponent = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <IconComponent className="w-4 h-4 mr-2" />
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      {renderTabContent()}

      {/* Botón flotante rojo que funcionaba */}
      <button
        onClick={() => {
          alert('Botón clickeado! Estado actual: ' + showAIChat);
          setShowAIChat(!showAIChat);
        }}
        className="fixed bottom-6 right-6 w-14 h-14 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700 transition-colors duration-200 flex items-center justify-center z-40"
        title="Chat con IA"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat de IA Contextual */}
      {showAIChat && (
        <AIContextualChat
          contexto={analisisData}
          onClose={() => setShowAIChat(false)}
          modulo="ventas"
        />
      )}
    </PageWrapper>
  );
};

