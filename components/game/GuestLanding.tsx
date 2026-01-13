"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import Link from "next/link";

export function GuestLanding() {
  const router = useRouter();
  const [roomCode, setRoomCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [joiningGame, setJoiningGame] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const joinGameAsGuest = async () => {
    if (!roomCode.trim()) {
      setError("Please enter a room code");
      return;
    }

    setJoiningGame(true);
    setError(null);

    try {
      const response = await fetch("/api/game/join-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          roomCode: roomCode.toUpperCase().trim(),
          guestName: guestName.trim() || undefined,
        }),
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex justify-end mb-4 space-x-2">
            <Link href="/auth/login">
              <Button variant="outline" size="sm">
                Login
              </Button>
            </Link>
            <Link href="/auth/signup">
              <Button variant="primary" size="sm">
                Sign Up
              </Button>
            </Link>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-bold text-gray-800 mb-4">
              Black & White
            </h1>
            <p className="text-xl text-gray-600">A game of pure psychology</p>
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

        {/* Guest Join Section */}
        <Card className="mb-6">
          <CardHeader>
            <h2 className="text-2xl font-bold text-gray-800">Join Game as Guest</h2>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              Enter a room code to join a multiplayer game. No account required!
            </p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Code *
                </label>
                <input
                  type="text"
                  placeholder="Enter room code"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  onKeyPress={(e) => e.key === "Enter" && joinGameAsGuest()}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-mono text-lg uppercase focus:outline-none focus:border-blue-500 text-black"
                  maxLength={6}
                  disabled={joiningGame}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name (Optional)
                </label>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && joinGameAsGuest()}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 text-black"
                  maxLength={20}
                  disabled={joiningGame}
                />
                <p className="text-xs text-gray-500 mt-1">
                  If not provided, a random name will be generated
                </p>
              </div>
              <Button
                onClick={joinGameAsGuest}
                disabled={joiningGame || !roomCode.trim()}
                variant="primary"
                className="w-full"
              >
                {joiningGame ? "Joining..." : "Join Game"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* How to Play */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-800">How to Play</h2>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-gray-700">
              <li>
                • Each player has nine tiles numbered 0-8 (even = black, odd =
                white)
              </li>
              <li>
                • The starting player chooses a tile, but their opponent will
                only get to see its color before playing their own tile
              </li>
              <li>
                • Whoever played the higher number wins the round, then leads
                the next round
              </li>
              <li>• Used tiles are removed from both players</li>
              <li>
                • The game lasts 9 rounds and whoever has the most points at the
                end wins
              </li>
              <li>
                • You have 60 seconds per move or you automatically forfeit
              </li>
              <li>
                • TIP: You learn more, win or lose, if you play the 4 tile first
                - but be careful doing this against someone who knows you know
                this!
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
