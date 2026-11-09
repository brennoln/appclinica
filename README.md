# 🏥 Sistema de Gestão Clínica - Agendamento de Exames e Acesso a Laudos

Aplicação web desenvolvida com foco em **arquitetura limpa**, **acessibilidade (WCAG)**, **robustez de regras de negócio** e **testes automatizados**, desenhada para ser explicada com clareza em sessões de **Live Coding**.

---

## 🚀 Tecnologias Utilizadas

### Frontend
- **React 19 + TypeScript**: Interfaces declarativas e tipagem estrita de ponta a ponta.
- **Tailwind CSS v4**: Design system moderno com tokens de alto contraste e estados interativos visíveis.
- **Custom Hooks (`useAppointments`, `usePatients`)**: Desacoplamento da camada de dados e lógica da UI.
- **Sonner**: Notificações Toast acessíveis e não intrusivas para o usuário.
- **Lucide Icons**: Ícones semânticos com atributos `aria-hidden` para leitores de tela.
- **Acessibilidade (WCAG 2.1 AA)**:
  - Navegação completa por teclado com armadilha de foco em modais e tecla `Escape` para fechar.
  - Regiões semânticas (`<main>`, `<section>`, `<article>`, `role="dialog"`, `aria-labelledby`, `aria-describedby`).
  - Cores com contraste verificado e textos com tamanhos legíveis para pacientes e profissionais.
  - Modal de confirmação acessível substituindo caixas de diálogo nativas (`window.confirm`).

### Backend
- **Node.js + TypeScript + Express**: Servidor HTTP estruturado em arquitetura em camadas (**Controller - Service - Repository**).
- **Prisma ORM com SQLite**: Persistência relacional sem necessidade de dependências pesadas externas.
- **Zod**: Validação estrita de contratos de dados em runtime.
- **JWT & Bcrypt**: Autenticação com hash de senha seguro e autorização por perfis (`CLINIC` e `PATIENT`) validada a nível de rota HTTP.
- **Vitest & Supertest**: Testes automatizados (unitários com mocks e de integração E2E com banco de dados isolado).
- **Docker & Docker Compose**: Empacotamento completo para subir a solução em qualquer ambiente com um comando.

---

## 🕒 Fuso Horário e Regras Temporais Adotadas

- **Fuso horário padrão:** `America/Sao_Paulo` (UTC-3).
- **Formato de Trânsito:** ISO 8601 UTC nos payloads da API.
- **Sala Única & Intervalos de 30 minutos:**
  - O sistema opera com uma única sala de exames.
  - Intervalos estritamente múltiplos de 30 minutos (`08:00`, `08:30`, `09:00`, etc.).
  - Tentativas com minutos quebrados (ex: `09:15`) são rejeitadas pela validação de domínio.
- **Tratamento de Concorrência:**
  - Bloqueio de agendamento duplicado por transação atômica do Prisma.
  - Duas requisições simultâneas no mesmo horário: apenas 1 é aprovada (`201 Created`), enquanto a concorrente recebe `409 Conflict`.
  - Reutilização de horários: Agendamentos cancelados liberam o horário automaticamente para novas marcações.
- **Bloqueio no Passado:** Agendamentos para datas ou horários anteriores ao momento da requisição são rejeitados (`400 Bad Request`).

---

## 📋 Regras de Negócio Implementadas

### Equipe da Clínica (`CLINIC`)
- Visualiza todos os agendamentos, com filtros por **data** e por **paciente**.
- Agenda exames escolhendo paciente cadastrado, tipo de exame (`RAIO_X`, `ULTRASSOM`, `RESSONANCIA_MAGNETICA`) e horário.
- Cancela agendamentos (desde que o laudo **não** tenha sido publicado).
- Elabora laudos (Título, Parecer Clínico e Nome do Médico).
- Pode salvar laudo como **Rascunho** (`DRAFT`) ou **Publicar** (`PUBLISHED`).
- Edita laudos enquanto em rascunho. Laudos publicados são **imutáveis**.

