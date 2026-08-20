const KAKAO_POSTCODE_SCRIPT_ID = "kakao-postcode-script";
const KAKAO_POSTCODE_SCRIPT_URL =
  "https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";

type KakaoPostcodeData = {
  zonecode: string;
  roadAddress: string;
};

type KakaoPostcodeConstructor = new (options: {
  oncomplete: (data: KakaoPostcodeData) => void;
}) => { open: () => void };

declare global {
  interface Window {
    kakao?: { Postcode?: KakaoPostcodeConstructor };
  }
}

export type KakaoPostcodeResult = {
  postalCode: string;
  roadAddress: string;
};

let loadingPromise: Promise<void> | null = null;

export function loadKakaoPostcode() {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("주소 검색은 브라우저에서만 사용할 수 있습니다."),
    );
  }
  if (window.kakao?.Postcode) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<void>((resolve, reject) => {
    const existing = document.getElementById(
      KAKAO_POSTCODE_SCRIPT_ID,
    ) as HTMLScriptElement | null;
    const script = existing ?? document.createElement("script");

    const handleLoad = () => {
      if (window.kakao?.Postcode) resolve();
      else reject(new Error("주소 검색 서비스를 초기화하지 못했습니다."));
    };
    const handleError = () => {
      loadingPromise = null;
      reject(new Error("주소 검색 서비스를 불러오지 못했습니다."));
    };

    script.addEventListener("load", handleLoad, { once: true });
    script.addEventListener("error", handleError, { once: true });
    if (!existing) {
      script.id = KAKAO_POSTCODE_SCRIPT_ID;
      script.src = KAKAO_POSTCODE_SCRIPT_URL;
      script.async = true;
      document.head.appendChild(script);
    }
  }).catch((error) => {
    loadingPromise = null;
    throw error;
  });

  return loadingPromise;
}

export async function openKakaoPostcode(
  onComplete: (result: KakaoPostcodeResult) => void,
) {
  await loadKakaoPostcode();
  const Postcode = window.kakao?.Postcode;
  if (!Postcode) {
    throw new Error("주소 검색 서비스를 사용할 수 없습니다.");
  }
  const instance = new Postcode({
    oncomplete: (data) =>
      onComplete({
        postalCode: data.zonecode.replace(/\D/g, "").slice(0, 5),
        roadAddress: data.roadAddress.trim(),
      }),
  });
  instance.open();
}
