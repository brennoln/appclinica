import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/server.js';
import { prisma } from '../src/config/database.js';

let clinicToken: string;
let patient1Token: string;
let patient2Token: string;
let patient1Id: string;
let patient2Id: string;

beforeAll(async () => {
  // Login como Clínica
  const clinicRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'clinica@demo.com', password: '123456' });
  clinicToken = clinicRes.body.token;

  // Login como Paciente 1 (Carlos)
  const p1Res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'carlos@demo.com', password: '123456' });
  patient1Token = p1Res.body.token;
  patient1Id = p1Res.body.user.id;

  // Login como Paciente 2 (Juliana)
  const p2Res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'juliana@demo.com', password: '123456' });
  patient2Token = p2Res.body.token;
  patient2Id = p2Res.body.user.id;
});

describe('Desafio Técnico - Testes Automatizados Obrigatórios', () => {

  // Cenário 5: Uma tentativa de agendar no passado é rejeitada.
  it('5. Deve rejeitar uma tentativa de agendar no passado', async () => {
    const pastDate = new Date('2020-01-01T10:00:00.000Z');

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: pastDate.toISOString(),
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/passada/i);
  });

  // Cenário 1: Duas tentativas simultâneas de agendamento no mesmo horário: apenas uma deve ser aceita.
  it('1. Duas tentativas simultâneas de agendamento no mesmo horário: apenas uma deve ser aceita', async () => {
    // Escolhe um horário bem no futuro para não colidir com o seed
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 10);
    targetDate.setHours(14, 0, 0, 0); // 14:00

    const p1 = request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: targetDate.toISOString(),
      });

    const p2 = request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient2Id,
        examType: 'ULTRASSOM',
        dateTime: targetDate.toISOString(),
      });

    const results = await Promise.all([p1, p2]);
    const statuses = results.map((r) => r.status);

    // Um deve ser aceito (201) e o outro rejeitado por conflito (409)
    expect(statuses).toContain(201);
    expect(statuses).toContain(409);
  });

  // Cenário 2: Um paciente tenta consultar um laudo de outro paciente: o acesso deve ser negado.
  it('2. Um paciente tenta consultar um laudo de outro paciente: o acesso deve ser negado (403)', async () => {
    // Cria um agendamento e laudo publicado para o Paciente 1 (Carlos)
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 11);
    futureDate.setHours(10, 0, 0, 0);

    const apptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: futureDate.toISOString(),
      });

    const reportRes = await request(app)
      .post(`/api/appointments/${apptRes.body.id}/report`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        title: 'Laudo Privado de Carlos',
        content: 'Conteúdo médico confidencial.',
        doctorName: 'Dr. Silveira',
        status: 'PUBLISHED',
      });

    const reportId = reportRes.body.id;

    // Paciente 2 (Juliana) tenta acessar o laudo de Carlos
    const unauthorizedRes = await request(app)
      .get(`/api/reports/${reportId}`)
      .set('Authorization', `Bearer ${patient2Token}`);

    expect(unauthorizedRes.status).toBe(403);
    expect(unauthorizedRes.body.error).toMatch(/pertence a outro paciente/i);
  });

  // Cenário 3: Um paciente tenta acessar um rascunho: seu conteúdo não deve ser disponibilizado.
  it('3. Um paciente tenta acessar um rascunho do seu próprio exame: seu conteúdo não deve ser disponibilizado', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 12);
    futureDate.setHours(11, 30, 0, 0);

    const apptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'ULTRASSOM',
        dateTime: futureDate.toISOString(),
      });

    const reportRes = await request(app)
      .post(`/api/appointments/${apptRes.body.id}/report`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        title: 'Rascunho de Laudo',
        content: 'Notas preliminares do radiologista.',
        doctorName: 'Dr. Investigador',
        status: 'DRAFT',
      });

    const draftId = reportRes.body.id;

    // Paciente 1 tenta acessar o laudo em status DRAFT diretamente
    const accessDraftRes = await request(app)
      .get(`/api/reports/${draftId}`)
      .set('Authorization', `Bearer ${patient1Token}`);

    expect(accessDraftRes.status).toBe(403);
    expect(accessDraftRes.body.error).toMatch(/rascunho/i);
  });

  // Cenário 4: Um laudo é publicado e passa a estar disponível para o paciente correto.
  it('4. Um laudo é publicado e passa a estar disponível para o paciente correto', async () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 13);
    futureDate.setHours(15, 0, 0, 0);

    const apptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RESSONANCIA_MAGNETICA',
        dateTime: futureDate.toISOString(),
      });

    // 1. Cria como Rascunho
    const draftRes = await request(app)
      .post(`/api/appointments/${apptRes.body.id}/report`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        title: 'Ressonância Crânio',
        content: 'Aguardando laudo final.',
        doctorName: 'Dra. Neurologista',
        status: 'DRAFT',
      });

    const reportId = draftRes.body.id;

    // Paciente não tem acesso ao rascunho
    const p1Before = await request(app)
      .get(`/api/reports/${reportId}`)
      .set('Authorization', `Bearer ${patient1Token}`);
    expect(p1Before.status).toBe(403);

    // 2. Clínica publica o laudo
    const publishRes = await request(app)
      .put(`/api/reports/${reportId}`)
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        title: 'Ressonância Crânio - Finalizado',
        content: 'Exame dentro dos padrões da normalidade.',
        doctorName: 'Dra. Neurologista',
        status: 'PUBLISHED',
      });
    expect(publishRes.status).toBe(200);
    expect(publishRes.body.status).toBe('PUBLISHED');
    expect(publishRes.body.publishedAt).toBeDefined();

    // 3. Paciente agora consegue ler o laudo publicado
    const p1After = await request(app)
      .get(`/api/reports/${reportId}`)
      .set('Authorization', `Bearer ${patient1Token}`);

    expect(p1After.status).toBe(200);
    expect(p1After.body.title).toBe('Ressonância Crânio - Finalizado');
    expect(p1After.body.content).toBe('Exame dentro dos padrões da normalidade.');
  });

  // Regra extra: Reutilizar horário de agendamento cancelado
  it('Deve permitir reutilizar o horário de um agendamento cancelado', async () => {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 14);
    targetDate.setHours(16, 0, 0, 0);

    // 1. Cria agendamento inicial
    const appt1 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient1Id,
        examType: 'RAIO_X',
        dateTime: targetDate.toISOString(),
      });
    expect(appt1.status).toBe(201);

    // 2. Cancela o agendamento
    const cancelRes = await request(app)
      .patch(`/api/appointments/${appt1.body.id}/cancel`)
      .set('Authorization', `Bearer ${clinicToken}`);
    expect(cancelRes.status).toBe(200);

    // 3. Reutiliza o mesmo horário com outro paciente
    const appt2 = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${clinicToken}`)
      .send({
        patientId: patient2Id,
        examType: 'ULTRASSOM',
        dateTime: targetDate.toISOString(),
      });
    expect(appt2.status).toBe(201);
    expect(appt2.body.id).not.toBe(appt1.body.id);
  });
});
