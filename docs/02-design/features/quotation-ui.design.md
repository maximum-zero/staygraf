# 구매 전 견적서 UI 설계서

> **Summary**: 장바구니 선택 묶음을 일반 견적서 미리보기·발행 스냅샷·이력·A4 출력으로 연결하는 Starter 설계
>
> **Author**: STAYGRAF Team
> **Date**: 2026-08-21
> **Status**: Approved
> **Level**: Starter
> **Plan**: [quotation-ui.plan.md](../../01-plan/features/quotation-ui.plan.md)

---

## 1. 구현 대상

장바구니에서 선택한 구매 가능 묶음을 로그인 이후 견적 초안으로 만들고, 수신 정보를 입력한 뒤 일반적인 국내 견적서 형식으로 미리보기·발행한다. 발행본은 현재 카탈로그와 분리된 스냅샷으로 브라우저에 저장하며 최소 마이페이지 셸의 견적 이력에서 다시 열고 인쇄·PDF 저장할 수 있다.

실제 API·DB·서버 PDF는 연결하지 않는다. 브라우저 저장 책임과 순수 계산 책임을 UI에서 분리해 이후 서버 repository로 교체할 수 있게 한다.

핵심 원칙은 다음과 같다.

- 장바구니는 현재 구매 구성이고 견적서는 발행 시점 기록이다.
- 화면 입력·이력은 기존 STAYGRAF 커머스 UI를 따르고 발행 문서는 일반 견적서 형식을 따른다.
- 발행 전에는 현재 가격을 재검증하고 발행 후에는 저장된 가격을 유지한다.
- 발행은 장바구니를 변경하거나 재고를 확보하지 않는다.
- 문서 식별 정보는 장식보다 정확한 품명·브랜드·옵션·규격·단위를 우선한다.

---

## 2. 페이지와 이동

| 화면 | 경로 | 진입 조건 | 이탈 경로 |
|---|---|---|---|
| 견적 정보 입력 | `/quotes/new` | 로그인·활성 견적 초안 | 장바구니 또는 미리보기 |
| 견적서 미리보기 | `/quotes/preview` | 로그인·유효한 초안·계산 결과 | 정보 수정 또는 발행본 |
| 견적 이력 | `/mypage/quotes` | 로그인 | 견적 발행본 |
| 견적 발행본 | `/mypage/quotes/[quoteId]` | 로그인·본인 발행본 | 이력 또는 장바구니 |

### 2.1 장바구니 진입

1. `CartPage.validateNextStep("quote")`에서 현재 선택 묶음을 다시 resolve한다.
2. 선택 없음 또는 유효하지 않은 묶음이 있으면 장바구니 인접 피드백으로 이동을 막는다.
3. 유효한 묶음 ID와 현재 가격 지문으로 견적 초안을 시작한다.
4. 로그인 회원이면 `/quotes/new`, 비로그인이면 `/login?returnTo=/quotes/new`로 이동한다.
5. 견적 진입은 장바구니 선택·수량·배송을 변경하지 않는다.

### 2.2 직접 접근 복구

- `/quotes/new`에 초안이 없으면 `/cart`로 안내한다.
- 비로그인 접근은 검증된 내부 `returnTo`를 사용해 로그인으로 이동한다.
- 초안의 `memberId`와 현재 로그인 회원이 다르면 초안을 제거하고 장바구니로 안내한다.
- `/quotes/preview`의 초안 또는 계산 결과가 없으면 `/quotes/new`로 이동한다.
- 발행 ID가 이미 기록된 초안으로 재진입하면 기존 발행본으로 이동한다.
- 이력 단건이 없거나 다른 회원 소유면 찾을 수 없음 상태를 표시한다.

### 2.3 발행 완료 이동

- 발행 스냅샷 저장 후 초안에 `issuedQuotationId`를 먼저 기록한다.
- `/mypage/quotes/[quoteId]`로 `router.replace` 이동한다.
- 발행본을 확인한 후 초안은 제거한다.
- 저장 중 새로고침이 발생해도 기록된 발행 ID로 기존 발행본을 복원한다.

---

## 3. 화면 구조

### 3.1 견적 정보 입력 — 데스크톱 1024px 이상

