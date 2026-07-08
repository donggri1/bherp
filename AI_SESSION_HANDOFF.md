# BHERP AI Session Handoff

이 문서는 새 AI 개발 세션이 이전 진행상황을 빠르게 이어받기 위한 현재 상태판이다.

장기 방향은 `ERP_MODULE_SEPARATION_MENU_PLAN.md`에 두고, 이 문서는 "지금 어디까지 했고 다음에 뭘 해야 하는지"만 짧고 정확하게 유지한다.

## 1. 새 세션 시작 시 읽을 파일

새 AI 세션은 작업 전 아래 순서로 읽는다.

1. `AGENTS.md`
2. `AI_DEVELOPMENT_CONTEXT.md`
3. `AI_SESSION_HANDOFF.md`
4. 현재 작업과 관련된 계획 문서
   - ERP 모듈/메뉴 작업: `ERP_MODULE_SEPARATION_MENU_PLAN.md`
   - 메뉴 검색: `MENU_SEARCH_FEATURE_PLAN.md`
   - MDI 탭: `MDI_TAB_LAYOUT_DESIGN.md`
   - 회사전용 기능 확인이 필요할 때만: `DISTRIBUTION_WORKFORCE_PLAN.md`, `SUNGWON_TAX_INVOICE_CONVERSION_PLAN.md`
5. 실제 변경 대상 코드

## 2. 현재 활성 에픽

| 항목 | 내용 |
| --- | --- |
| 활성 에픽 | ERP 모듈 분리 및 메뉴 구조 정리 |
| 현재 차수 | 2차: 프로젝트/현장 모듈 도입 |
| 우선 착수 | 프로젝트등록/현장정보관리/현장인력배치 1단계 CRUD 완료, 다음은 계약관리 또는 발주처/담당자관리 |
| 첫 업무 모듈 | 2차: 프로젝트/현장 |
| 장기 계획 문서 | `ERP_MODULE_SEPARATION_MENU_PLAN.md` |
| 상태 | 0차 메뉴/탐색 정리 완료, 1차 인사/조직 기반 정리 완료, 자격증은 보조 기능으로 유지, 프로젝트/현장 기본 CRUD 3개 완료 |

## 3. 최근 완료 내용

### 2026-07-08

