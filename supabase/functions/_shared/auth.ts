import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export type AuthResult = {
  user: { id: string; email: string } | null;
  error: string | null;
};

/**
 * Verifies the JWT token from the Authorization header.
 * Returns the authenticated user or an error message.
 */
export async function verifyAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, error: "Missing or invalid Authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");

  if (!supabaseUrl || !supabaseAnonKey) {
    return { user: null, error: "Server configuration error" };
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, error: error?.message || "Invalid token" };
  }

  return { user: { id: user.id, email: user.email || "" }, error: null };
}

/**
 * Returns a 401 Unauthorized response with the given message.
 */
export function unauthorizedResponse(message: string, corsHeaders: Record<string, string>): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