```text
CommerceHeader
< 장바구니
견적서 만들기
정보 입력 ─ 검토 및 발행

┌ 수신 정보 1fr ─────────────────────┐  ┌ 견적 요약 344px sticky ─┐
│ 견적명 또는 현장명 (선택)           │  │ 선택 상품 N묶음          │
│ 수신처                              │  │ 상품 금액                 │
│ 담당자명                            │  │ 상품 할인                 │
│ 연락처                              │  │ 선불 배송비               │
│ 이메일 (선택)                       │  │ 견적 합계                 │
│                                     │  │ 착불 운송비 별도           │
│ 선택 상품 접힘 요약                 │  │ [견적서 미리보기]          │
│ 장바구니에서 수정                   │  └──────────────────────────┘
└─────────────────────────────────────┘
```

- shell은 기존 헤더와 같은 최대 1280px이다.
- 본문과 요약은 `minmax(0, 1fr) 344px`, gap 32px이다.
- 요약은 `top: 92px` sticky이며 viewport보다 높지 않게 한다.
- 상품 구성은 편집하지 않고 배송 그룹·본품·추가 상품을 접힘 요약으로만 확인한다.
- 필드 오류는 blur 이후 해당 필드 바로 아래에 표시한다.

### 3.2 견적 정보 입력 — 태블릿·모바일

- 768~1023px에서는 요약을 폼 아래 일반 흐름으로 이동하고 고정 CTA를 사용하지 않는다.
- 767px 이하에서는 16px gutter의 한 열로 구성한다.
- 모바일 하단에는 `총 견적 금액`과 `견적서 미리보기`를 52px CTA로 고정한다.
- 본문 하단에는 고정 영역 높이와 safe area를 포함한 여백을 예약한다.
- 모바일 키보드가 열린 상태에서 오류 필드와 CTA가 가려지지 않아야 한다.

### 3.3 견적서 미리보기

```text
CommerceHeader
< 정보 수정
견적서 미리보기                        발행 전

┌ 일반 견적서 문서 ──────────────────────────────┐
│                     견 적 서                    │
│ 작성일자·유효기간                              │
│ 수신자 정보                 공급자 정보         │
│ 아래와 같이 견적합니다.                        │
│ 견적금액 일금 ...원정 / 숫자 금액              │
│ 품목 표                                        │
│ 금액 합계                                      │
│ 견적 조건                                      │
└────────────────────────────────────────────────┘

[수정하기]                               [견적서 발행]
```

- 모달이 아닌 독립 페이지다.
- 데스크톱 문서 영역은 화면 최대 920px 안에서 A4 비율의 폭을 유지하되 높이는 콘텐츠에 따라 늘어난다.
- 화면에 임의 페이지 번호나 가짜 페이지 절취선을 만들지 않는다.
- 하단 행동 영역은 긴 문서에서 접근할 수 있게 sticky로 두며 인쇄 시 숨긴다.
- 발행 클릭 후 `발행 후 수정할 수 없음`을 확인하는 대화상자를 한 번 제공한다.

### 3.4 발행본

- 미리보기와 동일한 `QuotationDocument`를 사용한다.
- `발행 전` 대신 견적번호·발행일·유효기간과 `유효/만료` 상태를 표시한다.
- `수정하기`, `견적서 발행`은 제거한다.
- `인쇄·PDF 저장`, `견적 이력 보기`, `장바구니로`를 제공한다.
- 만료 상태에서도 저장 스냅샷을 그대로 열고 인쇄할 수 있다.

### 3.5 최소 마이페이지 셸과 이력

데스크톱:

```text
CommerceHeader
마이페이지
┌ LNB 176px ─┐  ┌ 견적서 이력 ─────────────────────────────┐
│ 견적서      │  │ 견적번호 | 견적명 | 수신처 | 발행일 ... │
└─────────────┘  └──────────────────────────────────────────┘
```

모바일:

```text
마이페이지 > 견적서
[유효] SGQ-20260821-A7K2
성수동 카페 바닥 타일
○○인테리어 · 2026.08.21
193,000원
```

- 이번에는 LNB에 `견적서`만 활성 항목으로 제공한다.
- 미구현 프로필·주문·좋아요 링크를 만들지 않는다.
- 로그인한 헤더 계정 행동은 `/mypage/quotes`로 연결한다.
- 비로그인 계정 행동은 `/login?returnTo=/mypage/quotes`로 연결한다.
- 이력은 최신 발행 순이며 검색·필터·삭제·페이지네이션을 제공하지 않는다.

---

## 4. 일반 견적서 문서 설계

