const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const ACTIONS = require("./src/actions");

const app = express();
const server = http.createServer(app);

// CORS configuration for production
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : true; // allow all origins in development

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: false,
  },
  allowEIO3: true,
});

const userSocketMap = {};
const voiceUsers = {}; // socketId -> roomId

app.use(express.static(path.join(__dirname, "build")));

// Health-check endpoint so phones can verify they can reach the backend
app.get("/ping", (_req, res) => {
  res.json({ ok: true, time: Date.now() });
});

function getAllConnectedClients(roomId) {
  return Array.from(io.sockets.adapter.rooms.get(roomId) || []).map(
    (socketId) => ({
      socketId,
      username: userSocketMap[socketId],
    }),
  );
}

io.on("connection", (socket) => {
  console.log("socket connected:", socket.id);

  socket.on(ACTIONS.JOIN, ({ roomId, username }) => {
    userSocketMap[socket.id] = username;
    socket.join(roomId);
    const clients = getAllConnectedClients(roomId);
    clients.forEach(({ socketId }) => {
      io.to(socketId).emit(ACTIONS.JOINED, {
        clients,
        username,
        socketId: socket.id,
      });
    });
  });

  socket.on(ACTIONS.CODE_CHANGE, ({ roomId, code }) => {
    socket.in(roomId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.SYNC_CODE, ({ socketId, code }) => {
    io.to(socketId).emit(ACTIONS.CODE_CHANGE, { code });
  });

  socket.on(ACTIONS.TYPING, ({ roomId, username, isTyping }) => {
    socket.in(roomId).emit(ACTIONS.TYPING, { username, isTyping });
  });

  socket.on(ACTIONS.CURSOR_CHANGE, ({ roomId, username, cursor }) => {
    socket.in(roomId).emit(ACTIONS.CURSOR_CHANGE, { username, cursor });
  });

  // Voice chat signaling
  socket.on(ACTIONS.VOICE_JOIN, ({ roomId, username }) => {
    voiceUsers[socket.id] = roomId;
    socket.to(roomId).emit(ACTIONS.VOICE_USER_JOINED, {
      socketId: socket.id,
      username,
    });
  });

  socket.on(ACTIONS.VOICE_SIGNAL, ({ toSocketId, signal, username }) => {
    io.to(toSocketId).emit(ACTIONS.VOICE_SIGNAL, {
      fromSocketId: socket.id,
      signal,
      username,
    });
  });

  socket.on(ACTIONS.VOICE_LEAVE, ({ roomId, username }) => {
    delete voiceUsers[socket.id];
    socket.to(roomId).emit(ACTIONS.VOICE_USER_LEFT, {
      socketId: socket.id,
      username,
    });
  });

  socket.on("disconnecting", () => {
    const rooms = [...socket.rooms];
    rooms.forEach((roomId) => {
      socket.in(roomId).emit(ACTIONS.DISCONNECTED, {
        socketId: socket.id,
        username: userSocketMap[socket.id],
      });
      // Notify voice users if this socket was in voice
      if (voiceUsers[socket.id]) {
        socket.in(roomId).emit(ACTIONS.VOICE_USER_LEFT, {
          socketId: socket.id,
          username: userSocketMap[socket.id],
        });
      }
    });
    delete userSocketMap[socket.id];
    delete voiceUsers[socket.id];
  });
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
