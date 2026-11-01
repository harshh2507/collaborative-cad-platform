import "dotenv/config";
import { createServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import app from "./app";
import pool from "./config/database";
import { JWT_SECRET } from "./config/env";
import { AuthenticatedUser } from "./types/auth";
import { canEditProject, getProjectMemberRole } from "./services/projectService";

const PORT = Number(process.env.PORT) || 5000;
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173,http://localhost:5174")
  .split(",").map((origin) => origin.trim()).filter(Boolean);
const MAX_SCENE_BYTES = 2 * 1024 * 1024;
const roomFor = (projectId: number) => `project:${projectId}`;
type Ack = (result: {
  ok: boolean;
  message?: string;
  projectId?: number;
  role?: string;
  id?: string;
}) => void;
type CollabMessage = Record<string, unknown> & { type?: string; projectId?: unknown };
type Presence = { id: string; name: string; userId: number; lastSeen: number };

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
  maxHttpBufferSize: 5 * 1024 * 1024,
});

// All Socket.IO connections use the same JWT as the REST API.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (typeof token !== "string" || !token) return next(new Error("Authentication required"));
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    if (!Number.isSafeInteger(decoded.user_id) || decoded.user_id <= 0 || typeof decoded.email !== "string") {
      return next(new Error("Invalid user token"));
    }
    socket.data.user = { user_id: decoded.user_id, email: decoded.email } satisfies AuthenticatedUser;
    next();
  } catch {
    next(new Error("Invalid or expired token"));
  }
});

async function loadSavedScene(projectId: number): Promise<Record<string, unknown> | null> {
  const result = await pool.query(
    "SELECT scene_data FROM project_scenes WHERE project_id = $1",
    [projectId],
  );
  const stored = result.rows[0]?.scene_data;
  if (!stored || typeof stored !== "object") return null;
  // Support the original schema's direct-scene default and the persisted envelope used below.
  if ("scene" in stored && stored.scene && typeof stored.scene === "object") {
    return {
      type: "scene",
      scene: stored.scene,
      transformVersions: stored.transformVersions && typeof stored.transformVersions === "object" ? stored.transformVersions : {},
    };
  }
  return { type: "scene", scene: stored, transformVersions: {} };
}

async function persistScene(projectId: number, payload: Record<string, unknown>): Promise<void> {
  const envelope = {
    scene: payload.scene,
    transformVersions: payload.transformVersions && typeof payload.transformVersions === "object" ? payload.transformVersions : {},
  };
  const serialized = JSON.stringify(envelope);
  if (Buffer.byteLength(serialized, "utf8") > MAX_SCENE_BYTES) {
    throw new Error("Scene is too large to persist (maximum 2 MB)");
  }
  await pool.query(
    `INSERT INTO project_scenes (project_id, scene_data, updated_at)
     VALUES ($1, $2::jsonb, NOW())
     ON CONFLICT (project_id)
     DO UPDATE SET scene_data = EXCLUDED.scene_data, updated_at = NOW()`,
    [projectId, serialized],
  );
}


async function persistTransform(projectId: number, payload: Record<string, unknown>): Promise<void> {
  const objectId = String(payload.objectId ?? "");
  const transform = payload.transform as Record<string, unknown> | undefined;
  if (!objectId || !transform || typeof transform !== "object") return;

  for (const key of ["position", "rotation", "scale"]) {
    const value = transform[key];
    if (value !== undefined && (!Array.isArray(value) || value.length !== 3 || value.some((n) => !Number.isFinite(Number(n))))) {
      throw new Error(`Invalid transform ${key}`);
    }
  }

  const saved = await loadSavedScene(projectId) as (Record<string, unknown> & { scene?: Record<string, any>; transformVersions?: Record<string, number> }) | null;
  if (!saved || !saved.scene || typeof saved.scene !== "object") return;

  const scene = saved.scene;
  const versions = { ...(saved.transformVersions || {}) };
  let target: Record<string, any> | undefined;
  if (objectId === "uploaded-model") {
    target = scene.model && typeof scene.model === "object" ? scene.model : undefined;
  } else if (Array.isArray(scene.primitives)) {
    target = scene.primitives.find((item: Record<string, unknown>) => String(item.id) === objectId);
  }
  if (!target) return;

  for (const key of ["position", "rotation", "scale"]) {
    if (transform[key] !== undefined) target[key] = transform[key];
  }
  const version = Number(payload.version || 0);
  if (Number.isFinite(version) && version > 0) versions[objectId] = Math.max(Number(versions[objectId] || 0), version);
  await persistScene(projectId, { scene, transformVersions: versions });
}

