const express = require("express");
const { ethers } = require("ethers");
const { requireAuth } = require("../middleware/requireAuth");
const { getEligibilityContract } = require("../services/web3");

const router = express.Router();

// GET current claim/eligibility status for the logged-in user
router.get("/me", requireAuth, async (req, res) => {
  try {
    const registry = getEligibilityContract();
    const claim = await registry.getClaim(req.user.address);
    res.json({
      documentHash: claim.documentHash,
      category: Number(claim.category),
      status: Number(claim.status), // 0 None, 1 Pending, 2 Approved, 3 Rejected
      verifiedBy: claim.verifiedBy,
      submittedAt: Number(claim.submittedAt),
      decidedAt: Number(claim.decidedAt)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: record that a document was uploaded/hashed off-chain, then submit
// the on-chain claim. In production the beneficiary signs+sends this
// transaction themselves from the frontend using their own wallet —
// this route is a convenience path for backend-relayed submissions
// (e.g. gasless/sponsored transactions), which requires a signer.
router.post("/submit", requireAuth, async (req, res) => {
  const { documentHash, category } = req.body;
  if (!documentHash || category === undefined) {
    return res.status(400).json({ error: "documentHash and category are required" });
  }

  try {
    const registry = getEligibilityContract(true); // signer required
    const tx = await registry.submitClaim(documentHash, category);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST: verifier approves/rejects a pending claim (or this gets called
// automatically by the KYC webhook once a provider confirms identity —
// see routes/kyc.js).
router.post("/:address/review", requireAuth, async (req, res) => {
  if (req.user.role !== "verifier" && req.user.role !== "admin") {
    return res.status(403).json({ error: "Verifier role required" });
  }

  const { address } = req.params;
  const { approve } = req.body;
  if (!ethers.isAddress(address) || typeof approve !== "boolean") {
    return res.status(400).json({ error: "Valid address and boolean approve are required" });
  }

  try {
    const registry = getEligibilityContract(true);
    const tx = await registry.reviewClaim(address, approve);
    const receipt = await tx.wait();
    res.json({ txHash: receipt.hash });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
