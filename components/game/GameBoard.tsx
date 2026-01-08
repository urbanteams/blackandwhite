"use client";

import React, { useState } from "react";
import { useGame } from "@/lib/contexts/game-context";
import { TileSelector } from "./TileSelector";
import { ScoreDisplay } from "./ScoreDisplay";
import { GameTimer } from "./GameTimer";
import { TurnIndicator } from "./TurnIndicator";
import { RoundHistory } from "./RoundHistory";
import { OpponentInfo } from "./OpponentInfo";
import { Button } from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";

export function GameBoard() {
  const { gameState, loading, error, submitMove, abandonGame } = useGame();
  const [selectedTile, setSelectedTile] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleTileSelect = async (tileNumber: number) => {
    setSelectedTile(tileNumber);
    setSubmitting(true);

    try {
      await submitMove(tileNumber);
      setSelectedTile(null);
    } catch (err) {
      console.error("Failed to submit move:", err);
      // Keep tile selected so user can try again
    } finally {
      setSubmitting(false);
    }
  };

  const handleAbandon = async () => {
    if (!confirm("Are you sure you want to forfeit this game? Your opponent will win.")) {
      return;
    }

    try {
      await abandonGame();
    } catch (err) {
      console.error("Failed to abandon game:", err);
    }
  };

  if (loading && !gameState) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <Card className="w-96">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4" />
            <p className="text-lg font-semibold text-gray-700">Loading game...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="py-8 text-center">
            <div className="text-red-600 text-5xl mb-4">⚠️</div>
            <h2 className="text-xl font-bold text-gray-800 mb-2">Error Loading Game</h2>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button onClick={() => window.location.href = "/"}>
              Return to Lobby
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!gameState) {
    return null;
  }

  const { game, players, playerState, currentRoundMoves, completedRounds } = gameState;

  const myName = players.player1?.isMe ? players.player1.email : players.player2?.email || "You";
  const opponentName = players.player1?.isMe ? (players.player2?.email || "AI Opponent") : (players.player1?.email || "Opponent");

  const isGameOver = game.status === "COMPLETED" || game.status === "ABANDONED";
  const canMove = playerState.isMyTurn && !currentRoundMoves.myMove && !isGameOver && !submitting;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Black & White</h1>
          <p className="text-gray-600">Room Code: <span className="font-mono font-bold">{game.roomCode}</span></p>
        </div>

        {/* Game Over Banner */}
        {isGameOver && (
          <Card className={`mb-6 ${game.status === "ABANDONED" ? "bg-orange-50 border-orange-300" : "bg-green-50 border-green-300"}`}>
            <CardContent className="py-6 text-center">
              <h2 className="text-3xl font-bold mb-2 text-black">
                {game.status === "ABANDONED" ? "🏳️ Game Abandoned" : "🎉 Game Complete!"}
              </h2>
              {game.winnerId && (
                <p className="text-xl text-black">
                  {players.player1?.id === game.winnerId && players.player1?.isMe && "You won!"}
                  {players.player2?.id === game.winnerId && players.player2?.isMe && "You won!"}
                  {players.player1?.id === game.winnerId && !players.player1?.isMe && `${players.player1.email} won!`}
                  {players.player2?.id === game.winnerId && !players.player2?.isMe && `${players.player2?.email} won!`}
                </p>
              )}
              {!game.winnerId && game.status === "COMPLETED" && (
                <p className="text-xl text-black">It's a tie!</p>
              )}
              <Button onClick={() => window.location.href = "/"} className="mt-4">
                Return to Lobby
              </Button>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Game Info */}
          <div className="space-y-6">
            <ScoreDisplay
              myScore={playerState.myScore}
              opponentScore={playerState.opponentScore}
              myName={myName}
              opponentName={opponentName}
              currentRound={game.currentRound}
            />

            <OpponentInfo
              opponentName={opponentName}
              opponentTilesCount={playerState.opponentTilesCount}
            />

            {playerState.isMyTurn && playerState.timeRemaining !== null && !isGameOver && playerState.myTiles.length > 0 && (
              <GameTimer timeRemaining={playerState.timeRemaining} />
            )}

            {!isGameOver && (
              <Button
                variant="danger"
                className="w-full"
                onClick={handleAbandon}
              >
                Forfeit Game
              </Button>
            )}
          </div>

          {/* Center Column - Gameplay */}
          <div className="space-y-6">
            <TurnIndicator
              isMyTurn={playerState.isMyTurn}
              myMove={currentRoundMoves.myMove}
              opponentMove={currentRoundMoves.opponentMove}
            />

            {!isGameOver && (
              <Card>
                <CardContent className="py-6">
                  <TileSelector
                    availableTiles={playerState.myTiles}
                    onSelectTile={handleTileSelect}
                    disabled={!canMove}
                    selectedTile={currentRoundMoves.myMove?.tileNumber || null}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Round History */}
          <div>
            <RoundHistory completedRounds={completedRounds} gameComplete={isGameOver} />
          </div>
        </div>
      </div>
    </div>
  );
}
