const {
  default: makeWASocket,
  useMultiFileAuthState,
  Browsers
} = require("@whiskeysockets/baileys");
const { pino } = require("pino");

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("baileys_auth");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    printQRInTerminal: false,
    browser: Browsers.macOS('Desktop'),
    auth: state,
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (connection === "close") {
      const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("Connection is open!");
    }
    if (qr) {
      console.log("QR Code:", qr);
    }
  });

  sock.ev.on("messages.upsert", async ({ messages }) => {
    if (messages[0].key.remoteJid === "status@broadcast") return;
    const message = messages[0].message;
    if (message?.conversation === "hello") {
      await sock.sendMessage(messages[0].key.remoteJid, {
        text: "Hello! How can I help you?",
      });
    }
  });
}

connectToWhatsApp();
