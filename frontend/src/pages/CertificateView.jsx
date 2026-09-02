import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { authedFetch } from "../services/wallet";
import Navbar from "../components/Navbar";

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
        setError(err.error || "Certificate not found");
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

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <div style={{ textAlign: "center", padding: 60 }}>Loading MeeSeva certificate...</div>
      </div>
    );
  }

  if (error || !app) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
        <Navbar />
        <div style={{ maxWidth: 500, margin: "60px auto", textAlign: "center", padding: 20 }}>
          <h3 style={{ color: "#b91c1c" }}>{error || "Certificate record not available"}</h3>
          <button onClick={() => navigate("/dashboard")} style={{ padding: "8px 16px", cursor: "pointer" }}>
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f3f4f6", fontFamily: "'Times New Roman', Times, serif" }}>
      <div className="no-print">
        <Navbar />
        <div style={{ maxWidth: 850, margin: "16px auto 0 auto", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={() => navigate("/dashboard")}
            style={{ background: "#ffffff", border: "1px solid #d1d5db", padding: "8px 16px", borderRadius: 6, fontWeight: 600, cursor: "pointer", fontFamily: "system-ui" }}
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={handlePrint}
            style={{ background: "#047857", color: "#ffffff", border: "none", padding: "10px 24px", borderRadius: 6, fontWeight: 700, cursor: "pointer", fontFamily: "system-ui", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}
          >
            🖨️ Print / Download Official Certificate
          </button>
        </div>
      </div>

      {/* Official Telangana MeeSeva Certificate Sheet */}
      <div style={{
        maxWidth: 800,
        margin: "24px auto 40px auto",
        background: "#ffffff",
        padding: "48px 56px",
        borderRadius: 4,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        border: "3px double #065f46",
        position: "relative",
        boxSizing: "border-box"
      }}>
        {/* Top Emblems & Header */}
        <div style={{ textAlign: "center", borderBottom: "2px solid #065f46", paddingBottom: 16, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <div style={{ textAlign: "left", fontSize: 13, fontFamily: "system-ui", color: "#065f46", fontWeight: 700 }}>
              <div>GOVERNMENT OF TELANGANA</div>
              <div>REVENUE DEPARTMENT</div>
            </div>
            <div style={{ width: 56, height: 56, borderRadius: "50%", border: "2px solid #065f46", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 20, color: "#065f46" }}>
              TS
            </div>
            <div style={{ textAlign: "right", fontSize: 13, fontFamily: "system-ui", color: "#065f46", fontWeight: 700 }}>
              <div>మీసేవ | MEESEVA</div>
              <div>BLOCKCHAIN REGISTRY</div>
            </div>
          </div>

          <h2 style={{ margin: "10px 0 2px 0", fontSize: 22, textTransform: "uppercase", letterSpacing: 1, color: "#111827" }}>
            {app.categoryName || "CERTIFICATE"}
          </h2>
          <div style={{ fontSize: 13, color: "#4b5563", fontStyle: "italic" }}>
            (Issued under Telangana Statutory Citizen Service Rules on Blockchain Network)
          </div>
        </div>

        {/* Certificate Reference Metadata */}
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontFamily: "system-ui", marginBottom: 24, padding: "8px 12px", background: "#f9fafb", borderRadius: 4, border: "1px solid #e5e7eb" }}>
          <div><strong>Application No:</strong> <span style={{ fontFamily: "monospace", color: "#1e3a8a" }}>{app.applicationId}</span></div>
          <div><strong>Date of Issue:</strong> {new Date(app.issuedAt || app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</div>
        </div>

        {/* Statutory Certificate Body */}
        <div style={{ fontSize: 15, lineHeight: 1.8, textAlign: "justify", color: "#111827", marginBottom: 32 }}>
          <p>
            This is to certify that Sri / Smt / Kum <strong>{app.applicantName}</strong>, Son / Daughter of <strong>{app.fatherName}</strong>, resident of <strong>{app.village}</strong> village, <strong>{app.mandal}</strong> Mandal, <strong>{app.district}</strong> District of Telangana State (Pincode: {app.pincode}), has been verified following formal revenue inquiries by the Village Revenue Officer (VRO) and Revenue Inspector (RI).
          </p>

          {app.category === 1 ? (
            <p>
              It is further certified that the applicant belongs to the <strong>{app.casteGroup}</strong> ({app.subCaste}) Community, which is recognized as a Scheduled Caste / Scheduled Tribe / Backward Class under the Constitution of India and Telangana State Revenue statutory orders.
            </p>
          ) : app.category === 2 ? (
            <p>
              It is further certified that the total annual household income from all verifiable sources (including agriculture, commerce, and salary) of Sri / Smt <strong>{app.applicantName}</strong> and their family members for the current financial year is <strong>₹ {Number(app.annualIncome).toLocaleString("en-IN")}</strong> (Rupees {Number(app.annualIncome).toLocaleString("en-IN")} only).
            </p>
          ) : (
            <p>
              It is further certified that the applicant is a bonafide resident and native of Telangana State possessing continuous domicile.
            </p>
          )}

          <p style={{ fontSize: 13, color: "#4b5563", fontStyle: "italic", marginTop: 16 }}>
            This certificate is issued on the Ethereum blockchain under cryptographic signature of the Competent Authority.
            {app.validUntil ? ` Validity: Expiring on ${new Date(app.validUntil * 1000).toLocaleDateString("en-IN")}.` : " Validity: Lifetime (Permanent Community Record)."}
          </p>
        </div>

        {/* Signatures, Stamp & Live Verification QR Code */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", borderTop: "1px solid #e5e7eb", paddingTop: 20 }}>
          {/* Live QR Code */}
          <div style={{ textAlign: "center" }}>
            <div style={{ padding: 6, background: "#ffffff", border: "1px solid #d1d5db", borderRadius: 6, display: "inline-block" }}>
              <QRCodeSVG value={verifyUrl} size={110} level="H" />
            </div>
            <div style={{ fontSize: 10, fontFamily: "system-ui", color: "#6b7280", marginTop: 4, maxWidth: 120 }}>
              Scan QR to verify on-chain authenticity
            </div>
          </div>

          {/* Hologram & Cryptographic Hash */}
          <div style={{ textAlign: "center", fontSize: 11, fontFamily: "system-ui", color: "#4b5563" }}>
            <div style={{ width: 60, height: 60, borderRadius: "50%", border: "2px dashed #047857", margin: "0 auto 6px auto", display: "flex", alignItems: "center", justifyContent: "center", color: "#047857", fontWeight: 700, fontSize: 10 }}>
              MEESEVA<br />SEAL
            </div>
            <div>Doc Root: <span style={{ fontFamily: "monospace" }}>{(app.documentHash || "").slice(0, 12)}...</span></div>
          </div>

          {/* Digital Signature of Tahsildar */}
          <div style={{ textAlign: "right", fontFamily: "system-ui" }}>
            <div style={{ color: "#047857", fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
              ✓ DIGITALLY SIGNED & ATTESTED
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#111827" }}>Tahsildar / Mandal Revenue Officer</div>
            <div style={{ fontSize: 12, color: "#4b5563" }}>Mandal: {app.mandal}, District: {app.district}</div>
            <div style={{ fontSize: 11, color: "#9ca3af", marginTop: 4, fontFamily: "monospace" }}>
              Signer: {(app.tahsildar || "0x7099...79C8").slice(0, 14)}...
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
