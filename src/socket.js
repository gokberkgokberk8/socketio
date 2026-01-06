import { config } from "./config.js";

// Bu fonksiyon Socket.IO sunucusunu yapılandırır
// Amaç:
// - Kullanıcıları sadece istedikleri room_code ile odaya almak (otomatik oda yok)
// - Kullanıcı mesajlarını odaya yayınlamak
// - API sunucusundan gelen transaction verilerini ilgili odaya iletmek
export default function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // Belirli bir oda koduna manuel join isteği
    // Frontend, room_code ile bu event'i emit edebilir
    socket.on("join-room", (roomCode) => {
      try {
        // Geçersiz roomCode gelirse işlem yapma
        if (!roomCode || typeof roomCode !== "string") {
          console.log("⚠️  Geçersiz join-room isteği:", roomCode);
          return;
        }

        // İlgili odaya join et
        socket.join(roomCode);

        console.log("🏠 Kullanıcı odaya katıldı:", {
          socketId: socket.id,
          roomCode
        });

        // Odaya bilgi mesajı gönder
        io.to(roomCode).emit("room-joined", {
          socketId: socket.id,
          roomCode
        });
      } catch (error) {
        console.error("❌ join-room işlenirken hata:", error);
      }
    });

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
        console.log("🔔 transaction-update event alindi (raw):", eventData);
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

        if (userCount === 0) {
          console.warn(`⚠️ ${roomCode} odasında hiç kullanıcı yok!`);
        }

        // İlgili odaya datayı aynen ilet
        io.to(roomCode).emit("transaction-update", {
          type,
          data: payload
        });

        console.log(`✅ ${roomCode} odasına transaction-update gönderildi`);
        console.log("Gönderilen data:", {
          type,
          dataKeys: payload ? Object.keys(payload) : "payload yok"
        });
      } catch (error) {
        console.error("❌ transaction-update işlenirken hata:", error);
        console.error("Error stack:", error.stack);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });
}
