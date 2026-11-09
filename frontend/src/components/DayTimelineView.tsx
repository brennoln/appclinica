import React from 'react';
import { Appointment, EXAM_LABELS } from '../types';
import { Clock, Plus, CheckCircle2, FileEdit, XCircle, User, AlertCircle } from 'lucide-react';

interface DayTimelineViewProps {
  selectedDate: string;
  appointments: Appointment[];
  onSelectSlot: (time: string) => void;
  onOpenReport: (appointment: Appointment) => void;
}

export const DayTimelineView: React.FC<DayTimelineViewProps> = ({
  selectedDate,
  appointments,
  onSelectSlot,
  onOpenReport,
}) => {
  // Slots de 30m das 08:00 às 18:00
  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const appointmentsByTime = appointments.reduce((acc, appt) => {
    const d = new Date(appt.dateTime);
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
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50/60">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Linha do Tempo da Sala Única
          </h3>
          <p className="text-[11px] text-slate-500">
            Horários ocupados em vermelho • Horários livres em verde
          </p>
        </div>
        <div className="flex items-center gap-3 text-[11px]">
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-emerald-500" /> Disponível
          </span>
          <span className="flex items-center gap-1.5 text-slate-700 font-medium">
            <span className="w-2.5 h-2.5 rounded bg-rose-500" /> Ocupado
          </span>
          <span className="flex items-center gap-1.5 text-slate-400">
            <span className="w-2.5 h-2.5 rounded bg-slate-300" /> Cancelado
          </span>
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
                className="p-2.5 rounded border border-rose-300 bg-rose-50/60 flex flex-col justify-between transition hover:border-rose-400 hover:shadow-2xs min-h-[96px]"
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

                <div className="pt-2 border-t border-rose-200/80 mt-1 flex items-center justify-between">
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

                  <button
                    onClick={() => onOpenReport(appt)}
                    className="text-[10px] font-bold text-rose-800 hover:text-rose-950 underline"
                  >
                    Laudo
                  </button>
                </div>
              </div>
            );
          }

          if (isCancelled) {
            return (
              <div
                key={slot}
                onClick={() => onSelectSlot(slot)}
                className="p-2.5 rounded border border-slate-200 bg-slate-50/80 hover:bg-emerald-50/40 hover:border-emerald-300 flex flex-col justify-between cursor-pointer transition min-h-[96px] group"
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
              className="p-2.5 rounded border border-dashed border-emerald-300 bg-emerald-50/20 hover:bg-emerald-50/60 hover:border-emerald-400 flex flex-col justify-between cursor-pointer transition min-h-[96px] group"
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
