import express from "express";
import http from "http";
import { Server } from "socket.io";
import { config } from "./src/config.js";
import initSocket from "./src/socket.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*" //DO'dan ayarlancak
  }
});

initSocket(io);

server.listen(config.PORT, () => {
  console.log(`🚀 Server ${config.PORT} portunda`);
});
