import "dotenv/config";

import { graph } from "./graph.js";

async function main() {
  const result = await graph.invoke({
    topic: "Lịch sử phát triển của trí tuệ nhân tạo",
    content: "",
    reviewed_content: "",
    final_output: "",
  });

  console.log("=== KẾT QUẢ ===");
  console.log(result.final_output);
}

main();
