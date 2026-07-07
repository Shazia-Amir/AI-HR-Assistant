# AI HR Assistant — SaaS Platform

A production-ready, full-stack AI HR Assistant that answers employee questions about company policies using Retrieval-Augmented Generation (RAG). Built with a FastAPI backend, Next.js 15 frontend, Supabase for data/auth, and OpenRouter for LLM inference.

## Features

### AI Chat Interface
- **Streaming responses** — Real-time token-by-token AI answers with live typing indicator
- **RAG-powered** — Answers grounded in company HR documents (leave, office hours, project management)
- **Source citations** — Each answer shows source document, section, and relevance score
- **Confidence scoring** — AI responses include confidence percentages
- **Voice input** — Web Speech API integration for hands-free questions
- **Markdown rendering** — Rich formatted responses with code blocks, lists, and tables
- **Chat sessions** — Multiple conversations with local persistence and search
- **Suggested questions** — Pre-built prompts for common HR queries
- **Export** — Download conversations as Markdown or CSV

### HR Analytics Dashboard
- **Overview** — Stat cards for total questions, active employees, avg response time, accuracy rate
- **Charts** — Questions-per-day area chart, feedback distribution pie, topic frequency bar chart
- **Employee activity** — Top 10 most active employees with question counts
- **Recent conversations** — Live feed of latest employee questions with feedback status
- **Analytics page** — FAQ bar chart, AI performance radar, employee activity table
- **Conversations** — Full searchable, paginated conversation log with detail dialog viewer
- **Feedback** — Tabbed view of flagged, negative, and positive feedback for HR review
- **Documents** — Knowledge base management with vector store rebuild capability

### Authentication & Security
- **Supabase Auth** — Email/password authentication with session management
- **Route protection** — Next.js middleware guards `/dashboard/*` routes
- **Row Level Security** — Supabase RLS policies on all tables
- **Admin dashboard** — Separate authenticated admin area for HR personnel

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 18, TypeScript, Tailwind CSS |
| UI Components | shadcn/ui, Radix UI primitives, Lucide icons |
| Charts | Recharts (area, bar, pie, line, radar) |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod validation |
| Data Fetching | TanStack Query (React Query) |
| Backend | FastAPI, Python 3.11+, Uvicorn |
| AI/LLM | OpenRouter API (streaming), LangChain, ChromaDB |
| Embeddings | sentence-transformers (all-MiniLM-L6-v2) |
| Database | Supabase (PostgreSQL), ChromaDB (vector store) |
| Auth | Supabase Auth with SSR cookie-based sessions |
| Containerization | Docker, Docker Compose |

## Project Structure

```
hr-assistant/
├── backend/
│   ├── main.py                  # FastAPI app entry point
│   ├── config.py                # Pydantic settings management
│   ├── requirements.txt         # Python dependencies
│   ├── Dockerfile               # Backend container
│   ├── models/
│   │   └── schemas.py           # Pydantic request/response models
│   ├── routes/
│   │   ├── chat.py              # Chat endpoints (sync + streaming)
│   │   ├── feedback.py          # Feedback submission
│   │   ├── analytics.py         # Stats & analytics endpoints
│   │   ├── documents.py         # Document management
│   │   └── health.py            # Health check
│   ├── services/
│   │   ├── supabase_service.py  # Supabase client & DB operations
│   │   ├── openrouter_service.py# OpenRouter LLM integration
│   │   └── analytics_engine.py  # Analytics computation
│   └── rag/
│       ├── document_loader.py   # Load MD/JSON/TXT documents
│       └── pipeline.py          # RAG pipeline (embed, retrieve, generate)
├── frontend/
│   ├── package.json             # Node dependencies
│   ├── next.config.js           # Next.js configuration
│   ├── tailwind.config.ts       # Tailwind theme & animations
│   ├── tsconfig.json            # TypeScript config
│   ├── Dockerfile               # Frontend container
│   ├── middleware.ts            # Auth route protection
│   ├── lib/
│   │   ├── utils.ts             # Utilities (cn, formatters, exporters)
│   │   ├── api.ts               # API client & TypeScript types
│   │   ├── supabase-browser.ts  # Browser Supabase client
│   │   └── supabase-server.ts   # Server Supabase client
│   ├── hooks/
│   │   └── use-chat.ts          # Chat state management hook
│   ├── components/
│   │   ├── ui/                  # shadcn/ui components (12+)
│   │   └── theme-toggle.tsx     # Dark/light mode toggle
│   └── app/
│       ├── layout.tsx           # Root layout with providers
│       ├── providers.tsx        # Theme, Query, Toast providers
│       ├── globals.css          # Global styles & animations
│       ├── page.tsx             # Landing page
│       ├── login/page.tsx       # Login with form validation
│       ├── chat/page.tsx        # ChatGPT-style chat interface
│       └── dashboard/
│           ├── layout.tsx       # Dashboard sidebar & auth guard
│           ├── page.tsx         # Overview with stats & charts
│           ├── analytics/page.tsx   # Detailed analytics
│           ├── conversations/page.tsx # Conversation log
│           ├── feedback/page.tsx    # Feedback management
│           └── documents/page.tsx   # Knowledge base management
├── documents/
│   ├── leave_policy.md / .json
│   ├── office_hours.md / .json
│   └── project_management.md / .json
├── supabase/
│   └── schema.sql               # Tables, indexes, RLS, triggers
├── docker-compose.yml           # Multi-service orchestration
├── .env.example                 # Environment variable template
└── .gitignore
```

