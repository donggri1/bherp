# BHERP AI Development Context

이 문서는 BHERP 프로젝트를 이어서 개발하는 AI/개발자가 빠르게 현재 상태를 파악하기 위한 작업 메모입니다.

## 프로젝트 개요

- 프로젝트명: BHERP
- 목적: 실무형 ERP 기초 구조 및 운영 관리 기능 구현
- 루트 경로: `C:\E\BHERP1`
- 구조:
  - `backend`: NestJS API 서버
  - `frontend`: Next.js 프론트엔드
- 기본 개발 언어/응답 언어: 한국어

## AI 세션 이어받기

새 AI 개발 세션을 열면 아래 문서를 먼저 읽습니다.

1. `AGENTS.md`
2. `AI_DEVELOPMENT_CONTEXT.md`
3. `AI_SESSION_HANDOFF.md`
4. 현재 작업과 관련된 계획 문서

`AI_DEVELOPMENT_CONTEXT.md`는 프로젝트의 안정적인 기본 정보를 담고, `AI_SESSION_HANDOFF.md`는 현재 활성 작업, 최근 완료 내용, 다음 작업, 미결정 사항을 담습니다.

세션 종료 시에는 `AI_SESSION_HANDOFF.md`를 갱신해 다음 세션이 바로 이어서 개발할 수 있게 합니다.

## 기술 스택

### Backend

- NestJS
- TypeScript
- TypeORM
- MySQL
- JWT 인증
- Role/Menu 기반 권한 제어
- 개발 시 `synchronize` 사용

### Frontend

- Next.js 16
- React
- TypeScript
- Tailwind CSS
- shadcn/ui 기반 컴포넌트
- lucide-react 아이콘

## 실행 방법

### Backend

```powershell
cd C:\E\BHERP1\backend
npm run build
node dist\main.js
```

기본 포트는 `4000`입니다.

### Frontend

```powershell
cd C:\E\BHERP1\frontend
npm run build
npm run start:lan
```

기본 포트는 `3000`입니다.

### 외부 테스트 공개

외부 고객에게 잠깐 보여줄 때는 백엔드 4000번을 직접 공개하지 말고, 프론트 3000번만 터널링합니다.

```powershell
cloudflared tunnel --url http://localhost:3000
```

프론트는 `/api` 상대 경로를 호출하고, `frontend/next.config.ts`에서 `http://localhost:4000/api`로 rewrite합니다.

절전모드에 들어가면 서버와 터널이 모두 끊기므로 데모 중에는 PC 절전모드를 꺼야 합니다.

## 환경 파일

- `backend/.env`: 실제 개발 환경값. Git에 커밋하지 않음.
- `backend/.env.example`: 예시 환경값.
- `frontend/.env.local`: 실제 프론트 환경값. Git에 커밋하지 않음.
- `frontend/.env.local.example`: 예시 환경값.

현재 프론트 API 설정은 외부 터널링을 위해 다음 구조를 사용합니다.

```env
NEXT_PUBLIC_API_BASE_URL=/api
```

## Git 관리 메모

이 프로젝트는 루트 `C:\E\BHERP1`에서 하나의 저장소로 관리하는 방향입니다.

과거에 `backend/.git`, `frontend/.git`이 별도 저장소로 존재했으므로 루트 저장소 기준으로 관리하려면 하위 `.git`은 `.git.backup`으로 치워둔 상태여야 합니다.

루트 `.gitignore`에는 다음 계열을 제외합니다.

- `.agents/`
- `.git.backup-empty/`
- `**/.git.backup/`
- `**/node_modules/`
- `**/dist/`
- `frontend/.next/`
- `*.log`
- `backend/.env`
- `frontend/.env.local`

## 인증/권한 구조

### 개발 관리자 계정

개발 seed 기준:

- 로그인 ID: `admin`
- 비밀번호: `00000000`

### Backend 권한 패턴

권한이 필요한 컨트롤러는 보통 다음 패턴을 사용합니다.

```ts
@UseGuards(JwtAuthGuard, MenuPermissionGuard)
@MenuCode('OP_SOME_MENU')
```

각 핸들러에는 다음 권한 데코레이터를 붙입니다.

```ts
@Permission('read')
@Permission('create')
@Permission('update')
@Permission('delete')
```

신규 메뉴를 추가할 때는 최소한 아래 두 곳을 함께 갱신해야 합니다.

- `backend/src/modules/menus/menus.seed.ts`
- `frontend/src/config/menus.ts`

개발 seed가 관리자 역할에 메뉴 권한을 부여합니다.

## 화면/레이아웃 규칙

