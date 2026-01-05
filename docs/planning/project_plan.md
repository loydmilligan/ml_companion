# Project Plan: Music League Family Companion App

This document outlines the high-level project plan for the Music League Family Companion App, detailing foundational components and user story-driven tasks derived from the feature specification.

## 1. Foundational Elements Implementation Plan

### 1.1. User Management & Authentication
* **Design & Database Schema:** Define database tables for `users` (Family Leads), `family_groups`, and `group_members`.
* **Admin Account Creation:** Implement backend logic for email/password registration and login. Integrate OAuth providers (Google, Apple ID) for Family Lead accounts.
* **Family Member Invitation System:** Develop unique invitation link/code generation and validation. Implement invite tracking and expiration.
* **Role-Based Access Control (RBAC):** Define `Family Lead` and `Family Member` roles. Implement authorization checks for actions based on user roles.

### 1.2. Music Service Integration
* **Spotify API Integration:** Register the application with Spotify. Implement OAuth 2.0 for user authorization. Develop API clients for playlist linking, 30-second song preview playback, and launching the Spotify app for full tracks.
* **Apple Music Linking (Optional):** Research Apple Music API for direct song/playlist linking. Implement direct URL schemes for launching Apple Music app.

### 1.3. Music League Data Sync & Aggregation
* **Data Storage Architecture:** Design comprehensive database schema for `leagues`, `rounds`, `themes`, `submissions`, `votes`, `comments`, and `leaderboards`.
* **Manual League Linking Interface:** Develop UI for Family Leads to input Music League IDs, names, and participant details.
* **Data Ingestion Service (Future):** Explore and design mechanisms for automated data retrieval (e.g., Music League API integration or ethical web scraping). Implement data parsing and transformation logic.

### 1.4. Notification System
* **Notification Service Backend:** Design and implement a backend service to manage and trigger in-app and push notifications.
* **In-App Notification UI:** Develop an in-app notification center (feed, badges) to display alerts for new rounds, deadlines, results, and comments.
* **Push Notification Integration:** Integrate with platform-specific push notification services (e.g., Firebase Cloud Messaging, Apple Push Notification Service). Implement user preferences for notification types.

### 1.5. Core AI Architecture
* **NLP Engine Development:** Select and integrate a Natural Language Processing library/service (e.g., OpenAI API, NLTK) for sentiment analysis and topic extraction from user comments.
* **Recommendation System Development:** Design and implement a recommendation engine (e.g., collaborative filtering, content-based) for music discovery and theme generation.
* **Data Analytics Pipeline:** Establish data pipelines for collecting, processing, and analyzing Music League game data and user interaction logs. Implement statistical models for insights generation.

## 2. Key Features & User Stories Implementation Plan

### 2.1. Family/Group Setup & Management
* **US: Create Family Group:**
    * Develop "Create Group" UI flow for Family Leads.
    * Implement backend service to create and associate new family groups with the lead user.
* **US: Invite Family Members:**
    * Develop UI for Family Leads to generate and share unique invitation links/codes.
    * Implement backend logic for invitation link validation and user-to-group association upon acceptance.
* **US: Manage Family Member Access:**
    * Develop "Family Members" management UI for Family Leads (listing members, options to remove).
    * Implement backend service for updating group membership.

### 2.2. Music League Data Sync & Display
* **US: Link Music League:**
    * Develop UI for Family Leads to input Music League identification details.
    * Implement backend service to trigger initial manual data import and link the league to the family group.
* **US: View Current Round Status:**
    * Develop UI component to display real-time information for the active round (theme, submission/voting deadlines, status indicators).
* **US: Browse Past Rounds:**
    * Develop UI for an archive section, allowing users to browse all historical rounds, themes, and submissions.
    * Implement data retrieval from aggregated Music League data storage.

### 2.3. Interactive Discussion & Commenting
* **US: Comment on Submissions (Pre-reveal):**
    * Develop UI for submitting anonymous comments on individual songs during the voting phase.
    * Implement backend logic to store comments and manage their visibility until reveal.
