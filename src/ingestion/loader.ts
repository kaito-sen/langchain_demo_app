import fs from "node:fs";
import path from "node:path";
import type { Document } from "./splitter.js";

export async function loadPdf(filePath: string): Promise<Document[]> {
  const { PDFLoader } = await import(
    "@langchain/community/document_loaders/fs/pdf"
  );
  const loader = new PDFLoader(filePath);
  return loader.load();
}

export async function loadDocx(filePath: string): Promise<Document[]> {
  const { DocxLoader } = await import(
    "@langchain/community/document_loaders/fs/docx"
  );
  const loader = new DocxLoader(filePath);
  return loader.load();
}

export async function loadMarkdown(filePath: string): Promise<Document[]> {
  const content = fs.readFileSync(filePath, "utf-8");
  return [
    {
      pageContent: content,
      metadata: {
        source: filePath,
        docType: "markdown",
      },
    },
  ];
}

export async function loadDocument(
  filePath: string
): Promise<Document[]> {
  const ext = path.extname(filePath).toLowerCase();

  switch (ext) {
    case ".pdf":
      return loadPdf(filePath);
    case ".docx":
      return loadDocx(filePath);
    case ".md":
    case ".markdown":
      return loadMarkdown(filePath);
    default:
      throw new Error(`Unsupported file type: ${ext} for file ${filePath}`);
  }
}
