import { START, END, StateGraph } from "@langchain/langgraph";

import { GraphState } from "./state.js";
import { retrieve } from "./nodes/retrieve.js";
import { gradeDocuments, decideAfterGrade } from "./nodes/gradeDocuments.js";
import { generate } from "./nodes/generate.js";
import { rewriteQuery } from "./nodes/rewriteQuery.js";

export const graph = new StateGraph(GraphState)
  .addNode("retrieve", retrieve)
  .addNode("gradeDocuments", gradeDocuments)
  .addNode("generate", generate)
  .addNode("rewriteQuery", rewriteQuery)
  .addEdge(START, "retrieve")
  .addEdge("retrieve", "gradeDocuments")
  .addConditionalEdges("gradeDocuments", decideAfterGrade, {
    generate: "generate",
    rewriteQuery: "rewriteQuery",
  })
  .addEdge("rewriteQuery", "retrieve")
  .addEdge("generate", END)
  .compile();
