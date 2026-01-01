import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import Field from "../components/Field";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function InvitePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, group, refresh } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const code = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("code") ?? localStorage.getItem("pending_invite") ?? "";
  }, [location.search]);

  useEffect(() => {
    if (code) {
      localStorage.setItem("pending_invite", code);
    }
  }, [code]);

  // If user already has a group, clear invite and redirect to app
  useEffect(() => {
    if (session && group) {
      localStorage.removeItem("pending_invite");
      navigate("/app/chat", { replace: true });
    }
  }, [session, group, navigate]);

  const acceptInvite = async () => {
    if (!code) {
      setError("Missing invite code.");
      return;
    }

    setLoading(true);
    setError(null);

    const { error: rpcError } = await supabase.rpc("accept_invite", { p_code: code });

    if (rpcError) {
      setError(rpcError.message);
      setLoading(false);
      return;
    }

    localStorage.removeItem("pending_invite");
    setStatus("Invite accepted. Redirecting...");
    await refresh();
    navigate("/app/chat", { replace: true });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!email || !password) {
      setError("Please enter an email and password.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
      }
      setModalOpen(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to authenticate.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    const redirectTo = `${window.location.origin}/invite?code=${code}`;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (authError) {
      setError(authError.message);
    }
  };

  return (
    <div className="page">
      <Card className="invite-card">
        <h1>Join the family league</h1>
        {!code ? <p className="muted">Ask for an invite link to continue.</p> : null}

        {group ? (
          <p className="muted">You are already in a family group. Ask the admin to update your access.</p>
        ) : null}

        {!session ? (
          <>
            <p className="muted">Log in or register to accept your invite.</p>
            <div className="invite-actions">
              <Button
                type="button"
                onClick={() => {
                  setMode("login");
                  setModalOpen(true);
                }}
              >
                Log In
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => {
                  setMode("signup");
                  setModalOpen(true);
                }}
              >
                Register
              </Button>
            </div>
          </>
        ) : null}

        {session && !group ? (
          <Button type="button" onClick={acceptInvite} disabled={loading || !code}>
            {loading ? "Accepting..." : "Accept Invite"}
          </Button>
        ) : null}

        {status ? <p className="muted">{status}</p> : null}
        {error ? <div className="auth-error">{error}</div> : null}
      </Card>

      {modalOpen ? (
        <div className="modal-backdrop" role="presentation" onClick={() => setModalOpen(false)}>
          <div className="modal-card" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <div className="auth-tabs">
              <button
                className={mode === "login" ? "auth-tab active" : "auth-tab"}
                type="button"
                onClick={() => setMode("login")}
              >
                Login
              </button>
              <button
                className={mode === "signup" ? "auth-tab active" : "auth-tab"}
                type="button"
                onClick={() => setMode("signup")}
              >
                Sign Up
              </button>
            </div>
            <form className={mode === "signup" ? "auth-form shift" : "auth-form"} onSubmit={handleSubmit}>
              <Field
                label="Email Address"
                type="email"
                placeholder="family@music.com"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Field
                label={mode === "login" ? "Password" : "Create Password"}
                type="password"
                placeholder="Enter your password"
                autoComplete={mode === "login" ? "current-password" : "new-password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              {mode === "signup" ? (
                <Field
                  label="Confirm Password"
                  type="password"
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              ) : null}
              {error ? <div className="auth-error">{error}</div> : null}
              <Button className="auth-submit" type="submit" disabled={loading}>
                {loading ? "Working..." : mode === "login" ? "Log In" : "Create Account"}
              </Button>
            </form>
            <div className="auth-divider">
              <span>{mode === "signup" ? "Register with" : "Or continue with"}</span>
            </div>
            <div className="auth-social">
              <Button type="button" variant="secondary" onClick={() => handleOAuth("google")}>
                {mode === "signup" ? "Register with Google" : "Continue with Google"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => handleOAuth("apple")}>
                {mode === "signup" ? "Register with Apple ID" : "Continue with Apple ID"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
