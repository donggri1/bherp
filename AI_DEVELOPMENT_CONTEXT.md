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
- 비밀번호: `Admin1234!`

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

### 자격증

- `certificate-types`
  - 자격증 종류 등록
  - 자격증 코드 자동 생성: `CERT-000001` 형식
  - 발급기관은 자격증 종류에 저장
- `employee-certificates`
  - 사원별 자격증 등록
  - 사원 선택 후 해당 사원의 자격증을 관리하는 UX
  - 사원별 자격증에는 발급기관을 별도로 입력하지 않음
  - 조회 전용 API 포함: `/api/employee-certificate-inquiries`

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
- `/operation/employees`: 사원등록
- `/operation/certificate-types`: 자격증종류등록
- `/operation/employee-certificates`: 사원별자격증등록
- `/operation/employee-certificate-inquiry`: 사원자격증조회
- `/operation/permissions`: 권한등록
- `/operation/admin-settings`: 환경설정

## 자동채번

개발 seed에서 다음 자동채번 규칙을 사용합니다.

- 부서: `DEPT-000001`
- 직위: `POS-000001`
- 사원: `EMP-000001`
- 자격증 종류: `CERT-000001`

신규 기준정보에서 코드 자동생성이 필요하면 `SequencesService.issue(companyId, targetType)` 패턴을 따릅니다.

## 데이터베이스 관계 요약

기본 PK는 대부분 `id`입니다. 회사별 데이터 테이블은 `CompanyBaseEntity`를 상속하고, `companyId`로 `companies.id`를 참조합니다.

주요 FK 관계:

- `business_units.businessRegistrationId` -> `business_registrations.id`
- `departments.businessUnitId` -> `business_units.id`
- `departments.parentId` -> `departments.id`
- `employees.userId` -> `users.id`
- `employees.businessUnitId` -> `business_units.id`
- `employee_certificates.employeeId` -> `employees.id`
- `employee_certificates.certificateTypeId` -> `certificate_types.id`
- `distribution_workforce_certificates.employeeId` -> `employees.id`
- `distribution_workforce_certificates.employeeCertificateId` -> `employee_certificates.id`
- `user_roles.userId` -> `users.id`
- `user_roles.roleId` -> `roles.id`
- `role_menu_permissions.roleId` -> `roles.id`
- `role_menu_permissions.menuId` -> `menus.id`
- `menus.parentId` -> `menus.id`

주의:

- `employees.departmentName`, `employees.positionName`은 현재 이름 문자열로 저장하며 `departments`, `positions` FK가 아니다.
- `common_codes.groupCode`와 `sequence_currents.targetType`은 회사별 코드값으로 연결되는 논리 관계이며, 현재 TypeORM FK 관계로 묶지 않는다.
- 자격증 중복 방지는 DB unique 제약보다 서비스 upsert 로직에서 처리한다. 기존 중복 데이터 정리 전에는 `employee_certificates(companyId, employeeId, certificateTypeId)`를 unique로 바꾸지 않는다.

## 자격증 기능 상세

### 자격증종류등록

- 자격증 코드 자동 생성
- 자격증명
- 발급기관
- 정렬순서
- 사용여부

### 사원별자격증등록

- 왼쪽에서 사원명/사원코드로 사원 검색
- 사원을 선택하면 오른쪽에서 해당 사원 자격증만 조회
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