> 최종 시각 방향: 한국 B2B 모던 실무형. A4 세로·8열 표·계산 구조는 유지하고, 세로 라벨과 무거운 총액 박스를 걷어내 정보 밀도와 인쇄 가독성을 높인다.

### 4.1 문서 머리

```text
STAYGRAF                    견 적 서                    견적번호

견적번호 SGQ-20260821-A7K2        작성일자 2026.08.21
견적명   성수동 카페 바닥 타일     유효기간 발행일로부터 14일

┌ 받는 분 ────────────────┐  ┌ 공급자 ──────────────────┐
│ 수신처   ○○인테리어 귀하 │  │ 등록번호 000-00-00000    │
│ 담당자   홍길동           │  │ 상호     STAYGRAF         │
│ 연락처   010-...          │  │ 대표자   미등록           │
│ 이메일   ...              │  │ 주소·업태·종목·연락처     │
└───────────────────────────┘  └───────────────────────────┘
```

- 문서 제목은 중앙 정렬하지만 화면 페이지 제목처럼 과도하게 키우지 않는다.
- 좌측에는 이미지 로고 대신 작은 단색 `STAYGRAF` 워드마크를 둔다.
- `받는 분`, `공급자`는 가로 제목으로 두고 내부 라벨·값 행을 같은 축에 정렬한다.
- 수신처 상호에는 `귀하`를 붙이고, 공급자 대표자 값이 비어 있거나 `미등록`이면 해당 행을 숨긴다.
- 공급자 전화번호는 공급자 정보 블록에 포함한다.
- 공급자 모의 정보는 `issuer-profile.ts` 한 곳에서만 정의한다.
- 이메일이 없는 수신자는 빈 행을 출력하지 않는다.
- 직인 자리, `(인)`, 로고 워터마크, 계좌 정보는 표시하지 않는다.

### 4.2 총 견적금액

```text
견적금액  일금 일십구만삼천원정
          ₩193,000 (부가가치세 포함)
```

- 총액은 약 48~56px 높이의 상하선 밴드로 표현하고 무거운 사방 테두리는 사용하지 않는다.
- 한글 금액 변환은 순수 함수로 구현하고 숫자 합계와 동일한 입력만 사용한다.
- 0, 만, 억, 조 단위와 내부 0 처리를 단위 테스트한다.

### 4.3 품목 표

```text
No. | 품명 | 규격·옵션 | 수량 | 단위 | 단가(VAT 포함) | 공급가액 | 세액
```

- 품목표 우측 상단에 `(단위: 원)`을 표시한다.
- 금액 셀은 쉼표가 포함된 숫자만 사용하고, 독립된 합계 금액에는 `원`을 붙인다.
- 추가 상품 품명 앞에는 접근성 트리에 포함되지 않는 `└` 형태 장식선을 표시한다.

- 품명은 `[브랜드] 상품명` 한 줄에서 시작한다.
- 상품명은 자연 줄바꿈하며 발행 문서에는 line-clamp와 말줄임표를 사용하지 않는다.
- 컬렉션은 독립 출력하지 않는다. 제품 식별에 필요하면 상품명 원본에 포함한다.
- `규격·옵션`은 반복 라벨 없이 최대 2줄을 기본으로 압축한다.

```text
화이트 · 600×600mm
4장/BOX · 1.44㎡/BOX
```

- 현재 데이터의 `optionLabel`은 `색상`, `variantLabel`은 `규격`으로 매핑한다.
- `piecesPerOrder`, `coveragePerOrder`, 주문 수량으로 포장 구성과 총 주문 면적을 계산해 같은 셀에 표시한다.
- 주문 수량이 1이면 단위 면적과 총 주문 면적이 같으므로 총 주문 면적을 반복하지 않는다.
- `PIECE` 주문 단위는 포장 수량 대신 `1장당 면적`과 총 주문 면적을 표시한다.
- 로스율·권장 수량은 발행 스냅샷의 사실값이 아니므로 출력하지 않는다.
- 향후 옵션 그룹이 늘어나면 `{label, value}` 배열을 그대로 행 단위로 출력한다.
- 본품 No.가 `1`이면 추가 상품은 `1-1`, `1-2`다.
- 추가 상품의 본품 종속 관계는 번호와 품명 들여쓰기로만 표현한다. 규격·옵션 셀에는 실제 속성만 표시하고 없으면 비워 둔다.
- 상품 이미지·브랜드 배지·배송 배지는 출력하지 않는다.

### 4.4 배송 조건

