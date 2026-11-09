# 🏥 Desafio Técnico - Agendamento de Exames e Acesso a Laudos

Aplicação web completa desenvolvida para gestão de agendamentos de exames clínicos, elaboração/publicação de laudos e portal de consulta para pacientes.

---

## 🚀 Tecnologias Utilizadas

- **Frontend:**
  - React 19 + TypeScript
  - Vite
  - Tailwind CSS v4
  - Lucide React (Ícones)
  - Axios

- **Backend:**
  - Node.js + TypeScript
  - Express
  - Prisma ORM
  - SQLite (Armazenamento local, sem necessidade de configurar serviços externos)
  - Zod (Validação de schemas)
  - JWT (JSON Web Tokens) & Bcrypt (Autenticação e segurança)
  - Vitest + Supertest (Testes automatizados e de integração)

---

## 🕒 Fuso Horário e Regras Temporais Adotadas

- **Fuso horário adotado:** `America/Sao_Paulo` (UTC-3).
- **Armazenamento:** Os horários são salvos e manipulados em formato ISO 8601 (UTC) no backend, garantindo consistência e integridade em requisições de API e interfaces de exibição.
- **Intervalos:** Agendamentos são restritos a **intervalos fixos de 30 minutos** (ex: `09:00`, `09:30`, `10:00`) em uma **sala única**.
- **Bloqueio no passado:** A API e a interface impedem o agendamento em datas ou horários passados.
- **Concorrência:** Transações com verificação de colisão garantem que duas requisições simultâneas para o mesmo horário nunca gerem duplicidade (apenas uma é aceita e a outra retorna `409 Conflict`). Reutilização de horários de exames cancelados é permitida.

---

## 👥 Perfis de Acesso e Regras de Negócio

1. **Equipe da Clínica (`CLINIC`):**
   - Agenda exames escolhendo paciente cadastrado, tipo de exame (Raio-X, Ultrassom, Ressonância Magnética) e horário.
   - Consulta e filtra agendamentos por **data** e/ou **paciente**.
   - Cancela agendamentos (desde que ainda não possuam laudo publicado).
   - Cadastra laudos com Título, Conteúdo e Nome do Profissional Responsável.
   - Salva laudos como **Rascunho** (`DRAFT`) ou **Publicado** (`PUBLISHED`).
   - Edita laudos enquanto forem rascunhos. Laudos já publicados tornam-se imutáveis.

2. **Paciente (`PATIENT`):**
   - Visualiza estritamente os **seus próprios** agendamentos com data, tipo de exame e situação.
   - Identifica se o laudo já foi publicado.
   - **Rascunhos nunca são disponibilizados para o paciente** (bloqueio tanto a nível de listagem quanto na rota individual de detalhe `GET /api/reports/:id`).
   - **Isolamento de acesso:** Um paciente é estritamente impedido de acessar agendamentos ou laudos de outros pacientes (retorna `403 Forbidden`).

---

## 🔑 Credenciais para Demonstração

O banco de dados de desenvolvimento já conta com dados semeados para testes imediatos:

| Perfil | Nome | E-mail | Senha | Descrição |
| :--- | :--- | :--- | :--- | :--- |
| **Clínica** | Recepcionista Maria | `clinica@demo.com` | `123456` | Acesso completo de gestão |
| **Paciente 1** | Carlos Alberto | `carlos@demo.com` | `123456` | Possui 1 laudo publicado e 1 em rascunho |
| **Paciente 2** | Juliana Silveira | `juliana@demo.com` | `123456` | Possui 1 agendamento sem laudo |

> **Dica:** Na tela de login há botões de **Acesso Rápido (1 clique)** para alternar entre os perfis instantaneamente.

---

## 🛠️ Como Instalar e Executar

### 1. Clonar o repositório
```bash
git clone https://github.com/brennoln/appclinica.git
cd appclinica
```

### 2. Configurar e Iniciar o Backend
```bash
cd backend
npm install

# Copiar arquivo de variáveis de ambiente
cp .env.example .env

# Sincronizar banco de dados SQLite e rodar o seed inicial
npx prisma db push
npm run db:seed

# Iniciar servidor em desenvolvimento (porta 3333)
npm run dev
```

### 3. Configurar e Iniciar o Frontend
Em outro terminal:
```bash
cd frontend
npm install

# Iniciar aplicação React (porta 5173)
npm run dev
```
Acesse a aplicação em seu navegador: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testes Automatizados

O projeto conta com uma suíte de testes de integração com **Vitest** cobrindo todos os cenários obrigatórios especificados no desafio:

1. **Tentativas simultâneas no mesmo horário:** Apenas uma aceita (`201`), a outra rejeitada (`409 Conflict`).
2. **Paciente tentando consultar laudo de outro paciente:** Acesso negado com `403 Forbidden`.
3. **Paciente tentando acessar laudo em rascunho:** Acesso negado com `403 Forbidden`.
4. **Publicação de laudo:** Laudo em rascunho é publicado pela clínica e passa a ficar acessível para o paciente correto.
5. **Tentativa de agendamento no passado:** Rejeitada com `400 Bad Request`.
6. **Reutilização de horário:** Horário de um agendamento cancelado pode ser reutilizado por outro paciente.

Para executar os testes:
```bash
cd backend
npm test
```

---

## 💡 Decisões Técnicas, Limitações e Pendências

### Decisões Técnicas:
- **Prisma com SQLite:** Escolhido para permitir que qualquer avaliador execute o projeto localmente com `npm run dev` imediatamente, dispensando instalação de instâncias Docker ou servidores PostgreSQL/MySQL externos. A modelagem em TypeScript e schema do Prisma permite migrar para PostgreSQL trocando apenas o provider no arquivo `.env`.
- **Validação com Zod e Tratamento de Concorrência:** As regras de agendamento são validadas na borda com Zod e persistidas através de transações atômicas no Prisma para evitar condições de corrida (*race conditions*) em acessos concorrentes.
- **Autorização em Camadas:** O backend não confia no frontend. Toda rota valida JWT e permissões de perfil (`roleMiddleware`).

### Limitações e Pendências Futuras:
- **Notificações:** Envio de e-mail ou SMS quando um laudo for publicado.
- **Múltiplas Salas / Médicos:** Expansão do modelo para permitir N salas e especialidades concorrentes.
- **Exportação de Laudos em PDF:** Geração de documento PDF assinado digitalmente com certificado ICP-Brasil (conforme sugerido no escopo de simplificação do desafio).

---

## ⏱️ Tempo Dedicado ao Exercício
- **Tempo aproximado dedicado:** ~6 horas (planejamento da arquitetura, implementação da API e regras de negócio, testes automatizados e interface com React e Tailwind).
