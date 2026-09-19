const WebSocket = require("ws");

const ALICE_TOKEN = process.env.ALICE_TOKEN;
const BOB_TOKEN = process.env.BOB_TOKEN;

const ALICE_ID =
  "a99d261c-5870-46bc-9eb5-0ba43b2136d0";

const CONVERSATION_ID =
  "210c939a-dd65-4185-8be5-487c4241408c";

if (!ALICE_TOKEN || !BOB_TOKEN) {
  console.error("JWT manquant.");
  process.exit(1);
}

const alice = new WebSocket(
  `ws://localhost:3000/ws?token=${ALICE_TOKEN}`
);

const bob = new WebSocket(
  `ws://localhost:3000/ws?token=${BOB_TOKEN}`
);

let aliceReady = false;
let bobReady = false;
let messageSent = false;

function sendMessageFromAlice() {
  if (
    !aliceReady ||
    !bobReady ||
    messageSent
  ) {
    return;
  }

  messageSent = true;

  const message = {
    type: "message",
    conversationId: CONVERSATION_ID,
    senderId: ALICE_ID,
    sequenceNumber: 1,
    nonce: "test-nonce-123",
    ciphertext: "TEST_CIPHERTEXT",
    signature: "TEST_SIGNATURE",
  };

  console.log("\n=== ALICE → SERVEUR ===");
  console.log(message);

  alice.send(JSON.stringify(message));
}

alice.on("open", () => {
  console.log("Alice WebSocket connectée");
});

alice.on("message", (data) => {
  const message = JSON.parse(data.toString());

  console.log("\nAlice reçoit :");
  console.log(message);

  if (message.type === "connection") {
    aliceReady = true;
    sendMessageFromAlice();
  }

  if (message.type === "error") {
    console.error("Erreur Alice :", message);
  }
});

alice.on("error", (error) => {
  console.error(
    "Erreur WebSocket Alice :",
    error.message
  );
});

bob.on("open", () => {
  console.log("Bob WebSocket connecté");
});

bob.on("message", (data) => {
  const message = JSON.parse(data.toString());

  console.log("\nBob reçoit :");
  console.log(message);

  if (message.type === "connection") {
    bobReady = true;
    sendMessageFromAlice();
  }

  if (
    message.type === "message" &&
    message.ciphertext === "TEST_CIPHERTEXT"
  ) {
    console.log("\n================================");
    console.log("✅ TEST RELAIS RÉUSSI");
    console.log("Alice → Serveur → Bob fonctionne.");
    console.log("================================");

    alice.close();
    bob.close();
  }

  if (message.type === "error") {
    console.error("Erreur Bob :", message);
  }
});

bob.on("error", (error) => {
  console.error(
    "Erreur WebSocket Bob :",
    error.message
  );
});

alice.on("close", (code) => {
  console.log(`Alice déconnectée : ${code}`);
});

bob.on("close", (code) => {
  console.log(`Bob déconnecté : ${code}`);
});