- 배송 그룹 제목은 표 내부 행으로 삽입하지 않는다.
- 표 아래에는 `화물 택배 배송 / 선불`처럼 배송 방식과 비용 조건만 표시한다.
- 품목 순번은 표 안에서만 사용하며 배송 조건에는 반복하지 않는다.
- 화물 택배 배송의 선불 비용은 각 상품별 별도 비용 행으로 표시한다.
- 선불 배송비 행은 `- / 화물 택배 배송비 / 상품 묶음 N건 / 건 / 1 / ...`로 표시하고 그룹 제목에 금액을 중복하지 않는다.
- 개별 화물 운송 그룹은 `착불 별도`를 제목과 견적 조건에 표시한다.
- 직접 수령 그룹은 비용 행 없이 `배송비 0원` 조건을 표시한다.
- 구분은 인쇄 배경색에만 의존하지 않고 굵기와 상하선으로도 전달한다.

### 4.5 금액 합계

할인 상품이 없을 때:

```text
상품 금액       168,000원
선불 배송비      25,000원
공급가액        175,455원
부가가치세       17,545원
견적 합계       193,000원
```

할인 상품이 있을 때:

```text
정상 상품금액    180,000원
상품 할인        -12,000원
선불 배송비       25,000원
공급가액         175,455원
부가가치세        17,545원
견적 합계        193,000원
```

- 품목 표의 적용 단가는 실제 판매가다.
- 취소선 정상가는 표에 반복하지 않고 전체 할인액을 합계에서 한 번 보여준다.
- 쿠폰·회원 등급·업체 할인 행은 만들지 않는다.
- 할인액이 0이면 `상품 금액`, 할인액이 있으면 `정상 상품금액`으로 합계 라벨을 전환한다.

### 4.6 견적 조건

- 견적 유효기간: 견적일로부터 14일
- 견적서는 주문 확정 및 재고 확보 문서가 아님
- 상품·가격·할인은 발행 시점을 기준으로 함
- 개별 화물 운송비는 착불이며 견적 합계에서 제외됨
- 여러 배송 방식이 있으면 그룹별 조건을 각각 표시
- 납품기한과 결제조건은 정책이 없으므로 출력하지 않음

### 4.7 미리보기·인쇄 반응형

- 900px 이상 미리보기 문서는 `210mm` 고정 폭, `12mm` 내부 여백으로 표시해 A4 인쇄 줄바꿈과 맞춘다.
- 899px 이하에서는 동일한 시맨틱 표를 카드형으로 재배치하고 가로 스크롤을 만들지 않는다.
- 인쇄 시 본문·표·조건·푸터는 최소 9pt, 행간은 1.35 이상을 유지한다.
- `<thead>`의 열 머리글은 페이지마다 반복한다.
- 첫 페이지에도 반복되는 인쇄 전용 견적번호·수신처 행은 사용하지 않는다. 2페이지 이후 반복 문맥과 페이지 번호는 서버 PDF 단계에서 처리한다.
- 품목 행에는 `break-inside: avoid`를 적용한다.
- 15~30개 품목은 여러 페이지로 자연스럽게 출력하고 임의 축소하지 않는다.

---

## 5. 상태 모델

### 5.1 견적 폼

```ts
type QuotationFormValues = {
  title: string;
  recipientName: string;
  managerName: string;
  phone: string;
  email: string;
};
```

- Zod와 React Hook Form을 사용한다.
- `title`은 선택·최대 50자다.
- 수신처·담당자·연락처는 필수다.
- 이메일은 비어 있거나 유효한 이메일이어야 한다.
- 연락처는 숫자 입력을 허용하고 화면에서 국내 전화번호 형식으로 정규화한다.
- 기본값은 회원명·전화·이메일에서 생성하되 수신처는 비워둔다.

### 5.2 초안

```ts
type QuotationDraft = {
  id: string;
  memberId: string;
  selectedBundleIds: string[];
  values: QuotationFormValues;
  step: "form" | "preview";
  entryFingerprint: string;
  previewCalculation: QuotationCalculation | null;
  priceChanges: QuotationPriceChange[];
  issuedQuotationId: string | null;
  createdAt: number;
  updatedAt: number;
};
```

- 저장 key: `staygraf-quotation-draft`
- 저장 위치: `sessionStorage`
- version: `1`
- 활성 초안은 회원별 한 건이다.
- 같은 묶음 선택으로 재진입하면 입력값을 유지하고 현재 가격을 갱신한다.
- 다른 묶음 선택으로 진입하면 새 초안으로 교체한다.
- 로그아웃·회원 불일치·발행 완료 시 제거한다.

