# Factory Software Design Q&A Chatbot (RAG)

A domain-specific **Retrieval-Augmented Generation (RAG)** chatbot for analyzing business documents in the **software design industry for factories** (MES, SCADA, PLC integration, ISA-95/88, etc.). Built with **LangChain/LangGraph** and **TypeScript**, backed by **PostgreSQL + pgvector**, and exposed via a **Fastify REST API**.

---

## 🎯 Overview

The system ingests factory software-design documents (PDF, DOCX, Markdown), chunks and embeds them into a pgvector store, then answers user questions through a corrective-RAG LangGraph workflow that retrieves relevant context, grades it for relevance, and generates grounded answers with source citations.

```
START → retrieve → gradeDocuments → (relevant?) → generate → END
                          ↓ (not relevant)
                    rewriteQuery → retrieve (retry)
```

### Domain Expertise

The assistant is tuned for industrial/factory software design, covering:
- Manufacturing Execution Systems (MES) & SCADA
- ISA-95 (enterprise-control integration) & ISA-88 (batch control)
- PLC integration & equipment connectivity (OPC-UA, Modbus, Profinet)
- Batch and continuous process manufacturing software
- Edge / gateway / plant-level architecture

---

## 📁 Project Structure

```
langgraph-fundamentals/
├── src/
│   ├── index.ts                # Entry point — starts Fastify server
│   ├── config/env.ts           # zod-validated env config
│   ├── state.ts                # LangGraph RAG state schema
│   ├── graph.ts                # StateGraph compilation
│   ├── chains/
│   │   ├── llm.ts              # ChatOpenAI (OpenRouter)
│   │   └── embeddings.ts       # OpenAIEmbeddings (OpenRouter)
│   ├── nodes/
│   │   ├── retrieve.ts         # pgvector similarity search
│   │   ├── gradeDocuments.ts   # LLM relevance grading + routing
│   │   ├── generate.ts         # Answer synthesis with citations
│   │   └── rewriteQuery.ts     # Query rewrite on weak context
│   ├── ingestion/
│   │   ├── loader.ts           # PDF/DOCX/MD loaders
│   │   ├── splitter.ts         # Recursive text splitter
│   │   └── ingest.ts           # Load → split → embed → store
│   ├── vectorstore/pgvector.ts # PGVectorStore init + retrieval
│   ├── prompts/
│   │   ├── ragPrompt.ts        # Domain-tuned Q&A prompt
│   │   ├── gradePrompt.ts      # Relevance grading prompt
│   │   └── rewritePrompt.ts    # Query rewrite prompt
│   └── server/
│       ├── app.ts              # Fastify app setup
│       └── routes/index.ts     # /chat, /ingest, /health
├── data/documents/             # Sample & seed factory design docs
├── scripts/seed.ts             # Ingest documents into pgvector
├── sql/init.sql                # Enable pgvector extension
├── docker-compose.yml          # PostgreSQL + pgvector service
├── .env.example
├── package.json
└── tsconfig.json
```

---

## 🚀 Setup

### 1. Install dependencies

```bash
npm install --legacy-peer-deps
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your OpenRouter API key and (optionally) adjust the PostgreSQL and model settings.

### 3. Start PostgreSQL + pgvector

```bash
docker compose up -d
```

This launches a `pgvector/pgvector:pg16` container with the `vector` extension auto-enabled via `sql/init.sql`.

### 4. Seed documents

Place your factory design documents (`.pdf`, `.docx`, `.md`) into `data/documents/`, then run:

```bash
npm run seed
```

Two sample Markdown specs are included:
- `mes-design-spec.md` — MES design per ISA-95
- `scada-plc-integration.md` — SCADA/PLC integration architecture

### 5. Start the API server

```bash
npm run dev
```

Server listens on `http://localhost:3000`.

**Interactive API docs (Swagger UI):** `http://localhost:3000/docs`

---

## 📡 API Reference

> 💡 All endpoints below are also documented interactively at **`http://localhost:3000/docs`** (Swagger UI), where you can try them out directly from the browser.

### `POST /chat`

Ask a question against the knowledge base.

```bash
curl -X POST http://localhost:3000/chat \
  -H "Content-Type: application/json" \
  -d '{"question": "How does the MES connect to PLCs?"}'
```

**Response:**
```json
{
  "answer": "According to the design spec, the MES connects to PLCs via OPC-UA gateways...",
  "sources": ["data/documents/mes-design-spec.md"]
}
```

### `POST /ingest`

Ingest a single document file.

```bash
curl -X POST http://localhost:3000/ingest \
  -H "Content-Type: application/json" \
  -d '{"path": "data/documents/new-spec.pdf"}'
```

**Response:**
```json
{ "ingested": 24, "source": "data/documents/new-spec.pdf" }
```

### `GET /health`

```bash
curl http://localhost:3000/health
# → { "status": "ok" }
```

---

## 🧠 How the Corrective RAG Graph Works

1. **retrieve** — Embeds the question and runs similarity search against pgvector (top-4).
2. **gradeDocuments** — An LLM grades each retrieved chunk for relevance to the question.
3. **Conditional edge** — If at least one chunk is relevant → `generate`. If none → `rewriteQuery`.
4. **rewriteQuery** — Rewrites the question with industrial terminology, then loops back to `retrieve`.
5. **generate** — Produces a grounded answer using only relevant context, citing source filenames. States clearly when the knowledge base lacks an answer.

---

## 🔧 Configuration

All configuration is in `.env` (see `.env.example`):

| Variable | Description | Default |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | OpenRouter API key | — (required) |
| `OPENROUTER_BASE_URL` | OpenRouter base URL | `https://openrouter.ai/api/v1` |
| `OPENROUTER_MODEL` | Chat model | `openai/gpt-4o-mini` |
| `EMBEDDING_MODEL` | Embedding model | `openai/text-embedding-3-small` |
| `PG_HOST` / `PG_PORT` | Postgres host/port | `localhost` / `5432` |
| `PG_USER` / `PG_PASSWORD` | Postgres credentials | `postgres` / `postgres` |
| `PG_DATABASE` | Postgres database | `rag_db` |
| `PG_VECTOR_TABLE` | Vector table name | `documents` |
| `PORT` | API server port | `3000` |

---

## 📜 Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Run the API server with tsx |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled server |
| `npm run seed` | Ingest `data/documents/` into pgvector |

---

## 📚 Swagger / OpenAPI

This project ships with **Swagger UI** for interactive API exploration and testing.

- **Swagger UI:** [http://localhost:3000/docs](http://localhost:3000/docs)
- **OpenAPI JSON spec:** [http://localhost:3000/docs/json](http://localhost:3000/docs/json)
- **OpenAPI YAML spec:** [http://localhost:3000/docs/yaml](http://localhost:3000/docs/yaml)

### Features

- 📝 **Interactive docs** — browse all endpoints with descriptions, schemas, and examples
- ▶️ **Try it out** — send real requests directly from the browser
- 🏷️ **Tagged groups** — endpoints organized by category (`chat`, `ingest`, `health`)
- 📋 **Schema definitions** — request/response models documented inline
- ⏱️ **Request duration** — see how long each request takes

Packages used:
- `@fastify/swagger` — generates the OpenAPI spec
- `@fastify/swagger-ui` — serves the interactive UI at `/docs`

---

## 🛣️ Future Work

- Multi-turn conversational memory (LangGraph persistence/checkpoints)
- Streaming SSE responses for `/chat`
- Hybrid search (keyword + vector) with reranking
- Authentication / RBAC on the API
- Web chat UI
