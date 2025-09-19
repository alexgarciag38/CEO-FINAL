import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { enableSignup } from '@/lib/supabase';
import { ProtectedRoute, PublicRoute } from '@/components/ProtectedRoute';
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Auth pages
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';

// Main layout
import { MainLayout } from '@/components/layout/MainLayout';

// Dashboard and module pages (will be created in next phases)
import { DashboardPage } from '@/pages/dashboard/DashboardPage';
import { VentasPage } from '@/pages/ventas/VentasPage';
import { FinancieroPage } from '@/pages/financiero/FinancieroPage';
import { MarketingPage } from '@/pages/marketing/MarketingPage';
import { CRMPage } from '@/pages/crm/CRMPage';
import { RRHHPage } from '@/pages/rrhh/RRHHPage';
import { EstrategicoPage } from '@/pages/estrategico/EstrategicoPage';

// Settings and profile pages
import { SettingsPage } from '@/pages/settings/SettingsPage';
import { ProfilePage } from '@/pages/profile/ProfilePage';

// Error pages
import { NotFoundPage } from '@/pages/error/NotFoundPage';
import DefiSimulatorPage from '@/pages/simulator/DefiSimulatorPage';
import GestionCatalogo from '@/pages/catalogo/GestionCatalogo';

export const AppRouter: React.FC = () => {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <Routes>
            {/* Public routes - Auth pages */}
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            {enableSignup && (
              <Route
                path="/register"
                element={
                  <PublicRoute>
                    <RegisterPage />
                  </PublicRoute>
                }
              />
            )}

            {/* Protected routes - Main application */}
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <Routes>
                      {/* Dashboard */}
                      <Route path="/dashboard" element={<DashboardPage />} />
                      
                      {/* Business modules */}
                      <Route path="/ventas" element={<VentasPage />} />
                      <Route path="/financiero" element={<FinancieroPage />} />
                      <Route path="/marketing" element={<MarketingPage />} />
                      <Route path="/crm" element={<CRMPage />} />
                      <Route path="/rrhh" element={<RRHHPage />} />
                      <Route path="/estrategico" element={<EstrategicoPage />} />
                      
                      {/* Settings and profile */}
                      <Route path="/settings" element={<SettingsPage />} />
                      <Route path="/profile" element={<ProfilePage />} />
                      <Route path="/simulador/defi" element={<DefiSimulatorPage />} />
                      <Route path="/catalogo" element={<GestionCatalogo />} />
                      
                      {/* Default redirect */}
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      
                      {/* 404 page */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </MainLayout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
};

