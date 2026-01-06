import express from "express";
import http from "http";
import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "ioredis";
import { config, redisConfig } from "./src/config.js";
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

// Redis adapter yapılandırması - DigitalOcean Redis için
// Redis adapter, birden fazla Socket.IO instance'ı arasında mesaj paylaşımı sağlar
async function setupRedisAdapter() {
  try {
    // Redis pub/sub client'ları oluştur
    // Socket.IO Redis adapter iki client gerektirir: pub ve sub
    const pubClient = createClient({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      tls: redisConfig.tls,
      retryStrategy: redisConfig.retryStrategy,
      maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
      enableReadyCheck: redisConfig.enableReadyCheck,
      lazyConnect: redisConfig.lazyConnect
    });

    const subClient = pubClient.duplicate();

    // Redis bağlantı hatalarını yakala
    pubClient.on("error", (err) => {
      console.error("❌ Redis Pub Client hatası:", err);
    });

    subClient.on("error", (err) => {
      console.error("❌ Redis Sub Client hatası:", err);
    });

    // Redis bağlantı başarılı olduğunda
    pubClient.on("connect", () => {
      console.log("✅ Redis Pub Client bağlandı");
    });

    subClient.on("connect", () => {
      console.log("✅ Redis Sub Client bağlandı");
    });

    // Redis bağlantılarını başlat (ioredis otomatik bağlanır, ready event'ini bekliyoruz)
    // lazyConnect: true ise manuel bağlanmak gerekir, false ise otomatik bağlanır
    if (redisConfig.lazyConnect) {
      await Promise.all([
        pubClient.connect().catch(err => console.error("Pub connect hatası:", err)),
        subClient.connect().catch(err => console.error("Sub connect hatası:", err))
      ]);
    } else {
      // Otomatik bağlantı için ready event'ini bekle
      await Promise.all([
        new Promise((resolve, reject) => {
          pubClient.once("ready", resolve);
          pubClient.once("error", reject);
        }).catch(err => console.error("Pub ready hatası:", err)),
        new Promise((resolve, reject) => {
          subClient.once("ready", resolve);
          subClient.once("error", reject);
        }).catch(err => console.error("Sub ready hatası:", err))
      ]);
    }

    // Socket.IO'ya Redis adapter'ı ekle
    io.adapter(createAdapter(pubClient, subClient));
    
    console.log("🔴 Redis Adapter aktif - Multi-instance desteği hazır");
    console.log(`   Redis: ${redisConfig.host}:${redisConfig.port}`);
    
    return { pubClient, subClient };
  } catch (error) {
    console.error("❌ Redis adapter kurulumu başarısız:", error);
    console.warn("⚠️  Redis olmadan devam ediliyor (single instance modu)");
    // Redis bağlantısı başarısız olsa bile sunucu çalışmaya devam eder
    return null;
  }
}

// Redis adapter'ı başlat
setupRedisAdapter();

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
  const instanceId = process.env.NODE_APP_INSTANCE || process.env.pm_id || "single";
  console.log("═══════════════════════════════════════");
  console.log(`🚀 Socket.IO Server başlatıldı`);
  console.log(`📡 Port: ${config.PORT}`);
  console.log(`🆔 Instance ID: ${instanceId}`);
  console.log(`💾 RAM: ${Math.round(process.memoryUsage().rss / 1024 / 1024)} MB`);
  console.log(`🔴 Redis: ${redisConfig.host}:${redisConfig.port}`);
  console.log("═══════════════════════════════════════");
});
