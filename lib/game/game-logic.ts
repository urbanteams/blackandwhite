import { Game, Move } from "@/lib/generated/prisma";
import { prisma } from "@/lib/prisma";

/**
 * Determines the winner of a round based on tile numbers
 * @param tile1 - First player's tile number
 * @param tile2 - Second player's tile number
 * @returns 1 if player 1 wins, 2 if player 2 wins, 0 for tie
 */
export function determineRoundWinner(tile1: number, tile2: number): number {
  if (tile1 > tile2) return 1;
  if (tile2 > tile1) return 2;
  return 0; // tie
}

/**
 * Calculates the total score (rounds won) for a player
 * @param moves - All moves in the game
 * @param playerId - The player's user ID
 * @param player1Id - Player 1's user ID
 * @param player2Id - Player 2's user ID
 * @returns Number of rounds won by the player
 */
export function calculateGameScore(
  moves: Move[],
  playerId: string,
  player1Id: string,
  player2Id: string | null
): number {
  if (!player2Id) return 0; // AI games handled separately

  let score = 0;
  const roundsPlayed = Math.max(...moves.map(m => m.round), 0);

  for (let round = 1; round <= roundsPlayed; round++) {
    const roundMoves = moves.filter(m => m.round === round);
    if (roundMoves.length !== 2) continue; // incomplete round

    const player1Move = roundMoves.find(m => m.playerId === player1Id);
    const player2Move = roundMoves.find(m => m.playerId === player2Id);

    if (!player1Move || !player2Move) continue;

    const winner = determineRoundWinner(player1Move.tileNumber, player2Move.tileNumber);

    if (winner === 1 && playerId === player1Id) score++;
    if (winner === 2 && playerId === player2Id) score++;
    // No points for ties
  }

  return score;
}

/**
 * Gets all tiles that have been used by a player
 * @param moves - All moves in the game
 * @param playerId - The player's user ID
 * @returns Array of used tile numbers
 */
export function getUsedTiles(moves: Move[], playerId: string): number[] {
  return moves
    .filter(m => m.playerId === playerId)
    .map(m => m.tileNumber)
    .sort((a, b) => a - b);
}

/**
 * Gets tiles remaining for a player
 * @param usedTiles - Array of used tile numbers
 * @returns Array of remaining tile numbers (0-8)
 */
export function getRemainingTiles(usedTiles: number[]): number[] {
  const allTiles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
  return allTiles.filter(tile => !usedTiles.includes(tile));
}

/**
 * Gets the color of a tile
 * @param tileNumber - The tile number (0-8)
 * @returns "black" for even tiles, "white" for odd tiles
 */
export function getTileColor(tileNumber: number): "black" | "white" {
  return tileNumber % 2 === 0 ? "black" : "white";
}

/**
 * Generates a unique 6-character room code
 * @returns A random alphanumeric room code
 */
export async function generateRoomCode(): Promise<string> {
  const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Exclude confusing chars
  let roomCode: string;
  let isUnique = false;

  while (!isUnique) {
    roomCode = "";
    for (let i = 0; i < 6; i++) {
      roomCode += characters.charAt(Math.floor(Math.random() * characters.length));
    }

    // Check if code already exists
    const existingGame = await prisma.game.findUnique({
      where: { roomCode }
    });

    if (!existingGame) {
      isUnique = true;
      return roomCode;
    }
  }

  throw new Error("Failed to generate unique room code");
}

/**
 * Checks if a game is complete (all 9 rounds played)
 * @param round - Current round number
 * @returns True if game is complete
 */
export function isGameComplete(round: number): boolean {
  return round >= 9;
}

/**
 * Validates if a move has timed out
 * @param game - The game object
 * @returns Object with validity and winner (if timeout occurred)
 */
export function validateMoveTimeout(game: Game & { moves: Move[] }): {
  valid: boolean;
  timeoutWinnerId?: string;
} {
  if (game.status !== "IN_PROGRESS") {
    return { valid: true };
  }

  // Get the last move for the current round
  const currentRoundMoves = game.moves.filter(m => m.round === game.currentRound);

  if (currentRoundMoves.length === 0) {
    // No moves yet in this round, check from game update time
    const timeElapsed = Date.now() - game.updatedAt.getTime();
    if (timeElapsed > 60000) { // 60 seconds
      return {
        valid: false,
        timeoutWinnerId: game.currentTurn === game.player1Id ? game.player2Id || undefined : game.player1Id
      };
    }
  } else if (currentRoundMoves.length === 1) {
    // One player has moved, waiting for the other
    const lastMove = currentRoundMoves[0];
    const timeElapsed = Date.now() - lastMove.createdAt.getTime();
    if (timeElapsed > 60000) { // 60 seconds
      // The player whose turn it is has timed out
      return {
        valid: false,
        timeoutWinnerId: game.currentTurn === game.player1Id ? game.player2Id || undefined : game.player1Id
      };
    }
  }

  return { valid: true };
}

/**
 * Validates if a tile move is legal
 * @param tileNumber - The tile to play
 * @param usedTiles - Tiles already used by the player
 * @returns True if the move is valid
 */
export function isValidTileMove(tileNumber: number, usedTiles: number[]): boolean {
  // Check if tile is in valid range
  if (tileNumber < 0 || tileNumber > 8) return false;

  // Check if tile hasn't been used
  if (usedTiles.includes(tileNumber)) return false;

  return true;
}
