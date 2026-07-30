import { Annotation } from "@langchain/langgraph";

export const GraphState = Annotation.Root({
  topic: Annotation<string>(),
  content: Annotation<string>(),
  reviewed_content: Annotation<string>(),
  final_output: Annotation<string>(),
});

export type GraphStateType = typeof GraphState.State;
