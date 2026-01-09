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
  // CORS ayarları - Nginx üzerinden çalışırken de gerekli
  cors: {
    origin: "*", // Tüm origin'lere izin ver
    methods: ["GET", "POST"],
    credentials: false
  },
  // Path ayarı - Nginx'teki path ile eşleşmeli
  path: "/socket.io/",
  // Eski Socket.IO versiyonları için uyumluluk
  allowEIO3: true,
  // Performans optimizasyonları
  pingTimeout: 60000, // 60 saniye - bağlantı timeout
  pingInterval: 25000, // 25 saniye - heartbeat interval
  maxHttpBufferSize: 1e6, // 1MB - maksimum mesaj boyutu
  transports: ["websocket", "polling"] // WebSocket öncelikli
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

