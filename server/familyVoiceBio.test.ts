import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Family voice bio", () => {
  const source = readFileSync(resolve(__dirname, "../client/src/pages/Family.tsx"), "utf8");

  it("reuses shared speech recognition and appends family bio transcripts for review", () => {
    expect(source).toContain('import { useSpeechRecognition } from "@/hooks/useSpeechRecognition"');
    expect(source).toContain("useSpeechRecognition((transcript) =>");
    expect(source).toContain('setBio((current) => current ? `${current} ${transcript}` : transcript)');
    expect(source).toContain('renderBioEditor(4, "family-bio-setup")');
    expect(source).toContain('renderBioEditor(3, "family-bio-edit")');
  });

  it("keeps saving member-controlled and provides an unsupported-browser fallback", () => {
    expect(source).toContain("onClick={isListening ? stopListening : startListening}");
    expect(source).toContain("review the bio before saving");
    expect(source).toContain("Voice input is unavailable in this browser");
  });
});
