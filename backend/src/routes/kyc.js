const express = require("express");
const crypto = require("crypto");
const { ethers } = require("ethers");
const { getEligibilityContract } = require("../services/web3");

const router = express.Router();

/**
 * Verifies the webhook actually came from your KYC provider.
 * Replace with your provider's specific signature scheme
 * (e.g. HMAC-SHA256 over the raw body using a shared secret).
 */
function verifyWebhookSignature(req) {
  const signature = req.headers["x-kyc-signature"];
  const secret = process.env.KYC_WEBHOOK_SECRET || "";
  if (!signature || !secret) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(JSON.stringify(req.body))
    .digest("hex");

  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  } catch {
    return false;
  }
}

// Called by the KYC provider (e.g. DigiLocker flow / Onfido / Persona)
// once a verification session completes. NEVER trust this endpoint
// without verifying the signature — anyone could otherwise POST a fake
// "passed" result and get themselves auto-approved on-chain.
router.post("/webhook", async (req, res) => {
  if (!verifyWebhookSignature(req)) {
    return res.status(401).json({ error: "Invalid webhook signature" });
  }

  const { walletAddress, status, category } = req.body;
  if (!walletAddress || !ethers.isAddress(walletAddress) || !status) {
    return res.status(400).json({ error: "walletAddress and status are required" });
  }

  // TODO: persist the full KYC result (provider ref, verified fields,
  // timestamps) to kyc_sessions / kyc_audit_log tables here for compliance.

  if (status !== "passed") {
    // Leave as Pending or explicitly reject on-chain depending on your policy.
    return res.json({ received: true, action: "no on-chain action (status != passed)" });
  }

  try {
    const registry = getEligibilityContract(true);
    // Assumes the beneficiary already called submitClaim() themselves with
    // a placeholder/pending category and their document hash — this just
    // approves it once KYC confirms identity.
    const tx = await registry.reviewClaim(walletAddress, true);
    const receipt = await tx.wait();
    res.json({ received: true, approved: true, txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
