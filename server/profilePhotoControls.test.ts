import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("secure profile photo controls", () => {
  it("keeps authenticated image validation and member replacement/removal controls wired", () => {
    const root = resolve(__dirname, "..");
    const upload = readFileSync(resolve(root, "server/photoUpload.ts"), "utf8");
    const profile = readFileSync(resolve(root, "client/src/pages/Profile.tsx"), "utf8");
    expect(upload).toContain("limits: { fileSize: 10 * 1024 * 1024 }");
    expect(upload).toContain('file.mimetype.startsWith("image/")');
    expect(upload).toContain("if (!ctx.user)");
    expect(profile).toContain("Add your first photo");
    expect(profile).toContain("Set Primary");
    expect(profile).toContain("deletePhoto.mutate");
  });
});
