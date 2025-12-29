import os
import zipfile

# Content definitions
readme_content = """# Music League Family Companion App - Documentation

This directory contains the foundational documentation for the Music League Family Companion App.

## Files

* `docs/overview/initial_discussion.md`: Context and initial scoping of the user's intent.
* `docs/overview/research_and_ideation.md`: Analysis of Music League, competitors, and similar collaborative music apps.
* `docs/requirements/feature_specification.md`: Detailed requirements and user stories.
* `docs/planning/project_plan.md`: Technical roadmap, database schema planning, and atomic task breakdown.
* `docs/design/ui_specification.md`: Visual design guidelines, screen layouts, and user flows.
* `docs/workflow/implementation_workflow.md`: The iterative process for AI-assisted development.

## Usage

These documents are intended to be consumed by an AI coding assistant or a development team to build the application. Start with the **Project Plan** for a high-level overview of the work required.

---
*Generated for the Music League Family Companion App project.*
"""

initial_discussion_content = """# Initial App Idea Discussion and Clarification

That's a great idea for enhancing the Music League experience with your family! A companion app sounds like it could really centralize the discussion and results.

To begin, could you tell me a bit more about how you envision users interacting with this app? For instance, will everyone in your family need to create an account, or will there be a single admin who manages the content and invites others?
"""

