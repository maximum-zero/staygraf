# 배송지 관리 UI 완료 보고서

> **Feature**: shipping-address-ui
> **Date**: 2026-08-19
> **Match Rate**: 96%
> **Status**: Completed

## 요약

주문·결제 화면에 회원별 배송지 주소록과 공식 카카오 우편번호 검색을 추가했다. 주문서에는 선택 배송지 요약만 남겨 정보 밀도를 낮추고, 배송지 목록·추가·수정은 데스크톱 모달과 모바일 바텀시트에서 처리한다. 직접 수령 전용 주문은 기존 수령인·연락처 흐름을 유지한다.

현재 주소는 모의 회원 ID별로 브라우저에 30일 저장되며, 저장 책임을 독립 store로 분리해 실제 `member_addresses` API로 교체할 수 있다.

## 관련 문서

- [계획](../01-plan/features/shipping-address-ui.plan.md)
- [설계](../02-design/features/shipping-address-ui.design.md)
- [갭 분석](../03-analysis/shipping-address-ui.analysis.md)
- [기존 주문·결제 계획](../01-plan/features/checkout-ui.plan.md)

## 완료 기능

- 주문서 선택 배송지 요약과 추가·변경 행동
- 회원별 배송지 선택·추가·수정·삭제·기본 지정
- 첫 배송지 자동 기본 지정과 기본 배송지 삭제 승계
- 삭제 5초 실행 취소
- 공식 Kakao Postcode 최신 CDN 지연 로드
- 우편번호·도로명 주소 결과 반영과 상세주소 포커스
- 주소 검색 실패 재시도와 수동 입력 복구
- 배송지 선택 시 수령인·연락처·주소를 주문 초안에 복사
- 작성 중 닫기·취소·Escape 이탈 확인과 입력값 유지
- 직접 수령 전용 주문에서 주소록 숨김
- 데스크톱 modal·모바일 bottom sheet
- portal 기반 form 분리, focus trap, Escape, focus return, scroll lock
- 44px 조작 영역, reduced motion, safe area
- 30일 localStorage 만료와 회원별 분리

## 품질 결과

| 항목 | 결과 |
|---|---|
| 설계 일치율 | 96% |
| TypeScript | 통과 |
| ESLint | 통과 |
| Vitest | 11 files, 30 tests 통과 |
| Playwright 전체 회귀 | 16 tests 통과 |
| 최종 배송지 검색 회귀 | 통과 |
| 반응형 | 320·390·768·1024·1440px, overflow 0 |
| touch target | 주소 관리 주요 조작 44px 이상 |
| production build | Next.js Webpack, 25개 경로 통과 |
| 시각 검수 | 1440px 목록 modal, 390px 주문서·편집 sheet 통과 |
| git diff check | 통과 |

## UI UX Pro Max 적용 결과

- 접근성 우선순위에 따라 visible label, 인접 오류, focus trap과 focus return을 적용했다.
- blur 오류는 `role="alert"`로 안내하고 작성 중 이탈 확인은 안전한 `계속 작성`에 기본 포커스를 둔다.
- 모바일 조작은 44px 이상, 인접 target은 8px 이상 간격을 유지했다.
- 주소 관련 조작에는 레이아웃을 움직이지 않는 hover·pressed 피드백을 적용했다.
- modal 200ms, sheet 220ms로 원인과 공간 이동이 드러나는 전환만 사용했다.
- 검색 결과의 새 파란 팔레트·과장된 타이포는 기존 STAYGRAF 체계와 충돌해 사용하지 않았다.
- 실제 캡처에서 toast가 카드 action을 가리는 문제를 발견해 overlay 대신 독립 footer로 바꿨다.

## 유지할 결정

- 주문서는 주소 입력 폼보다 선택 배송지 요약을 먼저 보여준다.
- 주소 검색은 외부 래퍼 없이 공식 스크립트를 직접 사용한다.
- 외부 검색이 실패해도 수동 입력으로 주문을 계속할 수 있다.
- 주소록 변경은 이미 생성된 주문 스냅샷을 수정하지 않는다.
- 배송 요청사항은 주소록이 아닌 주문별 초안에 저장한다.

## 후속 범위

- 실제 회원 인증과 `member_addresses` 테이블·API 연결
- 동일 version persist payload의 런타임 Zod 마이그레이션
- Kakao CDN 차단·팝업 차단을 포함한 네트워크 실패 E2E
- 주소 기반 배송 가능 지역·추가 운임 판정
- 마이페이지의 독립 배송지 관리 진입점

## Learning Points

- 주소록은 주문 자체가 아니라 반복 입력을 돕는 회원 데이터다.
- 주문 생성 시에는 선택 주소를 복사해 이후 주소록 수정과 분리해야 한다.
- portal은 화면 위치뿐 아니라 form 중첩과 modal 접근성 문제를 정리하는 데 유용하다.
- 외부 주소 검색에는 반드시 수동 입력 같은 복구 경로가 필요하다.
