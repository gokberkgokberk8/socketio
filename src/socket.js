import { config } from "./config.js";

// Bu fonksiyon Socket.IO sunucusunu yapılandırır
// Amaç:
// - Kullanıcıları varsayılan odaya almak
// - Kullanıcı mesajlarını odaya yayınlamak
// - API sunucusundan gelen transaction verilerini ilgili odaya iletmek
export default function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // otomatik tek odaya sok (varsayılan oda)
    socket.join(config.ROOM_NAME);

    // odaya bağlandımı test etmek için kullanıcıyı bildir (varsayılan oda)
    io.to(config.ROOM_NAME).emit("user-joined", socket.id);

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
        room: config.ROOM_NAME,
        from: socket.id,
        message
      });

      io.to(config.ROOM_NAME).emit("new-message", {
        sender: socket.id,
        message
      });
    });

    // API sunucusundan gelen transaction event'i
    // roomCode: hangi odaya gönderileceği
    // type: "teslimat" | "cekim"
    // payload: API'den gelen orijinal data
    socket.on("transaction-update", ({ roomCode, type, payload }) => {
      try {
        // roomCode yoksa işlem yapma
        if (!roomCode) {
          console.log("⚠️  Geçersiz transaction-update (roomCode yok):", {
            type,
            payload
          });
          return;
        }

        console.log("📡 Transaction update alındı:", {
          roomCode,
          type
        });

        // İlgili odaya datayı aynen ilet
        io.to(roomCode).emit("transaction-update", {
          type,
          data: payload
        });
      } catch (error) {
        console.error("❌ transaction-update işlenirken hata:", error);
      }
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);

      io.to(config.ROOM_NAME).emit("user-left", socket.id);
    });
  });
}
