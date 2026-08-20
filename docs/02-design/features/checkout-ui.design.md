# 주문·결제 UI 설계서

> **Summary**: 선택 장바구니 묶음을 안전하게 주문 스냅샷으로 전환하는 모의 로그인·주문서·완료 화면 설계
>
> **Author**: STAYGRAF Team
> **Date**: 2026-08-19
> **Version**: 1.0
> **Status**: Approved
> **Level**: Starter
> **Plan**: [checkout-ui.plan.md](../../01-plan/features/checkout-ui.plan.md)

---

## 1. 구현 대상과 설계 원칙

장바구니에서 선택한 구매 가능 묶음을 모의 로그인 이후 단일 주문서에서 검토하고 카드 또는 무통장입금 주문으로 생성한다. 주문 생성 시 현재 상품 정보를 다시 검증하고, 생성된 주문은 이후 카탈로그 변경의 영향을 받지 않는 스냅샷으로 저장한다.

이번 구현은 사용자 화면과 브라우저 상태를 완성하는 단계다. 실제 인증·PG·주문 API는 연결하지 않는다. 브라우저 저장 로직은 향후 API로 교체할 수 있도록 폼 UI, 현재 상품 해석, 주문 생성 책임을 분리한다.

핵심 원칙은 다음과 같다.

- 장바구니는 현재 구매 구성, 주문은 생성 시점 기록이다.
- 주문서는 검토·입력 화면이며 상품 구성 수정 기능을 제공하지 않는다.
- 주문 한 건은 배송지 한 곳을 사용하되 여러 배송 방식 묶음을 포함할 수 있다.
- 사용자에게 보이는 가격은 부가세 포함 금액을 기준으로 한다.
- 착불 운송비는 결제 합계에 포함하지 않는다.
- 제출 오류는 사용자가 바로 복구할 수 있는 위치와 문구로 제공한다.

## 2. 페이지와 이동

| 화면 | 경로 | 진입 조건 | 이탈 경로 |
|---|---|---|---|
| 모의 로그인 | `/login?returnTo=/checkout` | 비로그인 주문 진입 | 검증된 주문서 또는 홈 |
| 주문·결제 | `/checkout` | 로그인·유효한 선택 묶음 | 장바구니 또는 주문 완료 |
| 주문 완료 | `/orders/[orderId]/complete` | 유효한 저장 주문 | 장바구니 또는 상품 목록 |

### 2.1 장바구니에서 주문 진입

1. 사용자가 장바구니의 `선택 상품 주문`을 누른다.
2. 선택된 구매 가능 묶음 ID를 주문 초안에 저장한다.
3. 비로그인이면 `/login?returnTo=/checkout`로 이동한다.
4. 로그인 상태면 `/checkout`으로 바로 이동한다.
5. 선택 묶음이 없거나 모두 구매 불가하면 장바구니에서 이동하지 않고 인접 피드백을 제공한다.

### 2.2 모의 로그인 복귀

- 허용 복귀 경로는 `/checkout`처럼 `/`로 시작하는 서비스 내부 상대 경로뿐이다.
- `//`, 스킴, 호스트나 역슬래시가 포함된 값은 거부하고 `/`로 대체한다.
- 이미 로그인한 사용자가 `/login`에 접근하면 유효한 `returnTo`로 이동한다.
- 로그인 완료 전 주문 초안이 만료되거나 선택 묶음이 사라지면 장바구니로 복귀한다.

### 2.3 주문 완료 복원

- 주문 생성 후 `router.replace`로 완료 화면에 이동해 브라우저 뒤로가기의 재제출을 막는다.
- 완료 화면은 `orderId`로 주문 저장소를 조회한다.
- 주문이 없거나 7일이 지나 만료됐으면 `주문 정보를 찾을 수 없습니다` 상태와 장바구니·상품 목록 이동을 제공한다.

## 3. 상태 모델

### 3.1 모의 인증

```ts
type MockMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type AuthState = {
  member: MockMember | null;
  authenticatedAt: number | null;
  hydrated: boolean;
};
```

- 저장 key: `staygraf-auth`
- 저장 위치: `sessionStorage`
- version: `1`
- 데모 계정: 문서화된 샘플 이메일과 비밀번호를 사용한다.
- 저장 항목에는 비밀번호를 포함하지 않는다.

