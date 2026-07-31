import { Annotation } from "@langchain/langgraph";

/** Maximum number of retrieval retries before giving up. */
export const MAX_RETRIES = 3;

export const GraphState = Annotation.Root({
  question: Annotation<string>(),
  documents: Annotation<
    { pageContent: string; metadata: Record<string, unknown> }[]
  >({
    value: (x, y) => (Array.isArray(y) ? y : x),
  }),
  rewrittenQuestion: Annotation<string>(),
  generation: Annotation<string>(),
  sources: Annotation<string[]>({
    value: (x, y) => y ?? x,
    default: () => [],
  }),
  /** How many times the query has been rewritten + retrieval retried. */
  retrievalAttempts: Annotation<number>({
    value: (x, y) => (typeof y === "number" ? y : x),
    default: () => 0,
  }),
});

export type GraphStateType = typeof GraphState.State;
