import { useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../services/api';
import { toast } from 'sonner';

export function usePatients() {
  const [patients, setPatients] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadPatients() {
      try {
        const res = await api.get<User[]>('/patients');
        setPatients(res.data);
      } catch (err: any) {
        toast.error('Erro ao listar pacientes para seleção.');
      } finally {
        setLoading(false);
      }
    }
    loadPatients();
  }, []);

  return { patients, loading };
}
