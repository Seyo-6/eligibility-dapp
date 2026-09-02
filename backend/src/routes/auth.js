const express = require("express");
const { ethers } = require("ethers");
const { issueNonce, buildSignInMessage, consumeNonce, issueSessionToken } = require("../services/auth");

const router = express.Router();

const DEMO_ACCOUNTS = {
  admin: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
  tahsildar: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
  ri: "0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC",
  vro: "0x90F79bf6EB2c4f870365E785982E1f101E93b906",
  citizen: "0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65"
};

// Request SIWE nonce
router.post("/nonce", (req, res) => {
  const { address } = req.body;
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: "Valid wallet address required" });
  }
  const nonce = issueNonce(address);
  res.json({ message: buildSignInMessage(address, nonce) });
});

// Verify SIWE signature & issue JWT
router.post("/verify", (req, res) => {
  const { address, signature } = req.body;
  if (!address || !signature) {
    return res.status(400).json({ error: "address and signature are required" });
  }
  const nonce = consumeNonce(address);
  if (!nonce) return res.status(400).json({ error: "Nonce expired or not found — request a new one" });

  let recovered;
  try {
    recovered = ethers.verifyMessage(buildSignInMessage(address, nonce), signature);
  } catch {
    return res.status(400).json({ error: "Malformed signature" });
  }
  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return res.status(401).json({ error: "Signature does not match address" });
  }

  const role = resolveRole(address);
  const token = issueSessionToken(address, role);
  res.json({ token, address, role });
});

// Quick demo login for lab presentations
router.post("/demo-login", (req, res) => {
  const { role } = req.body; // 'citizen', 'vro', 'ri', 'tahsildar', 'admin'
  const normalizedRole = (role || "citizen").toLowerCase();
  const address = DEMO_ACCOUNTS[normalizedRole] || DEMO_ACCOUNTS.citizen;
  const mappedRole = normalizedRole === "citizen" ? "beneficiary" : normalizedRole;

  const token = issueSessionToken(address, mappedRole);
  res.json({ token, address, role: mappedRole, isDemo: true });
});

function resolveRole(address) {
  const lower = address.toLowerCase();

  const tahsildarAddresses = (process.env.TAHSILDAR_ADDRESSES || process.env.TAHSILDAR_ADDRESS || "")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  const riAddresses = (process.env.RI_ADDRESSES || process.env.RI_ADDRESS || "")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  const vroAddresses = (process.env.VRO_ADDRESSES || process.env.VRO_ADDRESS || "")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  const adminAddresses = (process.env.ADMIN_ADDRESSES || "")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  const verifierAddresses = (process.env.VERIFIER_ADDRESSES || "")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);

  if (adminAddresses.includes(lower) || lower === DEMO_ACCOUNTS.admin.toLowerCase()) return "admin";
  if (tahsildarAddresses.includes(lower) || lower === DEMO_ACCOUNTS.tahsildar.toLowerCase()) return "tahsildar";
  if (riAddresses.includes(lower) || lower === DEMO_ACCOUNTS.ri.toLowerCase()) return "ri";
  if (vroAddresses.includes(lower) || lower === DEMO_ACCOUNTS.vro.toLowerCase()) return "vro";
  if (verifierAddresses.includes(lower)) return "vro";

  return "beneficiary";
}

module.exports = router;

