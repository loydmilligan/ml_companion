/**
 * TEST-001: Seed Test Data Edge Function
 *
 * Creates test users in auth.users and populates test data.
 * Uses Supabase Admin API to create auth users.
 *
 * POST /seed-test-data
 * Body: { reset?: boolean } // Reset existing test data first
 *
 * Returns: { success: boolean, users: string[], error?: string }
 */

import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Test user UUIDs (must match test_data.sql)
const TEST_USERS = [
  {
    id: "00000000-0000-0000-0000-000000000001",
    email: "testadmin@test.local",
    displayName: "Test Admin",
  },
  {
    id: "00000000-0000-0000-0000-000000000002",
    email: "alice@test.local",
    displayName: "Alice",
  },
  {
    id: "00000000-0000-0000-0000-000000000003",
    email: "bob@test.local",
    displayName: "Bob",
  },
  {
    id: "00000000-0000-0000-0000-000000000004",
    email: "carol@test.local",
    displayName: "Carol",
  },
  {
    id: "00000000-0000-0000-0000-000000000005",
    email: "dave@test.local",
    displayName: "Uncle Dave",
  },
];

// Test group/league IDs
const TEST_GROUP_ID = "00000000-0000-0000-0001-000000000001";
const TEST_LEAGUE_S1_ID = "00000000-0000-0000-0002-000000000001";
const TEST_LEAGUE_S2_ID = "00000000-0000-0000-0002-000000000002";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Create admin client with service role
  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const body = await req.json().catch(() => ({}));
  const resetFirst = body?.reset === true;

  const results: string[] = [];
  const errors: string[] = [];

  try {
    // Step 1: Reset if requested
    if (resetFirst) {
      results.push("Resetting existing test data...");

      // Delete in reverse order of dependencies
      await supabaseAdmin.from("round_user_activity").delete().eq("round_id", TEST_LEAGUE_S1_ID);
      await supabaseAdmin.from("votes").delete().match({});
      await supabaseAdmin.from("submissions").delete().match({});
      await supabaseAdmin.from("rounds").delete().eq("league_id", TEST_LEAGUE_S1_ID);
      await supabaseAdmin.from("rounds").delete().eq("league_id", TEST_LEAGUE_S2_ID);
      await supabaseAdmin.from("leagues").delete().eq("id", TEST_LEAGUE_S1_ID);
      await supabaseAdmin.from("leagues").delete().eq("id", TEST_LEAGUE_S2_ID);
      await supabaseAdmin.from("player_connections").delete().eq("group_id", TEST_GROUP_ID);
      await supabaseAdmin.from("season_competitors").delete().eq("group_id", TEST_GROUP_ID);
      await supabaseAdmin.from("notification_preferences").delete().in("user_id", TEST_USERS.map(u => u.id));
      await supabaseAdmin.from("group_settings").delete().eq("group_id", TEST_GROUP_ID);
      await supabaseAdmin.from("group_members").delete().eq("group_id", TEST_GROUP_ID);
      await supabaseAdmin.from("family_groups").delete().eq("id", TEST_GROUP_ID);
      await supabaseAdmin.from("profiles").delete().in("id", TEST_USERS.map(u => u.id));

      // Delete auth users
      for (const user of TEST_USERS) {
        await supabaseAdmin.auth.admin.deleteUser(user.id);
      }

      results.push("Reset complete.");
    }

    // Step 2: Create auth users
    results.push("Creating auth users...");
    for (const user of TEST_USERS) {
      const { error } = await supabaseAdmin.auth.admin.createUser({
        id: user.id,
        email: user.email,
        email_confirm: true,
        password: "testpassword123", // Simple password for test users
        user_metadata: {
          display_name: user.displayName,
        },
      });

      if (error) {
        if (error.message.includes("already been registered")) {
          results.push(`User ${user.email} already exists, skipping.`);
        } else {
          errors.push(`Failed to create ${user.email}: ${error.message}`);
        }
      } else {
        results.push(`Created auth user: ${user.email}`);
      }
    }

    // Step 3: Insert profiles
    results.push("Creating profiles...");
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert([
      {
        id: "00000000-0000-0000-0000-000000000001",
        email: "testadmin@test.local",
        display_name: "Test Admin",
        ai_image_traits: "Middle-aged parent figure, warm smile, glasses, graying hair at temples, always wearing cozy sweaters",
        season1_competitor_id: "test-s1-admin",
        music_league_username: "test_admin_ml",
        chat_notify_enabled: true,
        email_notify_enabled: true,
        preferred_music_provider: "spotify",
        show_youtube_video: true,
      },
      {
        id: "00000000-0000-0000-0000-000000000002",
        email: "alice@test.local",
        display_name: "Alice",
        ai_image_traits: "Young adult woman, long curly auburn hair, artistic style, always has headphones around neck",
        season1_competitor_id: "test-s1-alice",
        music_league_username: "alice_test_ml",
        chat_notify_enabled: true,
        email_notify_enabled: true,
        preferred_music_provider: "spotify",
        show_youtube_video: true,
      },
      {
        id: "00000000-0000-0000-0000-000000000003",
        email: "bob@test.local",
        display_name: "Bob",
        ai_image_traits: "College-aged guy, short brown hair, athletic build, wears band t-shirts",
        season1_competitor_id: "test-s1-bob",
        music_league_username: "bob_test_ml",
        chat_notify_enabled: true,
        email_notify_enabled: true,
        preferred_music_provider: "apple_music",
        show_youtube_video: false,
      },
      {
        id: "00000000-0000-0000-0000-000000000004",
        email: "carol@test.local",
        display_name: "Carol",
        ai_image_traits: "Teen girl, bright colored hair, Gen-Z style, always knows the latest music trends",
        season1_competitor_id: "test-s1-carol",
        music_league_username: "carol_test_ml",
        chat_notify_enabled: true,
        email_notify_enabled: true,
        preferred_music_provider: "youtube_music",
        show_youtube_video: true,
      },
      {
        id: "00000000-0000-0000-0000-000000000005",
        email: "dave@test.local",
        display_name: "Uncle Dave",
        ai_image_traits: "Older uncle figure, beard, flannel shirts, vinyl collection visible behind him",
        season1_competitor_id: "test-s1-dave",
        music_league_username: "dave_test_ml",
        chat_notify_enabled: true,
        email_notify_enabled: false,
        preferred_music_provider: "spotify",
        show_youtube_video: true,
      },
    ], { onConflict: "id" });

    if (profileError) {
      errors.push(`Profiles error: ${profileError.message}`);
    } else {
      results.push("Created 5 test profiles.");
    }

    // Step 4: Create family group
    results.push("Creating family group...");
    const { error: groupError } = await supabaseAdmin.from("family_groups").upsert({
      id: TEST_GROUP_ID,
      name: "Test Family",
      owner_id: "00000000-0000-0000-0000-000000000001",
      is_test_group: true,
    }, { onConflict: "id" });

    if (groupError) {
      errors.push(`Family group error: ${groupError.message}`);
    } else {
      results.push("Created test family group.");
    }

    // Step 5: Create group memberships
    results.push("Creating group memberships...");
    const { error: memberError } = await supabaseAdmin.from("group_members").upsert([
      { group_id: TEST_GROUP_ID, member_id: "00000000-0000-0000-0000-000000000001", role: "lead" },
      { group_id: TEST_GROUP_ID, member_id: "00000000-0000-0000-0000-000000000002", role: "member" },
      { group_id: TEST_GROUP_ID, member_id: "00000000-0000-0000-0000-000000000003", role: "member" },
      { group_id: TEST_GROUP_ID, member_id: "00000000-0000-0000-0000-000000000004", role: "member" },
      { group_id: TEST_GROUP_ID, member_id: "00000000-0000-0000-0000-000000000005", role: "member" },
    ], { onConflict: "group_id,member_id" });

    if (memberError) {
      errors.push(`Group members error: ${memberError.message}`);
    } else {
      results.push("Created 5 group memberships.");
    }

    // Step 6: Create leagues
    results.push("Creating leagues...");
    const { error: leagueError } = await supabaseAdmin.from("leagues").upsert([
      { id: TEST_LEAGUE_S1_ID, group_id: TEST_GROUP_ID, name: "Test Family Jam Season 1", season_number: 1 },
      { id: TEST_LEAGUE_S2_ID, group_id: TEST_GROUP_ID, name: "Test Family Jam Season 2", season_number: 2 },
    ], { onConflict: "id" });

    if (leagueError) {
      errors.push(`Leagues error: ${leagueError.message}`);
    } else {
      results.push("Created 2 test leagues (seasons).");
    }

    // Step 7: Create season competitors
    results.push("Creating season competitors...");
    const { error: compError } = await supabaseAdmin.from("season_competitors").upsert([
      { group_id: TEST_GROUP_ID, external_id: "test-s2-admin", name: "Test Admin", profile_id: "00000000-0000-0000-0000-000000000001", ai_image_traits: "Middle-aged parent figure, warm smile, glasses" },
      { group_id: TEST_GROUP_ID, external_id: "test-s2-alice", name: "Alice", profile_id: "00000000-0000-0000-0000-000000000002", ai_image_traits: "Young adult woman, long curly auburn hair" },
      { group_id: TEST_GROUP_ID, external_id: "test-s2-bob", name: "Bob", profile_id: "00000000-0000-0000-0000-000000000003", ai_image_traits: "College-aged guy, short brown hair, athletic" },
      { group_id: TEST_GROUP_ID, external_id: "test-s2-carol", name: "Carol", profile_id: "00000000-0000-0000-0000-000000000004", ai_image_traits: "Teen girl, bright colored hair, Gen-Z style" },
      { group_id: TEST_GROUP_ID, external_id: "test-s2-dave", name: "Uncle Dave", profile_id: "00000000-0000-0000-0000-000000000005", ai_image_traits: "Older uncle figure, beard, flannel shirts" },
    ]);

    if (compError) {
      errors.push(`Season competitors error: ${compError.message}`);
    } else {
      results.push("Created 5 season competitors.");
    }

    // Summary
    const success = errors.length === 0;
    const response = {
      success,
      results,
      errors: errors.length > 0 ? errors : undefined,
      testUsers: TEST_USERS.map(u => ({ id: u.id, email: u.email })),
      testGroupId: TEST_GROUP_ID,
      testLeagues: [
        { id: TEST_LEAGUE_S1_ID, name: "Season 1" },
        { id: TEST_LEAGUE_S2_ID, name: "Season 2" },
      ],
    };

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: success ? 200 : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        results,
        errors,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
