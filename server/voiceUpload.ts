/**
 * Voice message upload REST endpoint + WebRTC signaling via WebSocket.
 * POST /api/voice/upload  (multipart/form-data, field: "audio")
 * GET  /api/voice/messages/:matchId
 * POST /api/voice/played/:messageId
 *
 * WebSocket signaling at /api/voice/signal
 * Events: call-offer, call-answer, ice-candidate, call-end, call-reject
 */
import type { Express } from "express";
import type { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import multer from "multer";
import { createContext } from "./_core/context";
import { storagePut } from "./storage";
import { getDb } from "./db";
import { voiceMessages } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// ─── Multer for audio uploads ─────────────────────────────────────────────────
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype.startsWith("audio/") ||
      file.mimetype === "video/webm" // Chrome records as video/webm with audio
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only audio files are allowed"));
    }
  },
});

// ─── WebSocket signaling store ────────────────────────────────────────────────
// Map: userId -> WebSocket
const connectedUsers = new Map<number, WebSocket>();

export function registerVoiceRoutes(app: Express, httpServer: HttpServer) {
  // ── Upload voice message ────────────────────────────────────────────────────
  app.post("/api/voice/upload", upload.single("audio"), async (req, res) => {
    try {
      const ctx = await createContext({ req, res } as any);
      if (!ctx.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const file = (req as any).file as Express.Multer.File | undefined;
      if (!file) {
        res.status(400).json({ error: "No audio file provided" });
        return;
      }

      const matchId = parseInt((req.body as any).matchId);
      const durationSeconds = parseFloat((req.body as any).durationSeconds || "0");

      if (!matchId || isNaN(matchId)) {
        res.status(400).json({ error: "matchId is required" });
        return;
      }

      // Upload to S3
      const ext = file.mimetype.includes("webm") ? "webm" : "mp3";
      const { key, url } = await storagePut(
        `voice/${ctx.user.id}/${Date.now()}.${ext}`,
        file.buffer,
        file.mimetype,
      );

      // Save to DB
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const [result] = await db.insert(voiceMessages).values({
        matchId,
        senderId: ctx.user.id,
        s3Key: key,
        s3Url: url,
        durationSeconds,
      });

      res.json({ id: (result as any).insertId, key, url, durationSeconds });
    } catch (err: any) {
      console.error("[voice/upload]", err);
      res.status(500).json({ error: err.message });
    }
  });

  // ── List voice messages for a match ────────────────────────────────────────
  app.get("/api/voice/messages/:matchId", async (req, res) => {
    try {
      const ctx = await createContext({ req, res } as any);
      if (!ctx.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const matchId = parseInt(req.params.matchId);
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      const messages = await db
        .select()
        .from(voiceMessages)
        .where(eq(voiceMessages.matchId, matchId))
        .orderBy(voiceMessages.createdAt);

      res.json(messages);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── Mark voice message as played ───────────────────────────────────────────
  app.post("/api/voice/played/:messageId", async (req, res) => {
    try {
      const ctx = await createContext({ req, res } as any);
      if (!ctx.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const messageId = parseInt(req.params.messageId);
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");

      await db
        .update(voiceMessages)
        .set({ playedAt: new Date() })
        .where(
          and(
            eq(voiceMessages.id, messageId),
            eq(voiceMessages.senderId, ctx.user.id === ctx.user.id ? ctx.user.id : -1),
          ),
        );

      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ── WebSocket signaling server for WebRTC ──────────────────────────────────
  const wss = new WebSocketServer({ server: httpServer, path: "/api/voice/signal" });

  wss.on("connection", (ws: WebSocket, req: import("http").IncomingMessage) => {
    let userId: number | null = null;

    ws.on("message", (raw: Buffer | string) => {
      try {
        const msg = JSON.parse(raw.toString());

        // First message must be { type: "register", userId }
        if (msg.type === "register") {
          userId = parseInt(msg.userId);
          if (userId && !isNaN(userId)) {
            connectedUsers.set(userId, ws);
            ws.send(JSON.stringify({ type: "registered", userId }));
          }
          return;
        }

        // All other messages need a registered userId and a targetUserId
        if (!userId) return;
        const targetId = parseInt(msg.targetUserId);
        if (!targetId || isNaN(targetId)) return;

        const targetWs = connectedUsers.get(targetId);
        if (!targetWs || targetWs.readyState !== WebSocket.OPEN) {
          // Target not online
          if (msg.type === "call-offer") {
            ws.send(JSON.stringify({ type: "call-unavailable", targetUserId: targetId }));
          }
          return;
        }

        // Forward signaling message to target
        targetWs.send(
          JSON.stringify({
            ...msg,
            fromUserId: userId,
          }),
        );
      } catch (e) {
        // ignore malformed messages
      }
    });

    ws.on("close", () => {
      if (userId) {
        connectedUsers.delete(userId);
      }
    });
  });
}
