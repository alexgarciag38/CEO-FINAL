import React from 'react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AppRouter } from './routes/AppRouter';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}

export default App;