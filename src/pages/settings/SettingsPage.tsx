import React, { useState } from 'react';
import { PageWrapper } from '@/components/layout/MainLayout';
import { CSVUploader } from '@/components/csv/CSVUploader';
import {
  Settings,
  Upload,
  Database,
  Shield,
  Bell,
  User,
  Download,
  Trash2,
  RefreshCw,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'data' | 'security' | 'notifications'>('general');
  const [uploadedDatasets, setUploadedDatasets] = useState<any[]>([]);
  const [showApiKey, setShowApiKey] = useState(false);
  
  // Mock settings state
  const [settings, setSettings] = useState({
    general: {
      companyName: 'CEO Final Dashboard',
      timezone: 'Europe/Madrid',
      language: 'es',
      currency: 'EUR',
      dateFormat: 'DD/MM/YYYY'
    },
    security: {
      twoFactorEnabled: false,
      sessionTimeout: 30,
      apiKey: 'sk-1234567890abcdef...',
      lastPasswordChange: '2024-01-15'
    },
    notifications: {
      emailAlerts: true,
      pushNotifications: false,
      weeklyReports: true,
      systemUpdates: true,
      marketingEmails: false
    }
  });

  const tabs = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'data', label: 'Datos', icon: Database },
    { id: 'security', label: 'Seguridad', icon: Shield },
    { id: 'notifications', label: 'Notificaciones', icon: Bell }
  ];

  const handleCSVProcessed = (data: any[], headers: string[]) => {
    const newDataset = {
      id: Date.now(),
      name: `Dataset ${uploadedDatasets.length + 1}`,
      uploadDate: new Date().toISOString(),
      rows: data.length,
      columns: headers.length,
      headers,
      data: data.slice(0, 100) // Store only first 100 rows for preview
    };
    
    setUploadedDatasets(prev => [...prev, newDataset]);
  };

  const deleteDataset = (id: number) => {
    setUploadedDatasets(prev => prev.filter(dataset => dataset.id !== id));
  };

  const updateSetting = (category: string, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [key]: value
      }
    }));
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración General</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    value={settings.general.companyName}
                    onChange={(e) => updateSetting('general', 'companyName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Zona Horaria
                  </label>
                  <select
                    value={settings.general.timezone}
                    onChange={(e) => updateSetting('general', 'timezone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="Europe/Madrid">Europa/Madrid</option>
                    <option value="Europe/London">Europa/Londres</option>
                    <option value="America/New_York">América/Nueva York</option>
                    <option value="Asia/Tokyo">Asia/Tokio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Idioma
                  </label>
                  <select
                    value={settings.general.language}
                    onChange={(e) => updateSetting('general', 'language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="es">Español</option>
                    <option value="en">English</option>
                    <option value="fr">Français</option>
                    <option value="de">Deutsch</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Moneda
                  </label>
                  <select
                    value={settings.general.currency}
                    onChange={(e) => updateSetting('general', 'currency', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="EUR">EUR (€)</option>
                    <option value="USD">USD ($)</option>
                    <option value="GBP">GBP (£)</option>
                    <option value="JPY">JPY (¥)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Formato de Fecha
                  </label>
                  <select
                    value={settings.general.dateFormat}
                    onChange={(e) => updateSetting('general', 'dateFormat', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Cambios
                </button>
              </div>
            </div>
          </div>
        );

      case 'data':
        return (
          <div className="space-y-6">
            {/* CSV Upload Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Cargar Datos CSV</h3>
                <Upload className="w-5 h-5 text-gray-400" />
              </div>
              <p className="text-gray-600 mb-6">
                Sube archivos CSV para integrar tus datos empresariales en el dashboard. 
                Los datos se procesarán y validarán automáticamente.
              </p>
              
              <CSVUploader
                onFileProcessed={handleCSVProcessed}
                maxFileSize={25}
                acceptedTypes={['.csv', '.xlsx', '.xls']}
              />
            </div>

            {/* Uploaded Datasets */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Datasets Cargados</h3>
              
              {uploadedDatasets.length === 0 ? (
                <div className="text-center py-8">
                  <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No hay datasets cargados aún</p>
                  <p className="text-sm text-gray-400">Sube un archivo CSV para empezar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {uploadedDatasets.map((dataset) => (
                    <div key={dataset.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{dataset.name}</h4>
                          <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                            <span>{dataset.rows} filas</span>
                            <span>{dataset.columns} columnas</span>
                            <span>Subido: {new Date(dataset.uploadDate).toLocaleDateString()}</span>
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {dataset.headers.slice(0, 5).map((header: string, index: number) => (
                              <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                                {header}
                              </span>
                            ))}
                            {dataset.headers.length > 5 && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-600">
                                +{dataset.headers.length - 5} más
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button className="p-2 text-gray-400 hover:text-blue-600">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-green-600">
                            <Download className="w-4 h-4" />
                          </button>
                          <button className="p-2 text-gray-400 hover:text-blue-600">
                            <RefreshCw className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteDataset(dataset.id)}
                            className="p-2 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Data Integration Options */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Opciones de Integración</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Sincronización Automática</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Configura la actualización automática de datos desde fuentes externas
                  </p>
                  <label className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Habilitar sincronización</span>
                  </label>
                </div>

                <div className="border border-gray-200 rounded-lg p-4">
                  <h4 className="font-medium text-gray-900 mb-2">Validación Estricta</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    Aplicar validaciones adicionales a los datos importados
                  </p>
                  <label className="flex items-center">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="ml-2 text-sm text-gray-700">Validación habilitada</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        );

      case 'security':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Configuración de Seguridad</h3>
              
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Autenticación de Dos Factores</h4>
                    <p className="text-sm text-gray-600">Añade una capa extra de seguridad a tu cuenta</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      checked={settings.security.twoFactorEnabled}
                      onChange={(e) => updateSetting('security', 'twoFactorEnabled', e.target.checked)}
                      className="sr-only peer" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tiempo de Sesión (minutos)
                  </label>
                  <select
                    value={settings.security.sessionTimeout}
                    onChange={(e) => updateSetting('security', 'sessionTimeout', parseInt(e.target.value))}
                    className="w-full max-w-xs px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={120}>2 horas</option>
                    <option value={480}>8 horas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Clave API
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type={showApiKey ? 'text' : 'password'}
                      value={settings.security.apiKey}
                      readOnly
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-600"
                    />
                    <button
                      onClick={() => setShowApiKey(!showApiKey)}
                      className="p-2 text-gray-400 hover:text-gray-600"
                    >
                      {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                    <button className="px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                      Regenerar
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Última actualización de contraseña: {settings.security.lastPasswordChange}
                  </p>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700">
                    <Shield className="w-4 h-4 mr-2" />
                    Cambiar Contraseña
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'notifications':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferencias de Notificaciones</h3>
              
              <div className="space-y-4">
                {Object.entries(settings.notifications).map(([key, value]) => {
                  const labels = {
                    emailAlerts: 'Alertas por Email',
                    pushNotifications: 'Notificaciones Push',
                    weeklyReports: 'Reportes Semanales',
                    systemUpdates: 'Actualizaciones del Sistema',
                    marketingEmails: 'Emails de Marketing'
                  };

                  const descriptions = {
                    emailAlerts: 'Recibe alertas importantes por correo electrónico',
                    pushNotifications: 'Notificaciones en tiempo real en el navegador',
                    weeklyReports: 'Resumen semanal de métricas y rendimiento',
                    systemUpdates: 'Notificaciones sobre actualizaciones y mantenimiento',
                    marketingEmails: 'Ofertas especiales y noticias del producto'
                  };

                  return (
                    <div key={key} className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {labels[key as keyof typeof labels]}
                        </h4>
                        <p className="text-sm text-gray-600">
                          {descriptions[key as keyof typeof descriptions]}
                        </p>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={value}
                          onChange={(e) => updateSetting('notifications', key, e.target.checked)}
                          className="sr-only peer" 
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700">
                  <Save className="w-4 h-4 mr-2" />
                  Guardar Preferencias
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <PageWrapper
      title="Configuración"
      subtitle="Gestiona las preferencias del sistema, datos y seguridad"
      breadcrumbs={[
        { label: 'Inicio', href: '/dashboard' },
        { label: 'Configuración', href: '/settings' }
      ]}
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
    </PageWrapper>
  );
};

