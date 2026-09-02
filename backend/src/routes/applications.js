const express = require("express");
const { ethers } = require("ethers");
const { requireAuth } = require("../middleware/requireAuth");
const { getEligibilityContract, getDisbursementContract } = require("../services/web3");
const store = require("../services/store");

const router = express.Router();

const CATEGORY_CODES = {
  1: "CGC", // Caste / Community / Nativity / DOB
  2: "INC", // Income Certificate
  3: "RES", // Residence Certificate
  4: "EWS"  // Economically Weaker Section
};

const CATEGORY_NAMES = {
  1: "Caste & Community Certificate",
  2: "Income Certificate",
  3: "Residence Certificate",
  4: "EWS Certificate"
};

// Citizen submits a new application draft & gets on-chain hash bundle
router.post("/apply", requireAuth, async (req, res) => {
  try {
    const beneficiary = req.user.address;
    const {
      category,
      applicantName,
      fatherName,
      gender,
      dob,
      aadhaarMasked,
      district,
      mandal,
      village,
      pincode,
      casteGroup,
      subCaste,
      annualIncome,
      purpose,
      documents = []
    } = req.body;

    const catNum = Number(category) || 1;
    if (!applicantName || !district || !mandal) {
      return res.status(400).json({ error: "Applicant name, district, and mandal are required" });
    }

    // Generate unique MeeSeva Application ID
    const prefix = CATEGORY_CODES[catNum] || "APP";
    const year = new Date().getFullYear();
    const seq = Math.floor(100000 + Math.random() * 900000);
    const applicationId = `TS-${prefix}-${year}-${seq}`;

    // Validity: Income = 1 Year (365 days), Caste/Residence = Lifetime (0)
    const validUntil = catNum === 2 ? Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60 : 0;

    // Build canonical metadata bundle for hashing
    const metadataBundle = {
      applicationId,
      beneficiary,
      category: catNum,
      categoryName: CATEGORY_NAMES[catNum],
      applicantName,
      fatherName,
      gender,
      dob,
      aadhaarMasked,
      district,
      mandal,
      village,
      pincode,
      casteGroup: casteGroup || "N/A",
      subCaste: subCaste || "N/A",
      annualIncome: annualIncome || "0",
      purpose: purpose || "General MeeSeva Application",
      documentsSummary: documents.map((d) => ({ name: d.name, type: d.type, hash: d.hash })),
      createdAt: new Date().toISOString()
    };

    // Calculate Keccak-256 root hash of the bundle
    const documentHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(metadataBundle)));

    // Save to persistent local store
    const appRecord = store.saveApplication({
      ...metadataBundle,
      documentHash,
      validUntil,
      documents,
      stage: 1, // 1: Submitted
      stageName: "Submitted (Pending VRO Field Verification)",
      history: [
        {
          stage: 1,
          stageName: "Submitted",
          officerRole: "CITIZEN",
          officerAddress: beneficiary,
          remarks: "Application lodged through MeeSeva Citizen Portal",
          timestamp: new Date().toISOString()
        }
      ]
    });

    res.json({
      application: appRecord,
      applicationId,
      documentHash,
      category: catNum,
      validUntil
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all applications submitted by the logged-in citizen
router.get("/my", requireAuth, (req, res) => {
  try {
    const apps = store.getBeneficiaryApplications(req.user.address);
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET officer review queue based on role
router.get("/queue/:role", requireAuth, (req, res) => {
  try {
    const role = (req.params.role || "").toLowerCase();
    let stages = [];
    if (role === "vro") stages = [1]; // Submitted
    else if (role === "ri") stages = [2]; // VRO_Verified
    else if (role === "tahsildar") stages = [3]; // RI_Endorsed
    else if (role === "admin") stages = [1, 2, 3, 4, 5, 6];
    else return res.status(400).json({ error: "Invalid officer role" });

    const apps = store.getApplicationsByStage(stages);
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single application details + document inspection
router.get("/:appId", requireAuth, (req, res) => {
  try {
    const app = store.getApplication(req.params.appId);
    if (!app) return res.status(404).json({ error: "Application not found" });
    res.json(app);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST officer review action & audit logging
router.post("/:appId/review", requireAuth, async (req, res) => {
  try {
    const { appId } = req.params;
    const { action, remarks = "", txHash = "" } = req.body;
    const app = store.getApplication(appId);
    if (!app) return res.status(404).json({ error: "Application not found" });

    const officerRole = (req.user.role || "").toUpperCase();
    const officerAddress = req.user.address;

    let nextStage = app.stage;
    let nextStageName = app.stageName;

    if (action === "reject") {
      nextStage = 5;
      nextStageName = `Rejected by ${officerRole}`;
    } else if (action === "approve") {
      if (officerRole === "VRO" || app.stage === 1) {
        nextStage = 2;
        nextStageName = "VRO Verified (Pending RI Endorsement)";
      } else if (officerRole === "RI" || app.stage === 2) {
        nextStage = 3;
        nextStageName = "RI Endorsed (Pending Tahsildar Digital Signature)";
      } else if (officerRole === "TAHSILDAR" || app.stage === 3) {
        nextStage = 4;
        nextStageName = "Approved & Digitally Issued by Tahsildar";
      }
    } else if (action === "revoke") {
      nextStage = 6;
      nextStageName = "Revoked by Competent Authority";
    }

    const updated = store.updateApplicationStage(appId, {
      stage: nextStage,
      stageName: nextStageName,
      officerRole,
      officerAddress,
      remarks,
      txHash
    });

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public QR Code verification endpoint (No authentication required)
router.get("/public/verify/:appId", async (req, res) => {
  try {
    const { appId } = req.params;
    const app = store.getApplication(appId);
    if (!app) {
      return res.status(404).json({ valid: false, error: "Application record not found in MeeSeva registry" });
    }

    let onChainValid = false;
    let onChainData = null;

    try {
      const registry = getEligibilityContract();
      onChainValid = await registry.isCertificateValid(appId);
      const raw = await registry.getApplication(appId);
      onChainData = {
        applicationId: raw.applicationId,
        beneficiary: raw.beneficiary,
        category: Number(raw.category),
        stage: Number(raw.stage),
        documentHash: raw.documentHash,
        validUntil: Number(raw.validUntil),
        vro: raw.vro,
        ri: raw.ri,
        tahsildar: raw.tahsildar
      };
    } catch (contractErr) {
      console.warn("On-chain lookup notice:", contractErr.message);
    }

    res.json({
      valid: app.stage === 4,
      onChainValid,
      applicationId: app.applicationId,
      categoryName: app.categoryName,
      applicantName: app.applicantName,
      fatherName: app.fatherName,
      district: app.district,
      mandal: app.mandal,
      village: app.village,
      casteGroup: app.casteGroup,
      subCaste: app.subCaste,
      annualIncome: app.annualIncome,
      stage: app.stage,
      stageName: app.stageName,
      issuedAt: app.issuedAt || app.updatedAt,
      validUntil: app.validUntil,
      tahsildar: app.tahsildar || onChainData?.tahsildar,
      documentHash: app.documentHash,
      onChainData
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public schemes endpoint for DBT
router.get("/public/schemes", async (req, res) => {
  try {
    const schemes = [
      {
        id: 1,
        name: "Telangana ePASS Post-Matric Scholarship",
        description: "Financial assistance for higher education tuition and maintenance fees for SC/ST/BC/EWS students.",
        requiredCategory: 1,
        categoryName: "Caste / Community Certificate",
        amount: "250 mUSD",
        intervalDays: 30
      },
      {
        id: 2,
        name: "Telangana Welfare & Livelihood Grant",
        description: "Direct livelihood and agricultural support for families below poverty line.",
        requiredCategory: 2,
        categoryName: "Income Certificate (Valid within 1 FY)",
        amount: "500 mUSD",
        intervalDays: 60
      }
    ];
    res.json(schemes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
