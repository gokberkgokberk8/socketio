import express from "express";
import { io as ClientIO } from "socket.io-client";

// API sunucusu için Express instance'ı
const app = express();

// JSON body parser middleware
app.use(express.json());

// Socket sunucusuna bağlanan client
// Not: Burada socket sunucusunun adresi kullanılır (lokalde 2999 portu)
const socketClient = ClientIO("http://localhost:2999", {
  transports: ["websocket"],
  reconnection: true
});

// Socket bağlantı durumlarını logla (debug için)
socketClient.on("connect", () => {
  console.log("🔗 API -> Socket bağlantısı kuruldu. ID:", socketClient.id);
});

socketClient.on("disconnect", (reason) => {
  console.log("⚠️  API -> Socket bağlantısı koptu:", reason);
});

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

    // room_code varsa datayı ilgili odaya gönder
    // Not: room_code alanı zorunlu değil, varsa odaya publish ediyoruz
    if (data.room_code) {
      // API'den gelen teslimat datasını socket sunucusuna ilet
      socketClient.emit("transaction-update", {
        roomCode: data.room_code,
        type: "teslimat",
        payload: data
      });
    }

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

    // room_code varsa datayı ilgili odaya gönder
    if (data.room_code) {
      // API'den gelen çekim datasını socket sunucusuna ilet
      socketClient.emit("transaction-update", {
        roomCode: data.room_code,
        type: "cekim",
        payload: data
      });
    }

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

const server = app.listen(3001, () => {
  console.log(`🌐 API Server 3001 portunda`);
  console.log(`💾 RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`);
  console.log(`📡 Endpoint'ler:`);
  console.log(`   - POST http://localhost:3001/teslimat`);
  console.log(`   - POST http://localhost:3001/cekim`);
});

