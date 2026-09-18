import express from "express";
import path from "path";
import authRoutes from "./routes/authRoutes";
import projectRoutes from "./routes/projectRoutes";
import { authenticateToken } from "./middleware/authMiddleware";


const app = express();

app.use(
  "/uploads",
  express.static(path.join(process.cwd(), "uploads"))
);

app.use(express.json());

app.use("/api/auth", authRoutes);

app.use("/api/projects", projectRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Collaborative 3D Annotation Backend"
  });
});

app.get("/health", (req, res) => {
  res.json({
    status: "healthy"
  });
});
app.get("/api/test-protected", authenticateToken, (req, res) => {
  res.json({
    message: "You accessed a protected route",
    user: (req as any).user
  });
});
export default app;