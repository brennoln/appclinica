import React, { useState, useEffect, useRef } from 'react';
import { ExamType, EXAM_LABELS, User } from '../types';
import { api } from '../services/api';
import { Calendar, Clock, User as UserIcon, Activity, PlusCircle, X, ShieldAlert } from 'lucide-react';
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
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const formattedDate = `${year}-${month}-${day}`;

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

    // Cria o objeto Date considerando o fuso horário local do usuário (-03:00)
    // Converte de forma exata para ISO 8601 sem descolamento de 3 horas
    const [hours, minutes] = time.split(':').map(Number);
    const [yearVal, monthVal, dayVal] = date.split('-').map(Number);
    const localDateTime = new Date(yearVal, monthVal - 1, dayVal, hours, minutes, 0, 0);

    const now = new Date();
    if (localDateTime.getTime() <= now.getTime()) {
      toast.error('Não é permitido agendar em datas ou horários passados.');
      return;
    }

    const isoString = localDateTime.toISOString();

    setLoading(true);
    try {
      await api.post('/appointments', {
        patientId,
        examType,
        dateTime: isoString,
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
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/10 rounded-2xl backdrop-blur-md">
              <PlusCircle className="w-6 h-6 text-white" aria-hidden="true" />
            </div>
            <div>
              <h2 id="create-appt-title" className="font-bold text-lg text-white">
                Novo Agendamento Clínico
              </h2>
              <p className="text-xs text-blue-100">Grade de horários da Sala de Diagnóstico</p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar janela de novo agendamento"
            className="text-white/80 hover:text-white p-2 rounded-xl hover:bg-white/10 focus:outline-hidden focus:ring-2 focus:ring-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div
            role="note"
            className="bg-blue-50/70 border border-blue-200/60 p-4 rounded-2xl text-xs text-blue-900 leading-relaxed flex items-start gap-3"
          >
            <ShieldAlert className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-0.5">Política de Agendamento</p>
              Intervalos fixos de 30 minutos em sala única. Fuso horário de referência: <strong>America/Sao_Paulo (UTC-3)</strong>.
            </div>
          </div>

          <div>
            <label htmlFor="select-patient" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <UserIcon className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              Paciente <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-patient"
              ref={selectPatientRef}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="select-exam" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
              Tipo de Exame <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-exam"
              value={examType}
              onChange={(e) => setExamType(e.target.value as ExamType)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
            >
              {Object.entries(EXAM_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="input-date" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                Data <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="select-slot" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-blue-600" aria-hidden="true" />
                Horário (Local) <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-slot"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-bold focus:outline-hidden focus:ring-2 focus:ring-slate-400 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 focus:outline-hidden focus:ring-2 focus:ring-blue-500 transition"
            >
              {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
