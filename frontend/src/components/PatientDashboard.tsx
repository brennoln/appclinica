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
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { appointments, loading, refetch } = useAppointments();
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState<Appointment | null>(null);

  const now = new Date();
  const nextAppointment = appointments.find(
    (a) => a.status === 'SCHEDULED' && new Date(a.dateTime).getTime() >= now.getTime()
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Barra de Perfil e Próximo Horário Compacta */}
      <section className="bg-white rounded-lg p-5 border border-slate-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded bg-slate-900 text-white flex items-center justify-center font-bold text-sm">
              {user?.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900">{user?.name}</h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  Paciente
                </span>
              </div>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            aria-label="Atualizar exames"
            className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition"
            title="Atualizar dados"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Card Destaque: Próximo Horário Compacto */}
        <div className="mt-4 p-3.5 rounded bg-slate-50 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              <span>Próximo Exame Agendado</span>
            </div>

            {nextAppointment ? (
              <p className="text-xs text-slate-700">
                <strong className="font-semibold text-slate-900">{EXAM_LABELS[nextAppointment.examType] || nextAppointment.examType}</strong> em{' '}
                {new Date(nextAppointment.dateTime).toLocaleDateString('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                })}{' '}
                às{' '}
                <strong className="font-semibold text-slate-900">
                  {new Date(nextAppointment.dateTime).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Sao_Paulo',
                  })}
                </strong>
              </p>
            ) : (
              <p className="text-xs text-slate-500">Nenhum exame agendado para os próximos dias.</p>
            )}
          </div>

          {nextAppointment && (
            <span className="self-start sm:self-center px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
              Confirmado
            </span>
          )}
        </div>
      </section>

      {/* Histórico de Exames */}
      <section className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Meus Agendamentos ({appointments.length})
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">Acesso individual e confidencial</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Buscando seus exames...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Nenhum exame agendado para este paciente.
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
                  className="px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition"
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 text-xs">
                        {EXAM_LABELS[appt.examType] || appt.examType}
                      </span>
                      {isCancelled ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                          Cancelado
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Agendado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {dateFormatted} às <strong className="font-medium text-slate-700">{timeFormatted}</strong>
                      </span>
                      <span>• Sala Principal</span>
                    </div>
                  </div>

                  <div>
                    {hasPublishedReport ? (
                      <button
                        onClick={() => setSelectedAppointmentForReport(appt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium rounded transition"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Abrir Laudo</span>
                      </button>
                    ) : isCancelled ? (
                      <span className="text-[11px] text-slate-400 italic">Cancelado</span>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-medium rounded border border-slate-200">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Aguardando laudo médico</span>
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
