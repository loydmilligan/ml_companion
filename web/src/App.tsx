import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import ChatPage from "./pages/ChatPage";
import HistoryPage from "./pages/HistoryPage";
import AdminPage from "./pages/AdminPage";
import RoundDetailPage from "./pages/RoundDetailPage";
import SettingsPage from "./pages/SettingsPage";
import InvitePage from "./pages/InvitePage";
import NotFound from "./pages/NotFound";
import TopBar from "./components/TopBar";
import SideNav from "./components/SideNav";
import BottomNav from "./components/BottomNav";
import "./App.css";

function AppShell() {
  const { loading, session, group } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-card">Loading Talking Music League...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  if (!group) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <div className="app-shell">
      <TopBar />
      <div className="app-shell-body">
        <SideNav />
        <main className="app-shell-main">
          <Routes>
            <Route index element={<ChatPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="round" element={<Navigate to="/app/chat" replace />} />
            <Route path="round/:id" element={<RoundDetailPage />} />
            <Route path="rounds/:id" element={<RoundDetailPage />} />
            <Route path="leaderboard" element={<Navigate to="/app/history" replace />} />
            <Route path="history" element={<HistoryPage />} />
            <Route path="admin" element={<AdminPage />} />
            <Route path="profile" element={<Navigate to="/app/settings" replace />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function AuthGate() {
  const { loading, session, group } = useAuth();
  const params = new URLSearchParams(window.location.search);
  const inviteParam = params.get("invite");

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-card">Loading Talking Music League...</div>
      </div>
    );
  }

  if (session) {
    if (inviteParam) {
      localStorage.setItem("pending_invite", inviteParam);
    }
    const pendingInvite = inviteParam ?? localStorage.getItem("pending_invite");
    if (pendingInvite) {
      return <Navigate to={`/invite?code=${pendingInvite}`} replace />;
    }
    if (!group) {
      return <Navigate to="/onboarding" replace />;
    }
    return <Navigate to="/app" replace />;
  }

  return <AuthPage />;
}

function OnboardingGate() {
  const { loading, session, group } = useAuth();

  if (loading) {
    return (
      <div className="app-loading">
        <div className="loading-card">Loading Talking Music League...</div>
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/" replace />;
  }

  const pendingInvite = localStorage.getItem("pending_invite");
  if (pendingInvite) {
    return <Navigate to={`/invite?code=${pendingInvite}`} replace />;
  }

    if (group) {
      return <Navigate to="/app/chat" replace />;
    }

  return <OnboardingPage />;
}

export default function App() {
  useEffect(() => {
    const root = document.documentElement;
    const storedTheme = localStorage.getItem("tml_theme") ?? "ocean";
    const storedMode = localStorage.getItem("tml_mode") ?? "light";
    root.dataset.theme = storedTheme;
    root.dataset.mode = storedMode;
  }, []);

  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<AuthGate />} />
        <Route path="/onboarding" element={<OnboardingGate />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/app/*" element={<AppShell />} />
        <Route path="/dashboard" element={<Navigate to="/app/chat" replace />} />
        <Route path="/group-chat" element={<Navigate to="/app/chat" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
