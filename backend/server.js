import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import Message from "./models/Message.js";

let onlineUsers = new Map();

dotenv.config();

// console.log("✅ ENV Loaded");
// console.log("PORT =", process.env.PORT);
// console.log("MONGO_URI =", process.env.MONGO_URI);


const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://chat-application-one-gules.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(express.json());


connectDB();

app.use("/api/users", userRoutes);
app.use("/api/messages", messageRoutes);


app.get("/", (_req, res) => {
  res.send("Backend Running Successfully!");
});

// Create http server 
const httpServer = http.createServer(app)

// Socket.io setup 
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "https://chat-application-one-gules.vercel.app",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// socket events 
io.on("connection", (socket) => {
  console.log("User connected: ", socket.id);

  // User Online Event
  socket.on("userOnline", (username) => {
    onlineUsers.set(socket.id, username);

    io.emit(
      "onlineUsers",
      [...new Set(onlineUsers.values())] // no duplicates
    );
  });

  socket.on("sendMessage", async (msgData) => {
    try {
    //  Prevent empty message with no file
    if (!msgData.text?.trim() && !msgData.fileUrl) {
      return;
    }
    // save in mongodb and send msg to specific user
    const newMessage = await Message.create({
      chatId: msgData.chatId,
      sender: msgData.sender,
      text: msgData.text?.trim() || "",
      fileUrl: msgData.fileUrl || null,
      fileType: msgData.fileType || null,
      fileName: msgData.fileName,

    });
    io.to(msgData.chatId).emit("receiveMessage", newMessage);
  }
  catch (error) {
    console.log("Message Save Error:", error.message);
  }
  });

  // WebRTC signaling
  socket.on("callOffer", (payload) => {
    if (!payload?.chatId) return;
    socket.to(payload.chatId).emit("callOffer", payload);
  });

  socket.on("callAnswer", (payload) => {
    if (!payload?.chatId) return;
    socket.to(payload.chatId).emit("callAnswer", payload);
  });

  socket.on("iceCandidate", (payload) => {
    if (!payload?.chatId) return;
    socket.to(payload.chatId).emit("iceCandidate", payload);
  });

  socket.on("callReject", (payload) => {
    if (!payload?.chatId) return;
    socket.to(payload.chatId).emit("callReject", payload);
  });

  socket.on("callEnd", (payload) => {
    if (!payload?.chatId) return;
    socket.to(payload.chatId).emit("callEnd", payload);
  });

  // Join Room for Private Chat 
  socket.on("joinRoom", (chatId) => {
    socket.join(chatId);
    console.log("Joined Room:", chatId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected", socket.id);
    onlineUsers.delete(socket.id);
    io.emit("onlineUsers", [...new Set(onlineUsers.values())]);
  });


});

const PORT = process.env.PORT || 5001;

httpServer.listen(PORT, () => {
  console.log(`✅ Server started on http://localhost:${PORT}`);
});
