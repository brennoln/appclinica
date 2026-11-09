import { ExamType } from '../types';

export interface PreparationTemplate {
  id: string;
  label: string;
  text: string;
}

export const PREPARATION_TEMPLATES: Record<ExamType, PreparationTemplate[]> = {
  RAIO_X: [
    {
      id: 'rx-padrao',
      label: 'Raio-X Padrão (Sem metal)',
      text: 'Vir com roupas sem botões ou detalhes metálicos na região do exame. Retirar colares, piercings e adereços metálicos antes de entrar na sala. Não requer jejum.',
    },
    {
      id: 'rx-com-contraste',
      label: 'Raio-X Contrastado',
      text: 'Jejum absoluto de 4 horas. Ingerir 500ml de água até 2h antes do procedimento. Informar histórico de alergia a contrastes eodados.',
    },
  ],
  ULTRASSOM: [
    {
      id: 'us-abdome',
      label: 'Ultrassom Abdome Total (Jejum + Bexiga Cheia)',
      text: 'Jejum absoluto de 6 a 8 horas. Beber 4 a 5 copos de água 1 hora antes do exame e reter a urina para manter a bexiga adequadamente distendida.',
    },
    {
      id: 'us-geral',
      label: 'Ultrassom Pélvico / Vias Urinárias',
      text: 'Não requer jejum alimentar. Ingerir 1 litro de água 1 hora antes do horário marcado e segurar a urina.',
    },
    {
      id: 'us-articular',
      label: 'Ultrassom Articular / Tireoide',
      text: 'Não necessita de jejum ou preparo especial. Vestir roupas confortáveis e de fácil acesso à região examinada.',
    },
  ],
  RESSONANCIA_MAGNETICA: [
    {
      id: 'rm-padrao',
      label: 'Ressonância Geral (Segurança Magnética)',
      text: 'Chegar com 20 minutos de antecedência para preencher o formulário de segurança. Não usar cosméticos ou maquiagem com pigmentos metálicos. Retirar todos os metais e cartões magnéticos.',
    },
    {
      id: 'rm-contraste',
      label: 'Ressonância com Contraste (Gadolíneo)',
      text: 'Jejum alimentar de 4 horas. Apresentar exame recente de Creatinina (últimos 60 dias). Hidratação normal com água permitida até 2h antes.',
    },
  ],
};