### 5.3 금액

```ts
type MoneySnapshot = {
  includingVat: number;
  supply: number;
  vat: number;
};

type PriceSnapshot = {
  regularIncludingVat: number;
  appliedIncludingVat: number;
  discountIncludingVat: number;
};
```

```text
행 포함가 = 적용 단가 × 수량
행 공급가액 = round(행 포함가 ÷ 1.1)
행 부가세 = 행 포함가 - 행 공급가액
```

- 정상가와 할인가의 차이는 0 이상으로 정규화한다.
- 현재 카탈로그에는 할인 데이터가 없어 화면 기본 예시는 할인 없음이다.
- 견적 resolver와 단위 테스트는 선택 `salePriceIncludingVat`을 처리할 수 있게 한다.
- 기존 상품 목록·상세 할인 UI는 이번 범위에서 변경하지 않는다.
- 실제 할인 상품 데이터가 추가되면 공통 적용가 helper를 카탈로그·상세·장바구니·주문과 공유해야 한다.

### 5.4 발행 행

```ts
type QuotationLineSnapshot = {
  id: string;
  kind: "main" | "additional" | "shipping";
  number: string;
  parentNumber: string | null;
  productId: string | null;
  brand: string;
  name: string;
  options: Array<{ label: string; value: string }>;
  unitLabel: string;
  quantity: number;
  unitPrice: PriceSnapshot;
  totalPrice: MoneySnapshot;
};
```

- `shipping` 행은 선불 배송비에만 생성한다.
- 추가 상품은 `parentNumber`로 본품 번호를 참조한다.
- 발행본은 카탈로그를 다시 조회하지 않고 이 데이터만 사용한다.

### 5.5 공급자·수신자

```ts
type IssuerSnapshot = {
  businessName: string;
  businessNumber: string;
  representative: string;
  address: string;
  businessType: string;
  businessCategory: string;
  phone: string;
  email: string;
};

type RecipientSnapshot = {
  name: string;
  managerName: string;
  phone: string;
  email: string;
};
```

### 5.6 발행본

```ts
type QuotationSnapshot = {
  id: string;
  draftId: string;
  idempotencyKey: string;
  quotationNumber: string;
  memberId: string;
  title: string;
  issuedAt: number;
  validUntil: number;
  issuer: IssuerSnapshot;
  recipient: RecipientSnapshot;
  lines: QuotationLineSnapshot[];
  shippingGroups: ShippingGroupSnapshot[];
  regularProductTotal: number;
  discountTotal: number;
  productTotal: number;
  prepaidShippingTotal: number;
  supplyTotal: number;
  vatTotal: number;
  quotationTotal: number;
  hasCollectShipping: boolean;
  terms: string[];
  version: 1;
};
```

- 저장 key: `staygraf-quotations`
- 저장 위치: `localStorage`
- version: `1`
- 자동 보관 만료와 개수 제한은 두지 않는다.
- `quotationNumber`, `idempotencyKey`, `id` 중복을 막는다.
- `validUntil`은 발행일 다음 날부터 14일차가 끝나는 시각(Asia/Seoul 23:59:59)으로 생성한다.
- `유효/만료`는 현재 시각과 `validUntil`로 계산한다.

---

## 6. 계산·검증 전이

### 6.1 상태 흐름

```text
hydrating
  ├─ 비로그인 ───────────────> login redirect
  ├─ 초안 없음 ──────────────> cart recovery
  └─ 정상 ───────────────────> form

form
  ├─ field invalid ──────────> first error focus
  ├─ cart invalid ───────────> adjacent recovery
  └─ valid ──────────────────> calculate → preview

preview
  ├─ edit ───────────────────> form
  ├─ price changed ──────────> updated preview + alert
  ├─ item unavailable ───────> blocked recovery
  └─ valid issue ────────────> issuing

issuing
  ├─ duplicate key ──────────> existing detail
  ├─ recoverable change ─────> preview + alert
  └─ success ────────────────> store snapshot → replace detail
```

### 6.2 가격 변경

