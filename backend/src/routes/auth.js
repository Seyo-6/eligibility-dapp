const express = require("express");
const { ethers } = require("ethers");
const { issueNonce, buildSignInMessage, consumeNonce, issueSessionToken } = require("../services/auth");

const router = express.Router();

router.post("/nonce", (req, res) => {
  const { address } = req.body;
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: "Valid wallet address required" });
  }
  const nonce = issueNonce(address);
  res.json({ message: buildSignInMessage(address, nonce) });
});

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

  const verifierAddresses = (process.env.VERIFIER_ADDRESSES || "")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);
  const adminAddresses = (process.env.ADMIN_ADDRESSES || "")
    .split(",").map((v) => v.trim().toLowerCase()).filter(Boolean);

  const lower = address.toLowerCase();
  const role = adminAddresses.includes(lower)
    ? "admin"
    : verifierAddresses.includes(lower)
      ? "verifier"
      : "beneficiary";
  const token = issueSessionToken(address, role);
  res.json({ token, address, role });
});

module.exports = router;
