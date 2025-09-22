import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppRouter } from './routes/AppRouter';
import './App.css';
import { CompanyProvider } from '@/contexts/CompanyContext';

function App() {
  return (
    <ErrorBoundary>
      <CompanyProvider>
        <AppRouter />
      </CompanyProvider>
    </ErrorBoundary>
  );
}

export default App;