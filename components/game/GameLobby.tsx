"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

interface Game {
  id: string;
  roomCode: string;
  gameMode: "AI" | "MULTIPLAYER";
  status: string;
  currentRound: number;
  opponent: {
    id: string;
    email: string;
    username: string;
  } | null;
  isMyTurn: boolean;
  createdAt: string;
  updatedAt: string;
}

export function GameLobby() {
  const router = useRouter();
  const [creatingGame, setCreatingGame] = useState(false);
  const [joiningGame, setJoiningGame] = useState(false);
  const [roomCode, setRoomCode] = useState("");
  const [games, setGames] = useState<Game[]>([]);
  const [loadingGames, setLoadingGames] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllGames, setShowAllGames] = useState(false);

  // Load user's games
  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    try {
      const response = await fetch("/api/game/my-games");
      if (response.ok) {
        const data = await response.json();
        setGames(data.games);
      }
    } catch (err) {
      console.error("Error fetching games:", err);
    } finally {
      setLoadingGames(false);
    }
  };

  const createGame = async (gameMode: "AI" | "MULTIPLAYER") => {
    setCreatingGame(true);
    setError(null);

    try {
      const response = await fetch("/api/game/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gameMode }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create game");
      }

      const data = await response.json();
      router.push(`/game/${data.gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create game");
      setCreatingGame(false);
    }
  };

  const joinGame = async () => {
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setJoiningGame(true);
    setError(null);

    try {
      const response = await fetch("/api/game/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomCode: roomCode.toUpperCase().trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to join game");
      }

      const data = await response.json();
      router.push(`/game/${data.gameId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to join game");
      setJoiningGame(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/auth/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      WAITING: "bg-yellow-100 text-yellow-800",
      IN_PROGRESS: "bg-green-100 text-green-800",
      COMPLETED: "bg-blue-100 text-blue-800",
      ABANDONED: "bg-gray-100 text-gray-800",
    };
    return badges[status as keyof typeof badges] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-end mb-4">
            <Button variant="outline" size="sm" onClick={handleLogout}>
              Logout
            </Button>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">Black & White</h1>
            <p className="text-xl text-gray-600">
              A game of pure psychology
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <Card className="mb-6 bg-red-50 border-red-300">
            <CardContent className="py-4">
              <p className="text-red-700 text-center font-semibold">{error}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* Create Game Section */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-gray-800">Create New Game</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Play Against AI</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Practice against a random AI opponent
                </p>
                <Button
                  onClick={() => createGame("AI")}
                  disabled={creatingGame}
                  className="w-full"
                >
                  {creatingGame ? "Creating..." : "Start AI Game"}
                </Button>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-700 mb-2">Multiplayer</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Create a game and share the room code with a friend
                </p>
                <Button
                  onClick={() => createGame("MULTIPLAYER")}
                  disabled={creatingGame}
                  variant="secondary"
                  className="w-full"
                >
                  {creatingGame ? "Creating..." : "Create Multiplayer Game"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Join Game Section */}
          <Card>
            <CardHeader>
              <h2 className="text-2xl font-bold text-gray-800">Join Game</h2>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Enter a room code to join a multiplayer game
              </p>
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === "Enter" && joinGame()}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-mono text-lg uppercase focus:outline-none focus:border-blue-500 text-black"
                  maxLength={6}
                  disabled={joiningGame}
                />
                <Button
                  onClick={joinGame}
                  disabled={joiningGame || !roomCode.trim()}
                  variant="primary"
                  className="w-full"
                >
                  {joiningGame ? "Joining..." : "Join Game"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game History Section */}
        <Card>
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-800">Game History</h2>
          </CardHeader>
          <CardContent>
            {loadingGames ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading games...</p>
              </div>
            ) : games.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500 text-lg">No games yet. Create or join one!</p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  {(showAllGames ? games : games.slice(0, 3)).map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                      onClick={() => router.push(`/game/${game.id}`)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-1">
                          <span className="font-mono font-bold text-gray-800">
                            {game.roomCode}
                          </span>
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(game.status)}`}
                          >
                            {game.status}
                          </span>
                          <span className="text-sm text-gray-600">
                            {game.gameMode === "AI" ? "🤖 AI" : "👥 Multiplayer"}
                          </span>
                        </div>
                        <div className="text-sm text-gray-600">
                          vs {game.opponent?.username || "Waiting for opponent..."}
                          {game.status === "IN_PROGRESS" && (
                            <span className="ml-2">
                              • Round {game.currentRound}/9
                              {game.isMyTurn && (
                                <span className="text-green-600 font-semibold ml-1">
                                  • Your turn!
                                </span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        {game.status === "COMPLETED" || game.status === "ABANDONED"
                          ? "View"
                          : "Play"}
                      </Button>
                    </div>
                  ))}
                </div>
                {games.length > 3 && (
                  <div className="mt-4 text-center">
                    <Button
                      variant="outline"
                      onClick={() => setShowAllGames(!showAllGames)}
                    >
                      {showAllGames ? "Show Less" : `Show More (${games.length - 3} more)`}
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Game Rules */}
        <Card className="mt-6">
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-800">How to Play</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-700">
              <li>• Each player has tiles numbered 0-8 (even = black, odd = white)</li>
              <li>• Starting player chooses a tile, opponent sees only the COLOR</li>
              <li>• Whoever played the higher number wins the round, then leads the next round</li>
              <li>• Used tiles are removed from both players</li>
              <li>• The game lasts 9 rounds and whoever has the most points at the end wins</li>
              <li>• You have 60 seconds per move or you automatically forfeit</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
