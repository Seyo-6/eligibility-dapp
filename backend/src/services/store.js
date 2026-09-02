const fs = require("fs");
const path = require("path");

const DATA_DIR = path.join(__dirname, "../../data");
const DB_FILE = path.join(DATA_DIR, "db.json");

// Ensure data directory and file exist
function initDb() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(
      DB_FILE,
      JSON.stringify({ applications: {}, auditLogs: [] }, null, 2),
      "utf8"
    );
  }
}

function readDb() {
  initDb();
  try {
    const raw = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(raw);
  } catch {
    return { applications: {}, auditLogs: [] };
  }
}

function writeDb(data) {
  initDb();
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
}

function saveApplication(app) {
  const db = readDb();
  db.applications[app.applicationId] = {
    ...app,
    createdAt: app.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  writeDb(db);
  return db.applications[app.applicationId];
}

function getApplication(applicationId) {
  const db = readDb();
  return db.applications[applicationId] || null;
}

function getBeneficiaryApplications(beneficiary) {
  const db = readDb();
  const lower = beneficiary.toLowerCase();
  return Object.values(db.applications).filter(
    (app) => (app.beneficiary || "").toLowerCase() === lower
  );
}

function getApplicationsByStage(stages = []) {
  const db = readDb();
  if (!stages.length) return Object.values(db.applications);
  return Object.values(db.applications).filter((app) =>
    stages.includes(app.stage)
  );
}

function updateApplicationStage(applicationId, update) {
  const db = readDb();
  const app = db.applications[applicationId];
  if (!app) return null;

  app.stage = update.stage;
  app.stageName = update.stageName;
  app.updatedAt = new Date().toISOString();

  if (update.remarks) {
    app.history = app.history || [];
    app.history.push({
      stage: update.stage,
      stageName: update.stageName,
      officerRole: update.officerRole,
      officerAddress: update.officerAddress,
      remarks: update.remarks,
      txHash: update.txHash,
      timestamp: new Date().toISOString()
    });
  }

  if (update.officerRole === "VRO") app.vro = update.officerAddress;
  if (update.officerRole === "RI") app.ri = update.officerAddress;
  if (update.officerRole === "TAHSILDAR") {
    app.tahsildar = update.officerAddress;
    app.issuedAt = new Date().toISOString();
  }

  db.applications[applicationId] = app;
  writeDb(db);
  return app;
}

function getAllApplications() {
  const db = readDb();
  return Object.values(db.applications);
}

module.exports = {
  saveApplication,
  getApplication,
  getBeneficiaryApplications,
  getApplicationsByStage,
  updateApplicationStage,
  getAllApplications
};