- 미리보기 계산과 최신 계산의 행 키·적용 단가·수량·배송비를 비교한다.
- 차이가 있으면 발행을 중단하고 `QuotationPriceChangeAlert`를 표시한다.
- 변경 전·후 적용 단가와 이전·현재 견적 합계·차이를 함께 표시한다.
- 첫 변경 행의 heading에 programmatic focus를 이동한다.
- 사용자가 갱신된 미리보기에서 발행을 다시 눌러야 저장한다.
- 발행본에는 이전 가격과 변경 안내를 저장하지 않는다.

### 6.3 판매 종료

- 본품·옵션·규격 종료는 발행을 차단한다.
- `장바구니에서 수정`과 `구매 불가 상품 제외하고 계속`을 제공한다.
- 명시적 제외는 견적 초안의 대상 ID만 변경하며 장바구니는 수정하지 않는다.
- 추가 상품 종료는 해당 추가 상품만 제외할 수 있다.
- 배송 종료는 견적 화면에서 바꾸지 않고 장바구니의 배송 재선택을 요구한다.
- 모든 품목이 제외되면 장바구니로 이동한다.

### 6.4 중복 발행

- 발행 버튼을 누르면 모든 발행 행동을 비활성화하고 진행 상태를 표시한다.
- `draftId` 기반 `idempotencyKey`를 생성한다.
- 같은 키의 발행본이 존재하면 새 번호를 만들지 않고 기존 발행본을 반환한다.
- 브라우저 저장 순서는 `발행본 저장 → 초안 issuedQuotationId 기록 → 상세 replace`다.

---

## 7. 컴포넌트

| 컴포넌트 | 책임 |
|---|---|
| `QuotationFormPage` | 로그인·초안 hydrate, 폼과 요약 조합 |
| `QuotationProgress` | 2단계 현재 위치 표시 |
| `QuotationRecipientForm` | 견적명·수신자 필드와 오류 |
| `QuotationSelectionSummary` | 선택 묶음·할인·배송·합계와 장바구니 수정 |
| `QuotationPreviewPage` | 계산 재검증과 발행 행동 |
| `QuotationDocument` | 미리보기·발행본·인쇄의 공통 문서 |
| `QuotationPartyTable` | 수신자와 공급자 정보 |
| `QuotationLineTable` | 데스크톱·인쇄 품목 표 |
| `QuotationLineCards` | 모바일 화면용 품목 카드 |
| `QuotationTotals` | 할인·배송·공급가액·세금·합계 |
| `QuotationTerms` | 유효기간·배송·비주문 조건 |
| `QuotationPriceChangeAlert` | 변경 품목 수·전후 금액·복구 안내 |
| `QuotationIssueDialog` | 발행 후 수정 불가 최종 확인 |
| `QuotationHistoryPage` | 회원별 최신 견적 목록과 빈 상태 |
| `QuotationDetailPage` | 발행본 복원·만료 상태·인쇄 행동 |
| `MyPageShell` | 이번 범위의 견적 단일 LNB와 콘텐츠 축 |

---

## 8. 저장 모듈과 API 교체 경계

| 모듈 | 현재 책임 | API 이후 |
|---|---|---|
| `quotation-draft-store.ts` | sessionStorage 초안 | 로컬 유지 또는 서버 초안 정책 |
| `quotation-store.ts` | localStorage 발행본·hydrate | 제거 또는 query cache로 교체 |
| `quotation-repository.ts` | 브라우저 목록·단건·발행 인터페이스 | HTTP repository 구현 |
| `quotation-data.ts` | 현재 카탈로그 resolve·금액·스냅샷 | 응답 표시·클라이언트 사전 검증 |
| `quotation-schema.ts` | 입력 검증 | 요청 스키마와 공유 가능 |

현재 UI는 브라우저 storage를 직접 호출하지 않는다. 실제 API의 발행 요청은 선택 묶음 ID·견적명·수신자·중복 방지 키만 전달하며 서버가 가격·세금·배송·번호·발행 시각·공급자·권한을 결정한다.

예상 서버 오류 경계만 현재 결과 타입으로 모방한다.

```ts
type IssueQuotationResult =
  | { ok: true; quotation: QuotationSnapshot }
  | { ok: false; code: "PRICE_CHANGED"; calculation: QuotationCalculation }
  | { ok: false; code: "ITEM_UNAVAILABLE"; issues: QuotationIssue[] }
  | { ok: false; code: "SHIPPING_INVALID"; issues: QuotationIssue[] };
```

실제 endpoint와 DB 테이블은 이번 Starter 설계 범위가 아니다.

---

## 9. 인쇄 설계

### 9.1 출력 규칙