research_content = """# Deep Dive Research and Ideation

## Music League Summary
Music League is an app that transforms music discovery and playlist curation into a gamified, community-driven experience. It allows users to share their favorite music, discover new artists, and compete with friends, family, or coworkers based on their musical taste.

### Key Features and How It Works:
* **Leagues and Rounds:** The core of Music League revolves around "leagues," which are made up of multiple "rounds." Each round has a unique musical "theme". Themes can be pre-suggested (e.g., "Best cover song," "Instrumentals," "Deep Cuts") or customized by the league creator (e.g., "Songs for a Cold, Rainy Day," "Music that Embodies an Ocean Wave").
* **Song Submission:** Players are notified when a round opens and then submit a song that they believe best fits the given theme. Songs can be submitted by searching directly within the app or by copying and pasting a link from Spotify.
* **Spotify Integration:** A Spotify account (free or paid) is required to use Music League, as the app links with Spotify for playlist generation and listening.
* **Anonymous Playlists:** Once all songs are submitted for a round, the app automatically generates an anonymous, shuffled Spotify playlist containing all the submitted tracks. This ensures unbiased listening and voting.
* **Listening, Voting, and Commenting:** League members listen to the curated playlist and then return to the app to vote for their favorite songs or the ones they feel best fit the theme. Players can also leave comments on individual songs during the voting process.
* **Results and Reveals:** After the voting deadline, the submission identities, finalized song rankings, and all comments are revealed to the league members. This allows players to see who submitted which song, how each song was rated, and read the comments.
* **Points and Leaderboard:** Points are awarded based on voting, accumulating throughout the rounds. A champion is crowned for each individual round, and an overall champion is named at the conclusion of the entire league. The app also tracks who has shown the most "love" for a player's songs, and who hasn't.
* **Music Discovery and Community:** Beyond the competition, a primary feature of Music League is fostering music discovery by exposing players to new songs and artists curated by their friends, and creating a community around shared musical interests. The app takes the algorithm out of music discovery and gives it back to the listeners, making playlist building a social activity.
* **Customization:** When creating a league, players can set parameters such as the number of songs each player submits per round and how votes (including downvotes) can be used. The app is also continuously evolving with new features being added regularly.

## Collaborative Apps Summary
For families looking to share music, create collaborative playlists, and engage in discussions about their favorite tunes, several apps offer features to enhance these shared musical experiences.

### Apps with Collaborative Playlists and Social Features:
* **Spotify and Apple Music:** Popular choices that allow users to create collaborative playlists where multiple family members can add songs. Apple Music also offers "Family Sharing" for subscriptions, enabling up to five family members to access shared content. Spotify's "Group Session" feature, available to Premium members, allows real-time synchronized listening and collaborative playlist creation among participants.
* **bopdrop:** Provides an Instagram-like experience for music, with a strong emphasis on messaging that facilitates sending songs to one another and engaging in conversations about music.
* **Groic:** A free app that enables real-time music and radio listening with friends, coupled with a chat feature for discussions. Users can also create and share their own music collections.
* **MU (also known as MUBR):** Allows users to see what their friends are listening to in real-time, fostering an interactive music-sharing environment. It includes features for tagging friends, which aids in discovering new music based on shared tastes.
* **Humit:** An app designed for music discovery and sharing, acting as a social platform where users can connect over similar musical interests. It allows sharing of 30-second song previews and can automatically curate Spotify playlists.
* **Airbuds:** Simplifies the process of sharing playlists and tracks and includes built-in social sharing options to connect with others based on mutual musical preferences.

These applications provide various ways for families to connect through music, whether it's by co-creating playlists, listening together in real-time, or discussing new discoveries.

## Alternatives Summary
For family groups seeking alternatives to Music League for interactive music sharing and discovery, several options offer collaborative playlist creation, voting mechanisms, and engaging music-related games. While direct replicas of Music League's themed submission and competitive voting structure are limited, these alternatives provide similar social music experiences.

### 1. Collaborative Playlist Apps with Voting:
These applications allow multiple users to contribute to a shared playlist and often include a voting feature to influence the playback order, fostering a democratic music experience.
* **Lisyn: Collaborative Playlist:** This app allows a host to create a "Shared Room" where guests can connect via Bluetooth, add songs to a queue from Apple Music, and vote songs up or down to determine the order. Only the host requires an Apple Music subscription, making it accessible for family members without individual subscriptions.
* **Partyfy:** Designed for Spotify users, Partyfy enables friends and family to collectively add tracks to a shared playlist and vote for the next song to play. The playlist updates in real-time, and the app is free and ad-free.
* **YouTube Collaborative Playlists with Voting:** YouTube has introduced a voting system for collaborative playlists, allowing signed-in users to upvote or downvote videos, influencing their order. This can turn playlist creation into a dynamic, community-driven activity for families.

### 2. Music-Themed Games for Interaction and Discovery:
These games encourage music engagement and can be adapted for family fun, often prompting discussion and sharing of musical tastes without a dedicated app for submission and voting.
* **Song Saga:** This is a conversation card game designed for music lovers that encourages players to share songs and the stories behind them, transforming social gatherings into a trip down memory lane. It can be played with any music app.
* **Name That Tune / Finish the Lyrics / Musical Trivia:** These classic games can be easily adapted for family groups, either virtually or in person. Families can create their own trivia questions, play snippets of songs, or challenge each other to complete lyrics, using platforms like YouTube for music playback.
* **Freeze Dance / Musical Chairs / Musical Bingo:** These traditional music games are excellent for getting everyone moving and interacting with music. Musical Bingo, for example, can help identify instrument sounds and teach about different musical elements.

### 3. Older Apps with Similar Concepts:
* **Boombox Music League:** An app that previously offered a similar concept to Music League, allowing users to create music league competitions with themed rounds where participants submit songs and vote on them to determine a winner. It integrated with Spotify to create playlists of submitted songs. While the current status and support for this specific app may vary, it highlights a previously existing option with a similar format.

While Music League itself offers a distinct experience of competitive, themed music discovery and voting, the alternatives listed above provide engaging ways for families to share, discover, and interact with music together, catering to different preferences for structure, platform integration, and gameplay.
"""

