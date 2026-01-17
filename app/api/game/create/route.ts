import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateRoomCode } from "@/lib/game/game-logic";
import { cleanupOldGames } from "@/lib/game/game-cleanup";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameMode } = await request.json();

    // Validate game mode
    if (!gameMode || !["AI", "MULTIPLAYER"].includes(gameMode)) {
      return NextResponse.json(
        { error: "Invalid game mode. Must be 'AI' or 'MULTIPLAYER'" },
        { status: 400 }
      );
    }

    // Generate unique room code
    const roomCode = await generateRoomCode();

    // Create game
    // For AI games, player2Id is null (AI opponent is not a real user)
    // The gameMode field indicates this is an AI game
    const game = await prisma.game.create({
      data: {
        roomCode,
        gameMode,
        status: gameMode === "AI" ? "IN_PROGRESS" : "WAITING",
        player1Id: session.userId,
        player2Id: null, // AI games have no second player user
        currentTurn: session.userId, // Player 1 always goes first
        currentRound: 1,
      },
    });

    // Clean up old games for this user (non-blocking)
    cleanupOldGames(session.userId).catch((err) =>
      console.error("Cleanup error:", err)
    );

    return NextResponse.json(
      {
        gameId: game.id,
        roomCode: game.roomCode,
        gameMode: game.gameMode,
        status: game.status,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Create game error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
