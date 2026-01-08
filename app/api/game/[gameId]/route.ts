import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  calculateGameScore,
  getUsedTiles,
  getRemainingTiles,
  getTileColor,
  validateMoveTimeout,
} from "@/lib/game/game-logic";

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

    // Fetch game with moves and players
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        moves: {
          orderBy: { createdAt: "asc" },
        },
        player1: {
          select: { id: true, email: true },
        },
        player2: {
          select: { id: true, email: true },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    // Verify user is a player in this game
    const isPlayer1 = game.player1Id === session.userId;
    const isPlayer2 = game.player2Id === session.userId;
    const isAIGame = game.gameMode === "AI";

    if (!isPlayer1 && !isPlayer2) {
      return NextResponse.json(
        { error: "You are not a player in this game" },
        { status: 403 }
      );
    }

    // Determine opponent
    const myId = session.userId;
    let opponentId = isPlayer1 ? game.player2Id : game.player1Id;

    // For AI games, find the AI opponent's ID from the moves
    if (isAIGame && !opponentId && game.moves.length > 0) {
      const aiMove = game.moves.find((m) => m.playerId !== myId);
      if (aiMove) {
        opponentId = aiMove.playerId;
      }
    }

    // Calculate used and remaining tiles
    const myUsedTiles = getUsedTiles(game.moves, myId);
    const myRemainingTiles = getRemainingTiles(myUsedTiles);

    const opponentUsedTiles = opponentId
      ? getUsedTiles(game.moves, opponentId)
      : [];
    const opponentRemainingTiles = getRemainingTiles(opponentUsedTiles);

    // Calculate scores
    const myScore = opponentId
      ? calculateGameScore(game.moves, myId, game.player1Id, opponentId)
      : 0;
    const opponentScore = opponentId
      ? calculateGameScore(game.moves, opponentId, game.player1Id, opponentId)
      : 0;

    // Get current round moves
    const currentRoundMoves = game.moves.filter(
      (m) => m.round === game.currentRound
    );
    const myMove = currentRoundMoves.find((m) => m.playerId === myId);
    const opponentMove = currentRoundMoves.find((m) => m.playerId !== myId);

    // Sanitize opponent move - only show color if round is not complete
    let sanitizedOpponentMove = null;
    if (opponentMove) {
      if (currentRoundMoves.length < 2) {
        // Round not complete - hide opponent's tile number, only show color
        sanitizedOpponentMove = {
          color: getTileColor(opponentMove.tileNumber),
        };
      } else {
        // Round complete - show full tile
        sanitizedOpponentMove = {
          tileNumber: opponentMove.tileNumber,
          color: getTileColor(opponentMove.tileNumber),
        };
      }
    }

    // Get completed rounds
    const completedRounds = [];
    // Include current round if game is complete, otherwise exclude it
    const maxRound = game.status === "COMPLETED" || game.status === "ABANDONED"
      ? game.currentRound
      : game.currentRound - 1;

    for (let round = 1; round <= maxRound; round++) {
      const roundMoves = game.moves.filter((m) => m.round === round);
      const myRoundMove = roundMoves.find((m) => m.playerId === myId);
      const oppRoundMove = roundMoves.find((m) => m.playerId !== myId);

      if (myRoundMove && oppRoundMove) {
        const myTile = myRoundMove.tileNumber;
        const oppTile = oppRoundMove.tileNumber;
        const winner =
          myTile > oppTile ? myId : oppTile > myTile ? (opponentId || "AI") : null;

        completedRounds.push({
          round,
          myTile,
          opponentTile: oppTile,
          winner: winner === myId ? "me" : winner ? "opponent" : "tie",
        });
      }
    }

    // Calculate time remaining for current turn (if game is in progress)
    let timeRemaining = null;
    if (game.status === "IN_PROGRESS" && game.currentTurn) {
      // Get the last move or game update time
      const lastMoveTime =
        currentRoundMoves.length > 0
          ? Math.max(...currentRoundMoves.map((m) => m.createdAt.getTime()))
          : game.updatedAt.getTime();

      const elapsed = Date.now() - lastMoveTime;
      timeRemaining = Math.max(0, 60 - Math.floor(elapsed / 1000)); // 60 seconds per move

      // Check if timeout occurred - auto-forfeit current player
      if (elapsed > 60000) {
        // Current player timed out - opponent wins
        const opponentId = game.currentTurn === game.player1Id
          ? game.player2Id
          : game.player1Id;

        await prisma.game.update({
          where: { id: gameId },
          data: {
            status: "COMPLETED",
            winnerId: opponentId,
          },
        });

        // Update the game object for the response
        game.status = "COMPLETED";
        game.winnerId = opponentId;
        timeRemaining = 0;
      }
    }

    // Return sanitized game state
    return NextResponse.json({
      game: {
        id: game.id,
        roomCode: game.roomCode,
        gameMode: game.gameMode,
        status: game.status,
        currentTurn: game.currentTurn,
        currentRound: game.currentRound,
        winnerId: game.winnerId,
      },
      players: {
        player1: game.player1
          ? {
              id: game.player1.id,
              email: game.player1.email,
              isMe: game.player1.id === myId,
            }
          : null,
        player2:
          game.player2 || isAIGame
            ? game.player2
              ? {
                  id: game.player2.id,
                  email: game.player2.email,
                  isMe: game.player2.id === myId,
                }
              : {
                  id: "AI",
                  email: "AI Opponent",
                  isMe: false,
                }
            : null,
      },
      playerState: {
        myTiles: myRemainingTiles,
        opponentTilesCount: opponentRemainingTiles.length,
        myScore,
        opponentScore,
        isMyTurn: game.currentTurn === myId,
        timeRemaining,
      },
      currentRoundMoves: {
        myMove: myMove
          ? {
              tileNumber: myMove.tileNumber,
              color: getTileColor(myMove.tileNumber),
            }
          : null,
        opponentMove: sanitizedOpponentMove,
      },
      completedRounds,
    });
  } catch (error) {
    console.error("Get game state error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
