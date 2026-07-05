# ERP 상단 메뉴 검색 기능 구현 계획

## 1. 목적

상단 레이아웃에서 ERP 메뉴를 빠르게 검색하고, 검색 실행 시 결과 창을 띄워 원하는 메뉴를 선택할 수 있게 한다.

검색 결과에서 메뉴를 선택하면 기존 MDI 탭 시스템의 `openTab(menu)`를 사용해 화면을 연다. 따라서 이미 열린 메뉴는 중복 탭을 만들지 않고 기존 탭으로 이동하며, URL 동기화와 탭 복원 동작도 그대로 유지한다.

이번 문서는 구현 전 설계 문서이며, 실제 구현 코드는 포함하지 않는다.

## 2. 변경된 UX 방향

기존 초안은 좌측 사이드바에 검색창을 두는 구조였다. 새 방향은 상단 헤더 영역에 검색 진입 UI를 둔다.

권장 흐름:

```txt
상단 Header
└─ [검색어 입력] [검색]

사용자 검색어 입력
-> 검색 버튼 클릭 또는 Enter
-> 검색 결과 창 열림
-> 결과 선택
-> MDI 탭 열기 또는 기존 탭 활성화
```

## 3. 화면 배치

### 3.1 데스크톱

상단 `AppHeader` 중앙 또는 좌측 브랜드 오른쪽에 검색 영역을 배치한다.

권장 배치:

```txt
┌─────────────────────────────────────────────────────────┐
│ ☰  ERP System   [ 메뉴명을 입력하세요      ] [검색]  🔔 관리자 │
└─────────────────────────────────────────────────────────┘
```

이 방식은 업무용 ERP의 공통 명령/메뉴 검색 위치로 자연스럽고, 사이드바가 접히거나 메뉴가 길어져도 검색 진입점이 항상 보인다.

### 3.2 모바일

모바일 헤더는 공간이 좁으므로 검색 input을 항상 노출하지 않는다.

권장 배치:

```txt
┌────────────────────────────┐
│ ☰ ERP System        🔍  🔔 │
└────────────────────────────┘
```

모바일에서는 검색 아이콘 클릭 시 검색 창을 연다.

## 4. 검색 창 정책

사용자가 상단 검색어 입력 후 `검색` 버튼을 누르면 검색 결과 창을 띄운다.

권장 UI:

- 데스크톱: 헤더 검색 영역 아래에 Popover 또는 Dialog 형태의 검색 결과 창 표시
- 모바일: Dialog 형태의 전체 너비 검색 창 표시

초기 구현 권장안:

- 데스크톱과 모바일 모두 Radix `Dialog` 기반의 `MenuSearchDialog` 사용
- 검색 실행 시 Dialog가 열리고, 검색어와 결과를 보여준다
- Dialog 안에서도 검색어를 수정할 수 있게 한다

Dialog 방식이 좋은 이유:

- 결과가 많아져도 레이아웃이 안정적이다.
- 모바일에서도 동일 컴포넌트를 재사용할 수 있다.
- 키보드 접근성과 포커스 관리가 쉽다.

## 5. 사용자 동작

### 5.1 검색 실행

```txt
1. 상단 검색 input에 "사원" 입력
2. 검색 버튼 클릭 또는 Enter
3. 검색 결과 창 열림
4. "사원등록" 클릭
5. 해당 메뉴가 MDI 탭으로 열림
```

### 5.2 검색어가 비어 있을 때

검색 버튼을 눌렀는데 검색어가 비어 있으면:

- 검색 창을 열고 전체 메뉴 목록을 보여준다.
- 또는 input focus만 유지한다.

권장 정책:

- 검색어가 비어 있어도 검색 창을 열고 전체 메뉴를 보여준다.
- 이유: 사용자가 메뉴 목록을 빠르게 탐색할 수 있다.

### 5.3 검색 결과 클릭 후

결과 선택 시:

1. `openTab(menu)` 호출
2. 검색 Dialog 닫기
3. 상단 검색 input 초기화

검색어 초기화는 권장한다. 검색 후 화면 이동이 완료되면 다음 검색을 바로 시작하기 쉽다.

## 6. 검색 대상

검색 대상은 `frontend/src/config/menus.ts`의 `menuGroups`를 단일 출처로 한다.

검색 필드:

- 메뉴명: `사원등록`
- 메뉴 코드: `OP_EMPLOYEES`
- 경로: `/operation/employees`
- 메뉴 그룹명: `운영`

대소문자 구분 없이 검색한다.

초기 구현:

- 단순 `includes` 검색

