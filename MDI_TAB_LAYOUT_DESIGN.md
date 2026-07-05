# ERP MDI 탭 기반 레이아웃 설계

## 1. 목적

ERP 메뉴 이동 방식을 "페이지 전환" 중심에서 "MDI(Multiple Document Interface) 탭 작업영역" 중심으로 전환한다.

사용자는 좌측 메뉴를 클릭할 때마다 새 브라우저 페이지로 이동하는 느낌이 아니라, Windows ERP(영림원, 더존, SAP GUI, Oracle ERP Forms류)처럼 여러 업무 화면을 상단 탭으로 열어두고 전환할 수 있어야 한다.

이 문서는 구현 전에 합의할 설계 문서이며, 현재 단계에서는 실제 코드 구현을 포함하지 않는다.

## 2. 핵심 요구사항 요약

- 메뉴 클릭 시 새 페이지 이동 대신 상단 업무 탭을 생성한다.
- 이미 열린 메뉴를 다시 클릭하면 새 탭을 만들지 않고 기존 탭을 활성화한다.
- 여러 업무 화면을 동시에 열 수 있다.
- 탭 클릭 시 해당 화면이 활성화된다.
- 각 탭은 닫기 버튼을 가진다.
- Home 탭은 항상 고정이며 닫을 수 없다.
- 현재 열린 탭과 활성 탭은 URL과 동기화한다.
- 새로고침 시 같은 브라우저 탭에서는 열린 탭 목록과 활성 탭을 localStorage에서 복원한다.
- 새 브라우저 탭에서는 초기 상태(Home만 열린 상태)로 시작한다.
- 탭 우클릭 메뉴를 제공한다.
- 탭이 많아지면 가로 스크롤, 마우스 휠 스크롤, 드래그 순서 변경, 활성 탭 자동 스크롤을 지원한다.
- 구조는 재사용 가능한 컴포넌트와 훅 중심으로 설계한다.

## 3. 현재 프론트엔드 구조

현재 Next.js App Router 기반 구조는 다음 흐름이다.

- `frontend/src/app/**/page.tsx`
  - 각 라우트 페이지가 `AppShell`로 화면을 감싼다.
- `frontend/src/components/layout/AppShell.tsx`
  - 헤더, 사이드바, 메인 컨텐츠 영역을 구성한다.
- `frontend/src/components/layout/AppSidebar.tsx`
  - 좌측 메뉴를 렌더링한다.
- `frontend/src/components/layout/MenuGroup.tsx`
  - `next/link`로 메뉴 링크를 렌더링한다.
- `frontend/src/config/menus.ts`
  - ERP 메뉴 목록의 단일 정의에 가깝다.

MDI 탭은 `AppShell`과 메뉴 네비게이션 사이에 들어가는 공통 레이아웃 기능으로 설계한다.

## 4. 권장 아키텍처

### 4.1 전체 구조

```txt
AppShell
├─ AppHeader
├─ AppSidebar
│  └─ MenuGroup
│     └─ 메뉴 클릭 -> openTab(menu)
└─ main
   ├─ MdiTabBar
   │  ├─ Home Tab
   │  ├─ 업무 Tab...
   │  └─ TabContextMenu
   └─ MdiWorkspace
      └─ active route children
```

현재 App Router의 라우트 렌더링을 유지하되, 탭 상태는 클라이언트 Provider에서 관리한다.

### 4.2 Provider 배치

`AppShell` 내부 또는 그 상위의 client boundary에 `MdiTabsProvider`를 둔다.

권장 위치:

- `frontend/src/components/layout/AppShell.tsx`
  - `MdiTabsProvider`를 감싼다.
  - `MdiTabBar`를 `main` 상단에 배치한다.
  - 기존 `children`은 `MdiWorkspace` 영역에 렌더링한다.

초기 구현에서는 모든 업무 페이지가 이미 `AppShell`을 사용하므로, 각 페이지 파일을 크게 바꾸지 않아도 된다.

## 5. 주요 파일 설계

추가 권장 파일:

