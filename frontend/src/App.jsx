import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CertificateApplication from "./pages/CertificateApplication";
import OfficerPortal from "./pages/OfficerPortal";
import CertificateView from "./pages/CertificateView";
import PublicVerify from "./pages/PublicVerify";
import AdminPanel from "./pages/AdminPanel";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/certificate" element={<CertificateApplication />} />
        <Route path="/officer" element={<OfficerPortal />} />
        <Route path="/certificate/:appId" element={<CertificateView />} />
        <Route path="/verify" element={<PublicVerify />} />
        <Route path="/verify/:appId" element={<PublicVerify />} />
        <Route path="/admin" element={<AdminPanel />} />
      </Routes>
    </BrowserRouter>
  );
}

