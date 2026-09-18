import express from "express";
import authRoutes from "./routes/authRoutes";
import { authenticateToken } from "./middleware/authMiddleware";

const app = express();

app.use(express.json());

app.use("/api/auth", authRoutes);

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