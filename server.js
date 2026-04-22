// server.js / app.js

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config({ path: "../.env" });
const session = require("express-session");
const path = require("path");

// 🔥 NEW (SOCKET)
const http = require("http");
const { Server } = require("socket.io");

// MODELS
const FriendsServer = require("./models/FriendsServer"); // make sure path correct

const app = express();
app.set("trust proxy", 1);
/* ---------------- MIDDLEWARE ---------------- */

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

app.use("/uploads", express.static("uploads"));
app.use(express.static(path.join(__dirname, "public")));

app.get("/player.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public/player.html"));
});

const uploadsPath = path.join(__dirname, "uploads");
console.log("📂 Serving static files from:", uploadsPath, "on /uploads");

/* ---------------- DB ---------------- */

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Connection Failed:", err));

/* ---------------- SESSION ---------------- */

app.use(
  session({
    secret: "yourSuperSecretKey",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
      secure: false,
    },
  })
);

/* ---------------- ROUTES ---------------- */

const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

/* =========================================================
   🚀 SOCKET.IO SETUP (MAIN PART)
========================================================= */

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"] // 🔥 IMPORTANT FOR RENDER
});

app.set("io", io); // 🔥 VERY IMPORTANT

io.on("connection", (socket) => {
  console.log("⚡ User connected:", socket.id);

  /* -------- JOIN ROOM -------- */
  socket.on("joinRoom", ({ serverCode, username }) => {
    socket.join(serverCode);
    console.log(`👤 ${username} joined ${serverCode}`);
  });

  /* -------- REMOVE PLAYER -------- */
  socket.on("removePlayer", async ({ serverCode, playerName }) => {
    try {
      const serverDoc = await FriendsServer.findOne({
        serverCode: serverCode.toUpperCase(),
      });

      if (!serverDoc) return;

      serverDoc.players = serverDoc.players.filter(
        (p) => p.name !== playerName
      );

      await serverDoc.save();

      io.to(serverCode).emit("playersUpdate", {
        players: serverDoc.players.map((p) => p.name),
      });

    } catch (err) {
      console.log("❌ removePlayer socket error", err);
    }
  });

  /* -------- START GAME -------- */


  socket.on("disconnect", () => {
    console.log("❌ User disconnected:", socket.id);
  });
});

/* =========================================================
   🚀 START SERVER
========================================================= */

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running with SOCKET on http://localhost:${PORT}`);
});