확장 후보:

- 초성 검색
- fuzzy search
- 최근 사용 메뉴 우선 정렬
- 즐겨찾기 메뉴 우선 표시

## 7. 추천 파일 구조

추가:

```txt
frontend/src/features/menu-search/
├─ components/
│  ├─ HeaderMenuSearch.tsx
│  ├─ MenuSearchDialog.tsx
│  └─ MenuSearchResults.tsx
├─ hooks/
│  └─ useMenuSearch.ts
├─ types/
│  └─ menu-search.types.ts
└─ utils/
   └─ menu-search.ts
```

변경:

```txt
frontend/src/components/layout/AppHeader.tsx
frontend/src/components/layout/AppShell.tsx
```

선택 추가:

```txt
frontend/src/components/ui/dialog.tsx
```

현재 프로젝트는 `radix-ui` 패키지를 사용하고 있으므로, 필요한 경우 shadcn 스타일의 Dialog 래퍼를 추가한다.

## 8. 컴포넌트 설계

### 8.1 HeaderMenuSearch

상단 헤더에 들어가는 검색 진입 컴포넌트다.

역할:

- 검색어 input 표시
- 검색 버튼 표시
- Enter 처리
- 검색 실행 시 `MenuSearchDialog` 열기

Props:

```ts
type HeaderMenuSearchProps = {
  className?: string;
};
```

상태:

```ts
const [keyword, setKeyword] = useState("");
const [dialogOpen, setDialogOpen] = useState(false);
```

동작:

```txt
검색 버튼 클릭
-> dialogOpen = true
-> Dialog에 keyword 전달
```

### 8.2 MenuSearchDialog

검색 결과 창이다.

역할:

- 검색어 표시 및 수정
- 검색 결과 목록 표시
- 결과 클릭 시 MDI 탭 열기
- Dialog 닫기

Props:

```ts
type MenuSearchDialogProps = {
  open: boolean;
  initialKeyword: string;
  onOpenChange: (open: boolean) => void;
  onComplete?: () => void;
};
```

내부 동작:

```txt
Dialog 열림
-> initialKeyword로 검색어 세팅
-> results 계산
-> 결과 클릭
-> openTab(menu)
-> onOpenChange(false)
-> onComplete?.()
```

### 8.3 MenuSearchResults

검색 결과 목록만 담당한다.

Props:

```ts
type MenuSearchResultsProps = {
  results: SearchableMenuItem[];
  activePath: string;
  selectedIndex: number;
  onSelect: (menu: SearchableMenuItem) => void;
  onHover: (index: number) => void;
};
```

## 9. 데이터 모델

```ts
import type { MenuItem } from "@/types/menu";

export type SearchableMenuItem = MenuItem & {
  groupCode: string;
  groupTitle: string;
  keywords: string;
};
```

검색용 메뉴 평탄화:

```ts
export function createSearchableMenus(menuGroups: MenuGroup[]): SearchableMenuItem[] {
  return menuGroups.flatMap((group) =>
    group.menus.map((menu) => ({
      ...menu,
      groupCode: group.menuGroupCode,
      groupTitle: group.title,
      keywords: `${group.title} ${menu.title} ${menu.menuCode} ${menu.path}`.toLowerCase(),
    })),
  );
}
```

검색 함수:

```ts
export function searchMenus(
  menus: SearchableMenuItem[],
  keyword: string,
): SearchableMenuItem[] {
  const normalizedKeyword = keyword.trim().toLowerCase();

  if (!normalizedKeyword) {
    return menus;
  }

  return menus.filter((menu) => menu.keywords.includes(normalizedKeyword));
}
```

## 10. MDI 탭 연동

검색 기능은 MDI 내부 상태를 직접 수정하지 않는다.

검색 결과 선택 시 다음 API만 사용한다.

```ts
const { openTab } = useMdiTabs();
openTab(menu);
```

이로 인해 다음 기능이 유지된다.

- 이미 열린 메뉴 중복 생성 방지
- 기존 탭 활성화
- 새 탭 생성
- URL 동기화
- localStorage 탭 상태 저장
- 새로고침 후 탭 복원

## 11. 키보드 정책

상단 검색 input:

- `Enter`: 검색 Dialog 열기
- `Esc`: 검색어 초기화

검색 Dialog:

- `Enter`: 선택된 결과 열기
- `ArrowDown`: 다음 결과 선택
- `ArrowUp`: 이전 결과 선택
- `Esc`: Dialog 닫기

1차 구현 범위 권장:

