import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, Clock, Activity, ShieldCheck, HeartPulse } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();
  const isClinic = user?.role === 'CLINIC';

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-30 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Marca Médica */}
        <div className="flex items-center space-x-3.5">
          <div
            className={`p-2.5 rounded-2xl shadow-sm text-white ${
              isClinic
                ? 'bg-gradient-to-tr from-blue-700 to-indigo-600'
                : 'bg-gradient-to-tr from-emerald-600 to-teal-700'
            }`}
          >
            {isClinic ? (
              <Activity className="w-6 h-6" aria-hidden="true" />
            ) : (
              <HeartPulse className="w-6 h-6" aria-hidden="true" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-slate-900 text-xl tracking-tight">MedVida</span>
              <span
                className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full ${
                  isClinic
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {isClinic ? 'Portal Clínica' : 'ePaciente'}
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 font-medium mt-0.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Horário de Brasília (UTC-3)</span>
            </p>
          </div>
        </div>

        {/* Informações do Usuário e Logout */}
        <div className="flex items-center space-x-4">
          <div className="text-right hidden sm:block">
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-sm font-bold text-slate-900">{user?.name}</span>
              <ShieldCheck className="w-4 h-4 text-blue-600" aria-hidden="true" />
            </div>
            <p className="text-xs text-slate-400 font-medium">{user?.email}</p>
          </div>

          <button
            onClick={logout}
            className="flex items-center gap-1.5 text-xs font-bold px-3.5 py-2.5 text-slate-700 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 border border-slate-200 rounded-xl transition duration-150"
            title="Sair do sistema"
          >
            <LogOut className="w-4 h-4" />
            <span>Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
