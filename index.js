// index.mjs
import express from "express"; // Fixed
import path from "path";
import dotenv from "dotenv";
import { Client, GatewayIntentBits } from "discord.js";
import { createServer } from "http";
import { Server } from "socket.io";
// import route from "./route.js";

// Load .env
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(import.meta.dirname, "public")));
app.set("views", path.join(import.meta.dirname, "views")); // Must point to views/
app.set("view engine", "ejs");

// Discord Bot
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("guildMemberAdd", (member) => {
  console.log(`${member.user.username} joined ${member.guild.name}`);
  io.emit("memberJoin", {
    username: member.user.username,
    guild: member.guild.name,
  });
});

client.login(process.env.BOT_TOKEN);

app.get("/", (req, res) => {
  res.render("index"); // Fixed: res.render, no ./, no file extension
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
