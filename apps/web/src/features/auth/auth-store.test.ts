import { describe, expect, it } from "vitest";
import { sanitizeReturnTo } from "./auth-store";

describe("sanitizeReturnTo", () => {
  it("서비스 내부 상대 경로만 허용한다", () => {
    expect(sanitizeReturnTo("/checkout")).toBe("/checkout");
    expect(sanitizeReturnTo("//evil.example")).toBe("/");
    expect(sanitizeReturnTo("https://evil.example")).toBe("/");
    expect(sanitizeReturnTo("/\\evil")).toBe("/");
  });
});
