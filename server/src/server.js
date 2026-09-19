const { createServer } = require("http");

const app = require("./app");
const config = require("./config/env");
const { createWebSocketServer } = require("./websocket/websocket.server");

const server = createServer(app);

// WebSocket partagé avec le serveur HTTP.
// Vercel utilise ce serveur pour gérer l'upgrade /ws.
createWebSocketServer(server);

// En local uniquement : le serveur écoute sur le port 3000.
// Vercel utilise l'export du serveur.
if (require.main === module) {
  server.listen(config.port, () => {
    console.log(`HTTP server running on http://localhost:${config.port}`);
    console.log(`WebSocket server running on ws://localhost:${config.port}/ws`);
    console.log(`PostgreSQL configured on port ${config.database.port}`);
  });
}

module.exports = server;