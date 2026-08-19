const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const claimsRoutes = require("./routes/claims");
const kycRoutes = require("./routes/kyc");

const app = express();
const allowedOrigins = (process.env.FRONTEND_URL || "").split(",").map((v) => v.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins.length ? allowedOrigins : true }));
app.use(express.json({ limit: "1mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/claims", claimsRoutes);
app.use("/api/kyc", kycRoutes);

app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Backend listening on port ${PORT}`));