```txt
frontend/src/features/mdi-tabs/
├─ components/
│  ├─ MdiTabBar.tsx
│  ├─ MdiTabItem.tsx
│  ├─ MdiTabContextMenu.tsx
│  └─ MdiWorkspace.tsx
├─ hooks/
│  ├─ useMdiTabs.ts
│  ├─ useMdiTabScroll.ts
│  └─ useMdiTabDnD.ts
├─ types/
│  └─ mdi-tab.types.ts
├─ utils/
│  ├─ mdi-tab-storage.ts
│  ├─ mdi-tab-route.ts
│  └─ mdi-tab-registry.ts
└─ MdiTabsProvider.tsx
```

변경 권장 파일:

```txt
frontend/src/components/layout/AppShell.tsx
frontend/src/components/layout/AppSidebar.tsx
frontend/src/components/layout/MenuGroup.tsx
frontend/src/config/menus.ts
frontend/src/types/menu.ts
```

## 6. 탭 데이터 모델

```ts
export type MdiTabId = string;

export type MdiTab = {
  id: MdiTabId;
  menuCode: string;
  title: string;
  path: string;
  pinned: boolean;
  closable: boolean;
  order: number;
  openedAt: number;
  lastActivatedAt: number;
};

export type MdiTabsState = {
  tabs: MdiTab[];
  activeTabId: MdiTabId;
  instanceId: string;
  version: number;
};
```

Home 탭은 고정 상수로 관리한다.

```ts
export const HOME_TAB: MdiTab = {
  id: "HOME",
  menuCode: "HOME",
  title: "Home",
  path: "/dashboard",
  pinned: true,
  closable: false,
  order: 0,
  openedAt: 0,
  lastActivatedAt: 0,
};
```

탭 ID는 기본적으로 `menuCode`를 사용한다. 동일 메뉴가 여러 파라미터로 열릴 가능성이 생기면 `menuCode + normalizedPath` 조합으로 확장한다.

## 7. 메뉴와 탭 연결

### 7.1 메뉴 정의 확장

현재 `MenuItem`은 다음 구조다.

```ts
export type MenuItem = {
  menuCode: string;
  title: string;
  path: string;
};
```

MDI 지원을 위해 다음 필드를 선택적으로 확장할 수 있다.

```ts
export type MenuItem = {
  menuCode: string;
  title: string;
  path: string;
  mdi?: {
    closable?: boolean;
    pinned?: boolean;
    reuse?: "by-menu-code" | "by-path";
  };
};
```

초기 정책:

- Home: `pinned: true`, `closable: false`
- 일반 메뉴: `pinned: false`, `closable: true`
- 중복 판단: `menuCode` 우선

### 7.2 메뉴 클릭 흐름

기존 `Link href={menu.path}` 클릭 대신 다음 흐름을 사용한다.

1. `MenuGroup`에서 클릭한 메뉴 정보를 `openTab(menu)`에 전달한다.
2. 이미 같은 `menuCode`의 탭이 있으면 해당 탭을 활성화한다.
3. 없으면 새 탭을 추가하고 활성화한다.
4. `router.push(menu.path)`로 URL을 변경한다.
5. 모바일 사이드바에서는 기존처럼 `onNavigate()`로 메뉴를 닫는다.

`href`는 접근성 및 새 탭 열기 보조를 위해 유지할 수 있으나, 일반 좌클릭은 `preventDefault()` 후 MDI 액션을 수행한다.

## 8. URL 동기화 정책

URL은 현재 활성 탭의 `path`와 일치해야 한다.

### 8.1 탭 클릭

```txt
사용자 탭 클릭
-> activateTab(tabId)
-> router.push(tab.path)
-> activeTabId 갱신
-> localStorage 저장
-> 활성 탭이 보이도록 스크롤
```

### 8.2 직접 URL 진입

브라우저 주소창 또는 외부 링크로 `/operation/employees`에 직접 접근한 경우:

1. 현재 URL과 일치하는 메뉴를 `menuGroups`에서 찾는다.
2. 해당 메뉴가 있으면 탭을 열고 활성화한다.
3. 메뉴에 없는 URL이면 Home 탭만 유지하거나, 임시 탭을 생성하지 않고 기존 라우트 렌더링만 허용한다.

