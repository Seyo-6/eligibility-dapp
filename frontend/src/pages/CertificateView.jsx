import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { authedFetch } from "../services/wallet";
import Navbar from "../components/Navbar";

// Helper to convert numbers to Indian currency words
function numberToIndianWords(num) {
  const n = parseInt(num, 10);
  if (isNaN(n) || n === 0) return "ZERO RUPEES ONLY";

  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(num) {
    if (num === 0) return "";
    let str = "";
    if (Math.floor(num / 10000000) > 0) {
      str += inWords(Math.floor(num / 10000000)) + " Crore ";
      num %= 10000000;
    }
    if (Math.floor(num / 100000) > 0) {
      str += inWords(Math.floor(num / 100000)) + " Lakh ";
      num %= 100000;
    }
    if (Math.floor(num / 1000) > 0) {
      str += inWords(Math.floor(num / 1000)) + " Thousand ";
      num %= 1000;
    }
    if (Math.floor(num / 100) > 0) {
      str += inWords(Math.floor(num / 100)) + " Hundred ";
      num %= 100;
    }
    if (num > 0) {
      if (str !== "") str += "and ";
      if (num < 20) str += a[num] + " ";
      else {
        str += b[Math.floor(num / 10)] + " ";
        if (num % 10 > 0) str += a[num % 10] + " ";
      }
    }
    return str;
  }

  return "Rupees " + inWords(n).trim().toUpperCase() + " ONLY";
}