```css
@page {
  size: A4 portrait;
  margin: 14mm 12mm 15mm;
}
```

- 화면용 `CommerceHeader`, 행동 버튼, alert, 모바일 bar를 숨긴다.
- 문서 폭·폰트·표는 viewport가 아니라 인쇄 단위로 재설정한다.
- `<thead>`는 인쇄 페이지마다 반복한다.
- 배송 그룹·품목 묶음·합계·조건에는 `break-inside: avoid`를 적용한다.
- 한 묶음이 페이지보다 길면 추가 상품 행 사이 분할을 허용한다.
- 합계와 견적 조건은 마지막 페이지에 한 번만 출력한다.
- 인쇄 배경색을 꺼도 구조를 읽을 수 있게 선과 굵기를 함께 사용한다.
- 커스텀 `1 / N` 페이지 번호는 보장하지 않는다.
- 브라우저 기본 머리글·바닥글 해제 안내를 인쇄 도움말에 제공한다.

### 9.2 인쇄 실행

- 발행본 상세에서만 `인쇄·PDF 저장`을 제공한다.
- 로컬 Pretendard와 문서 렌더가 완료된 뒤 `window.print()`를 호출한다.
- Android는 시스템 인쇄의 `PDF로 저장`, iPhone은 공유·파일 저장 안내를 제공한다.
- 인쇄 종료 뒤 화면 상태를 변경하지 않는다.

---

## 10. 시각·상호작용

- Pretendard와 기존 `--ink`, `--muted`, `--brand`, `--brand-hover`, `--tint`, `--line`을 사용한다.
- 입력 화면의 제목은 기존 주문서 규모를 유지하고 큰 히어로 영역을 만들지 않는다.
- 발행 문서 배경은 흰색이며 과한 종이 그림자·radius·장식 영문을 사용하지 않는다.
- 견적서 제목과 합계만 문서의 주요 굵기이며 나머지는 9~10pt 표 밀도를 유지한다.
- 품명과 옵션은 같은 표 본문 크기를 사용하고 라벨만 600 굵기로 구분한다.
- 가격은 우측 정렬, 수량·단위는 중앙 정렬, 서술 정보는 좌측 정렬한다.
- 가격 변경은 주의 tint와 텍스트 라벨, 판매 불가는 오류 문구와 아이콘을 함께 사용한다.
- 화면 전환은 opacity·translate 160~200ms이며 문서 자체에는 입장 애니메이션을 적용하지 않는다.
- 로컬 상태 hydrate 중에는 실제 문서와 같은 높이를 흉내 낸 과한 스켈레톤 대신 고정 높이 상태 문구를 사용한다.

---

## 11. 접근성

- 모든 입력은 명시적인 `label`과 오류 `aria-describedby`를 가진다.
- blur 검증 후 오류는 `role="alert"`, 합계·상태 변경은 `aria-live="polite"`로 전달한다.
- 첫 제출 오류 또는 가격 변경 행으로 포커스를 이동한다.
- 진행 표시는 색상 외에 단계 번호·현재 텍스트를 제공한다.
- 발행 확인 대화상자는 초점 가두기, Escape 닫기, 취소 초기 포커스, 트리거 복귀를 제공한다.
- 아이콘 버튼에는 목적과 견적번호를 포함한 접근 가능한 이름을 제공한다.
- 조작 target은 최소 44×44px, 포커스 링은 기존 `brand-hover` 2px·offset 3px다.
- 모바일 고정 CTA가 마지막 필드와 오류를 가리지 않는다.
- 문서 표는 실제 table semantics와 column header를 사용한다.
- 모바일 카드에도 품명·옵션·단위·수량·금액 label을 유지한다.

---

## 12. 파일 계획

```text
apps/web/src/
├── app/
│   ├── quotes/
│   │   ├── new/page.tsx
│   │   └── preview/page.tsx
│   └── mypage/
│       └── quotes/
│           ├── page.tsx
│           └── [quoteId]/page.tsx
├── components/
│   └── CommerceHeader.tsx
├── features/
│   ├── cart/CartPage.tsx
│   ├── catalog/
│   │   ├── catalog-data.ts
│   │   └── purchase-data.ts
│   ├── mypage/MyPageShell.tsx
│   └── quotations/
│       ├── QuotationFormPage.tsx
│       ├── QuotationPreviewPage.tsx
│       ├── QuotationHistoryPage.tsx
│       ├── QuotationDetailPage.tsx
│       ├── QuotationDocument.tsx
│       ├── quotation-data.ts
│       ├── quotation-data.test.ts
│       ├── quotation-draft-store.ts
│       ├── quotation-draft-store.test.ts
│       ├── quotation-repository.ts
│       ├── quotation-schema.ts
│       ├── quotation-schema.test.ts
│       ├── quotation-store.ts
│       └── quotation-store.test.ts
└── app/globals.css

apps/web/e2e/
└── quotation.spec.ts
```

