import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch all games where user is a player
    const games = await prisma.game.findMany({
      where: {
        OR: [
          { player1Id: session.userId },
          { player2Id: session.userId },
        ],
      },
      include: {
        player1: {
          select: { id: true, email: true, username: true },
        },
        player2: {
          select: { id: true, email: true, username: true },
        },
        moves: {
          select: { id: true, round: true },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    // Format games for response
    const formattedGames = games.map((game) => {
      const isPlayer1 = game.player1Id === session.userId;
      const opponent =
        game.gameMode === "AI"
          ? { id: "AI", email: "AI Opponent", username: "AI Opponent" }
          : isPlayer1
            ? game.player2
            : game.player1;

      return {
        id: game.id,
        roomCode: game.roomCode,
        gameMode: game.gameMode,
        status: game.status,
        currentRound: game.currentRound,
        opponent: opponent
          ? {
              id: opponent.id,
              email: opponent.email,
              username: opponent.username || opponent.email,
            }
          : null,
        isMyTurn: game.currentTurn === session.userId,
        createdAt: game.createdAt,
        updatedAt: game.updatedAt,
      };
    });

    return NextResponse.json({
      games: formattedGames,
    });
  } catch (error) {
    console.error("Get my games error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