- 상단 input `Enter`
- Dialog 내부 `Enter`, `ArrowDown`, `ArrowUp`
- `Esc`는 Radix Dialog 기본 닫기 동작 활용

## 12. 디자인 방향

ERP 업무용 UI에 맞춰 검색은 작고 단정하게 만든다.

상단 검색:

- 높이: 헤더 높이 안에 맞게 `h-8`
- 너비: 데스크톱 `280px ~ 360px`
- 버튼: `Search` 아이콘 + `검색` 텍스트
- 모바일: 검색 아이콘 버튼

Dialog:

- 너비: 데스크톱 `520px ~ 640px`
- 결과 목록 높이: 최대 `60vh`
- 결과 항목은 카드형보다 목록형
- 메뉴명은 굵게, 그룹/경로는 작게

예상 결과 창:

```txt
┌────────────────────────────────────────┐
│ 메뉴 검색                              │
│ [사원                              ]   │
│                                        │
│ 사원등록                               │
│ 운영 / /operation/employees            │
│                                        │
│ 사원별자격증등록                        │
│ 운영 / /operation/employee-certificates│
│                                        │
│ 사원자격증조회                          │
│ 운영 / /operation/employee-certificate-inquiry
└────────────────────────────────────────┘
```

## 13. 구현 단계

### 1단계: 검색 유틸/타입 추가

- `SearchableMenuItem` 타입 추가
- `createSearchableMenus` 추가
- `searchMenus` 추가

### 2단계: 검색 훅 추가

- `useMenuSearch` 추가
- 검색어, 결과, 선택 인덱스, 키보드 이동 함수 제공

### 3단계: Dialog UI 추가

- 필요 시 `components/ui/dialog.tsx` 추가
- `MenuSearchDialog` 구현
- `MenuSearchResults` 구현

### 4단계: Header 검색 UI 추가

- `HeaderMenuSearch` 구현
- `AppHeader` 중앙 영역에 배치
- 모바일에서는 검색 아이콘 버튼으로 Dialog 열기

### 5단계: MDI 연동

- 검색 결과 선택 시 `openTab(menu)` 호출
- 선택 완료 후 Dialog 닫기
- 상단 검색어 초기화

### 6단계: 검증

- `npm run build`
- 브라우저에서 검색/탭 열기 동작 확인

## 14. 테스트 체크리스트

수동 확인:

- 상단 검색 input이 데스크톱 헤더에 보인다.
- 모바일에서는 검색 아이콘으로 검색 Dialog를 열 수 있다.
- `사원` 입력 후 검색 버튼을 누르면 결과 창이 열린다.
- `Enter`로도 결과 창이 열린다.
- 검색어가 비어 있어도 전체 메뉴 목록이 표시된다.
- `OP_EMPLOYEES` 검색 시 사원등록이 나온다.
- `/operation/employees` 검색 시 사원등록이 나온다.
- 결과 클릭 시 MDI 탭이 열린다.
- 이미 열린 메뉴를 다시 선택해도 중복 탭이 생기지 않는다.
- 결과 선택 후 Dialog가 닫힌다.
- 결과 선택 후 URL이 해당 메뉴 path로 변경된다.
- 방향키로 결과 선택 이동이 가능하다.
- 새로고침 후 기존 MDI 탭 복원은 유지된다.

빌드 확인:

```txt
cd frontend
npm run build
```

## 15. 결정 사항

이번 요청 기준으로 확정된 사항:

- 검색 위치: 상단 레이아웃
- 검색 방식: 검색어 입력 후 검색 버튼 또는 Enter
- 결과 표시: 검색 실행 시 검색 창/Dialog 표시
- 메뉴 선택: 기존 MDI `openTab(menu)` 사용

추가 확인이 필요한 사항:

1. 데스크톱에서도 Dialog를 사용할지, 헤더 아래 Popover를 사용할지
   - 권장: Dialog
2. 검색어가 비어 있을 때 전체 메뉴를 보여줄지 여부
   - 권장: 전체 메뉴 표시
3. 결과 선택 후 상단 검색어 초기화 여부
   - 권장: 초기화

## 16. 주의사항

- 검색은 `menuGroups`를 단일 출처로 사용한다.
- 검색 결과 선택에서 별도 `router.push`를 직접 호출하지 않는다.
- 반드시 `openTab(menu)`를 통해 MDI 정책을 재사용한다.
- 상단 헤더가 좁아지면 검색 input은 숨기고 검색 아이콘 버튼으로 대체한다.
- Dialog 내부 텍스트와 버튼이 모바일에서 넘치지 않도록 `truncate`와 반응형 너비를 적용한다.
