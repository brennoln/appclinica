import React, { useState } from 'react';
import { Appointment, EXAM_LABELS } from '../types';
import { useAppointments } from '../hooks/useAppointments';
import { ReportModal } from './ReportModal';
import { Calendar, FileText, Clock, AlertCircle, RefreshCw } from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const { appointments, loading, refetch } = useAppointments();
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState<Appointment | null>(null);

  return (
    <div className="space-y-6">
      {/* Resumo do Paciente com Alto Contraste */}
      <section
        aria-label="Boas-vindas do paciente"
        className="bg-gradient-to-r from-teal-700 to-emerald-800 rounded-2xl p-6 text-white shadow-md flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl font-bold">Portal do Paciente - Seus Exames</h2>
          <p className="text-emerald-100 text-xs mt-1 leading-relaxed">
            Consulte os detalhes dos seus exames agendados e acesse seus laudos médicos oficiais assim que forem liberados.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          aria-label="Recarregar dados dos meus exames"
          className="p-3 bg-white/10 hover:bg-white/20 rounded-xl transition text-white focus:outline-hidden focus:ring-2 focus:ring-white"
          title="Atualizar dados"
        >
          <RefreshCw className="w-5 h-5" aria-hidden="true" />
        </button>
      </section>

      {/* Lista de Exames */}
      <section
        aria-label="Histórico de Exames do Paciente"
        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
      >
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" aria-hidden="true" />
            <h3 className="text-sm font-bold text-slate-900">
              Histórico de Agendamentos ({appointments.length})
            </h3>
          </div>
          <span className="text-xs text-slate-500">Acesso individual e confidencial</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm animate-pulse" role="status">
            Carregando seus exames e laudos...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm" role="status">
            Você não possui nenhum agendamento de exame registrado no momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-200" role="list">
            {appointments.map((appt) => {
              const dateObj = new Date(appt.dateTime);
              const isCancelled = appt.status === 'CANCELLED';
              const hasPublishedReport = appt.report && appt.report.status === 'PUBLISHED';

              return (
                <article
                  key={appt.id}
                  role="listitem"
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition"
                >
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-3">
                      <h4 className="font-bold text-slate-900 text-sm">
                        {EXAM_LABELS[appt.examType] || appt.examType}
                      </h4>
                      {isCancelled ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                          Cancelado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          Confirmado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
                      <span>
                        {dateObj.toLocaleDateString('pt-BR')} às{' '}
                        {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>• Sala Principal da Clínica</span>
                    </div>
                  </div>

                  <div>
                    {hasPublishedReport ? (
                      <button
                        onClick={() => setSelectedAppointmentForReport(appt)}
                        aria-label={`Visualizar laudo do exame de ${EXAM_LABELS[appt.examType] || appt.examType}`}
                        className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-emerald-500 transition"
                      >
                        <FileText className="w-4 h-4" aria-hidden="true" />
                        <span>Visualizar Laudo Oficial</span>
                      </button>
                    ) : isCancelled ? (
                      <span className="text-xs text-slate-400 italic">Exame cancelado</span>
                    ) : (
                      <div
                        role="status"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg"
                      >
                        <AlertCircle className="w-4 h-4 text-slate-400" aria-hidden="true" />
                        <span>Aguardando liberação do laudo médico</span>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Visualizar Laudo */}
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
