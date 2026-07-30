import { START, END, StateGraph } from "@langchain/langgraph";

import { GraphState } from "./state.js";
import { writerNode, reviewerNode, formatterNode } from "./node.js";

export const graph = new StateGraph(GraphState)
  .addNode("writer", writerNode)
  .addNode("reviewer", reviewerNode)
  .addNode("formatter", formatterNode)
  .addEdge(START, "writer")
  .addEdge("writer", "reviewer")
  .addEdge("reviewer", "formatter")
  .addEdge("formatter", END)
  .compile();
