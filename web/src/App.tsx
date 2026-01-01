import { lazy, Suspense, useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { RoundProvider } from "./contexts/RoundContext";
import { PeekPanelProvider } from "./components/pinned-peek";
import { YouTubeSidebarProvider, YouTubeSidebar } from "./components/youtube-sidebar";
import TopBar from "./components/TopBar";
import BottomNav from "./components/BottomNav";
import "./App.css";

// Lazy load pages for better initial load performance
const AuthPage = lazy(() => import("./pages/AuthPage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));
const ChatPrototype = lazy(() => import("./pages/ChatPrototype"));
const HistoryPage = lazy(() => import("./pages/HistoryPage"));
const AdminPage = lazy(() => import("./pages/AdminPage"));
const RoundDetailPage = lazy(() => import("./pages/RoundDetailPage"));
const SettingsPage = lazy(() => import("./pages/SettingsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const InvitePage = lazy(() => import("./pages/InvitePage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Loading fallback for lazy components
function PageLoader() {
  return (
    <div className="app-loading">
      <div className="loading-card">Loading...</div>
    </div>
  );
}

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
    <RoundProvider>
      <PeekPanelProvider>
        <YouTubeSidebarProvider>
          <div className="app-shell">
            <TopBar />
            <div className="app-shell-body">
              <main className="app-shell-main">
                <Suspense fallback={<PageLoader />}>
                  <Routes>
                    <Route index element={<ChatPage />} />
                    <Route path="chat" element={<ChatPage />} />
                    <Route path="round" element={<Navigate to="/app/chat" replace />} />
                    <Route path="round/:id" element={<RoundDetailPage />} />
                    <Route path="rounds/:id" element={<RoundDetailPage />} />
                    <Route path="leaderboard" element={<Navigate to="/app/history" replace />} />
                    <Route path="history" element={<HistoryPage />} />
                    <Route path="admin" element={<AdminPage />} />
                    <Route path="profile" element={<ProfilePage />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </main>
            </div>
            <BottomNav />
            <YouTubeSidebar />
          </div>
        </YouTubeSidebarProvider>
      </PeekPanelProvider>
    </RoundProvider>
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

    // If user already has a group, clear any pending invite and go to app
    if (group) {
      if (pendingInvite) {
        localStorage.removeItem("pending_invite");
      }
      return <Navigate to="/app" replace />;
    }

    // User has no group - check for pending invite
    if (pendingInvite) {
      return <Navigate to={`/invite?code=${pendingInvite}`} replace />;
    }

    return <Navigate to="/onboarding" replace />;
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<AuthGate />} />
          <Route path="/onboarding" element={<OnboardingGate />} />
          <Route path="/invite" element={<InvitePage />} />
          <Route path="/prototype" element={<ChatPrototype />} />
          <Route path="/app/*" element={<AppShell />} />
          <Route path="/dashboard" element={<Navigate to="/app/chat" replace />} />
          <Route path="/group-chat" element={<Navigate to="/app/chat" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AuthProvider>
  );
}
