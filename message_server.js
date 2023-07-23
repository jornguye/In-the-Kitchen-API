/*


    !!!!TO RUN SERVER!!!!
        npm run dev


*/

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import Chat from "./models/chat.js";
import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 4000;

let chatRooms = [];
// let userChatRooms = [];

app.use(cors());
const server = http.createServer(app);
// console.log(process.env.DB_CONNECT);
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true });

const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

io.on("connection", async (socket) => {
  console.log(`User connected ${socket.id}`);
  socket.on("createRoom", async (data) => {
    console.log(data);
    const { uname, friends } = data; // seperate incoming data
    friends.push(uname);
    friends.sort();
    const room = friends.join(":");
    const checkRoomExsists = (room_id) => room_id.room == room;
    let result = chatRooms.some(checkRoomExsists);
    if (!result) {
      const newChat = new Chat({ room_id: room, users: [...friends] });
      await newChat.save();
      socket.join(room);
      chatRooms.unshift({ id: friends, room, messages: [] });
      console.log(chatRooms);
      socket.emit("roomsList", chatRooms);
    }
  });

  socket.on("loadRooms", async (username) => {
    // console.log(username);
    let result = await Chat.find({ users: username });
    chatRooms = result;
    console.log(result);
    socket.emit("getRooms", result);
  });

  socket.on("findRoom", (id) => {
    console.log(chatRooms);
    console.log("id ", id);
    let result = chatRooms.filter((room) => room.room_id == id);
    console.log("result =", result);
    socket.emit("foundRoom", result[0].messages);
    console.log("Messages Form", result[0].messages);
  });

  socket.on("newMessage", (data) => {
    const { room_id, message, username, timestamp } = data;
    console.log("NEW MESSAGE", message);
    var stringTime = `${timestamp.hour}:${timestamp.mins} `;
    Chat.findOneAndUpdate(
      { room_id: room_id },
      {
        $push: {
          messages: { body: message, time: stringTime, user: username },
        },
      }
    ).then((res) => {
      console.log(res); // I don't think we need to really do anything here
    });
    let result = chatRooms.filter((room) => room.room_id == room_id);
    // console.log("result", result);
    const newMessage = {
      body: message,
      user: username,
      time: `${timestamp.hour}:${timestamp.mins}`,
    };
    console.log("New Message", newMessage);
    // socket.to(result[0].name).emit("roomMessage", newMessage);
    result[0].messages.push(newMessage);

    console.log("Here", result[0]);

    socket.emit("roomsList", chatRooms);
    socket.emit("foundRoom", result[0].messages);
  });

  socket.on("disconnect", () => {
    socket.disconnect();
    console.log("user disconnected");
  });
});

app.get("/api", (req, res) => {
  res.json(chatRooms);
});

server.listen(PORT, () => `server is running on port ${PORT}`);
