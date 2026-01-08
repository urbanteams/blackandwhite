import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { gameId } = await params;

    // Fetch game
    const game = await prisma.game.findUnique({
      where: { id: gameId },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Verify user is a player in this game
    const isPlayer1 = game.player1Id === session.userId;
    const isPlayer2 = game.player2Id === session.userId;

    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json(
        { error: "You are not a player in this game" },
        { status: 403 }
      );
    }

    // Check game is not already completed
    if (game.status === "COMPLETED" || game.status === "ABANDONED") {
      return NextResponse.json(
        { error: "Game is already finished" },
        { status: 400 }
      );
    }

    // Determine opponent (winner by forfeit)
    const opponentId = isPlayer1 ? game.player2Id : game.player1Id;

    // Update game - mark as abandoned with opponent as winner
    await prisma.game.update({
      where: { id: gameId },
      data: {
        status: "ABANDONED",
        winnerId: opponentId, // Opponent wins by forfeit
      },
    });

    return NextResponse.json({
      success: true,
      message: "Game abandoned. Opponent wins by forfeit.",
    });
  } catch (error) {
    console.error("Abandon game error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