feature_spec_content = """# Feature Specification Document: Music League Family Companion App

## 1. Introduction
The Music League Family Companion App aims to enrich the Music League experience for families by providing a centralized platform for discussion, streamlined access to results, and AI-powered insights. This application will serve as a hub for family members participating in Music League, fostering deeper engagement, facilitating music discovery, and simplifying interaction within their private league environment.

* **Target Audience:** Families or close-knit groups participating in Music League, seeking a more integrated and insightful way to engage with the game and each other.
* **Core Value Proposition:** To centralize discussions and results, provide personalized insights, and enhance the shared music discovery experience for families playing Music League, moving beyond the core game mechanics to a richer social and analytical layer.

## 2. Foundational Elements
This section outlines the core technical and architectural components required for the application's functionality.

### 2.1. User Management & Authentication
The application will adopt a "Family Lead" or "Admin" model, allowing one designated family member to manage the family's Music League interactions within the app.
* **Admin Account:** A single user (the "Family Lead") will create an account via email/password or third-party authentication (e.g., Google, Apple ID). This account will be responsible for linking the app to existing Music League instances.
* **Family Member Invitations:** The Family Lead can invite other family members to join their private app group via a unique link or code. Invited members will create simplified accounts (e.g., username only, or linked to their existing Music League display name) or be directly added by the admin without separate login, depending on desired privacy levels for comments.
* **Permissions:** The Family Lead will have full administrative control (e.g., managing invitations, configuring league sync). Other family members will have participation-level access (e.g., viewing results, commenting, accessing insights).

### 2.2. Music Service Integration
Leveraging existing music services is crucial for playback and song identification.
* **Spotify Integration:** As Music League primarily operates with Spotify, the app will integrate with Spotify for:
    * Direct linking to Music League generated playlists.
    * Playing song previews within the app (if applicable) or launching the Spotify app.
    * Potentially, identifying song submissions if manual input is required.
* **Optional Apple Music Integration:** To broaden accessibility, the app may offer direct links or playback options for Apple Music users where possible, similar to "Lisyn: Collaborative Playlist" functionality.

### 2.3. Music League Data Sync & Aggregation
The app's core functionality relies on obtaining and structuring data from Music League.
* **Manual League Linking (Initial Phase):** The Family Lead will manually input Music League IDs or specific league details (e.g., league name, round themes, participant names) to link to the companion app.
* **Automated Data Retrieval (Future Enhancement):** Explore potential for API integration with Music League (if available) or scraping mechanisms to automatically pull league data (rounds, themes, submissions, votes, comments, leaderboard) into the companion app, similar to "Boombox Music League."
* **Data Storage:** Securely store aggregated Music League data (anonymized where appropriate) to enable historical tracking, analysis, and custom displays.

### 2.4. Notification System
Robust notification capabilities to keep family members engaged and informed.
* **In-App Notifications:** Alerts for new rounds, voting deadlines, results reveals, new comments.
* **Push Notifications:** Configurable push notifications for key league events, ensuring family members don't miss important updates.

### 2.5. Core AI Architecture
The application will incorporate AI capabilities for analysis, personalization, and content generation.
* **Natural Language Processing (NLP):** For analyzing user comments, identifying themes, and generating summaries.
* **Recommendation Engines:** For personalized music discovery and theme suggestions based on family preferences.
* **Data Analytics:** To process Music League results and user interactions, generating insights and patterns.

## 3. Key Features & User Stories
This section details the primary functionalities of the app, presented with user stories to illustrate user interaction and value.

### 3.1. Family/Group Setup & Management
This feature enables the Family Lead to create and manage their family group within the companion app.
* **User Story: Create Family Group:** As a Music League enthusiast, I want to create a private group for my family in the companion app so that we can centralize our Music League discussions and results in one place.
* **User Story: Invite Family Members:** As the Family Lead, I want to invite specific family members to our private group using a unique link or code so that only approved individuals can access our shared content.
* **User Story: Manage Family Member Access:** As the Family Lead, I want to view a list of all family members in our group and remove anyone no longer participating so that our group remains exclusive and relevant.

### 3.2. Music League Data Sync & Display
This feature allows family members to view league progress and results within the companion app.
* **User Story: Link Music League:** As the Family Lead, I want to easily link our family's active Music League to the companion app so that all relevant league data (themes, submissions, results) is automatically aggregated.
* **User Story: View Current Round Status:** As a family member, I want to see the current round's theme, submission deadline, and voting status at a glance so I know exactly where we are in the league.
* **User Story: Browse Past Rounds:** As a family member, I want to access an archive of all past rounds, themes, and submissions so I can revisit previous discussions and discover old favorites.

### 3.3. Interactive Discussion & Commenting
This feature provides a dedicated space for family members to discuss songs and league events. Inspired by social features in bopdrop, Groic, and Humit.
* **User Story: Comment on Submissions (Pre-reveal):** As a family member, during the voting phase, I want to leave anonymous comments on individual songs (similar to Music League's in-app feature) so I can express my thoughts before the identities are revealed.
* **User Story: Engage in Post-Reveal Discussions:** As a family member, after results are revealed, I want to comment on specific songs or the round's overall outcome, or reply to existing comments, so we can openly discuss our choices and opinions, similar to a chat feature.
* **User Story: Share Reactions with Emojis:** As a family member, I want to react to songs and comments with emojis so I can express quick, informal feedback without typing.

### 3.4. Enhanced Results & Insights (AI-powered)
Leveraging AI to provide deeper understanding and personalization of league results.
* **User Story: View Consolidated Leaderboard:** As a family member, I want to see a clear, consolidated leaderboard of our family's performance across all rounds, including points and 'love' received/given, so I can track our friendly competition.
* **User Story: Discover Personalized Voting Trends (AI):** As a family member, I want to see AI-generated insights into my personal voting patterns (e.g., "You consistently upvote indie rock," "You often agree with [Family Member's Name]"), so I can understand my own musical biases and connections.
* **User Story: Analyze Family's Collective Taste (AI):** As a family member, I want to view AI-summarized insights on our family's collective musical taste (e.g., "This round's most divisive song was X," "Our family shows a strong preference for 80s pop"), so we can learn more about each other's preferences.
* **User Story: Get Round Summaries (AI):** Integrate NLP engine to summarize key discussion points and sentiment from comments for each round. Develop UI to display concise, AI-generated round summaries.

### 3.5. AI-Assisted Theme Generation
This feature helps the Family Lead propose new and engaging themes for future Music League rounds.
* **User Story: Generate New Theme Ideas (AI):** As the Family Lead, I want the AI to suggest novel and creative themes for upcoming Music League rounds, drawing inspiration from our family's past submissions, voting patterns, and popular music trends, so we never run out of fresh ideas.
* **User Story: Refine AI-Suggested Themes:** As the Family Lead, I want to provide feedback on AI-suggested themes (e.g., "too broad," "too niche") or add keywords so the AI can learn and generate more tailored suggestions over time.

### 3.6. Personalized Family Music Discovery
Leveraging the collective tastes and game data to facilitate new music discovery within the family context.
* **User Story: Discover Music from Family Members:** As a family member, I want to easily browse all songs submitted by a specific family member across all rounds so I can discover more music aligned with their taste.
* **User Story: Receive AI-Curated Family Playlists:** As a family member, I want the app to generate AI-curated Spotify (or Apple Music) playlists based on the songs our family collectively enjoyed most or those that fit specific themes, making shared listening easier, similar to Spotify's collaborative playlists or Humit's auto-curation.
* **User Story: See "Loved By" Insights (AI):** Implement AI analysis to identify highly-rated songs and the family members who 'loved' them. Develop UI to display these 'loved by' insights for personal submissions.

### 3.7. In-App Listening & Sharing
Facilitating direct access to music content.
* **User Story: Play Song Previews:** As a family member, I want to play 30-second previews of submitted songs directly within the app (similar to Humit) so I can quickly refresh my memory or check out a new track without leaving the app.
* **User Story: Open Song in Music Service:** Implement deep linking functionality to launch full songs directly in Spotify or Apple Music from within the app.
* **User Story: Share Songs Outside the App:** Integrate native sharing functionality to allow users to share links to individual songs or family-curated playlist links externally.
"""