- 프로젝트/현장 2차 세 번째 화면 `현장인력배치` 1단계 CRUD 완료
  - 신규 메뉴 코드: `OP_PROJECT_ASSIGNMENTS`
  - 신규 화면: `/operation/project-assignments`
  - 신규 API: `/api/project-assignments`
  - `backend/src/modules/project-assignments/*`
    - `ProjectAssignment` 엔티티 추가
    - 프로젝트 FK, 현장 FK nullable, 사원 FK, 역할, 시작일, 종료일, 배치상태, 메모, 사용여부, 정렬순서 관리
    - 프로젝트는 필수, 현장은 선택으로 설계
    - 현장을 선택한 경우 해당 현장이 선택 프로젝트에 속하는지 백엔드에서 검증
    - `@MenuCode('OP_PROJECT_ASSIGNMENTS')`, `read/create/update/delete` 권한 적용
  - `backend/src/app.module.ts`
    - `ProjectAssignmentsModule` 등록
  - `backend/src/modules/menus/menus.seed.ts`
    - `PROJECT_FIELD` 그룹에 `현장인력배치` 메뉴 추가
    - `배전인력`은 같은 그룹 4번으로 유지
  - `frontend/src/features/operation/project-assignments/*`
    - 배치 API 클라이언트, 타입, `ProjectAssignmentsManager` 추가
    - 검색조건: 검색어, 프로젝트, 현장, 상태, 사용여부
    - 목록: 프로젝트, 현장, 사원, 부서/직위, 역할, 기간, 상태, 사용여부
    - 상세: 프로젝트, 현장, 사원, 역할, 시작일/종료일, 상태, 메모
  - `frontend/src/config/menus.ts`
    - `프로젝트/현장 > 프로젝트 > 현장인력배치` 메뉴 추가
  - 검증
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run build`: 성공, `/operation/project-assignments` route 확인
    - `cd frontend && npm run lint`: 성공
    - 백엔드 재기동: PID `3408`, 4000번 실행 중
    - `POST /api/auth/login`: `admin` / `00000000` 성공, 권한 수 19
    - `/api/menus?page=1&limit=100`: `OP_PROJECT_ASSIGNMENTS|PROJECT_FIELD|/operation/project-assignments` 확인
    - 검증 사원: `이진수`, `EMP-000007`
    - `POST /api/projects`: 현장인력배치 검증용 프로젝트 `PRJ-000003` 생성
    - `POST /api/project-sites`: 검증용 현장 `SITE-000002` 생성
    - `POST /api/project-assignments`: 성공, 검증 배치 id 1 생성
    - `PATCH /api/project-assignments/:id`: 성공, 상태 `assigned` 반영
    - `/api/project-assignments?page=1&limit=20&projectId=:id&projectSiteId=:id`: 성공, total 1
    - `DELETE /api/project-assignments/:id`: 성공, affected 1
    - `DELETE /api/project-sites/:id`: 성공, affected 1
    - `DELETE /api/projects/:id`: 성공, affected 1
    - 삭제 후 `/api/project-assignments?page=1&limit=20`: total 0
- 프로젝트/현장 2차 두 번째 화면 `현장정보관리` 1단계 CRUD 완료
  - 신규 메뉴 코드: `OP_PROJECT_SITES`
  - 신규 화면: `/operation/project-sites`
  - 신규 API: `/api/project-sites`
  - 신규 자동채번: `PROJECT_SITE` -> `SITE-000001`
  - `backend/src/modules/project-sites/*`
    - `ProjectSite` 엔티티 추가
    - 프로젝트 FK, 현장코드, 현장명, 현장주소, 담당자, 연락처, 기간, 상태, 메모, 사용여부, 정렬순서 관리
    - 프로젝트와 현장은 1:N 구조로 설계
    - `@MenuCode('OP_PROJECT_SITES')`, `read/create/update/delete` 권한 적용
  - `backend/src/app.module.ts`
    - `ProjectSitesModule` 등록
  - `backend/src/modules/menus/menus.seed.ts`
    - `PROJECT_FIELD` 그룹에 `현장정보관리` 메뉴 추가
    - `배전인력`은 같은 그룹 3번으로 유지
  - `backend/src/database/seeds/dev-seed.service.ts`
    - `PROJECT_SITE` 채번 규칙 seed 추가
  - `frontend/src/features/operation/project-sites/*`
    - 현장 API 클라이언트, 타입, `ProjectSitesManager` 추가
    - 검색조건: 검색어, 프로젝트, 상태, 사용여부
    - 목록: 현장코드, 프로젝트, 현장명, 담당자, 연락처, 기간, 상태, 사용여부
    - 상세: 프로젝트, 현장명/주소, 담당자/연락처, 기간, 상태/메모
  - `frontend/src/config/menus.ts`
    - `프로젝트/현장 > 프로젝트 > 현장정보관리` 메뉴 추가
  - 검증
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run build`: 성공, `/operation/project-sites` route 확인
    - `cd frontend && npm run lint`: 성공
    - 백엔드 재기동: PID `38116`, 4000번 실행 중
    - `POST /api/auth/login`: `admin` / `00000000` 성공, 권한 수 18
    - `/api/menus?page=1&limit=100`: `OP_PROJECT_SITES|PROJECT_FIELD|/operation/project-sites` 확인
    - `POST /api/projects`: 현장 검증용 프로젝트 `PRJ-000002` 생성
    - `POST /api/project-sites`: 성공, 검증 데이터 `SITE-000001` 생성
    - `PATCH /api/project-sites/:id`: 성공, 상태 `in_progress` 반영
    - `/api/project-sites?page=1&limit=20&projectId=:id`: 성공, total 1
    - `DELETE /api/project-sites/:id`: 성공, affected 1
    - `DELETE /api/projects/:id`: 성공, affected 1
    - 삭제 후 `/api/project-sites?page=1&limit=20`: total 0
- 프로젝트/현장 2차 첫 화면 `프로젝트등록` 1단계 CRUD 완료
  - 신규 메뉴 코드: `OP_PROJECTS`
  - 신규 화면: `/operation/projects`
  - 신규 API: `/api/projects`
  - 신규 자동채번: `PROJECT` -> `PRJ-000001`
  - `backend/src/modules/projects/*`
    - `Project` 엔티티 추가
    - 프로젝트코드, 공사번호, 프로젝트명, 발주처, 현장주소, 시작일, 종료일, 상태, 메모, 사용여부, 정렬순서 관리
    - `@MenuCode('OP_PROJECTS')`, `read/create/update/delete` 권한 적용
  - `backend/src/app.module.ts`
    - `ProjectsModule` 등록
  - `backend/src/modules/menus/menus.seed.ts`
    - `PROJECT_FIELD` 그룹에 `프로젝트등록` 메뉴 추가
    - `배전인력`은 같은 그룹 2번으로 유지
  - `backend/src/database/seeds/dev-seed.service.ts`
    - `PROJECT` 채번 규칙 seed 추가
  - `frontend/src/features/operation/projects/*`
    - 프로젝트 API 클라이언트, 타입, `ProjectsManager` 추가
    - 검색조건: 검색어, 상태, 사용여부
    - 목록: 프로젝트코드, 공사번호, 프로젝트명, 발주처, 기간, 상태, 사용여부
    - 상세: 기본정보, 현장/기간, 상태/메모
  - `frontend/src/config/menus.ts`
    - `프로젝트/현장 > 프로젝트 > 프로젝트등록` 메뉴 추가
  - 검증
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run build`: 성공, `/operation/projects` route 확인
    - `cd frontend && npm run lint`: 성공
    - `git diff --check`: CRLF 경고만 있음
    - 백엔드 재기동: PID `16828`, 4000번 실행 중
    - `POST /api/auth/login`: `admin` / `00000000` 성공, 권한 수 17
    - `/api/menus?page=1&limit=100`: `OP_PROJECTS|PROJECT_FIELD|/operation/projects` 확인
    - `/api/projects?page=1&limit=20`: 성공, total 0
    - `POST /api/projects`: 성공, 검증 데이터 `PRJ-000001` 생성
    - `PATCH /api/projects/:id`: 성공, 상태 `in_progress` 반영
    - `DELETE /api/projects/:id`: 성공, affected 1
    - 삭제 후 `/api/projects?page=1&limit=20`: total 0
- 사원자격증조회/자격만료현황 UX 정리 완료
  - `frontend/src/features/operation/employee-certificates/components/EmployeeCertificateInquiryManager.tsx`
    - 만료상태 표시 기준을 사원별자격증등록 화면과 맞춤
      - 미입력, 유효, D-n, 오늘 만료, n일 경과
    - 결과 상단에 조회결과, 만료, 임박, 유효, 미입력 요약 추가
    - 검색조건 하단에 현재 조회 기준 요약 추가
    - 결과 테이블의 만료상태를 배지로 표시
    - 자격만료현황 모드에서는 만료/임박 행이 더 눈에 띄도록 배경 강조
    - 기존 `inquiry`, `expiry-status` 모드와 API 계약은 유지
  - 검증
    - `cd frontend && npm run build`: 성공
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run lint`: 성공
    - 백엔드 PID `23364`, 4000번 실행 중
    - `POST /api/auth/login`: `admin` / `00000000` 성공
    - `/api/employee-certificate-inquiries?page=1&limit=100&isActive=true`: 성공, total 6
    - `/api/employee-certificate-expiry-status?page=1&limit=100&isActive=true`: 성공, total 6
- 사원별자격증등록 UX 정리 완료
  - `frontend/src/features/operation/employee-certificates/components/EmployeeCertificatesManager.tsx`
    - 선택 사원 패널에 사원코드, 부서, 직위, 재직/퇴사/미사용 상태 요약 추가
    - 검색조건의 선택 사원 영역을 사원명/코드, 부서/직위, 상태 배지로 정리
    - 보유 자격증 목록에 만료상태 배지 추가
      - 미입력, 유효, D-n, 오늘 만료, n일 경과
    - 상세 카드 제목을 `자격증 상세`로 정리
    - 상세 상단에 대상 사원, 선택 자격증, 현재 입력된 만료상태 배지 표시
    - 기존 사원별자격증 API 계약과 저장 흐름은 유지
  - 검증
    - `cd frontend && npm run build`: 성공
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run lint`: 성공
    - 백엔드 PID `23364`, 4000번 실행 중
    - `POST /api/auth/login`: `admin` / `00000000` 성공
    - `/api/employees?page=1&limit=20&isActive=true`: 성공, total 2
    - `/api/employee-certificates?page=1&limit=20`: 성공, total 6
    - `/api/employee-certificate-expiry-status?page=1&limit=10&isActive=true`: 성공, total 6
- 조직/직위 이력 관리 UI 2단계 완료
  - `frontend/src/features/operation/employees/types/employee.types.ts`
    - `EmployeeOrganizationHistoryForm` 타입 추가
  - `frontend/src/features/operation/employees/api/employees.api.ts`
    - `createEmployeeOrganizationHistory()` 추가
  - `frontend/src/features/operation/employees/components/EmployeesManager.tsx`
    - `사원 프로필 > 조직/직위` 이력 패널에 `이력 추가` 버튼 추가
    - 사업단위, 부서, 직위, 적용일, 변경사유를 입력하는 인라인 폼 추가
    - 등록 성공 시 현재 사원의 사업단위/부서/직위 스냅샷과 최근 이력 목록 갱신
    - 사원 선택/신규/저장/삭제 시 이력 폼 상태 초기화
  - 검증
    - `cd frontend && npm run build`: 성공
    - `cd frontend && npm run lint`: 성공
    - 백엔드는 기존 PID `35428`, 4000번 실행 유지
- 조직/직위 이력 테이블/API 1단계 완료
  - `backend/src/modules/employees/entities/employee-organization-history.entity.ts`
    - `employee_organization_histories` 신규 엔티티 추가
    - 사원, 사업단위, 부서, 직위 FK와 이름 스냅샷 저장
    - `effectiveFrom`, `effectiveTo`, `isCurrent`, `changeReason` 관리
  - `backend/src/modules/employees/dto/create-employee-organization-history.dto.ts`
    - 수동 이력 등록용 DTO 추가
  - `backend/src/modules/employees/employees.service.ts`
    - 사원 생성 시 현재 조직/직위 이력 자동 생성
    - 사원 수정 시 사업단위/부서/직위가 변경된 경우 기존 current 이력을 종료하고 새 current 이력 생성
    - `employees`는 최신 상태 스냅샷, `employee_organization_histories`는 감사/조회 원장으로 역할 분리
    - 기존 사원 현재 조직/직위 백필 기능 추가
  - `backend/src/modules/employees/employees.controller.ts`
    - `GET /api/employees/:id/organization-histories`
    - `POST /api/employees/:id/organization-histories`
    - `POST /api/employees/organization-history-backfill?dryRun=true`
  - `frontend/src/features/operation/employees/*`
    - 조직/직위 이력 타입/API 추가
    - `사원 프로필 > 조직/직위` 섹션에 최근 이력 5건 읽기 전용 표시
    - 사원 선택/저장 후 이력 재조회
  - 검증
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run build`: 성공
    - `cd frontend && npm run lint`: 성공
    - 백엔드 재기동: PID `35428`, 4000번 실행 중
    - `POST /api/employees/organization-history-backfill?dryRun=true`: 성공, creatable 1
    - `POST /api/employees/organization-history-backfill`: 성공, created 1
    - `GET /api/employees/2/organization-histories`: 성공, history 1건/current 1건
- 사원 프로필 화면 섹션화 완료
  - `frontend/src/features/operation/employees/components/EmployeesManager.tsx`
    - 사원 상세 카드 제목을 `사원 프로필`로 정리
    - 상세 입력 영역을 `기본정보`, `조직/직위`, `연락처/개인정보`, `재직정보` 섹션으로 분리
    - `DetailSection` 로컬 컴포넌트 추가로 상세 섹션 레이아웃 일관성 확보
    - 기존 저장 payload, 조회 API, 주민등록번호 마스킹 정책은 그대로 유지
  - 1차 구조 결정
    - `employees.departmentId`, `employees.positionId`는 현재 소속/직위 스냅샷으로 유지
    - 조직/직위 변경 이력은 다음 단계에서 별도 `employee_organization_histories` 테이블로 분리하는 방향
  - 검증
    - `cd frontend && npm run build`: 성공
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run lint`: 성공
- 사원 개인정보/프로필 표시 정책 1단계 완료
  - `frontend/src/features/operation/employees/components/EmployeesManager.tsx`
    - 사원 목록에는 주민등록번호를 표시하지 않는 기존 정책 유지
    - 사원 상세의 주민등록번호는 기존 사원 선택 시 기본 마스킹 표시
    - 눈 아이콘 버튼으로 명시적으로 보기/가리기 전환
    - 마스킹 상태에서는 입력칸을 read-only로 두어 가려진 문자열이 실수로 저장되지 않게 처리
    - 새 사원 입력 또는 명시적 보기 상태에서만 주민등록번호 원문 편집 가능
  - `backend/src/modules/employees/employees.service.ts`
    - 사원등록 엑셀 양식의 `작성안내` 시트에 주민등록번호 민감정보 취급 안내 추가
  - 검증
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run build`: 성공
    - `cd frontend && npm run lint`: 성공
    - 백엔드 재기동: PID `33980`, 4000번 실행 중
    - `POST http://localhost:4000/api/auth/login`: `admin` / `00000000` 성공
    - `/api/employees?page=1&limit=20`: 성공, total 2
    - `/api/employees/excel-template`: 성공, HTTP 200, 파일 응답 확인
- `부서조직도` 사원 배치 및 사원관리 연계 보강 완료
  - `backend/src/modules/organization-chart/dto/organization-chart-employees-query.dto.ts`
    - 부서별 사원 목록 조회용 pagination DTO 추가
  - `backend/src/modules/organization-chart/organization-chart.service.ts`, `organization-chart.controller.ts`
    - `GET /api/organization-chart/departments/:id/employees` 추가
    - 선택 부서의 사원 목록을 반환
    - `departmentId` 우선, 기존 이름-only 데이터는 `departmentName` exact match fallback으로 조회
    - 사원 상태는 `active`, `resigned`, `inactive`로 반환
  - `backend/src/modules/employees/dto/employee-query.dto.ts`, `employees.service.ts`
    - 사원 목록 조회 조건에 `employeeId`, `departmentId` 추가
  - `frontend/src/features/operation/organization-chart/*`
    - 조직도 화면을 `부서 트리 + 선택 부서 사원 목록` 2열 구성으로 보강
    - 부서 선택 시 오른쪽 패널에 사원 목록 표시
    - 사원등록 이동: `/operation/employees?departmentId=:id`
    - 사원 열기: `/operation/employees?employeeId=:id`
  - `frontend/src/features/operation/employees/*`
    - 사원등록 화면에 부서 검색 필터 추가
    - URL query `departmentId`, `employeeId`를 초기 조회 조건으로 반영
  - 검증
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run build`: 성공
    - `cd frontend && npm run lint`: 성공
    - 백엔드 재기동: PID `22488`, 4000번 실행 중
    - `POST http://localhost:4000/api/auth/login`: `admin` / `00000000` 성공, 권한 수 16
    - `/api/organization-chart`: 성공
    - `/api/organization-chart/departments/1/employees?page=1&limit=100`: 성공, total 1
    - `/api/employees?page=1&limit=100&departmentId=1`: 성공, total 1
- 기존 사원 FK 백필 API 및 `부서조직도` 화면 추가 완료
  - `backend/src/modules/employees/dto/organization-reference-backfill-query.dto.ts`
    - `dryRun` query 지원
  - `backend/src/modules/employees/employees.service.ts`, `employees.controller.ts`
    - `POST /api/employees/organization-reference-backfill` 추가
    - `employees.departmentName`, `employees.positionName`을 기준정보 이름과 exact match하여 `departmentId`, `positionId`를 채움
    - 기준정보 이름이 없거나 중복이면 업데이트하지 않고 `issues`에 리포트
    - 사원등록 메뉴의 update 권한(`OP_EMPLOYEES`)으로 보호
  - `backend/src/modules/organization-chart/*`
    - `GET /api/organization-chart` 추가
    - `@MenuCode('OP_ORGANIZATION_CHART')`로 메뉴 권한 분리
    - `departments.parentId` 기준 부서 트리, 부서별 직접 전체/재직 사원 수, 미배정 사원 수 반환
  - `backend/src/app.module.ts`
    - `OrganizationChartModule` 등록
  - `backend/src/modules/menus/menus.seed.ts`
    - `HR_CERTIFICATE` 그룹에 `부서조직도` 메뉴 추가
  - `frontend/src/features/operation/organization-chart/*`
    - API 클라이언트, 타입, `OrganizationChartManager` 추가
    - 부서 트리 테이블, 부서/전체 사원/재직/미배정 요약 카드 구성
  - `frontend/src/app/operation/organization-chart/page.tsx`
    - `AppShell`로 부서조직도 화면 등록
  - `frontend/src/config/menus.ts`
    - `인사/자격 > 사원관리 > 부서조직도` 메뉴 추가
  - 검증
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run build`: 성공, `/operation/organization-chart` route 확인
    - `cd frontend && npm run lint`: 성공
    - 백엔드 재기동: PID `2336`, 4000번 실행 중
    - `POST http://localhost:4000/api/auth/login`: `admin` / `00000000` 성공, 권한 수 16
    - `/api/menus?page=1&limit=100`: `OP_ORGANIZATION_CHART` 확인
    - `POST /api/employees/organization-reference-backfill?dryRun=true`: 성공
    - `POST /api/employees/organization-reference-backfill`: 성공
      - 현재 데이터 기준 신규 업데이트 0건
    - `/api/organization-chart`: 성공
      - 현재 응답 예: 부서 2, 전체 사원 2, 미배정 사원 1, root 2
- 사원 부서/직위 FK 1단계 전환 완료
  - `backend/src/modules/employees/entities/employee.entity.ts`
    - `departmentId` nullable FK 추가: `departments.id`
    - `positionId` nullable FK 추가: `positions.id`
    - 기존 `departmentName`, `positionName`은 이름 스냅샷으로 유지
  - `backend/src/modules/employees/dto/create-employee.dto.ts`
    - `departmentId`, `positionId` 입력 허용
  - `backend/src/modules/employees/employees.service.ts`
    - ID가 들어오면 기준정보를 조회해 ID와 이름을 함께 저장
    - 이름만 들어오는 기존 엑셀 업로드/legacy payload는 기존 방식 유지
  - `frontend/src/features/operation/employees/*`
    - 사원 타입/폼/API payload에 `departmentId`, `positionId` 추가
    - 사원등록 화면의 부서/직위 select를 기준정보 ID 기반으로 전환
    - 기존 이름-only 데이터는 이름이 남아 있으면 ID null을 보내지 않아 저장 시 이름을 지우지 않도록 처리
  - `backend/src/modules/hr-dashboard/hr-dashboard.service.ts`
    - 부서별 집계를 `departmentId` 관계 우선, `departmentName` fallback으로 보강
    - 만료 대상 목록도 부서/직위 관계 우선, 이름 fallback으로 표시
  - 검증
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run build`: 성공
    - `cd frontend && npm run lint`: 성공
    - 백엔드 재기동: PID `16052`, 4000번 실행 중
    - `POST http://localhost:4000/api/auth/login`: `admin` / `00000000` 성공, 권한 수 15
    - `PATCH /api/employees/2`에 `departmentId=1`, `positionId=2` 적용 성공
      - 응답: `김중희`, `departmentId=1`, `departmentName=사업부`, `positionId=2`, `positionName=과장`
    - `/api/hr-dashboard?expiryDays=30`: 성공
- 인사/자격 1차 두 번째 화면 `인사현황` 추가 완료
  - 신규 메뉴 코드: `OP_HR_DASHBOARD`
  - 신규 화면: `/operation/hr-dashboard`
  - 신규 API: `/api/hr-dashboard`
  - `backend/src/modules/hr-dashboard/*`
    - 조회 전용 `HrDashboardModule`, `HrDashboardController`, `HrDashboardService` 추가
    - 전체 사원, 재직/퇴사, 활성 자격증, 30일 이내 만료 예정, 이미 만료, 부서별 인원, 자격 만료 대상 목록 집계
    - `@MenuCode('OP_HR_DASHBOARD')`로 메뉴 권한 분리
  - `backend/src/app.module.ts`
    - `HrDashboardModule` 등록
  - `backend/src/modules/menus/menus.seed.ts`
    - `HR_CERTIFICATE` 그룹 첫 항목으로 `인사현황` leaf 메뉴 추가
    - `사원등록`, `사원별자격증등록`, `사원자격증조회`, `자격만료현황` sortOrder 조정
  - `frontend/src/features/operation/hr-dashboard/*`
    - API 클라이언트, 타입, `HrDashboardManager` 추가
    - KPI 카드, 부서별 인원 표, 자격 만료 대상 표 구성
    - 기준 기간은 7일, 30일, 60일, 90일 선택 가능
  - `frontend/src/app/operation/hr-dashboard/page.tsx`
    - `AppShell`로 인사현황 화면 등록
  - `frontend/src/config/menus.ts`
    - `인사/자격 > 사원관리 > 인사현황` 메뉴 추가
  - 검증
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run build`: 성공, `/operation/hr-dashboard` route 확인
    - `cd frontend && npm run lint`: 성공
    - 백엔드 재기동: PID `35068`, 4000번 실행 중
    - `POST http://localhost:4000/api/auth/login`: `admin` / `00000000` 성공, 권한 수 15
    - `/api/menus?page=1&limit=100`: `OP_HR_DASHBOARD` 확인
    - `/api/hr-dashboard?expiryDays=30`: 성공
      - 현재 응답 예: 전체 사원 2, 재직 1, 퇴사 1, 부서 행 2
- 인사/자격 1차 첫 화면 `자격만료현황` 추가 완료
  - 신규 메뉴 코드: `OP_CERTIFICATE_EXPIRY_STATUS`
  - 신규 화면: `/operation/certificate-expiry-status`
  - 신규 API: `/api/employee-certificate-expiry-status`
  - `backend/src/modules/employee-certificates/employee-certificate-expiry-status.controller.ts`
    - `EmployeeCertificatesService.findAll()`을 재사용하는 조회 전용 컨트롤러 추가
    - `@MenuCode('OP_CERTIFICATE_EXPIRY_STATUS')`로 메뉴 권한 분리
  - `backend/src/modules/employee-certificates/employee-certificates.module.ts`
    - 자격만료현황 컨트롤러 등록
  - `backend/src/modules/menus/menus.seed.ts`
    - `HR_CERTIFICATE` 그룹에 `자격만료현황` leaf 메뉴 추가
  - `frontend/src/app/operation/certificate-expiry-status/page.tsx`
    - `EmployeeCertificateInquiryManager`를 `expiry-status` 모드로 렌더링
  - `frontend/src/features/operation/employee-certificates/components/EmployeeCertificateInquiryManager.tsx`
    - 기본 조건을 `만료일 종료 = 오늘 + 30일`, `사용여부 = 사용`으로 설정
    - 조회 API를 일반 조회/만료현황 모드에 따라 분기
  - 검증
    - `cd backend && npm run build`: 성공
    - `cd frontend && npm run build`: 성공
    - `cd frontend && npm run lint`: 성공
    - 백엔드 재기동: PID `30224`, 4000번 실행 중
    - `POST http://localhost:4000/api/auth/login`: `admin` / `00000000` 성공, 권한 수 14
    - `/api/menus?page=1&limit=100`: `OP_CERTIFICATE_EXPIRY_STATUS` 확인
    - `/api/employee-certificate-expiry-status?page=1&limit=10&expiredDateTo=2099-12-31&isActive=true`: 성공, total 4
- 프론트 lint baseline 정리 완료
  - `frontend/eslint.config.mjs`
    - 기존 CRUD 화면 전반의 mount 직후 데이터 로딩 패턴 때문에 발생하던 `react-hooks/set-state-in-effect` 룰을 프로젝트 정책상 비활성화
  - `frontend/src/features/operation/employee-certificates/components/EmployeeCertificatesManager.tsx`
    - 미사용 `employeeMap` 제거
  - 검증
    - `cd frontend && npm run lint`: 성공
- 백엔드 메뉴 seed 정합성 보강 완료
  - 결정: 0차에서는 백엔드 메뉴 DB에 상위 그룹 노드를 만들지 않는다.
  - 결정: `Menu` 엔티티 스키마 확장(`moduleCode`, `menuType`, nullable `path`)은 1차 이후 메뉴관리 화면 설계 때 다시 검토한다.
  - `backend/src/modules/menus/menus.seed.ts`
    - leaf 메뉴의 `menuGroupCode`를 프론트 모듈 분류와 맞춤
    - `MASTER_DATA`: 사업자등록, 사업단위등록, 부서등록, 직위등록, 자격증종류등록
    - `HR_CERTIFICATE`: 인사현황, 사원등록, 부서조직도, 사원별자격증등록, 사원자격증조회, 자격만료현황
    - `PROJECT_FIELD`: 배전인력
    - `ACCOUNTING_TAX`: 세금계산서변환
    - `SYSTEM`: 사용자등록, 권한등록, 환경설정
  - `backend/src/modules/menus/menus.service.ts`, `backend/src/database/seeds/dev-seed.service.ts`
    - 기존 메뉴가 이미 있어도 seed의 `menuGroupCode`, `path`, `sortOrder`, 이름 변경이 반영되도록 업데이트 로직 추가
  - 검증
    - `cd backend && npm run build`: 성공
    - 백엔드 재기동: PID `30224`
    - `POST http://localhost:4000/api/auth/login`: 성공
    - `/api/menus?page=1&limit=100` 그룹 분포: `MASTER_DATA 5`, `HR_CERTIFICATE 6`, `PROJECT_FIELD 1`, `ACCOUNTING_TAX 1`, `SYSTEM 3`
    - 로그인 권한 수: 16
- 로그인 500/401 문제 조치
  - 현재 개발 관리자 계정: `admin` / `00000000`
  - 원인 1: 백엔드 4000번 서버가 떠 있지 않아 프론트 `/api/auth/login` rewrite가 실패할 수 있는 상태였음
  - 원인 2: 기존 DB에 admin 계정이 있으면 개발 seed가 비밀번호를 갱신하지 않아 당시 개발 비밀번호 로그인 검증이 401로 실패했음
  - `backend/src/database/seeds/dev-seed.service.ts` 수정
    - 기존 admin 계정을 `password` 컬럼까지 조회하도록 `addSelect('user.password')` 적용
    - 기존 admin 비밀번호가 `DEV_ADMIN_PASSWORD`와 다르면 개발 seed 실행 시 해시를 갱신하고 `isActive`를 true로 복구
  - 검증
    - `cd backend && npm run build`: 성공
    - `node dist\main.js`: 백엔드 4000번 실행 중
    - `POST http://localhost:4000/api/auth/login`: 성공
    - `POST http://localhost:3000/api/auth/login`: 성공
    - 로그인 사용자: `admin`, 당시 권한 수 13. `자격만료현황` 추가 후 현재 권한 수 14
- 프론트 메뉴 계층화 구현 완료
  - `frontend/src/types/menu.ts`: `MenuNode`, `MenuMdiConfig`, `moduleCode` 추가
  - `frontend/src/config/menus.ts`: 기존 `운영` 단일 메뉴를 `기준정보`, `인사/자격`, `프로젝트/현장`, `세무/회계`, `시스템` 구조로 재배치
  - `frontend/src/components/layout/MenuGroup.tsx`: 모듈 단위 접힘/펼침 아코디언과 섹션/leaf 메뉴 렌더링 구현
  - `frontend/src/components/layout/AppSidebar.tsx`, `frontend/src/components/layout/AppShell.tsx`: 새 메뉴 간격에 맞게 사이드바 spacing 조정
  - `frontend/src/features/mdi-tabs/utils/mdi-tab-registry.ts`: 계층 메뉴의 leaf 메뉴만 MDI 등록 대상으로 사용
  - `frontend/src/features/menu-search/*`: 계층 메뉴 평탄화 및 breadcrumb 검색 결과 표시
- 검증
  - `cd frontend && npm run build`: 성공
  - `http://localhost:3000`: 개발 서버 실행 및 HTTP 200 확인
  - `cd frontend && npm run lint`: 성공
- `ERP_MODULE_SEPARATION_MENU_PLAN.md` 신규 작성
- ERP 모듈 차수 정의
  - 0차: 메뉴/권한/탐색 구조 정리
  - 1차: 인사/자격
  - 2차: 프로젝트/현장
  - 3차: 세무/회계, 매출/매입
  - 4차: 구매/재고/자산
  - 5차: 근태/급여/전자결재/리포트
- 0차 권장 메뉴 구조 정의
  - 기준정보
  - 인사/자격
  - 프로젝트/현장
  - 세무/회계
  - 시스템
- 첫 착수 모듈을 `인사/자격`으로 정함
- 회사 전용 기능인 `배전인력`, `세금계산서변환`은 계속 `company-features`로 격리하되, 공통 ERP 후속 설계/개발 우선순위에서는 제외하기로 결정

## 4. 다음 작업

다음 세션에서 바로 시작할 수 있는 작업 단위다.

### 작업 N+3: 프로젝트/현장 2차 다음 작업

권장 다음 작업:

- `프로젝트등록`, `현장정보관리`, `현장인력배치`는 1단계 CRUD가 완료됐다.
- `세금계산서변환`, `배전인력`은 회사전용/특수 타겟이므로 이제 공통 ERP 후속 개발 대상에서 제외한다.
- 다음은 공통 ERP 흐름으로 `계약관리`, `발주처/담당자관리`, `프로젝트 손익 기초` 중 하나를 선택한다.
- 프로젝트/현장 데이터는 향후 공통 회계/매출/매입이 생길 때 `projects.id` 또는 `constructionNo`로 연결할 수 있게 유지한다.

다음 구현 후보:

- `계약관리`
  - 프로젝트 선택
  - 계약번호, 계약일, 계약금액, 계약기간, 계약상태
  - 계약 문서/비고는 2단계로 보류
- `발주처/담당자관리`
  - 프로젝트 또는 거래처 기준 담당자 정보 관리
  - 담당자명, 부서/직책, 연락처, 이메일
- `프로젝트 손익 기초`
  - 프로젝트별 예상 매출/예상 원가의 최소 필드
  - 실제 매출/매입 모듈이 생기기 전까지는 요약 수준만 유지

구현 방향:

- `프로젝트등록` 1단계 CRUD는 완료 상태로 유지한다.
- `현장정보관리` 1단계 CRUD는 완료 상태로 유지한다.
- `현장인력배치` 1단계 CRUD는 완료 상태로 유지한다.
- 기존 `/operation/...` 라우트는 당장 유지한다.
- `배전인력`, `세금계산서변환` 코드는 회사전용 폴더에 유지하되, 당분간 신규 연계/고도화 작업은 하지 않는다.
- 자격증 관련 추가 고도화는 현장 배치 요구사항이 다시 나오기 전까지 진행하지 않는다.

검증:

- `cd backend && npm run build`
- `cd frontend && npm run build`
- `cd frontend && npm run lint`
- `admin` 로그인 후 신규 API, 메뉴 권한, 기존 프로젝트등록/현장정보관리/현장인력배치 영향 확인

## 5. 미결정 사항

| 항목 | 권장값 | 상태 |
| --- | --- | --- |
| 기존 `/operation/...` 라우트 변경 | 당장은 유지 | 미결정 |
| 백엔드 메뉴 DB 계층화 | 1차 이후 메뉴관리 화면 설계 때 검토 | 0차 보류 결정 |
| 기존 `OP_*` 메뉴 코드 변경 | 당장 변경하지 않음 | 권장 확정 |
| 공통코드/자동채번 화면 추가 | 1차 포함 | 미결정 |
| 사원 부서/직위 FK 전환 | 기존 문자열 보존 + nullable FK 추가 방식 | 1단계 완료 |
| 기존 사원 FK 백필 | exact match만 적용, 미매칭은 리포트 | 완료 |
| 부서조직도 | 부서 트리와 직접 인원 수부터 제공 | 1단계 완료 |
| 부서조직도 사원 배치 | 선택 부서 상세 패널 방식 | 완료 |
| 사원 개인정보 표시 정책 | 목록 비노출, 상세 기본 마스킹, 엑셀 안내 추가 | 완료 |
| 사원 프로필 섹션화 | 기본정보/조직·직위/연락처·개인정보/재직정보 섹션 분리 | 완료 |
| 사원 조직·직위 이력 분리 | `employees`는 최신 스냅샷, 이력은 별도 테이블 | 완료 |
| 조직·직위 이력 관리 UI | 이력 추가/적용일/변경사유 입력 | 완료 |
| 사원별자격증등록 UX | 선택 사원 요약, 만료 상태, 상세 입력 흐름 정리 | 완료 |
| 사원자격증조회/자격만료현황 UX | 결과 요약, 만료상태 배지, 스캔성 개선 | 완료 |
| 자격증종류등록 개선 | 자격증은 보조 기능으로 유지, 추가 고도화 보류 | 보류 |
| 프로젝트/현장 모듈 | 프로젝트등록/현장정보관리/현장인력배치 1단계 CRUD 완료, 다음 계약관리/발주처관리 | 진행 중 |
| 자격만료현황 API 분리 | 별도 메뉴 코드/엔드포인트 사용 | 완료 |
| 인사현황 API 분리 | 별도 메뉴 코드/엔드포인트 사용 | 완료 |

## 6. 세션 종료 시 갱신 규칙

AI 개발 세션이 끝날 때마다 이 문서를 반드시 갱신한다.

갱신할 곳:

- `최근 완료 내용`
- `다음 작업`
- `미결정 사항`
- 필요하면 `현재 활성 에픽`

세션 종료 보고에는 다음을 포함한다.

- 변경 파일
- 완료한 일
- 실행한 검증 명령
- 실패하거나 못 한 검증
- 다음 세션 첫 작업

## 7. 새 세션용 시작 프롬프트

새 AI 세션을 열 때 아래처럼 시작하면 된다.

```txt
BHERP 이어서 개발하자.
먼저 AGENTS.md, AI_DEVELOPMENT_CONTEXT.md, AI_SESSION_HANDOFF.md를 읽고 현재 상태를 파악해.
이번 목표는 AI_SESSION_HANDOFF.md의 '다음 작업' 첫 항목부터 진행하는 거야.
기존 사용자 변경은 되돌리지 말고, 구현 후 빌드 검증하고, 마지막에 AI_SESSION_HANDOFF.md를 갱신해.
```

## 8. 운영 원칙

- 장기 계획은 계획 문서에 둔다.
- 현재 진행상황은 이 문서에 둔다.
- 하루 작업 요약은 필요할 때 날짜별 `YYYY-MM-DD_WORK_SUMMARY.md`에 남긴다.
- 코드 변경 후에는 관련 계획 문서도 현실과 다르면 갱신한다.
- 새 기능을 만들 때는 마지막에 반드시 "다음 세션이 어디서 시작할지"를 남긴다.
