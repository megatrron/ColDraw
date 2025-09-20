import { startWsServer } from "./anotherserver";

// Start the WebSocket server using PORT environment variable
const port = process.env.PORT || 3001;
startWsServer(port);
