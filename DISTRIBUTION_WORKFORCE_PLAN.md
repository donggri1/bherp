# 배전인력 기능 개발 계획

이 문서는 특정 회사 전용으로 사용할 `배전인력` 화면과 KEPCO 배전기능인력 조회 연동 기능의 개발 계획이다.
나중에 다른 회사용으로 포킹할 때 제거될 가능성이 높으므로, 공통 ERP 기능과 최대한 분리해서 구현한다.

## 1. 목표

- `배전인력` 화면에서 사원 목록을 불러온다.
- 여러 사원을 체크해서 선택 사원에게 `배전기능자격` 자격증을 일괄 등록한다.
- 이미 `배전기능자격`이 등록된 사원은 중복 등록하지 않는다.
- 선택 사원들의 `배전기능자격` 자격번호, 사원명, 생년월일, 조회기간으로 KEPCO 배전기능인력 정보를 조회한다.
- 조회 결과 중 `무정전`, `지중배전` 자격만 가져와 사원별 자격증으로 등록하거나 갱신한다.
- `취득`, `갱신`, `만료`, `자격상태`, `자격증번호`, `무정전전공 실적 시간`, `지중배전전공 실적 시간`을 저장한다.
- 한 번에 너무 많은 외부 조회가 나가지 않도록 선택 인원 제한과 순차 처리 제한을 둔다.

## 2. 외부 조회 페이지 확인

대상 URL:

```text
https://www.kepco.co.kr/home/customer/library/inquiry-distribution-personnel/staff-information/regist.do
```

현재 확인된 화면 입력 항목:

- 이름
- 생년월일
- 자격증 번호
- 조회기간 시작일
- 조회기간 종료일

현재 확인된 결과 예시에서 필요한 값:

- 자격정보의 `지중배전`
- 자격정보의 `무정전`
- 각 자격의 취득일, 갱신일, 만료일, 자격상태, 자격증번호
- 무정전전공 작업시간
- 지중배전전공 작업시간

실제 구현 전에는 브라우저 개발자도구 Network 탭으로 조회 요청 방식과 응답 형태를 한 번 더 확인한다.
응답이 정적 HTML인지, Ajax JSON인지, CSRF/session/captcha가 필요한지에 따라 구현 난이도가 달라진다.

## 3. 분리 전략

이 기능은 공통 ERP가 아니라 회사 전용 기능으로 본다.

### Backend

회사 전용 모듈을 별도 폴더로 둔다.

```text
backend/src/company-features/distribution-workforce/
```

예상 구성:

```text
distribution-workforce.module.ts
distribution-workforce.controller.ts
distribution-workforce.service.ts
distribution-workforce-kepco.client.ts
distribution-workforce-parser.ts
dto/
entities/
constants/
```

공통 코드 변경은 최소화한다.

- `app.module.ts`에 모듈 import 1줄
- `menus.seed.ts`에 메뉴 1개
- 필요 시 권한 seed 반영
- 공통 자격증/사원 API는 직접 수정하지 않고 서비스에서 호출 또는 repository 주입으로 사용

나중에 제거할 때는 위 회사전용 폴더와 import/menu만 제거하면 되도록 한다.

### Frontend

회사 전용 화면을 별도 폴더로 둔다.

```text
frontend/src/company-features/distribution-workforce/
frontend/src/app/operation/distribution-workforce/page.tsx
```

공통 변경은 최소화한다.

- `frontend/src/config/menus.ts`에 메뉴 1개
- page는 기존 구조대로 반드시 `AppShell` 사용

### Feature Flag

환경변수로 기능 노출 여부를 제어한다.

```env
FEATURE_DISTRIBUTION_WORKFORCE=true
NEXT_PUBLIC_FEATURE_DISTRIBUTION_WORKFORCE=true
```

기능 제거 전에도 메뉴 노출을 즉시 끌 수 있게 한다.

## 4. 메뉴/권한

신규 메뉴:

- 메뉴명: `배전인력`
- 메뉴코드: `OP_DISTRIBUTION_WORKFORCE`
- 경로: `/operation/distribution-workforce`

권한:

- `read`: 사원/배전인력 조회
- `create`: `배전기능자격` 일괄 등록
- `update`: `무정전`, `지중배전` 정보 등록 및 갱신
- `delete`: 1차 구현에서는 사용하지 않음

## 5. 자격증 종류 정책

필요한 자격증 종류:

- `배전기능자격`
- `무정전`
- `지중배전`

정책:

- 자격증 종류가 없으면 회사전용 서비스에서 자동 생성한다.
- 이미 있으면 기존 자격증 종류를 사용한다.
- 이름 매칭은 1차 구현에서 정확히 일치 기준으로 한다.
- 나중에 명칭이 달라질 수 있으므로 회사전용 constants에만 이름을 둔다.

## 6. 사원 생년월일 처리

KEPCO 조회에는 생년월일이 필요하다.

우선순위:

1. 사원에 생년월일 필드가 별도로 생기면 그 값을 사용한다.
2. 현재 추가된 주민등록번호에서 생년월일을 계산한다.
3. 둘 다 없으면 해당 사원은 조회 불가로 표시한다.

개인정보 처리 주의:

- 주민등록번호 원문을 외부 조회 로그에 남기지 않는다.
- 백엔드 로그에 주민등록번호, 생년월일, 자격번호가 과도하게 찍히지 않도록 한다.
- 프론트에는 필요한 마스킹 정보만 보여준다.

## 7. 데이터 저장 구조

공통 `employee_certificates`에는 기존 자격증 관리에 필요한 최소값만 저장한다.

`무정전`, `지중배전` 자격을 가져오면 다음 값을 공통 자격증에 반영한다.

- `employeeId`
- `certificateTypeId`
- `certificateNo`
- `acquiredDate`
- `expiredDate`
- `memo`
- `isActive`

갱신일, 자격상태, 작업시간은 회사전용 확장 테이블에 저장한다.
공통 자격증 테이블에 회사전용 컬럼을 늘리지 않기 위해서다.

예상 테이블:

```text
distribution_workforce_certificates
```

예상 컬럼:

- `id`
- `companyId`
- `employeeId`
- `employeeCertificateId`
- `qualificationName`: `무정전` 또는 `지중배전`
- `acquiredDate`
- `renewedDate`
- `expiredDate`
- `qualificationStatus`
- `certificateNo`
- `workHours`
- `workPeriodFrom`
- `workPeriodTo`
- `lastFetchedAt`
- `lastFetchStatus`
- `lastFetchMessage`
- `createdAt`
- `updatedAt`
- `deletedAt`

선택적으로 배치 이력을 남긴다.

```text
distribution_workforce_fetch_batches
distribution_workforce_fetch_batch_items
```

1차 구현에서는 화면에 처리 결과를 보여주는 정도로 시작하고, 감사 이력이 필요해지면 배치 이력 테이블을 추가한다.

## 8. 중복/갱신 정책

### 배전기능자격 일괄 등록

선택 사원별로 다음을 수행한다.

1. `배전기능자격` 자격증 종류 조회 또는 생성
2. 사원별 자격증에 동일 사원 + 동일 자격증 종류가 있는지 확인
3. 이미 있으면 생성하지 않고 `이미 등록됨`으로 결과 표시
4. 없으면 새로 생성
5. 자격번호는 비워둔다. 사용자가 `사원별자격증등록` 화면에서 입력한다.

### 배전기능정보등록및갱신

선택 사원별로 다음을 수행한다.

1. `배전기능자격` 자격증의 자격번호 확인
2. 사원명 확인
3. 생년월일 확인
4. 조회기간 확인
5. KEPCO 조회 실행
6. 결과에서 `무정전`, `지중배전`만 추출
7. 각 자격별로 기존 사원별 자격증이 없으면 생성
8. 기존 사원별 자격증이 있으면 최신 조회 결과로 갱신
9. 결과에 없는 자격은 삭제하지 않고 `조회 결과 없음`으로만 표시

이미 등록된 자격도 갱신될 수 있으므로, `무정전`, `지중배전`은 중복 방지가 아니라 upsert 방식으로 처리한다.

## 9. 결측 케이스 처리

가능한 케이스:

