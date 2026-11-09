import { useState, useEffect, useCallback } from 'react';
import { Appointment } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';

interface UseAppointmentsFilter {
  date?: string;
  patientId?: string;
}

export function useAppointments(filters?: UseAppointmentsFilter) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      if (filters?.date) params.date = filters.date;
      if (filters?.patientId) params.patientId = filters.patientId;

      const res = await api.get<Appointment[]>('/appointments', { params });
      setAppointments(res.data);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Não foi possível carregar os agendamentos.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [filters?.date, filters?.patientId]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const cancelAppointment = async (id: string): Promise<boolean> => {
    try {
      await api.patch(`/appointments/${id}/cancel`);
      toast.success('Agendamento cancelado com sucesso.');
      await fetchAppointments();
      return true;
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao cancelar agendamento.';
      toast.error(msg);
      return false;
    }
  };

  return {
    appointments,
    loading,
    error,
    refetch: fetchAppointments,
    cancelAppointment,
  };
}
