import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });

interface User {
  socket: WebSocket;
  room: string;
}

let allSockets: User[] = [];

wss.on("connection", (socket) => {
  socket.on("message", (message) => {
    // @ts-ignore
    const parsedMessage = JSON.parse(message);
    if (parsedMessage.type == "join") {
      console.log("user joined room " + parsedMessage.payload.roomId);
      allSockets.push({
        socket,
        room: parsedMessage.payload.roomId,
      });
    }

    if (parsedMessage.type == "chat") {
      //@ts-ignore
      const currentUserRoom = allSockets.find((x) => x.socket == socket).room;
      allSockets.forEach((socketObj) => {
        if (socketObj.room === currentUserRoom) {
          socketObj.socket.send(parsedMessage.payload.message);
        }
      });
    }
    if (parsedMessage.type == "stroke") {
      //@ts-ignore
      const currentUserRoom = allSockets.find((x) => x.socket == socket).room;
      allSockets.forEach((socketObj) => {
        if (socketObj.room === currentUserRoom) {
          socketObj.socket.send(JSON.stringify(parsedMessage.payload));
        }
      });
    }
  });
});
