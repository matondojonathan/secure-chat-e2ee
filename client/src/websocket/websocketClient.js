const WS_URL = "ws://localhost:3000/ws";

export class WebSocketClient {
  constructor(token) {
    this.token = token;
    this.socket = null;

    this.onOpen = null;
    this.onMessage = null;
    this.onClose = null;
    this.onError = null;
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(
        `${WS_URL}?token=${encodeURIComponent(
          this.token
        )}`
      );

      this.socket.addEventListener(
        "open",
        () => {
          console.log(
            "WebSocket connecté"
          );

          if (this.onOpen) {
            this.onOpen();
          }

          resolve();
        }
      );

      this.socket.addEventListener(
        "message",
        (event) => {
          let message;

          try {
            message = JSON.parse(
              event.data
            );
          } catch (error) {
            console.error(
              "Message WebSocket invalide"
            );

            return;
          }

          console.log(
            "WebSocket message reçu:",
            message
          );

          if (this.onMessage) {
            this.onMessage(message);
          }
        }
      );

      this.socket.addEventListener(
        "close",
        (event) => {
          console.log(
            "WebSocket fermé:",
            event.code
          );

          if (this.onClose) {
            this.onClose(event);
          }
        }
      );

      this.socket.addEventListener(
        "error",
        (error) => {
          console.error(
            "WebSocket error:",
            error
          );

          if (this.onError) {
            this.onError(error);
          }

          reject(error);
        }
      );
    });
  }

  send(message) {
    if (
      !this.socket ||
      this.socket.readyState !==
        WebSocket.OPEN
    ) {
      throw new Error(
        "WebSocket is not connected"
      );
    }

    this.socket.send(
      JSON.stringify(message)
    );
  }

  close() {
    if (this.socket) {
      this.socket.close();
    }
  }

  isConnected() {
    return (
      this.socket &&
      this.socket.readyState ===
        WebSocket.OPEN
    );
  }
}