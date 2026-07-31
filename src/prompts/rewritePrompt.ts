export const REWRITE_PROMPT = `You are an expert in industrial/factory software design and an information retrieval specialist.

The user's original question did not retrieve relevant documents from a knowledge base of factory software design documents (SRS, architecture specs, MES/SCADA, PLC integration, ISA-95/88, etc.).

Rewrite the question to improve retrieval. Make it more specific, use correct industrial terminology, and include likely keywords that would appear in technical design documents.

Return ONLY the rewritten question, nothing else.

Original question: {question}`;
