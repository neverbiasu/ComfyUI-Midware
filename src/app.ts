import express from "express";
import routes from "./routes";
import dotenv from "dotenv";
import cors from "cors";

dotenv.config();

const app = express();

// CORS配置
app.use(
  cors({
    origin: "http://localhost:5478",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Accept"],
    credentials: true,
  })
);

// 请求体解析配置
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// 路由
app.use("/api", routes);

// 全局错误处理
app.use(
  (
    err: any,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction
  ) => {
    console.error("Error:", err);

    // 检查连接是否仍然存活
    if (!res.connection || !res.connection.writable) {
      console.error("Connection already closed");
      return;
    }

    // 检查响应头是否已发送
    if (!res.headersSent) {
      res.status(500).json({
        error: err.message || "Internal server error",
        code: err.code,
      });
    }
  }
);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// 优雅退出处理
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});
