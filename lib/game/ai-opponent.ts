/**
 * Generates a random move for the AI opponent
 * @param remainingTiles - Array of tiles the AI hasn't played yet
 * @returns A randomly selected tile number
 */
export function generateAIMove(remainingTiles: number[]): number {
  if (remainingTiles.length === 0) {
    throw new Error("No remaining tiles for AI to play");
  }

  const randomIndex = Math.floor(Math.random() * remainingTiles.length);
  return remainingTiles[randomIndex];
}
