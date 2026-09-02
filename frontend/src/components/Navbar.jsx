import { useNavigate, Link } from "react-router-dom";
import { getSession, signOut } from "../services/wallet";

export default function Navbar() {
  const session = getSession();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate("/");
  }

  const roleColors = {
    admin: "#7c3aed",
    tahsildar: "#b91c1c",
    ri: "#c2410c",
    vro: "#047857",
    beneficiary: "#1d4ed8"
  };

  const roleLabels = {
    admin: "State Admin",
    tahsildar: "Tahsildar / MRO (Issuing Authority)",
    ri: "Revenue Inspector (RI)",
    vro: "Village Revenue Officer (VRO)",
    beneficiary: "Citizen / Applicant"
  };

  const currentRole = (session?.role || "beneficiary").toLowerCase();

  return (
    <header style={{ borderBottom: "2px solid #047857", background: "#ffffff", boxShadow: "0 2px 4px rgba(0,0,0,0.06)" }}>
      {/* Top Govt of Telangana Header Bar */}
      <div style={{ background: "#065f46", color: "#ffffff", padding: "6px 20px", fontSize: 13, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontWeight: 700, letterSpacing: 0.5 }}>GOVERNMENT OF TELANGANA</span>
          <span>•</span>
          <span>MeeSeva 2.0 Blockchain Portal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span>Decentralized Identity & DBT Network</span>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <Link to={session ? "/dashboard" : "/"} style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#047857", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: 20, boxShadow: "0 2px 4px rgba(4,120,87,0.3)" }}>
            TS
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: "#065f46", letterSpacing: -0.5 }}>మీసేవ | MeeSeva</div>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 500 }}>Revenue & Welfare Blockchain Registry</div>
          </div>
        </Link>

        {session && (
          <nav style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
            <Link to="/dashboard" style={{ textDecoration: "none", color: "#374151", fontWeight: 600, fontSize: 14 }}>
              Citizen Dashboard
            </Link>
            <Link to="/certificate" style={{ textDecoration: "none", color: "#374151", fontWeight: 600, fontSize: 14 }}>
              Apply Online
            </Link>
            <Link to="/officer" style={{ textDecoration: "none", color: "#374151", fontWeight: 600, fontSize: 14 }}>
              Officer Portal
            </Link>
            <Link to="/verify" style={{ textDecoration: "none", color: "#374151", fontWeight: 600, fontSize: 14 }}>
              QR Verify
            </Link>
            {currentRole === "admin" && (
              <Link to="/admin" style={{ textDecoration: "none", color: "#7c3aed", fontWeight: 700, fontSize: 14 }}>
                Admin
              </Link>
            )}
          </nav>
        )}

        {session && (
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{
                display: "inline-block",
                background: roleColors[currentRole] || "#1d4ed8",
                color: "#ffffff",
                fontSize: 11,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 12,
                textTransform: "uppercase"
              }}>
                {roleLabels[currentRole] || currentRole}
              </div>
              <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2, fontFamily: "monospace" }}>
                {session.address.slice(0, 6)}...{session.address.slice(-4)}
              </div>
            </div>
            <button
              onClick={handleSignOut}
              style={{
                background: "#f3f4f6",
                color: "#374151",
                border: "1px solid #d1d5db",
                borderRadius: 6,
                padding: "6px 12px",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
