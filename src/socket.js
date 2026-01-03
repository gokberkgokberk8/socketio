import { config } from "./config.js";

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
        room: config.ROOM_NAME,
        from: socket.id,
        message
      });

      io.to(config.ROOM_NAME).emit("new-message", {
        sender: socket.id,
        message
      });
    });

    socket.on("disconnect", () => {
      console.log("🔴 User disconnected:", socket.id);

      io.to(config.ROOM_NAME).emit("user-left", socket.id);
    });
  });
}
