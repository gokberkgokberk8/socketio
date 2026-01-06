import express from "express";
import http from "http";
import { Server } from "socket.io";
import { config } from "./src/config.js";
import initSocket from "./src/socket.js";

const app = express();

// JSON body parser middleware
app.use(express.json());

// Static dosya servisi - index.html'i servis et
app.use(express.static("."));

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*" //DO'dan ayarlancak
  },
  // Performans optimizasyonları - 8GB RAM için yeterli
  pingTimeout: 60000, // 60 saniye - bağlantı timeout
  pingInterval: 25000, // 25 saniye - heartbeat interval
  maxHttpBufferSize: 1e6, // 1MB - maksimum mesaj boyutu
  transports: ["websocket", "polling"] // WebSocket öncelikli
});


initSocket(io);

// API Endpoint'leri

/**
 * Teslimat API endpoint'i
 * POST /teslimat
 * Body: { data: {...} }
 */
app.post("/teslimat", (req, res) => {
  try {
    const { data } = req.body;

    // data parametresi kontrolü
    if (!data) {
      return res.status(400).json({
        success: false,
        message: "data parametresi gereklidir"
      });
    }

    // Gelen datayı console'da göster
    console.log("═══════════════════════════════════════");
    console.log("📦 TESLİMAT API ÇAĞRILDI");
    console.log("⏰ Zaman:", new Date().toLocaleString("tr-TR"));
    console.log("📋 Gelen Data:");
    console.log(JSON.stringify(data, null, 2));
    console.log("═══════════════════════════════════════");

    // Başarılı yanıt
    res.json({
      success: true,
      message: "Teslimat verisi alındı",
      receivedData: data
    });
  } catch (error) {
    console.error("❌ Teslimat API hatası:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: error.message
    });
  }
});

/**
 * Çekim API endpoint'i
 * POST /cekim
 * Body: { data: {...} }
 */
app.post("/cekim", (req, res) => {
  try {
    const { data } = req.body;

    // data parametresi kontrolü
    if (!data) {
      return res.status(400).json({
        success: false,
        message: "data parametresi gereklidir"
      });
    }

    // Gelen datayı console'da göster
    console.log("═══════════════════════════════════════");
    console.log("💰 ÇEKİM API ÇAĞRILDI");
    console.log("⏰ Zaman:", new Date().toLocaleString("tr-TR"));
    console.log("📋 Gelen Data:");
    console.log(JSON.stringify(data, null, 2));
    console.log("═══════════════════════════════════════");

    // Başarılı yanıt
    res.json({
      success: true,
      message: "Çekim verisi alındı",
      receivedData: data
    });
  } catch (error) {
    console.error("❌ Çekim API hatası:", error);
    res.status(500).json({
      success: false,
      message: "Sunucu hatası",
      error: error.message
    });
  }
});

// RAM kullanımını izle (her 30 saniyede bir)
setInterval(() => {
  const used = process.memoryUsage();
  const formatMB = (bytes) => Math.round(bytes / 1024 / 1024 * 100) / 100;
  
  console.log("📊 RAM Kullanımı:", {
    RSS: `${formatMB(used.rss)} MB`, // Toplam kullanım
    Heap: `${formatMB(used.heapUsed)} / ${formatMB(used.heapTotal)} MB`,
    External: `${formatMB(used.external)} MB`,
    BağlıKullanıcı: io.sockets.sockets.size
  });
}, 30000); // 30 saniyede bir

server.listen(config.PORT, () => {
  console.log(`🚀 Server ${config.PORT} portunda`);
  console.log(`💾 RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`);
});