export default function CertificateView() {
  const { appId } = useParams();
  const navigate = useNavigate();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadCertificate();
  }, [appId]);

  async function loadCertificate() {
    try {
      setLoading(true);
      const res = await authedFetch(`/applications/${appId}`);
      if (res.ok) {
        setApp(await res.json());
      } else {
        const err = await res.json();
        setError(err.error || "Certificate record not found in MeeSeva registry");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  const verifyUrl = `${window.location.origin}/verify/${appId}`;
  const isCaste = app?.category === 1;
  const isIncome = app?.category === 2;
  const issueDate = app ? new Date(app.issuedAt || app.updatedAt || app.createdAt) : new Date();
  const formattedDate = issueDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  });

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: "80px 20px", color: "#065f46", fontSize: 16, fontWeight: 600 }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>🏛️</div>
          Generating official Telangana MeeSeva certificate document...
        </div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <div style={{ maxWidth: 520, margin: "60px auto", textAlign: "center", padding: 32, background: "#ffffff", borderRadius: 12, border: "1px solid #fee2e2" }}>
          <div style={{ fontSize: 40, color: "#dc2626", marginBottom: 12 }}>⚠️</div>
          <h3 style={{ color: "#991b1b", margin: "0 0 8px 0" }}>Certificate Not Available</h3>
          <p style={{ color: "#6b7280", fontSize: 14, margin: "0 0 20px 0" }}>{error || "Could not retrieve certificate information."}</p>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ background: "#047857", color: "#ffffff", border: "none", padding: "10px 20px", borderRadius: 6, fontWeight: 700, cursor: "pointer" }}
          >
            ← Return to Citizen Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#e2e8f0", paddingBottom: 60 }}>
      {/* Action Header bar (hidden on print) */}
      <div className="no-print">
        <Navbar />
        <div style={{
          maxWidth: 900,
          margin: "18px auto 0 auto",
          padding: "12px 24px",
          background: "#ffffff",
          borderRadius: 10,
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 12
        }}>
          <div>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#047857", letterSpacing: 0.5, textTransform: "uppercase" }}>
              Official Certificate Viewer
            </span>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#111827", fontFamily: "system-ui" }}>
              {app.applicationId} • {app.applicantName}
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={() => navigate("/dashboard")}
              style={{
                background: "#f3f4f6",
                border: "1px solid #d1d5db",
                color: "#374151",
                padding: "9px 16px",
                borderRadius: 6,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "system-ui"
              }}
            >
              ← Dashboard
            </button>
            <button
              onClick={handlePrint}
              style={{
                background: "#047857",
                color: "#ffffff",
                border: "none",
                padding: "9px 22px",
                borderRadius: 6,
                fontWeight: 700,
                cursor: "pointer",
                fontFamily: "system-ui",
                boxShadow: "0 2px 4px rgba(4,120,87,0.25)",
                display: "flex",
                alignItems: "center",
                gap: 8
              }}
            >
              <span>🖨️</span> Print / Save PDF
            </button>
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body { background: #ffffff !important; margin: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
          .certificate-sheet {
            box-shadow: none !important;
            margin: 0 auto !important;
            width: 100% !important;
            max-width: 100% !important;
            border: 3px double #065f46 !important;
            page-break-inside: avoid !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>

      {/* Official Telangana MeeSeva Certificate Sheet */}
      <div
        className="certificate-sheet"
        style={{
          maxWidth: 820,
          margin: "24px auto",
          background: "#ffffff",
          padding: "44px 50px",
          border: "4px double #14532d",
          outline: "1px solid #ca8a04",
          outlineOffset: "-8px",
          boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
          fontFamily: "'Times New Roman', Times, serif",
          position: "relative",
          boxSizing: "border-box",
          overflow: "hidden"
        }}
      >
        {/* Subtle Watermark Seal */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.04,
            pointerEvents: "none",
            zIndex: 0,
            textAlign: "center"
          }}
        >
          <svg width="420" height="420" viewBox="0 0 100 100" fill="#047857">
            <circle cx="50" cy="50" r="45" stroke="#047857" strokeWidth="3" fill="none" />
            <circle cx="50" cy="50" r="40" stroke="#047857" strokeWidth="1" fill="none" />
            <text x="50" y="55" fontSize="14" fontWeight="bold" textAnchor="middle">TELANGANA</text>
          </svg>
        </div>

        {/* Content Container (Above watermark) */}
        <div style={{ position: "relative", zIndex: 1 }}>

          {/* Top Telangana Government Header Banner */}
          <div style={{ borderBottom: "2px solid #14532d", paddingBottom: 12, marginBottom: 18 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>

              {/* Left: Emblem */}
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 58,
                  height: 58,
                  borderRadius: "50%",
                  border: "2px solid #065f46",
                  background: "#ecfdf5",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#065f46",
                  fontWeight: 900,
                  fontSize: 22,
                  fontFamily: "serif"
                }}>
                  TS
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "#14532d", letterSpacing: 0.5 }}>
                    తెలంగాణ ప్రభుత్వం
                  </div>
                  <div style={{ fontSize: 15, fontWeight: 900, color: "#0f172a", letterSpacing: 1 }}>
                    GOVERNMENT OF TELANGANA
                  </div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#475569" }}>
                    REVENUE DEPARTMENT
                  </div>
                </div>
              </div>

              {/* Right: MeeSeva Logo & Monogram */}
              <div style={{ textAlign: "right" }}>
                <div style={{
                  display: "inline-block",
                  padding: "4px 10px",
                  background: "#047857",
                  color: "#ffffff",
                  fontSize: 14,
                  fontWeight: 800,
                  letterSpacing: 1,
                  borderRadius: 4,
                  fontFamily: "system-ui"
                }}>
                  మీసేవ | MeeSeva
                </div>
                <div style={{ fontSize: 10, color: "#065f46", fontWeight: 700, marginTop: 2, fontFamily: "system-ui" }}>
                  BLOCKCHAIN REGISTRY VERIFIED
                </div>
              </div>

            </div>

            {/* Certificate Title */}
            <div style={{ textAlign: "center", marginTop: 14 }}>
              <div style={{ fontSize: 12, color: "#475569", fontWeight: 700, letterSpacing: 1, textTransform: "uppercase" }}>
                {isCaste ? "COMMUNITY, NATIVITY AND DATE OF BIRTH CERTIFICATE" : "INTEGRATED ANNUAL INCOME CERTIFICATE"}
              </div>
              <h1 style={{
                margin: "4px 0 2px 0",
                fontSize: 23,
                fontWeight: 900,
                color: "#111827",
                letterSpacing: 1.5,
                textTransform: "uppercase",
                textDecoration: "underline",
                textDecorationColor: "#ca8a04",
                textUnderlineOffset: 4
              }}>
                {isCaste ? "CASTE & COMMUNITY CERTIFICATE" : "INCOME CERTIFICATE"}
              </h1>
              <div style={{ fontSize: 11, color: "#64748b", fontStyle: "italic", marginTop: 4 }}>
                {isCaste
                  ? "(Issued under the Telangana SC, ST and BCs Regulation of Issue of Community Certificates Act & Rules)"
                  : "(Issued in accordance with G.O.Ms.No. 186 Revenue Department for Statutory Welfare & Fee Reimbursement)"}
              </div>
            </div>
          </div>

          {/* Reference Bar: Application No, Barcode representation, Date */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            background: "#f8fafc",
            border: "1px solid #cbd5e1",
            padding: "8px 14px",
            marginBottom: 20,
            fontSize: 12,
            fontFamily: "system-ui",
            alignItems: "center"
          }}>
            <div>
              <span style={{ color: "#64748b", fontWeight: 600 }}>Application No: </span>
              <strong style={{ fontFamily: "monospace", color: "#0f172a", fontSize: 13 }}>{app.applicationId}</strong>
            </div>

            <div style={{ textAlign: "center" }}>
              {/* Decorative barcode simulation */}
              <div style={{
                letterSpacing: 3,
                fontFamily: "monospace",
                fontWeight: 900,
                fontSize: 14,
                color: "#1e293b",
                transform: "scaleY(1.3)"
              }}>
                ||| | |||| | ||||| || |
              </div>
              <div style={{ fontSize: 9, color: "#64748b", letterSpacing: 1 }}>BARCODE REF</div>
            </div>

            <div style={{ textAlign: "right" }}>
              <span style={{ color: "#64748b", fontWeight: 600 }}>Date of Issue: </span>
              <strong style={{ color: "#0f172a" }}>{formattedDate}</strong>
            </div>
          </div>

          {/* Main Dossier Grid: Applicant Photo placeholder on right, Cert text on left */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 130px", gap: 24, marginBottom: 20 }}>

            {/* Certificate Legal Text */}
            <div style={{ fontSize: 14.5, lineHeight: 1.8, color: "#0f172a", textAlign: "justify" }}>
              <p style={{ margin: "0 0 14px 0", textIndent: 30 }}>
                This is to certify that Sri / Smt / Kum <strong>{app.applicantName}</strong>, Son / Daughter of Sri <strong>{app.fatherName}</strong>, residing at House/Door No: <strong>{app.village}</strong> village/locality, <strong>{app.mandal}</strong> Mandal of <strong>{app.district}</strong> District in the State of Telangana (PIN: <strong>{app.pincode}</strong>), has been verified pursuant to field inquiry conducted by the Village Revenue Officer (VRO) and revenue records scrutinized by the Revenue Inspector (RI).
              </p>

              {isCaste && (
                <div style={{ margin: "0 0 14px 0", background: "#fcfbf7", border: "1px solid #f3e8c7", padding: "10px 14px", borderRadius: 4 }}>
                  <p style={{ margin: 0 }}>
                    It is certified that the applicant belongs to the <strong>{app.casteGroup}</strong> Community (Sub-Caste: <strong>{app.subCaste}</strong>), which is recognized as a Backward Class / Scheduled Caste / Scheduled Tribe under the Constitution of India and State Government Presidential Orders.
                  </p>
                  <p style={{ margin: "6px 0 0 0", fontSize: 13, color: "#475569", fontStyle: "italic" }}>
                    • Validity: <strong>PERMANENT (LIFETIME VALIDITY)</strong> as per statutory guidelines for community certification.
                  </p>
                </div>
              )}

              {isIncome && (
                <div style={{ margin: "0 0 14px 0", background: "#fcfbf7", border: "1px solid #f3e8c7", padding: "10px 14px", borderRadius: 4 }}>
                  <p style={{ margin: 0 }}>
                    It is certified that the total annual family income from all verifiable sources (including agriculture, salary, profession, and commerce) of Sri / Smt <strong>{app.applicantName}</strong> and their family members for the financial year is assessed at:
                  </p>
                  <div style={{ margin: "8px 0 4px 0", padding: "6px 10px", background: "#ffffff", border: "1px dashed #ca8a04", textAlign: "center" }}>
                    <div style={{ fontSize: 17, fontWeight: 900, color: "#14532d", letterSpacing: 1 }}>
                      ₹ {Number(app.annualIncome || 0).toLocaleString("en-IN")}/-
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 800, color: "#78350f" }}>
                      ({numberToIndianWords(app.annualIncome || 0)})
                    </div>
                  </div>
                  <p style={{ margin: "6px 0 0 0", fontSize: 12, color: "#475569" }}>
                    • Purpose: <strong>{app.purpose || "Education / Scholarships / Fee Reimbursement"}</strong><br />
                    • Validity: <strong>1 Financial Year (Valid up to 31st March 2027)</strong>
                  </p>
                </div>
              )}

              <p style={{ margin: "0 0 8px 0", fontSize: 13, color: "#334155", fontStyle: "italic" }}>
                This certificate is electronically generated from the MeeSeva State Blockchain Database and digitally signed by the Competent Authority under the Information Technology Act, 2000.
              </p>
            </div>

            {/* Right Column: Applicant Photograph Placeholder & Aadhaar */}
            <div style={{ textAlign: "center" }}>
              <div style={{
                width: 120,
                height: 140,
                border: "2px solid #475569",
                background: "#f1f5f9",
                margin: "0 auto",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
                overflow: "hidden"
              }}>
                <div style={{ fontSize: 44, color: "#94a3b8" }}>👤</div>
                <div style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginTop: 4 }}>
                  Applicant Photo
                </div>
                {/* Attestation Banner */}
                <div style={{
                  position: "absolute",
                  bottom: 0,
                  width: "100%",
                  background: "rgba(20, 83, 45, 0.9)",
                  color: "#ffffff",
                  fontSize: 8,
                  fontWeight: 800,
                  padding: "2px 0",
                  letterSpacing: 0.5
                }}>
                  MEESEVA VERIFIED
                </div>
              </div>

              {/* Masked Aadhaar Box */}
              <div style={{ marginTop: 8, fontSize: 10, fontFamily: "system-ui", color: "#475569" }}>
                <div>Aadhaar Reference:</div>
                <strong style={{ fontFamily: "monospace", color: "#0f172a" }}>
                  {app.aadhaarMasked || "XXXX-XXXX-7890"}
                </strong>
              </div>
            </div>

          </div>

          {/* Bottom Verification Section: QR Code + Holographic Seal + DSC Digital Signature */}
          <div style={{
            borderTop: "2px solid #14532d",
            paddingTop: 16,
            marginTop: 8,
            display: "grid",
            gridTemplateColumns: "140px 1fr 220px",
            alignItems: "center",
            gap: 16
          }}>

            {/* Left: Official Live QR Code */}
            <div style={{ textAlign: "center" }}>
              <div style={{ padding: 5, background: "#ffffff", border: "1px solid #94a3b8", borderRadius: 4, display: "inline-block" }}>
                <QRCodeSVG value={verifyUrl} size={105} level="H" />
              </div>
              <div style={{ fontSize: 9, fontFamily: "system-ui", color: "#475569", marginTop: 4, fontWeight: 600 }}>
                Scan QR to Verify On-Chain
              </div>
            </div>

            {/* Center: Golden Holographic MeeSeva Security Seal */}
            <div style={{ textAlign: "center", padding: "0 10px" }}>
              <div style={{
                width: 68,
                height: 68,
                borderRadius: "50%",
                border: "3px double #b45309",
                background: "radial-gradient(circle, #fef3c7 30%, #fde68a 100%)",
                margin: "0 auto 6px auto",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#78350f",
                fontWeight: 900,
                fontSize: 9,
                textAlign: "center",
                boxShadow: "0 0 6px rgba(180, 83, 9, 0.2)",
                fontFamily: "system-ui"
              }}>
                <div>
                  TELANGANA<br />★ REVENUE ★<br />SEAL
                </div>
              </div>
              <div style={{ fontSize: 10, fontFamily: "system-ui", color: "#475569" }}>
                Document Root Hash:
              </div>
              <div style={{ fontSize: 9, fontFamily: "monospace", color: "#047857", fontWeight: 700, wordBreak: "break-all" }}>
                {(app.documentHash || "0x0000").slice(0, 24)}...
              </div>
            </div>

            {/* Right: Tahsildar DSC Digital Signature Seal */}
            <div style={{
              border: "1px solid #10b981",
              background: "#ecfdf5",
              borderRadius: 6,
              padding: "10px 12px",
              fontFamily: "system-ui",
              fontSize: 11,
              textAlign: "left",
              color: "#065f46"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                <span style={{ fontSize: 16 }}>🛡️</span>
                <strong style={{ fontSize: 11, color: "#065f46", textTransform: "uppercase" }}>
                  Digitally Signed (DSC)
                </strong>
              </div>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                TAHSILDAR / M.R.O.
              </div>
              <div style={{ fontSize: 11, color: "#334155" }}>
                Mandal: {app.mandal}
              </div>
              <div style={{ fontSize: 11, color: "#334155" }}>
                District: {app.district}
              </div>
              <div style={{ fontSize: 10, color: "#64748b", marginTop: 4, borderTop: "1px dashed #6ee7b7", paddingTop: 4 }}>
                Signer: {(app.tahsildar || "0x90F79bf6EB...").slice(0, 14)}...<br />
                Signed on: {formattedDate}
              </div>
            </div>

          </div>

          {/* Bottom Statutory Disclaimer */}
          <div style={{
            marginTop: 18,
            paddingTop: 10,
            borderTop: "1px solid #e2e8f0",
            fontSize: 9.5,
            fontFamily: "system-ui",
            color: "#64748b",
            textAlign: "center",
            lineHeight: 1.4
          }}>
            Note: This is a genuine digitally signed Government Certificate issued through Telangana MeeSeva Blockchain.
            Physical signature or embossing is not required under Section 4 of the Information Technology Act 2000.
            The authenticity of this document can be verified anywhere by scanning the QR code or visiting <strong>{window.location.origin}/verify/{app.applicationId}</strong>.
          </div>

        </div>
      </div>
    </div>
  );
}
