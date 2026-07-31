import type { GraphStateType } from "../state.js";
import { MAX_RETRIES } from "../state.js";
import { llm } from "../chains/llm.js";
import { GRADE_PROMPT } from "../prompts/gradePrompt.js";

export async function gradeDocuments(state: GraphStateType) {
  const question = state.question;
  const docs = state.documents ?? [];

  // If no documents were retrieved, skip grading and go to rewrite.
  if (docs.length === 0) {
    return { documents: [] };
  }

  const relevant: typeof docs = [];
  for (const doc of docs) {
    const prompt = GRADE_PROMPT.replace("{question}", question).replace(
      "{document}",
      doc.pageContent
    );
    try {
      const response = await llm.invoke([{ role: "user", content: prompt }]);
      const verdict = response.text?.trim().toLowerCase().startsWith("yes");
      if (verdict) {
        relevant.push(doc);
      }
    } catch {
      // If the LLM call fails (rate limit, network, etc.), treat the doc as
      // not relevant so the pipeline can try rewriting the query.
      continue;
    }
  }

  return { documents: relevant };
}

export function decideAfterGrade(state: GraphStateType): "generate" | "rewriteQuery" {
  const docs = state.documents ?? [];
  const attempts = state.retrievalAttempts ?? 0;
  // If we have relevant docs, generate. If we've exhausted retries, also go
  // to generate (which will say no info found) instead of looping forever.
  if (docs.length > 0) return "generate";
  if (attempts >= MAX_RETRIES) return "generate";
  return "rewriteQuery";
}
