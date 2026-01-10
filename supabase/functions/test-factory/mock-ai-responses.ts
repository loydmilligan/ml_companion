/**
 * TEST-001: Mock AI Responses
 *
 * Pre-written AI story responses for testing.
 * Matches the format expected by the current season story feature.
 * Fast, free, deterministic for verification.
 */

export interface MockAIStoryResponse {
  season_intro: string;
  round_two_riff: string;
  minigame_summary: string;
}

/**
 * Season intro templates based on round count context.
 */
const SEASON_INTROS = [
  "The competition is heating up as we enter the heart of the season.",
  "Another round in the books! The family music battle continues.",
  "Midseason check-in: the standings are tighter than ever.",
  "We're in the home stretch now, and every point counts.",
  "The season is flying by - can you believe we're here already?",
];

/**
 * Round riff templates with placeholder theme.
 */
const ROUND_RIFFS = [
  `This round brought the heat with "{theme}"! Some surprising picks had everyone guessing, while the classics continued to dominate. The leaderboard saw a few shake-ups as dark horses emerged from the pack. Next round promises even more musical mayhem - start thinking about your picks now!`,
  `"{theme}" delivered exactly what we hoped for and more. The family brought their A-game with eclectic selections that sparked some lively debate. Points were hard-fought and well-earned. Keep an eye on the standings - this race is far from over!`,
  `What a round! "{theme}" showcased the diverse musical tastes in this family. From nostalgic deep cuts to modern bangers, everyone brought something special to the table. The guessing game was intense, and the results... well, let's just say some people are very predictable!`,
  `"{theme}" round is in the books! This one had some real curveballs that threw off even the most seasoned guessers. The point distribution was surprisingly balanced, which means the final standings are still anyone's game. Stay tuned!`,
];

/**
 * Minigame summary templates.
 */
const MINIGAME_SUMMARIES = [
  "In the guessing game, Alice proved she knows this family's taste, correctly identifying 4 out of 5 submissions. Uncle Dave, meanwhile, remains delightfully unpredictable - his picks stumped almost everyone!",
  "Bob dominated the guessing game this round with an impressive streak. Carol's submission was the hardest to guess, with only 1 person getting it right. The timeline game saw close scores across the board.",
  "The submitter guessing game was intense! Test Admin showed off their family knowledge with the most correct guesses. Meanwhile, Alice's obscure pick had everyone scratching their heads.",
  "Guessing game highlights: Carol came out on top with 3 correct guesses. The hardest submission to identify was Bob's deep cut - only Uncle Dave saw it coming!",
  "This round's guessing game was a rollercoaster. The standings shuffled significantly, with some confident guessers getting humbled and underdogs rising up.",
];

/**
 * Get a deterministic mock AI response based on the round theme.
 * Uses the theme string to select consistently from templates.
 */
export function getMockAIResponse(roundTheme: string): MockAIStoryResponse {
  // Use theme hash to get consistent selection
  const hash = simpleHash(roundTheme);

  const seasonIntro = SEASON_INTROS[hash % SEASON_INTROS.length];
  const roundRiffTemplate = ROUND_RIFFS[hash % ROUND_RIFFS.length];
  const minigameSummary = MINIGAME_SUMMARIES[hash % MINIGAME_SUMMARIES.length];

  // Replace {theme} placeholder
  const roundRiff = roundRiffTemplate.replace("{theme}", roundTheme);

  return {
    season_intro: seasonIntro,
    round_two_riff: roundRiff,
    minigame_summary: minigameSummary,
  };
}

/**
 * Simple string hash for deterministic selection.
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a completely random mock response (for variety in tests).
 */
export function getRandomMockAIResponse(roundTheme: string): MockAIStoryResponse {
  const randomIndex = () => Math.floor(Math.random() * 1000);

  const seasonIntro = SEASON_INTROS[randomIndex() % SEASON_INTROS.length];
  const roundRiffTemplate = ROUND_RIFFS[randomIndex() % ROUND_RIFFS.length];
  const minigameSummary = MINIGAME_SUMMARIES[randomIndex() % MINIGAME_SUMMARIES.length];

  const roundRiff = roundRiffTemplate.replace("{theme}", roundTheme);

  return {
    season_intro: seasonIntro,
    round_two_riff: roundRiff,
    minigame_summary: minigameSummary,
  };
}

/**
 * Get a specific mock response by index (for testing specific scenarios).
 */
export function getMockAIResponseByIndex(
  roundTheme: string,
  introIndex: number,
  riffIndex: number,
  summaryIndex: number
): MockAIStoryResponse {
  const seasonIntro = SEASON_INTROS[introIndex % SEASON_INTROS.length];
  const roundRiffTemplate = ROUND_RIFFS[riffIndex % ROUND_RIFFS.length];
  const minigameSummary = MINIGAME_SUMMARIES[summaryIndex % MINIGAME_SUMMARIES.length];

  const roundRiff = roundRiffTemplate.replace("{theme}", roundTheme);

  return {
    season_intro: seasonIntro,
    round_two_riff: roundRiff,
    minigame_summary: minigameSummary,
  };
}

/**
 * Example usage for testing:
 *
 * const response = getMockAIResponse("Songs That Make You Happy");
 * console.log(response);
 * // {
 * //   season_intro: "The competition is heating up...",
 * //   round_two_riff: "\"Songs That Make You Happy\" delivered exactly...",
 * //   minigame_summary: "In the guessing game, Alice proved..."
 * // }
 */
