# Interactive Medical Chatbot

A production-ready medical chatbot that provides conversational AI-powered medical advice based on a comprehensive medical knowledge database.

## Tech Stack

- **Frontend**: React (Vite), TypeScript, Tailwind CSS, Lucide React
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **AI/LLM**: LangChain.js with OpenAI GPT-4o

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
cd frontend && npm install && cd ..
```

### 2. Database Setup

Create a PostgreSQL database named `medical_chatbot`:

```bash
createdb medical_chatbot
```

### 3. Environment Variables

Copy `.env.example` to `.env` and update with your credentials.

### 4. Run Prisma Migrations

```bash
npm run prisma:migrate
npm run prisma:generate
```

### 5. Ingest Medical Data

```bash
npm run ingest
```

### 6. Start Development Servers

Backend:
```bash
npm run dev:backend
```

Frontend (in another terminal):
```bash
npm run dev:frontend
```

## Project Structure

```
medical_chatbot/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma
│   ├── scripts/
│   │   ├── ingest-medical-data.ts
│   │   └── test-ai-service.ts
│   └── src/
│       ├── controllers/
│       ├── services/
│       ├── routes/
│       ├── middleware/
│       ├── types/
│       └── server.ts
└── frontend/
    └── src/
        ├── components/
        ├── pages/
        ├── services/
        └── App.tsx
```

## Features

- 🤖 Conversational AI medical assistant
- 💬 Real-time chat interface
- 🔐 JWT-based authentication
- 📊 Medical knowledge database with 100k+ QA pairs
- 🎨 Modern UI with Navy Blue theme
- 💾 Chat history persistence
