import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithWallet } from "../services/wallet";

export default function Login() {
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleConnect() {
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

  return (
    <div style={{ maxWidth: 420, margin: "80px auto", textAlign: "center" }}>
      <h1>Eligibility dApp</h1>
      <p>Connect your wallet to check your eligibility and disbursement status.</p>
      <button onClick={handleConnect} disabled={loading}>
        {loading ? "Connecting..." : "Connect MetaMask"}
      </button>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
    </div>
  );
}
