import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Clock, Activity, HeartPulse } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const isClinic = user?.role === 'CLINIC';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
        {/* Marca Médica */}
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 rounded bg-slate-900 text-white">
            {isClinic ? (
              <Activity className="w-4 h-4" aria-hidden="true" />
            ) : (
              <HeartPulse className="w-4 h-4" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm tracking-tight">MedVida</span>
              <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                {isClinic ? 'Clínica' : 'Paciente'}
              </span>
            </div>
          </div>
        </div>

        {/* Informações do Usuário e Logout */}
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <span className="text-xs font-semibold text-slate-900">{user?.name}</span>
            <span className="text-[11px] text-slate-400 ml-1.5">({user?.email})</span>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded transition"
            title="Sair do sistema"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-500" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
