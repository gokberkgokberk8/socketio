import express from "express";
import http from "http";
import { Server } from "socket.io";
import { config } from "./src/config.js";
import initSocket from "./src/socket.js";

const app = express();

// Static dosya servisi - index.html'i servis et
app.use(express.static("."));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*"
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  maxHttpBufferSize: 1e6,
  transports: ["websocket", "polling"]
});

initSocket(io);

// RAM kullanımını izle (her 30 saniyede bir)
setInterval(() => {
  const used = process.memoryUsage();
  const formatMB = (bytes) => Math.round(bytes / 1024 / 1024 * 100) / 100;
  
  console.log("📊 Socket Server RAM Kullanımı:", {
    RSS: `${formatMB(used.rss)} MB`,
    Heap: `${formatMB(used.heapUsed)} / ${formatMB(used.heapTotal)} MB`,
    External: `${formatMB(used.external)} MB`,
    BağlıKullanıcı: io.sockets.sockets.size
  });
}, 30000);

server.listen(config.PORT, () => {
  console.log(`🔌 Socket Server ${config.PORT} portunda`);
  console.log(`💾 RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`);
});

