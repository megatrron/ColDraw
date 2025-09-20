import { WebSocketServer , WebSocket} from "ws";
interface User {
    socket: WebSocket;
    room: string;
  }
export function startWsServer(port = process.env.PORT || 3001) {
  const actualPort = typeof port === 'string' ? parseInt(port, 10) : port;
  console.log(`Starting another WS server on port ${actualPort}`);
  const wss = new WebSocketServer({ port: actualPort });
  

  let allSockets: User[] = [];

  wss.on("connection", (socket) => {
    console.log("New WebSocket connection established");
    
    // Handle connection close
    socket.on("close", () => {
      console.log("WebSocket connection closed");
      allSockets = allSockets.filter(user => user.socket !== socket);
      console.log(`Active connections: ${allSockets.length}`);
    });

    // Handle connection errors
    socket.on("error", (error) => {
      console.error("WebSocket error:", error);
      allSockets = allSockets.filter(user => user.socket !== socket);
    });

    socket.on("message", (message) => {
      try {
        const parsedMessage = JSON.parse(message.toString());
        console.log("Received message:", parsedMessage.type);
        
        if (parsedMessage.type == "join") {
          const roomId = parsedMessage.payload?.roomId;
          if (!roomId) {
            console.error("Join message missing roomId");
            return;
          }
          
          console.log(`User joined room: ${roomId}`);
          
          // Remove user from any previous room
          allSockets = allSockets.filter(user => user.socket !== socket);
          
          // Add user to new room
          allSockets.push({
            socket,
            room: roomId,
          });
          
          console.log(`Active connections in room ${roomId}: ${allSockets.filter(u => u.room === roomId).length}`);
        }

        if (parsedMessage.type == "chat") {
          const user = allSockets.find((x) => x.socket === socket);
          if (!user) {
            console.error("Chat message from unknown user");
            return;
          }

          const currentUserRoom = user.room;
          const roomSockets = allSockets.filter(socketObj => socketObj.room === currentUserRoom);
          
          console.log(`Broadcasting chat to ${roomSockets.length} users in room ${currentUserRoom}`);
          
          roomSockets.forEach((socketObj) => {
            if (socketObj.socket.readyState === WebSocket.OPEN) {
              try {
                socketObj.socket.send(parsedMessage.payload.message);
              } catch (error) {
                console.error("Error sending chat message:", error);
                // Remove broken connection
                allSockets = allSockets.filter(u => u.socket !== socketObj.socket);
              }
            }
          });
        }
        
        if (parsedMessage.type == "stroke") {
          const user = allSockets.find((x) => x.socket === socket);
          if (!user) {
            console.error("Stroke message from unknown user");
            return;
          }

          const currentUserRoom = user.room;
          const roomSockets = allSockets.filter(socketObj => socketObj.room === currentUserRoom);
          
          console.log(`Broadcasting stroke to ${roomSockets.length} users in room ${currentUserRoom}`);
          
          roomSockets.forEach((socketObj) => {
            if (socketObj.socket.readyState === WebSocket.OPEN) {
              try {
                socketObj.socket.send(JSON.stringify(parsedMessage.payload));
              } catch (error) {
                console.error("Error sending stroke message:", error);
                // Remove broken connection
                allSockets = allSockets.filter(u => u.socket !== socketObj.socket);
              }
            }
          });
        }
      } catch (error) {
        console.error("Error parsing WebSocket message:", error);
      }
    });
  });

  // Add graceful shutdown for production
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    wss.close(() => {
      console.log('WebSocket server closed');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    wss.close(() => {
      console.log('WebSocket server closed');
      process.exit(0);
    });
  });
}
