"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/Card";

interface OpponentInfoProps {
  opponentName: string;
  opponentTilesCount: number;
}

export function OpponentInfo({ opponentName, opponentTilesCount }: OpponentInfoProps) {
  return (
    <Card className="bg-purple-50 border-purple-200">
      <CardContent className="py-4">
        <div className="text-center">
          <h3 className="text-sm font-semibold text-purple-700 mb-2">Opponent</h3>
          <p className="text-lg font-bold text-gray-800 mb-3">{opponentName}</p>
          <div className="flex items-center justify-center space-x-2">
            <span className="text-2xl font-bold text-purple-600">{opponentTilesCount}</span>
            <span className="text-sm text-gray-600">tiles remaining</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