* **US: Engage in Post-Reveal Discussions:**
    * Develop a chat-like UI for threaded comments and replies on songs and overall round outcomes post-reveal.
    * Implement backend services for comment storage, retrieval, and real-time updates.
* **US: Share Reactions with Emojis:**
    * Develop UI for adding and displaying emoji reactions on songs and comments.
    * Implement backend logic to store and aggregate emoji reactions.

### 2.4. Enhanced Results & Insights (AI-powered)
* **US: View Consolidated Leaderboard:**
    * Develop UI to display a family-specific leaderboard (points, 'love' metrics).
    * Implement backend aggregation and calculation of leaderboard statistics.
* **US: Discover Personalized Voting Trends (AI):**
    * Integrate AI recommendation engine to analyze individual voting patterns.
    * Develop UI to present insights like preferred genres or alignment with other family members.
* **US: Analyze Family's Collective Taste (AI):**
    * Utilize AI data analytics to summarize collective family music taste and voting dynamics.
    * Develop UI to display aggregate insights (e.g., most divisive songs, dominant genres).
* **US: Get Round Summaries (AI):**
    * Integrate NLP engine to summarize key discussion points and sentiment from comments for each round.
    * Develop UI to display concise, AI-generated round summaries.

### 2.5. AI-Assisted Theme Generation
* **US: Generate New Theme Ideas (AI):**
    * Integrate AI recommendation engine to generate novel theme suggestions based on family data and music trends.
    * Develop UI for Family Leads to request and view AI-generated themes.
* **US: Refine AI-Suggested Themes:**
    * Develop UI for Family Leads to provide feedback (e.g., upvote/downvote, keywords) on theme suggestions.
    * Implement feedback loop to train and improve the AI theme generation model.

### 2.6. Personalized Family Music Discovery
* **US: Discover Music from Family Members:**
    * Develop UI to browse all submitted songs filtered by individual family members.
    * Implement backend queries to retrieve user-specific submission history.
* **US: Receive AI-Curated Family Playlists:**
    * Integrate AI recommendation engine to curate Spotify/Apple Music playlists based on family preferences.
    * Develop UI for viewing, managing, and synchronizing these playlists with music services.
* **US: See "Loved By" Insights (AI):**
    * Implement AI analysis to identify highly-rated songs and the family members who 'loved' them.
    * Develop UI to display these 'loved by' insights for personal submissions.

### 2.7. In-App Listening & Sharing
* **US: Play Song Previews:**
    * Develop UI controls for initiating and managing 30-second song previews directly within the app, leveraging Spotify/Apple Music integration.
* **US: Open Song in Music Service:**
    * Implement deep linking functionality to launch full songs directly in Spotify or Apple Music from within the app.
* **US: Share Songs Outside the App:**
    * Integrate native sharing functionality to allow users to share links to individual songs or family-curated playlist links externally.

### 2.8. Round Awards & Trophies
* **US: Generate Round Awards:**
    * Define a `round_awards` table to store finalized awards per round.
    * Implement award calculation logic using submissions/votes/relationships data.
    * Persist awards once per round (frozen history).
* **US: Display Round Awards:**
    * Build a cohesive History round recap block with awards, winners, and trophy images.
    * Allow admins to regenerate or override award winners if needed.
* **US: Trophy Asset Pipeline:**
    * Create a dedicated storage bucket for award trophy images.
    * Implement a batch trophy generation script from award prompts.

### 2.9. Round Challenge Bonus Game
* **US: Play Round Challenge:**
    * Display 2 AI-selected songs from past Season 1 rounds.
    * Users guess which Season 1 theme each song belonged to.
    * One guess per song per user (persistent).
    * Show correct/incorrect feedback and score.
* **US: Challenge Persistence:**
    * Store challenge songs in `round_challenges` table per round.
    * Store user guesses in `challenge_guesses` table.
    * Same challenge for all users in a group.
* **US: Previous Round Answers:**
    * After round closes, show previous round's correct answers.
    * Admin can award bonus points via `challenge_bonus_points` table.