### Paciente (`PATIENT`)
- Visualiza **estritamente seus próprios exames** (o backend filtra automaticamente pelo ID do token JWT).
- Identifica se o laudo já foi liberado.
- **Proteção de Rascunhos:** Rascunhos **não** são expostos na listagem do paciente nem podem ser acessados via API (`403 Forbidden`).
- **Isolamento entre Pacientes:** Tentativa de um paciente acessar laudo de outro resulta em `403 Forbidden`.
- Opção acessível para visualização e impressão do laudo oficial.

---

## 🔑 Credenciais para Demonstração (Demo)

| Perfil | Nome | E-mail | Senha | Cenário Pré-carregado |
| :--- | :--- | :--- | :--- | :--- |
| **Clínica** | Maria Recepcionista | `clinica@demo.com` | `123456` | Acesso administrativo completo |
| **Paciente 1** | Carlos Alberto | `carlos@demo.com` | `123456` | 1 laudo publicado e 1 em rascunho |
| **Paciente 2** | Juliana Silveira | `juliana@demo.com` | `123456` | 1 agendamento sem laudo |

> *A tela de login possui botões de 1 clique para login rápido durante a avaliação.*

---

## 🛠️ Como Instalar e Executar

### Opção A: Execução Local Rápida (Recomendada)

#### 1. Backend:
```bash
cd backend
npm install
cp .env.example .env

# Sincronizar o banco de dados e carregar dados de demonstração
npx prisma db push
npm run db:seed

# Iniciar servidor (porta 3333)
npm run dev
```

#### 2. Frontend:
Em outro terminal:
```bash
cd frontend
npm install

# Iniciar aplicação web (porta 5173)
npm run dev
```
Acesse no navegador: [http://localhost:5173](http://localhost:5173)

---

### Opção B: Execução via Docker Compose
```bash
docker-compose up --build
```
Acesse no navegador: [http://localhost:5173](http://localhost:5173)

---

## 🧪 Testes Automatizados (22 Testes)

A suíte de testes é dividida em testes unitários de serviços com mocks e testes de integração de ponta a ponta:

```bash
cd backend
npm test
```

### Cenários Cobertos:
1. **Concorrência simultânea:** Duas tentativas simultâneas para o mesmo horário aceitam apenas uma (`201`) e rejeitam a outra (`409`).
2. **Autorização entre pacientes:** Paciente tentando consultar laudo de outro paciente tem acesso negado (`403`).
3. **Bloqueio de rascunhos para pacientes:** Paciente tentando acessar laudo em rascunho tem acesso negado (`403`).
4. **Ciclo de vida do laudo:** Laudo em rascunho é publicado pela clínica e passa a ficar acessível para o paciente correto.
5. **Rejeição no passado:** Tentativa de agendamento em data passada é rejeitada (`400`).
6. **Reutilização de horário:** Horário de agendamento cancelado é reaproveitado com sucesso.
7. **Validação temporal:** Bloqueio de agendamentos fora do intervalo de 30 minutos (ex: `10:15`).
8. **Imutabilidade:** Bloqueio de cancelamento de agendamento com laudo publicado e bloqueio de edição de laudo publicado.

---

## 💡 Decisões Técnicas e Arquiteturais

1. **Clean Architecture / Service-Repository:** Os controladores são responsáveis apenas pelo parsing HTTP com Zod. As regras de negócio vivem nos Services, facilitando testes unitários rápidos e isolados sem tocar no banco de dados.
2. **Tratamento Global de Erros:** Erros herdam de `AppError` com status HTTP definidos explicitamente, tratados por um middleware central.
3. **Acessibilidade em Primeiro Lugar:** Modais com foco retido, labels visíveis, contrastes verificados e atalhos de teclado.
4. **Prisma + SQLite:** Agilidade e portabilidade. Nenhuma dependência externa de infraestrutura necessária para testar ou avaliar.

---

## ⏱️ Tempo Dedicado
- **Tempo total dedicado:** ~7 horas (planejamento, backend com camadas e concorrência, suíte de 22 testes automatizados, interface acessível com React 19 + Tailwind, Dockerfile e documentação completa).
