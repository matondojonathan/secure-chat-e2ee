const http = require("http");
const express = require("express");
const { createWebSocketServer } = require("../src/websocket/websocket.server");

const app = express();
const server = http.createServer(app);

createWebSocketServer(server);

module.exports = server;