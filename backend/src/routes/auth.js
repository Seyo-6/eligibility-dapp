const express = require("express");
const { ethers } = require("ethers");
const { issueNonce, buildSignInMessage, consumeNonce, issueSessionToken } = require("../services/auth");

const router = express.Router();

// Step 1: frontend requests a nonce for the connected wallet address
router.post("/nonce", (req, res) => {
  const { address } = req.body;
  if (!address || !ethers.isAddress(address)) {
    return res.status(400).json({ error: "Valid wallet address required" });
  }
  const nonce = issueNonce(address);
  const message = buildSignInMessage(address, nonce);
  res.json({ message });
});

// Step 2: frontend sends back the signature (from personal_sign / MetaMask)
router.post("/verify", (req, res) => {
  const { address, signature } = req.body;
  if (!address || !signature) {
    return res.status(400).json({ error: "address and signature are required" });
  }

  const nonce = consumeNonce(address);
  if (!nonce) {
    return res.status(400).json({ error: "Nonce expired or not found — request a new one" });
  }

  const expectedMessage = buildSignInMessage(address, nonce);

  let recovered;
  try {
    recovered = ethers.verifyMessage(expectedMessage, signature);
  } catch (err) {
    return res.status(400).json({ error: "Malformed signature" });
  }

  if (recovered.toLowerCase() !== address.toLowerCase()) {
    return res.status(401).json({ error: "Signature does not match address" });
  }

  // Role assignment: in a real system, look this up in your users table
  // or the on-chain VERIFIER_ROLE. Defaulting to "beneficiary" here.
  const role = "beneficiary";
  const token = issueSessionToken(address, role);

  res.json({ token, address, role });
});

module.exports = router;
