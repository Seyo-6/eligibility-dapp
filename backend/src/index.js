const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const claimsRoutes = require("./routes/claims");
const applicationsRoutes = require("./routes/applications");
const kycRoutes = require("./routes/kyc");
const adminRoutes = require("./routes/admin");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "").split(",").map((v) => v.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/kyc", kycRoutes);
app.use("/api/admin", adminRoutes);

app.get("/health", (req, res) => res.json({ ok: true, timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Telangana MeeSeva DApp Backend running on port ${PORT}`));

