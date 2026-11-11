import { useState, useEffect, useCallback } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';

export function usePatients() {
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadPatients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<User[]>('/patients');
      setPatients(res.data);
    } catch (err: any) {
      toast.error('Erro ao listar pacientes para seleção.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  return { patients, loading, refetchPatients: loadPatients };
}
