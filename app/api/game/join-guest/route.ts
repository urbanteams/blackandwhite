import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth";
import { hash } from "bcrypt";

// Generate a random guest username
function generateGuestUsername(): string {
  const adjectives = ["Swift", "Clever", "Bold", "Wise", "Quick", "Brave", "Smart", "Cool"];
  const nouns = ["Panda", "Tiger", "Eagle", "Wolf", "Fox", "Bear", "Hawk", "Lion"];
  const randomNum = Math.floor(Math.random() * 1000);
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  return `${adjective}${noun}${randomNum}`;
}

export async function POST(request: NextRequest) {
  try {
    const { roomCode, guestName } = await request.json();

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

    // Generate a unique guest username
    let username = guestName && guestName.trim()
      ? `Guest_${guestName.trim().substring(0, 20)}`
      : generateGuestUsername();

    // Ensure username is unique
    let isUnique = false;
    let attempts = 0;
    while (!isUnique && attempts < 5) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (!existingUser) {
        isUnique = true;
      } else {
        username = guestName && guestName.trim()
          ? `Guest_${guestName.trim().substring(0, 20)}_${Math.floor(Math.random() * 1000)}`
          : generateGuestUsername();
      }
      attempts++;
    }

    // Create a temporary guest user
    const guestEmail = `guest_${Date.now()}_${Math.random().toString(36).substring(7)}@temp.local`;
    const guestPassword = await hash(Math.random().toString(36).substring(2), 10);

    const guestUser = await prisma.user.create({
      data: {
        email: guestEmail,
        username,
        password: guestPassword,
      },
    });

    // Join the game
    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: {
        player2Id: guestUser.id,
        status: "IN_PROGRESS",
      },
    });

    // Create a session for the guest user
    await createSession(guestUser.id, guestUser.email);

    return NextResponse.json(
      {
        gameId: updatedGame.id,
        roomCode: updatedGame.roomCode,
        gameMode: updatedGame.gameMode,
        status: updatedGame.status,
        username: guestUser.username,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Join game as guest error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
