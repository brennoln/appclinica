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
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Search,
  AlertCircle,
} from 'lucide-react';

export const ClinicDashboard: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');

  const { patients } = usePatients();
  const { appointments, loading, refetch, cancelAppointment } = useAppointments({
    date: selectedDate,
    patientId: selectedPatientId,
  });

  // Modais
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState<Appointment | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  return (
    <div className="space-y-6">
      {/* Barra de Filtros e Ações */}
      <section
        aria-label="Filtros e Controles de Agendamentos"
        className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-700">
            <Filter className="w-4 h-4 text-slate-500" aria-hidden="true" />
            <span className="text-xs font-bold uppercase tracking-wider">Filtrar:</span>
          </div>

          <div>
            <label htmlFor="filter-patient" className="sr-only">
              Filtrar por paciente
            </label>
            <select
              id="filter-patient"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            >
              <option value="">Todos os Pacientes</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="filter-date" className="sr-only">
              Filtrar por data
            </label>
            <input
              id="filter-date"
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3.5 py-2 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            />
          </div>

          {(selectedPatientId || selectedDate) && (
            <button
              onClick={() => {
                setSelectedPatientId('');
                setSelectedDate('');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 focus:outline-hidden focus:underline"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => refetch()}
            aria-label="Atualizar lista de agendamentos"
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            title="Recarregar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </section>

      {/* Tabela de Agendamentos */}
      <section
        aria-label="Lista de Agendamentos da Clínica"
        className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
      >
        <div className="px-6 py-4.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" aria-hidden="true" />
            <h2 className="text-sm font-bold text-slate-900">
              Agendamentos Registrados ({appointments.length})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Intervalos de 30 minutos • Sala Única</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm animate-pulse" role="status">
            Carregando agendamentos da clínica...
          </div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm" role="status">
            Nenhum agendamento encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <caption className="sr-only">Tabela de agendamentos da clínica médica</caption>
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-bold border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3.5">Data e Horário</th>
                  <th scope="col" className="px-6 py-3.5">Paciente</th>
                  <th scope="col" className="px-6 py-3.5">Exame</th>
                  <th scope="col" className="px-6 py-3.5">Situação</th>
                  <th scope="col" className="px-6 py-3.5">Laudo</th>
                  <th scope="col" className="px-6 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {appointments.map((appt) => {
                  const dateObj = new Date(appt.dateTime);
                  const isCancelled = appt.status === 'CANCELLED';
                  const hasPublishedReport = appt.report?.status === 'PUBLISHED';
                  const hasDraftReport = appt.report?.status === 'DRAFT';

                  return (
                    <tr
                      key={appt.id}
                      className={`hover:bg-slate-50/80 transition-colors ${
                        isCancelled ? 'bg-slate-50/60 opacity-60' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" aria-hidden="true" />
                          <span>
                            {dateObj.toLocaleDateString('pt-BR')} às{' '}
                            {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900">{appt.patient.name}</div>
                        <div className="text-slate-400 text-[11px]">{appt.patient.email}</div>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-semibold text-slate-800">
                          {EXAM_LABELS[appt.examType] || appt.examType}
                        </span>
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {isCancelled ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800">
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                            Confirmado
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasPublishedReport && (
                          <span className="inline-flex items-center gap-1.5 text-emerald-700 font-bold">
                            <CheckCircle className="w-4 h-4 text-emerald-600" aria-hidden="true" />
                            Publicado
                          </span>
                        )}
                        {hasDraftReport && (
                          <span className="inline-flex items-center gap-1.5 text-amber-700 font-bold">
                            <FileEdit className="w-4 h-4 text-amber-600" aria-hidden="true" />
                            Rascunho
                          </span>
                        )}
                        {!appt.report && !isCancelled && (
                          <span className="text-slate-400 italic">Sem laudo</span>
                        )}
                        {isCancelled && <span className="text-slate-400">-</span>}
                      </td>

                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        {!isCancelled && (
                          <button
                            onClick={() => setSelectedAppointmentForReport(appt)}
                            aria-label={`${appt.report ? 'Ver ou editar laudo de' : 'Cadastrar laudo para'} ${appt.patient.name}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
                          >
                            <FileEdit className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{appt.report ? 'Ver / Editar' : 'Cadastrar'}</span>
                          </button>
                        )}

                        {!isCancelled && !hasPublishedReport && (
                          <button
                            onClick={() => setAppointmentToCancel(appt)}
                            aria-label={`Cancelar agendamento de ${appt.patient.name}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 focus:outline-hidden focus:ring-2 focus:ring-rose-500 transition"
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

      {/* Modal Criar Agendamento */}
      {isCreateOpen && (
        <CreateAppointmentModal
          patients={patients}
          onClose={() => setIsCreateOpen(false)}
          onCreated={refetch}
        />
      )}

      {/* Modal Cadastrar / Editar Laudo */}
      {selectedAppointmentForReport && (
        <ReportModal
          appointment={selectedAppointmentForReport}
          isClinic={true}
          onClose={() => setSelectedAppointmentForReport(null)}
          onSaved={refetch}
        />
      )}

      {/* Confirmação Acessível de Cancelamento */}
      <ConfirmDialog
        isOpen={Boolean(appointmentToCancel)}
        title="Cancelar Agendamento"
        description={`Deseja realmente cancelar o exame de ${appointmentToCancel?.patient.name}? O horário ficará livre para outro paciente.`}
        confirmLabel="Sim, cancelar exame"
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
