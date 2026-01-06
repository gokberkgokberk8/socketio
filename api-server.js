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
  console.log("✅ API sunucusu socket sunucusuna bağlandı, veri gönderebilir");
});

socketClient.on("disconnect", (reason) => {
  console.log("⚠️  API -> Socket bağlantısı koptu:", reason);
});

socketClient.on("connect_error", (error) => {
  console.error("❌ API -> Socket bağlantı hatası:", error.message);
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

    // Dinamik room_code kullan - gelen data.room_code neyse o kullanılacak
    const targetRoom = data.room_code;
    
    if (!targetRoom) {
      console.error("❌ HATA: data.room_code tanımlı değil!");
      return res.status(400).json({ success: false, message: "room_code parametresi gereklidir" });
    }

    console.log("📤 Teslimat API - Socket'e gönderiliyor");
    console.log("   targetRoom (dinamik):", targetRoom);
    console.log("   Tip: teslimat");
    console.log("Socket bağlantı durumu:", socketClient.connected ? "Bağlı" : "Bağlı DEĞİL");

    // Socket bağlantısı kontrolü
    if (!socketClient.connected) {
      console.error("❌ Socket bağlantısı yok! Veri gönderilemedi.");
      return res.status(500).json({
        success: false,
        message: "Socket bağlantısı kurulamadı"
      });
    }

    // API'den gelen teslimat datasını socket sunucusuna ilet
    const emitData = {
      roomCode: targetRoom,
      type: "teslimat",
      payload: data
    };

    console.log("📤 Emit edilecek data:", {
      roomCode: emitData.roomCode,
      type: emitData.type,
      payloadKeys: Object.keys(emitData.payload)
    });

    socketClient.emit("transaction-update", emitData);

    console.log("✅ Socket'e emit edildi - roomCode:", targetRoom);

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

    // Dinamik room_code kullan - gelen data.room_code neyse o kullanılacak
    const targetRoom = data.room_code;
    
    if (!targetRoom) {
      console.error("❌ HATA: data.room_code tanımlı değil!");
      return res.status(400).json({ success: false, message: "room_code parametresi gereklidir" });
    }

    console.log("📤 Çekim API - Socket'e gönderiliyor");
    console.log("   targetRoom (dinamik):", targetRoom);
    console.log("   Tip: cekim");
    console.log("Socket bağlantı durumu:", socketClient.connected ? "Bağlı" : "Bağlı DEĞİL");

    // Socket bağlantısı kontrolü
    if (!socketClient.connected) {
      console.error("❌ Socket bağlantısı yok! Veri gönderilemedi.");
      return res.status(500).json({
        success: false,
        message: "Socket bağlantısı kurulamadı"
      });
    }

    // API'den gelen çekim datasını socket sunucusuna ilet
    socketClient.emit("transaction-update", {
      roomCode: targetRoom,
      type: "cekim",
      payload: data
    });

    console.log("✅ Socket'e gönderildi - roomCode:", targetRoom);

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

/**
 * Yatırım API endpoint'i
 * POST /yatirim
 * Body: { data: {...} }
 */
app.post("/yatirim", (req, res) => {
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
    console.log("💵 YATIRIM API ÇAĞRILDI");
    console.log("⏰ Zaman:", new Date().toLocaleString("tr-TR"));
    console.log("📋 Gelen Data:");
    console.log(JSON.stringify(data, null, 2));
    console.log("═══════════════════════════════════════");

    // Dinamik room_code kullan - gelen data.room_code neyse o kullanılacak
    const targetRoom = data.room_code;
    
    if (!targetRoom) {
      console.error("❌ HATA: data.room_code tanımlı değil!");
      return res.status(400).json({ success: false, message: "room_code parametresi gereklidir" });
    }

    console.log("📤 Yatırım API - Socket'e gönderiliyor");
    console.log("   targetRoom (dinamik):", targetRoom);
    console.log("   Tip: yatirim");
    console.log("Socket bağlantı durumu:", socketClient.connected ? "Bağlı" : "Bağlı DEĞİL");

    // Socket bağlantısı kontrolü
    if (!socketClient.connected) {
      console.error("❌ Socket bağlantısı yok! Veri gönderilemedi.");
      return res.status(500).json({
        success: false,
        message: "Socket bağlantısı kurulamadı"
      });
    }

    // API'den gelen yatırım datasını socket sunucusuna ilet
    const emitData = {
      roomCode: targetRoom,
      type: "yatirim",
      payload: data
    };

    console.log("📤 Emit edilecek data:", {
      roomCode: emitData.roomCode,
      type: emitData.type,
      payloadKeys: Object.keys(emitData.payload)
    });

    socketClient.emit("transaction-update", emitData);

    console.log("✅ Socket'e emit edildi - roomCode:", targetRoom);

    // Başarılı yanıt
    res.json({
      success: true,
      message: "Yatırım verisi alındı",
      receivedData: data
    });
  } catch (error) {
    console.error("❌ Yatırım API hatası:", error);
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
  console.log(`   - POST http://localhost:3001/yatirim`);
});

