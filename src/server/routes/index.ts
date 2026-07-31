import fs from "node:fs";
import path from "node:path";
import { pipeline } from "node:stream/promises";
import type { FastifyInstance } from "fastify";
import { graph } from "../../graph.js";
import { ingestFile } from "../../ingestion/ingest.js";

/** Directory where uploaded files are persisted before ingestion. */
const UPLOAD_DIR = path.resolve("data/documents/uploads");

/** Allowed file extensions for upload. */
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".md", ".markdown"]);

/**
 * Shared schemas used by both Fastify validation and Swagger docs.
 * Defined inline so Ajv can validate them without external $ref resolution.
 */
const chatRequestSchema = {
  type: "object",
  required: ["question"],
  properties: {
    question: {
      type: "string",
      description: "The question to ask against the knowledge base",
      example: "How does the MES connect to PLCs?",
    },
  },
};

const chatResponseSchema = {
  type: "object",
  properties: {
    answer: {
      type: "string",
      description: "Grounded answer generated from retrieved context",
    },
    sources: {
      type: "array",
      items: { type: "string" },
      description: "List of source filenames cited in the answer",
    },
  },
};

const ingestRequestSchema = {
  type: "object",
  required: ["path"],
  properties: {
    path: {
      type: "string",
      description: "Relative path to the document file to ingest",
      example: "data/documents/new-spec.pdf",
    },
  },
};

const ingestResponseSchema = {
  type: "object",
  properties: {
    ingested: {
      type: "integer",
      description: "Number of chunks ingested",
    },
    source: {
      type: "string",
      description: "Path of the ingested document",
    },
  },
};

const errorResponseSchema = {
  type: "object",
  properties: {
    error: { type: "string", description: "Error message" },
  },
};

/**
 * Swagger-specific schema extensions (tags, summary, description)
 * are not part of the standard FastifySchema type, so we extend it.
 */
interface SwaggerSchema {
  tags?: string[];
  summary?: string;
  description?: string;
  consumes?: string[];
  body?: unknown;
  response?: Record<number, unknown>;
}

export async function chatRoutes(app: FastifyInstance) {
  app.post<{
    Body: { question: string };
  }>(
    "/chat",
    {
      schema: {
        tags: ["chat"],
        summary: "Ask a question against the knowledge base",
        description:
          "Sends a question through the corrective-RAG LangGraph pipeline: retrieve → grade → generate. Returns a grounded answer with source citations.",
        body: chatRequestSchema,
        response: {
          200: chatResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      } satisfies SwaggerSchema,
    },
    async (request, reply) => {
      const body = request.body as { question?: string } | null;
      if (!body?.question) {
        return reply.code(400).send({ error: "Missing 'question' in body" });
      }

      try {
        // recursionLimit is a hard safety cap to prevent infinite loops
        // in the corrective-RAG retry cycle (retrieve → grade → rewrite).
        const result = await graph.invoke(
          { question: body.question },
          { recursionLimit: 25 }
        );

        return reply.send({
          answer: result.generation ?? "",
          sources: result.sources ?? [],
        });
      } catch (err) {
        request.log.error(
          { err },
          "Chat pipeline failed for question: %s",
          body.question
        );
        return reply.code(500).send({
          error:
            err instanceof Error
              ? err.message
              : typeof err === "string"
                ? err
                : "Chat pipeline failed. Check server logs for details.",
        });
      }
    },
  );

  app.post<{
    Body: { path: string };
  }>(
    "/ingest",
    {
      schema: {
        tags: ["ingest"],
        summary: "Ingest a single document into the vector store",
        description:
          "Loads a document (PDF/DOCX/MD), splits it into chunks, embeds, and stores in pgvector. Returns the number of chunks ingested.",
        body: ingestRequestSchema,
        response: {
          200: ingestResponseSchema,
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      } satisfies SwaggerSchema,
    },
    async (request, reply) => {
      const body = request.body as { path?: string } | null;
      if (!body?.path) {
        return reply.code(400).send({ error: "Missing 'path' in body" });
      }

      try {
        const ingested = await ingestFile(body.path);
        return reply.send({ ingested, source: body.path });
      } catch (err) {
        return reply.code(500).send({
          error: err instanceof Error ? err.message : "Ingestion failed",
        });
      }
    },
  );

  // POST /upload — upload a DOCX/PDF/MD file directly from disk/Drive.
  // Accepts multipart/form-data with a single "file" field.
  // The file is saved to data/documents/uploads/ and then ingested.
  app.post(
    "/upload",
    {
      schema: {
        tags: ["ingest"],
        summary: "Upload a document file directly (DOCX/PDF/MD)",
        description:
          "Accepts a multipart/form-data upload with a single 'file' field. The file is saved to data/documents/uploads/ and then chunked, embedded, and stored in pgvector. Use this to upload files straight from your disk or Google Drive without needing them on the server first.",
        consumes: ["multipart/form-data"],
        response: {
          200: {
            type: "object",
            properties: {
              ingested: { type: "integer", description: "Number of chunks ingested" },
              filename: { type: "string", description: "Original uploaded filename" },
              savedPath: { type: "string", description: "Where the file was saved" },
            },
          },
          400: errorResponseSchema,
          500: errorResponseSchema,
        },
      } satisfies SwaggerSchema,
    },
    async (request, reply) => {
      try {
        const data = await request.file();
        if (!data) {
          return reply.code(400).send({ error: "No file uploaded. Provide a 'file' field." });
        }

        // Validate extension
        const ext = path.extname(data.filename).toLowerCase();
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          return reply.code(400).send({
            error: `Unsupported file type '${ext}'. Allowed: .pdf, .docx, .md`,
          });
        }

        // Ensure upload directory exists
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });

        // Sanitize filename and build save path
        const safeName = `${Date.now()}-${data.filename.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
        const savePath = path.join(UPLOAD_DIR, safeName);

        // Stream the uploaded file to disk
        await pipeline(data.file, fs.createWriteStream(savePath));

        // Ingest the saved file into the vector store
        const ingested = await ingestFile(savePath);

        return reply.send({
          ingested,
          filename: data.filename,
          savedPath: savePath,
        });
      } catch (err) {
        return reply.code(500).send({
          error: err instanceof Error ? err.message : "Upload failed",
        });
      }
    },
  );

  app.get(
    "/health",
    {
      schema: {
        tags: ["health"],
        summary: "Liveness check",
        description: "Returns server health status.",
        response: {
          200: {
            type: "object",
            properties: {
              status: { type: "string", example: "ok" },
            },
          },
        },
      } satisfies SwaggerSchema,
    },
    async () => {
      return { status: "ok" };
    },
  );
}
