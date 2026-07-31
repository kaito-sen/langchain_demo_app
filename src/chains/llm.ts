import { ChatOpenAI } from "@langchain/openai";
import { env } from "../config/env.js";

export const llm = new ChatOpenAI({
  apiKey: env.OPENROUTER_API_KEY,
  configuration: {
    baseURL: env.OPENROUTER_BASE_URL,
  },
  model: env.OPENROUTER_MODEL,
  temperature: 0.2,
});
