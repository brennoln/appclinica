import React, { useState, useEffect } from 'react';
import { Appointment, EXAM_LABELS } from '../types';
import { api } from '../services/api';
import { ReportModal } from './ReportModal';
import { Calendar, FileText, Clock, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';

export const PatientDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState<Appointment | null>(null);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const res = await api.get('/appointments');
      setAppointments(res.data);
    } catch (err) {
      console.error('Erro ao buscar exames do paciente', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  return (
    <div className="space-y-6">
      {/* Resumo do Paciente */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-2xl p-6 text-white shadow-md flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Meus Agendamentos e Laudos</h2>
          <p className="text-emerald-100 text-xs mt-1">
            Consulte seus exames marcados e acesse seus laudos médicos assim que forem liberados pela clínica.
          </p>
        </div>
        <button
          onClick={fetchAppointments}
          className="p-2.5 bg-white/10 hover:bg-white/20 rounded-xl transition text-white"
          title="Atualizar dados"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Lista de Exames */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600" />
            Histórico de Exames ({appointments.length})
          </h3>
          <span className="text-xs text-slate-400">Somente seus agendamentos são exibidos</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Carregando seus exames...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Você não possui nenhum agendamento cadastrado no momento.
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {appointments.map((appt) => {
              const dateObj = new Date(appt.dateTime);
              const isCancelled = appt.status === 'CANCELLED';
              const hasPublishedReport = appt.report && appt.report.status === 'PUBLISHED';

              return (
                <div
                  key={appt.id}
                  className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="font-bold text-slate-900 text-sm">
                        {EXAM_LABELS[appt.examType] || appt.examType}
                      </span>
                      {isCancelled ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-rose-100 text-rose-800">
                          Cancelado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                          Confirmado
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        {dateObj.toLocaleDateString('pt-BR')} às{' '}
                        {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>• Sala Principal</span>
                    </div>
                  </div>

                  <div>
                    {hasPublishedReport ? (
                      <button
                        onClick={() => setSelectedAppointmentForReport(appt)}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs transition"
                      >
                        <FileText className="w-4 h-4" />
                        <span>Visualizar Laudo</span>
                      </button>
                    ) : isCancelled ? (
                      <span className="text-xs text-slate-400">Exame cancelado</span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-medium rounded-lg">
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
      </div>

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