### 3.2 주문 초안

```ts
type PaymentMethod = "card" | "bank-transfer";

type DeliveryRequest =
  | "call-before-delivery"
  | "call-site-manager"
  | "custom";

type CheckoutFormValues = {
  ordererName: string;
  ordererPhone: string;
  ordererEmail: string;
  sameAsOrderer: boolean;
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  deliveryRequest: DeliveryRequest | "";
  customDeliveryRequest: string;
  paymentMethod: PaymentMethod;
  depositorName: string;
  agreedToOrder: boolean;
};

type CheckoutDraft = {
  id: string;
  selectedBundleIds: string[];
  values: CheckoutFormValues;
  entryPrices: Record<string, number>;
  createdOrderId: string | null;
  createdAt: number;
  updatedAt: number;
};
```

- 저장 key: `staygraf-checkout-draft`
- 저장 위치: `localStorage`
- version: `1`
- 만료: 마지막 수정 후 24시간
- `entryPrices`는 주문서 첫 진입 후 조건 변경을 차단하는 묶음별 비교 합계다. 주문 금액 원본으로 사용하지 않으며 제출 시 현재 카탈로그에서 다시 계산한다.
- 폼 변경은 300ms 단위로 저장하되 제출 상태는 persist하지 않는다.
- 주문 생성 후 `createdOrderId`를 먼저 기록해 재제출을 기존 주문 복원으로 전환한다.

### 3.3 주문 스냅샷

```ts
type OrderStatus = "paid" | "awaiting-deposit";

type MoneySnapshot = {
  includingVat: number;
  supply: number;
  vat: number;
};

type AdditionalItemSnapshot = {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: MoneySnapshot;
  totalPrice: MoneySnapshot;
};

type OrderItemSnapshot = {
  cartBundleId: string;
  productId: string;
  productName: string;
  brand: string;
  collection: string;
  optionId: string;
  optionLabel: string;
  variantId: string;
  variantLabel: string;
  orderUnitLabel: string;
  quantity: number;
  image: string;
  unitPrice: MoneySnapshot;
  mainProductTotal: MoneySnapshot;
  additionalItems: AdditionalItemSnapshot[];
  productTotalIncludingVat: number;
};

type ShippingGroupSnapshot = {
  method: ShippingMethodId;
  label: string;
  payment: "prepaid" | "collect" | "free";
  itemIds: string[];
  prepaidFee: number;
};

type OrderSnapshot = {
  id: string;
  draftId: string;
  orderNumber: string;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  orderer: { name: string; phone: string; email: string };
  recipient: {
    name: string;
    phone: string;
    postalCode: string;
    address: string;
    addressDetail: string;
    deliveryRequest: string;
  };
  items: OrderItemSnapshot[];
  shippingGroups: ShippingGroupSnapshot[];
  productTotalIncludingVat: number;
  prepaidShippingTotal: number;
  totalPayment: number;
  hasCollectShipping: boolean;
  depositorName: string | null;
  bankAccount: BankAccountSnapshot | null;
  depositDeadline: number | null;
  createdAt: number;
  expiresAt: number;
};
```

- 저장 key: `staygraf-orders`
- 저장 위치: `localStorage`
- version: `1`
- 만료: 생성 후 7일
- 주문번호 형식: `SG-YYYYMMDD-영문숫자4자리`
- 주문번호는 화면 식별용이며 보안 토큰으로 사용하지 않는다.
- 상품·추가 상품의 공급가액은 `부가세 포함가 ÷ 1.1`을 반올림하고 부가세는 포함가와 공급가액의 차이로 보존한다.
- 선불 배송비는 상품 금액과 분리된 포함가로 보존한다. 배송비 세금 세분화는 실제 운영 정책 연결 시 확정한다.

### 3.4 무통장입금 안내

```ts
type BankAccountSnapshot = {
  bankName: string;
  accountNumber: string;
  accountHolder: string;
};
```

- 계좌는 화면 검증용 상수이며 실제 입금 계좌가 아님을 코드 주석과 문서에서 구분한다.
- 입금 기한은 주문일 다음 날 23:59로 생성한다.
- 완료 화면에는 계좌, 입금자명, 입금 기한과 `입금 확인 후 주문이 진행됩니다`를 표시한다.

## 4. 상태 책임과 전이

### 4.1 체크아웃 화면 상태