권장 정책은 "메뉴에 등록된 라우트만 MDI 탭으로 관리"이다.

### 8.3 뒤로가기/앞으로가기

`usePathname()` 변경을 감지해 다음을 수행한다.

- pathname이 이미 열린 탭이면 그 탭을 활성화한다.
- pathname이 메뉴에 존재하지만 탭이 없으면 탭을 생성하고 활성화한다.
- pathname이 `/dashboard`이면 Home 탭을 활성화한다.

이렇게 하면 브라우저 히스토리와 MDI 상태가 충돌하지 않는다.

## 9. localStorage 및 새 브라우저 탭 정책

요구사항의 핵심은 "새로고침은 복원, 새 브라우저 탭은 초기화"이다.

localStorage만 사용하면 새 브라우저 탭에서도 이전 상태가 공유된다. 따라서 브라우저 탭 단위 식별에는 `sessionStorage`를 함께 사용한다.

### 9.1 저장 키

```ts
const MDI_INSTANCE_KEY = "bherp.mdi.instanceId";
const MDI_STATE_KEY_PREFIX = "bherp.mdi.state.";
```

### 9.2 동작 원리

1. 앱 로드 시 `sessionStorage`에서 `instanceId`를 읽는다.
2. 없으면 새 브라우저 탭으로 판단하고 새 `instanceId`를 생성한다.
3. `localStorage`의 `bherp.mdi.state.${instanceId}`만 복원한다.
4. 새로고침은 같은 브라우저 탭이므로 `sessionStorage`의 `instanceId`가 유지되고 상태가 복원된다.
5. 새 브라우저 탭은 `sessionStorage`가 비어 있으므로 Home만 열린 초기 상태로 시작한다.

### 9.3 저장 시점

다음 액션 이후 저장한다.

- 탭 열기
- 탭 활성화
- 탭 닫기
- 탭 순서 변경
- 탭 고정/고정 해제
- 우클릭 메뉴 액션

### 9.4 복원 검증

복원 시 다음을 정리한다.

- Home 탭이 없으면 추가한다.
- 존재하지 않는 메뉴 또는 라우트의 탭은 제거한다.
- activeTabId가 없거나 닫힌 탭이면 Home 또는 마지막 탭으로 보정한다.
- version이 다르면 마이그레이션 또는 초기화한다.

## 10. 탭 닫기 정책

### 10.1 현재 탭 닫기

- Home은 닫지 않는다.
- pinned 탭은 닫기 버튼을 숨기거나 비활성화한다.
- 활성 탭을 닫으면 다음 우선순위로 활성 탭을 선택한다.
  1. 오른쪽의 가장 가까운 탭
  2. 왼쪽의 가장 가까운 탭
  3. Home

### 10.2 다른 탭 닫기

- 대상 탭과 Home은 유지한다.
- pinned 탭은 유지하는 것을 기본 정책으로 한다.
- 필요하면 "고정 탭도 닫기" 정책은 별도 옵션으로 확장한다.

### 10.3 왼쪽/오른쪽 탭 닫기

- 기준 탭의 좌우에 있는 닫을 수 있는 탭만 닫는다.
- Home과 pinned 탭은 유지한다.

### 10.4 전체 탭 닫기

- Home 제외 전체 닫기.
- pinned 탭 유지 여부는 UX 정책이 필요하다.
- 권장 기본값: pinned 탭은 유지, 일반 탭만 닫기.
- 메뉴명은 "전체 탭 닫기"로 보여주되, disabled reason 또는 tooltip으로 "고정 탭 제외"를 명시할 수 있다.

## 11. 우클릭 Context Menu

### 11.1 메뉴 항목

탭 우클릭 시 다음 메뉴를 제공한다.

```txt
현재 탭 닫기
다른 탭 닫기
왼쪽 탭 닫기
오른쪽 탭 닫기
전체 탭 닫기
새로고침
탭 고정 / 고정 해제
```

