const http = require("http");
const express = require("express");
const { createWebSocketServer } = require("../src/websocket/websocket.server");

const app = express();
const server = http.createServer(app);

// Vercel expose cette Function sur /api/ws.
// Le serveur WebSocket est attaché directement à cette Function.
createWebSocketServer(server);

module.exports = server;