```text
hydrating
  ├─ 비로그인 ──────────────> login redirect
  ├─ 선택 묶음 없음 ────────> cart redirect
  ├─ 기존 createdOrderId ───> completion redirect
  └─ 정상 ──────────────────> ready

ready
  ├─ field invalid ─────────> first error focus
  ├─ item invalid ──────────> stale state + cart recovery
  └─ valid submit ──────────> submitting

submitting
  ├─ success ───────────────> order stored → cart cleanup → complete
  └─ recoverable failure ───> ready + inline/global feedback
```

### 4.2 주문 생성 순서와 재진입 안전성

브라우저 저장소는 트랜잭션을 지원하지 않으므로 다음 순서를 지킨다.

1. 제출 잠금을 획득한다.
2. 선택 묶음을 store에서 다시 읽고 resolve한다.
3. 모든 묶음이 존재·구매 가능하고 초안 ID와 일치하는지 확인한다.
4. 주문 스냅샷과 주문 ID를 생성한다.
5. 주문 저장소에 주문을 먼저 저장한다.
6. 초안에 `createdOrderId`를 기록한다.
7. 대상 묶음을 장바구니에서 제거한다.
8. 완료 화면으로 `replace` 이동한다.
9. 완료 화면 진입 후 초안 폼을 제거한다.

5~8 사이에 새로고침되면 `createdOrderId`로 기존 주문을 찾아 장바구니 정리를 재시도한 뒤 완료 화면으로 이동한다. 이 규칙으로 중복 주문 생성과 주문 저장 전 장바구니 유실을 막는다.

## 5. 폼 스키마와 검증

### 5.1 공통 정규화

- 이름: 앞뒤 공백 제거, 2~30자
- 휴대전화: 숫자만 저장, 국내 휴대전화 10~11자리
- 이메일: 앞뒤 공백 제거와 소문자 변환 후 이메일 형식 검사
- 우편번호: 숫자 5자리
- 주소·상세주소: 앞뒤 공백 제거, 각각 최대 100자
- 배송 요청 직접 입력: 최대 100자
- 입금자명: 앞뒤 공백 제거, 2~30자

### 5.2 조건부 검증

- `hasDeliveryItems=true`이면 우편번호·주소·상세주소를 필수로 한다.
- 직접 수령 상품만 있으면 주소 필드를 폼에서 숨기고 빈 값으로 정규화한다.
- `sameAsOrderer=true`이면 주문자 이름·전화 변경을 수령 정보에 동기화한다.
- `deliveryRequest=custom`이면 직접 입력값을 필수로 한다.
- `paymentMethod=bank-transfer`이면 입금자명을 필수로 한다.
- `agreedToOrder`는 반드시 `true`여야 한다.

### 5.3 검증 시점과 오류 복구

- 필드 첫 검증은 blur 시점에 수행한다.
- 오류가 발생한 필드는 수정 시 다시 검증해 오류를 제거한다.
- 제출 시 모든 필드를 검증하고 첫 오류 필드로 포커스를 이동한다.
- 인라인 오류는 `aria-describedby`로 입력과 연결한다.
- 제출 오류 요약은 `role="alert"`를 사용하되 인라인 문구를 중복 낭독하지 않는다.
- 제출 버튼은 폼 오류 때문에 미리 비활성화하지 않는다. 사용자가 누르면 오류 위치를 안내한다.
- 제출 중과 선택 묶음이 없는 경우에만 제출 버튼을 비활성화한다.

## 6. 현재 상품 재검증과 금액

### 6.1 재사용 경계

- `resolveCartBundle`을 주문서 표시와 제출 직전 검증에 재사용한다.
- 화면 렌더 시 선택 묶음 ID로 현재 cart bundle을 찾고 resolve한다.
- 제출 시 Zustand hook의 캡처 값이 아닌 `useCartStore.getState()`의 최신 값을 사용한다.
- 선택 대상이 아닌 장바구니 묶음은 주문 계산과 제거 대상에 포함하지 않는다.

### 6.2 차단 조건

다음 조건 중 하나라도 발생하면 주문을 생성하지 않는다.

- 대상 장바구니 묶음 삭제 또는 만료
- 상품·옵션·규격·추가 상품 판매 종료
- 선택 배송 방식 종료
- 현재 가격이 주문서 첫 진입 가격과 달라짐
- 현재 선택 상품 총액과 화면 총액 불일치

