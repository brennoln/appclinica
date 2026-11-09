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
  Search,
  Users,
  Activity,
  FileCheck,
  ChevronRight
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

  // Métricas rápidas para o painel de saúde
  const totalActive = appointments.filter((a) => a.status === 'SCHEDULED').length;
  const totalPublished = appointments.filter((a) => a.report?.status === 'PUBLISHED').length;
  const totalPendingReports = appointments.filter((a) => a.status === 'SCHEDULED' && (!a.report || a.report.status === 'DRAFT')).length;

  return (
    <div className="space-y-8">
      {/* Cards de Métricas da Clínica */}
      <section aria-label="Visão Geral da Clínica" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Agendamentos Ativos</p>
            <p className="text-3xl font-black text-slate-900 mt-1">{totalActive}</p>
          </div>
          <div className="p-3.5 bg-blue-50 text-blue-600 rounded-2xl">
            <Calendar className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Laudos Publicados</p>
            <p className="text-3xl font-black text-emerald-600 mt-1">{totalPublished}</p>
          </div>
          <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-2xl">
            <FileCheck className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/70 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Aguardando Laudo</p>
            <p className="text-3xl font-black text-amber-500 mt-1">{totalPendingReports}</p>
          </div>
          <div className="p-3.5 bg-amber-50 text-amber-600 rounded-2xl">
            <Activity className="w-6 h-6" />
          </div>
        </div>
      </section>

      {/* Barra de Filtros e Ação Principal */}
      <section
        aria-label="Controles e Filtros de Agendamentos"
        className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700 mr-2">
            <Filter className="w-4 h-4 text-slate-400" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider">Filtrar Agenda:</span>
          </div>

          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
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
            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition"
          />

          {(selectedPatientId || selectedDate) && (
            <button
              onClick={() => {
                setSelectedPatientId('');
                setSelectedDate('');
              }}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 px-2 py-1"
            >
              Limpar
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            aria-label="Atualizar agenda"
            className="p-2.5 border border-slate-200 hover:bg-slate-100 text-slate-600 rounded-xl transition"
            title="Recarregar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </section>

      {/* Tabela de Agendamentos */}
      <section className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Agenda da Clínica</h2>
            <p className="text-xs text-slate-400">Slots regulares de 30 minutos em sala única de exames</p>
          </div>
          <span className="text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
            {appointments.length} registros
          </span>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-sm animate-pulse">
            Carregando agendamentos médicos...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-sm">
            Nenhum agendamento encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50/70 text-slate-400 uppercase tracking-wider font-bold border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4">Data e Horário</th>
                  <th className="px-6 py-4">Paciente</th>
                  <th className="px-6 py-4">Exame</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Laudo Médico</th>
                  <th className="px-6 py-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {appointments.map((appt) => {
                  const dateObj = new Date(appt.dateTime);
                  const isCancelled = appt.status === 'CANCELLED';
                  const hasPublishedReport = appt.report?.status === 'PUBLISHED';
                  const hasDraftReport = appt.report?.status === 'DRAFT';

                  // Formata hora no fuso horário do Brasil explicitamente
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
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCancelled ? 'bg-slate-50/50 opacity-50' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-slate-900">
                        <div className="flex items-center gap-2.5">
                          <Clock className="w-4 h-4 text-blue-600" aria-hidden="true" />
                          <span>
                            {dateFormatted} às <strong className="text-blue-700">{timeFormatted}</strong>
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{appt.patient.name}</div>
                        <div className="text-slate-400 text-[11px]">{appt.patient.email}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-800">
                        <span className="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-[11px] font-semibold">
                          {EXAM_LABELS[appt.examType] || appt.examType}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isCancelled ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-700">
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Ativo
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasPublishedReport && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                            Publicado
                          </span>
                        )}
                        {hasDraftReport && (
                          <span className="inline-flex items-center gap-1.5 text-amber-600 font-bold">
                            <FileEdit className="w-4 h-4 text-amber-500" aria-hidden="true" />
                            Rascunho
                          </span>
                        )}
                        {!appt.report && !isCancelled && (
                          <span className="text-slate-400 italic">Pendente</span>
                        )}
                        {isCancelled && <span className="text-slate-400">-</span>}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        {!isCancelled && (
                          <button
                            onClick={() => setSelectedAppointmentForReport(appt)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 transition"
                          >
                            <FileEdit className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{appt.report ? 'Ver / Editar' : 'Cadastrar'}</span>
                          </button>
                        )}

                        {!isCancelled && !hasPublishedReport && (
                          <button
                            onClick={() => setAppointmentToCancel(appt)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 transition"
                          >
                            <XCircle className="w-3.5 h-3.5" aria-hidden="true" />
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
        description={`Tem certeza que deseja cancelar o agendamento de ${appointmentToCancel?.patient.name}? O horário voltará a ficar disponível para outros pacientes.`}
        confirmLabel="Sim, cancelar"
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