필요하면 `QuotationDocument`의 작은 하위 컴포넌트는 동일 파일에서 시작하고 복잡도가 확인된 뒤 분리한다. Starter 수준에서 파일을 미리 과도하게 나누지 않는다.

---

## 13. 구현 순서

1. 견적 타입·입력 스키마·공급자 fixture
2. 순수 금액·VAT·할인·한글 금액·품목 번호 계산과 단위 테스트
3. 초안 store·발행 store·browser repository와 중복 발행 테스트
4. 장바구니 견적 CTA·로그인 복귀·견적 정보 입력
5. 일반 견적서 문서·미리보기·가격 변경 복구
6. 발행 확인·스냅샷 저장·상세 replace
7. 최소 마이페이지 셸·이력 목록·상세
8. A4 print CSS·Android/iPhone 도움말
9. 모바일 카드·고정 CTA·반응형 polish
10. 접근성·인쇄·전체 여정 검증

---

## 14. 검증 시나리오

### 14.1 계산·상태

- 정상가 상품의 포함가·공급가액·부가세가 일치한다.
- 할인 fixture에서 정상가·적용가·할인액·합계가 일치한다.
- 본품 2개와 추가 상품 여러 개의 종속 번호·금액이 정확하다.
- 화물 택배 배송비는 포함되고 착불은 제외되며 직접 수령은 0원이다.
- 가격 변경 후 첫 발행은 중단되고 두 번째 확인 발행만 저장된다.
- 종료 상품·추가 상품은 자동 제외되지 않는다.
- 같은 발행 키를 두 번 요청해도 한 건만 저장된다.
- 발행 후 카탈로그 가격을 바꿔도 발행본 금액은 유지된다.
- 유효기간 전후 상태가 `유효/만료`로 정확히 계산된다.

### 14.2 사용자 여정

- 비로그인 장바구니 견적 진입 후 로그인하고 견적 폼으로 복귀한다.
- 회원 기본 정보가 담당자·연락처·이메일에 입력된다.
- blur 오류가 레이아웃을 깨지 않고 해당 필드에 표시된다.
- 새로고침·미리보기 수정·브라우저 뒤로가기에서 초안이 복원된다.
- 발행 후 뒤로가기로 중복 발행되지 않는다.
- 이력에서 본인 견적서만 최신 순으로 확인한다.
- 만료된 견적도 원본 금액으로 열고 인쇄한다.

### 14.3 반응형·인쇄

- 320·390·768·1024·1440px에서 가로 overflow가 없다.
- 모바일 고정 CTA가 필드·오류·문서 내용을 가리지 않는다.
- 상품명 1~4줄과 옵션 여러 줄이 표에서 겹치지 않는다.
- 본품 1·5·15·30개, 추가 상품 0·1·5개로 인쇄한다.
- 단일·혼합 배송과 할인 유무를 인쇄한다.
- 표 머리글이 다음 페이지에 반복되고 합계·조건이 분리되지 않는다.
- Chromium PDF와 Safari·Android 수동 저장에서 A4 세로가 유지된다.

### 14.4 품질 명령

```text
pnpm typecheck
pnpm lint
pnpm test
pnpm test:e2e
pnpm build
```

---

## 15. 배포

- 기존 Next.js App Router 빌드와 배포 방식을 유지한다.
- 새로운 외부 패키지나 PDF 생성 라이브러리를 추가하지 않는다.
- 실제 공급자 정보와 API가 연결되기 전 모의 값이 운영 문서로 오인되지 않도록 환경 전환 시 필수 점검한다.
- 인쇄는 사용자의 브라우저·운영체제 기능에 의존하므로 주요 브라우저 수동 검수를 배포 조건에 포함한다.

---

## Version History

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | 2026-08-21 | 사용자 최종 승인 및 구현 기준 확정 | STAYGRAF Team |
| 0.1 | 2026-08-21 | 승인된 계획을 구체화한 최초 Starter 설계 | STAYGRAF Team |
