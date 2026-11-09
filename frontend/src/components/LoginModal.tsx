import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Shield, Lock, Stethoscope } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-8 text-white text-center">
          <div className="inline-flex p-3 bg-white/10 rounded-full mb-3 backdrop-blur-sm">
            <Stethoscope className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold">Portal Clínica & Laudos</h1>
          <p className="text-blue-100 text-sm mt-1">
            Sistema de Agendamento e Acesso a Resultados
          </p>
        </div>

        <div className="p-8">
          <div className="mb-6">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
              Acesso Rápido para Avaliação (Demo):
            </p>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('clinica@demo.com')}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 transition-colors text-blue-900 group"
              >
                <Shield className="w-5 h-5 text-blue-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Clínica</span>
                <span className="text-[10px] text-slate-500">Maria</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('carlos@demo.com')}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 transition-colors text-emerald-900 group"
              >
                <UserCheck className="w-5 h-5 text-emerald-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Paciente 1</span>
                <span className="text-[10px] text-slate-500">Carlos</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('juliana@demo.com')}
                className="flex flex-col items-center justify-center p-2.5 rounded-lg border border-purple-200 bg-purple-50/50 hover:bg-purple-100/70 transition-colors text-purple-900 group"
              >
                <UserCheck className="w-5 h-5 text-purple-600 mb-1 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-bold">Paciente 2</span>
                <span className="text-[10px] text-slate-500">Juliana</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-4 text-xs font-medium text-slate-400">ou entre com e-mail</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm outline-none transition"
                placeholder="seu.email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Senha</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm outline-none transition"
                  placeholder="••••••"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1">Senha padrão demo: 123456</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-lg shadow-sm transition duration-150 ease-in-out text-sm"
            >
              {loading ? 'Entrando...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
