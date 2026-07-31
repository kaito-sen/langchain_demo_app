import { config } from "dotenv";
import { z } from "zod";

config();

export const EnvSchema = z.object({
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().default("https://openrouter.ai/api/v1"),
  OPENROUTER_MODEL: z.string().min(1).default("openai/gpt-4o-mini"),
  EMBEDDING_MODEL: z.string().min(1).default("openai/text-embedding-3-small"),
  PG_HOST: z.string().default("localhost"),
  PG_PORT: z.coerce.number().default(5432),
  PG_USER: z.string().default("postgres"),
  PG_PASSWORD: z.string().default("postgres"),
  PG_DATABASE: z.string().default("rag_db"),
  PG_VECTOR_TABLE: z.string().default("documents"),
  PORT: z.coerce.number().default(3000),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export const env = EnvSchema.parse(process.env);
