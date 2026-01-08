"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

// Types for game state from API
interface GameState {
  game: {
    id: string;
    roomCode: string;
    gameMode: "AI" | "MULTIPLAYER";
    status: "WAITING" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
    currentTurn: string | null;
    currentRound: number;
    winnerId: string | null;
  };
  players: {
    player1: {
      id: string;
      email: string;
      isMe: boolean;
    } | null;
    player2: {
      id: string;
      email: string;
      isMe: boolean;
    } | null;
  };
  playerState: {
    myTiles: number[];
    opponentTilesCount: number;
    myScore: number;
    opponentScore: number;
    isMyTurn: boolean;
    timeRemaining: number | null;
  };
  currentRoundMoves: {
    myMove: {
      tileNumber: number;
      color: "black" | "white";
    } | null;
    opponentMove: {
      color: "black" | "white";
      tileNumber?: number;
    } | null;
  };
  completedRounds: Array<{
    round: number;
    myTile: number;
    opponentTile: number;
    winner: "me" | "opponent" | null;
  }>;
}

interface GameContextType {
  gameState: GameState | null;
  loading: boolean;
  error: string | null;
  submitMove: (tileNumber: number) => Promise<void>;
  abandonGame: () => Promise<void>;
  refetch: () => Promise<void>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

interface GameProviderProps {
  gameId: string;
  children: React.ReactNode;
  pollingInterval?: number; // milliseconds, default 1000
}

export function GameProvider({ gameId, children, pollingInterval = 1000 }: GameProviderProps) {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(true);

  // Fetch game state from API
  const fetchGameState = useCallback(async () => {
    try {
      const response = await fetch(`/api/game/${gameId}`);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to fetch game state: ${response.status}`);
      }

      const data: GameState = await response.json();
      setGameState(data);
      setError(null);

      // Stop polling if game is finished
      if (data.game.status === "COMPLETED" || data.game.status === "ABANDONED") {
        setIsPolling(false);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error fetching game state:", err);
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  // Submit a move
  const submitMove = useCallback(async (tileNumber: number) => {
    try {
      setError(null);
      const response = await fetch(`/api/game/${gameId}/move`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ tileNumber }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to submit move: ${response.status}`);
      }

      // Immediately fetch updated state
      await fetchGameState();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit move";
      setError(errorMessage);
      console.error("Error submitting move:", err);
      throw err; // Re-throw so UI can handle
    }
  }, [gameId, fetchGameState]);

  // Abandon the game
  const abandonGame = useCallback(async () => {
    try {
      setError(null);
      const response = await fetch(`/api/game/${gameId}/abandon`, {
        method: "POST",
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to abandon game: ${response.status}`);
      }

      // Immediately fetch updated state
      await fetchGameState();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to abandon game";
      setError(errorMessage);
      console.error("Error abandoning game:", err);
      throw err;
    }
  }, [gameId, fetchGameState]);

  // Polling effect
  useEffect(() => {
    if (!isPolling) return;

    // Initial fetch
    fetchGameState();

    // Set up polling interval
    const interval = setInterval(() => {
      fetchGameState();
    }, pollingInterval);

    return () => clearInterval(interval);
  }, [isPolling, pollingInterval, fetchGameState]);

  const value: GameContextType = {
    gameState,
    loading,
    error,
    submitMove,
    abandonGame,
    refetch: fetchGameState,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

// Hook to use game context
export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error("useGame must be used within a GameProvider");
  }
  return context;
}