기존 운영 화면은 다음 구조를 유지합니다.

```tsx
<AppShell>
  <SomeManager />
</AppShell>
```

신규 페이지는 반드시 `AppShell`로 감싸야 사이드바/상단 네비게이션이 보입니다.

운영 화면 내부 구성은 대체로 다음 순서를 따릅니다.

1. `PageHeader`
2. 검색조건 `Card`
3. `ActionButtons`
4. 메시지 영역
5. 목록 `Card`
6. 상세 `Card`가 필요한 경우 우측 배치

모바일에서는 `AppHeader`의 햄버거 버튼으로 메뉴 패널을 엽니다.

## 주요 Backend 모듈

### 공통/인증

- `auth`: 로그인, refresh, logout, me
- `roles`: 역할 및 메뉴 권한
- `menus`: 메뉴 등록/seed
- `common-codes`: 공통코드
- `sequences`: 자동채번 규칙 및 번호 발급

### 운영 기준정보

- `companies`
- `business-registrations`
- `business-units`
- `departments`
- `positions`
- `users`
- `employees`
  - `departmentId` -> `departments.id`, `positionId` -> `positions.id` nullable FK 사용
  - `departmentName`, `positionName`은 기존 데이터/엑셀 업로드 호환용 이름 스냅샷으로 계속 보존
  - FK 백필 API: `POST /api/employees/organization-reference-backfill`
    - `dryRun=true`로 미리보기 가능
    - 부서명/직위명 exact match만 FK를 채우고, 미매칭/중복명은 리포트만 반환

### 인사/자격 현황

- `hr-dashboard`
  - API: `/api/hr-dashboard`
  - 메뉴 코드: `OP_HR_DASHBOARD`
  - 전체 사원, 재직/퇴사, 활성 자격증, 만료 예정/만료 자격증, 부서별 인원, 자격 만료 대상 목록을 조회
  - 부서별 집계는 `employees.departmentId` 관계를 우선 사용하고, 기존 데이터는 `departmentName` 문자열로 fallback
- `organization-chart`
  - API: `/api/organization-chart`
  - 메뉴 코드: `OP_ORGANIZATION_CHART`
  - `departments.parentId` 기준 부서 트리와 부서별 직접 사원 수를 조회
  - 부서별 사원 목록 API: `/api/organization-chart/departments/:id/employees`
  - 사원등록 연계: `/operation/employees?departmentId=:id`, `/operation/employees?employeeId=:id`

### 프로젝트/현장

현재 2차 개발 축입니다. 자격증은 보조 기능으로 유지하고, 프로젝트/현장 쪽을 ERP의 다음 업무 중심으로 확장합니다.

- `projects`
  - 메뉴 코드: `OP_PROJECTS`
  - 화면: `/operation/projects`
  - API: `/api/projects`
  - 프로젝트 코드 자동 생성: `PRJ-000001` 형식
  - 관리 항목:
    - 프로젝트코드
    - 공사번호
    - 프로젝트명
    - 발주처
    - 현장주소
    - 시작일/종료일
    - 상태: 예정, 진행, 완료, 보류, 취소
    - 메모
    - 사용여부
  - 다음 연결 후보:
    - 현장정보관리
    - 현장인력배치
    - 계약관리
    - 발주처/담당자관리
    - 프로젝트별 매출/매입 조회
- `project-sites`
  - 메뉴 코드: `OP_PROJECT_SITES`
  - 화면: `/operation/project-sites`
  - API: `/api/project-sites`
  - 현장 코드 자동 생성: `SITE-000001` 형식
  - 프로젝트와 현장은 1:N 구조
  - 관리 항목:
    - 프로젝트
    - 현장코드
    - 현장명
    - 현장주소
    - 담당자
    - 연락처
    - 시작일/종료일
    - 상태: 예정, 진행, 완료, 보류, 취소
    - 메모
    - 사용여부
  - 다음 연결 후보:
    - 현장인력배치
    - 프로젝트별 현장 투입 현황
- `project-assignments`
  - 메뉴 코드: `OP_PROJECT_ASSIGNMENTS`
  - 화면: `/operation/project-assignments`
  - API: `/api/project-assignments`
  - 프로젝트는 필수, 현장은 선택
  - 현장을 선택하면 해당 현장이 프로젝트에 속하는지 백엔드에서 검증
  - 관리 항목:
    - 프로젝트
    - 현장
    - 사원
    - 역할
    - 시작일/종료일
    - 배치상태: 예정, 투입, 완료, 취소
    - 메모
    - 사용여부
  - 다음 연결 후보:
    - 프로젝트/현장별 투입 인원 현황
    - 자격증 보유 여부를 현장 투입 판단의 보조 정보로 표시

