const express = require("express");
const { ethers } = require("ethers");
const { requireAuth } = require("../middleware/requireAuth");
const { getEligibilityContract } = require("../services/web3");

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin role required" });
  }
  next();
}

router.post("/verifiers", requireAuth, requireAdmin, async (req, res) => {
  const { address } = req.body;
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Valid wallet address required" });
  }
  try {
    const registry = getEligibilityContract(true);
    const tx = await registry.addVerifier(address);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/verifiers/:address", requireAuth, requireAdmin, async (req, res) => {
  const { address } = req.params;
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Valid wallet address required" });
  }
  try {
    const registry = getEligibilityContract(true);
    const tx = await registry.removeVerifier(address);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/pause", requireAuth, requireAdmin, async (req, res) => {
  try {
    const registry = getEligibilityContract(true);
    const tx = await registry.pause();
    const receipt = await tx.wait();
    res.json({ txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/unpause", requireAuth, requireAdmin, async (req, res) => {
  try {
    const registry = getEligibilityContract(true);
    const tx = await registry.unpause();
    const receipt = await tx.wait();
    res.json({ txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
