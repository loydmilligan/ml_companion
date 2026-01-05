import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";

type Profile = {
  id: string;
  email: string | null;
  display_name: string | null;
  avatar_url: string | null;
  season1_competitor_id: string | null;
  music_league_username: string | null;
  ntfy_topic: string | null;
  chat_notify_enabled: boolean | null;
  email_notify_enabled: boolean | null;
  can_toggle_chat_notify: boolean | null;
  can_toggle_email_notify: boolean | null;
  reaction_notify_enabled: boolean | null;
  can_toggle_reaction_notify: boolean | null;
  // Notification type controls
  push_notify_enabled: boolean | null;
  ntfy_notify_enabled: boolean | null;
  can_toggle_push_notify: boolean | null;
  can_toggle_ntfy_notify: boolean | null;
};

type Group = {
  id: string;
  name: string;
  owner_id: string | null;
  role: "lead" | "member";
};

type AuthContextValue = {
  session: Session | null;
  profile: Profile | null;
  group: Group | null;
  loading: boolean;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function ensureProfile(userId: string, email?: string | null) {
  const { data: existing, error } = await supabase
    .from("profiles")
    .select("id,email,display_name,avatar_url,season1_competitor_id,music_league_username,ntfy_topic,chat_notify_enabled,email_notify_enabled,can_toggle_chat_notify,can_toggle_email_notify,reaction_notify_enabled,can_toggle_reaction_notify,push_notify_enabled,ntfy_notify_enabled,can_toggle_push_notify,can_toggle_ntfy_notify")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!existing) {
    const fallbackName = email?.split("@")[0] ?? "family-member";
    const { data, error: insertError } = await supabase
      .from("profiles")
      .insert({ id: userId, email: email ?? null, display_name: fallbackName })
      .select("id,email,display_name,avatar_url,season1_competitor_id,music_league_username,ntfy_topic,chat_notify_enabled,email_notify_enabled,can_toggle_chat_notify,can_toggle_email_notify,reaction_notify_enabled,can_toggle_reaction_notify,push_notify_enabled,ntfy_notify_enabled,can_toggle_push_notify,can_toggle_ntfy_notify")
      .single();

    if (insertError) {
      throw insertError;
    }

    return data;
  }

  return existing;
}

async function fetchGroup(userId: string) {
  const { data, error } = await supabase
    .from("group_members")
    .select("role, family_groups ( id, name, owner_id )")
    .eq("member_id", userId)
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data?.family_groups) {
    const fg = data.family_groups as unknown as { id: string; name: string; owner_id: string | null };
    return {
      ...fg,
      role: (data.role ?? "member") as "lead" | "member",
    };
  }

  const { data: ownedGroup, error: ownedError } = await supabase
    .from("family_groups")
    .select("id,name,owner_id")
    .eq("owner_id", userId)
    .limit(1)
    .maybeSingle();

  if (ownedError) {
    throw ownedError;
  }

  if (!ownedGroup) return null;

  await supabase.from("group_members").insert({
    group_id: ownedGroup.id,
    member_id: userId,
    role: "lead",
  });

  return {
    ...ownedGroup,
    role: "lead" as const,
  };
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const { data: sessionData } = await supabase.auth.getSession();
    const activeSession = sessionData.session ?? null;
    setSession(activeSession);

    if (!activeSession?.user) {
      setProfile(null);
      setGroup(null);
      setLoading(false);
      return;
    }

    try {
      // Run profile and group fetch in parallel for faster loading
      const [profileData, groupData] = await Promise.all([
        ensureProfile(activeSession.user.id, activeSession.user.email),
        fetchGroup(activeSession.user.id),
      ]);
      setProfile(profileData);
      setGroup(groupData);
    } catch (error) {
      console.error("Failed to refresh session context", error);
      setProfile(null);
      setGroup(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();

    const { data } = supabase.auth.onAuthStateChange((_event, sessionState) => {
      setSession(sessionState);
      if (!sessionState?.user) {
        setProfile(null);
        setGroup(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      // Run profile and group fetch in parallel
      Promise.all([
        ensureProfile(sessionState.user.id, sessionState.user.email),
        fetchGroup(sessionState.user.id),
      ])
        .then(([profileData, groupData]) => {
          setProfile(profileData);
          setGroup(groupData);
        })
        .catch((error) => {
          console.error("Failed to sync auth state", error);
        })
        .finally(() => setLoading(false));
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, [refresh]);

  const value = useMemo(
    () => ({
      session,
      profile,
      group,
      loading,
      refresh,
    }),
    [session, profile, group, loading, refresh]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
