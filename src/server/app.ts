import Fastify from "fastify";
import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";
import { chatRoutes } from "./routes/index.js";

export async function buildServer() {
  const app = Fastify({
    logger: true,
    ajv: {
      customOptions: {
        // Disable strict mode so OpenAPI/Swagger-only keywords
        // (example, tags, summary, consumes, file, etc.) pass through
        // without errors. "description" is a built-in JSON Schema keyword,
        // so it must NOT be re-registered in `keywords` (Ajv would throw
        // "Keyword description is already defined").
        strict: false,
        keywords: [
          "tags",
          "summary",
          "example",
          "externalDocs",
          "consumes",
          "isFile",
        ],
      },
    },
  });

  // Enable CORS so Swagger UI "Try it out" and external clients
  // can call the API from the browser without "Failed to fetch" errors.
  await app.register(cors, {
    origin: true, // reflect the request origin
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  });

  // Enable multipart/form-data parsing so the /upload endpoint can
  // accept actual file uploads (DOCX/PDF/MD) directly from disk/Drive.
  await app.register(multipart, {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB max per file
    },
  });

  // Register Swagger (OpenAPI spec generator)
  await app.register(swagger, {
    openapi: {
      info: {
        title: "Factory Software Design RAG Chatbot API",
        description:
          "A domain-specific Retrieval-Augmented Generation (RAG) chatbot for analyzing business documents in the software design industry for factories (MES, SCADA, PLC integration, ISA-95/88).",
        version: "1.0.0",
        contact: {
          name: "RAG Chatbot",
        },
      },
      servers: [
        {
          url: "http://localhost:3000",
          description: "Local development server",
        },
      ],
      tags: [
        { name: "chat", description: "Q&A endpoints" },
        { name: "ingest", description: "Document ingestion" },
        { name: "health", description: "Health checks" },
      ],
    },
  });

  // Register chat/upload routes BEFORE swagger so the spec includes them.
  await app.register(chatRoutes);

  // Register Swagger UI (interactive documentation).
  // We use transformSpecification to inject a multipart/form-data file body
  // into the /upload operation, because @fastify/multipart parses the stream
  // itself and we cannot put a `type:"file"` body schema on the route (Ajv
  // would reject the multipart stream). The transform only affects the
  // displayed spec, not actual request handling.
  await app.register(swaggerUi, {
    routePrefix: "/docs",
    uiConfig: {
      docExpansion: "list",
      deepLinking: true,
      displayRequestDuration: true,
      filter: true,
      tryItOutEnabled: true,
    },
    transformSpecification: (_swaggerObject, _req, _reply) => {
      const spec = JSON.parse(JSON.stringify(_swaggerObject)) as Record<
        string,
        unknown
      >;
      const paths = spec.paths as Record<
        string,
        Record<string, unknown>
      >;
      const upload = paths["/upload"]?.post as
        | { requestBody?: unknown }
        | undefined;
      if (upload) {
        upload.requestBody = {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                properties: {
                  file: {
                    type: "string",
                    format: "binary",
                    description:
                      "The document file to upload (.pdf, .docx, .md)",
                  },
                },
                required: ["file"],
              },
            },
          },
        };
      }
      return spec;
    },
    uiHooks: {
      onRequest: function (_request, _reply, next) {
        next();
      },
      preHandler: function (_request, _reply, next) {
        next();
      },
    },
  });

  return app;
}
