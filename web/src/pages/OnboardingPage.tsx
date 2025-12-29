import type React from "react";
import { useEffect, useState } from "react";
import Papa from "papaparse";
import Button from "../components/Button";
import Card from "../components/Card";
import Field from "../components/Field";
import { supabase } from "../lib/supabase";
import { useAuth } from "../contexts/AuthContext";

type CompetitorRow = {
  ID: string;
  Name: string;
};

export default function OnboardingPage() {
  const { profile, refresh } = useAuth();
  const [groupName, setGroupName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [competitors, setCompetitors] = useState<CompetitorRow[]>([]);
  const [seasonSelection, setSeasonSelection] = useState("");

  useEffect(() => {
    const loadCompetitors = async () => {
      const response = await fetch("/data/competitors.csv");
      const text = await response.text();
      const parsed = Papa.parse<CompetitorRow>(text, { header: true, skipEmptyLines: true });
      setCompetitors(parsed.data);
    };

    loadCompetitors().catch(() => undefined);
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!groupName.trim()) {
      setError("Please enter a family group name.");
      return;
    }

    if (!profile) {
      setError("Your profile is still loading. Please try again in a moment.");
      return;
    }

    setLoading(true);

    try {
      const { data: group, error: groupError } = await supabase
        .from("family_groups")
        .insert({ name: groupName.trim(), owner_id: profile.id })
        .select("id,name,owner_id")
        .single();

      if (groupError) throw groupError;

      const { error: memberError } = await supabase.from("group_members").insert({
        group_id: group.id,
        member_id: profile.id,
        role: "lead",
      });

      if (memberError) throw memberError;

      if (seasonSelection) {
        const { error: updateError } = await supabase
          .from("profiles")
          .update({ season1_competitor_id: seasonSelection })
          .eq("id", profile.id);

        if (updateError) throw updateError;
      }

      await refresh();
    } catch (err) {
      const message =
        typeof err === "object" && err !== null && "message" in err
          ? String((err as { message: string }).message)
          : "Unable to create group.";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="onboarding-page">
      <Card className="onboarding-card">
        <h1>Create your family hub</h1>
        <p>
          This space keeps everything in one place: your rounds, voting moments, and family
          discussions. Give your group a name to get started.
        </p>
        <form className="onboarding-form" onSubmit={handleSubmit}>
          <Field
            label="Family Group Name"
            placeholder="The Mariani League"
            value={groupName}
            onChange={(event) => setGroupName(event.target.value)}
          />
          <label className="field">
            <span className="field-label">Season 1 account (optional)</span>
            <select
              className="field-input"
              value={seasonSelection}
              onChange={(event) => setSeasonSelection(event.target.value)}
            >
              <option value="">Skip for now</option>
              {competitors.map((competitor) => (
                <option key={competitor.ID} value={competitor.ID}>
                  {competitor.Name}
                </option>
              ))}
            </select>
          </label>
          {error ? <div className="auth-error">{error}</div> : null}
          <Button type="submit" disabled={loading}>
            {loading ? "Creating..." : "Create Group"}
          </Button>
        </form>
      </Card>
      <div className="onboarding-aside">
        <Card tone="navy">
          <h3>What happens next</h3>
          <ol>
            <li>Link your league and add the current round.</li>
            <li>Invite family members with a single link.</li>
            <li>Track progress and discussions from the dashboard.</li>
          </ol>
        </Card>
      </div>
    </div>
  );
}
