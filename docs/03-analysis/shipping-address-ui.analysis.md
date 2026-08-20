# 배송지 관리 UI 갭 분석

> **Date**: 2026-08-19
> **Design**: [shipping-address-ui.design.md](../02-design/features/shipping-address-ui.design.md)
> **Match Rate**: 96%

---

## 1. 요약

계획·설계에서 확정한 회원별 배송지 저장, 기본 배송지 정책, 공식 카카오 우편번호 검색, 주문서 동기화, 데스크톱 모달·모바일 바텀시트와 접근성 요구를 구현했다. 구현 후 실제 1440px 모달과 390px 주문서·편집 시트를 캡처해 시각 위계와 간격을 확인했고, 알림이 카드 조작을 가리던 문제를 비중첩 footer 구조로 수정했다.

총 49개 설계 확인 항목 중 47개가 코드와 테스트로 일치해 96%다. 남은 2개는 실제 백엔드 전환 전 보강 가능한 비차단 항목이다.

## 2. 일치 항목

### 데이터·정책

- [x] `ShippingAddress`와 회원 ID·기본값·생성/수정 시각 모델
- [x] `staygraf-addresses` localStorage version 1, 30일 만료
- [x] 회원별 목록 분리와 기본 배송지 우선 정렬
- [x] 첫 주소 자동 기본 지정과 회원별 단일 기본값
- [x] 기본 배송지 삭제 후 최근 수정 주소 승계
- [x] 삭제 5초 실행 취소와 동일 ID 복원
- [x] 주소 선택 시 주문 초안 값 복사, 생성 주문 스냅샷 독립

### 주소 검색·폼

- [x] 공식 최신 Kakao CDN과 `kakao.Postcode` 사용
- [x] 외부 npm 래퍼 미사용
- [x] module-level Promise로 스크립트 중복 로드 방지
- [x] `zonecode`·`roadAddress` 정규화
- [x] 검색 후 상세주소 포커스
- [x] 검색 실패 인접 안내·재시도·수동 입력
- [x] visible label, blur 검증, 첫 오류 포커스
- [x] blur 오류 `role="alert"` 안내와 정상 필드 레이아웃 유지
- [x] 검색 결과 readOnly와 수동 입력 모드 구분

### 주문서·UI

- [x] 선택 배송지 요약과 추가·변경 행동
- [x] 목록·추가·수정·삭제·기본 지정
- [x] 배송 상품은 주소록, 직접 수령 전용은 기존 수령 정보 사용
- [x] 배송 요청사항은 주문 초안에만 유지
- [x] 데스크톱 중앙 모달, 모바일 bottom sheet
- [x] 목록과 편집을 한 패널에서 전환하고 중첩 모달 제거
- [x] React portal로 주문서 form과 주소 form 중첩 방지
- [x] focus trap, Escape, focus return, body scroll lock
- [x] 변경값이 있을 때 닫기·취소·Escape 이탈 확인과 값 유지
- [x] 44px target과 8px action spacing
- [x] hover·pressed 상태의 비이동형 시각 피드백
- [x] 180~220ms 의미 있는 전환과 reduced motion
- [x] 320·390·768·1024·1440px 가로 overflow 0
- [x] Pretendard·그린·중립 표면·4~8px radius 기존 체계 유지

### 검증

- [x] 주소 스키마·전화번호 정규화 단위 테스트
- [x] 기본·회원 분리·삭제 승계·복원·만료 store 테스트
- [x] Kakao 결과 매핑 단위 테스트
- [x] 로그인부터 검색·저장·새로고침·삭제·복원 E2E
- [x] 전체 16개 사용자 여정 회귀 통과
- [x] TypeScript, ESLint, production Webpack build 통과
- [x] 실제 1440·390px 시각 캡처 검수

## 3. 비차단 차이

| 항목 | 설계 | 현재 구현 | 판단 |
|---|---|---|---|
| persist payload 런타임 형태 검증 | 손상된 데이터 안전 초기화 | 만료와 version은 처리하지만 동일 version의 필드 손상까지 별도 Zod 검증하지 않음 | 실제 API 전환 전 보강 가능 |
| 외부 검색 실패 E2E | 실패 stub 후 수동 입력 복구 | 복구 UI·로직은 구현, 단위·수동 검수만 수행 | 네트워크 대역 E2E를 후속 보강 가능 |

## 4. 구현 중 발견·수정한 문제

- 주소 편집 `form`이 주문서 `form` 안에 렌더링되어 바깥 제출까지 전파되던 문제를 body portal로 분리했다.
- 200ms modal scale 중 44px target이 순간적으로 43.56px로 측정되던 테스트를 애니메이션 완료 후 실측하도록 고쳤다. 최종 치수는 44px다.
- 저장 성공 toast가 카드 수정·삭제를 덮던 구조를 독립 footer로 바꿔 조작 차단을 제거했다.
- 배송지 값 오류 시 숨은 input이나 주소 관리 패널을 강제로 열지 않고 배송지 입력 버튼으로 포커스·스크롤하도록 제출 오류 복구 경로를 수정했다.
- 기본 배송지 카드에서 첫 action만 왼쪽으로 밀리던 selector를 명시 class로 교체했다.
- Tailwind Prettier 플러그인이 상태 class 문자열의 선행 공백을 제거해 기본 레이아웃이 사라지던 회귀를 `clsx` 조합과 E2E로 고정했다.
- 작성 중 닫기에서 값이 즉시 사라지던 흐름을 패널 내부 이탈 확인으로 보완했다.

## 5. 결론

핵심 사용자 여정과 승인된 UI·정책은 모두 구현되어 보고 단계로 진행할 수 있다. 남은 두 차이는 현재 브라우저 기반 MVP의 주문 진행을 막지 않으며 실제 회원 주소 API 설계 시 함께 다루는 편이 효율적이다.
