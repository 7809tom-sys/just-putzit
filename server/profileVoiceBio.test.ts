import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("profile voice bio", () => {
  const source = readFileSync(resolve(__dirname, "../client/src/pages/Profile.tsx"), "utf8");

  it("reuses shared speech recognition and appends dictated words for review", () => {
    expect(source).toContain('import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"');
    expect(source).toContain("useSpeechRecognition((transcript) =>");
    expect(source).toContain('setBioText((current) => current ? `${current} ${transcript}` : transcript)');
    expect(source).toContain("review your bio before saving");
  });

  it("hides the microphone safely when speech recognition is unavailable", () => {
    expect(source).toContain("{speechSupported && (");
    expect(source).toContain("Voice input is unavailable in this browser");
    expect(source).not.toContain("recognitionRef.current");
  });
});