### 2.11. Submitter Guess Minigame
* **US: Guess Who Submitted Each Song:**
    * During voting phase, users guess which competitor submitted each song.
    * Dropdown integrated directly into each SongCard for streamlined UX.
    * User's own song detected and excluded (shows "Your song" indicator).
    * Guesses saved to `submitter_guesses` table.
* **US: Score Tracking:**
    * Show progress as X/N guessed (N = total songs minus own song).
    * After reveal, show correct count and leaderboard (top 3 guessers).
* **US: Toggle and Settings:**
    * Admin can enable/disable via `submitter_guess_enabled` in group_settings.
    * Coexists with Round Challenge (different phases).

### 2.12. Submission Comments
* **US: View Submitter Comments:**
    * Each song card displays the submitter's comment with "Submitter's comment:" label.
    * Comments visible during voting and after reveal.
* **US: Comment Required Toggle:**
    * Admin can set `comment_required` per round.
    * Toggle in admin round editing UI.

### 2.10. AI-Powered Peek Panel Features
* **US: Theme Explainer:**
    * AI explains the current theme rules and edge cases.
    * Helps users understand what qualifies.
* **US: Rule Validator:**
    * Users can check if a specific song fits the theme.
    * AI provides yes/no with explanation.
* **US: Hint Generator:**
    * AI provides creative hints for finding songs.
    * Without revealing specific song titles.
* **US: Round Narratives:**
    * Store `narrative` on `rounds` table for AI-generated round stories.
    * Store `narrative` on `leagues` table for season-level recaps.

### 2.13. Push Notifications (FCM)
* **US: Receive Push Notifications:**
    * Users receive push notifications for round events.
    * Firebase Cloud Messaging v1 API integration.
    * PWA support with service worker for background handling.
* **US: Notification Preferences:**
    * Toggle notifications by type: new_round, results_revealed, new_chat, deadline_reminder.
    * Settings page with test button.
    * Admin controls for user notification permissions.
* **US: ntfy.sh Fallback:**
    * Alternative push via ntfy.sh for users who can't use FCM.
    * Subscribe screenshot guide included.

### 2.14. YouTube Integration
* **US: Play Songs In-App:**
    * Collapsible YouTube sidebar player.
    * Play songs directly from song cards via icon button.
    * YouTube playlist URL field for rounds (admin).
* **US: Song Link Management:**
    * Icon buttons for Spotify, YouTube, and quote actions on song cards.
    * Direct playback vs search fallback.

### 2.15. Activity Tracker
* **US: Track Submissions and Votes:**
    * Show who has submitted/voted during round phases.
    * All competitors displayed with urgency-based pill colors.
    * Real-time status updates via email event processing.
* **US: Email Ingestion:**
    * Parse Music League notification emails via n8n → Supabase.
    * Store events in `ml_email_events` table.
    * Track user activity in `round_user_activity` table.

### 2.16. Admin Enhancements
* **US: Email Invite System:**
    * Send invite emails with group join link.
    * Invite URL uses production domain.
* **US: Round Challenge Controls:**
    * Generation button with status indicator.
    * Edit Spotify/YouTube links for challenge songs.
    * Toggle to enable/disable per group.
* **US: Comment Required Toggle:**
    * Require comments on submissions per round.
    * Toggle in admin round editing UI.

## Atomic Tasks List

