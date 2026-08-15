import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("administrator shared-question workspace", () => {
  it("renders the protected review tab and keeps publication as a separate action", () => {
    const source = readFileSync(resolve(__dirname, "../client/src/pages/Admin.tsx"), "utf8");
    expect(source).toContain('value="shared-questions"');
    expect(source).toContain("trpc.sharedQuestionAdmin.list.useQuery");
    expect(source).toContain("trpc.sharedQuestionAdmin.approve.useMutation");
    expect(source).toContain("trpc.sharedQuestionAdmin.publish.useMutation");
    expect(source).toContain("trpc.sharedQuestionAdmin.retire.useMutation");
    expect(source).toContain("It is still not live until published.");
  });
});
