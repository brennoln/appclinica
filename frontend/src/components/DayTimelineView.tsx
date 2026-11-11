import React from 'react';
import { Appointment, EXAM_LABELS } from '../types';
import { Clock, Plus, CheckCircle2, FileEdit, ChevronLeft, ChevronRight, Info, XCircle } from 'lucide-react';

interface DayTimelineViewProps {
  selectedDate: string;
  onChangeDate: (date: string) => void;
  appointments: Appointment[];
  onSelectSlot: (time: string) => void;
  onOpenReport: (appointment: Appointment) => void;
  onOpenPreparation: (appointment: Appointment) => void;
  onCancelAppointment: (appointment: Appointment) => void;
}

export const DayTimelineView: React.FC<DayTimelineViewProps> = ({
  selectedDate,
  onChangeDate,
  appointments,
  onSelectSlot,
  onOpenReport,
  onOpenPreparation,
  onCancelAppointment,
}) => {
  // Slots de 30m das 08:00 às 18:00
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  // Utilitários de data (YYYY-MM-DD)
  const getFormattedDateString = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = getFormattedDateString(new Date());
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = getFormattedDateString(tomorrowDate);

  const activeDateStr = selectedDate || tomorrowStr;

  const shiftDate = (days: number) => {
    const [y, m, d] = activeDateStr.split('-').map(Number);
    const current = new Date(y, m - 1, d);
    current.setDate(current.getDate() + days);
    onChangeDate(getFormattedDateString(current));
  };

  const formattedDisplayDate = (() => {
    const [y, m, d] = activeDateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString('pt-BR', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  })();

  const appointmentsByTime = appointments.reduce((acc, appt) => {
    const d = new Date(appt.dateTime);
    const apptDateStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

    if (selectedDate && apptDateStr !== selectedDate) {
      return acc;
    }

    const timeStr = d.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    });
    if (!acc[timeStr] || appt.status === 'SCHEDULED') {
      acc[timeStr] = appt;
    }
    return acc;
  }, {} as Record<string, Appointment>);

  return (
    <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
      <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-slate-50/60">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Linha do Tempo da Sala Única • <span className="text-blue-700 capitalize">{formattedDisplayDate}</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Horários ocupados em vermelho • Horários livres em verde
          </p>
        </div>

        {/* Navegação rápida de dias */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded overflow-hidden text-[11px]">
            <button
              type="button"
              onClick={() => shiftDate(-1)}
              className="px-2 py-1 hover:bg-slate-50 text-slate-600 border-r border-slate-200 flex items-center"
              title="Dia anterior"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => onChangeDate(todayStr)}
              className={`px-2.5 py-1 font-medium border-r border-slate-200 transition ${
                activeDateStr === todayStr ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              Hoje
            </button>
            <button
              type="button"
              onClick={() => onChangeDate(tomorrowStr)}
              className={`px-2.5 py-1 font-medium border-r border-slate-200 transition ${
                activeDateStr === tomorrowStr ? 'bg-blue-50 text-blue-700 font-bold' : 'hover:bg-slate-50 text-slate-700'
              }`}
            >
              Amanhã
            </button>
            <button
              type="button"
              onClick={() => shiftDate(1)}
              className="px-2 py-1 hover:bg-slate-50 text-slate-600 flex items-center"
              title="Próximo dia"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2.5 text-[11px] pl-1">
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Livre
            </span>
            <span className="flex items-center gap-1 text-slate-700 font-medium">
              <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Ocupado
            </span>
          </div>
        </div>
      </div>

      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {timeSlots.map((slot) => {
          const appt = appointmentsByTime[slot];
          const isBooked = appt && appt.status === 'SCHEDULED';
          const isCancelled = appt && appt.status === 'CANCELLED';

          // HORÁRIO OCUPADO EM VERMELHO SUTIL E VISUAL (Rose/Red)
          if (isBooked) {
            const hasPublished = appt.report?.status === 'PUBLISHED';
            const hasDraft = appt.report?.status === 'DRAFT';

            return (
              <div
                key={slot}
                className="p-2.5 rounded border border-rose-300 bg-rose-50/60 flex flex-col justify-between transition hover:border-rose-400 hover:shadow-2xs min-h-[104px]"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-xs text-rose-950 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-rose-600" />
                      {slot}
                    </span>
                    <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-rose-200/80 text-rose-900">
                      Ocupado
                    </span>
                  </div>
                  <p className="font-semibold text-slate-900 text-xs truncate" title={appt.patient.name}>
                    {appt.patient.name}
                  </p>
                  <p className="text-[10px] text-slate-600 truncate">
                    {EXAM_LABELS[appt.examType] || appt.examType}
                  </p>
                </div>

                <div className="pt-2 border-t border-rose-200/80 mt-1.5 flex items-center justify-between gap-1">
                  <div className="text-[9px] font-medium">
                    {hasPublished && (
                      <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-2.5 h-2.5" /> Laudado
                      </span>
                    )}
                    {hasDraft && (
                      <span className="text-amber-700 font-semibold flex items-center gap-0.5">
                        <FileEdit className="w-2.5 h-2.5" /> Rascunho
                      </span>
                    )}
                    {!appt.report && <span className="text-rose-700 font-medium">Pendente</span>}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenPreparation(appt)}
                      title="Ver/Editar Preparo"
                      className="text-slate-600 hover:text-blue-700 p-0.5 rounded transition"
                    >
                      <Info className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenReport(appt)}
                      className="text-[10px] font-bold text-rose-800 hover:text-rose-950 underline"
                    >
                      Laudo
                    </button>
                    {!hasPublished && (
                      <button
                        type="button"
                        onClick={() => onCancelAppointment(appt)}
                        title="Cancelar Agendamento"
                        className="text-rose-600 hover:text-rose-900 p-0.5 rounded transition"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          }

          if (isCancelled) {
            return (
              <div
                key={slot}
                onClick={() => onSelectSlot(slot)}
                className="p-2.5 rounded border border-slate-200 bg-slate-50/80 hover:bg-emerald-50/40 hover:border-emerald-300 flex flex-col justify-between cursor-pointer transition min-h-[104px] group"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-xs text-slate-500">{slot}</span>
                    <span className="text-[9px] font-medium px-1 rounded bg-slate-200 text-slate-600">
                      Cancelado
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">Horário liberado</p>
                </div>

                <div className="pt-2 border-t border-slate-200 mt-1 flex items-center justify-between text-slate-400 group-hover:text-emerald-700">
                  <span className="text-[10px] font-medium">Reagendar</span>
                  <Plus className="w-3 h-3" />
                </div>
              </div>
            );
          }

          // HORÁRIO LIVRE EM VERDE
          return (
            <div
              key={slot}
              onClick={() => onSelectSlot(slot)}
              className="p-2.5 rounded border border-dashed border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/60 hover:border-emerald-400 flex flex-col justify-between cursor-pointer transition min-h-[104px] group"
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-xs text-emerald-900">{slot}</span>
                  <span className="text-[9px] font-semibold px-1 rounded bg-emerald-100 text-emerald-800">
                    Livre
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">Sala Disponível</p>
              </div>

              <div className="pt-2 border-t border-emerald-100 mt-1 flex items-center justify-between text-emerald-700 font-medium">
                <span className="text-[10px]">Agendar</span>
                <Plus className="w-3 h-3 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