### 11.2 비활성화 조건

- Home 탭:
  - 현재 탭 닫기: disabled
  - 탭 고정/고정 해제: disabled 또는 항상 고정으로 표시
- 닫을 대상이 없는 경우:
  - 다른 탭 닫기, 왼쪽 탭 닫기, 오른쪽 탭 닫기 비활성화
- pinned 탭:
  - 현재 탭 닫기 disabled
  - "탭 고정 해제" 활성화

### 11.3 구현 방식

현재 의존성에 `radix-ui`가 있으므로 Radix Context Menu 계열을 우선 검토한다. 이미 프로젝트에서 shadcn 스타일 컴포넌트를 사용하고 있으므로, 필요한 경우 `frontend/src/components/ui/context-menu.tsx`를 추가해 일관된 UI로 감싼다.

## 12. 새로고침 액션

우클릭 메뉴의 "새로고침"은 현재 활성 탭 화면을 다시 로드하는 의미다.

권장 우선순위:

1. `router.refresh()`
   - Next.js App Router의 서버 컴포넌트/데이터 갱신에 적합하다.
2. 필요 시 탭별 reload key 증가
   - 클라이언트 컴포넌트 내부 상태까지 강제 재마운트해야 할 때 사용한다.

초기 구현은 `router.refresh()`로 시작하고, 특정 업무 화면에서 클라이언트 상태 초기화 요구가 있으면 `reloadKey` 설계를 추가한다.

## 13. 스크롤 및 드래그

### 13.1 가로 스크롤

탭 바는 다음 CSS 전략을 사용한다.

```txt
display: flex
overflow-x: auto
overflow-y: hidden
white-space: nowrap
scrollbar-width: thin
```

ERP 느낌을 위해 탭 높이는 32~36px 정도로 낮게 유지하고, 둥근 카드형보다는 얇은 테두리와 플랫한 배경을 사용한다.

### 13.2 마우스 휠 스크롤

탭 바 영역에서 `wheel` 이벤트를 받아 세로 휠을 가로 스크롤로 변환한다.

```txt
onWheel(event)
-> event.currentTarget.scrollLeft += event.deltaY
```

트랙패드의 자연스러운 가로 스크롤은 방해하지 않도록 `deltaX`가 큰 경우에는 기본 동작을 존중한다.

### 13.3 활성 탭 자동 스크롤

`activeTabId` 변경 후 해당 탭 DOM에 대해 다음을 호출한다.

```ts
element.scrollIntoView({
  inline: "nearest",
  block: "nearest",
});
```

탭 생성, 탭 클릭, URL 변경 복원, 뒤로가기/앞으로가기 모두 동일하게 처리한다.

### 13.4 드래그 순서 변경

외부 라이브러리 없이 HTML Drag and Drop으로 시작할 수 있다.

기본 정책:

- Home 탭은 항상 첫 번째이며 드래그 불가.
- pinned 탭은 Home 뒤쪽의 pinned 영역에서만 정렬할지, 일반 탭과 함께 정렬할지 정책이 필요하다.
- 권장 초기 정책:
  - Home은 첫 번째 고정
  - pinned 탭은 Home 다음 영역
  - 일반 탭은 pinned 뒤쪽 영역
  - pinned와 일반 탭 사이를 넘나드는 드래그는 허용하지 않는다.

복잡한 접근성 키보드 정렬까지 요구되면 `@dnd-kit` 도입을 별도 검토한다. 현재 의존성에는 포함되어 있지 않으므로 초기 구현에서는 추가 의존성 없이 시작한다.

## 14. 디자인 방향

Windows 업무용 ERP UI를 참고해 다음 톤을 유지한다.

- 고밀도 레이아웃
- 낮은 탭 높이
- 얇은 border
- 과한 카드, 큰 hero, 장식 배경 지양
- 활성 탭은 명확하지만 지나치게 화려하지 않게 표현
- 비활성 탭은 회색 배경과 경계선 중심
- 닫기 버튼은 hover 시 드러나거나 약하게 표시
- pinned 탭은 작은 pin 아이콘으로 구분
- 업무 화면의 가용 세로 공간을 최대화

