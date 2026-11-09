import React, { useState } from 'react';
import { Appointment, EXAM_LABELS } from '../types';
import { useAppointments } from '../hooks/useAppointments';
import { usePatients } from '../hooks/usePatients';
import { ReportModal } from './ReportModal';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import { ConfirmDialog } from './ConfirmDialog';
import {
  Calendar,
  Filter,
  Plus,
  FileEdit,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  Activity,
  FileCheck,
} from 'lucide-react';

export const ClinicDashboard: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const { patients } = usePatients();
  const { appointments, loading, refetch, cancelAppointment } = useAppointments({
    date: selectedDate,
    patientId: selectedPatientId,
  });

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState<Appointment | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  const totalActive = appointments.filter((a) => a.status === 'SCHEDULED').length;
  const totalPublished = appointments.filter((a) => a.report?.status === 'PUBLISHED').length;
  const totalPendingReports = appointments.filter(
    (a) => a.status === 'SCHEDULED' && (!a.report || a.report.status === 'DRAFT')
  ).length;

  return (
    <div className="space-y-4">
      {/* Cards de Métricas Compactos e com Bordas Quadradas Modernas */}
      <section aria-label="Visão Geral da Clínica" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Agendamentos Ativos</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5 tracking-tight">{totalActive}</p>
          </div>
          <div className="p-2 bg-blue-50 text-blue-600 rounded-md border border-blue-100/60">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Laudos Publicados</p>
            <p className="text-xl font-bold text-emerald-600 mt-0.5 tracking-tight">{totalPublished}</p>
          </div>
          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-md border border-emerald-100/60">
            <FileCheck className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Aguardando Laudo</p>
            <p className="text-xl font-bold text-amber-600 mt-0.5 tracking-tight">{totalPendingReports}</p>
          </div>
          <div className="p-2 bg-amber-50 text-amber-600 rounded-md border border-amber-100/60">
            <Activity className="w-4 h-4" />
          </div>
        </div>
      </section>

      {/* Barra de Filtros e Ações */}
      <section
        aria-label="Controles e Filtros de Agendamentos"
        className="bg-white px-4 py-3 rounded-lg border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 text-slate-600 mr-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
            <span className="text-[11px] font-bold uppercase tracking-wider">Filtrar:</span>
          </div>

          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition"
          >
            <option value="">Todos os Pacientes</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 outline-none transition"
          />

          {(selectedPatientId || selectedDate) && (
            <button
              onClick={() => {
                setSelectedPatientId('');
                setSelectedDate('');
              }}
              className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline px-1"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refetch()}
            aria-label="Atualizar agenda"
            className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-md transition"
            title="Recarregar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-md shadow-xs transition"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </section>

      {/* Tabela de Agendamentos */}
      <section className="bg-white rounded-lg border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">Agenda da Clínica</h2>
            <p className="text-[11px] text-slate-500">Slots fixos de 30 minutos em sala única</p>
          </div>
          <span className="text-[11px] font-semibold text-slate-600 bg-white px-2.5 py-0.5 rounded border border-slate-200">
            {appointments.length} exames
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Carregando agendamentos...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            Nenhum agendamento encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
                <tr>
                  <th className="px-5 py-2.5">Data / Hora</th>
                  <th className="px-5 py-2.5">Paciente</th>
                  <th className="px-5 py-2.5">Exame</th>
                  <th className="px-5 py-2.5">Status</th>
                  <th className="px-5 py-2.5">Laudo Médico</th>
                  <th className="px-5 py-2.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => {
                  const dateObj = new Date(appt.dateTime);
                  const isCancelled = appt.status === 'CANCELLED';
                  const hasPublishedReport = appt.report?.status === 'PUBLISHED';
                  const hasDraftReport = appt.report?.status === 'DRAFT';

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
                    <tr
                      key={appt.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isCancelled ? 'bg-slate-50/40 opacity-50' : ''
                      }`}
                    >
                      <td className="px-5 py-3 whitespace-nowrap font-medium text-slate-900">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-slate-400" aria-hidden="true" />
                          <span>
                            {dateFormatted} às <strong className="font-semibold text-slate-900">{timeFormatted}</strong>
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap">
                        <div className="font-medium text-slate-900">{appt.patient.name}</div>
                        <div className="text-slate-400 text-[11px]">{appt.patient.email}</div>
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium border border-slate-200">
                          {EXAM_LABELS[appt.examType] || appt.examType}
                        </span>
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap">
                        {isCancelled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Ativo
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap">
                        {hasPublishedReport && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" />
                            Publicado
                          </span>
                        )}
                        {hasDraftReport && (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                            <FileEdit className="w-3.5 h-3.5 text-amber-500" aria-hidden="true" />
                            Rascunho
                          </span>
                        )}
                        {!appt.report && !isCancelled && (
                          <span className="text-slate-400 italic text-[11px]">Pendente</span>
                        )}
                        {isCancelled && <span className="text-slate-400">-</span>}
                      </td>

                      <td className="px-5 py-3 whitespace-nowrap text-right space-x-1.5">
                        {!isCancelled && (
                          <button
                            onClick={() => setSelectedAppointmentForReport(appt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                          >
                            <FileEdit className="w-3 h-3 text-slate-500" aria-hidden="true" />
                            <span>{appt.report ? 'Ver / Editar' : 'Laudo'}</span>
                          </button>
                        )}

                        {!isCancelled && !hasPublishedReport && (
                          <button
                            onClick={() => setAppointmentToCancel(appt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 transition"
                          >
                            <XCircle className="w-3 h-3 text-rose-600" aria-hidden="true" />
                            <span>Cancelar</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modais */}
      {isCreateOpen && (
        <CreateAppointmentModal
          patients={patients}
          onClose={() => setIsCreateOpen(false)}
          onCreated={refetch}
        />
      )}

      {selectedAppointmentForReport && (
        <ReportModal
          appointment={selectedAppointmentForReport}
          isClinic={true}
          onClose={() => setSelectedAppointmentForReport(null)}
          onSaved={refetch}
        />
      )}

      <ConfirmDialog
        isOpen={Boolean(appointmentToCancel)}
        title="Confirmar Cancelamento"
        description={`Deseja cancelar o agendamento de ${appointmentToCancel?.patient.name}? O horário voltará a ficar disponível para outros pacientes.`}
        confirmLabel="Confirmar Cancelamento"
        cancelLabel="Voltar"
        isDestructive={true}
        onConfirm={() => {
          if (appointmentToCancel) {
            cancelAppointment(appointmentToCancel.id);
          }
        }}
        onClose={() => setAppointmentToCancel(null)}
      />
    </div>
  );
};
