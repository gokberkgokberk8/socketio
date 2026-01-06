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
    // Dinamik room_code yapısı - kullanıcı hangi roomName ile gelirse o odaya join olabilir
    socket.on("join-room", (roomName) => {
      if (!roomName) {
        console.warn(`⚠️ Kullanıcı ${socket.id} boş oda adı ile join olmaya çalıştı`);
        socket.emit("room-join-error", { 
          message: "Oda adı gereklidir" 
        });
        return;
      }
      
      socket.join(roomName);
      console.log(`📡 Kullanıcı ${socket.id} şu odaya join oldu: ${roomName}`);
      // Kullanıcıya bildir
      socket.emit("room-joined", { room: roomName, socketId: socket.id });
    });

    // Kullanıcıdan mesaj geldiğinde sadece ilgili odaya gönder
    // Dinamik room_code yapısı - mesaj sadece belirtilen odaya gönderilir
    socket.on("send-message", (messageData) => {
      // messageData hem mesaj hem de roomCode içerebilir
      const { message, roomCode } = typeof messageData === "string" 
        ? { message: messageData, roomCode: null } 
        : messageData;

      if (!roomCode) {
        console.warn(`⚠️ Kullanıcı ${socket.id} roomCode olmadan mesaj göndermeye çalıştı`);
        socket.emit("message-error", { 
          message: "Mesaj göndermek için roomCode gereklidir" 
        });
        return;
      }

      console.log("💬 Gelen mesaj:", {
        room: roomCode,
        from: socket.id,
        message
      });

      // Mesajı sadece ilgili odaya gönder
      io.to(roomCode).emit("new-message", {
        sender: socket.id,
        room: roomCode,
        message
      });
    });

    // API sunucusundan gelen transaction event'lerini işleyen ortak fonksiyon
    // Her transaction türü için ayrı event kullanılıyor: teslimat, cekim, yatirim
    const handleTransactionEvent = (eventType, eventData) => {
      try {
        // Destructure kontrolü
        if (!eventData || typeof eventData !== "object") {
          return; // Geçersiz veri
        }

        const { roomCode, payload } = eventData;

        // roomCode yoksa işlem yapma
        if (!roomCode) {
          console.warn(`⚠️ ${eventType}: roomCode eksik`);
          return;
        }

        // Dinamik room_code yapısı - gelen roomCode neyse o odaya gönderilir
        console.log("========================================");
        console.log(`🔔 ${eventType.toUpperCase()} EVENT ALINDI`);
        console.log("Socket ID:", socket.id);
        console.log("Oda (dinamik):", roomCode);
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

        // İlgili odaya datayı aynen ilet - sadece belirtilen roomCode'daki kullanıcılar alır
        // Event ismi transaction türüne göre değişiyor: teslimat, cekim, yatirim
        io.to(roomCode).emit(eventType, {
          data: payload
        });

        console.log(`✅ ${roomCode} odasına '${eventType}' event'i gönderildi`);
        console.log("Gönderilen data:", {
          eventType,
          dataKeys: payload ? Object.keys(payload) : "payload yok"
        });
        console.log("========================================");
      } catch (error) {
        console.error(`❌ ${eventType} işlenirken hata:`, error);
        console.error("Error stack:", error.stack);
        console.log("========================================");
      }
    };

    // Teslimat event handler
    socket.on("teslimat", (eventData) => {
      handleTransactionEvent("teslimat", eventData);
    });

    // Çekim event handler
    socket.on("cekim", (eventData) => {
      handleTransactionEvent("cekim", eventData);
    });

    // Yatırım event handler
    socket.on("yatirim", (eventData) => {
      handleTransactionEvent("yatirim", eventData);
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);
    });
  });
}