예상 시각 구조:

```txt
┌──────────────────────────────────────────────┐
│ Header                                       │
├──────────────┬───────────────────────────────┤
│ Sidebar      │ Home | 사원등록 x | 권한등록 x │
│              ├───────────────────────────────┤
│              │ Active 업무 화면               │
└──────────────┴───────────────────────────────┘
```

## 15. 접근성 및 키보드

초기 구현에서 지원할 항목:

- 탭 목록에 `role="tablist"`
- 각 탭에 `role="tab"`
- 활성 탭에 `aria-selected="true"`
- 닫기 버튼에 `aria-label="{title} 닫기"`
- Home 탭에는 닫기 버튼 없음
- context menu는 키보드 접근 가능한 Radix 기반 권장

추가 검토 항목:

- `Ctrl + W`: 현재 탭 닫기
- `Ctrl + Tab`: 다음 탭
- `Ctrl + Shift + Tab`: 이전 탭
- `Alt + 숫자`: 특정 탭 이동

단축키는 ERP 업무 입력과 충돌할 수 있으므로 별도 합의 후 구현한다.

## 16. 상태 액션 설계

Provider에서 제공할 액션:

```ts
type MdiTabsActions = {
  openTab: (menu: MenuItem) => void;
  activateTab: (tabId: MdiTabId) => void;
  closeTab: (tabId: MdiTabId) => void;
  closeCurrentTab: () => void;
  closeOtherTabs: (tabId: MdiTabId) => void;
  closeTabsToLeft: (tabId: MdiTabId) => void;
  closeTabsToRight: (tabId: MdiTabId) => void;
  closeAllTabs: () => void;
  refreshTab: (tabId: MdiTabId) => void;
  togglePinTab: (tabId: MdiTabId) => void;
  reorderTabs: (sourceTabId: MdiTabId, targetTabId: MdiTabId) => void;
};
```

상태 변경은 reducer로 모으는 것을 권장한다.

```ts
type MdiTabsAction =
  | { type: "OPEN_TAB"; menu: MenuItem; now: number }
  | { type: "ACTIVATE_TAB"; tabId: MdiTabId; now: number }
  | { type: "CLOSE_TAB"; tabId: MdiTabId }
  | { type: "CLOSE_OTHER_TABS"; tabId: MdiTabId }
  | { type: "CLOSE_TABS_TO_LEFT"; tabId: MdiTabId }
  | { type: "CLOSE_TABS_TO_RIGHT"; tabId: MdiTabId }
  | { type: "CLOSE_ALL_TABS" }
  | { type: "TOGGLE_PIN_TAB"; tabId: MdiTabId }
  | { type: "REORDER_TABS"; sourceTabId: MdiTabId; targetTabId: MdiTabId }
  | { type: "HYDRATE"; state: MdiTabsState };
```

## 17. 화면 렌더링 전략

### 17.1 초기 권장안: 라우트 기반 활성 화면 렌더링

현재 구조를 크게 바꾸지 않고, 활성 탭의 URL에 해당하는 App Router page가 렌더링되도록 유지한다.

장점:

- 기존 페이지 구조 유지
- 구현 범위가 작다
- Next.js 라우팅, 권한, 데이터 로딩 흐름과 충돌이 적다

한계:

- 비활성 탭의 React 상태는 유지되지 않는다.
- 진짜 MDI처럼 각 탭 화면의 입력 중 상태를 메모리에 보존하지는 않는다.

### 17.2 확장안: 탭별 keep-alive 렌더링

업무 화면의 입력 상태까지 탭별로 유지해야 한다면 별도 라우트 렌더링 대신 탭 registry 기반으로 컴포넌트를 직접 렌더링한다.

예:

```ts
const mdiPageRegistry = {
  OP_EMPLOYEES: EmployeesManager,
  OP_EMPLOYEE_CERTIFICATES: EmployeeCertificatesManager,
};
```

단, 이 방식은 Next.js App Router의 page 파일과 중복 정의가 생기므로 초기 구현에서는 권장하지 않는다.

