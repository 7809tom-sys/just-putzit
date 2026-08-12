import { useState, type CSSProperties } from "react";
import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CELEBRATION_CONFETTI,
  isGameCompletionSoundEnabled,
  setGameCompletionSoundEnabled,
} from "@/lib/gameCelebration";

export function GameCompletionCelebration() {
  const [soundEnabled, setSoundEnabled] = useState(() => isGameCompletionSoundEnabled());
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    setGameCompletionSoundEnabled(next);
  };

  return (
    <>
      <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-52 overflow-hidden">
        {CELEBRATION_CONFETTI.map((piece, index) => (
          <span
            key={`${piece.left}-${index}`}
            className="game-confetti"
            style={{
              left: piece.left,
              backgroundColor: piece.color,
              "--confetti-x": `${piece.x}px`,
              "--confetti-delay": `${piece.delay}ms`,
              transform: `rotate(${index % 2 === 0 ? 18 : -24}deg)`,
            } as CSSProperties}
          />
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="absolute right-3 top-3 z-10 rounded-full bg-card/75 text-xs backdrop-blur hover:bg-card"
        onClick={toggleSound}
        aria-pressed={soundEnabled}
      >
        {soundEnabled ? <Volume2 className="mr-1.5 h-3.5 w-3.5" /> : <VolumeX className="mr-1.5 h-3.5 w-3.5" />}
        {soundEnabled ? "Sound on" : "Sound off"}
      </Button>
    </>
  );
}
