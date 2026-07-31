import "dotenv/config";
import path from "node:path";
import { ingestDirectory } from "../src/ingestion/ingest.js";

async function main() {
  const dir = process.argv[2] ?? path.resolve("data/documents");
  console.log(`Ingesting documents from: ${dir}`);

  const total = await ingestDirectory(dir);
  console.log(`✅ Ingested ${total} chunks into pgvector.`);
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
