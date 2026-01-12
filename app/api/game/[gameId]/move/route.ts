import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getUsedTiles,
  isValidTileMove,
  determineRoundWinner,
  isGameComplete,
  calculateGameScore,
  getRemainingTiles,
} from "@/lib/game/game-logic";
import { generateAIMove } from "@/lib/game/ai-opponent";

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
    const { tileNumber } = await request.json();

    // Validate tile number
    if (
      typeof tileNumber !== "number" ||
      tileNumber < 0 ||
      tileNumber > 8 ||
      !Number.isInteger(tileNumber)
    ) {
      return NextResponse.json(
        { error: "Invalid tile number. Must be 0-8" },
        { status: 400 }
      );
    }

    // Fetch game with moves
    const game = await prisma.game.findUnique({
      where: { id: gameId },
      include: {
        moves: {
          orderBy: { createdAt: "asc" },
        },
      },
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

    // Check game is in progress
    if (game.status !== "IN_PROGRESS") {
      return NextResponse.json(
        { error: "Game is not in progress" },
        { status: 400 }
      );
    }

    // Check it's the player's turn
    if (game.currentTurn !== session.userId) {
      return NextResponse.json(
        { error: "It's not your turn" },
        { status: 400 }
      );
    }

    // Check for timeout
    const currentRoundMoves = game.moves.filter(
      (m) => m.round === game.currentRound
    );
    // Check timeout based on last move in round, or game update time if no moves yet
    const lastMoveTime =
      currentRoundMoves.length > 0
        ? Math.max(...currentRoundMoves.map((m) => m.createdAt.getTime()))
        : game.updatedAt.getTime();
    const elapsed = Date.now() - lastMoveTime;
    if (elapsed > 60000) {
      // 60 seconds timeout
      // Current player timed out - opponent wins
      const opponentId = isPlayer1 ? game.player2Id : game.player1Id;
      await prisma.game.update({
        where: { id: gameId },
        data: {
          status: "COMPLETED",
          winnerId: opponentId,
        },
      });
      return NextResponse.json(
        { error: "Move timeout. You lost the game." },
        { status: 400 }
      );
    }

    // Validate tile hasn't been used
    const myUsedTiles = getUsedTiles(game.moves, session.userId);
    if (!isValidTileMove(tileNumber, myUsedTiles)) {
      return NextResponse.json(
        { error: "This tile has already been used" },
        { status: 400 }
      );
    }

    // Create the move
    await prisma.move.create({
      data: {
        gameId,
        round: game.currentRound,
        playerId: session.userId,
        tileNumber,
      },
    });

    // Refetch moves to include the new move
    const allMoves = await prisma.move.findMany({
      where: { gameId },
      orderBy: { createdAt: "asc" },
    });

    const updatedCurrentRoundMoves = allMoves.filter(
      (m) => m.round === game.currentRound
    );

    // Check if both players have moved this round
    if (updatedCurrentRoundMoves.length === 2) {
      // Both players moved - determine round winner
      const player1Move = updatedCurrentRoundMoves.find(
        (m) => m.playerId === game.player1Id
      );
      const player2Move = updatedCurrentRoundMoves.find(
        (m) => m.playerId !== game.player1Id
      );

      if (!player1Move || !player2Move) {
        throw new Error("Invalid round state");
      }

      // For AI games, get the AI user
      let aiUser = null;
      if (game.gameMode === "AI") {
        aiUser = await prisma.user.findUnique({
          where: { email: "ai@system.local" },
        });
        if (!aiUser) {
          aiUser = await prisma.user.create({
            data: {
              email: "ai@system.local",
              password: "NOT_A_REAL_PASSWORD",
            },
          });
        }
      }

      const roundWinner = determineRoundWinner(
        player1Move.tileNumber,
        player2Move.tileNumber
      );
      const roundWinnerId =
        roundWinner === 1
          ? game.player1Id
          : roundWinner === 2
            ? (game.gameMode === "AI" ? aiUser?.id : game.player2Id)
            : null;

      // Check if game is complete (9 rounds played)
      if (isGameComplete(game.currentRound)) {
        // Game complete - determine overall winner
        const player2IdForScore = game.gameMode === "AI" ? aiUser?.id : game.player2Id;
        const player1Score = calculateGameScore(
          allMoves,
          game.player1Id,
          game.player1Id,
          player2IdForScore || null
        );
        const player2Score = calculateGameScore(
          allMoves,
          player2IdForScore || "AI",
          game.player1Id,
          player2IdForScore || null
        );

        const gameWinnerId =
          player1Score > player2Score
            ? game.player1Id
            : player2Score > player1Score
              ? player2IdForScore
              : null; // Tie

        await prisma.game.update({
          where: { id: gameId },
          data: {
            status: "COMPLETED",
            winnerId: gameWinnerId,
          },
        });

        return NextResponse.json({
          success: true,
          roundComplete: true,
          gameComplete: true,
          roundWinner: roundWinnerId,
          gameWinner: gameWinnerId,
        });
      } else {
        // Advance to next round
        // Winner of previous round goes first
        // If tie, whoever played first this round plays first next round
        let nextTurn = roundWinnerId;
        if (!nextTurn) {
          // Tie - determine who moved first this round
          const firstMove = updatedCurrentRoundMoves.sort(
            (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
          )[0];
          nextTurn = firstMove.playerId;
        }

        // For AI games, if AI won (or goes first), generate AI move for next round
        if (game.gameMode === "AI" && aiUser && nextTurn === aiUser.id) {
          const aiUsedTiles = getUsedTiles(allMoves, aiUser.id);
          const aiRemainingTiles = getRemainingTiles(aiUsedTiles);

          if (aiRemainingTiles.length > 0) {
            const nextAiTile = generateAIMove(aiRemainingTiles);

            // Create AI move for next round
            await prisma.move.create({
              data: {
                gameId,
                round: game.currentRound + 1,
                playerId: aiUser.id,
                tileNumber: nextAiTile,
              },
            });

            // Update game - AI has played, now it's human's turn
            await prisma.game.update({
              where: { id: gameId },
              data: {
                currentRound: game.currentRound + 1,
                currentTurn: session.userId,
              },
            });

            return NextResponse.json({
              success: true,
              roundComplete: true,
              gameComplete: false,
              roundWinner: roundWinnerId,
              nextRoundAiMove: {
                tileNumber: nextAiTile,
              },
            });
          }
        }

        await prisma.game.update({
          where: { id: gameId },
          data: {
            currentRound: game.currentRound + 1,
            currentTurn: nextTurn,
          },
        });

        return NextResponse.json({
          success: true,
          roundComplete: true,
          gameComplete: false,
          roundWinner: roundWinnerId,
        });
      }
    } else {
      // Only one player has moved - switch turn to opponent
      const opponentId = isPlayer1 ? game.player2Id : game.player1Id;

      // For AI games, immediately generate AI move
      if (game.gameMode === "AI" && opponentId === null) {
        // AI's turn - generate and process AI move
        // First, get or create the AI user
        let aiUser = await prisma.user.findUnique({
          where: { email: "ai@system.local" },
        });

        if (!aiUser) {
          // Create system AI user
          aiUser = await prisma.user.create({
            data: {
              email: "ai@system.local",
              password: "NOT_A_REAL_PASSWORD", // AI never logs in
            },
          });
        }

        // Now get AI's used tiles with the correct user ID
        const aiUsedTiles = getUsedTiles(allMoves, aiUser.id);
        const aiRemainingTiles = getRemainingTiles(aiUsedTiles);

        if (aiRemainingTiles.length === 0) {
          throw new Error("AI has no remaining tiles");
        }

        const aiTileNumber = generateAIMove(aiRemainingTiles);

        // Create AI move
        await prisma.move.create({
          data: {
            gameId,
            round: game.currentRound,
            playerId: aiUser.id,
            tileNumber: aiTileNumber,
          },
        });

        // Refetch all moves again
        const allMovesWithAI = await prisma.move.findMany({
          where: { gameId },
          orderBy: { createdAt: "asc" },
        });

        // Now both players have moved - determine round winner
        const humanMove = updatedCurrentRoundMoves.find(
          (m) => m.playerId === session.userId
        );
        const aiMove = { tileNumber: aiTileNumber };

        if (!humanMove) {
          throw new Error("Invalid round state");
        }

        const roundWinner = determineRoundWinner(
          isPlayer1 ? humanMove.tileNumber : aiTileNumber,
          isPlayer1 ? aiTileNumber : humanMove.tileNumber
        );
        const roundWinnerId =
          roundWinner === 1
            ? game.player1Id
            : roundWinner === 2
              ? aiUser.id
              : null;

        // Check if game is complete
        if (isGameComplete(game.currentRound)) {
          // Game complete
          const humanScore = calculateGameScore(
            allMovesWithAI,
            session.userId,
            game.player1Id,
            aiUser.id
          );
          const aiScore = calculateGameScore(
            allMovesWithAI,
            aiUser.id,
            game.player1Id,
            aiUser.id
          );

          const gameWinnerId =
            humanScore > aiScore
              ? session.userId
              : aiScore > humanScore
                ? aiUser.id
                : null;

          await prisma.game.update({
            where: { id: gameId },
            data: {
              status: "COMPLETED",
              winnerId: gameWinnerId,
            },
          });

          return NextResponse.json({
            success: true,
            roundComplete: true,
            gameComplete: true,
            roundWinner: roundWinnerId,
            gameWinner: gameWinnerId,
            aiMove: {
              tileNumber: aiTileNumber,
            },
          });
        } else {
          // Advance to next round
          // Winner of previous round goes first
          // If tie, whoever played first this round plays first next round
          let nextTurn = roundWinnerId;
          if (!nextTurn) {
            // Tie - determine who moved first this round
            const currentRoundMovesWithAI = allMovesWithAI.filter(
              (m) => m.round === game.currentRound
            );
            const firstMove = currentRoundMovesWithAI.sort(
              (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
            )[0];
            nextTurn = firstMove.playerId;
          }

          // If AI won, it goes first in next round - generate AI move immediately
          if (nextTurn === aiUser.id) {
            const aiUsedTilesForNextRound = getUsedTiles(allMovesWithAI, aiUser.id);
            const aiRemainingTilesForNextRound = getRemainingTiles(aiUsedTilesForNextRound);

            if (aiRemainingTilesForNextRound.length > 0) {
              const nextAiTile = generateAIMove(aiRemainingTilesForNextRound);

              // Create AI move for next round
              await prisma.move.create({
                data: {
                  gameId,
                  round: game.currentRound + 1,
                  playerId: aiUser.id,
                  tileNumber: nextAiTile,
                },
              });

              // Update game - AI has played, now it's human's turn
              await prisma.game.update({
                where: { id: gameId },
                data: {
                  currentRound: game.currentRound + 1,
                  currentTurn: session.userId,
                },
              });

              return NextResponse.json({
                success: true,
                roundComplete: true,
                gameComplete: false,
                roundWinner: roundWinnerId,
                aiMove: {
                  tileNumber: aiTileNumber,
                },
                nextRoundAiMove: {
                  tileNumber: nextAiTile,
                },
              });
            }
          }

          // Human won or tie - human goes first
          await prisma.game.update({
            where: { id: gameId },
            data: {
              currentRound: game.currentRound + 1,
              currentTurn: nextTurn,
            },
          });

          return NextResponse.json({
            success: true,
            roundComplete: true,
            gameComplete: false,
            roundWinner: roundWinnerId,
            aiMove: {
              tileNumber: aiTileNumber,
            },
          });
        }
      } else {
        // Multiplayer game - switch turn to opponent
        await prisma.game.update({
          where: { id: gameId },
          data: {
            currentTurn: opponentId,
          },
        });

        return NextResponse.json({
          success: true,
          roundComplete: false,
          gameComplete: false,
        });
      }
    }
  } catch (error) {
    console.error("Submit move error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
