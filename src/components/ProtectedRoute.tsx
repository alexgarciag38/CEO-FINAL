import React, { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { logAccessAttempt } from '@/utils/validation';

interface ProtectedRouteProps {
  children: ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo = '/login',
  allowedRoles = []
}) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // If authentication is required but user is not logged in
  if (requireAuth && !user) {
    // Log access attempt
    logAccessAttempt({
      route: location.pathname,
      allowedRoles,
      currentUser: null,
      success: false,
      reason: 'Usuario no autenticado'
    });

    // Save the attempted location for redirect after login
    return (
      <Navigate 
        to={redirectTo} 
        state={{ from: location.pathname }} 
        replace 
      />
    );
  }

  // If user is logged in but trying to access auth pages (login, register)
  if (!requireAuth && user) {
    // Log successful access to auth pages (should redirect)
    logAccessAttempt({
      route: location.pathname,
      allowedRoles: [],
      currentUser: user.email,
      success: true,
      reason: 'Usuario autenticado accediendo a página de auth - redirigiendo'
    });

    // Redirect authenticated users away from auth pages
    const from = location.state?.from || '/dashboard';
    return <Navigate to={from} replace />;
  }

  // ENHANCED ROLE-BASED ACCESS CONTROL
  // This validation happens on the frontend but should be reinforced on the backend/Edge Functions
  // for complete security. Never trust frontend-only validation.
  if (requireAuth && user) {
    const userRole = user.role;
    
    // BLOCK 1: Users without role (null/undefined) are not authorized
    if (!userRole) {
      const timestamp = new Date().toISOString();
      logAccessAttempt({
        route: location.pathname,
        allowedRoles,
        currentUser: user.email,
        success: false,
        reason: `Usuario sin rol asignado - Acceso bloqueado`
      });

      console.warn(`[ACCESS DENIED] Ruta: ${location.pathname} - Rol requerido: ${allowedRoles.join(', ')} - Rol usuario: N/A (sin rol) - Fecha: ${timestamp}`);

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600 mb-4">
              Su cuenta no tiene permisos asignados.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Contacte al administrador para asignar permisos.
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      );
    }

    // BLOCK 2: Role validation when allowedRoles is specified
    if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
      const timestamp = new Date().toISOString();
      logAccessAttempt({
        route: location.pathname,
        allowedRoles,
        currentUser: user.email,
        success: false,
        reason: `Rol insuficiente. Requerido: ${allowedRoles.join(', ')}, Actual: ${userRole}`
      });

      console.warn(`[ACCESS DENIED] Ruta: ${location.pathname} - Rol requerido: ${allowedRoles.join(', ')} - Rol usuario: ${userRole} - Fecha: ${timestamp}`);

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg 
                className="w-8 h-8 text-red-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" 
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Acceso Denegado
            </h2>
            <p className="text-gray-600 mb-4">
              No tiene permisos para acceder a esta sección.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Rol requerido: {allowedRoles.join(', ')}
              <br />
              Su rol actual: {userRole}
            </p>
            <button
              onClick={() => window.history.back()}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
            >
              Volver
            </button>
          </div>
        </div>
      );
    }
  }

  // If all checks pass, render the protected content
  // Log successful access for protected routes
  if (requireAuth && user) {
    logAccessAttempt({
      route: location.pathname,
      allowedRoles,
      currentUser: user.email,
      success: true,
      reason: 'Acceso autorizado'
    });
  }

  // SECURITY NOTE: This frontend validation is a first line of defense.
  // For complete security, implement equivalent role validation in:
  // - Backend API endpoints
  // - Supabase Row Level Security (RLS) policies
  // - Edge Functions for sensitive operations
  // - Database triggers for critical data access
  return <>{children}</>;
};

// Higher-order component for easier usage
export const withAuth = <P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<ProtectedRouteProps, 'children'> = {}
) => {
  return (props: P) => (
    <ProtectedRoute {...options}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

// Specific route guards for common use cases
export const AdminRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'super_admin']}>
    {children}
  </ProtectedRoute>
);

export const ManagerRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute allowedRoles={['admin', 'super_admin', 'manager']}>
    {children}
  </ProtectedRoute>
);

export const PublicRoute: React.FC<{ children: ReactNode }> = ({ children }) => (
  <ProtectedRoute requireAuth={false}>
    {children}
  </ProtectedRoute>
);

