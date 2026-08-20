# 배송지 관리 UI 설계서

> **Summary**: 회원별 배송지 주소록, 주문서 선택 카드와 공식 카카오 우편번호 검색을 기존 결제 흐름에 결합한다.
>
> **Date**: 2026-08-19
> **Version**: 1.0
> **Status**: Approved
> **Level**: Starter
> **Plan**: [shipping-address-ui.plan.md](../../01-plan/features/shipping-address-ui.plan.md)

---

## 1. 구조와 책임

```text
CheckoutPage
  ├─ checkout form / draft
  ├─ selected member address copy
  └─ ShippingAddressSection
       └─ AddressManagerDialog
            ├─ AddressList
            ├─ AddressEditor
            └─ Kakao postcode adapter

address-store (browser mock)
  └─ later replacement: member_addresses API
```

- `CheckoutPage`는 주문서에 사용할 주소 스냅샷만 책임진다.
- `address-store`는 회원별 주소록과 기본 배송지 정책을 책임진다.
- `AddressManagerDialog`는 목록·편집 화면 전이와 접근성을 책임진다.
- `kakao-postcode` 어댑터는 외부 스크립트 로드와 검색 결과 정규화만 책임진다.
- 주문 생성 후 주소록을 다시 수정해도 생성된 주문 스냅샷은 바뀌지 않는다.

## 2. 데이터 모델

```ts
type ShippingAddress = {
  id: string;
  memberId: string;
  label: string;
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  roadAddress: string;
  addressDetail: string;
  isDefault: boolean;
  createdAt: number;
  updatedAt: number;
};

type AddressState = {
  addresses: ShippingAddress[];
  hydrated: boolean;
  expiresAt: number | null;
};
```

- 저장 key: `staygraf-addresses`
- 저장 위치: `localStorage`
- version: `1`
- 만료: 마지막 주소 변경 후 30일
- `memberId`가 현재 로그인 사용자와 같은 주소만 반환한다.
- persist payload에는 `addresses`, `expiresAt`만 포함한다.
- 만료되거나 형태가 올바르지 않은 payload는 빈 목록으로 복구한다.

### 2.1 도메인 동작

| 동작 | 규칙 |
|---|---|
| `addAddress` | 첫 주소 또는 `isDefault=true`이면 같은 회원의 기존 기본값 해제 |
| `updateAddress` | 대상의 `memberId`는 변경하지 않으며 기본 지정 시 기존 기본값 해제 |
| `removeAddress` | 기본값 삭제 후 남은 항목 중 `updatedAt` 최신 항목을 기본값으로 지정 |
| `setDefaultAddress` | 같은 회원 안에서만 하나의 기본값 유지 |
| `getMemberAddresses` | 기본값 우선, 이후 `updatedAt` 내림차순 |

## 3. 카카오 우편번호 어댑터

```ts
type KakaoPostcodeResult = {
  postalCode: string;
  roadAddress: string;
};

loadKakaoPostcode(): Promise<void>
openKakaoPostcode(): Promise<KakaoPostcodeResult>
```

- 스크립트 URL은 `https://t1.kakaocdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js`를 사용한다.
- 이미 `window.kakao.Postcode`가 있으면 다시 로드하지 않는다.
- 같은 시점의 여러 요청은 module-level Promise 하나를 공유한다.
- script element는 `async`로 추가하고 성공·실패를 Promise로 알린다.
- 검색 완료 시 `zonecode`, `roadAddress`를 사용한다.
- 사용자가 검색 창만 닫은 경우 폼 값을 바꾸지 않는다.
- 로드·실행 실패는 한국어 오류로 변환해 편집 폼 안에 표시한다.
- 수동 입력 모드는 검색 버튼 옆 보조 행동으로 항상 제공하며 오류 후에도 접근 가능하다.

## 4. 화면 상태와 이동

### 4.1 주문서 배송 정보

```text
배송 상품 있음
  ├─ 선택 주소 있음 → 요약 카드 + 배송지 변경
  └─ 선택 주소 없음 → 빈 카드 + 배송지 추가

직접 수령만 있음
  └─ 기존 수령인·연락처 입력 (주소록 숨김)
```

선택 배송지 카드에는 배송지명·기본 표시, 수령인·연락처, 우편번호·도로명·상세주소를 표시한다. 주소 전체 입력 필드는 주문서 본문에서 제거하며 배송 요청사항만 카드 아래에 유지한다.

### 4.2 배송지 관리

```text
list
  ├─ select → checkout copy → close
  ├─ add → editor(new)
  ├─ edit → editor(existing)
  ├─ default → reorder
  └─ delete → remove + undo toast

editor
  ├─ search address → Kakao popup → values → detail focus
  ├─ manual mode → postcode/address editable
  ├─ save valid → list + select saved address
  └─ cancel/close/Escape → dirty면 이탈 확인 → list 또는 close
```

- 데스크톱(768px 이상): 중앙 모달, 최대 폭 560px, 최대 높이 `min(760px, calc(100dvh - 48px))`.
- 모바일(767px 이하): 화면 하단 바텀시트, 최대 높이 `calc(100dvh - 24px)`, safe area 반영.
- 목록과 편집은 한 패널 안에서 교체한다. 작성 중 이탈 확인은 같은 패널 내부 `alertdialog`로 제한해 주소 관리 흐름을 벗어나지 않는다.

## 5. 폼 규칙

