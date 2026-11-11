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
  Search,
  AlertTriangle,
  CheckCircle2,
  Check,
} from 'lucide-react';
import { toast } from 'sonner';
import { api } from '../services/api';

export const PatientDashboard: React.FC = () => {
  const { user } = useAuth();
  const { appointments, loading, refetch } = useAppointments();
  const [selectedAppointmentForReport, setSelectedAppointmentForReport] = useState<Appointment | null>(null);
  const [selectedAppointmentForPreparation, setSelectedAppointmentForPreparation] = useState<Appointment | null>(null);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PUBLISHED' | 'PENDING'>('ALL');
  const [searchExam, setSearchExam] = useState<string>('');
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const now = new Date();
  const nextAppointment = appointments.find(
    (a) => a.status === 'SCHEDULED' && new Date(a.dateTime).getTime() >= now.getTime()
  );

  // Calcula horas e minutos restantes para o próximo exame
  const timeRemainingText = (() => {
    if (!nextAppointment) return null;
    const diffMs = new Date(nextAppointment.dateTime).getTime() - now.getTime();
    if (diffMs <= 0) return 'Horário do exame chegado';
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (diffHours > 24) {
      const days = Math.floor(diffHours / 24);
      return `Faltam ${days} dia${days > 1 ? 's' : ''}`;
    }
    return `Faltam ${diffHours}h ${diffMinutes}m`;
  })();

  // Verifica se a confirmação de presença está liberada (máximo 48 horas / 2 dias antes do exame)
  const canConfirmAttendance = (appt: Appointment) => {
    if (appt.confirmedAt) return false;
    const diffMs = new Date(appt.dateTime).getTime() - now.getTime();
    const twoDaysInMs = 2 * 24 * 60 * 60 * 1000;
    return diffMs > 0 && diffMs <= twoDaysInMs;
  };

  const handleConfirmAttendance = async (appointmentId: string) => {
    setConfirmingId(appointmentId);
    try {
      await api.patch(`/appointments/${appointmentId}/confirm`);
      toast.success('Presença confirmada com sucesso! A equipe da clínica já foi notificada.');
      refetch();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao confirmar presença.');
    } finally {
      setConfirmingId(null);
    }
  };

  // Verifica se o próximo exame ocorre nas próximas 24 horas para alerta de preparo
  const isNextAppointmentNear = nextAppointment
    ? (new Date(nextAppointment.dateTime).getTime() - now.getTime()) <= 24 * 60 * 60 * 1000
    : false;

  const publishedCount = appointments.filter((a) => a.report?.status === 'PUBLISHED').length;
  const pendingCount = appointments.filter((a) => a.status === 'SCHEDULED' && !a.report).length;

  const filteredAppointments = appointments.filter((appt) => {
    if (statusFilter === 'PUBLISHED' && appt.report?.status !== 'PUBLISHED') return false;
    if (statusFilter === 'PENDING' && (appt.status !== 'SCHEDULED' || appt.report)) return false;

    if (searchExam.trim()) {
      const term = searchExam.toLowerCase();
      const examName = (EXAM_LABELS[appt.examType] || appt.examType).toLowerCase();
      return examName.includes(term);
    }
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
              {timeRemainingText && (
                <span className="font-mono text-[9px] px-1.5 py-0.2 rounded bg-emerald-200/80 text-emerald-950 font-bold ml-1">
                  ⏱ {timeRemainingText}
                </span>
              )}
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

          <div className="flex items-center gap-2 flex-wrap">
            {nextAppointment && (
              <>
                <button
                  onClick={() => setSelectedAppointmentForPreparation(nextAppointment)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-900 text-[11px] font-semibold rounded transition"
                >
                  <Info className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Como se preparar</span>
                </button>

                {nextAppointment.confirmedAt ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-100 text-emerald-900 border border-emerald-300 text-[10px] font-bold">
                    <Check className="w-3 h-3 text-emerald-700" /> Presença Confirmada
                  </span>
                ) : canConfirmAttendance(nextAppointment) ? (
                  <button
                    disabled={confirmingId === nextAppointment.id}
                    onClick={() => handleConfirmAttendance(nextAppointment.id)}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-[11px] font-bold shadow-2xs transition"
                    title="Confirmar que você comparecerá ao exame"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{confirmingId === nextAppointment.id ? 'Confirmando...' : 'Confirmar Presença'}</span>
                  </button>
                ) : (
                  <span
                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-medium"
                    title="A confirmação de presença é liberada 2 dias antes do exame"
                  >
                    Confirmação abre em 48h
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Alerta de Preparo Próximo (se exame for em menos de 24h) */}
        {nextAppointment && isNextAppointmentNear && (
          <div className="mt-2.5 p-2.5 rounded bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                <strong>Atenção:</strong> Seu exame ocorrerá nas próximas 24 horas. Verifique se há exigência de jejum ou roupas específicas.
              </span>
            </div>
            <button
              onClick={() => setSelectedAppointmentForPreparation(nextAppointment)}
              className="text-[11px] font-bold text-amber-800 hover:text-amber-950 underline shrink-0"
            >
              Ver Recomendações
            </button>
          </div>
        )}
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

          <div className="flex flex-wrap items-center gap-2">
            {/* Campo de Busca por Tipo de Exame */}
            <div className="relative">
              <input
                type="text"
                placeholder="Buscar exame..."
                value={searchExam}
                onChange={(e) => setSearchExam(e.target.value)}
                className="pl-7 pr-2.5 py-1 bg-white border border-emerald-200/90 rounded text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-600 w-36 sm:w-44"
              />
              <Search className="w-3.5 h-3.5 text-emerald-600 absolute left-2 top-2 pointer-events-none" />
            </div>

            {/* Filtros rápidos do Paciente */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded border border-emerald-200/80 text-[11px]">
              <button
                type="button"
                onClick={() => setStatusFilter('ALL')}
                className={`px-2 py-0.5 rounded font-semibold transition ${
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
                className={`px-2 py-0.5 rounded font-semibold transition ${
                  statusFilter === 'PUBLISHED'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-emerald-50'
                }`}
              >
                Laudados ({publishedCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusFilter('PENDING')}
                className={`px-2 py-0.5 rounded font-semibold transition ${
                  statusFilter === 'PENDING'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-emerald-50'
                }`}
              >
                Aguardando ({pendingCount})
              </button>
            </div>
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
                      ) : appt.confirmedAt ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-0.5">
                          <Check className="w-2.5 h-2.5" /> Presença Confirmada
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

                    {/* Previsão transparente de laudo quando pendente */}
                    {!isCancelled && !hasPublishedReport && (
                      <p className="text-[10px] text-slate-400">
                        Previsão de entrega do laudo: em até 24 horas úteis após a realização.
                      </p>
                    )}
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
