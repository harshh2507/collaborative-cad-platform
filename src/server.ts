import "dotenv/config";
import app from "./app";
import pool from "./config/database";
import { createServer } from "http";
import { Server } from "socket.io";

const PORT = process.env.PORT || 5000;

// Create HTTP server using Express app
const httpServer = createServer(app);

// Create Socket.IO server
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("test-message", (message) => {
    console.log("Message received:", message);
  });

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