### 회사전용 기능

현재 결정:

- `배전인력`, `세금계산서변환`은 특정 회사/특수 업무 타겟이다.
- 기존 코드는 `company-features`에 유지하되, 공통 ERP 설계와 후속 개발 우선순위에서는 제외한다.
- 새 프로젝트/현장 모듈은 이 회사전용 기능과의 연계를 목표로 잡지 않는다.
- 향후 명시 요청이 있을 때만 해당 계획서와 코드를 다시 확인한다.

### 자격증

현재 결정:

- 자격증은 더 이상 핵심 개발 축이 아니다.
- 인사/현장 인력관리 보조 기능으로 현재 수준을 유지한다.
- 자격증종류등록 고도화, 추가 관리기준 필드, 실적시간 기준 공통화는 당분간 보류한다.
- 다음 신규 개발 우선순위는 프로젝트/현장 모듈이다.

- `certificate-types`
  - 자격증 종류 등록
  - 자격증 코드 자동 생성: `CERT-000001` 형식
  - 발급기관은 자격증 종류에 저장
- `employee-certificates`
  - 사원별 자격증 등록
  - 사원 선택 후 해당 사원의 자격증을 관리하는 UX
  - 사원별 자격증에는 발급기관을 별도로 입력하지 않음
  - 조회 전용 API 포함: `/api/employee-certificate-inquiries`
  - 자격만료현황 API 포함: `/api/employee-certificate-expiry-status`

### 환경설정/알림

- `app-settings`
  - 회사별 설정 저장 테이블: `app_settings`
  - 현재 설정 키: `CERTIFICATE_EXPIRY_ALERT_RULES`
  - 기본값: `1시간 전`, `2일 전`, `7일 전`
- `notifications`
  - 자격증 만료 알림 API: `/api/notifications/certificate-expiry`
  - 로그인 사용자 공통 API로, 메뉴 권한 없이 JWT만 필요

## 주요 Frontend 화면

운영 메뉴:

- `/operation/business-registration`: 사업자등록
- `/operation/business-unit`: 사업단위등록
- `/operation/departments`: 부서등록
- `/operation/positions`: 직위등록
- `/operation/users`: 사용자등록
- `/operation/hr-dashboard`: 인사현황
- `/operation/employees`: 사원등록
- `/operation/organization-chart`: 부서조직도
- `/operation/projects`: 프로젝트등록
- `/operation/project-sites`: 현장정보관리
- `/operation/project-assignments`: 현장인력배치
- `/operation/certificate-types`: 자격증종류등록
- `/operation/employee-certificates`: 사원별자격증등록
- `/operation/employee-certificate-inquiry`: 사원자격증조회
- `/operation/certificate-expiry-status`: 자격만료현황
- `/operation/permissions`: 권한등록
- `/operation/admin-settings`: 환경설정

### 사원등록 개인정보 표시 정책

- 사원 목록에는 주민등록번호를 표시하지 않는다.
- 사원 상세에서 기존 사원을 선택하면 주민등록번호는 기본 마스킹된다.
- 눈 아이콘 버튼으로 명시적으로 보기/가리기 전환한다.
- 마스킹 상태의 주민등록번호 입력칸은 read-only로 두어 가려진 문자열이 저장되지 않게 한다.
- 사원등록 엑셀 양식의 `작성안내` 시트에는 주민등록번호 민감정보 취급 안내가 들어간다.
- API 응답은 현재 호환성을 위해 기존 형태를 유지한다. 장기적으로는 목록 응답에서 민감 필드를 제외하고 상세 조회에서만 제공하는 방향을 검토한다.

### 사원 프로필 구조

- `/operation/employees` 상세 패널 제목은 `사원 프로필`이다.
- 상세 입력 영역은 `기본정보`, `조직/직위`, `연락처/개인정보`, `재직정보` 섹션으로 나뉜다.
- 현재 `employees.businessUnitId`, `departmentId`, `positionId`는 최신 상태 스냅샷으로 유지한다.
- 조직/직위 변경 이력은 `employee_organization_histories` 테이블에 저장한다.
- 이력 API:
  - `GET /api/employees/:id/organization-histories`
  - `POST /api/employees/:id/organization-histories`
  - `POST /api/employees/organization-history-backfill?dryRun=true`
