// PM2 ecosystem yapılandırması
// DigitalOcean'da 2990-2999 portları arasında 10 instance çalıştırmak için
module.exports = {
  apps: [
    {
      name: "socket-server",
      script: "./server.js",
      instances: 10, // 10 instance (2990-2999 portları)
      exec_mode: "cluster", // Cluster mode
      env: {
        NODE_ENV: "production",
        // Her instance için port otomatik olarak hesaplanacak
        // PM2 instance_id (0-9) kullanılarak 2990-2999 arası port atanır
      },
      // Redis yapılandırması - DigitalOcean Redis için
      // Environment variable'lar ile ayarlanacak:
      // REDIS_HOST, REDIS_PORT, REDIS_PASSWORD, REDIS_TLS
      error_file: "./logs/pm2-error.log",
      out_file: "./logs/pm2-out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      merge_logs: true,
      // Otomatik restart ayarları
      max_memory_restart: "1G", // 1GB RAM limiti
      // Restart stratejisi
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: "10s",
      // Watch mode (development için - production'da kapatılabilir)
      watch: false,
      ignore_watch: ["node_modules", "logs"]
    }
  ]
};

