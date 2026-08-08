import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ProductCard } from "./ProductCard";
import { products } from "./sample-data";

describe("ProductCard", () => {
  it("옵션 썸네일을 선택하면 대표 이미지를 변경한다", async () => {
    const user = userEvent.setup();
    render(<ProductCard product={products[0]} />);

    expect(screen.getByAltText("아이보리 트래버틴 옵션")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "실버 이미지 보기" }));
    expect(screen.getByAltText("실버 트래버틴 옵션")).toBeInTheDocument();
  });
});
