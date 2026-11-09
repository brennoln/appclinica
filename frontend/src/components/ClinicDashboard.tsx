import React, { useState, useEffect } from 'react';
import { Appointment, User, EXAM_LABELS } from '../types';
import { api } from '../services/api';
import { ReportModal } from './ReportModal';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import {
  Calendar,
  Filter,
  Plus,
  FileEdit,
  CheckCircle,
  XCircle,
  Clock,
  User as UserIcon,
  Search,
  RefreshCw,
} from 'lucide-react';

export const ClinicDashboard: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<User[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  // Modais
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState<Appointment | null>(null);

  const fetchPatients = async () => {
    try {
      const res = await api.get('/patients');
      setPatients(res.data);
    } catch (err) {
      console.error('Erro ao buscar pacientes', err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedPatientId) params.patientId = selectedPatientId;
      if (selectedDate) params.date = selectedDate;

      const res = await api.get('/appointments', { params });
      setAppointments(res.data);
    } catch (err) {
      console.error('Erro ao buscar agendamentos', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  useEffect(() => {
    fetchAppointments();
  }, [selectedPatientId, selectedDate]);

  const handleCancelAppointment = async (id: string) => {
    if (!window.confirm('Tem certeza que deseja cancelar este agendamento?')) return;

    try {
      await api.patch(`/appointments/${id}/cancel`);
      fetchAppointments();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Erro ao cancelar agendamento');
    }
  };

  return (
    <div className="space-y-6">
      {/* Barra de Ações e Filtros */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Filtros:</span>
          </div>

          {/* Filtro por Paciente */}
          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">Todos os Pacientes</option>
            {patients.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          {/* Filtro por Data */}
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs text-slate-800 bg-white focus:ring-2 focus:ring-blue-500 outline-none"
          />

          {(selectedPatientId || selectedDate) && (
            <button
              onClick={() => {
                setSelectedPatientId('');
                setSelectedDate('');
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium underline"
            >
              Limpar Filtros
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchAppointments}
            className="p-2 border border-slate-300 hover:bg-slate-50 text-slate-600 rounded-lg transition"
            title="Recarregar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </div>

      {/* Lista de Agendamentos */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" />
            Agendamentos da Clínica ({appointments.length})
          </h2>
          <span className="text-xs text-slate-500">Única sala disponível (Slots de 30m)</span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">Carregando agendamentos...</div>
        ) : appointments.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Nenhum agendamento encontrado para os filtros selecionados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Data e Hora</th>
                  <th className="px-6 py-3">Paciente</th>
                  <th className="px-6 py-3">Tipo de Exame</th>
                  <th className="px-6 py-3">Status Agendamento</th>
                  <th className="px-6 py-3">Laudo</th>
                  <th className="px-6 py-3 text-right">Ações</th>
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
                        isCancelled ? 'bg-slate-50/50 opacity-60' : ''
                      }`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400" />
                          <span>
                            {dateObj.toLocaleDateString('pt-BR')} às{' '}
                            {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900">{appt.patient.name}</div>
                        <div className="text-slate-400 text-[11px]">{appt.patient.email}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="font-medium text-slate-800">
                          {EXAM_LABELS[appt.examType] || appt.examType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isCancelled ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 text-rose-800">
                            Cancelado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                            Ativo
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {hasPublishedReport && (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                            <CheckCircle className="w-3.5 h-3.5" />
                            Publicado
                          </span>
                        )}
                        {hasDraftReport && (
                          <span className="inline-flex items-center gap-1 text-amber-600 font-medium">
                            <FileEdit className="w-3.5 h-3.5" />
                            Rascunho
                          </span>
                        )}
                        {!appt.report && !isCancelled && (
                          <span className="text-slate-400 italic">Sem laudo</span>
                        )}
                        {isCancelled && <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                        {/* Botão de Laudo */}
                        {!isCancelled && (
                          <button
                            onClick={() => setSelectedAppointmentForReport(appt)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                          >
                            <FileEdit className="w-3.5 h-3.5" />
                            <span>{appt.report ? 'Ver / Editar Laudo' : 'Cadastrar Laudo'}</span>
                          </button>
                        )}

                        {/* Botão Cancelar */}
                        {!isCancelled && !hasPublishedReport && (
                          <button
                            onClick={() => handleCancelAppointment(appt.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition"
                            title="Cancelar agendamento"
                          >
                            <XCircle className="w-3.5 h-3.5" />
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
      </div>

      {/* Modal Criar Agendamento */}
      {isCreateOpen && (
        <CreateAppointmentModal
          patients={patients}
          onClose={() => setIsCreateOpen(false)}
          onCreated={fetchAppointments}
        />
      )}

      {/* Modal Cadastrar / Editar Laudo */}
      {selectedAppointmentForReport && (
        <ReportModal
          appointment={selectedAppointmentForReport}
          isClinic={true}
          onClose={() => setSelectedAppointmentForReport(null)}
          onSaved={fetchAppointments}
        />
      )}
    </div>
  );
};
