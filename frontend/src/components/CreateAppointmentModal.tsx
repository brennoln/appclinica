import React, { useState, useEffect, useRef } from 'react';
import { ExamType, EXAM_LABELS, User } from '../types';
import { api } from '../services/api';
import { Calendar, Clock, User as UserIcon, Activity, PlusCircle, X } from 'lucide-react';
import { toast } from 'sonner';

interface CreateAppointmentModalProps {
  patients: User[];
  onClose: () => void;
  onCreated: () => void;
}

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  patients,
  onClose,
  onCreated,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const formattedDate = tomorrow.toISOString().split('T')[0];

  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [examType, setExamType] = useState<ExamType>('RAIO_X');
  const [date, setDate] = useState(formattedDate);
  const [time, setTime] = useState('09:00');
  const [loading, setLoading] = useState(false);
  const selectPatientRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    selectPatientRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const timeSlots = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30',
    '11:00', '11:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      toast.warning('Selecione um paciente cadastrado.');
      return;
    }

    const isoDateTime = `${date}T${time}:00.000Z`;
    const selectedDate = new Date(isoDateTime);
    const now = new Date();

    if (selectedDate.getTime() <= now.getTime()) {
      toast.error('Não é permitido agendar em datas ou horários passados.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/appointments', {
        patientId,
        examType,
        dateTime: isoDateTime,
      });
      toast.success('Agendamento realizado com sucesso!');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao realizar agendamento.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-appt-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-blue-600 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PlusCircle className="w-5 h-5 text-white" aria-hidden="true" />
            <h2 id="create-appt-title" className="font-bold text-lg text-white">
              Novo Agendamento de Exame
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar janela de novo agendamento"
            className="text-blue-100 hover:text-white p-1 rounded-lg hover:bg-blue-700 focus:outline-hidden focus:ring-2 focus:ring-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div
            role="note"
            className="bg-blue-50 border-l-4 border-blue-500 p-3.5 rounded-r-lg text-xs text-blue-900 leading-relaxed"
          >
            <strong>Regra da Clínica:</strong> Sala única com intervalos de 30 minutos. Horários já ocupados são validados em tempo real pelo backend.
          </div>

          <div>
            <label htmlFor="select-patient" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              Paciente <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-patient"
              ref={selectPatientRef}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="select-exam" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
              Tipo de Exame <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-exam"
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamType)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
            >
              {Object.entries(EXAM_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="input-date" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                Data <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              />
            </div>

            <div>
              <label htmlFor="select-slot" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                Horário (Fixo 30m) <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-slot"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-lg text-sm text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-lg text-xs font-semibold focus:outline-hidden focus:ring-2 focus:ring-slate-400 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            >
              {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
