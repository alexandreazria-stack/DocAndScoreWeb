import Fastify from "fastify";
import cors from "@fastify/cors";
import { Server as SocketIOServer } from "socket.io";

// ===== Types =====
interface Session {
  id: string;
  code: string;
  testId: string;
  doctorName: string;
  status: "waiting" | "connected" | "progress" | "completed";
  answeredCount: number;
  totalQuestions: number;
  answers: Record<number, number>;
  totalScore: number | null;
  createdAt: number;
  expiresAt: number;
}

// ===== In-memory store (swap for Redis/Supabase later) =====
const sessions = new Map<string, Session>();

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function purgeExpired() {
  const now = Date.now();
  for (const [code, session] of sessions) {
    if (session.expiresAt < now) sessions.delete(code);
  }
}

// Purge every 5 min
setInterval(purgeExpired, 5 * 60 * 1000);

// ===== Fastify =====
const app = Fastify({ logger: true });

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://localhost:4000",
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.register(cors, {
  origin: ALLOWED_ORIGINS,
  methods: ["GET", "POST", "PATCH"],
});

// ===== REST Endpoints =====

// Health check
app.get("/health", async () => ({ status: "ok", sessions: sessions.size }));

// Create session (doctor)
app.post<{ Body: { testId: string; totalQuestions: number; doctorName: string } }>(
  "/api/sessions",
  async (req, reply) => {
    const { testId, totalQuestions, doctorName } = req.body;
    if (!testId || !totalQuestions || !doctorName) {
      return reply.status(400).send({ error: "Missing fields" });
    }

    const session: Session = {
      id: crypto.randomUUID(),
      code: generateCode(),
      testId,
      doctorName,
      status: "waiting",
      answeredCount: 0,
      totalQuestions,
      answers: {},
      totalScore: null,
      createdAt: Date.now(),
      expiresAt: Date.now() + 30 * 60 * 1000,
    };

    sessions.set(session.code, session);
    io.to(`doctor:${session.code}`).emit("session:update", session);
    return reply.status(201).send(session);
  }
);

// Get session by code (patient or doctor)
app.get<{ Params: { code: string } }>(
  "/api/sessions/:code",
  async (req, reply) => {
    purgeExpired();
    const session = sessions.get(req.params.code);
    if (!session) return reply.status(404).send({ error: "Session not found" });
    return session;
  }
);

// Update session (patient answering)
app.patch<{ Params: { code: string }; Body: Partial<Session> }>(
  "/api/sessions/:code",
  async (req, reply) => {
    const session = sessions.get(req.params.code);
    if (!session) return reply.status(404).send({ error: "Session not found" });

    const allowed = ["status", "answeredCount", "answers", "totalScore"] as const;
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        (session as any)[key] = req.body[key];
      }
    }

    sessions.set(session.code, session);
    // Notify doctor in real-time
    io.to(`doctor:${session.code}`).emit("session:update", session);
    return session;
  }
);

// List active sessions for a doctor
app.get("/api/sessions", async () => {
  purgeExpired();
  return [...sessions.values()].filter((s) => s.status !== "completed");
});

// ===== Socket.IO =====
const io = new SocketIOServer(app.server, {
  cors: { origin: ALLOWED_ORIGINS, methods: ["GET", "POST"] },
  path: "/ws",
});

io.on("connection", (socket) => {
  app.log.info(`Socket connected: ${socket.id}`);

  // Doctor joins a room for their session
  socket.on("doctor:join", (code: string) => {
    socket.join(`doctor:${code}`);
    app.log.info(`Doctor joined room: doctor:${code}`);
  });

  // Patient connects to session
  socket.on("patient:join", (code: string) => {
    const session = sessions.get(code);
    if (!session) {
      socket.emit("error", { message: "Session not found" });
      return;
    }
    socket.join(`session:${code}`);
    session.status = "connected";
    sessions.set(code, session);
    io.to(`doctor:${code}`).emit("session:update", session);
    socket.emit("session:data", session);
  });

  // Patient sends answer
  socket.on("patient:answer", (data: { code: string; questionIndex: number; value: number }) => {
    const session = sessions.get(data.code);
    if (!session) return;

    session.status = "progress";
    session.answers[data.questionIndex] = data.value;
    session.answeredCount = Object.keys(session.answers).length;
    sessions.set(data.code, session);
    io.to(`doctor:${data.code}`).emit("session:update", session);
  });

  // Patient completes test
  socket.on("patient:complete", (data: { code: string; totalScore: number }) => {
    const session = sessions.get(data.code);
    if (!session) return;

    session.status = "completed";
    session.totalScore = data.totalScore;
    sessions.set(data.code, session);
    io.to(`doctor:${data.code}`).emit("session:update", session);
    io.to(`doctor:${data.code}`).emit("session:completed", session);
  });

  socket.on("disconnect", () => {
    app.log.info(`Socket disconnected: ${socket.id}`);
  });
});

// ===== Start =====
const PORT = parseInt(process.env.PORT || "3001", 10);
const HOST = process.env.HOST || "0.0.0.0";

app.listen({ port: PORT, host: HOST }).then(() => {
  app.log.info(`Server running on ${HOST}:${PORT}`);
}).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
