# Medical Chatbot - Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL installed and running
- OpenAI API key

## Step-by-Step Setup

### 1. Install Dependencies

```bash
cd medical_chatbot
npm install
cd frontend && npm install && cd ..
```

### 2. Create PostgreSQL Database

```bash
createdb medical_chatbot
```

Or using psql:
```sql
CREATE DATABASE medical_chatbot;
```

### 3. Configure Environment Variables

The `.env` file is already created. Update if needed:

```env
DATABASE_URL="postgresql://root:root@localhost:5432/medical_chatbot"
OPENAI_API_KEY=your_openai_api_key
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

### 4. Run Prisma Migrations

```bash
npm run prisma:migrate
```

When prompted for migration name, enter: `init`

### 5. Generate Prisma Client

```bash
npm run prisma:generate
```

### 6. Ingest Medical Data

This will load the CSV data into the database:

```bash
npm run ingest
```

Expected output:
- Processing ~100k+ rows
- Batch inserts into database
- Sample records displayed

### 7. Test AI Service (Optional)

```bash
npm run test:ai
```

This will test the AI agent with sample medical queries.

### 8. Start Backend Server

```bash
npm run dev:backend
```

Server will start on http://localhost:3001

### 9. Start Frontend (New Terminal)

```bash
npm run dev:frontend
```

Frontend will start on http://localhost:5173

## Usage

1. Open http://localhost:5173 in your browser
2. Sign up with email and password
3. Start chatting with the medical assistant
4. Describe symptoms naturally - the AI will ask clarifying questions

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create account
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Get current user (requires auth)

### Chats
- `GET /api/chats` - Get all chats
- `POST /api/chats` - Create new chat
- `GET /api/chats/:chatId/messages` - Get chat messages
- `POST /api/chats/message` - Send message
- `DELETE /api/chats/:chatId` - Delete chat

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running: `pg_isready`
- Check DATABASE_URL in .env
- Verify database exists: `psql -l`

### Prisma Issues
- Delete `node_modules/.prisma` and run `npm run prisma:generate` again
- Run `npm run prisma:studio` to inspect database

### Port Already in Use
- Backend: Change PORT in .env
- Frontend: Change port in vite.config.ts

### OpenAI API Errors
- Verify OPENAI_API_KEY is valid
- Check API quota/billing

## Project Structure

```
medical_chatbot/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # Database schema
│   ├── scripts/
│   │   ├── ingest-medical-data.ts # CSV ingestion
│   │   └── test-ai-service.ts     # AI testing
│   └── src/
│       ├── config/                # Configuration
│       ├── controllers/           # Request handlers
│       ├── middleware/            # Auth middleware
│       ├── routes/                # API routes
│       ├── services/              # Business logic
│       │   ├── aiService.ts       # LangChain agent
│       │   ├── authService.ts     # Authentication
│       │   └── chatService.ts     # Chat management
│       └── server.ts              # Express server
└── frontend/
    └── src/
        ├── components/            # React components
        ├── contexts/              # React contexts
        ├── pages/                 # Page components
        ├── services/              # API client
        └── types/                 # TypeScript types
```

## Development Commands

```bash
# Backend
npm run dev:backend          # Start backend with hot reload
npm run build:backend        # Build backend
npm run prisma:studio        # Open Prisma Studio

# Frontend
npm run dev:frontend         # Start frontend dev server
npm run build:frontend       # Build frontend for production

# Database
npm run prisma:migrate       # Run migrations
npm run prisma:generate      # Generate Prisma Client
npm run ingest              # Ingest medical data

# Testing
npm run test:ai             # Test AI service
```

## Features

✅ **Authentication**: JWT-based signup/login  
✅ **AI Agent**: LangChain with GPT-4o  
✅ **Medical Knowledge**: 100k+ QA pairs from CSV  
✅ **Conversational**: Asks clarifying questions  
✅ **Chat History**: Persistent conversations  
✅ **Modern UI**: Navy blue theme with Tailwind CSS  
✅ **Real-time**: Instant AI responses  
✅ **Responsive**: Works on all devices  

## Security Notes

- Change JWT_SECRET in production
- Use environment variables for secrets
- Enable HTTPS in production
- Implement rate limiting for API
- Add input validation/sanitization
- Set up proper CORS policies

## Production Deployment

1. Set NODE_ENV=production
2. Use managed PostgreSQL (AWS RDS, Heroku Postgres, etc.)
3. Deploy backend to cloud service (Heroku, Railway, Render)
4. Build and deploy frontend to CDN (Vercel, Netlify)
5. Set up proper environment variables
6. Enable SSL/TLS
7. Configure logging and monitoring
