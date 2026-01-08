"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";

interface RoundHistoryProps {
  completedRounds: Array<{
    round: number;
    myTile: number;
    opponentTile: number;
    winner: "me" | "opponent" | null;
  }>;
  gameComplete: boolean;
}

export function RoundHistory({ completedRounds, gameComplete }: RoundHistoryProps) {
  if (completedRounds.length === 0) {
    return null;
  }

  const getTileColor = (tileNumber: number): "black" | "white" => {
    return tileNumber % 2 === 0 ? "black" : "white";
  };

  return (
    <Card>
      <CardHeader>
        <h3 className="text-lg font-semibold text-gray-800">Round History</h3>
      </CardHeader>
      <CardContent className="max-h-[600px] overflow-y-auto">
        <div className="space-y-2">
          {completedRounds.map(({ round, myTile, opponentTile, winner }) => {
            const myColor = getTileColor(myTile);
            const oppColor = getTileColor(opponentTile);

            return (
              <div
                key={round}
                className={`
                  flex items-center justify-between p-3 rounded-lg border-2
                  ${
                    winner === "me"
                      ? "bg-green-50 border-green-300"
                      : winner === "opponent"
                        ? "bg-red-50 border-red-300"
                        : "bg-gray-50 border-gray-300"
                  }
                `}
              >
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-semibold text-gray-600">R{round}</span>

                  {/* Always show tile colors */}
                  <div
                    className={`
                      w-10 h-10 rounded flex items-center justify-center font-bold text-sm
                      ${myColor === "black" ? "bg-gray-900 text-white" : "bg-white text-gray-900 border-2 border-gray-300"}
                    `}
                  >
                    {gameComplete ? myTile : ""}
                  </div>

                  <span className="text-gray-400">vs</span>

                  <div
                    className={`
                      w-10 h-10 rounded flex items-center justify-center font-bold text-sm
                      ${oppColor === "black" ? "bg-gray-900 text-white" : "bg-white text-gray-900 border-2 border-gray-300"}
                    `}
                  >
                    {gameComplete ? opponentTile : ""}
                  </div>
                </div>

                {/* Winner Badge */}
                <div className="text-sm font-semibold">
                  {winner === "me" ? (
                    <span className="text-green-700">✓ You Won</span>
                  ) : winner === "opponent" ? (
                    <span className="text-red-700">✗ Lost</span>
                  ) : (
                    <span className="text-gray-500">- Tie</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
