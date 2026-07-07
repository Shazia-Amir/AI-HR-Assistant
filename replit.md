# AI HR Assistant

A full-stack RAG-powered HR assistant with analytics dashboard.

## Stack

- **Frontend**: Next.js 15 (TypeScript, Tailwind CSS, shadcn/ui, Supabase Auth)
- **Backend**: Python/FastAPI with LangChain + ChromaDB RAG pipeline
- **LLM**: OpenRouter (DeepSeek by default)
- **Database/Auth**: Supabase

## How to Run

Two workflows run in parallel:

| Workflow | Command | Port |
|---|---|---|
| `Start application` | `cd frontend && npm run dev` | 5000 (webview) |
| `Backend API` | `cd backend && python3 -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload` | 8000 (console) |

The frontend proxies API calls through Next.js rewrites (`/api/backend/*` → `http://localhost:8000/*`).

## Environment

Secrets are stored in Replit Secrets (not in .env):
- `OPENROUTER_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

Non-secret config lives in `.env`.

## Notes

- The backend warns "No documents found" on first boot — this is normal. Use the dashboard to upload HR documents, or add them to `./documents/`.
- The RAG vector store is built from documents in `./documents/` and cached in `./vectorstore/`.
- `sentence-transformers` was installed via `pip` directly (uv has a pyproject.toml index conflict for this package on Linux).
- `tokenizers` is pinned to `0.22.2` to stay compatible with `transformers`.

## User Preferences

- Keep existing project structure (backend/frontend split)
- Use Replit Secrets for all credentials
