import express from "express";
import cors from "cors";
import path from "path";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import { authenticateToken } from "./middleware/authMiddleware";

const app = express();
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
app.use(express.json({ limit: "5mb" }));
app.use("/api/auth", authRoutes);
app.use("/api/projects", projectRoutes);
app.get("/", (_req, res) => res.json({ message: "Collaborative 3D Annotation Backend" }));
app.get("/health", (_req, res) => res.json({ status: "healthy" }));
app.get("/api/test-protected", authenticateToken, (req, res) => {
  res.json({ message: "You accessed a protected route", user: (req as any).user });
});
export default app;
