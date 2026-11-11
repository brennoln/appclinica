import React, { useState } from 'react';
import { Appointment, EXAM_LABELS } from '../types';
import { useAppointments } from '../hooks/useAppointments';
import { usePatients } from '../hooks/usePatients';
import { ReportModal } from './ReportModal';
import { CreateAppointmentModal } from './CreateAppointmentModal';
import { ExamPreparationModal } from './ExamPreparationModal';
import { DayTimelineView } from './DayTimelineView';
import { ConfirmDialog } from './ConfirmDialog';
import {
  Calendar,
  Plus,
  FileEdit,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  LayoutGrid,
  List,
  Download,
  Search,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

export const ClinicDashboard: React.FC = () => {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  // Status operacional da sala única gerenciado pela recepção
  const [roomStatus, setRoomStatus] = useState<'NORMAL' | 'DELAYED_15' | 'DELAYED_30'>('NORMAL');

  // Slot selecionado para agendamento rápido
  const [slotToBook, setSlotToBook] = useState<string | null>(null);

  const { patients, refetchPatients } = usePatients();
  const { appointments, loading, refetch, cancelAppointment } = useAppointments({
    date: selectedDate,
    patientId: selectedPatientId,
  });

  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState<Appointment | null>(null);
  const [selectedAppointmentForPreparation, setSelectedAppointmentForPreparation] = useState<Appointment | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<Appointment | null>(null);

  const getTomorrowDateStr = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const y = tomorrow.getFullYear();
    const m = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const d = String(tomorrow.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  const handleSwitchToTimeline = () => {
    if (!selectedDate) {
      setSelectedDate(getTomorrowDateStr());
    }
    setViewMode('timeline');
  };

  // Filtragem local por texto (busca instantânea por nome ou exame)
  const filteredAppointments = appointments.filter((appt) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const patientName = appt.patient.name.toLowerCase();
    const examLabel = (EXAM_LABELS[appt.examType] || appt.examType).toLowerCase();
    return patientName.includes(term) || examLabel.includes(term);
  });

  const totalActive = appointments.filter((a) => a.status === 'SCHEDULED').length;
  const totalPublished = appointments.filter((a) => a.report?.status === 'PUBLISHED').length;
  const totalPendingReports = appointments.filter(
    (a) => a.status === 'SCHEDULED' && (!a.report || a.report.status === 'DRAFT')
  ).length;

  // Exportação rápida da agenda para CSV
  const handleExportCSV = () => {
    if (appointments.length === 0) {
      toast.warning('Não há agendamentos para exportar.');
      return;
    }

    const headers = ['Data', 'Horario', 'Paciente', 'Email', 'Exame', 'Status', 'Laudo'];
    const rows = appointments.map((appt) => {
      const d = new Date(appt.dateTime);
      const dateStr = d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
      const timeStr = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' });
      const reportStatus = appt.report?.status === 'PUBLISHED' ? 'Publicado' : appt.report?.status === 'DRAFT' ? 'Rascunho' : 'Pendente';

      return [
        `"${dateStr}"`,
        `"${timeStr}"`,
        `"${appt.patient.name}"`,
        `"${appt.patient.email}"`,
        `"${EXAM_LABELS[appt.examType] || appt.examType}"`,
        `"${appt.status === 'SCHEDULED' ? 'Ativo' : 'Cancelado'}"`,
        `"${reportStatus}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `agenda_clinica_${selectedDate || 'geral'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Agenda exportada com sucesso (CSV).');
  };

  const handleQuickBookSlot = (time: string) => {
    setSlotToBook(time);
    setIsCreateOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Barra de Métricas em Linha + Ações */}
      <section
        aria-label="Controles e Resumo de Agendamentos"
        className="bg-white px-4 py-2.5 rounded-lg border border-slate-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3"
      >
        {/* Métricas Compactas */}
        <div className="flex items-center gap-3.5 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Ativos:</span>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-700 font-bold border border-blue-200/70">
              {totalActive}
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-200" aria-hidden="true" />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Publicados:</span>
            <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 font-bold border border-emerald-200/70">
              {totalPublished}
            </span>
          </div>

          <div className="h-3.5 w-px bg-slate-200" aria-hidden="true" />

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 font-medium">Aguardando Laudo:</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-700 font-bold border border-amber-200/70">
              {totalPendingReports}
            </span>
          </div>
        </div>

        {/* Alternador de Visualização (Lista vs Timeline) & Exportação */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition ${
                viewMode === 'list'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
            <button
              onClick={handleSwitchToTimeline}
              className={`flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded transition ${
                viewMode === 'timeline'
                  ? 'bg-white text-blue-700 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Sala / Horários</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-2.5 py-1 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium transition"
            title="Exportar agenda em CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">Exportar</span>
          </button>

          <button
            onClick={() => refetch()}
            aria-label="Atualizar agenda"
            className="p-1.5 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded transition"
            title="Recarregar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => {
              setSlotToBook(null);
              setIsCreateOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded shadow-2xs transition"
          >
            <Plus className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Novo Agendamento</span>
          </button>
        </div>
      </section>

      {/* Barra de Filtros & Busca Instantânea */}
      <section
        aria-label="Filtros da Agenda"
        className="bg-white px-4 py-2.5 rounded-lg border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div className="flex flex-wrap items-center gap-2">
          {/* Busca por texto */}
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar paciente ou exame..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-7 pr-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none w-48 sm:w-56"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2 top-2 pointer-events-none" />
          </div>

          <select
            value={selectedPatientId}
            onChange={(e) => setSelectedPatientId(e.target.value)}
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
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
            className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-800 focus:bg-white focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
          />

          {(selectedPatientId || selectedDate || searchTerm) && (
            <button
              onClick={() => {
                setSelectedPatientId('');
                setSelectedDate('');
                setSearchTerm('');
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 underline px-1"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Gerenciamento Logístico da Sala Única (Controle de Atrasos Operacionais) */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-slate-500 font-medium">Fluxo da Sala:</span>
          <div className="flex items-center bg-slate-100 p-0.5 rounded border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setRoomStatus('NORMAL');
                toast.success('Sala Única com operação pontual normalizada.');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                roomStatus === 'NORMAL'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-emerald-700'
              }`}
            >
              Em Dia
            </button>
            <button
              type="button"
              onClick={() => {
                setRoomStatus('DELAYED_15');
                toast.warning('Atraso operacional de 15 minutos informado.');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                roomStatus === 'DELAYED_15'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-amber-700'
              }`}
            >
              Atraso ~15m
            </button>
            <button
              type="button"
              onClick={() => {
                setRoomStatus('DELAYED_30');
                toast.error('Atraso operacional de 30 minutos informado.');
              }}
              className={`px-2 py-0.5 rounded text-[10px] font-bold transition ${
                roomStatus === 'DELAYED_30'
                  ? 'bg-rose-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-rose-700'
              }`}
            >
              Atraso ~30m
            </button>
          </div>
        </div>
      </section>

      {/* Conteúdo Dinâmico: Visão Tabela ou Visão Linha do Tempo */}
      {viewMode === 'timeline' ? (
        <DayTimelineView
          selectedDate={selectedDate}
          onChangeDate={setSelectedDate}
          appointments={filteredAppointments}
          onSelectSlot={handleQuickBookSlot}
          onOpenReport={(appt) => setSelectedAppointmentForReport(appt)}
          onOpenPreparation={(appt) => setSelectedAppointmentForPreparation(appt)}
          onCancelAppointment={(appt) => setAppointmentToCancel(appt)}
        />
      ) : (
        <section className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="px-4 py-2.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Agenda de Exames
              </h2>
            </div>
            <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {filteredAppointments.length} listados
            </span>
          </div>

          {loading ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Carregando agendamentos...
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              Nenhum agendamento encontrado para os filtros selecionados.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="px-4 py-2.5">Data / Hora</th>
                    <th className="px-4 py-2.5">Paciente</th>
                    <th className="px-4 py-2.5">Exame</th>
                    <th className="px-4 py-2.5">Status</th>
                    <th className="px-4 py-2.5">Laudo Médico</th>
                    <th className="px-4 py-2.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAppointments.map((appt) => {
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
                        className={`hover:bg-blue-50/30 transition-colors ${
                          isCancelled ? 'bg-slate-50/50 opacity-50' : ''
                        }`}
                      >
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-slate-900">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 text-blue-500" aria-hidden="true" />
                            <span>
                              {dateFormatted} às <strong className="font-semibold text-blue-700">{timeFormatted}</strong>
                            </span>
                          </div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-slate-900">{appt.patient.name}</div>
                          <div className="text-slate-400 text-[11px]">{appt.patient.email}</div>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded text-[11px] font-medium border border-slate-200">
                            {EXAM_LABELS[appt.examType] || appt.examType}
                          </span>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
                          {isCancelled ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                              Cancelado
                            </span>
                          ) : appt.confirmedAt ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300" title={`Confirmado em ${new Date(appt.confirmedAt).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`}>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Presença OK
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 border border-blue-200">
                              Ativo
                            </span>
                          )}
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">
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

                        <td className="px-4 py-3 whitespace-nowrap text-right space-x-1.5">
                          {!isCancelled && (
                            <button
                              onClick={() => setSelectedAppointmentForPreparation(appt)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition"
                              title="Ver ou editar recomendações de preparo do paciente"
                            >
                              <Info className="w-3 h-3 text-blue-600" aria-hidden="true" />
                              <span className="hidden lg:inline">Preparo</span>
                            </button>
                          )}

                          {!isCancelled && (
                            <button
                              onClick={() => setSelectedAppointmentForReport(appt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                            >
                              <FileEdit className="w-3 h-3 text-blue-600" aria-hidden="true" />
                              <span>{appt.report ? 'Ver / Editar' : 'Laudo'}</span>
                            </button>
                          )}

                          {!isCancelled && !hasPublishedReport && (
                            <button
                              onClick={() => setAppointmentToCancel(appt)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 transition"
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
      )}

      {/* Modais */}
      {isCreateOpen && (
        <CreateAppointmentModal
          patients={patients}
          appointments={appointments}
          initialTime={slotToBook || '09:00'}
          initialDate={selectedDate || undefined}
          onClose={() => {
            setIsCreateOpen(false);
            setSlotToBook(null);
          }}
          onCreated={refetch}
          onPatientCreated={refetchPatients}
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

      {selectedAppointmentForPreparation && (
        <ExamPreparationModal
          appointment={selectedAppointmentForPreparation}
          isClinic={true}
          onClose={() => setSelectedAppointmentForPreparation(null)}
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
