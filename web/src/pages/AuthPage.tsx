import type React from "react";
import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import Button from "../components/Button";
import Card from "../components/Card";
import Field from "../components/Field";

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return "Weak";
  if (score === 2) return "Good";
  return "Strong";
}

export default function AuthPage() {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strengthLabel = useMemo(() => passwordStrength(password), [password]);

  const toggleMode = (nextMode: "login" | "signup") => {
    setMode(nextMode);
    setError(null);
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
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unable to authenticate.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setError(null);
    const params = new URLSearchParams(window.location.search);
    const invite = params.get("invite");
    const redirectTo = invite ? `${window.location.origin}/invite?code=${invite}` : window.location.origin;
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo },
    });
    if (authError) {
      setError(authError.message);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-hero">
        <div className="auth-hero-badge">Talking Music League</div>
        <h1>Bring your family league to life.</h1>
        <p>Follow the round, track the moments, and keep the conversation in one place.</p>
        <div className="auth-hero-panels">
          <Card tone="glass">
            <h3>Discuss the current round</h3>
            <p>Track submissions, voting moments, and keep the live conversation going.</p>
          </Card>
          <Card tone="glass">
            <h3>Revisit past seasons</h3>
            <p>Explore old themes, playlists, and surprising trends worth a second listen.</p>
          </Card>
        </div>
      </div>

      <Card className="auth-card">
        <div className="auth-tabs">
          <button
            className={mode === "login" ? "auth-tab active" : "auth-tab"}
            type="button"
            onClick={() => toggleMode("login")}
          >
            Login
          </button>
          <button
            className={mode === "signup" ? "auth-tab active" : "auth-tab"}
            type="button"
            onClick={() => toggleMode("signup")}
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
            helperText={mode === "signup" ? `Strength: ${strengthLabel}` : undefined}
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
          {mode === "login" ? (
            <button className="auth-link" type="button">
              Forgot password?
            </button>
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
      </Card>
    </div>
  );
}
