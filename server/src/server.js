const http = require("http");

const app = require("./app");
const config = require("./config/env");
const { createWebSocketServer } = require("./websocket/websocket.server");

const server = http.createServer(app);

createWebSocketServer(server);

if (require.main === module) {
  server.listen(config.port, () => {
    console.log(`HTTP server running on http://localhost:${config.port}`);
    console.log(`WebSocket server running on ws://localhost:${config.port}/ws`);
    console.log(`PostgreSQL configured on port ${config.database.port}`);
  });
}

module.exports = server;
