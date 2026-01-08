"use client";

import React from "react";

interface TileSelectorProps {
  availableTiles: number[];
  onSelectTile: (tileNumber: number) => void;
  disabled?: boolean;
  selectedTile?: number | null;
}

export function TileSelector({
  availableTiles,
  onSelectTile,
  disabled = false,
  selectedTile = null,
}: TileSelectorProps) {
  const getTileColor = (tileNumber: number): "black" | "white" => {
    return tileNumber % 2 === 0 ? "black" : "white";
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Your Tiles</h3>
      <div className="grid grid-cols-3 gap-3">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((tileNumber) => {
          const isAvailable = availableTiles.includes(tileNumber);
          const isSelected = selectedTile === tileNumber;
          const color = getTileColor(tileNumber);

          return (
            <button
              key={tileNumber}
              onClick={() => !disabled && isAvailable && onSelectTile(tileNumber)}
              disabled={!isAvailable || disabled}
              className={`
                relative aspect-square rounded-lg font-bold text-2xl
                transition-all duration-200 transform
                ${
                  isAvailable
                    ? "cursor-pointer hover:scale-105 active:scale-95"
                    : "cursor-not-allowed opacity-30"
                }
                ${
                  color === "black"
                    ? "bg-gray-900 text-white border-4 border-gray-700"
                    : "bg-white text-gray-900 border-4 border-gray-300"
                }
                ${isSelected ? "ring-4 ring-blue-500 scale-105" : ""}
                ${disabled && isAvailable ? "opacity-50" : ""}
              `}
            >
              {tileNumber}
              {!isAvailable && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-full h-1 bg-red-500 transform rotate-45" />
                  <div className="w-full h-1 bg-red-500 transform -rotate-45 absolute" />
                </div>
              )}
            </button>
          );
        })}
      </div>
      {disabled && availableTiles.length > 0 && (
        <p className="text-sm text-gray-500 text-center">
          {selectedTile !== null ? "Move submitted! Waiting for opponent..." : "Waiting for your turn..."}
        </p>
      )}
    </div>
  );
}
