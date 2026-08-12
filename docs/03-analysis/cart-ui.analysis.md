# Gap Analysis: cart-ui

> Date: 2026-08-13 | Design: [cart-ui.design.md](../02-design/features/cart-ui.design.md)

---

## Match Rate: 97%

## Summary

상품 상세의 구매 구성을 비회원 장바구니에 저장하고 배송 방식별로 검토하는 UI를 구현했다. 상품별 배송 가능 방식과 비용, 현재 가격 재검증, 동일 구성 병합, 안전한 실행 취소까지 설계 정책과 일치한다. 주문서·견적서 발행과 서버 장바구니는 계획대로 후속 범위다.

## Implemented Items

- [x] 본품·옵션·규격·수량·추가 상품·배송 방식을 하나의 묶음으로 저장
- [x] Zustand persist 기반 30일 비회원 장바구니와 hydrate 이후 헤더 배지
- [x] 동일 구성 추가·배송 변경·추가 상품 삭제·복원 시 단일 묶음 병합
- [x] 화물 택배 배송·개별 화물 운송·직접 수령별 그룹과 상품별 비용 표시
- [x] 전체·그룹·묶음 선택과 선택 상품 기준 주문 요약
- [x] 본품·추가 상품 수량 변경, 삭제와 최근 단건 5초 실행 취소
- [x] 현재 상품·옵션·규격·배송·추가 상품 재검증과 가격 변경 안내
- [x] 데스크톱 sticky 요약, 태블릿 전체 폭 요약, 모바일 고정 주문 바
- [x] 상품 상세 세 장바구니 CTA와 헤더 장바구니 링크 연결
- [x] 견적서·주문 후속 단계 안내와 선택 항목 재검증
- [x] 320·390·768·1024·1440px 반응형 및 44px 조작 영역 검증

## Missing Items

- [ ] 실제 주문서·견적서 입력·발행 화면과 로그인 연결은 후속 범위
- [ ] 서버 장바구니와 로그인 후 병합은 후속 범위

## Changed Items (Deviations from Design)

- [x] 설계의 별도 `CartShippingGroup`, `CartAdditionalRow` 컴포넌트는 현재 규모에서 `CartPage.tsx` 내부 함수 컴포넌트로 유지했다. 책임과 UI 경계는 동일하다.
- [x] 정적 목업 데이터를 즉시 사용할 수 있어 별도 스켈레톤 대신 hydrate 확인 상태만 제공했다.
- [x] 장바구니 배송 선택 메뉴는 카드 하단에서 viewport 밖으로 잘리지 않도록 위쪽으로 열리게 했다.

## Quality Gate

- TypeScript: 통과
- ESLint: 통과
- Unit test: 3 files, 10 tests 통과
- Production build: 통과
- Playwright E2E: 13/13 통과
- 반응형 실측: 320·390·768·1024·1440px overflow 0
- 접근성 실측: 본품 선택 44×44px, 수량 ± 44px 이상
- 기획·디자인·회귀 독립 검수: P0 없음

## Recommendations

1. 다음 단계에서 주문서와 견적 정보 입력 화면을 동일한 선택 묶음 모델로 연결한다.
2. 백엔드 도입 시 상품별 배송 정책과 가격 버전을 API 신뢰 원본으로 이전한다.
3. 로그인 구현 시 비회원 로컬 장바구니와 서버 장바구니 병합 충돌 정책을 확정한다.

## Next Steps

- [x] Match rate 90% 이상으로 완료 보고서 진행
