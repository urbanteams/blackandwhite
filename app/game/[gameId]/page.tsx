import { GameProvider } from "@/lib/contexts/game-context";
import { GameBoard } from "@/components/game/GameBoard";

export default async function GamePage({
  params,
}: {
  params: Promise<{ gameId: string }>;
}) {
  const { gameId } = await params;

  return (
    <GameProvider gameId={gameId}>
      <GameBoard />
    </GameProvider>
  );
}
