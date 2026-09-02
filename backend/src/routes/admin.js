const express = require("express");
const { ethers } = require("ethers");
const { requireAuth } = require("../middleware/requireAuth");
const { getEligibilityContract, ROLES } = require("../services/web3");

const router = express.Router();

function requireAdmin(req, res, next) {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Admin role required" });
  }
  next();
}

router.post("/officers", requireAuth, requireAdmin, async (req, res) => {
  const { address, role } = req.body;
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Valid wallet address required" });
  }

  const roleKey = `${(role || "VRO").toUpperCase()}_ROLE`;
  const roleHash = ROLES[roleKey];
  if (!roleHash) {
    return res.status(400).json({ error: `Invalid role specified: ${role}` });
  }

  try {
    const registry = getEligibilityContract(true);
    const tx = await registry.addOfficer(roleHash, address);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.hash, role: roleKey, address });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/officers/:role/:address", requireAuth, requireAdmin, async (req, res) => {
  const { role, address } = req.params;
  if (!ethers.isAddress(address)) {
    return res.status(400).json({ error: "Valid wallet address required" });
  }

  const roleKey = `${role.toUpperCase()}_ROLE`;
  const roleHash = ROLES[roleKey];
  if (!roleHash) {
    return res.status(400).json({ error: `Invalid role specified: ${role}` });
  }

  try {
    const registry = getEligibilityContract(true);
    const tx = await registry.removeOfficer(roleHash, address);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.hash, role: roleKey, address });
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