가격만 변경된 경우 자동으로 새 가격을 적용해 결제하지 않는다. 변경 전·후 금액을 보여주고 장바구니에서 사용자가 다시 확인하게 한다.

### 6.3 합계 규칙

```text
상품 금액 = Σ(본품 현재 단가 × 수량 + 추가 상품 현재 단가 × 수량)
선불 배송비 = Σ(화물 택배 배송 상품별 고정 배송비)
착불 운송비 = 결제 합계 제외
직접 수령 = 0원
최종 결제 금액 = 상품 금액 + 선불 배송비
```

## 7. 화면 구조

### 7.1 주문 전용 헤더

- 높이: 데스크톱 68px, 모바일 62px
- 좌측: `STAYGRAF` 워드마크와 홈 링크
- 중앙: `주문·결제`
- 우측: 왼쪽 chevron 아이콘과 `장바구니로 돌아가기`
- 모바일에서는 워드마크와 뒤로가기 아이콘을 유지하고 중앙 제목을 시각적으로 배치한다.
- 일반 `GRAF`, `SHOP`, 검색·회원·장바구니 아이콘은 노출하지 않는다.

### 7.2 모의 로그인

```text
┌ 주문 전용 헤더 ───────────────────┐
│                                    │
│           로그인                   │
│    주문을 계속하려면 로그인하세요   │
│    이메일 [                    ]    │
│    비밀번호 [                  ]    │
│    [ 데모 계정 입력 ]               │
│    [ 로그인하고 주문 계속하기 ]      │
│                                    │
└────────────────────────────────────┘
```

- 폼 폭은 최대 420px, 모바일 gutter는 16px이다.
- 큰 마케팅 이미지나 회원가입 유도 영역을 추가하지 않는다.
- 비밀번호 보기 버튼은 44×44px이며 상태를 `aria-pressed`로 알린다.
- 데모 계정 입력은 보조 버튼이고 로그인 제출이 유일한 primary CTA다.

### 7.3 주문·결제 데스크톱

```text
주문 전용 헤더
주문·결제
┌ 본문 minmax(0,1fr) ────────────────┐  ┌ 결제 요약 344px sticky ┐
│ 주문 상품 N개                      │  │ 상품 금액              │
│  └ 배송 방식별 묶음과 상품          │  │ 선불 배송비            │
│ 주문자 정보                         │  │ 착불 운송비 별도        │
│ 배송 정보                           │  │ 최종 결제 금액          │
│ 결제수단                            │  │ 주문 확인 동의          │
│                                     │  │ [N원 결제하기]          │
└─────────────────────────────────────┘  └───────────────────────┘
```

- shell 최대폭 1280px, 본문과 요약 gap 32px
- 콘텐츠 시작은 header 아래 56px, 하단은 최소 96px
- 주문 제목 30px/700, 섹션 제목 20px/700, 필드 라벨 13px/650, 본문 14px/1.5
- 섹션 간 24px, 섹션 내부 16px, label과 control 8px을 기본 리듬으로 한다.
- 섹션은 흰색 표면과 1px neutral border, 6px 이하 radius를 사용한다.
- 구분선을 반복하기보다 섹션 간 여백과 제목 위계로 구조를 구분한다.
- 결제 요약은 `top: 92px`, viewport보다 길어지지 않는다.

### 7.4 주문 상품 영역

- 배송 방식 헤더 → 본품 행 → 추가 상품 종속 행 순서를 장바구니와 동일하게 유지한다.
- 주문서에서는 체크박스·수량·삭제·배송 변경 컨트롤을 제거한다.
- 본품 이미지는 데스크톱 80px, 모바일 72px이다.
- 상품명은 최대 두 줄, 옵션·규격·수량·단위는 다음 줄에 표시한다.
- 추가 상품은 옅은 중립 배경에서 이름·수량·금액을 compact row로 표시한다.
- 그룹 끝에 해당 묶음의 상품 금액과 배송비 조건을 표시한다.
- `장바구니에서 수정` 링크는 섹션 제목 우측에 둔다.
- 상품 영역은 기본 펼침 상태를 유지한다. 모바일에서도 자동으로 접지 않는다.

### 7.5 주문자·배송 폼

