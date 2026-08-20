import { afterEach, describe, expect, it, vi } from "vitest";
import { openKakaoPostcode } from "./kakao-postcode";

describe("kakao postcode adapter", () => {
  afterEach(() => {
    delete window.kakao;
    vi.restoreAllMocks();
  });

  it("공식 검색 결과를 주문서 주소 형식으로 변환한다", async () => {
    const open = vi.fn();
    window.kakao = {
      Postcode: class {
        constructor(options: {
          oncomplete: (data: { zonecode: string; roadAddress: string }) => void;
        }) {
          options.oncomplete({
            zonecode: "06236",
            roadAddress: " 서울특별시 강남구 테헤란로 1 ",
          });
        }

        open = open;
      },
    };
    const onComplete = vi.fn();

    await openKakaoPostcode(onComplete);

    expect(open).toHaveBeenCalledOnce();
    expect(onComplete).toHaveBeenCalledWith({
      postalCode: "06236",
      roadAddress: "서울특별시 강남구 테헤란로 1",
    });
  });
});
