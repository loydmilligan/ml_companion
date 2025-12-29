import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Card from "../components/Card";
import Button from "../components/Button";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

export default function InvitePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { session, group, refresh } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const code = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get("code") ?? localStorage.getItem("pending_invite") ?? "";
  }, [location.search]);

  useEffect(() => {
    if (code) {
      localStorage.setItem("pending_invite", code);
    }
  }, [code]);

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
    navigate("/app", { replace: true });
  };

  return (
    <div className="page">
      <Card>
        <h1>Join the family league</h1>
        {!code ? <p className="muted">Ask for an invite link to continue.</p> : null}

        {group ? (
          <p className="muted">You are already in a family group. Ask the admin to update your access.</p>
        ) : null}

        {!session ? (
          <>
            <p className="muted">Log in or create an account to accept your invite.</p>
            <Link className="text-link" to={`/?invite=${code}`}>
              Go to login
            </Link>
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
    </div>
  );
}
