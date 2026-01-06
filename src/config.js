// Redis yapılandırması - DigitalOcean Redis için
export const redisConfig = {
  host: process.env.REDIS_HOST || "localhost",
  port: process.env.REDIS_PORT || 6379,
  password: process.env.REDIS_PASSWORD || undefined,
  // DigitalOcean Redis için TLS bağlantısı gerekebilir
  tls: process.env.REDIS_TLS === "true" ? {} : undefined,
  // Bağlantı ayarları
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false // Otomatik bağlan (DigitalOcean Redis için)
};

// Port yapılandırması - 2990-2999 arası portlar
// Process ID veya PORT environment variable'dan port alınır
const getPort = () => {
  // PORT environment variable varsa onu kullan
  if (process.env.PORT) {
    const port = parseInt(process.env.PORT);
    if (port >= 2990 && port <= 2999) {
      return port;
    }
  }
  
  // Process ID'den port hesapla (2990-2999 arası)
  // PM2 instance_id kullanılabilir veya manuel port belirtilebilir
  const instanceId = process.env.NODE_APP_INSTANCE || process.env.pm_id || 0;
  const basePort = 2990;
  const calculatedPort = basePort + (parseInt(instanceId) % 10);
  
  return calculatedPort;
};

export const config = {
  PORT: getPort(),
  ROOM_NAME: "DKR0OVSSVJ", //Dinamik olarak degişcek
  ROOM_NAME2: "DKR0OVSSVJF", //Dinamik olarak degişcek
};
  