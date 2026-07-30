import "dotenv/config";

import { ChatOpenAI } from "@langchain/openai";
import type { GraphStateType } from "./state.js";

const apiKey = process.env.OPENROUTER_API_KEY;
const baseURL = process.env.OPENROUTER_BASE_URL;
const modelName = process.env.OPENROUTER_MODEL;

if (!apiKey || !baseURL || !modelName) {
  throw new Error("Missing required environment variables");
}

const model = new ChatOpenAI({
  apiKey,
  configuration: {
    baseURL,
  },
  model: modelName,
});

// Node 1: Writer — viết nội dung về chủ đề
export async function writerNode(state: GraphStateType) {
  const response = await model.invoke([
    {
      role: "system",
      content:
        "You are a content writer. Write a short paragraph about the given topic in Vietnamese.",
    },
    {
      role: "user",
      content: `Write a paragraph about: ${state.topic}`,
    },
  ]);

  return {
    content: response.text,
  };
}

// Node 2: Reviewer — xem xét và cải thiện nội dung
export async function reviewerNode(state: GraphStateType) {
  const response = await model.invoke([
    {
      role: "system",
      content:
        "You are a content reviewer. Review and improve the given text. Fix grammar, enhance clarity, and make it more engaging. Return only the improved text.",
    },
    {
      role: "user",
      content: `Improve this text:\n\n${state.content}`,
    },
  ]);

  return {
    reviewed_content: response.text,
  };
}

// Node 3: Formatter — định dạng đầu ra cuối cùng
export async function formatterNode(state: GraphStateType) {
  const response = await model.invoke([
    {
      role: "system",
      content:
        "You are a content formatter. Format the given text with a title (heading) and the body. Use markdown style. Return only the formatted result.",
    },
    {
      role: "user",
      content: `Format this text with a title:\n\n${state.reviewed_content}`,
    },
  ]);

  return {
    final_output: response.text,
  };
}
