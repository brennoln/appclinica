import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import cors from 'cors';
import { routes } from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';

export const app = express();

app.use(cors());
app.use(express.json());

// Rota de status e fuso horário documentado
app.get('/api/info', (_req, res) => {
  res.json({
    name: 'Clínica MedVida API - Agendamentos e Laudos',
    timezone: process.env.TIMEZONE || 'America/Sao_Paulo',
    serverTime: new Date().toISOString(),
    status: 'online',
  });
});

app.use('/api', routes);

// Middleware global de tratamento de erros
app.use(errorHandler);

const PORT = process.env.PORT || 3333;

if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
    console.log(`🕒 Fuso horário configurado: ${process.env.TIMEZONE || 'America/Sao_Paulo'}`);
  });
}
