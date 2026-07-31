import type { GraphStateType } from "../state.js";
import { llm } from "../chains/llm.js";
import { REWRITE_PROMPT } from "../prompts/rewritePrompt.js";

export async function rewriteQuery(state: GraphStateType) {
  const prompt = REWRITE_PROMPT.replace("{question}", state.question);
  const attempts = (state.retrievalAttempts ?? 0) + 1;
  try {
    const response = await llm.invoke([{ role: "user", content: prompt }]);
    return {
      rewrittenQuestion: response.text?.trim() ?? state.question,
      retrievalAttempts: attempts,
    };
  } catch {
    // If rewriting fails, fall back to the original question so the pipeline
    // can retry retrieval instead of crashing.
    return {
      rewrittenQuestion: state.question,
      retrievalAttempts: attempts,
    };
  }
}
