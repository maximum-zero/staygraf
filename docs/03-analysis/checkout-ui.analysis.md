# 주문·결제 UI Gap Analysis

> **Date**: 2026-08-19
> **Design**: [checkout-ui.design.md](../02-design/features/checkout-ui.design.md)
> **Implementation**: `apps/web/src/features/auth`, `checkout`, `orders`

---

## Match Rate: 96%

설계 검토 항목 50개 중 48개를 구현했다. 사용자 구매 여정, 상태 분리, 주문 직전 재검증, 주문 스냅샷, 반응형과 접근성 핵심 기준은 코드와 실제 Chromium E2E에서 일치했다. 남은 2개는 구현 누락이 아니라 무통장입금·배송 주소 제출의 독립 E2E 시나리오 보강 항목이다.

## 구현 일치 항목

### 상태와 데이터

- [x] `sessionStorage` 기반 모의 회원과 비밀번호 미저장
- [x] 외부·프로토콜 상대·역슬래시 복귀 경로 차단
- [x] 24시간 주문 초안과 7일 주문 스냅샷 만료
- [x] 선택 장바구니 묶음 ID와 300ms 폼 초안 저장
- [x] 주문 생성 주문 ID 기록과 중복 주문 복원
- [x] 상품·추가 상품 공급가액과 부가세 스냅샷
- [x] 카드 `paid`, 무통장입금 `awaiting-deposit` 분기
- [x] 다음 날 23:59 입금 기한과 화면 검증용 계좌
- [x] 주문 대상 장바구니 묶음만 제거

### 검증과 금액

- [x] 이름·전화·이메일·우편번호 정규화와 Zod 검증
- [x] 배송 상품 유무에 따른 주소 조건부 검증
- [x] 직접 입력 요청사항과 입금자명 조건부 검증
- [x] blur 인라인 오류와 수정 후 오류 제거
- [x] 제출 시 첫 오류 포커스와 전체 오류 알림
- [x] 제출 직전 최신 cart store 재조회
- [x] 상품·옵션·규격·추가 상품·배송 가능 여부 재검증
- [x] 진입 합계와 현재 합계 변경 시 이전·현재 금액 안내
- [x] 선불 배송비 포함, 착불 제외, 직접 수령 0원
- [x] 제출 잠금과 `router.replace` 중복 제출 방지

### 화면과 반응형

- [x] 주문 전용 헤더와 `/login`, `/checkout`, 완료 경로
- [x] 데모 계정 입력·비밀번호 표시·안전한 주문서 복귀
- [x] 배송 방식별 읽기 전용 주문 상품과 추가 상품
- [x] 주문자·수령·배송 요청 폼과 직접 수령 전용 구성
- [x] 카드·무통장입금 radio 카드와 입금자명 노출
- [x] 데스크톱 344px sticky 결제 요약
- [x] 태블릿 일반 흐름 결제 요약
- [x] 모바일 safe area 고정 결제 바와 본문 하단 여백
- [x] 카드·무통장 상태별 주문 완료와 주문번호
- [x] 완료 주문 새로고침 복원과 계좌번호 복사
- [x] 기존 Pretendard·브랜드 그린·4px 체계 유지
- [x] Lucide 아이콘, 44px target, native form semantics
- [x] 조건부 필드 180ms 전환과 reduced-motion 제거

## 검증 결과

| 검사 | 결과 |
|---|---|
| TypeScript | 통과 |
| ESLint | 통과 |
| Vitest | 8 files, 22 tests 통과 |
| Playwright 전체 회귀 | 15 tests 통과 |
| 주문 동의 오류 포커스 재검증 | 1 test 통과 |
| 반응형 | 320·390·768·1024·1440px 가로 overflow 0 |
| production build | Webpack build 통과 |
| 변경 파일 Prettier | 통과 |
| `git diff --check` | 통과 |

Turbopack 기본 build는 실행 환경의 내부 포트 바인딩 제한으로 중단됐고, 동일 소스의 Next.js Webpack production build로 컴파일·타입·정적 페이지 생성을 검증했다.

## 남은 검증 항목

- [ ] 무통장입금 선택부터 입금 대기 완료 화면까지 독립 E2E 추가
- [ ] 화물 배송 상품의 주소 입력·제출 성공 독립 E2E 추가

두 항목의 조건부 로직은 Zod와 주문 스냅샷 단위 테스트에서 통과했으며 현재 승인 차단 결함은 아니다.

## 설계 대비 변경

- 주문 초안에 `entryPrices` 비교 합계를 추가했다. 결제 원본 가격으로 사용하지 않고 주문서 진입 이후 변경 탐지에만 사용한다.
- 별도 Zod resolver 의존성을 추가하지 않고 React Hook Form 제출·blur 시 Zod `safeParse` 결과를 `setError`로 연결했다. 사용자 동작과 오류 포커스 결과는 설계와 같다.

## 결론

Match Rate가 90%를 넘고 P0 결함이 없다. 구현은 승인 가능한 상태이며, 사용자 화면 확인 후 Report 단계로 전환할 수 있다.