### Foundational Elements & Backend Implementation
1.  Design database schema for `users`, `family_groups`, and `group_members` tables.
2.  Design database schema for `leagues`, `rounds`, `themes`, `submissions`, `votes`, `comments`, and `leaderboards` tables.
3.  Implement backend service for email/password user registration.
4.  Implement backend service for email/password user login.
5.  Implement backend service for managing user sessions (token generation, validation).
6.  Integrate Google OAuth for Family Lead account creation/login.
7.  Integrate Apple ID OAuth for Family Lead account creation/login.
8.  Implement backend service for creating new family groups.
9.  Implement backend service for associating family groups with Family Lead users.
10. Implement backend service for generating unique invitation links/codes for family members.
11. Implement backend service for validating invitation links/codes.
12. Implement backend service for tracking invitation status (sent, accepted, expired).
13. Implement backend service for managing invitation expiration.
14. Implement backend logic for simplified family member account creation (username-only or linked to ML display name).
15. Implement backend logic for admin to directly add family members without requiring separate login.
16. Implement backend service for updating group membership (e.g., removing a member).
17. Define `Family Lead` role for Role-Based Access Control (RBAC).
18. Define `Family Member` role for Role-Based Access Control (RBAC).
19. Implement authorization checks for actions based on user roles across backend services.
20. Register application with Spotify Developer Program.
21. Implement Spotify OAuth 2.0 authorization flow backend.
22. Develop Spotify API client for playlist linking functionality.
23. Develop Spotify API client for 30-second song preview playback.
24. Develop Spotify API client for deep linking/launching Spotify app for full tracks.
25. Develop Spotify API client for identifying song submissions (if manual input is required).
26. Research Apple Music API capabilities for direct song/playlist linking.
27. Implement direct URL schemes for launching Apple Music app for full tracks.
28. Implement backend service for triggering initial manual Music League data import.
29. Implement backend service for linking a Music League to a family group.
30. Explore Music League API for automated data retrieval feasibility.
31. Design mechanisms for ethical web scraping of Music League data (if API is not feasible).
32. Implement data parsing logic for raw Music League data.
33. Implement data transformation logic to structure Music League data for storage.
34. Implement secure data storage practices, including anonymization where appropriate.
35. Design notification service backend architecture.
36. Implement backend service for managing and triggering in-app notifications.
37. Implement backend service for managing and triggering push notifications.
38. Integrate Firebase Cloud Messaging (FCM) for Android push notifications.
39. Integrate Apple Push Notification Service (APNS) for iOS push notifications.
40. Implement backend logic for storing user notification preferences.
41. Select and integrate a Natural Language Processing (NLP) library/service (e.g., OpenAI API).
42. Develop NLP engine for sentiment analysis of user comments.
43. Develop NLP engine for topic extraction from user comments.
44. Design recommendation engine architecture (e.g., collaborative filtering, content-based).
45. Implement recommendation engine logic for music discovery.
46. Implement recommendation engine logic for AI-assisted theme generation.
47. Establish data pipelines for collecting Music League game data for AI analysis.
48. Establish data pipelines for collecting user interaction logs for AI analysis.
49. Implement processing logic for Music League game data within AI pipelines.
50. Implement processing logic for user interaction logs within AI pipelines.
51. Implement statistical models for generating AI-powered insights.
52. Implement backend service for storing anonymous comments on submissions.
53. Implement backend logic for managing visibility of anonymous comments until reveal.
54. Implement backend service for storing post-reveal threaded comments and replies.
55. Implement backend service for retrieving post-reveal comments and replies.
56. Implement backend service for real-time updates to comments and replies.
57. Implement backend logic for storing emoji reactions on songs and comments.
58. Implement backend logic for aggregating emoji reactions.
59. Implement backend aggregation and calculation logic for family-specific leaderboard statistics.
60. Implement AI recommendation engine integration for personal voting pattern analysis.
61. Implement AI data analytics logic to summarize collective family music taste.
62. Implement AI data analytics logic to summarize collective family voting dynamics.
63. Implement NLP engine integration for generating round summaries from discussions.
64. Implement feedback loop backend logic for training/improving AI theme generation model.
65. Implement backend queries to retrieve user-specific song submission history.
66. Implement AI recommendation engine integration for curating family playlists.
67. Implement AI analysis logic to identify highly-rated songs and contributing family members ("loved by" insights).