project_plan_content = """# Project Plan: Music League Family Companion App

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
"""

ui_spec_content = """# UI Specification: Music League Family Companion App

## 1. Welcome & Authentication Screen (Family Lead Entry)
**Purpose:** This screen serves as the initial entry point for the Family Lead to either log in to an existing account or create a new one. It prioritizes clarity and a streamlined experience to facilitate quick access or account setup, establishing the user's role as a Family Lead from the start.

### Key Elements & Interaction:

#### Header:
* **App Logo & Name:** Centered at the top of the screen (e.g., "Harmony Hub" with a stylized music note or family icon).
* **Contextual Tagline:** "Your family's league, connected." (Small, beneath the app name).

#### Authentication Tabs/Toggle:
* A prominent, horizontally aligned tab selector with "Login" and "Sign Up" options. Tapping a tab should smoothly transition the form fields below without a full page reload or interrupting elements. "Login" is active by default.
* **Visuals:** Tabs will have distinct background colors or an active indicator (e.g., an underline, highlight) to show the selected state.

#### Form Area (Dynamic based on selected tab):
* **Email Input Field:** Label "Email Address". Standard text input.
* **Password Input Field:** Label "Password" (Login) / "Create Password" (Sign Up). Password type input with a visible/hide toggle icon. For "Sign Up", a real-time password strength indicator (e.g., "Weak," "Good," "Strong") will appear below the field.
* **Confirm Password Input Field (Sign Up only):** Label "Confirm Password". Password type input, only visible when "Sign Up" tab is active.
* **"Forgot Password?" Link (Login only):** Small text link, right-aligned below the password field. Tapping this navigates to a dedicated password reset screen.
* **Primary Call to Action Button:** "Log In" (Login) / "Create Account" (Sign Up). Full-width button below the form fields.

#### Social Login Section:
* **Separator:** Horizontal line with text "Or continue with".
* **Social Login Buttons:** Prominent buttons for "Continue with Google" and "Continue with Apple ID". These will use the respective service's official branding (icons, limited color integration) but align with the app's button style for consistency.

### Visual Communication:
* **Layout:** Clean, minimalist, centered layout with ample whitespace to reduce cognitive load. The form fields and buttons should be easily thumb-reachable on mobile devices.
* **Typography:** A modern, legible sans-serif font family. Headings and primary call-to-actions use a bolder weight, while input labels and descriptive text use lighter weights for hierarchy.
* **Colors:** A neutral background (e.g., a very light off-white or soft gray). Input fields have a subtle light border. Primary action buttons leverage the app's main accent color. Social login buttons integrate their brand colors while maintaining overall design harmony.
* **Borders & Shadows:** Input fields and buttons will feature subtly rounded corners (e.g., 8px radius). Input fields gain a light border and a minimal inner shadow on focus. Buttons will exhibit a slight elevation effect (subtle drop shadow) on hover and a gentle press animation.
* **Animations:** Smooth, quick fade or horizontal slide animation when switching between the "Login" and "Sign Up" tabs (e.g., 200ms duration, ease-in-out). Button presses have a quick, satisfying scale-down and opacity change.

### User Flow:
1.  User opens the app, lands on this "Welcome & Authentication" screen. "Login" is the default active tab.
2.  **Login Path:** User enters credentials, taps "Log In".
    * If successful, user is authenticated and seamlessly navigated to the "Create Your Family Group" screen.
    * If unsuccessful, inline error messages appear below relevant fields (e.g., "Invalid email or password").
3.  **Sign Up Path:** User taps the "Sign Up" tab.
    * User enters email, password, and confirms password. Password strength indicator provides real-time feedback.
    * Taps "Create Account".
    * If successful, account is created, user is logged in, and seamlessly navigated to the "Create Your Family Group" screen.
    * If unsuccessful (e.g., email already exists, passwords don't match, weak password), inline error messages provide clear guidance.
4.  **Social Login Path:** User taps "Continue with Google" or "Continue with Apple ID".
    * Standard OAuth flow is initiated.
    * Upon successful authentication, user is logged in and navigated to the "Create Your Family Group" screen.

*Question:* To establish a cohesive visual identity from the outset, what is the desired primary brand color palette (e.g., 2-3 main colors plus neutrals) and what overall aesthetic (e.g., vibrant & playful, calm & sophisticated, modern & minimalist) should this Welcome & Authentication screen convey to reflect the 'Music League Family Companion' app's tone?
"""

