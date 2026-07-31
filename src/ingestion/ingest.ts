import fs from "node:fs";
import path from "node:path";
import { getVectorStore } from "../vectorstore/pgvector.js";
import { loadDocument } from "./loader.js";
import { recursiveCharacterTextSplitter } from "./splitter.js";
import type { Document } from "./splitter.js";

export async function ingestFile(filePath: string): Promise<number> {
  const absPath = path.resolve(filePath);
  const docs = await loadDocument(absPath);

  const chunks: Document[] = [];
  for (const doc of docs) {
    const splitChunks = recursiveCharacterTextSplitter(doc.pageContent, 1000, 200);
    for (const chunk of splitChunks) {
      chunks.push({
        pageContent: chunk,
        metadata: {
          ...doc.metadata,
          source: absPath,
          docType: path.extname(absPath).slice(1),
        },
      });
    }
  }

  const store = await getVectorStore();
  await store.addDocuments(chunks);

  return chunks.length;
}

export async function ingestDirectory(dirPath: string): Promise<number> {
  const absDir = path.resolve(dirPath);
  const entries = fs.readdirSync(absDir, { withFileTypes: true });

  let totalChunks = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const filePath = path.join(absDir, entry.name);
    const ext = path.extname(entry.name).toLowerCase();
    if (ext === ".pdf" || ext === ".docx" || ext === ".md" || ext === ".markdown") {
      const chunks = await ingestFile(filePath);
      totalChunks += chunks;
    }
  }

  return totalChunks;
}
