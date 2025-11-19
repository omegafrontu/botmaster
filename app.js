// index.mjs
import express from "express";
import path from "path";
import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { createServer } from "http";
import { Server } from "socket.io";
import pool from "./mysql2.js";
import fs from "fs";

// import route from "./route.mjs";

dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server);

// ---------- EJS & static ----------
app.set("views", path.join(import.meta.dirname, "views")); // Must point to views/
app.set("view engine", "ejs");
app.use(express.static(path.join(import.meta.dirname, "public")));
app.use(express.json()); // needed for POST body
// app.use(route);

// ---------- Discord bot ----------
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// **Global array that holds the servers the user has “added”**
let addedServers = []; // { id, name, icon }

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
  // send the current list to any already-connected clients
  io.emit("servers", addedServers);
});

client.on("guildMemberAdd", (member) => {
  const data = {
    username: member.user.tag,
    guild: member.guild.name,
  };

  pool.getConnection((err, conn) => {
    if (err) {
      console.error("DB Connection Error:", err);
      return;
    }

    conn.query(
      "INSERT INTO servers (nam, ser) VALUES (?, ?)",
      [data.username, data.guild],
      (error, result) => {
        conn.release(); // Always release connection
        if (error) {
          console.error("DB Query Error:", error);
          return;
        }
        console.log(`${data.username} joined ${data.guild}`);
      }
    );
  });

  io.emit("memberJoin", data);
});

// ---------- Socket.IO ----------
io.on("connection", (socket) => {
  console.log("Socket connected");
  socket.emit("servers", addedServers); // send current list

  socket.on("disconnect", () => console.log("Socket disconnected"));
});

app.get("/", (req, res) => {
  res.render("app");
});

// ---------- API: Add a server ----------

app.post("/api/add-server", (req, res) => {
  const { guildId } = req.body;

  if (!guildId) return res.status(400).json({ error: "guildId required" });

  const guild = client.guilds.cache.get(guildId);
  if (!guild) {
    return res.status(404).json({ error: "Bot is not in that server" });
  }

  // Avoid duplicates
  if (addedServers.some((s) => s.id === guildId)) {
    return res.status(400).json({ error: "Server already added" });
  }

  const serverInfo = {
    id: guild.id,
    name: guild.name,
    icon: guild.iconURL({ dynamic: true, size: 128 }) || null,
  };

  addedServers.push(serverInfo);
  io.emit("servers", addedServers); // broadcast to all clients
  res.json({ success: true, server: serverInfo });
});

// Add near your other routes
app.get("/export-joins", async (req, res) => {
  try {
    const [rows] = await pool.execute(
      "SELECT nam, ser FROM servers ORDER BY joined_at DESC"
    );
    const txt = rows
      .map((r) => `[${r.joined_at}] ${r.mem} → ${r.server}`)
      .join("\n");

    res.setHeader("Content-Type", "text/plain");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="discord-joins.txt"'
    );
    res.send(txt || "No joins recorded yet.");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error generating log");
  }
});

app.get("/download-log", (req, res) => {
  const logContent =
    "User#1234 joined My Server\nUser#5678 joined Cool Server\n";

  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Content-Disposition", 'attachment; filename="join-logs.txt"');
  res.send(logContent);
});

app.get("/generate-log", (req, res) => {
  const logContent = "Bot started at " + new Date() + "\n";
  const filePath = path.join(import.meta.dirname, "logs", "latest.txt");

  // Ensure logs folder exists
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, logContent);

  res.download(filePath, "latest-log.txt", (err) => {
    if (err) console.error(err);
    // Optional: delete after send
    // fs.unlinkSync(filePath);
  });
});
// ---------- Start ----------
client.login(process.env.BOT_TOKEN).catch(console.error);
const PORT = process.env.PORT || 100;
server.listen(PORT, () => console.log(`http://localhost:${PORT}`));