- 데스크톱에서 주문자 이름·휴대전화는 두 열, 이메일은 한 열이다.
- 모바일에서는 모든 필드를 한 열로 배치한다.
- 배송 상품이 있으면 선택 배송지 요약 카드와 `배송지 추가·변경` 행동을 제공하며 상세 입력은 배송지 관리 패널에서 처리한다.
- 배송지 관리와 카카오 우편번호 검색의 상태·접근성 규칙은 후속 [배송지 관리 UI 설계](./shipping-address-ui.design.md)를 따른다.
- `주문자 정보와 동일`은 직접 수령 전용 주문의 수령인 필드 바로 위에 둔다.
- 직접 수령 전용 주문이면 배송 섹션 제목을 `수령 정보`로 바꾸고 주소 행을 렌더링하지 않는다.
- 혼합 주문은 일반 배송 정보 폼을 유지하고 직접 수령 안내를 배송 묶음에서 별도로 표시한다.

### 7.6 결제수단

- native radio input을 포함한 2개의 전체 행 선택 카드로 표시한다.
- 선택 상태는 brand border·옅은 tint·radio checked를 함께 사용한다.
- 카드: `신용·체크카드`, 보조 문구 `실제 카드정보를 입력하지 않는 모의 결제입니다.`
- 무통장입금: `무통장입금`, 보조 문구 `주문 후 입금 계좌와 기한을 안내합니다.`
- 무통장입금 선택 시 카드 바로 아래 입금자명 필드를 펼친다.
- 선택 전용 행 전체는 최소 56px이고 키보드 Space로 선택할 수 있다.

### 7.7 결제 요약과 CTA

- `상품 금액 → 선불 배송비 → 착불 안내 → 최종 결제 금액` 순서를 유지한다.
- 금액은 우측 정렬하고 숫자 폭 변동을 줄이기 위해 tabular nums를 사용한다.
- 주문 동의는 제출 버튼 바로 위에 두고 전체 label이 44px 이상의 target이 되게 한다.
- 카드 버튼: `{최종 금액} 결제하기`
- 무통장 버튼: `주문하기`
- 제출 중: spinner와 `주문을 처리하고 있습니다`를 표시한다.
- 제출 성공 모션은 별도 축하 애니메이션 없이 완료 화면 전환으로 처리한다.

### 7.8 주문 완료

```text
          [상태 아이콘]
      주문이 완료되었습니다
      주문번호 SG-YYYYMMDD-XXXX

┌ 결제 상태·금액 ────────────────────┐
│ 카드: 결제 완료                     │
│ 또는 무통장: 입금 대기·계좌·기한    │
└─────────────────────────────────────┘
┌ 배송 방식별 주문 상품 ──────────────┐
└─────────────────────────────────────┘
[상품 계속 보기] [장바구니 보기]
```

- 본문 최대폭은 760px이다.
- 성공 아이콘은 Lucide Check 계열 SVG를 사용하고 녹색에만 의미를 의존하지 않는다.
- 카드와 무통장 상태 문구를 제목 바로 아래 사실값으로 표시한다.
- 무통장 계좌번호 복사 버튼은 44px target과 완료 피드백을 제공한다.
- 주문 상품과 배송 묶음은 주문 스냅샷만 읽어 표시한다.

## 8. 반응형 규칙

| 구간 | 레이아웃 | 결제 행동 |
|---|---|---|
| 1024px 이상 | 본문 + 344px 요약 2열 | 우측 sticky 요약 |
| 768~1023px | 한 열, 요약은 본문 하단 전체폭 | 일반 흐름 CTA |
| 767px 이하 | 한 열, 16px gutter | 하단 fixed 결제 바 |

### 모바일 결제 바

- 높이: 콘텐츠 72px + `env(safe-area-inset-bottom)`
- 좌측: `결제 금액`과 최종 금액
- 우측: 카드 `결제하기` 또는 무통장 `주문하기`
- 본문에는 상세 결제 요약을 유지하고 모바일 바는 행동만 축약한다.
- 본문 padding-bottom은 고정 바 전체 높이 + 24px 이상이다.
- 키보드가 열린 동안 브라우저 viewport에 따라 고정 바가 입력을 가리면 바를 숨기거나 일반 흐름으로 전환한다.

## 9. 접근성·상호작용·모션

