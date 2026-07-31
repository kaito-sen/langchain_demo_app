import type { GraphStateType } from "../state.js";
import { llm } from "../chains/llm.js";
import { RAG_SYSTEM_PROMPT, RAG_USER_TEMPLATE } from "../prompts/ragPrompt.js";

export async function generate(state: GraphStateType) {
  const question = state.question;
  const docs = state.documents ?? [];

  const context = docs
    .map((doc, i) => {
      const source =
        (doc.metadata?.source as string | undefined) ?? "unknown";
      return `[source: ${source}]\n${doc.pageContent}`;
    })
    .join("\n\n");

  const system = RAG_SYSTEM_PROMPT.replace("{context}", context);
  const user = RAG_USER_TEMPLATE.replace("{question}", question);

  let generation: string;
  try {
    const response = await llm.invoke([
      { role: "system", content: system },
      { role: "user", content: user },
    ]);
    generation = response.text;
  } catch {
    generation =
      "Sorry, I could not generate an answer at this time due to an LLM service error. Please try again.";
  }

  const sources = docs
    .map((d) => (d.metadata?.source as string | undefined) ?? "unknown")
    .filter((v, i, arr) => arr.indexOf(v) === i);

  return {
    generation,
    sources,
  };
}
