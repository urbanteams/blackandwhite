"use client";

import React from "react";

interface GameTimerProps {
  timeRemaining: number | null;
}

export function GameTimer({ timeRemaining }: GameTimerProps) {
  if (timeRemaining === null) {
    return null;
  }

  const isLowTime = timeRemaining <= 10;

  return (
    <div className="text-center">
      <p className="text-sm font-medium text-gray-600 mb-2">Time Remaining</p>
      <div
        className={`
        inline-block px-6 py-3 rounded-lg font-bold text-3xl
        transition-colors duration-300
        ${
          isLowTime
            ? "bg-red-600 text-white animate-pulse"
            : "bg-gray-100 text-gray-800"
        }
      `}
      >
        {timeRemaining}s
      </div>
      {isLowTime && (
        <p className="text-sm text-red-600 font-semibold mt-2 animate-bounce">
          Hurry! Time running out!
        </p>
      )}
    </div>
  );
}
