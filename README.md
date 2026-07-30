# LangGraph Fundamentals

Dự án demo cơ bản về **LangGraph** — framework xây dựng ứng dụng AI theo dạng đồ thị trạng thái (StateGraph).

---

## 🎯 Tổng quan

Đây là một **pipeline tạo nội dung** (Content Generation Pipeline) gồm 3 node xử lý tuần tự:

```
START → Writer → Reviewer → Formatter → END
```

1. **Writer** — Viết nội dung về một chủ đề
2. **Reviewer** — Xem xét và cải thiện nội dung
3. **Formatter** — Định dạng đầu ra với tiêu đề và markdown

---

## 📁 Cấu trúc project

```
langgraph-fundamentals/
├── .env                    # Cấu hình API (OpenRouter)
├── .gitignore              # Bỏ qua file .env khi commit
├── package.json            # Dependencies và scripts
├── tsconfig.json           # Cấu hình TypeScript
├── README.md               # File này
└── src/
    ├── index.ts            # Entry point — chạy graph
    ├── state.ts            # Định nghĩa schema trạng thái
    ├── node.ts             # Định nghĩa các node xử lý
    └── graph.ts            # Xây dựng và biên dịch graph
```

---

## 🧠 Các khái niệm cốt lõi

### 1. State (Trạng thái)

**State** là dữ liệu chung được chia sẻ giữa các node. Nó đóng vai trò như "bộ nhớ" của graph.

```typescript
// src/state.ts
export const GraphState = Annotation.Root({
  topic: Annotation<string>(),           // Chủ đề cần viết
  content: Annotation<string>(),         // Nội dung thô
  reviewed_content: Annotation<string>(), // Nội dung đã chỉnh sửa
  final_output: Annotation<string>(),    // Kết quả cuối cùng
});
```

- State được **truyền vào** mỗi node khi graph thực thi.
- Mỗi node có thể **trả về một phần state mới** để cập nhật.
- LangGraph tự động **gộp (merge)** state mới vào state hiện tại.

### 2. Node (Nút xử lý)

**Node** là một hàm xử lý logic, nhận state làm input và trả về state mới.

```typescript
// src/node.ts
export async function writerNode(state: GraphStateType) {
  const response = await model.invoke([
    { role: "system", content: "You are a content writer..." },
    { role: "user", content: `Write about: ${state.topic}` },
  ]);
  return { content: response.text };
}
```

- Node là **pure function** — nhận state, trả state mới, không sửa state cũ.
- Node có thể **async** để thực hiện các thao tác I/O (gọi API, đọc database,...).
- Mỗi node chỉ cần trả về **những field muốn thay đổi**.

### 3. Edge (Cạnh kết nối)

**Edge** xác định **thứ tự** và **hướng** thực thi giữa các node.

```typescript
// src/graph.ts
.addEdge(START, "writer")       // Bắt đầu → Writer
.addEdge("writer", "reviewer")  // Writer → Reviewer
.addEdge("reviewer", "formatter") // Reviewer → Formatter
.addEdge("formatter", END)      // Formatter → Kết thúc
```

### 4. Graph (Đồ thị)

**Graph** là bộ điều phối, kết nối State, Node và Edge thành một workflow hoàn chỉnh.

```typescript
// src/graph.ts
export const graph = new StateGraph(GraphState)
  .addNode("writer", writerNode)
  .addNode("reviewer", reviewerNode)
  .addNode("formatter", formatterNode)
  .addEdge(START, "writer")
  .addEdge("writer", "reviewer")
  .addEdge("reviewer", "formatter")
  .addEdge("formatter", END)
  .compile();
```

`.compile()` biên dịch graph thành executable, có thể gọi bằng `.invoke()`.

---

## 🔄 Luồng hoạt động

```
┌─────────────────────────────────────────────────────────┐
│                      graph.invoke()                      │
│                { topic: "Lịch sử AI", ... }            │
└───────────────────────────┬─────────────────────────────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   START (vùng)  │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │   WRITER NODE   │  ← Đọc topic, gọi LLM viết bài
                    │  Trả về content │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │  REVIEWER NODE  │  ← Đọc content, cải thiện
                    │ Trả về reviewed │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │ FORMATTER NODE  │  ← Đọc reviewed, định dạng
                    │ Trả về final    │
                    └────────┬───────┘
                             │
                             ▼
                    ┌────────────────┐
                    │     END         │  ← Trả về state cuối cùng
                    └────────────────┘
```

---

## 📦 Dependencies chính

| Package | Vai trò |
|---|---|
| `@langchain/langgraph` | Framework xây dựng graph (StateGraph, Annotation, START, END) |
| `@langchain/openai` | Adapter gọi LLM qua API OpenAI-compatible (OpenRouter) |
| `@langchain/core` | Core utilities của LangChain |
| `dotenv` | Tải biến môi trường từ file `.env` |
| `typescript` | Biên dịch TypeScript |
| `tsx` | Chạy TypeScript trực tiếp (dev mode) |

---

## 🚀 Cách chạy

```bash
# Cài dependencies
npm install

# Chạy dev (không cần biên dịch)
npm run dev

# Build và chạy
npm run build
npm start
```

### Yêu cầu:

File `.env` phải chứa:
```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

---

## ⚙️ Hướng dẫn cài đặt môi trường ban đầu với TypeScript

### Bước 1: Cài đặt Node.js và npm

Trước tiên, cần cài đặt **Node.js** (phiên bản 18 trở lên) và **npm** (đi kèm khi cài Node.js).

```bash
# Kiểm tra phiên bản Node.js
node -v