- `무정전`, `지중배전` 둘 다 있음
- `무정전`만 있음
- `지중배전`만 있음
- 둘 다 없음
- KEPCO에서 조회 결과 없음
- 자격번호 없음
- 생년월일 없음
- 외부 사이트 오류
- 응답 구조 변경

화면 처리:

- 성공: 등록 또는 갱신된 자격 표시
- 일부 성공: 성공 항목과 실패 항목을 사원별로 분리 표시
- 실패: 해당 사원 행에 실패 사유 표시
- 둘 다 없음: 기존 데이터 삭제 없이 `대상 자격 없음` 표시

## 10. 일괄 처리 제한

기본 제한:

- 한 번에 최대 5명
- 백엔드에서도 최대 5명 검증
- 사원별 조회는 병렬 처리하지 않고 순차 처리
- 요청 사이에 500ms~1000ms 정도의 지연을 둔다

환경변수로 조정 가능하게 한다.

```env
DISTRIBUTION_WORKFORCE_BATCH_LIMIT=5
DISTRIBUTION_WORKFORCE_REQUEST_DELAY_MS=800
```

프론트에서 5명 초과 선택 시 버튼 비활성화 또는 안내 메시지를 보여준다.
백엔드에서도 동일 제한을 적용해 우회 호출을 막는다.

## 11. Backend API 계획

기본 prefix:

```text
/api/distribution-workforce
```

예상 API:

```text
GET  /employees
POST /register-base-certificate
POST /fetch-and-upsert
```

### GET /employees

배전인력 화면용 사원 목록.

조회 조건:

- keyword
- departmentName
- isActive
- hasBaseCertificate
- hasBaseCertificateNo

응답에는 다음 상태를 포함한다.

- 사원 기본 정보
- `배전기능자격` 등록 여부
- `배전기능자격` 자격번호 입력 여부
- `무정전` 등록/갱신 상태
- `지중배전` 등록/갱신 상태
- 생년월일 조회 가능 여부

### POST /register-base-certificate

선택 사원에게 `배전기능자격`을 일괄 등록한다.

요청:

```json
{
  "employeeIds": [1, 2, 3]
}
```

응답:

```json
{
  "created": 2,
  "skipped": 1,
  "items": []
}
```

### POST /fetch-and-upsert

선택 사원의 KEPCO 정보를 조회하고 `무정전`, `지중배전`을 등록/갱신한다.

요청:

```json
{
  "employeeIds": [1, 2, 3],
  "periodFrom": "2025-01",
  "periodTo": "2026-07"
}
```

응답:

```json
{
  "success": 2,
  "failed": 1,
  "items": []
}
```

## 12. Frontend 화면 계획

화면명:

```text
배전인력
```

구성:

1. `PageHeader`
2. 검색조건 카드
3. 조회기간 입력 카드 또는 검색조건에 포함
4. 상단 버튼 영역
5. 사원 체크 목록
6. 선택 결과/처리 결과 패널

버튼:

- 조회
- 선택 초기화
- 배전기능자격 등록
- 배전기능정보등록및갱신

목록 컬럼:

- 체크박스
- 사원코드
- 사원명
- 부서
- 직위
- 휴대폰
- 배전기능자격 등록 여부
- 배전기능자격번호 입력 여부
- 무정전 상태
- 지중배전 상태
- 최근 조회일

선택 제한:

- 5명 초과 체크 시 안내
- `배전기능정보등록및갱신`은 조회기간 입력 전 비활성화
- 자격번호나 생년월일이 없는 사원은 처리 전 경고

## 13. KEPCO 연동 구현 방식

1차 구현은 백엔드에서만 외부 조회를 수행한다.
프론트에서 KEPCO를 직접 호출하지 않는다.

이유:

- 브라우저 CORS 문제 회피
- 개인정보가 브라우저 네트워크 로그에 과도하게 남는 문제 완화
- 외부 사이트 응답 파싱을 한 곳에서 관리
- 요청 제한과 재시도 정책을 서버에서 통제

구현 후보:

- Node `fetch`로 form submit 또는 Ajax endpoint 호출
- 응답 HTML 파싱
- 응답 구조가 복잡하면 `cheerio` 도입 검토
- JavaScript 렌더링이 필수이면 Playwright 도입 검토

단계:

1. 실제 요청 endpoint와 payload 확인
2. 샘플 응답 저장 없이 파서 테스트 케이스 작성
3. `무정전`, `지중배전` 행 추출
4. 작업시간 문장에서 숫자 시간과 기간 추출
5. 응답 구조 변경 시 실패 메시지를 명확히 반환

## 14. 구현 순서

### 1단계: 껍데기와 분리 구조

- 회사전용 backend 폴더 생성
- 회사전용 frontend 폴더 생성
- 메뉴 추가
- 빈 화면 생성
- feature flag 반영

### 2단계: 배전기능자격 일괄 등록

- `배전기능자격` 자격증 종류 자동 생성/조회
- 선택 사원 중복 확인
- 없는 사원만 사원별 자격증 생성
- 처리 결과 UI 표시

### 3단계: 조회 준비 상태 표시

- 사원 목록에 자격번호 입력 여부 표시
- 생년월일 계산 가능 여부 표시
- 처리 불가 사유 표시
- batch limit 적용

### 4단계: KEPCO 조회 연동 proof

- 실제 요청 방식 확인
- 단건 조회 API 먼저 구현
- 파서 테스트 작성
- 샘플 케이스로 `무정전`, `지중배전`, 작업시간 추출 확인

### 5단계: 일괄 등록/갱신

- 선택 사원 순차 조회
- `무정전`, `지중배전` 사원별 자격증 upsert
- 회사전용 확장 테이블 저장
- 일부 성공/실패 결과 UI 표시

### 6단계: 검증

- backend build
- frontend build
- 중복 등록 방지 테스트
- 갱신 테스트
- 둘 다 없음/하나만 있음/둘 다 있음 케이스 테스트
- 5명 초과 제한 테스트
- 외부 사이트 오류 시 메시지 테스트

## 15. 제거 방법

다른 회사용 포킹에서 이 기능을 제거할 때:

1. `backend/src/company-features/distribution-workforce` 삭제
2. `frontend/src/company-features/distribution-workforce` 삭제
3. `frontend/src/app/operation/distribution-workforce` 삭제
4. `backend/src/app.module.ts`의 distribution workforce module import 삭제
5. `backend/src/modules/menus/menus.seed.ts`의 `OP_DISTRIBUTION_WORKFORCE` 삭제
6. `frontend/src/config/menus.ts`의 `OP_DISTRIBUTION_WORKFORCE` 삭제
7. `distribution_workforce_*` 테이블 삭제
8. 환경변수 `FEATURE_DISTRIBUTION_WORKFORCE`, `NEXT_PUBLIC_FEATURE_DISTRIBUTION_WORKFORCE` 삭제

공통 `employees`, `certificate-types`, `employee-certificates`는 유지된다.

## 16. 주요 리스크

- KEPCO 페이지 응답 구조가 바뀌면 파서가 깨질 수 있다.
- KEPCO가 자동 조회를 제한하거나 captcha/session을 요구하면 완전 자동화가 어려울 수 있다.
- 개인정보와 자격번호를 다루므로 로그/화면/DB 저장 범위를 조심해야 한다.
- 조회기간 기준이 정확히 월 단위인지 일 단위인지 실제 요청을 확인해야 한다.
- 이미 등록된 자격 갱신 시 사용자가 직접 수정한 값이 덮어써질 수 있으므로, 갱신 전후 결과를 화면에 명확히 보여줘야 한다.

## 17. 1차 구현 결정안

- 한 번에 최대 5명
- 외부 조회는 백엔드에서만 실행
- 처리 방식은 순차 실행
- `배전기능자격`은 중복 생성 방지
- `무정전`, `지중배전`은 upsert로 갱신 허용
- 공통 자격증 테이블에는 기본 자격증 값만 저장
- 갱신일, 자격상태, 작업시간은 회사전용 테이블에 저장
- 결과에 없는 자격은 삭제하지 않음
- 메뉴와 코드 폴더를 회사전용으로 격리해 나중에 쉽게 제거
