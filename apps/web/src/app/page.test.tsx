import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HomePage from "./page";

describe("HomePage", () => {
  it("GRAF와 SHOP 탐색 진입점을 표시한다", () => {
    render(<HomePage />);

    expect(
      screen.getByRole("link", { name: "STAYGRAF 홈" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: /공간에서 발견한 자재를/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "새로운 GRAF" }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(7);
  });
});
