import { GameLobby } from "@/components/game/GameLobby";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function Home() {
  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return <GameLobby />;
}
