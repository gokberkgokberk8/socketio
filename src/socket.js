import { config } from "./config.js";

// Bu fonksiyon Socket.IO sunucusunu yapılandırır
// Amaç:
// - Kullanıcıları sadece istedikleri room_code ile odaya almak (otomatik oda yok)
// - Kullanıcı mesajlarını odaya yayınlamak
// - API sunucusundan gelen transaction verilerini ilgili odaya iletmek
export default function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // otomatik tek odaya sok
    socket.join(config.ROOM_NAME);

    // odaya bağlandımı test etmek için kullanıcıyı bildir
    io.to(config.ROOM_NAME).emit("user-joined", socket.id);

    // Kullanıcıdan mesaj geldiğinde hem odaya yayınla hem de sunucu konsoluna yaz
    socket.on("send-message", (message) => {
      console.log("💬 Gelen mesaj:", {
        // Not: Burada varsayılan oda log'u yerine sadece kullanıcı bilgisini tutuyoruz
        room: "dynamic-room",
        from: socket.id,
        message
      });

      // Mesajları tüm odalara broadcast etmek yerine,
      // basit örnek için sadece bağlı tüm kullanıcılara gönderiyoruz
      io.emit("new-message", {
        sender: socket.id,
        message
      });
    });

    // API sunucusundan gelen transaction event'i
    // roomCode: hangi odaya gönderileceği
    // type: "teslimat" | "cekim"
    // payload: API'den gelen orijinal data
    socket.on("transaction-update", (eventData) => {
      try {
        console.log("========================================");
        console.log("🔔 TRANSACTION-UPDATE EVENT ALINDI");
        console.log("Socket ID:", socket.id);
        console.log("Event data (raw):", JSON.stringify(eventData, null, 2));
        console.log("Event data type:", typeof eventData);
        console.log("Event data keys:", eventData ? Object.keys(eventData) : "null");

        // Destructure kontrolü
        if (!eventData || typeof eventData !== "object") {
          console.error("❌ Geçersiz event data formatı:", eventData);
          return;
        }

        const { roomCode, type, payload } = eventData;

        // roomCode yoksa işlem yapma
        if (!roomCode) {
          console.log("⚠️  Geçersiz transaction-update (roomCode yok):", {
            type,
            payload,
            eventData
          });
          return;
        }

        console.log("📡 Transaction update alındı:", {
          roomCode,
          type,
          socketId: socket.id,
          payloadKeys: payload ? Object.keys(payload) : "payload yok"
        });

        // Odada kaç kullanıcı var kontrol et
        const room = io.sockets.adapter.rooms.get(roomCode);
        const userCount = room ? room.size : 0;
        console.log(`👥 ${roomCode} odasında ${userCount} kullanıcı var`);

        // Odada kullanıcı yoksa veri gönderme
        if (userCount === 0) {
          console.warn(`⚠️ ${roomCode} odasında hiç kullanıcı yok! Veri gönderilmiyor.`);
          return;
        }

        // Sadece DKRO0VSSVJ odasına gönder (güvenlik kontrolü)
        console.log("Oda kontrolü - roomCode:", roomCode, "config.ROOM_NAME:", config.ROOM_NAME);
        if (roomCode !== "DKRO0VSSVJ") {
          console.error(`❌ İZİN VERİLMEYEN ODA: ${roomCode}`);
          console.error(`   Beklenen: DKRO0VSSVJ`);
          console.error(`   Gelen: ${roomCode}`);
          console.error(`   config.ROOM_NAME: ${config.ROOM_NAME}`);
          return;
        }
        
        console.log("✅ Oda kontrolü geçti - DKRO0VSSVJ odasına gönderiliyor");

        // İlgili odaya datayı aynen ilet (sadece DKRO0VSSVJ odasındaki kullanıcılar alır)
        // io.to() zaten sadece o odadaki kullanıcılara gönderir
        // Backend'de sadece DKRO0VSSVJ odasına veri gönderiliyor, başka odaya gönderilmiyor
        io.to(roomCode).emit("transaction-update", {
          type,
          data: payload
        });

        console.log(`✅ ${roomCode} odasına transaction-update gönderildi`);
        console.log("Gönderilen data:", {
          type,
          dataKeys: payload ? Object.keys(payload) : "payload yok"
        });
        console.log("========================================");
      } catch (error) {
        console.error("❌ transaction-update işlenirken hata:", error);
        console.error("Error stack:", error.stack);
        console.log("========================================");
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);

      io.to(config.ROOM_NAME).emit("user-left", socket.id);
    });
  });
}
