"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Guest join state
  const [roomCode, setRoomCode] = useState("");
  const [guestName, setGuestName] = useState("");
  const [joiningAsGuest, setJoiningAsGuest] = useState(false);
  const [guestError, setGuestError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Login failed");
      }

      // Redirect to home page after successful login
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGuestJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomCode.trim()) {
      setGuestError("Please enter a room code");
      return;
    }

    setJoiningAsGuest(true);
    setGuestError("");

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
      setGuestError(err instanceof Error ? err.message : "Failed to join game");
      setJoiningAsGuest(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader>
            <h1 className="text-3xl font-bold text-gray-800 text-center">
              Login to Black & White
            </h1>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-black mb-1">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="you@example.com"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-black mb-1">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Enter your password"
                />
              </div>

              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Logging in..." : "Login"}
              </Button>

              <div className="text-center text-sm text-gray-600">
                Don't have an account?{" "}
                <a href="/auth/signup" className="text-blue-600 hover:underline font-semibold">
                  Sign up
                </a>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Guest Join Section */}
        <Card>
          <CardHeader>
            <h2 className="text-xl font-bold text-gray-800 text-center">
              Or Join as Guest
            </h2>
            <p className="text-sm text-gray-600 text-center mt-2">
              No account required! Enter a room code to jump right in.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleGuestJoin} className="space-y-4">
              {guestError && (
                <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-3 rounded">
                  {guestError}
                </div>
              )}

              <div>
                <label htmlFor="roomCode" className="block text-sm font-medium text-black mb-1">
                  Room Code *
                </label>
                <input
                  id="roomCode"
                  type="text"
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg font-mono text-lg uppercase focus:outline-none focus:border-blue-500 text-black"
                  placeholder="XXXXXX"
                  maxLength={6}
                  disabled={joiningAsGuest}
                />
              </div>

              <div>
                <label htmlFor="guestName" className="block text-sm font-medium text-black mb-1">
                  Your Name (Optional)
                </label>
                <input
                  id="guestName"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Enter your name"
                  maxLength={20}
                  disabled={joiningAsGuest}
                />
                <p className="text-xs text-gray-500 mt-1">
                  If not provided, a random name will be generated
                </p>
              </div>

              <Button
                type="submit"
                disabled={joiningAsGuest || !roomCode.trim()}
                variant="secondary"
                className="w-full"
              >
                {joiningAsGuest ? "Joining..." : "Join Game as Guest"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
