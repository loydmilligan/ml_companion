# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- **Round Challenge Bonus Game**: AI-powered trivia game where users guess which Season 1 theme songs belonged to
  - Persistent challenges stored in database (same for all group members)
  - One guess per song per user
  - Previous round answers displayed after round closes
  - Admin can award bonus points
- **AI-Powered Peek Panel Features**:
  - Theme Explainer: AI explains theme rules and edge cases
  - Rule Validator: Check if a song fits the current theme
  - Hint Generator: Get creative hints for finding songs
- **Season Narratives**: AI-generated season recap stories stored on leagues table
- **Round Narratives**: AI-generated round stories stored on rounds table
- **Admin Panel Improvements**:
  - Button status colors (green if content exists, grey if not)
  - Visual feedback for Banner, Story, Awards generation status

### Changed
- **Deployment Workflow**: Updated to use Docker Compose on Raspberry Pi
  - Pi address: `192.168.4.158` (SSH alias: `pi`)
  - Production URL: `https://talking.mattmariani.com`
  - Local fallback: `http://192.168.4.158:3080`
- **Award Prompts**: Now include submitter name format for song-based awards
- **Round Challenge**: Rewritten for full database persistence

### Database
- Added `narrative` column to `rounds` table
- Added `narrative` column to `leagues` table
- Added `round_challenges` table for bonus game songs
- Added `challenge_guesses` table for user guesses
- Added `challenge_bonus_points` table for admin bonus points

### Edge Functions
- `round-challenge`: New function for bonus game management
- `openrouter-round-story`: Updated with award prompts and season narrative mode

## [0.1.0] - 2024-12-01

### Added
- Initial project setup
- Supabase authentication with Google and Apple Sign In
- Family group management
- Round tracking and submissions
- Chat functionality
- History page with round cards
- Admin panel for league management
- AI-generated theme banners and round stories
- Award system with trophy generation
