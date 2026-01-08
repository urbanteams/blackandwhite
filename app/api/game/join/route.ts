import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roomCode } = await request.json();

    // Validate room code
    if (!roomCode || typeof roomCode !== "string") {
      return NextResponse.json(
        { error: "Room code is required" },
        { status: 400 }
      );
    }

    // Find the game by room code
    const game = await prisma.game.findUnique({
      where: { roomCode: roomCode.toUpperCase() },
    });

    if (!game) {
      return NextResponse.json(
        { error: "Game not found with this room code" },
        { status: 404 }
      );
    }

    // Validate game is joinable
    if (game.gameMode !== "MULTIPLAYER") {
      return NextResponse.json(
        { error: "Cannot join AI games" },
        { status: 400 }
      );
    }

    if (game.status !== "WAITING") {
      return NextResponse.json(
        { error: "Game is not accepting new players" },
        { status: 400 }
      );
    }

    if (game.player2Id !== null) {
      return NextResponse.json(
        { error: "Game is already full" },
        { status: 400 }
      );
    }

    if (game.player1Id === session.userId) {
      return NextResponse.json(
        { error: "You are already in this game" },
        { status: 400 }
      );
    }

    // Join the game
    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: {
        player2Id: session.userId,
        status: "IN_PROGRESS",
      },
    });

    return NextResponse.json(
      {
        gameId: updatedGame.id,
        roomCode: updatedGame.roomCode,
        gameMode: updatedGame.gameMode,
        status: updatedGame.status,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Join game error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
