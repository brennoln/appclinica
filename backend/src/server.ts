import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { routes } from './routes/index.js';

dotenv.config();

export const app = express();

app.use(cors());
app.use(express.json());

// Documentação do fuso horário na rota de status / info
app.get('/api/info', (_req, res) => {
  res.json({
    name: 'Clínica API - Agendamentos e Laudos',
    timezone: process.env.TIMEZONE || 'America/Sao_Paulo',
    serverTime: new Date().toISOString(),
    status: 'online',
  });
});

app.use('/api', routes);

const PORT = process.env.PORT || 3333;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🕒 Fuso horário configurado: ${process.env.TIMEZONE || 'America/Sao_Paulo'}`);
  });
}