# Kiểm tra phiên bản npm
npm -v
```

Nếu chưa cài Node.js, tải tại [https://nodejs.org/](https://nodejs.org/) (khuyến nghị phiên bản **LTS**).

---

### Bước 2: Khởi tạo project

```bash
# Tạo thư mục project
mkdir langgraph-fundamentals
cd langgraph-fundamentals

# Khởi tạo project với npm
npm init -y
```

Lệnh `npm init -y` sẽ tạo file `package.json` với cấu hình mặc định.

---

### Bước 3: Cài đặt TypeScript và các dev dependencies

```bash
# Cài TypeScript và tsx (chạy TypeScript trực tiếp)
npm install -D typescript tsx @types/node
```

| Package | Vai trò |
|---|---|
| `typescript` | Trình biên dịch TypeScript → JavaScript |
| `tsx` | Chạy TypeScript trực tiếp mà không cần biên dịch thủ công |
| `@types/node` | Type definitions cho Node.js APIs |

---

### Bước 4: Khởi tạo cấu hình TypeScript

```bash
# Tạo file tsconfig.json với cấu hình mặc định
npx tsc --init
```

Sau đó chỉnh sửa `tsconfig.json` cho dự án:

```json
{
  "compilerOptions": {
    "rootDir": "./src",
    "outDir": "./dist",
    "module": "nodenext",
    "target": "esnext",
    "types": ["node"],
    "sourceMap": true,
    "declaration": true,
    "declarationMap": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "strict": true,
    "jsx": "react-jsx",
    "verbatimModuleSyntax": true,
    "isolatedModules": true,
    "noUncheckedSideEffectImports": true,
    "moduleDetection": "force",
    "skipLibCheck": true
  },
  "include": ["src/**/*"]
}
```

**Giải thích các tùy chọn quan trọng:**

| Tùy chọn | Giá trị | Ý nghĩa |
|---|---|---|
| `rootDir` | `./src` | Thư mục chứa source code |
| `outDir` | `./dist` | Thư mục chứa file sau khi biên dịch |
| `module` | `nodenext` | Hệ thống module ES Modules cho Node.js |
| `target` | `esnext` | Biên dịch lên phiên bản JavaScript mới nhất |
| `strict` | `true` | Bật kiểm tra kiểu nghiêm ngặt |
| `verbatimModuleSyntax` | `true` | Giữ nguyên kiểu import/export (không chuyển đổi) |
| `moduleDetection` | `force` | Buộc TypeScript dùng ES Modules |

---

### Bước 5: Cài đặt dependencies chính

```bash
# Cài LangGraph và LangChain
npm install @langchain/langgraph @langchain/core @langchain/openai

# Cài dotenv để quản lý biến môi trường
npm install dotenv
```

---

### Bước 6: Cấu hình file `.env`

Tạo file `.env` ở thư mục gốc:

```env
OPENROUTER_API_KEY=your_api_key_here
OPENROUTER_MODEL=nvidia/nemotron-3-ultra-550b-a55b:free
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
```

> ⚠️ **Lưu ý:** Không commit file `.env` vào git. Thêm `.env` vào `.gitignore`.

---

### Bước 7: Cấu hình scripts trong `package.json`

Thêm vào phần `scripts` trong `package.json`:

```json
{
  "scripts": {
    "dev": "tsx src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  }
}
```

| Script | Mô tả |
|---|---|
| `npm run dev` | Chạy TypeScript trực tiếp bằng `tsx` (không cần biên dịch) |
| `npm run build` | Biên dịch TypeScript → JavaScript vào thư mục `dist/` |
| `npm start` | Chạy file đã biên dịch bằng Node.js |

---

### Bước 8: Tạo cấu trúc thư mục và các file source

```bash
# Tạo thư mục src
mkdir src

# Tạo các file
touch src/state.ts src/node.ts src/graph.ts src/index.ts
```

---

### Bước 9: Kiểm tra môi trường

```bash
# Chạy project ở chế độ dev
npm run dev
```

Nếu thấy kết quả là một bài viết được định dạng về chủ đề đã nhập → môi trường đã hoạt động đúng.

---

### Bước 10: Build và chạy production

```bash
# Biên dịch TypeScript
npm run build

# Chạy file đã biên dịch
npm start
```

---

### Mẹo hữu ích khi làm việc với TypeScript

| Lệnh | Mô tả |
|---|---|
| `npx tsc --noEmit` | Kiểm tra kiểu mà không biên dịch |
| `npx tsc --watch` | Biên dịch tự động khi file thay đổi |
| `tsx src/index.ts` | Chạy trực tiếp file TypeScript |

---

## 📚 Các khái niệm nâng cao có thể học tiếp

| Khái niệm | Mô tả |
|---|---|
| **Conditional Edges** | Cạnh có điều kiện — graph rẽ nhánh dựa trên state |
| **Tools** | Hàm bên ngoài mà LLM có thể gọi (search, calculator,...) |
| **Agent** | Graph có khả năng tự quyết định bước tiếp theo |
| **State Persistence** | Lưu state vào database để resume sau khi bị gián đoạn |
| **Streaming** | Stream token từng phần thay vì chờ kết quả cuối |
| **Subgraphs** | Graph lồng nhau — một node chứa một subgraph con |
| **Human-in-the-loop** | Chèn bước xác nhận của con người vào graph |

---

## 🔗 Liên kết hữu ích

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [LangChain Documentation](https://python.langchain.com/docs/)
- [OpenRouter API](https://openrouter.ai/docs)
- [Annotation API](https://langchain-ai.github.io/langgraph/reference/annotation/)