- 사원 생성 시 현재 조직/직위 이력이 자동 생성된다.
- 사원 수정 시 사업단위/부서/직위가 바뀌면 기존 current 이력이 종료되고 새 current 이력이 생성된다.
- 기존 사원은 `organization-history-backfill` API로 현재 소속/직위를 이력 원장에 백필한다.
- `사원 프로필 > 조직/직위` 섹션에서 최근 이력 5건을 조회하고, 이력 추가 폼으로 적용일/변경사유를 입력할 수 있다.
- 이력 추가 성공 시 `employees` 최신 스냅샷과 이력 목록이 함께 갱신된다.
- 조직도, 현장인력배치, 자격증 조회는 계속 `employees`의 최신 스냅샷 이름/ID를 기준으로 표시한다.

## 자동채번

개발 seed에서 다음 자동채번 규칙을 사용합니다.

- 부서: `DEPT-000001`
- 직위: `POS-000001`
- 사원: `EMP-000001`
- 자격증 종류: `CERT-000001`
- 프로젝트: `PRJ-000001`
- 현장: `SITE-000001`

신규 기준정보에서 코드 자동생성이 필요하면 `SequencesService.issue(companyId, targetType)` 패턴을 따릅니다.

## 데이터베이스 관계 요약

기본 PK는 대부분 `id`입니다. 회사별 데이터 테이블은 `CompanyBaseEntity`를 상속하고, `companyId`로 `companies.id`를 참조합니다.

주요 FK 관계:

- `business_units.businessRegistrationId` -> `business_registrations.id`
- `departments.businessUnitId` -> `business_units.id`
- `departments.parentId` -> `departments.id`
- `employees.userId` -> `users.id`
- `employees.businessUnitId` -> `business_units.id`
- `employees.departmentId` -> `departments.id`
- `employees.positionId` -> `positions.id`
- `employee_organization_histories.employeeId` -> `employees.id`
- `employee_organization_histories.businessUnitId` -> `business_units.id`
- `employee_organization_histories.departmentId` -> `departments.id`
- `employee_organization_histories.positionId` -> `positions.id`
- `employee_certificates.employeeId` -> `employees.id`
- `employee_certificates.certificateTypeId` -> `certificate_types.id`
- `projects.companyId` -> `companies.id`
- `project_sites.projectId` -> `projects.id`
- `project_assignments.projectId` -> `projects.id`
- `project_assignments.projectSiteId` -> `project_sites.id`
- `project_assignments.employeeId` -> `employees.id`
- `distribution_workforce_certificates.employeeId` -> `employees.id`
- `distribution_workforce_certificates.employeeCertificateId` -> `employee_certificates.id`
- `user_roles.userId` -> `users.id`
- `user_roles.roleId` -> `roles.id`
- `role_menu_permissions.roleId` -> `roles.id`
- `role_menu_permissions.menuId` -> `menus.id`
- `menus.parentId` -> `menus.id`

주의:

- `employees.departmentId`, `employees.positionId`가 nullable FK 기준이다.
- `employees.departmentName`, `employees.positionName`은 기존 데이터/엑셀 업로드 호환 및 표시 안정성을 위한 이름 스냅샷이다.
- 기존 사원 데이터 중 이름만 있고 FK가 없는 행은 `POST /api/employees/organization-reference-backfill`로 매칭/보정한다.
- `common_codes.groupCode`와 `sequence_currents.targetType`은 회사별 코드값으로 연결되는 논리 관계이며, 현재 TypeORM FK 관계로 묶지 않는다.
- 자격증 중복 방지는 DB unique 제약보다 서비스 upsert 로직에서 처리한다. 기존 중복 데이터 정리 전에는 `employee_certificates(companyId, employeeId, certificateTypeId)`를 unique로 바꾸지 않는다.

## 자격증 기능 상세

### 인사현황

- 메뉴 코드: `OP_HR_DASHBOARD`
- 화면: `/operation/hr-dashboard`
- API: `/api/hr-dashboard`
- 주요 지표:
  - 전체 사원 수
  - 재직/퇴사 수
  - 활성 자격증 수
  - 기준 기간 내 만료 예정 자격증 수
  - 이미 만료된 자격증 수
  - 부서별 인원 수
  - 자격 만료 대상 목록
- 기준 기간은 화면에서 7일, 30일, 60일, 90일로 조회 가능하다.

### 부서조직도

- 메뉴 코드: `OP_ORGANIZATION_CHART`
- 화면: `/operation/organization-chart`
- API: `/api/organization-chart`
- 현재 범위:
  - 부서 트리
  - 부서코드
  - 사용여부
  - 부서별 직접 전체 사원 수
  - 부서별 직접 재직 사원 수
  - 미배정 사원 수 요약
  - 선택 부서 사원 목록
  - 사원등록 화면 부서 필터/사원 선택 연계

