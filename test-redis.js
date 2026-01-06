// Redis bağlantı test scripti
// DigitalOcean Redis'in çalışıp çalışmadığını kontrol eder
import { createClient } from "ioredis";
import { redisConfig } from "./src/config.js";

console.log("🔍 Redis bağlantısı test ediliyor...");
console.log("═══════════════════════════════════════");
console.log("📋 Redis Yapılandırması:");
console.log(`   Host: ${redisConfig.host}`);
console.log(`   Port: ${redisConfig.port}`);
console.log(`   TLS: ${redisConfig.tls ? "Aktif" : "Kapalı"}`);
console.log(`   Password: ${redisConfig.password ? "***" : "Yok"}`);
console.log("═══════════════════════════════════════");

// Redis client oluştur
const redisClient = createClient({
  host: redisConfig.host,
  port: redisConfig.port,
  password: redisConfig.password,
  tls: redisConfig.tls,
  retryStrategy: redisConfig.retryStrategy,
  maxRetriesPerRequest: redisConfig.maxRetriesPerRequest,
  enableReadyCheck: redisConfig.enableReadyCheck,
  lazyConnect: false
});

// Bağlantı başarılı olduğunda
redisClient.on("connect", () => {
  console.log("✅ Redis'e bağlanıldı!");
});

redisClient.on("ready", async () => {
  console.log("✅ Redis hazır!");
  
  try {
    // Test komutu gönder
    const testKey = "socket-test-key";
    const testValue = "test-value-" + Date.now();
    
    // SET komutu
    await redisClient.set(testKey, testValue);
    console.log(`✅ SET komutu başarılı: ${testKey} = ${testValue}`);
    
    // GET komutu
    const result = await redisClient.get(testKey);
    console.log(`✅ GET komutu başarılı: ${testKey} = ${result}`);
    
    // Test key'i temizle
    await redisClient.del(testKey);
    console.log(`✅ DEL komutu başarılı: ${testKey} silindi`);
    
    // PING komutu
    const pingResult = await redisClient.ping();
    console.log(`✅ PING komutu başarılı: ${pingResult}`);
    
    console.log("═══════════════════════════════════════");
    console.log("🎉 Redis bağlantısı başarılı! Socket.IO kullanabilirsiniz.");
    console.log("═══════════════════════════════════════");
    
    // Bağlantıyı kapat
    await redisClient.quit();
    process.exit(0);
  } catch (error) {
    console.error("❌ Redis komut hatası:", error);
    await redisClient.quit();
    process.exit(1);
  }
});

// Bağlantı hatası
redisClient.on("error", (err) => {
  console.error("❌ Redis bağlantı hatası:", err.message);
  console.error("═══════════════════════════════════════");
  console.error("🔧 Kontrol edilecekler:");
  console.error("   1. Redis instance'ı DigitalOcean'da çalışıyor mu?");
  console.error("   2. REDIS_HOST environment variable doğru mu?");
  console.error("   3. REDIS_PORT environment variable doğru mu?");
  console.error("   4. REDIS_PASSWORD environment variable doğru mu?");
  console.error("   5. REDIS_TLS=true ayarlandı mı? (DigitalOcean için genellikle gerekli)");
  console.error("   6. Firewall/Network ayarları Redis'e erişime izin veriyor mu?");
  console.error("═══════════════════════════════════════");
  process.exit(1);
});

// Timeout - 10 saniye içinde bağlanamazsa hata ver
setTimeout(() => {
  console.error("❌ Redis bağlantısı zaman aşımına uğradı (10 saniye)");
  console.error("   Redis'e bağlanılamadı, lütfen yapılandırmayı kontrol edin.");
  process.exit(1);
}, 10000);

