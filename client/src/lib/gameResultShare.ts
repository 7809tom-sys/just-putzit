export const GAME_RESULT_SHARE_PATH = "/social-games";

export type GameResultShareData = {
  title: string;
  text: string;
  url: string;
};

export function buildGameResultShareData(gameTitle: string, origin: string): GameResultShareData {
  return {
    title: `I played ${gameTitle} on Just Putzit`,
    text: `I just played ${gameTitle} on Just Putzit—finding more ways to enjoy my community. What’s your local favorite?`,
    url: `${origin.replace(/\/$/, "")}${GAME_RESULT_SHARE_PATH}`,
  };
}

export type ShareGameResultOutcome = "shared" | "copied" | "cancelled" | "unavailable";

export async function shareGameResult(gameTitle: string): Promise<ShareGameResultOutcome> {
  if (typeof window === "undefined") return "unavailable";
  const shareData = buildGameResultShareData(gameTitle, window.location.origin);

  try {
    if (navigator.share && (!navigator.canShare || navigator.canShare(shareData))) {
      await navigator.share(shareData);
      return "shared";
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
  }

  try {
    if (!navigator.clipboard?.writeText) return "unavailable";
    await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
    return "copied";
  } catch {
    return "unavailable";
  }
}