## 18. 구현 단계 제안

### 1단계: 기본 MDI 탭 상태

- `MdiTabsProvider` 추가
- Home 탭 상수 추가
- `openTab`, `activateTab`, `closeTab` 구현
- `AppShell`에 `MdiTabBar` 배치
- `MenuGroup` 클릭을 `openTab`으로 연결

### 2단계: URL 동기화

- 탭 활성화 시 `router.push`
- `usePathname()` 변경 시 탭 상태 보정
- 직접 URL 진입 처리
- 뒤로가기/앞으로가기 처리

### 3단계: localStorage/sessionStorage 복원

- 브라우저 탭 단위 `instanceId` 생성
- 같은 브라우저 탭 새로고침 복원
- 새 브라우저 탭 초기화
- 버전/유효성 검증

### 4단계: Context Menu

- `MdiTabContextMenu` 추가
- 닫기 관련 메뉴 액션 연결
- 새로고침, 고정/고정 해제 연결
- 비활성화 조건 반영

### 5단계: 스크롤 및 드래그

- 탭 바 가로 스크롤
- wheel-to-horizontal-scroll
- active tab `scrollIntoView`
- drag reorder
- Home 및 pinned 탭 이동 제한

### 6단계: 디자인 정리

- ERP 스타일 색상/높이/경계선 정리
- hover/focus/active 상태 보정
- 모바일 레이아웃에서 탭 바 표시 정책 확인

## 19. 테스트 체크리스트

수동 확인:

- Home 탭이 항상 존재하고 닫히지 않는다.
- 메뉴 클릭 시 탭이 생성된다.
- 같은 메뉴를 다시 클릭해도 중복 탭이 생기지 않는다.
- 탭 클릭 시 URL과 화면이 함께 변경된다.
- 활성 탭을 닫으면 주변 탭으로 자연스럽게 이동한다.
- 모든 일반 탭을 닫으면 Home만 남는다.
- 새로고침 후 같은 탭 목록과 활성 탭이 복원된다.
- 새 브라우저 탭을 열면 Home만 열린다.
- 브라우저 뒤로가기/앞으로가기가 활성 탭과 동기화된다.
- 우클릭 메뉴의 각 닫기 액션이 기대대로 동작한다.
- pinned 탭은 닫기 액션에서 보호된다.
- 탭이 많은 경우 가로 스크롤과 휠 스크롤이 동작한다.
- 탭 순서 드래그 후 새로고침해도 순서가 유지된다.
- 활성 탭은 탭 바 안에서 자동으로 보인다.

빌드 확인:

```txt
cd frontend
npm run build
```

## 20. 결정 필요 사항

구현 전에 다음 정책을 확정하면 좋다.

1. "전체 탭 닫기"가 pinned 탭도 닫을지 여부
   - 권장: pinned 탭 유지
2. pinned 탭의 위치
   - 권장: Home 다음, 일반 탭 앞
3. 비활성 탭의 입력 상태 보존 필요 여부
   - 권장 초기 구현: 보존하지 않음
   - 필요 시 keep-alive registry 방식 별도 설계
4. 메뉴에 없는 URL을 탭으로 만들지 여부
   - 권장: 메뉴 등록 라우트만 탭으로 관리
5. 모바일에서 탭 바를 항상 보여줄지 여부
   - 권장: 데스크톱과 동일하게 표시하되 높이를 줄이고 스크롤 중심으로 운영

## 21. 구현 시 주의사항

- `menuGroups`를 탭 메타데이터의 단일 출처로 유지한다.
- 페이지별로 탭 로직을 넣지 않고 공통 Provider와 컴포넌트에 모은다.
- URL과 탭 상태가 서로 무한 갱신되지 않도록 `pathname` 비교 후 필요한 경우에만 `router.push`한다.
- localStorage 복원은 클라이언트 마운트 이후에만 수행한다.
- Next.js 16 프로젝트이므로 실제 구현 전 관련 App Router 문서를 확인한다.
- 탭 디자인은 업무용 밀도를 우선하고 장식적 UI를 피한다.
