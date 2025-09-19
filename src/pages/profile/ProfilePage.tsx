import React from 'react';
import { PageWrapper } from '@/components/layout/MainLayout';
import { User } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  return (
    <PageWrapper
      title="Mi Perfil"
      subtitle="Información personal y configuración de cuenta"
      breadcrumbs={[
        { label: 'Inicio', href: '/dashboard' },
        { label: 'Mi Perfil' }
      ]}
    >
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <User className="w-16 h-16 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Mi Perfil
        </h3>
        <p className="text-gray-600 mb-4">
          Gestione su información personal y configuración de cuenta.
        </p>
        <p className="text-sm text-gray-500">
          Funcionalidad completa disponible próximamente
        </p>
      </div>
    </PageWrapper>
  );
};

