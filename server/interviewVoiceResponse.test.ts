import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Sally interview voice responses", () => {
  const root = resolve(__dirname, "..");
  const interview = readFileSync(resolve(root, "client/src/pages/Interview.tsx"), "utf8");
  const hook = readFileSync(resolve(root, "client/src/hooks/useSpeechRecognition.ts"), "utf8");

  it("supports browser speech recognition and appends a transcript for member review", () => {
    expect(hook).toContain("SpeechRecognition ?? browserWindow.webkitSpeechRecognition");
    expect(interview).toContain("useSpeechRecognition((transcript) =>");
    expect(interview).toContain('setInput((current) => current ? `${current} ${transcript}` : transcript)');
    expect(interview).toContain("review your words before sending");
  });

  it("does not submit a response automatically after speech transcription", () => {
    expect(interview).toContain("onClick={isListening ? stopListening : startListening}");
    expect(interview).toContain("disabled={!input.trim() || isSending || isComplete}");
  });
});
