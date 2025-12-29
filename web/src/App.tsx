import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import AuthPage from "./pages/AuthPage";
import OnboardingPage from "./pages/OnboardingPage";
import DashboardPage from "./pages/DashboardPage";
import LeaderboardPage from "./pages/LeaderboardPage";
import RoundDetailPage from "./pages/RoundDetailPage";
import ProfilePage from "./pages/ProfilePage";
import SettingsPage from "./pages/SettingsPage";
import InvitePage from "./pages/InvitePage";
import ChatPage from "./pages/ChatPage";
import NotFound from "./pages/NotFound";
import TopBar from "./components/TopBar";
import SideNav from "./components/SideNav";
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
            <Route index element={<DashboardPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="rounds/:id" element={<RoundDetailPage />} />
            <Route path="leaderboard" element={<LeaderboardPage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
      </div>
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
    return <Navigate to="/app" replace />;
  }

  return <OnboardingPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<AuthGate />} />
        <Route path="/onboarding" element={<OnboardingGate />} />
        <Route path="/invite" element={<InvitePage />} />
        <Route path="/app/*" element={<AppShell />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AuthProvider>
  );
}
