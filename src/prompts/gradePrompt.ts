export const GRADE_PROMPT = `You are a grader assessing the relevance of a retrieved document to a user question about factory/industrial software design.

Determine whether the document contains information useful for answering the question.

Return ONLY a single token: "yes" if the document is relevant, or "no" if it is not relevant.

User question: {question}

Retrieved document:
{document}`;