workflow_content = """# AI Development Iterative Implementation Workflow

This document outlines the operational framework for iterative AI development, ensuring a structured approach from concept to deployment.

## 1. Describe Changes:
Each iteration begins with the identification and documentation of a proposed change or new feature. This typically originates from user feedback, product roadmap requirements, bug reports, or performance optimizations. Changes are captured as detailed specifications, user stories, or problem statements, clearly articulating the "what" and "why" from an operational or user perspective. This initial description includes relevant context, expected impact, and any dependencies.

## 2. Set Goals:
For each described change, clear, measurable, achievable, relevant, and time-bound (SMART) goals are established. These goals define the success criteria for the iteration, including specific metrics for AI model performance, system functionality, user experience improvements, or infrastructure enhancements. Goals align with higher-level product objectives and provide a benchmark for evaluating the implementation.

## 3. Identify Affected Files/Components:
Before implementation, a thorough analysis is conducted to identify all code files, configuration settings, database schemas, AI models, data pipelines, and infrastructure components that will be impacted by the proposed changes. This includes front-end UI elements, backend services, data storage, and external integrations. This step helps in understanding the scope of work, potential risks, and ensuring comprehensive testing plans.

## 4. Make Changes (Generate Atomic Tasks Reference):
The actual implementation involves making the necessary modifications to the identified components. This process is broken down into atomic, manageable tasks to ensure clarity and track progress. For example, if a goal involves enhancing music discovery, specific tasks might be drawn from the Generate Atomic Tasks list:

**Backend:**
* Implement recommendation engine logic for music discovery (Task 45).
* Establish data pipelines for collecting user interaction logs for AI analysis (Task 48).
* Implement processing logic for user interaction logs within AI pipelines (Task 50).
* Implement statistical models for generating AI-powered insights (Task 51).

**UI:**
* Develop UI to present personalized voting trend insights (e.g., preferred genres) (Task 114).
* Develop UI to present personalized voting trend insights (e.g., voting alignment with other members) (Task 115).
* Develop UI to display aggregate insights on the family's collective music taste (e.g., most divisive songs) (Task 116).
* Develop UI to display aggregate insights on the family's collective music taste (e.g., dominant genres) (Task 117).

Each atomic task is implemented, focusing on clean code, modular design, and adherence to established coding standards.

## 5. Review Work:
Upon completion of the implementation, the changes undergo a rigorous review process. This includes:
* **Code Review:** Peer review of all modified code to ensure quality, maintainability, security, performance, and adherence to architectural patterns.
* **Functional Testing:** Verification that the new features or fixes operate as intended, meeting the defined goals.
* **Automated Testing:** Execution of unit, integration, and end-to-end tests, including regression tests, to confirm existing functionality remains intact.
* **AI Model Validation:** For AI-related changes, this involves evaluating model performance against baseline metrics, checking for bias, and ensuring data integrity.
* **Security Audit:** Assessment for any introduced vulnerabilities.

## 6. Commit Changes:
Once the changes have been thoroughly reviewed and approved, they are committed to the version control system (e.g., Git). This typically involves:
* Creating a new branch for the feature or fix.
* Committing changes with clear, descriptive commit messages that link back to the initial change description or task.
* Squashing commits where appropriate to maintain a clean history.
* Merging the branch into the main development branch after successful review and testing, often via a pull request mechanism.

## 7. Deploy Updates:
The final step involves deploying the updated application or AI model. This process includes:
* **Staging Environment Deployment:** Deploying the committed changes to a staging environment for final quality assurance, user acceptance testing (UAT), and performance testing under near-production conditions.
* **Production Deployment:** Once validated in staging, the changes are deployed to the production environment, often employing continuous deployment practices or scheduled release windows. This may involve blue/green deployments, canary releases, or feature flags to minimize risk.
* **Monitoring and Validation:** Post-deployment, continuous monitoring of system performance, error rates, AI model accuracy, and user engagement metrics is critical to validate the success of the update and quickly identify any unforeseen issues.
* **Rollback Plan:** A clear rollback strategy is in place to revert to the previous stable version if critical issues are detected post-deployment.
"""