## Getting Started

### Prerequisites
- Node.js 18+ and npm
- Python 3.11+
- Docker & Docker Compose (optional, for containerized deployment)
- A Supabase project (free tier works)
- An OpenRouter API key (free models available)

### 1. Environment Setup

Copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

Required variables:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenRouter
OPENROUTER_API_KEY=your-openrouter-api-key
OPENROUTER_MODEL=microsoft/phi-3-medium-128k-instruct

# Backend
BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
```

### 2. Database Setup

Run the SQL schema in your Supabase SQL editor:

```bash
# Copy contents of supabase/schema.sql and execute in Supabase dashboard
```

This creates tables (`chat_logs`, `feedback`, `documents`), indexes, RLS policies, and triggers.

### 3. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000` with docs at `/docs`.

### 4. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

### 5. Docker (Optional)

```bash
docker-compose up --build
```

This starts both backend (port 8000) and frontend (port 3000) containers.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/chat` | Send a question, get a complete AI response |
| `POST` | `/chat/stream` | Send a question, get a streaming SSE response |
| `POST` | `/feedback` | Submit feedback (positive/negative/flagged) |
| `GET` | `/stats` | Get summary statistics |
| `GET` | `/analytics` | Get detailed analytics (charts, topics, employees) |
| `GET` | `/logs` | Get conversation logs (with pagination & search) |
| `GET` | `/documents` | List knowledge base documents |
| `POST` | `/documents/rebuild` | Rebuild the RAG vector store |
| `GET` | `/health` | Health check endpoint |

## RAG Pipeline

The retrieval-augmented generation pipeline works as follows:

1. **Document Loading** — HR policy documents (Markdown, JSON, TXT) are loaded and parsed into structured sections
2. **Chunking** — Documents are split into semantic chunks with metadata (source, section, type)
3. **Embedding** — Chunks are embedded using `all-MiniLM-L6-v2` sentence transformer
4. **Storage** — Embeddings stored in ChromaDB for fast similarity search
5. **Retval** — On query, top-k most similar chunks are retrieved using cosine similarity
6. **Generation** — Retrieved context + user question sent to OpenRouter LLM for answer generation
7. **Citation** — Source documents and relevance scores returned with each answer

## Frontend Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page with hero, features, and CTA |
| `/login` | Admin login with form validation and Supabase auth |
| `/chat` | Main chat interface (employee-facing) |
| `/dashboard` | Admin overview with stats and charts |
| `/dashboard/analytics` | Detailed analytics with multiple chart types |
| `/dashboard/conversations` | Searchable conversation log with detail viewer |
| `/dashboard/feedback` | Feedback management (flagged, negative, positive) |
| `/dashboard/documents` | Knowledge base document management |

## Key Features Detail

### Streaming Chat
The chat interface uses the Fetch API with ReadableStream to parse Server-Sent Events from the backend. Partial responses are rendered in real-time with a typing indicator. The `useChat` hook manages optimistic UI updates, message state, and error recovery.

### Theme System
Dark/light mode toggle using `next-themes` with CSS variables. All components support both themes with smooth transitions.

### Responsive Design
- Mobile-first approach with collapsible sidebar
- Adaptive grids (1 column mobile → 6 columns desktop)
- Touch-friendly tap targets and gestures

### Data Export
- **Markdown** — Full conversation export with role labels
- **CSV** — Structured data export for spreadsheet analysis

## License

MIT License — see LICENSE file for details.
