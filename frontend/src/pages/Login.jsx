import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithWallet, signInDemo } from "../services/wallet";

export default function Login() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleMetaMaskLogin() {
    setError(null);
    setLoading(true);
    try {
      await signInWithWallet();
      navigate("/dashboard");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDemoLogin(role) {
    setError(null);
    setLoading(true);
    try {
      const user = await signInDemo(role);
      if (role === "citizen") navigate("/dashboard");
      else if (role === "admin") navigate("/admin");
      else navigate("/officer");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  const demoRoles = [
    {
      id: "citizen",
      title: "Citizen / Applicant",
      dept: "Citizen Service Portal",
      desc: "Apply for Caste/Income certificates, track status, view digitally signed certificates, and claim DBT scholarships.",
      color: "#1d4ed8",
      bg: "#eff6ff"
    },
    {
      id: "vro",
      title: "VRO (Village Revenue Officer)",
      dept: "Stage 1: Field Inquiry",
      desc: "Perform local village inquiries, verify physical records, attach survey inspection remarks, and forward to RI.",
      color: "#047857",
      bg: "#ecfdf5"
    },
    {
      id: "ri",
      title: "RI (Revenue Inspector)",
      dept: "Stage 2: Revenue Scrutiny",
      desc: "Scrutinize VRO inspection reports, cross-reference revenue & land records, and endorse to Tahsildar.",
      color: "#c2410c",
      bg: "#fff7ed"
    },
    {
      id: "tahsildar",
      title: "Tahsildar / MRO",
      dept: "Stage 3: Competent Issuing Authority",
      desc: "Statutory authority who performs final digital signature (DSC), on-chain issuance, and revocation.",
      color: "#b91c1c",
      bg: "#fef2f2"
    },
    {
      id: "admin",
      title: "State Admin",
      dept: "Revenue Department Head",
      desc: "Manage officer roles (VRO/RI/Tahsildar), pause/unpause registry, and oversee system parameters.",
      color: "#7c3aed",
      bg: "#f5f3ff"
    }
  ];

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      {/* Govt Header Banner */}
      <div style={{ background: "#065f46", color: "#ffffff", padding: "16px 24px", textAlign: "center", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
        <div style={{ fontSize: 13, letterSpacing: 1, fontWeight: 700, opacity: 0.9 }}>GOVERNMENT OF TELANGANA</div>
        <h1 style={{ margin: "4px 0 0 0", fontSize: 26, fontWeight: 800, letterSpacing: -0.5 }}>మీసేవ | MeeSeva 2.0 Blockchain Network</h1>
        <p style={{ margin: "6px 0 0 0", fontSize: 14, opacity: 0.85 }}>
          Decentralized 3-Tier Revenue Certificate Issuance & Direct Benefit Transfer (DBT) System
        </p>
      </div>

      <div style={{ maxWidth: 1000, margin: "40px auto", padding: "0 20px" }}>
        {/* Main Connect Card */}
        <div style={{ background: "#ffffff", borderRadius: 12, padding: 32, boxShadow: "0 4px 6px -1px rgba(0,0,0,0.07), 0 2px 4px -1px rgba(0,0,0,0.04)", border: "1px solid #e5e7eb", textAlign: "center", marginBottom: 36 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "#111827", marginTop: 0 }}>
            Connect with MetaMask Wallet
          </h2>
          <p style={{ color: "#4b5563", maxWidth: 600, margin: "0 auto 24px auto", fontSize: 15, lineHeight: 1.5 }}>
            Authenticate using your Ethereum address via cryptographic SIWE (Sign-In with Ethereum). No raw personal data is stored on-chain.
          </p>

          <button
            onClick={handleMetaMaskLogin}
            disabled={loading}
            style={{
              background: "#047857",
              color: "#ffffff",
              border: "none",
              padding: "12px 28px",
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 2px 4px rgba(4,120,87,0.2)",
              transition: "background 0.2s"
            }}
          >
            {loading ? "Connecting..." : "🦊 Connect MetaMask Wallet"}
          </button>

          {error && (
            <div style={{ marginTop: 20, padding: 12, background: "#fee2e2", border: "1px solid #f87171", borderRadius: 6, color: "#b91c1c", fontSize: 14 }}>
              {error}
            </div>
          )}
        </div>

        {/* 1-Click Demo Profiles for Lab Presentations */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: "#111827" }}>
                ⚡ Quick Demo Profiles (1-Click Lab Evaluation)
              </h3>
              <p style={{ margin: "4px 0 0 0", fontSize: 13, color: "#6b7280" }}>
                Instantly switch roles without needing to switch wallets to evaluate the complete statutory workflow:
              </p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            {demoRoles.map((role) => (
              <div
                key={role.id}
                style={{
                  background: role.bg,
                  border: `1px solid ${role.color}30`,
                  borderRadius: 10,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: role.color, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    {role.dept}
                  </div>
                  <h4 style={{ margin: "6px 0 8px 0", fontSize: 17, fontWeight: 700, color: "#111827" }}>
                    {role.title}
                  </h4>
                  <p style={{ fontSize: 13, color: "#4b5563", lineHeight: 1.4, margin: "0 0 16px 0" }}>
                    {role.desc}
                  </p>
                </div>

                <button
                  onClick={() => handleDemoLogin(role.id)}
                  disabled={loading}
                  style={{
                    background: role.color,
                    color: "#ffffff",
                    border: "none",
                    borderRadius: 6,
                    padding: "9px 16px",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: "pointer",
                    width: "100%"
                  }}
                >
                  Enter as {role.title.split(" ")[0]} →
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Public QR Verification Shortcut */}
        <div style={{ textAlign: "center", marginTop: 24, padding: "16px", background: "#f3f4f6", borderRadius: 8 }}>
          <span style={{ fontSize: 14, color: "#4b5563" }}>Third-party verifier, employer, or university? </span>
          <button
            onClick={() => navigate("/verify")}
            style={{
              background: "none",
              border: "none",
              color: "#047857",
              fontWeight: 700,
              cursor: "pointer",
              textDecoration: "underline",
              fontSize: 14
            }}
          >
            Go to Public QR Certificate Verification Portal →
          </button>
        </div>
      </div>
    </div>
  );
}

