/*


    !!!!TO RUN SERVER!!!!
        npm run dev


*/

import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import Chat from "./models/chat.js";
import bodyParser from "body-parser";
import mongoose from "mongoose";
import dotenv from "dotenv";

import auth from "./routes/auth.js";
import courts from "./routes/courts.js";
import user from "./routes/user.js";
import image from "./routes/images.js";
import friendRequest from "./routes/requests.js";
import posts from "./routes/post-routes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

let chatRooms = [];
// let userChatRooms = [];

app.use(cors());
app.use(bodyParser.json({ limit: "50mb" }));
const server = http.createServer(app);
mongoose.connect(process.env.DB_CONNECT, { useNewUrlParser: true });

const io = new Server(server, {
  cors: {
    origin: process.env.ENDPOINT,
    methods: ["GET", "POST"],
  },
});
io.on("connection", async (socket) => {
  socket.on("createRoom", async (data) => {
    const { uname, friends } = data; // seperate incoming data
    friends.push(uname);
    friends.sort();
    const room = friends.join(":");
    try {
      const newChat = await Chat.create({ room_id: room, users: [...friends] });
    } catch (e) {
      socket.emit("roomExists", friends);
    }
  });
  socket.on("loadRooms", async (username) => {
    let result = await Chat.find({ users: username });
    chatRooms = result;
    socket.emit("getRooms", result);
  });

  socket.on("findRoom", (id) => {
    let result = chatRooms.filter((room) => room.room_id == id);
    socket.emit("foundRoom", result[0].messages);
  });

  socket.on("newMessage", (data) => {
    const { room_id, message, username, timestamp } = data;
    const stringTime = `${timestamp.hour}:${timestamp.mins} `;
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
    const result = chatRooms.filter((room) => room.room_id == room_id);
    const newMessage = {
      body: message,
      user: username,
      time: `${timestamp.hour}:${timestamp.mins}`,
    };
    result[0].messages.push(newMessage);
    socket.emit("roomsList", chatRooms);
    socket.emit("foundRoom", result[0].messages);
  });

  socket.on("disconnect", () => {
    socket.disconnect();
  });
});

app.get("/api", (req, res) => {
  res.json(chatRooms);
});

app.use("/auth", auth);
app.use("/courts", courts);
app.use("/user", user);
app.use("/images", image);
app.use("/friendrequests", friendRequest);
app.use("/posts",posts);

server.listen(4000, () => console.log(`server is running on port ${4000}`));
const secondServer = app.listen(PORT, () => {
  console.log(`Second server running on port ${PORT}`);
});
secondServer.keepAliveTimeout = 65000;
