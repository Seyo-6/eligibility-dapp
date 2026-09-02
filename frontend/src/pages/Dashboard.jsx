import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getSession, authedFetch } from "../services/wallet";
import Navbar from "../components/Navbar";

const STAGE_CONFIG = {
  1: { label: "1/3: VRO Field Verification", color: "#d97706", bg: "#fef3c7" },
  2: { label: "2/3: RI Scrutiny", color: "#c2410c", bg: "#ffedd5" },
  3: { label: "3/3: Tahsildar Digital Signature", color: "#7c3aed", bg: "#ede9fe" },
  4: { label: "✓ Issued & Digitally Signed", color: "#047857", bg: "#d1fae5" },
  5: { label: "✕ Rejected with Shortfall", color: "#b91c1c", bg: "#fee2e2" },
  6: { label: "⚠ Revoked", color: "#4b5563", bg: "#f3f4f6" }
};

export default function Dashboard() {
  const session = getSession();
  const navigate = useNavigate();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!session) {
      navigate("/");
      return;
    }
    loadApplications();
  }, []);

  async function loadApplications() {
    try {
      setLoading(true);
      const res = await authedFetch("/applications/my");
      if (res.ok) {
        setApplications(await res.json());
      } else {
        const err = await res.json();
        setError(err.error || "Failed to load applications");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (!session) return null;

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <Navbar />

      <main style={{ maxWidth: 1100, margin: "32px auto", padding: "0 20px" }}>
        {/* Welcome & Quick Apply Header */}
        <div style={{ background: "#ffffff", borderRadius: 12, padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.05)", border: "1px solid #e5e7eb", marginBottom: 28, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: "#111827" }}>
              Citizen Services Dashboard
            </h1>
            <p style={{ margin: "6px 0 0 0", color: "#6b7280", fontSize: 14 }}>
              Welcome back. Track statutory MeeSeva applications and access verified blockchain credentials.
            </p>
          </div>
          <div>
            <button
              onClick={() => navigate("/certificate")}
              style={{
                background: "#047857",
                color: "#ffffff",
                border: "none",
                borderRadius: 8,
                padding: "10px 18px",
                fontSize: 14,
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 4px rgba(4,120,87,0.2)"
              }}
            >
              + Apply for New Certificate
            </button>
          </div>
        </div>

        {/* Available Certificate Services: Caste and Income */}
        <h2 style={{ fontSize: 18, fontWeight: 700, color: "#374151", marginBottom: 14 }}>
          MeeSeva Certificate Services
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          <div style={{ background: "#ffffff", borderRadius: 10, padding: 22, border: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>📜</div>
            <h3 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 700, color: "#111827" }}>Caste & Community Certificate</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
              Statutory community, nativity, and date-of-birth certification for SC, ST, BC, and OC groups with permanent lifetime validity on-chain.
            </p>
            <button
              onClick={() => navigate("/certificate?type=caste")}
              style={{ background: "#047857", color: "#ffffff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}
            >
              Apply for Caste Certificate →
            </button>
          </div>

          <div style={{ background: "#ffffff", borderRadius: 10, padding: 22, border: "1px solid #e5e7eb", boxShadow: "0 1px 2px rgba(0,0,0,0.04)" }}>
            <div style={{ fontSize: 30, marginBottom: 8 }}>💰</div>
            <h3 style={{ margin: "0 0 6px 0", fontSize: 17, fontWeight: 700, color: "#111827" }}>Income Certificate</h3>
            <p style={{ margin: "0 0 16px 0", fontSize: 13, color: "#6b7280", lineHeight: 1.5 }}>
              Annual family income verification certificate with 1 Financial Year validity, used for college fee reimbursement, scholarships, and admissions.
            </p>
            <button
              onClick={() => navigate("/certificate?type=income")}
              style={{ background: "#047857", color: "#ffffff", border: "none", borderRadius: 6, padding: "8px 16px", fontSize: 13, fontWeight: 700, cursor: "pointer", width: "100%" }}
            >
              Apply for Income Certificate →
            </button>
          </div>
        </div>

        {/* My Applications Tracker */}
        <div style={{ background: "#ffffff", borderRadius: 12, padding: 24, border: "1px solid #e5e7eb", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
              My MeeSeva Applications & Credentials
            </h2>
            <button
              onClick={loadApplications}
              style={{ background: "none", border: "none", color: "#047857", fontWeight: 600, fontSize: 13, cursor: "pointer" }}
            >
              ↻ Refresh Status
            </button>
          </div>

          {error && <p style={{ color: "#b91c1c", fontSize: 14 }}>{error}</p>}

          {loading ? (
            <p style={{ color: "#6b7280", fontSize: 14 }}>Loading applications from MeeSeva registry...</p>
          ) : applications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#6b7280" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>📭</div>
              <h3 style={{ margin: "0 0 6px 0", color: "#374151" }}>No Applications Submitted Yet</h3>
              <p style={{ margin: "0 0 16px 0", fontSize: 14 }}>You haven't submitted any certificate applications from this wallet address.</p>
              <button
                onClick={() => navigate("/certificate")}
                style={{ background: "#047857", color: "#ffffff", border: "none", borderRadius: 6, padding: "8px 16px", fontWeight: 600, cursor: "pointer" }}
              >
                Start First Application
              </button>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {applications.map((app) => {
                const stageInfo = STAGE_CONFIG[app.stage] || STAGE_CONFIG[1];
                return (
                  <div
                    key={app.applicationId}
                    style={{
                      border: "1px solid #e5e7eb",
                      borderRadius: 10,
                      padding: 20,
                      background: "#fafafa"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12, marginBottom: 14 }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                          <span style={{ fontFamily: "monospace", fontSize: 14, fontWeight: 700, color: "#1e3a8a", background: "#dbeafe", padding: "2px 8px", borderRadius: 4 }}>
                            {app.applicationId}
                          </span>
                          <span style={{ fontSize: 16, fontWeight: 700, color: "#111827" }}>
                            {app.categoryName || "Certificate Application"}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: "#4b5563", marginTop: 4 }}>
                          Applicant: <strong>{app.applicantName}</strong> (S/o, D/o {app.fatherName}) • {app.mandal}, {app.district}
                        </div>
                      </div>

                      <div style={{
                        background: stageInfo.bg,
                        color: stageInfo.color,
                        padding: "6px 12px",
                        borderRadius: 20,
                        fontSize: 12,
                        fontWeight: 700,
                        border: `1px solid ${stageInfo.color}40`
                      }}>
                        {stageInfo.label}
                      </div>
                    </div>

                    {/* Timeline Tracker */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, margin: "14px 0", textAlign: "center" }}>
                      <div style={{ background: app.stage >= 1 ? "#ecfdf5" : "#f3f4f6", border: `1px solid ${app.stage >= 1 ? "#10b981" : "#d1d5db"}`, borderRadius: 6, padding: "8px 4px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: app.stage >= 1 ? "#047857" : "#6b7280" }}>1. VRO INQUIRY</div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>{app.stage >= 2 ? "✓ Verified" : app.stage === 1 ? "In Progress" : "Pending"}</div>
                      </div>
                      <div style={{ background: app.stage >= 2 ? "#ecfdf5" : "#f3f4f6", border: `1px solid ${app.stage >= 2 ? "#10b981" : "#d1d5db"}`, borderRadius: 6, padding: "8px 4px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: app.stage >= 2 ? "#047857" : "#6b7280" }}>2. RI SCRUTINY</div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>{app.stage >= 3 ? "✓ Endorsed" : app.stage === 2 ? "In Progress" : "Pending"}</div>
                      </div>
                      <div style={{ background: app.stage >= 4 ? "#ecfdf5" : "#f3f4f6", border: `1px solid ${app.stage >= 4 ? "#10b981" : "#d1d5db"}`, borderRadius: 6, padding: "8px 4px" }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: app.stage >= 4 ? "#047857" : "#6b7280" }}>3. TAHSILDAR DSC</div>
                        <div style={{ fontSize: 10, color: "#6b7280" }}>{app.stage === 4 ? "✓ Digitally Signed" : "Pending"}</div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTop: "1px solid #e5e7eb", flexWrap: "wrap", gap: 10 }}>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>
                        Submitted on: {new Date(app.createdAt).toLocaleDateString()} • Doc Hash: <span style={{ fontFamily: "monospace" }}>{(app.documentHash || "").slice(0, 10)}...</span>
                      </div>

                      <div style={{ display: "flex", gap: 10 }}>
                        {app.stage === 4 ? (
                          <>
                            <button
                              onClick={() => navigate(`/certificate/${app.applicationId}`)}
                              style={{
                                background: "#047857",
                                color: "#ffffff",
                                border: "none",
                                borderRadius: 6,
                                padding: "6px 14px",
                                fontSize: 13,
                                fontWeight: 700,
                                cursor: "pointer"
                              }}
                            >
                              📄 View & Download Certificate
                            </button>
                            <button
                              onClick={() => navigate(`/verify/${app.applicationId}`)}
                              style={{
                                background: "#ffffff",
                                color: "#374151",
                                border: "1px solid #d1d5db",
                                borderRadius: 6,
                                padding: "6px 12px",
                                fontSize: 13,
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              Scan QR
                            </button>
                          </>
                        ) : (
                          <span style={{ fontSize: 13, color: "#6b7280", fontStyle: "italic" }}>
                            Under official statutory processing
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