async function notifyPresenceLeft(socket: Socket, room: string | undefined, clientId: string | undefined) {
  if (!room || !clientId) return;
  // A client ID may be open in another tab; only remove it after its final socket leaves.
  const remaining = await io.in(room).fetchSockets();
  const stillPresent = remaining.some((candidate) => candidate.id !== socket.id && candidate.data.clientId === clientId);
  if (!stillPresent) socket.to(room).emit("collaboration-message", {
    type: "presence-left", userId: clientId, sender: "server",
  });
}

io.on("connection", (socket: Socket) => {
  const user = socket.data.user as AuthenticatedUser;
  console.log(`Socket connected: ${socket.id} (user ${user.user_id})`);

  socket.on("join-project", async (input: unknown, acknowledge?: Ack) => {
    try {
      // Accept the original scalar project ID and the newer object payload.
      const payload = input && typeof input === "object" ? input as Record<string, unknown> : {};
      const projectId = Number(input && typeof input === "object" ? payload.projectId : input);
      const clientId = String(payload.clientId || socket.id).slice(0, 120);
      const userName = String(payload.userName || user.email).trim().slice(0, 100) || user.email;
      if (!Number.isSafeInteger(projectId) || projectId <= 0) {
        acknowledge?.({ ok: false, message: "Invalid project ID" }); return;
      }
      const role = await getProjectMemberRole(projectId, user.user_id);
      if (!role) { acknowledge?.({ ok: false, message: "You are not a member of this project" }); return; }

      const previousRoom = socket.data.projectRoom as string | undefined;
      const previousClientId = socket.data.clientId as string | undefined;
      if (previousRoom && previousRoom !== roomFor(projectId)) {
        socket.leave(previousRoom);
        await notifyPresenceLeft(socket, previousRoom, previousClientId);
      }

      const room = roomFor(projectId);
      await socket.join(room);
      socket.data.projectId = projectId;
      socket.data.projectRoom = room;
      socket.data.clientId = clientId;
      socket.data.userName = userName;
      socket.data.projectRole = role;
      socket.data.presence = { id: clientId, name: userName, userId: user.user_id, lastSeen: Date.now() } satisfies Presence;

      const roomSockets = await io.in(room).fetchSockets();
      const users = roomSockets
        .map((candidate) => candidate.data.presence as Presence | undefined)
        .filter((presence): presence is Presence => Boolean(presence && typeof presence.id === "string"));
      socket.emit("collaboration-message", { type: "presence-list", users, sender: "server" });
      socket.to(room).emit("collaboration-message", { type: "presence", user: socket.data.presence, sender: "server" });

      try {
        const savedScene = await loadSavedScene(projectId);
        if (savedScene) socket.emit("collaboration-message", { ...savedScene, sender: "server" });
      } catch (error) {
        // Room collaboration remains available if the migration has not yet been applied.
        console.error("Could not load persisted scene. Apply database/migrations/20261023_project_scenes.sql:", error);
      }

      acknowledge?.({ ok: true, projectId, role });
      console.log(`User ${user.user_id} (${role}) joined ${room}`);
    } catch (error) {
      console.error("Join project failed:", error);
      acknowledge?.({ ok: false, message: "Could not join project" });
    }
  });

  socket.on("leave-project", async (input?: unknown, acknowledge?: Ack) => {
    const activeProjectId = socket.data.projectId as number | undefined;
    const requestedProjectId = input === undefined ? activeProjectId : Number(input);
    const room = socket.data.projectRoom as string | undefined;
    const clientId = socket.data.clientId as string | undefined;
    if (!room || !activeProjectId || requestedProjectId !== activeProjectId) {
      acknowledge?.({ ok: true }); return;
    }
    socket.leave(room);
    delete socket.data.projectId;
    delete socket.data.projectRoom;
    delete socket.data.clientId;
    delete socket.data.presence;
    delete socket.data.projectRole;
    await notifyPresenceLeft(socket, room, clientId);
    acknowledge?.({ ok: true });
  });

  socket.on("collaboration-message", async (incoming: CollabMessage, acknowledge?: Ack) => {
    try {
      if (!incoming || typeof incoming !== "object" || typeof incoming.type !== "string") {
        acknowledge?.({ ok: false, message: "Invalid collaboration message" }); return;
      }
      const projectId = Number(incoming.projectId ?? socket.data.projectId);
      const room = roomFor(projectId);
      if (!Number.isSafeInteger(projectId) || projectId <= 0 || socket.data.projectId !== projectId || !socket.rooms.has(room)) {
        acknowledge?.({ ok: false, message: "Join the project before sending updates" }); return;
      }
      const role = await getProjectMemberRole(projectId, user.user_id);
      if (!role) { acknowledge?.({ ok: false, message: "Not a project member" }); return; }

      const allowedTypes = new Set(["scene-request", "scene", "state-response", "transform", "camera", "presence"]);
      if (!allowedTypes.has(incoming.type)) { acknowledge?.({ ok: false, message: "Unsupported collaboration message type" }); return; }
      const writeTypes = new Set(["scene", "state-response", "transform"]);
      if (writeTypes.has(incoming.type) && !canEditProject(role)) {
        acknowledge?.({ ok: false, message: "Your project role is read-only" }); return;
      }

      const { projectId: _projectId, roomId: _roomId, sender: _sender, ...payload } = incoming;
      let persistenceFailed = false;
      if (incoming.type === "scene" || incoming.type === "state-response") {
        if (!payload.scene || typeof payload.scene !== "object" || Array.isArray(payload.scene)) {
          acknowledge?.({ ok: false, message: "Scene payload is invalid" }); return;
        }
        if (Buffer.byteLength(JSON.stringify(payload), "utf8") > MAX_SCENE_BYTES) {
          acknowledge?.({ ok: false, message: "Scene payload exceeds the 2 MB limit" }); return;
        }
        try { await persistScene(projectId, payload); }
        catch (error) {
          persistenceFailed = true;
          console.error("Scene persistence failed:", error);
        }
      }
      if (incoming.type === "transform") {
        try { await persistTransform(projectId, payload); }
        catch (error) {
          persistenceFailed = true;
          console.error("Transform persistence failed:", error);
        }
      }

      if (incoming.type === "presence") {
        const incomingUser = payload.user && typeof payload.user === "object" ? payload.user as Record<string, unknown> : {};
        const clientId = String(socket.data.clientId || socket.id);
        socket.data.presence = {
          id: clientId,
          name: String(incomingUser.name || socket.data.userName || user.email).trim().slice(0, 100),
          userId: user.user_id,
          lastSeen: Date.now(),
        } satisfies Presence;
        payload.user = socket.data.presence;
      }

      // A scene request is relayed so connected peers can respond; persisted state is also sent directly.
      if (incoming.type === "scene-request") {
        try {
          const savedScene = await loadSavedScene(projectId);
          if (savedScene) socket.emit("collaboration-message", { ...savedScene, sender: "server" });
        } catch (error) {
          console.error("Could not load saved scene:", error);
        }
      }
      socket.to(room).emit("collaboration-message", { ...payload, sender: String(user.user_id) });
      acknowledge?.(persistenceFailed
        ? { ok: false, message: "Live update sent, but saving to PostgreSQL failed. Check the backend log." }
        : { ok: true });
    } catch (error) {
      console.error("Collaboration message failed:", error);
      acknowledge?.({ ok: false, message: "Could not process collaboration message" });
    }
  });

  // Project chat is persisted and broadcast only to authenticated project members.
  socket.on("chat-history", async (input: { projectId?: unknown }, acknowledge?: (result: any) => void) => {
    try {
      const projectId = Number(input?.projectId ?? socket.data.projectId);
      if (!Number.isSafeInteger(projectId) || projectId <= 0 || socket.data.projectId !== projectId || !socket.rooms.has(roomFor(projectId))) {
        acknowledge?.({ ok: false, message: "Join the project before loading chat" }); return;
      }
      const role = await getProjectMemberRole(projectId, user.user_id);
      if (!role) { acknowledge?.({ ok: false, message: "Not a project member" }); return; }
      const result = await pool.query(
        `SELECT m.message_id AS id, m.message_text AS text, u.name AS "user",
                to_char(m.created_at AT TIME ZONE 'UTC', 'HH24:MI') AS time
         FROM project_chat_messages m JOIN users u ON u.user_id = m.user_id
         WHERE m.project_id = $1 ORDER BY m.created_at DESC, m.message_id DESC LIMIT 100`,
        [projectId],
      );
      acknowledge?.({ ok: true, messages: result.rows.reverse().map((row) => ({ ...row, id: String(row.id) })) });
    } catch (error) {
      console.error("Chat history failed:", error);
      acknowledge?.({ ok: false, message: "Could not load chat history" });
    }
  });

  socket.on("chat-send", async (input: { projectId?: unknown; text?: unknown }, acknowledge?: Ack) => {
    try {
      const projectId = Number(input?.projectId ?? socket.data.projectId);
      const text = typeof input?.text === "string" ? input.text.trim() : "";
      if (!Number.isSafeInteger(projectId) || projectId <= 0 || socket.data.projectId !== projectId || !socket.rooms.has(roomFor(projectId))) {
        acknowledge?.({ ok: false, message: "Join the project before sending messages" }); return;
      }
      if (!text || text.length > 2000) { acknowledge?.({ ok: false, message: "Message must contain 1–2000 characters" }); return; }
      const now = Date.now();
      const rate = socket.data.chatRate as { start: number; count: number } | undefined;
      if (!rate || now - rate.start >= 2000) socket.data.chatRate = { start: now, count: 1 };
      else if (rate.count >= 6) { acknowledge?.({ ok: false, message: "Please slow down before sending another message" }); return; }
      else rate.count += 1;
      const role = await getProjectMemberRole(projectId, user.user_id);
      if (!role) { acknowledge?.({ ok: false, message: "Not a project member" }); return; }
      const result = await pool.query(
        `INSERT INTO project_chat_messages (project_id, user_id, message_text)
         VALUES ($1, $2, $3)
         RETURNING message_id AS id, message_text AS text,
                   to_char(created_at AT TIME ZONE 'UTC', 'HH24:MI') AS time`,
        [projectId, user.user_id, text],
      );
      const message = { ...result.rows[0], id: String(result.rows[0].id), user: String(socket.data.userName || user.email), projectId };
      io.to(roomFor(projectId)).emit("chat-message", message);
      acknowledge?.({ ok: true, id: message.id });
    } catch (error) {
      console.error("Chat send failed:", error);
      acknowledge?.({ ok: false, message: "Could not send message" });
    }
  });

  socket.on("disconnecting", async () => {
    const room = socket.data.projectRoom as string | undefined;
    const clientId = socket.data.clientId as string | undefined;
    if (room && clientId) {
      try { await notifyPresenceLeft(socket, room, clientId); }
      catch (error) { console.error("Presence cleanup failed:", error); }
    }
  });
  socket.on("disconnect", () => console.log(`Socket disconnected: ${socket.id}`));
});

pool.query("SELECT NOW()")
  .then((result) => console.log("PostgreSQL connected:", result.rows[0]))
  .catch((error) => console.error("PostgreSQL connection failed:", error));

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Allowed frontend origins: ${allowedOrigins.join(", ")}`);
});
