const crypto = require("crypto");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// In-memory nonce store for demo purposes. Replace with Redis or a DB
// table in production so nonces survive restarts and work across
// multiple backend instances.
const nonces = new Map(); // address(lowercase) -> { nonce, expiresAt }

const NONCE_TTL_MS = 5 * 60 * 1000;

function issueNonce(address) {
  const nonce = crypto.randomBytes(16).toString("hex");
  nonces.set(address.toLowerCase(), { nonce, expiresAt: Date.now() + NONCE_TTL_MS });
  return nonce;
}

function buildSignInMessage(address, nonce) {
  return `Sign in to the Eligibility dApp.\n\nAddress: ${address}\nNonce: ${nonce}`;
}

function consumeNonce(address) {
  const entry = nonces.get(address.toLowerCase());
  if (!entry) return null;
  nonces.delete(address.toLowerCase());
  if (Date.now() > entry.expiresAt) return null;
  return entry.nonce;
}

function issueSessionToken(address, role) {
  return jwt.sign({ address, role }, process.env.JWT_SECRET || "dev-secret", {
    expiresIn: "12h"
  });
}

function verifySessionToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || "dev-secret");
}

module.exports = { issueNonce, buildSignInMessage, consumeNonce, issueSessionToken, verifySessionToken };
