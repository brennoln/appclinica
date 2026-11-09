import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LoginModal } from './components/LoginModal';
import { Header } from './components/Header';
import { ClinicDashboard } from './components/ClinicDashboard';
import { PatientDashboard } from './components/PatientDashboard';
import { Toaster } from 'sonner';

const MainApp: React.FC = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="min-h-screen flex items-center justify-center bg-slate-100 text-slate-600 font-semibold text-sm"
      >
        Iniciando sistema com segurança...
      </div>
    );
  }

  if (!user) {
    return <LoginModal />;
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 antialiased flex flex-col">
      <Header />
      <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {user.role === 'CLINIC' ? <ClinicDashboard /> : <PatientDashboard />}
      </main>
    </div>
  );
};

export function App() {
  return (
    <AuthProvider>
      <Toaster position="top-right" richColors closeButton />
      <MainApp />
    </AuthProvider>
  );
}

export default App;
