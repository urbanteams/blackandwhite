import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/game/[gameId]/chat
 * Fetch all chat messages for a game
 */
export async function GET(
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

    // Verify game exists and user is a player
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

    // Only allow chat in multiplayer games
    if (game.gameMode === "AI") {
      return NextResponse.json(
        { error: "Chat is only available in multiplayer games" },
        { status: 400 }
      );
    }

    // Fetch all chat messages for this game
    const messages = await prisma.chatMessage.findMany({
      where: { gameId },
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    // Format messages for client
    const formattedMessages = messages.map((msg) => ({
      id: msg.id,
      message: msg.message,
      createdAt: msg.createdAt.toISOString(),
      user: {
        id: msg.user.id,
        username: msg.user.username || msg.user.email,
        isMe: msg.user.id === session.userId,
      },
    }));

    return NextResponse.json({ messages: formattedMessages });
  } catch (error) {
    console.error("Fetch chat messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/game/[gameId]/chat
 * Send a chat message in a game
 */
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
    const { message } = await request.json();

    // Validate message
    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return NextResponse.json(
        { error: "Message is required and must be a non-empty string" },
        { status: 400 }
      );
    }

    // Limit message length
    if (message.length > 500) {
      return NextResponse.json(
        { error: "Message must be 500 characters or less" },
        { status: 400 }
      );
    }

    // Verify game exists and user is a player
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

    // Only allow chat in multiplayer games
    if (game.gameMode === "AI") {
      return NextResponse.json(
        { error: "Chat is only available in multiplayer games" },
        { status: 400 }
      );
    }

    // Create the chat message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        gameId,
        userId: session.userId,
        message: message.trim(),
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            username: true,
          },
        },
      },
    });

    // Format message for client
    const formattedMessage = {
      id: chatMessage.id,
      message: chatMessage.message,
      createdAt: chatMessage.createdAt.toISOString(),
      user: {
        id: chatMessage.user.id,
        username: chatMessage.user.username || chatMessage.user.email,
        isMe: chatMessage.user.id === session.userId,
      },
    };

    return NextResponse.json({ message: formattedMessage }, { status: 201 });
  } catch (error) {
    console.error("Send chat message error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
