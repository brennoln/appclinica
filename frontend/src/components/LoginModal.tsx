import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserCheck, Shield, Lock, Stethoscope, HeartPulse, Sparkles } from 'lucide-react';

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
    <div className="min-h-screen bg-slate-100/60 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden">
        {/* Banner Superior com Identidade Médica */}
        <div className="bg-gradient-to-br from-blue-700 via-indigo-700 to-teal-800 p-8 text-white text-center relative overflow-hidden">
          <div className="inline-flex p-3.5 bg-white/10 backdrop-blur-md rounded-2xl mb-3 shadow-inner">
            <HeartPulse className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">MedVida Saúde</h1>
          <p className="text-blue-100 text-xs font-medium mt-1">
            Plataforma Digital de Agendamentos e Laudos Médicos
          </p>
        </div>

        <div className="p-7">
          {/* Acesso Rápido para Avaliação */}
          <div className="mb-6">
            <div className="flex items-center gap-1.5 mb-2.5">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Acesso Demonstrativo Rápido (1 Clique):
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => handleQuickLogin('clinica@demo.com')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-blue-200 bg-blue-50/50 hover:bg-blue-100/70 hover:border-blue-300 transition text-blue-950 group"
              >
                <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                  <Shield className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Clínica</span>
                <span className="text-[10px] text-slate-500 font-medium">Maria</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('carlos@demo.com')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/70 hover:border-emerald-300 transition text-emerald-950 group"
              >
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Paciente 1</span>
                <span className="text-[10px] text-slate-500 font-medium">Carlos</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('juliana@demo.com')}
                className="flex flex-col items-center justify-center p-3 rounded-2xl border border-teal-200 bg-teal-50/50 hover:bg-teal-100/70 hover:border-teal-300 transition text-teal-950 group"
              >
                <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-1.5 shadow-sm group-hover:scale-105 transition-transform">
                  <UserCheck className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold">Paciente 2</span>
                <span className="text-[10px] text-slate-500 font-medium">Juliana</span>
              </button>
            </div>
          </div>

          <div className="relative flex py-2 items-center mb-5">
            <div className="flex-grow border-t border-slate-200"></div>
            <span className="flex-shrink mx-3 text-[11px] font-bold text-slate-400 uppercase tracking-wider">ou acesse com e-mail</span>
            <div className="flex-grow border-t border-slate-200"></div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">E-mail</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm font-medium outline-none transition"
                placeholder="seu.email@exemplo.com"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Senha</label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-slate-900 text-sm font-medium outline-none transition"
                  placeholder="••••••"
                />
                <Lock className="w-4 h-4 text-slate-400 absolute right-3.5 top-3.5 pointer-events-none" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">Senha padrão demo: 123456</p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md shadow-blue-500/20 transition duration-150 text-sm"
            >
              {loading ? 'Entrando com segurança...' : 'Entrar no Sistema'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
