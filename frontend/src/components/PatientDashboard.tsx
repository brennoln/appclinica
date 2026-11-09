import React, { useState } from 'react';
import { Appointment, EXAM_LABELS } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../hooks/useAppointments';
import { ReportModal } from './ReportModal';
import {
  Calendar,
  FileText,
  Clock,
  AlertCircle,
  RefreshCw,
  User,
  HeartPulse,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { appointments, loading, refetch } = useAppointments();
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState<Appointment | null>(null);

  // Próximo agendamento ativo
  const now = new Date();
  const nextAppointment = appointments.find(
    (a) => a.status === 'SCHEDULED' && new Date(a.dateTime).getTime() >= now.getTime()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Card Principal de Perfil (Inspirado no app ePaciente) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 text-center sm:text-left">
          {/* Avatar Moderno */}
          <div className="relative">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-teal-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-black shadow-md shadow-emerald-500/20">
              {user?.name.charAt(0)}
            </div>
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-white w-5 h-5 rounded-full flex items-center justify-center">
              <ShieldCheck className="w-3 h-3 text-white" />
            </div>
          </div>

          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-[11px] font-bold tracking-wide uppercase mb-1 border border-emerald-100">
              <Sparkles className="w-3 h-3 text-emerald-600" />
              <span>Portal ePaciente</span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{user?.name}</h1>
            <p className="text-xs text-slate-500 font-medium">{user?.email}</p>
          </div>

          <button
            onClick={() => refetch()}
            aria-label="Atualizar meus exames"
            className="p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-2xl transition"
            title="Atualizar dados"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Card Destaque: Próximo Horário (Estilo Moderno de Saúde) */}
        <div className="mt-6 bg-gradient-to-br from-emerald-600 to-teal-700 text-white p-6 rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-emerald-100 text-xs font-bold uppercase tracking-wider mb-1">
              <Calendar className="w-4 h-4" />
              <span>Próximo Horário Agendado</span>
            </div>

            {nextAppointment ? (
              <div>
                <h2 className="text-lg font-bold text-white">
                  {EXAM_LABELS[nextAppointment.examType] || nextAppointment.examType}
                </h2>
                <p className="text-xs text-emerald-100 flex items-center gap-1.5 mt-1 font-medium">
                  <Clock className="w-3.5 h-3.5" />
                  {new Date(nextAppointment.dateTime).toLocaleDateString('pt-BR', {
                    timeZone: 'America/Sao_Paulo',
                  })}{' '}
                  às{' '}
                  <strong className="text-white">
                    {new Date(nextAppointment.dateTime).toLocaleTimeString('pt-BR', {
                      hour: '2-digit',
                      minute: '2-digit',
                      timeZone: 'America/Sao_Paulo',
                    })}
                  </strong>{' '}
                  (Horário de Brasília)
                </p>
              </div>
            ) : (
              <div>
                <p className="text-sm font-semibold text-white">Não possui horário futuro agendado</p>
                <p className="text-xs text-emerald-100 mt-0.5">Entre em contato com a clínica para novas marcações</p>
              </div>
            )}
          </div>

          {nextAppointment && (
            <span className="self-start sm:self-center px-3.5 py-1.5 bg-white/20 backdrop-blur-md rounded-xl text-xs font-bold text-white border border-white/20">
              Confirmado
            </span>
          )}
        </div>
      </section>

      {/* Histórico de Exames & Laudos */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <HeartPulse className="w-5 h-5 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900">Histórico de Exames ({appointments.length})</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Sigilo médico garantido</span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm animate-pulse">
            Buscando seus exames no sistema...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            Nenhum registro de exame localizado para este perfil.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((appt) => {
              const dateObj = new Date(appt.dateTime);
              const isCancelled = appt.status === 'CANCELLED';
              const hasPublishedReport = appt.report && appt.report.status === 'PUBLISHED';

              const timeFormatted = dateObj.toLocaleTimeString('pt-BR', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: 'America/Sao_Paulo',
              });
              const dateFormatted = dateObj.toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                timeZone: 'America/Sao_Paulo',
              });

              return (
                <div
                  key={appt.id}
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <h3 className="font-bold text-slate-900 text-sm">
                        {EXAM_LABELS[appt.examType] || appt.examType}
                      </h3>
                      {isCancelled ? (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-700">
                          Cancelado
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Agendado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {dateFormatted} às <strong className="text-slate-800">{timeFormatted}</strong>
                      </span>
                      <span>• Sala Principal de Exames</span>
                    </div>
                  </div>

                  <div>
                    {hasPublishedReport ? (
                      <button
                        onClick={() => setSelectedAppointmentForReport(appt)}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Abrir Laudo Oficial</span>
                      </button>
                    ) : isCancelled ? (
                      <span className="text-xs text-slate-400 font-medium italic">Horário cancelado</span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 text-slate-500 text-xs font-semibold rounded-xl border border-slate-100">
                        <AlertCircle className="w-4 h-4 text-slate-400" />
                        <span>Laudo em elaboração clínica</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Visualização de Laudo */}
      {selectedAppointmentForReport && (
        <ReportModal
          appointment={selectedAppointmentForReport}
          isClinic={false}
          onClose={() => setSelectedAppointmentForReport(null)}
          onSaved={() => {}}
        />
      )}
    </div>
  );
};
