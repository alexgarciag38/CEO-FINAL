import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  TrendingUp, 
  DollarSign, 
  Users, 
  Target, 
  PieChart,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  Building2,
  Folder,
  ClipboardList,
  Wrench,
  Building,
  FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCompany } from '@/contexts/CompanyContext';
import { NavItem } from '@/types';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  className?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  isCollapsed, 
  onToggle, 
  className = '' 
}) => {
  const location = useLocation();
  const { user, signOut } = useAuth();
  const { companyId, setCompanyId } = useCompany();
  const [isLoading, setIsLoading] = useState(false);

  // Navigation items configuration
  const navigationItems: NavItem[] = [
    {
      id: 'dashboard',
      title: 'Dashboard',
      path: '/dashboard',
      icon: 'LayoutDashboard'
    },
    {
      id: 'ventas',
      title: 'Ventas',
      path: '/ventas',
      icon: 'TrendingUp'
    },
    {
      id: 'simulador-defi',
      title: 'Simulador DeFi',
      path: '/simulador/defi',
      icon: 'PieChart'
    },
    {
      id: 'catalogo',
      title: 'Mi Catálogo',
      path: '/catalogo',
      icon: 'Folder'
    },
    {
      id: 'incidencias',
      title: 'Incidencias',
      path: '/incidencias',
      icon: 'ClipboardList'
    },
    {
      id: 'lean',
      title: 'Herramientas Lean',
      path: '/lean',
      icon: 'Wrench'
    },
    {
      id: 'finanzas',
      title: 'Finanzas',
      path: '/finanzas',
      icon: 'DollarSign'
    },
    {
      id: 'financiero',
      title: 'Financiero',
      path: '/financiero',
      icon: 'DollarSign'
    },
    {
      id: 'marketing',
      title: 'Marketing',
      path: '/marketing',
      icon: 'Target'
    },
    {
      id: 'crm',
      title: 'CRM',
      path: '/crm',
      icon: 'Users'
    },
    {
      id: 'rrhh',
      title: 'RRHH',
      path: '/rrhh',
      icon: 'Building2'
    },
    {
      id: 'estrategico',
      title: 'Estratégico',
      path: '/estrategico',
      icon: 'BarChart3'
    }
  ];

  // Icon mapping
  const iconMap = {
    LayoutDashboard,
    TrendingUp,
    DollarSign,
    Target,
    Users,
    Building2,
    BarChart3,
    PieChart,
    Settings,
    Folder,
    ClipboardList,
    Wrench,
    FileText
  } as const;

  const handleSignOut = async () => {
    try {
      setIsLoading(true);
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isActiveRoute = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <div className={`bg-slate-800 text-slate-100 border-r border-slate-700 flex flex-col h-full transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    } ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <PieChart className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-100">CEO Final</h1>
              <p className="text-xs text-slate-300">Dashboard Ejecutivo</p>
            </div>
          </div>
        )}
        
        <button
          onClick={onToggle}
          className="p-1.5 rounded-md hover:bg-slate-700 transition-colors duration-200"
          title={isCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4 text-slate-100" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-slate-100" />
          )}
        </button>
      </div>

      {/* User Info */}
      {!isCollapsed && user && (
        <div className="p-4 border-b border-slate-700">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-100 truncate">
                {user.name || 'Usuario'}
              </p>
              <p className="text-xs text-slate-300 truncate">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const IconComponent = iconMap[item.icon as keyof typeof iconMap];
          const isActive = isActiveRoute(item.path);
          
          return (
            <div key={item.id}>
              <Link
                to={item.path}
                className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200 hover:bg-slate-700 hover:text-slate-200 ${
                  isActive ? 'bg-blue-600 text-white' : ''
                } ${isCollapsed ? 'justify-center px-2' : ''}`}
                title={isCollapsed ? item.title : undefined}
              >
                <IconComponent className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
                {!isCollapsed && (
                  <span className="font-medium">{item.title}</span>
                )}
                {!isCollapsed && isActive && (
                  <div className="ml-auto w-2 h-2 bg-sidebar-primary-foreground rounded-full" />
                )}
              </Link>
              {/* Company selector only under Incidencias */}
              {!isCollapsed && item.id === 'incidencias' && (
                <div className="mt-2 ml-2">
                  <div className="text-[11px] text-slate-400 mb-1">Empresa</div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCompanyId('4C')}
                      className={`px-2 py-1 rounded text-xs border ${companyId==='4C' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'}`}
                    >4C</button>
                    <button
                      onClick={() => setCompanyId('MANUCAR')}
                      className={`px-2 py-1 rounded text-xs border ${companyId==='MANUCAR' ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-700 text-slate-200 border-slate-600 hover:bg-slate-600'}`}
                    >MANUCAR</button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-slate-700 space-y-2">
        {/* Settings */}
        <Link
          to="/settings"
          className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200 hover:bg-slate-700 hover:text-slate-200 ${
            isActiveRoute('/settings') ? 'bg-blue-600 text-white' : ''
          } ${isCollapsed ? 'justify-center px-2' : ''}`}
          title={isCollapsed ? 'Configuración' : undefined}
        >
          <Settings className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && <span className="font-medium">Configuración</span>}
        </Link>

        {/* Sign Out */}
        <button
          onClick={handleSignOut}
          disabled={isLoading}
          className={`w-full flex items-center px-3 py-2 text-sm rounded-md transition-colors duration-200 text-red-400 hover:text-red-300 hover:bg-red-500/10 ${
            isCollapsed ? 'justify-center px-2' : ''
          } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          title={isCollapsed ? 'Cerrar sesión' : undefined}
        >
          <LogOut className={`w-5 h-5 ${isCollapsed ? '' : 'mr-3'}`} />
          {!isCollapsed && (
            <span className="font-medium">
              {isLoading ? 'Cerrando...' : 'Cerrar Sesión'}
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export const MobileSidebar: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40 lg:hidden"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 left-0 z-50 w-64 lg:hidden">
        <Sidebar 
          isCollapsed={false} 
          onToggle={onClose}
          className="h-full"
        />
      </div>
    </>
  );
};

export const SidebarToggle: React.FC<{
  onClick: () => void;
  className?: string;
}> = ({ onClick, className = '' }) => {
  return (
    <button
      onClick={onClick}
      className={`p-2 rounded-md hover:bg-gray-100 transition-colors duration-200 lg:hidden ${className}`}
      title="Abrir menú"
    >
      <Menu className="w-6 h-6" />
    </button>
  );
};

