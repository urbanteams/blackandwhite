import { prisma } from "@/lib/prisma";

/**
 * Keep only the last 3 games for a user.
 * Deletes older completed or abandoned games.
 *
 * @param userId - The user ID to clean up games for
 */
export async function cleanupOldGames(userId: string): Promise<void> {
  try {
    // Find all games where user is player1 or player2, ordered by most recent
    const userGames = await prisma.game.findMany({
      where: {
        OR: [
          { player1Id: userId },
          { player2Id: userId },
        ],
        status: {
          in: ["COMPLETED", "ABANDONED"],
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
      select: {
        id: true,
      },
    });

    // Keep only the last 3, delete the rest
    if (userGames.length > 3) {
      const gamesToDelete = userGames.slice(3).map((game) => game.id);

      await prisma.game.deleteMany({
        where: {
          id: {
            in: gamesToDelete,
          },
        },
      });

      console.log(`Cleaned up ${gamesToDelete.length} old games for user ${userId}`);
    }
  } catch (error) {
    // Don't throw - cleanup is non-critical
    console.error("Error cleaning up old games:", error);
  }
}
