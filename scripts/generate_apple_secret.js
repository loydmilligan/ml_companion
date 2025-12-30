const fs = require("fs");
const path = require("path");
const jwt = require("jsonwebtoken");

const envPath = path.resolve(__dirname, "..", ".env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const [key, ...rest] = line.split("=");
    const value = rest.join("=").trim();
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const teamId = process.env.APPLE_TEAM_ID;
const clientId = process.env.APPLE_SERVICE_ID;
const keyId = process.env.APPLE_KEY_ID;
const keyPath = process.env.APPLE_KEY_PATH;

if (!teamId || !clientId || !keyId || !keyPath) {
  console.error("Missing env vars. Required: APPLE_TEAM_ID, APPLE_SERVICE_ID, APPLE_KEY_ID, APPLE_KEY_PATH");
  process.exit(1);
}

const privateKey = fs.readFileSync(keyPath, "utf8");
const now = Math.floor(Date.now() / 1000);
const payload = {
  iss: teamId,
  iat: now,
  exp: now + 60 * 60 * 24 * 180,
  aud: "https://appleid.apple.com",
  sub: clientId,
};

const token = jwt.sign(payload, privateKey, {
  algorithm: "ES256",
  keyid: keyId,
});

console.log(token);
