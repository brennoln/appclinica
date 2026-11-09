import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Shield, UserCheck, Lock, Activity, HeartPulse } from 'lucide-react';

export const LoginModal: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('clinica@demo.com');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setEmail(demoEmail);
    setError(null);
    setLoading(true);
    try {
      await login(demoEmail, '123456');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao realizar login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-sm w-full bg-white rounded-lg shadow-xs border border-slate-200 overflow-hidden">
        {/* Cabeçalho do Card */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2 mb-1.5">
            <div className="p-1.5 rounded bg-blue-600 text-white">
              <Activity className="w-4 h-4" />
            </div>
            <span className="font-bold text-slate-900 text-base tracking-tight">MedVida</span>
          </div>
          <h1 className="text-sm font-semibold text-slate-800">Acesso ao Sistema</h1>
          <p className="text-xs text-slate-500 mt-0.5">Gestão de agendamentos e laudos médicos</p>
        </div>

        <div className="p-5 space-y-4">
          {/* Acesso Rápido */}
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Acesso Rápido (Demonstração):
            </p>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('clinica@demo.com')}
                className="flex flex-col items-center justify-center p-2 rounded border border-blue-200 bg-blue-50/60 hover:bg-blue-100/70 transition text-blue-900 group"
              >
                <Shield className="w-4 h-4 text-blue-600 mb-1 group-hover:scale-105 transition-transform" />
                <span className="text-[11px] font-bold">Clínica</span>
                <span className="text-[9px] text-blue-700/70">Maria</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('carlos@demo.com')}
                className="flex flex-col items-center justify-center p-2 rounded border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 transition text-emerald-900 group"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-105 transition-transform" />
                <span className="text-[11px] font-bold">Paciente 1</span>
                <span className="text-[9px] text-emerald-700/70">Carlos</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('juliana@demo.com')}
                className="flex flex-col items-center justify-center p-2 rounded border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/70 transition text-emerald-900 group"
              >
                <UserCheck className="w-4 h-4 text-emerald-600 mb-1 group-hover:scale-105 transition-transform" />
                <span className="text-[11px] font-bold">Paciente 2</span>
                <span className="text-[9px] text-emerald-700/70">Juliana</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-2 text-[10px] font-bold text-slate-400 uppercase">ou e-mail</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {error && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                placeholder="nome@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
                  placeholder="••••••"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded text-xs transition duration-150"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
