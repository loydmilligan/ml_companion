# Feature Specification Document: Music League Family Companion App

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

### 3.8. Voting Phase Minigames
Interactive games during the voting phase to enhance engagement.
* **User Story: Submitter Guess:** As a family member, during the voting phase, I want to guess who submitted each song so I can test my knowledge of family members' musical tastes.
* **User Story: Own Song Detection:** As a family member, I want my own song to be excluded from the guessing game so I'm only guessing songs that aren't mine.
* **User Story: Guess Scoring:** As a family member, I want to see how many guesses I got correct after the round reveals, and compare my score to other family members on a leaderboard.
* **User Story: Submitter Comments:** As a family member, I want to see what comment the submitter left about their song choice, displayed with a clear "Submitter's comment" label.

### 3.9. Submission Phase Minigames
Interactive games during the submission phase.
* **User Story: Round Challenge:** As a family member, during the submission phase, I want to play a trivia game guessing which Season 1 theme songs belonged to, so I can test my memory and earn bonus points.

### 3.10. Push Notifications
Real-time alerts for league events.
* **User Story: Receive Push Notifications:** As a family member, I want to receive push notifications when important events happen (new round, results ready, chat messages, deadlines) so I never miss an update.
* **User Story: Notification Preferences:** As a family member, I want to control which types of notifications I receive so I can customize my experience.
* **User Story: Test Notifications:** As a family member, I want to test that push notifications are working so I can verify my setup.

### 3.11. Activity Tracking
Track participation during rounds.
* **User Story: See Who Has Submitted:** As a family member, during the submission phase, I want to see which competitors have already submitted so I know who's still deciding.
* **User Story: See Who Has Voted:** As a family member, during the voting phase, I want to see which competitors have already voted so I know who's still listening.
* **User Story: Urgency Indicators:** As a family member, I want visual cues showing how urgent it is for remaining participants to act so we can encourage timely participation.

### 3.12. YouTube Integration
In-app YouTube playback.
* **User Story: Play Songs In-App:** As a family member, I want to play YouTube videos in a sidebar player without leaving the app so I can easily listen while browsing.
* **User Story: Quick Actions:** As a family member, I want icon buttons on song cards for Spotify, YouTube, and quoting so I can quickly access different playback options.