| 필드 | 규칙 | 자동완성 |
|---|---|---|
| 배송지명 | 1~20자 | 없음 |
| 수령인 | 2~30자 | `shipping name` |
| 연락처 | 숫자 정규화 후 10~11자리 | `shipping tel` |
| 우편번호 | 숫자 5자리 | `shipping postal-code` |
| 도로명 주소 | 1~100자 | `shipping street-address` |
| 상세주소 | 1~100자 | `shipping address-line2` |
| 기본 배송지 | boolean | 없음 |

- 첫 검증은 blur, 저장 시 전체 검증을 수행한다.
- 오류는 해당 입력 바로 아래에 `role="alert"`로 표시하고 저장 시 첫 오류로 포커스를 이동한다.
- 검색 모드의 우편번호·도로명 주소는 `readOnly`이며 muted surface로 구분한다.
- 수동 입력 모드에서는 두 필드를 편집할 수 있다.
- 카카오 검색 완료 후 상세주소를 비우지 않고 상세주소 입력에 포커스를 둔다.

## 6. 접근성과 상호작용

- 대화상자는 `role="dialog"`, `aria-modal="true"`, 제목 연결을 제공한다.
- 열릴 때 제목 또는 첫 조작으로 포커스를 이동한다.
- Tab과 Shift+Tab은 패널 내부를 순환한다.
- Escape와 닫기·취소 버튼으로 나갈 수 있다. 편집 중 변경값이 있으면 `나가기 / 계속 작성` 확인을 먼저 표시하고 기본 포커스는 안전한 `계속 작성`에 둔다.
- 닫힌 후 배송지 추가·변경 버튼으로 포커스를 되돌린다.
- 열린 동안 문서 스크롤을 잠그고 종료 시 기존 스타일을 복원한다.
- 버튼·입력·체크 영역은 최소 44px, 인접 조작 간격은 최소 8px이다.
- 삭제 토스트는 `aria-live="polite"`이며 포커스를 강제로 가져가지 않는다.
- 주소 관련 버튼은 hover·pressed에서 색상과 배경만 160ms 전환하고 레이아웃 크기는 바꾸지 않는다.
- modal 200ms fade/translate, sheet 220ms translateY를 사용하고 reduced motion에서는 즉시 전환한다.

## 7. 주문서 동기화

선택 시 다음 값을 React Hook Form과 주문 초안에 복사한다.

```ts
recipientName   <- address.recipientName
recipientPhone  <- address.recipientPhone
postalCode      <- address.postalCode
address         <- address.roadAddress
addressDetail   <- address.addressDetail
```

- 주소록 선택 후 `sameAsOrderer`는 `false`로 바꾼다.
- 선택 주소 ID는 주소록 UI 복원을 위해 주문 초안에 추가하지 않는다. 현재 폼 값과 주소 ID를 느슨하게 연결해 주소 삭제가 주문서 입력을 지우지 않게 한다.
- 화면 진입 시 배송 주소 값이 비어 있고 기본 배송지가 있으면 기본값을 한 번 복사한다.
- 주문서에 직접 저장된 주소 값이 있으면 기본 배송지로 덮어쓰지 않는다.
- 제출 전 주소 스키마 검증은 기존 결제 스키마를 그대로 사용한다.

## 8. 컴포넌트와 파일

| 파일 | 책임 |
|---|---|
| `address-schema.ts` | 주소 입력 타입, 검증과 정규화 |
| `address-store.ts` | 회원별 persist, 기본·삭제 복구 정책 |
| `kakao-postcode.ts` | 공식 스크립트 로드와 결과 반환 |
| `AddressManagerDialog.tsx` | 목록·편집·삭제 undo·포커스 관리 |
| `ShippingAddressSection.tsx` | 주문서 카드와 폼 값 복사 |
| `CheckoutPage.tsx` | 배송 여부에 따른 섹션 조합 |
| `globals.css` | 모달·시트·카드·폼 반응형 스타일 |

## 9. 테스트 계획

### 9.1 단위 테스트

- 첫 주소 기본 지정, 회원별 분리
- 기본 배송지 변경과 삭제 후 승계
- 30일 만료 처리
- 주소 스키마 성공·오류·전화번호 정규화
- 카카오 스크립트 중복 로드 방지와 결과 매핑

### 9.2 E2E

- 로그인 → 주문서 → 배송지 추가 → 카카오 검색 stub → 저장·선택
- 배송지 변경·수정·기본 지정·삭제·실행 취소
- 새로고침 후 주소와 선택 폼 값 유지
- 직접 수령만 있는 주문에서 주소 관리 숨김
- Tab 순환, Escape, 포커스 복귀
- 320·390·768·1024·1440에서 가로 overflow 0, 44px target
- 외부 스크립트 실패 stub 후 수동 입력으로 복구

## 10. 구현 순서

1. 주소 스키마와 Zustand 저장소
2. 카카오 우편번호 어댑터
3. 배송지 관리 모달·바텀시트
4. 주문서 선택 카드와 폼 동기화
5. 스타일·모션·반응형
6. 단위·E2E·접근성 검증
7. 기존 결제 문서의 주소록 제외 범위 갱신

## 11. UI UX Pro Max 적용 요약

- 기존 STAYGRAF의 Pretendard·그린·4px 중심 체계를 유지하고 검색 결과의 새 팔레트는 사용하지 않는다.
- 주소 폼은 visible label, blur 검증, 인접 오류와 명확한 복구 경로를 사용한다.
- 모달·시트는 44px target, focus trap, scroll lock, reduced motion을 필수로 한다.
- 목록과 편집을 점진적으로 노출해 주문 화면의 정보 밀도를 낮춘다.
