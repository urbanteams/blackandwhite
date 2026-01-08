"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";

interface ScoreDisplayProps {
  myScore: number;
  opponentScore: number;
  myName: string;
  opponentName: string;
  currentRound: number;
}

export function ScoreDisplay({
  myScore,
  opponentScore,
  myName,
  opponentName,
  currentRound,
}: ScoreDisplayProps) {
  return (
    <Card className="bg-gradient-to-br from-blue-50 to-purple-50">
      <CardContent className="py-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Round {currentRound} of 9</h2>
        </div>

        <div className="grid grid-cols-2 gap-6 items-end">
          {/* Your Score */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2 min-h-[40px] flex items-center justify-center">{myName} (You)</p>
            <div className="bg-blue-600 text-white rounded-lg py-4 px-6">
              <p className="text-4xl font-bold">{myScore}</p>
            </div>
          </div>

          {/* Opponent Score */}
          <div className="text-center">
            <p className="text-sm font-medium text-gray-600 mb-2 min-h-[40px] flex items-center justify-center">{opponentName}</p>
            <div className="bg-purple-600 text-white rounded-lg py-4 px-6">
              <p className="text-4xl font-bold">{opponentScore}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