### User Interface (UI) Development
68. Define the primary brand color palette, typography, and overall app aesthetic.
69. Implement reusable UI components (e.g., buttons, input fields, navigation elements).
70. Ensure consistent UI layout, spacing, and mobile responsiveness across the app.
71. Design and implement App Logo and Name display on the Welcome screen.
72. Design and implement Contextual Tagline display on the Welcome screen.
73. Develop "Login" tab UI element on the Welcome screen.
74. Develop "Sign Up" tab UI element on the Welcome screen.
75. Implement visual feedback for active tab selection (e.g., highlight, underline).
76. Implement smooth UI transition/animation when switching between "Login" and "Sign Up" tabs.
77. Implement Email Input Field UI (label, text input, styling).
78. Implement Password Input Field UI (label, password type input, styling).
79. Implement password visibility toggle icon within password input fields.
80. Implement real-time password strength indicator UI below the password field (Sign Up only).
81. Implement Confirm Password Input Field UI (label, password type input, visible for Sign Up only).
82. Implement "Forgot Password?" link UI (Login only).
83. Implement navigation from "Forgot Password?" link to a dedicated password reset screen.
84. Implement "Log In" primary action button UI.
85. Implement "Create Account" primary action button UI.
86. Implement UI for displaying inline error messages for form validation (e.g., "Invalid email").
87. Implement "Or continue with" separator UI for social logins.
88. Implement "Continue with Google" social login button UI (integrating Google branding).
89. Implement "Continue with Apple ID" social login button UI (integrating Apple branding).
90. Apply consistent rounded corners to input fields and buttons.
91. Implement visual feedback for input field focus states (eg, border change, subtle shadow).
92. Implement visual feedback and animations for button presses (e.g., slight elevation, scale-down).
93. Develop "Create Group" UI flow for Family Leads (post-authentication).
94. Develop UI for Family Leads to generate invitation links/codes.
95. Develop UI for Family Leads to share invitation links/codes (e.g., native share sheet integration).
96. Develop "Family Members" management UI (displaying a list of current members).
97. Develop "Family Members" management UI (options/buttons to remove members).
98. Develop UI for Family Leads to input Music League identification details (ID, name, participant details).
99. Develop UI component to display the current round's theme.
100. Develop UI component to display the current round's submission deadline.
101. Develop UI component to display the current round's voting deadline.
102. Develop UI component to display current round status indicators (e.g., "Submissions Open", "Voting Live").
103. Develop UI for an archive section to browse all past rounds.
104. Develop UI for submitting anonymous comments on individual songs during the voting phase.
105. Develop chat-like UI for threaded comments on songs and round outcomes (post-reveal).
106. Develop chat-like UI for replying to existing comments (post-reveal).
107. Develop UI for adding emoji reactions on songs.
108. Develop UI for adding emoji reactions on comments.
109. Develop UI for displaying aggregated emoji reactions.
110. Develop UI to display a family-specific leaderboard (showing points).
111. Develop UI to display a family-specific leaderboard (showing 'love' metrics).
112. Develop UI to present personalized voting trend insights (e.g., preferred genres).
113. Develop UI to present personalized voting trend insights (e.g., voting alignment with other members).
114. Develop UI to display aggregate insights on the family's collective music taste (e.g., most divisive songs).
115. Develop UI to display aggregate insights on the family's collective music taste (e.g., dominant genres).
116. Develop UI to display concise, AI-generated round summaries.
117. Develop UI for Family Leads to request new AI-generated theme ideas.
118. Develop UI for Family Leads to view AI-generated theme suggestions.
119. Develop UI for Family Leads to provide feedback (upvote/downvote buttons) on theme suggestions.
120. Develop UI for Family Leads to provide feedback (keyword input) on theme suggestions.
121. Develop UI to browse all submitted songs, filterable by individual family members.
122. Develop UI for viewing AI-curated family Spotify/Apple Music playlists.
123. Develop UI for managing AI-curated family playlists (e.g., rename, delete).
124. Develop UI for synchronizing AI-curated playlists with music services.
125. Develop UI to display "loved by" insights for personal song submissions.
126. Develop UI controls (play/pause button, progress bar) for initiating 30-second song previews.
127. Develop UI controls for managing 30-second song previews (e.g., stop).
128. Implement UI element (e.g., button, tap action) for opening full songs directly in Spotify.
129. Implement UI element (e.g., button, tap action) for opening full songs directly in Apple Music.
130. Integrate native sharing functionality for individual song links from within the app.
131. Integrate native sharing functionality for family-curated playlist links from within the app.
132. Develop in-app notification center UI (a feed of alerts).
133. Develop in-app notification badges UI (e.g., on an icon to indicate new notifications).
134. Develop UI for user preferences to configure specific notification types.
