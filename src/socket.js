import { config } from "./config.js";

// Bu fonksiyon Socket.IO sunucusunu yapılandırır
// Amaç:
// - Kullanıcıları sadece istedikleri room_code ile odaya almak (otomatik oda yok)
// - Kullanıcı mesajlarını odaya yayınlamak
// - API sunucusundan gelen transaction verilerini ilgili odaya iletmek
export default function initSocket(io) {
  io.on("connection", (socket) => {
    console.log("🟢 User connected:", socket.id);

    // Kullanıcılar manuel olarak join olacak, otomatik join yok
    // join-room event'i ile odaya katılabilirler

    // Kullanıcıların manuel olarak odaya join olması için event handler
    socket.on("join-room", (roomName) => {
      // Sadece ROOM_NAME veya ROOM_NAME2 odalarına izin ver
      if (roomName === config.ROOM_NAME || roomName === config.ROOM_NAME2) {
        socket.join(roomName);
        console.log(`📡 Kullanıcı ${socket.id} şu odaya join oldu: ${roomName}`);
        // Kullanıcıya bildir
        socket.emit("room-joined", { room: roomName, socketId: socket.id });
      } else {
        console.warn(`⚠️ Kullanıcı ${socket.id} izin verilmeyen odaya join olmaya çalıştı: ${roomName}`);
        socket.emit("room-join-error", { 
          message: `İzin verilmeyen oda: ${roomName}. Sadece ${config.ROOM_NAME} veya ${config.ROOM_NAME2} odalarına join olabilirsiniz.` 
        });
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
        // Destructure kontrolü
        if (!eventData || typeof eventData !== "object") {
          return; // Geçersiz veri, log tutmuyoruz
        }

        const { roomCode, type, payload } = eventData;

        // roomCode yoksa işlem yapma (log tutmuyoruz)
        if (!roomCode) {
          return;
        }

        // 1. Kontrol: eventData.roomCode kontrolü - sadece ROOM_NAME'e izin var
        // Diğer odalardan gelen veriler için log tutmuyoruz
        if (roomCode !== config.ROOM_NAME) {
          return; // Diğer odalardan gelen veri, log tutmuyoruz
        }
        
        // 2. Kontrol: payload.data.room_code kontrolü (ekstra güvenlik)
        const payloadRoomCode = payload?.data?.room_code;
        if (payloadRoomCode && payloadRoomCode !== config.ROOM_NAME) {
          return; // Payload içinde yanlış oda kodu, log tutmuyoruz
        }

        // Sadece doğru odadan gelen veriler için log tutuyoruz
        console.log("========================================");
        console.log("🔔 TRANSACTION-UPDATE EVENT ALINDI");
        console.log("Socket ID:", socket.id);
        console.log("Oda:", roomCode);
        console.log("Tip:", type);
        console.log("Event data:", JSON.stringify(eventData, null, 2));

        // Odada kaç kullanıcı var kontrol et
        const room = io.sockets.adapter.rooms.get(roomCode);
        const userCount = room ? room.size : 0;
        console.log(`👥 ${roomCode} odasında ${userCount} kullanıcı var`);

        // Odada kullanıcı yoksa veri gönderme
        if (userCount === 0) {
          console.warn(`⚠️ ${roomCode} odasında hiç kullanıcı yok! Veri gönderilmiyor.`);
          return;
        }
        
        console.log(`✅ ${config.ROOM_NAME} odasına gönderiliyor`);

        // İlgili odaya datayı aynen ilet (sadece config.ROOM_NAME odasındaki kullanıcılar alır)
        // io.to() zaten sadece o odadaki kullanıcılara gönderir
        // Kesinlikle sadece config.ROOM_NAME odasına gönderiliyor, başka odaya gönderilmiyor
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
    });
  });
}
