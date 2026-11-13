import React, { useState, useEffect, useRef } from 'react';
import { Appointment, ExamType, EXAM_LABELS, User } from '../types';
import { PREPARATION_TEMPLATES } from '../data/examInstructions';
import { api } from '../services/api';
import { Plus, X, FileText, UserPlus, Check } from 'lucide-react';
import { toast } from 'sonner';

interface CreateAppointmentModalProps {
  patients: User[];
  appointments?: Appointment[];
  initialTime?: string;
  initialDate?: string;
  onClose: () => void;
  onCreated: () => void;
  onPatientCreated?: () => void;
}

export const CreateAppointmentModal: React.FC<CreateAppointmentModalProps> = ({
  patients,
  appointments = [],
  initialTime = '09:00',
  initialDate,
  onClose,
  onCreated,
  onPatientCreated,
}) => {
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const defaultDate = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(tomorrow);

  const [patientId, setPatientId] = useState(patients[0]?.id || '');
  const [examType, setExamType] = useState<ExamType>('RAIO_X');
  const [date, setDate] = useState(initialDate || defaultDate);
  const [time, setTime] = useState(initialTime);
  const [preparationNotes, setPreparationNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Cadastro rápido de paciente inline
  const [showNewPatientForm, setShowNewPatientForm] = useState(false);
  const [newPatientName, setNewPatientName] = useState('');
  const [newPatientEmail, setNewPatientEmail] = useState('');
  const [creatingPatient, setCreatingPatient] = useState(false);

  const selectPatientRef = useRef<HTMLSelectElement>(null);

  useEffect(() => {
    if (!patientId && patients.length > 0) {
      setPatientId(patients[0].id);
    }
  }, [patients, patientId]);

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

  // Identifica os horários já ocupados na data selecionada (America/Sao_Paulo)
  const occupiedSlotsForSelectedDate = new Set<string>();
  appointments.forEach((appt) => {
    if (appt.status !== 'SCHEDULED') return;
    const d = new Date(appt.dateTime);
    const apptDateParts = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
    if (apptDateParts === date) {
      const slotStr = d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'America/Sao_Paulo',
      });
      occupiedSlotsForSelectedDate.add(slotStr);
    }
  });

  const handleApplyTemplate = (text: string) => {
    setPreparationNotes(text);
  };

  const handleCreateQuickPatient = async () => {
    if (!newPatientName.trim() || !newPatientEmail.trim()) {
      toast.warning('Informe o nome e o e-mail do novo paciente.');
      return;
    }
    setCreatingPatient(true);
    try {
      const res = await api.post<User>('/patients', {
        name: newPatientName.trim(),
        email: newPatientEmail.trim(),
      });
      toast.success(`Paciente ${res.data.name} cadastrado! (Senha padrão: 123456)`);
      onPatientCreated?.();
      setPatientId(res.data.id);
      setShowNewPatientForm(false);
      setNewPatientName('');
      setNewPatientEmail('');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Erro ao cadastrar paciente.');
    } finally {
      setCreatingPatient(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!patientId) {
      toast.warning('Selecione um paciente cadastrado.');
      return;
    }

    // Constrói o instante exato no fuso oficial da clínica (America/Sao_Paulo, UTC-3),
    // independentemente do fuso horário configurado no navegador do usuário.
    const clinicDateTime = new Date(`${date}T${time}:00.000-03:00`);

    const now = new Date();
    if (clinicDateTime.getTime() <= now.getTime()) {
      toast.error('Não é permitido agendar em datas ou horários passados.');
      return;
    }

    const isoString = clinicDateTime.toISOString();

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

        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 max-h-[82vh] overflow-y-auto">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="select-patient" className="block text-[11px] font-semibold text-slate-700">
                Paciente <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setShowNewPatientForm(!showNewPatientForm)}
                className="inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800"
              >
                <UserPlus className="w-3 h-3" />
                <span>{showNewPatientForm ? 'Cancelar novo cadastro' : '+ Cadastrar novo paciente'}</span>
              </button>
            </div>

            {showNewPatientForm ? (
              <div className="p-3 bg-blue-50/50 border border-blue-200 rounded space-y-2 mb-2">
                <p className="text-[10px] font-bold uppercase text-blue-900">Cadastro Rápido de Paciente</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nome completo"
                    value={newPatientName}
                    onChange={(e) => setNewPatientName(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                  <input
                    type="email"
                    placeholder="E-mail (ex: paciente@demo.com)"
                    value={newPatientEmail}
                    onChange={(e) => setNewPatientEmail(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-900 outline-none focus:border-blue-600"
                  />
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[10px] text-slate-500">Senha inicial de acesso: <strong>123456</strong></span>
                  <button
                    type="button"
                    disabled={creatingPatient}
                    onClick={handleCreateQuickPatient}
                    className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[11px] font-semibold transition"
                  >
                    <Check className="w-3 h-3" />
                    <span>{creatingPatient ? 'Salvando...' : 'Salvar Paciente'}</span>
                  </button>
                </div>
              </div>
            ) : (
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
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

            <div>
              <label htmlFor="input-date" className="block text-[11px] font-semibold text-slate-700 mb-1">
                Data do Exame <span className="text-rose-500">*</span>
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
          </div>

          {/* Seletor visual de horários de 30m com indicação em vermelho dos ocupados */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-[11px] font-semibold text-slate-700">
                Horário da Sala (Intervalos de 30m) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center gap-2 text-[10px]">
                <span className="flex items-center gap-1 text-emerald-700 font-medium">
                  <span className="w-2 h-2 rounded-xs bg-emerald-500" /> Livre
                </span>
                <span className="flex items-center gap-1 text-rose-700 font-medium">
                  <span className="w-2 h-2 rounded-xs bg-rose-500" /> Ocupado
                </span>
              </div>
            </div>

            <div className="grid grid-cols-6 gap-1.5">
              {timeSlots.map((slot) => {
                const isOccupied = occupiedSlotsForSelectedDate.has(slot);
                const isSelected = time === slot;

                if (isOccupied) {
                  return (
                    <button
                      key={slot}
                      type="button"
                      disabled
                      title="Horário já ocupado nesta data"
                      className="py-1.5 px-1 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-300 cursor-not-allowed opacity-85 line-through"
                    >
                      {slot}
                    </button>
                  );
                }

                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => setTime(slot)}
                    className={`py-1.5 px-1 rounded text-[11px] font-semibold border transition ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                        : 'bg-emerald-50/40 text-emerald-900 border-emerald-200 hover:bg-emerald-100/60'
                    }`}
                  >
                    {slot}
                  </button>
                );
              })}
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
              disabled={loading || occupiedSlotsForSelectedDate.has(time)}
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
