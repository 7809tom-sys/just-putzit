import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("optional biometric enrollment from profile", () => {
  it("offers passkey setup only when the device check is incomplete", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Profile.tsx"), "utf8");
    expect(source).toContain("!deviceCheckComplete");
    expect(source).toContain("Set up passkey");
    expect(source).toContain("utils.passkey.registrationOptions.fetch()");
    expect(source).toContain("startRegistration");
    expect(source).toContain("verifyPasskeyRegistration.mutateAsync");
  });

  it("shows a distinct passkey badge only from the verified device-check state", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Profile.tsx"), "utf8");
    expect(source).toContain("deviceCheckComplete && (");
    expect(source).toContain("Device passkey verified");
  });

  it("keeps the Login passkey utility hook inside the component scope", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Login.tsx"), "utf8");
    const componentStart = source.indexOf("export default function Login() {");
    const utilsHook = source.indexOf("const utils = trpc.useUtils();");
    const authOptions = source.indexOf("utils.passkey.authOptions.fetch({ email })");
    expect(componentStart).toBeGreaterThan(-1);
    expect(utilsHook).toBeGreaterThan(componentStart);
    expect(authOptions).toBeGreaterThan(utilsHook);
  });
});