files = {
    "README.md": readme_content,
    "docs/README.md": """# Documentation Index\n\nUse this index to navigate the project documentation by stage.\n\n## Overview\n- `overview/initial_discussion.md`: Early context and scoping.\n- `overview/research_and_ideation.md`: Market, competitor, and concept research.\n\n## Requirements\n- `requirements/feature_specification.md`: Requirements and user stories.\n\n## Planning\n- `planning/project_plan.md`: Roadmap, architecture notes, and atomic tasks.\n\n## Design\n- `design/ui_specification.md`: UX flows, screens, and visual guidance.\n\n## Workflow\n- `workflow/implementation_workflow.md`: Iterative AI development process.\n""",
    "docs/overview/initial_discussion.md": initial_discussion_content,
    "docs/overview/research_and_ideation.md": research_content,
    "docs/requirements/feature_specification.md": feature_spec_content,
    "docs/planning/project_plan.md": project_plan_content,
    "docs/design/ui_specification.md": ui_spec_content,
    "docs/workflow/implementation_workflow.md": workflow_content,
}

zip_filename = "music_league_docs.zip"

print(f"Creating {zip_filename}...")

with zipfile.ZipFile(zip_filename, 'w') as zip_file:
    for file_path, content in files.items():
        # Ensure directory structure exists in the zip
        zip_info = zipfile.ZipInfo(file_path)
        # Set permissions to be readable
        zip_info.external_attr = 0o644 << 16
        zip_file.writestr(zip_info, content)
        print(f"Added {file_path}")

print(f"\nSuccessfully created {zip_filename} with {len(files)} files.")