- 모든 input은 연결된 label을 갖고 placeholder를 label 대신 사용하지 않는다.
- 필수값은 시각 문구와 `aria-required`로 전달한다.
- radio는 `fieldset`과 `legend`, 동의는 native checkbox를 사용한다.
- 상태 아이콘·색상 외에 텍스트로 선택·오류·결제 상태를 전달한다.
- 모든 focus-visible은 기존 brand-hover 2px outline과 3px offset을 사용한다.
- 조작 target은 최소 44×44px, 인접 target 간격은 8px 이상이다.
- 오류는 blur 시 인라인으로 노출하고 제출 실패 시 오류 요약을 `role="alert"`로 알린다.
- 제출 상태는 `aria-live="polite"`와 `aria-busy`를 사용한다.
- 모의 결제 지연은 600~900ms 범위의 고정 시뮬레이션으로 과도하게 늘리지 않는다.
- 조건부 필드는 opacity·translateY 160~200ms로 나타내고 높이 애니메이션은 사용하지 않는다.
- `prefers-reduced-motion`에서는 전환을 제거한다.
- 로딩 스켈레톤은 사용하지 않는다. 로컬 hydrate 동안 제목과 고정된 높이의 확인 상태를 제공한다.

## 10. 오류·빈 상태

| 상태 | 처리 |
|---|---|
| 로그인 세션 없음 | 로그인으로 이동하고 주문 초안 유지 |
| 선택 묶음 없음 | 장바구니 복귀 CTA가 있는 빈 상태 |
| 묶음 일부 삭제 | 해당 항목과 전체 금액 변경을 알리고 장바구니 복귀 |
| 가격 변경 | 이전·현재 금액과 재확인 필요 안내 |
| 판매·배송 종료 | 변경된 항목명을 표시하고 주문 제출 차단 |
| 만료된 주문 초안 | 새로 선택하도록 장바구니 복귀 |
| 주문 저장 실패 | 입력 유지, 다시 시도 제공, 장바구니 미삭제 |
| 완료 주문 없음 | 주문 정보 없음과 상품·장바구니 이동 제공 |

오류 대화상자를 남발하지 않는다. 주문 전체를 막는 재검증 오류만 본문 상단 상태 패널로 표시하고, 입력 오류는 필드 아래에 표시한다.

## 11. 파일과 컴포넌트 계획

```text
apps/web/src/
├── app/
│   ├── login/page.tsx
│   ├── checkout/page.tsx
│   └── orders/[orderId]/complete/page.tsx
├── components/
│   └── CheckoutHeader.tsx
├── features/
│   ├── auth/
│   │   ├── MockLoginPage.tsx
│   │   ├── auth-store.ts
│   │   └── auth-store.test.ts
│   ├── checkout/
│   │   ├── CheckoutPage.tsx
│   │   ├── checkout-schema.ts
│   │   ├── checkout-store.ts
│   │   ├── checkout-data.ts
│   │   ├── checkout-data.test.ts
│   │   └── checkout-store.test.ts
│   └── orders/
│       ├── OrderCompletePage.tsx
│       ├── order-store.ts
│       └── order-store.test.ts
└── app/globals.css
```

- 화면 컴포넌트는 초기 구현에서 feature page 내부 함수 컴포넌트로 시작할 수 있다.
- 폼 field wrapper가 세 화면 이상 반복되기 전에는 공용 폼 시스템을 새로 만들지 않는다.
- 기존 `SelectMenu`, `CartBundle`, 금액 포맷과 상품 resolve 로직을 재사용하되 checkout에서 장바구니 수정 기능을 가져오지 않는다.

## 12. 도메인 함수 경계

| 함수 | 입력 | 출력·책임 |
|---|---|---|
| `sanitizeReturnTo` | query string | 허용된 내부 경로 |
| `resolveCheckoutBundles` | cart bundles, selected IDs | 현재 구매 가능 묶음과 변경 상태 |
| `getCheckoutSummary` | resolved bundles | 상품·선불 배송비·착불·최종 금액 |
| `requiresShippingAddress` | resolved bundles | 배송 주소 필요 여부 |
| `createOrderSnapshot` | form, resolved bundles, now | 변경 불가능한 주문 스냅샷 |
| `generateOrderNumber` | now, random suffix | 화면용 주문번호 |
| `removeOrderedBundles` | cart store, bundle IDs | 대상 장바구니만 제거 |

