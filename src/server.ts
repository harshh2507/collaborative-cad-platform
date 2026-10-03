import "dotenv/config";
import app from "./app";
import pool from "./config/database";
import { createServer } from "http";
import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "./config/env";
import { AuthenticatedUser } from "./types/auth";
import { getProjectMemberRole } from "./services/projectService";

const PORT = process.env.PORT || 5000;

// Create HTTP server using Express app
const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});
// ADD AUTHENTICATION MIDDLEWARE HERE
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;

  if (typeof token !== "string") {
    return next(new Error("Authentication required"));
  }

  try {
    const decoded = jwt.verify(
      token,
      JWT_SECRET as string
    ) as AuthenticatedUser;

    if (!decoded.user_id) {
      return next(new Error("Invalid user token"));
    }

    socket.data.user = decoded;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

// Socket.IO connection

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("test-message", (message) => {
    console.log("Message received:", message);
  });

  // Add the join-project handler here
  socket.on(
    "join-project",
    async (
      projectIdInput: unknown,
      callback?: (result: { ok: boolean; message?: string }) => void
    ) => {
      const projectId = Number(projectIdInput);

      if (!Number.isInteger(projectId) || projectId <= 0) {
        callback?.({ ok: false, message: "Invalid project ID" });
        return;
      }

      try {
        const user = socket.data.user as AuthenticatedUser;

        const role = await getProjectMemberRole(
          projectId,
          user.user_id
        );

        if (!role) {
          callback?.({
            ok: false,
            message: "You are not a member of this project",
          });
          return;
        }

        await socket.join(`project:${projectId}`);

        callback?.({ ok: true });
        console.log(
          `User ${user.user_id} joined project ${projectId}`
        );
      } catch (error) {
        console.error("Join project error:", error);
        callback?.({
          ok: false,
          message: "Could not join project",
        });
      }
    }
  );

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// PostgreSQL connection test
pool.query("SELECT NOW()")
  .then((result) => {
    console.log("PostgreSQL connected:", result.rows[0]);
  })
  .catch((error) => {
    console.error("PostgreSQL connection failed:", error);
  });

// Start server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Socket.IO server running on http://localhost:${PORT}`);
});