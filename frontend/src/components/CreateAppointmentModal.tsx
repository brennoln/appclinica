import React, { useState, useEffect, useRef } from 'react';
import { ExamType, EXAM_LABELS, User } from '../types';
import { PREPARATION_TEMPLATES } from '../data/examInstructions';
import { api } from '../services/api';
import { Calendar, Clock, User as UserIcon, Activity, Plus, X, FileText, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

interface CreateAppointmentModalProps {
  patients: User[];
  initialTime?: string;
  initialDate?: string;
  onClose: () => void;
  onCreated: () => void;
}

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  patients,
  initialTime = '09:00',
  initialDate,
  onClose,
  onCreated,
}) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  const defaultDate = `${year}-${month}-${day}`;

  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [examType, setExamType] = useState<ExamType>('RAIO_X');
  const [date, setDate] = useState(initialDate || defaultDate);
  const [time, setTime] = useState(initialTime);
  const [preparationNotes, setPreparationNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const selectPatientRef = useRef<HTMLSelectElement>(null);

  // Carrega o primeiro template padrão quando o tipo de exame muda
  useEffect(() => {
    const defaultTemplate = PREPARATION_TEMPLATES[examType]?.[0];
    if (defaultTemplate && !preparationNotes) {
      setPreparationNotes(defaultTemplate.text);
    }
  }, [examType]);

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

  const handleApplyTemplate = (text: string) => {
    setPreparationNotes(text);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      toast.warning('Selecione um paciente cadastrado.');
      return;
    }

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
        preparationNotes: preparationNotes.trim() || undefined,
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

  const availableTemplates = PREPARATION_TEMPLATES[examType] || [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="create-appt-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-2xs p-4 overflow-y-auto"
    >
      <div className="bg-white rounded-lg shadow-lg border border-slate-200 w-full max-w-lg overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-100">
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-600" aria-hidden="true" />
            <h2 id="create-appt-title" className="font-semibold text-xs uppercase tracking-wider text-slate-800">
              Novo Agendamento Clínico
            </h2>
          </div>
          <button
            onClick={onClose}
            aria-label="Fechar janela"
            className="text-slate-400 hover:text-slate-600 p-1 rounded transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[80vh] overflow-y-auto">
          <div>
            <label htmlFor="select-patient" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Paciente <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-patient"
              ref={selectPatientRef}
              value={patientId}
              onChange={(e) => setPatientId(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
            >
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="select-exam" className="block text-[11px] font-semibold text-slate-700 mb-1">
              Tipo de Exame <span className="text-rose-500">*</span>
            </label>
            <select
              id="select-exam"
              value={examType}
              onChange={(e) => {
                const newType = e.target.value as ExamType;
                setExamType(newType);
                const firstTemplate = PREPARATION_TEMPLATES[newType]?.[0];
                if (firstTemplate) setPreparationNotes(firstTemplate.text);
              }}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
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
              <label htmlFor="input-date" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Data <span className="text-rose-500">*</span>
              </label>
              <input
                id="input-date"
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
              />
            </div>

            <div>
              <label htmlFor="select-slot" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Horário (Fixo 30m) <span className="text-rose-500">*</span>
              </label>
              <select
                id="select-slot"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-900 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition"
              >
                {timeSlots.map((slot) => (
                  <option key={slot} value={slot}>
                    {slot}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Orientações e Preparo do Exame passados pela Clínica */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="prep-notes" className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Recomendações e Preparo para o Paciente</span>
              </label>
              <span className="text-[10px] text-slate-400">Modelos rápidos</span>
            </div>

            {/* Modelos rápidos pré-definidos */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {availableTemplates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tpl.text)}
                  className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                  title="Aplicar modelo de recomendação"
                >
                  + {tpl.label}
                </button>
              ))}
            </div>

            <textarea
              id="prep-notes"
              rows={3}
              value={preparationNotes}
              onChange={(e) => setPreparationNotes(e.target.value)}
              placeholder="Instruções de jejum, vestimentas e cuidados que o paciente visualizará no portal..."
              className="w-full p-2.5 bg-white border border-slate-200 rounded text-xs text-slate-800 focus:ring-1 focus:ring-blue-600 focus:border-blue-600 outline-none transition leading-relaxed resize-none"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Essas orientações ficarão visíveis para o paciente no botão "Como se preparar" do portal dele.
            </p>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded text-xs font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-medium rounded transition"
            >
              {loading ? 'Confirmando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
