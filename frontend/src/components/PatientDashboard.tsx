import React, { useState } from 'react';
import { Appointment, EXAM_LABELS } from '../types';
import { useAuth } from '../context/AuthContext';
import { useAppointments } from '../hooks/useAppointments';
import { ReportModal } from './ReportModal';
import { ExamPreparationModal } from './ExamPreparationModal';
import {
  Calendar,
  FileText,
  Clock,
  AlertCircle,
  RefreshCw,
  HeartPulse,
  Info,
} from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { appointments, loading, refetch } = useAppointments();
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState<Appointment | null>(null);
  const [selectedAppointmentForPreparation, setSelectedAppointmentForPreparation] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'PENDING'>('ALL');

  const now = new Date();
  const nextAppointment = appointments.find(
    (a) => a.status === 'SCHEDULED' && new Date(a.dateTime).getTime() >= now.getTime()
  );

  const publishedCount = appointments.filter((a) => a.report?.status === 'PUBLISHED').length;
  const pendingCount = appointments.filter((a) => a.status === 'SCHEDULED' && !a.report).length;

  const filteredAppointments = appointments.filter((appt) => {
    if (statusFilter === 'PUBLISHED') return appt.report?.status === 'PUBLISHED';
    if (statusFilter === 'PENDING') return appt.status === 'SCHEDULED' && !appt.report;
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Barra de Perfil e Próximo Horário em Verde Discreto */}
      <section className="bg-white rounded-lg p-4 border border-emerald-200/80 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
              {user?.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-900">{user?.name}</h1>
                <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                  Portal do Paciente
                </span>
              </div>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={() => refetch()}
            aria-label="Atualizar exames"
            className="p-1.5 border border-emerald-200 hover:bg-emerald-50 text-emerald-700 rounded transition"
            title="Atualizar dados"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Destaque Compacto: Próximo Exame + Atalho para Instruções de Preparo */}
        <div className="mt-3 p-3 rounded bg-emerald-50/60 border border-emerald-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-800 uppercase tracking-wider mb-0.5">
              <Calendar className="w-3.5 h-3.5 text-emerald-600" />
              <span>Próximo Exame Marcado</span>
            </div>

            {nextAppointment ? (
              <p className="text-xs text-slate-800">
                <strong className="font-semibold text-emerald-950">{EXAM_LABELS[nextAppointment.examType] || nextAppointment.examType}</strong> em{' '}
                {new Date(nextAppointment.dateTime).toLocaleDateString('pt-BR', {
                  timeZone: 'America/Sao_Paulo',
                })}{' '}
                às{' '}
                <strong className="font-bold text-emerald-800">
                  {new Date(nextAppointment.dateTime).toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'America/Sao_Paulo',
                  })}
                </strong>
              </p>
            ) : (
              <p className="text-xs text-slate-600">Nenhum exame agendado para os próximos dias.</p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {nextAppointment && (
              <>
                <button
                  onClick={() => setSelectedAppointmentForPreparation(nextAppointment)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-900 text-[11px] font-semibold rounded transition"
                >
                  <Info className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Como se preparar</span>
                </button>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-bold">
                  Confirmado
                </span>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Histórico de Exames */}
      <section className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-emerald-50/30">
          <div className="flex items-center gap-2">
            <HeartPulse className="w-4 h-4 text-emerald-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Meus Exames e Resultados
            </h2>
          </div>

          {/* Filtros rápidos do Paciente */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-emerald-200/80 text-[11px]">
            <button
              type="button"
              onClick={() => setStatusFilter('ALL')}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                statusFilter === 'ALL'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-emerald-50'
              }`}
            >
              Todos ({appointments.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PUBLISHED')}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                statusFilter === 'PUBLISHED'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-emerald-50'
              }`}
            >
              Laudos Liberados ({publishedCount})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('PENDING')}
              className={`px-2.5 py-1 rounded font-semibold transition ${
                statusFilter === 'PENDING'
                  ? 'bg-emerald-600 text-white'
                  : 'text-slate-600 hover:bg-emerald-50'
              }`}
            >
              Aguardando ({pendingCount})
            </button>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Buscando seus exames...
          </div>
        ) : filteredAppointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Nenhum exame encontrado para o filtro selecionado.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredAppointments.map((appt) => {
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
                  className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-emerald-50/20 transition"
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
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      <span>
                        {dateFormatted} às <strong className="font-semibold text-slate-800">{timeFormatted}</strong>
                      </span>
                      <span>• Sala de Diagnóstico</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCancelled && (
                      <button
                        onClick={() => setSelectedAppointmentForPreparation(appt)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 hover:text-emerald-800 hover:bg-emerald-50 rounded text-xs font-medium border border-slate-200 transition"
                        title="Ver orientações de preparo cadastradas pela clínica"
                      >
                        <Info className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="hidden sm:inline">Preparo</span>
                      </button>
                    )}

                    {hasPublishedReport ? (
                      <button
                        onClick={() => setSelectedAppointmentForReport(appt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded transition shadow-2xs"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Visualizar Laudo</span>
                      </button>
                    ) : isCancelled ? (
                      <span className="text-[11px] text-slate-400 italic">Cancelado</span>
                    ) : (
                      <div className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-600 text-[11px] font-medium rounded border border-slate-200">
                        <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                        <span>Aguardando laudo</span>
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

      {/* Modal Instruções de Preparo Personalizadas da Clínica */}
      {selectedAppointmentForPreparation && (
        <ExamPreparationModal
          appointment={selectedAppointmentForPreparation}
          onClose={() => setSelectedAppointmentForPreparation(null)}
        />
      )}
    </div>
  );
};