### 자격증종류등록

- 자격증 코드 자동 생성
- 자격증명
- 발급기관
- 정렬순서
- 사용여부

### 사원별자격증등록

- 왼쪽에서 사원명/사원코드로 사원 검색
- 사원을 선택하면 오른쪽에서 해당 사원 자격증만 조회
- 선택 사원 패널에 사원코드, 부서, 직위, 재직/퇴사/미사용 상태를 표시
- 보유 자격증 목록에 만료상태 배지 표시
  - 미입력
  - 유효
  - D-n
  - 오늘 만료
  - n일 경과
- 상세 상단에 대상 사원, 선택 자격증, 현재 입력된 만료상태 표시
- 신규 등록 시 선택 사원이 자동 지정
- 입력 항목:
  - 자격증 종류
  - 자격번호
  - 취득일
  - 만료일
  - 메모
  - 사용여부

### 사원자격증조회

조회 조건:

- 사원명/사원코드 빠른 검색
- 자격증 종류
- 만료일 시작/종료
- 사용여부

결과:

- 사원
- 부서/직위
- 자격증
- 발급기관
- 자격번호
- 취득일
- 만료일
- 만료상태
- 사용여부
- 결과 상단에 조회결과, 만료, 임박, 유효, 미입력 요약 표시
- 조회 기준 요약 표시
- 만료상태는 미입력, 유효, D-n, 오늘 만료, n일 경과 배지로 표시

### 자격만료현황

- 메뉴 코드: `OP_CERTIFICATE_EXPIRY_STATUS`
- 화면: `/operation/certificate-expiry-status`
- API: `/api/employee-certificate-expiry-status`
- 기본 조회 조건:
  - 만료일 종료: 오늘부터 30일 뒤
  - 사용여부: 사용
- 사원자격증조회 화면 컴포넌트를 `expiry-status` 모드로 재사용한다.
- 자격만료현황 모드에서는 만료/임박 행을 배경으로 강조한다.

## 알림 기능

상단 네비게이션바에 종 아이콘이 있습니다.

현재 알림은 브라우저 푸시/실시간 소켓이 아니라, 화면 상단 종 아이콘에서 API를 조회해 보여주는 방식입니다.

알림 기준은 `환경설정` 화면에서 관리합니다.

현재 구현 상태:

- 설정된 기준 안에 들어온 자격증 만료 예정자를 표시
- 종 아이콘에 알림 개수 배지 표시
- 클릭 시 사원명, 사원코드, 부서, 직위, 자격증명, 만료일 표시
- `사원자격증조회` 화면으로 이동 가능

주의:

- 이미 만료된 자격증은 현재 알림 대상에서 제외되어 있습니다.
- 필요하면 이미 만료된 항목도 계속 종 아이콘에 표시하도록 백엔드 알림 로직을 변경하면 됩니다.

## 신규 기능 개발 패턴

### Backend CRUD 추가 순서

1. `entities/*.entity.ts`
2. `dto/create-*.dto.ts`
3. `dto/update-*.dto.ts`
4. `dto/*-query.dto.ts`
5. `*.service.ts`
6. `*.controller.ts`
7. `*.module.ts`
8. `app.module.ts` imports 추가
9. 메뉴가 필요하면 `menus.seed.ts` 추가
10. `npm run build` 검증

### Frontend 화면 추가 순서

1. `types/*.types.ts`
2. `api/*.api.ts`
3. `components/*Manager.tsx`
4. `app/operation/.../page.tsx`
5. `frontend/src/config/menus.ts` 추가
6. `page.tsx`는 반드시 `AppShell`로 감싸기
7. `npm run build` 검증

## 중요 주의사항

- `.env`, `.env.local`은 커밋하지 않습니다.
- 신규 운영 화면에서 `AppShell` 누락 금지.
- 프론트 API 주소는 외부 터널 데모를 위해 `/api` 상대 경로를 유지합니다.
- `next.config.ts`의 `/api` rewrite가 백엔드 `localhost:4000`으로 연결합니다.
- 고객 데모 중에는 백엔드, 프론트, cloudflared 터널 터미널을 모두 켜둬야 합니다.
- PC가 절전모드에 들어가면 외부 접속은 끊깁니다.
- 권한 메뉴를 추가하면 백엔드 seed와 프론트 메뉴를 둘 다 갱신해야 합니다.
- 화면 디자인은 기존 운영 화면 톤을 유지합니다. 과한 랜딩 페이지나 마케팅형 UI를 만들지 않습니다.
