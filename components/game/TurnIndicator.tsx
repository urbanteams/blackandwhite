"use client";

import React from "react";

interface TurnIndicatorProps {
  isMyTurn: boolean;
  myMove: { tileNumber: number; color: "black" | "white" } | null;
  opponentMove: { color: "black" | "white"; tileNumber?: number } | null;
}

export function TurnIndicator({ isMyTurn, myMove, opponentMove }: TurnIndicatorProps) {
  return (
    <div className="text-center py-4">
      {isMyTurn ? (
        <div className="bg-green-100 border-2 border-green-500 rounded-lg px-6 py-4">
          <p className="text-2xl font-bold text-green-800">🎮 Your Turn!</p>
          <p className="text-sm text-green-600 mt-1">Select a tile to play</p>
        </div>
      ) : (
        <div className="bg-gray-100 border-2 border-gray-300 rounded-lg px-6 py-4">
          <p className="text-2xl font-bold text-gray-800">⏳ Opponent's Turn</p>
          <p className="text-sm text-gray-600 mt-1">Waiting for opponent to move...</p>
        </div>
      )}

      {/* Current Round Moves Display */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Your Move */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-blue-600 mb-1">Your Move</p>
          {myMove ? (
            <div className="flex items-center justify-center">
              <div
                className={`
                w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl
                ${myMove.color === "black" ? "bg-gray-900 text-white" : "bg-white text-gray-900 border-2 border-gray-300"}
              `}
              >
                {myMove.tileNumber}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Not played yet</p>
          )}
        </div>

        {/* Opponent Move */}
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
          <p className="text-xs font-semibold text-purple-600 mb-1">Opponent Move</p>
          {opponentMove ? (
            <div className="flex items-center justify-center">
              <div
                className={`
                w-12 h-12 rounded-lg flex items-center justify-center font-bold text-xl
                ${opponentMove.color === "black" ? "bg-gray-900 text-white" : "bg-white text-gray-900 border-2 border-gray-300"}
              `}
              >
                {opponentMove.tileNumber !== undefined ? opponentMove.tileNumber : "?"}
              </div>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Not played yet</p>
          )}
        </div>
      </div>
    </div>
  );
}