도메인 함수는 React와 브라우저 저장소에 직접 의존하지 않게 만들어 단위 테스트한다.

## 13. API 교체 경계

현재 단계에는 API를 만들지 않는다. 향후 실제 백엔드에서는 다음 동작으로 교체한다.

| 현재 브라우저 동작 | 향후 API 책임 |
|---|---|
| 모의 로그인 sessionStorage | 회원 로그인과 세션 발급 |
| 카탈로그 로컬 재검증 | 서버의 상품·재고·배송 정책 검증 |
| 로컬 주문번호 생성 | 서버의 유일 주문번호 발급 |
| localStorage 주문 저장 | 주문·상품·배송 스냅샷 트랜잭션 저장 |
| 장바구니 로컬 제거 | 회원 장바구니 주문 처리 |
| 모의 카드 지연 | PG 승인·실패·취소 처리 |

실제 주문 API는 `검증 → 주문 저장 → 장바구니 제거`를 서버 트랜잭션 한 건으로 처리해야 한다.

## 14. 구현 순서

1. 모의 인증 타입·store·안전한 복귀 함수와 단위 테스트
2. 주문 폼 Zod schema와 조건부 검증 테스트
3. 주문 초안·주문 store, 만료와 migration 테스트
4. 선택 장바구니 resolve·합계·주문 스냅샷 함수와 테스트
5. 장바구니 주문 CTA를 초안·로그인·주문서 진입으로 연결
6. 주문 전용 헤더와 모의 로그인 화면
7. 주문 상품·주문자·배송·결제수단 폼
8. 데스크톱 결제 요약과 모바일 결제 바
9. 주문 생성·중복 방지·장바구니 정리
10. 카드·무통장 주문 완료 화면
11. 반응형·키보드·오류 복구 E2E
12. 기획·디자인·접근성 최종 검수와 PDCA 분석

## 15. 테스트 계획

### 15.1 단위 테스트

- 외부·프로토콜 상대·역슬래시 `returnTo` 거부
- 모의 로그인 sessionStorage hydrate와 탭 세션 경계
- 주문 초안 24시간, 주문 7일 만료
- 이름·전화·이메일·우편번호 정규화
- 배송 상품 유무에 따른 주소 필수 조건
- 직접 입력 배송 요청과 무통장 입금자명 조건부 검증
- 카드 `paid`, 무통장 `awaiting-deposit` 상태
- 입금 기한 계산
- 본품·추가 상품 공급가액·부가세 스냅샷
- 선불 배송비 포함, 착불 제외, 직접 수령 0원
- 주문 대상 묶음만 제거
- 동일 초안 재제출 시 기존 주문 복원

### 15.2 E2E

- 장바구니 선택 → 로그인 → 주문서 복귀
- 데모 계정 자동 입력과 로그인
- 필수값 제출 → 첫 오류 포커스와 인라인 오류
- 카드 선택 → 모의 처리 → 결제 완료
- 무통장 선택 → 입금자명 → 입금 대기·계좌 복사
- 직접 수령만 선택했을 때 주소 필드 미노출
- 배송 상품 포함 시 주소 필수
- 주문 완료 후 주문 대상만 장바구니에서 제거
- 주문 완료 새로고침과 뒤로가기 중복 방지
- 가격·판매·배송 조건 변경 시 주문 차단
- 320·390·768·1024·1440px 가로 overflow 0
- 모바일 고정 바가 마지막 필드와 오류를 가리지 않음
- 키보드만으로 전체 주문 여정 완료

## 16. 완료 조건

- Plan의 성공 기준을 모두 통과한다.
- TypeScript, ESLint, Prettier, Vitest, Playwright와 production build가 통과한다.
- 주요 너비에서 실제 브라우저 캡처와 조작 target을 검수한다.
- UI UX Pro Max 기준의 명시적 label, 인접 오류, 44px target, safe area와 reduced motion을 충족한다.
- 기획·UI·접근성 관점의 최종 검수에서 P0가 없어야 한다.
- 설계 대비 구현 일치율 90% 이상이어야 완료 보고로 전환한다.

## Version History

| Version | Date | Changes | Author |
|---|---|---|---|
| 1.0 | 2026-08-19 | 주문 상태·폼·스냅샷·단일 주문서·반응형·검증 설계 | STAYGRAF Team |
