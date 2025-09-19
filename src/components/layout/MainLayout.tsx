import React, { useState, ReactNode } from 'react';
import { Sidebar, MobileSidebar } from './Sidebar';
import { Header } from './Header';
import { Footer } from './Footer';
import { ErrorBoundary } from '@/components/ErrorBoundary';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ 
  children, 
  className = '' 
}) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(!isSidebarCollapsed);
  };

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const closeMobileSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex ${className}`}>
      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <Sidebar 
          isCollapsed={isSidebarCollapsed}
          onToggle={toggleSidebar}
          className="h-screen sticky top-0"
        />
      </div>

      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={isMobileSidebarOpen}
        onClose={closeMobileSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <Header onSidebarToggle={toggleMobileSidebar} />

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <ErrorBoundary>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              {children}
            </div>
          </ErrorBoundary>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

// Layout variants for different page types
export const DashboardLayout: React.FC<MainLayoutProps> = ({ children, className }) => (
  <MainLayout className={`dashboard-layout ${className}`}>
    {children}
  </MainLayout>
);

export const FullWidthLayout: React.FC<MainLayoutProps> = ({ children, className }) => (
  <MainLayout className={`full-width-layout ${className}`}>
    <div className="max-w-none px-0">
      {children}
    </div>
  </MainLayout>
);

// Page wrapper with breadcrumbs and title
interface PageWrapperProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const PageWrapper: React.FC<PageWrapperProps> = ({
  title,
  subtitle,
  breadcrumbs,
  actions,
  children,
  className = ''
}) => {
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        {/* Breadcrumbs */}
        {breadcrumbs && breadcrumbs.length > 0 && (
          <nav className="mb-4">
            <ol className="flex items-center space-x-2 text-sm text-gray-600">
              {breadcrumbs.map((crumb, index) => (
                <li key={index} className="flex items-center">
                  {index > 0 && (
                    <span className="mx-2 text-gray-400">/</span>
                  )}
                  {crumb.href ? (
                    <a 
                      href={crumb.href}
                      className="hover:text-blue-600 transition-colors duration-200"
                    >
                      {crumb.label}
                    </a>
                  ) : (
                    <span className="text-gray-900 font-medium">{crumb.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}

        {/* Title and Actions */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-1 text-gray-600">{subtitle}</p>
            )}
          </div>
          
          {actions && (
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
};

// Loading layout for async operations
export const LoadingLayout: React.FC<{ message?: string }> = ({ 
  message = 'Cargando...' 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

// Error layout for error states
export const ErrorLayout: React.FC<{ 
  title?: string;
  message?: string;
  onRetry?: () => void;
}> = ({ 
  title = 'Error',
  message = 'Ha ocurrido un error inesperado',
  onRetry
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center max-w-md">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 px-4 py-2 rounded-md font-medium"
        >
          Intentar nuevamente
        </button>
      )}
    </div>
  </div>
);

