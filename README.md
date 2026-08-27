# UI Inspector for Codex

[beyondworks/UI-Inspector](https://github.com/beyondworks/UI-Inspector)를 OpenAI Codex에서 바로 사용할 수 있도록 설정한 포크입니다.

실행 중인 웹 화면의 DOM 요소를 클릭하면 Codex가 컴포넌트 이름, 소스 위치, 계산된 스타일, 부모 구조, UI/UX 용어를 MCP 도구로 읽고 해당 코드를 수정할 수 있습니다. MCP 서버 자체는 외부 LLM API를 호출하지 않습니다.

## Codex용 변경 사항

- 저장소 범위 MCP 설정: `.codex/config.toml`
- 선택 요소와 annotation을 처리하는 Codex 작업 규칙: `AGENTS.md`
- Claude 전용 설치 문구를 Codex 설치·검증 절차로 변경
- `npm test`로 로컬 디자인 지식·검증 엔진을 확인할 수 있도록 스크립트 추가

## 준비물

- OpenAI Codex 데스크톱 앱, IDE 확장 또는 CLI

Codex 데스크톱 앱에서 전역 설치할 때는 Codex에 포함된 실행 환경을 사용할 수 있으므로 Node.js를 별도 프로그램으로 먼저 설치할 필요가 없습니다. 일반 터미널에서 서버를 직접 실행하려는 경우에만 Node.js 18.14.1 이상이 필요합니다.

## 권장 설치: Codex 전역

Codex에 저장소 주소와 함께 다음처럼 요청합니다.

```text
https://github.com/dagaonS2/UI-Inspector
이 저장소를 Codex 전역 UI Inspector로 설치해줘.
시스템 PATH에 node가 없으면 Codex에 포함된 Node 실행 환경을 사용하고,
ui_inspector MCP 서버와 ui-inspector Skill을 사용자 전역으로 등록해줘.
```

설치 후 Codex를 다시 시작하거나 새 task를 열고 다음처럼 사용합니다.

```text
$ui-inspector 현재 프로젝트의 개발 서버를 열어줘.
```

또는 자연어로 `UI Inspector로 현재 프로젝트 서버를 실행해줘`라고 요청해도 됩니다. Claude용 `/ui-inspector` 사용자 명령을 Codex에서 그대로 등록하는 방식이 아니라, Codex에서는 전역 MCP와 `$ui-inspector` Skill을 함께 사용합니다.

## 수동 설치: 저장소 범위

```bash
git clone https://github.com/dagaonS2/UI-Inspector.git
cd UI-Inspector/servers
npm ci
```

이 포크에는 다음 프로젝트 범위 설정이 이미 포함되어 있습니다.

```toml
[mcp_servers.ui_inspector]
command = "node"
args = ["servers/inspector-server.mjs"]
cwd = "."
enabled = true
```

1. Codex에서 `UI-Inspector` 저장소 **루트**를 엽니다.
2. 새 task를 시작하거나 Codex를 다시 시작해 `.codex/config.toml`을 다시 불러옵니다.
3. MCP 서버 목록에서 `ui_inspector`가 활성화됐는지 확인합니다.

CLI에서 사용자 전역 MCP 설정만 직접 등록해야 하는 경우에는 저장소 경로를 절대 경로로 바꿔 다음처럼 실행할 수 있습니다. 이 수동 방식에는 Node.js 18.14.1 이상이 필요합니다.

```bash
codex mcp add ui_inspector -- node "C:\absolute\path\UI-Inspector\servers\inspector-server.mjs"
codex mcp list
```

프로젝트 설정과 전역 설정에 같은 이름의 서버를 중복 등록하지 마세요.

## 가장 빠른 사용법

기존 웹 프로젝트가 `http://localhost:3000`에서 실행 중이라면 Codex에 다음처럼 요청합니다.

```text
UI Inspector로 http://localhost:3000에 연결해줘.
```

브라우저가 열리면 오른쪽 아래 툴바를 사용합니다.

1. **Inspect**를 누르고 요소를 클릭합니다.
2. Codex에 “선택한 요소의 padding을 24px로 바꿔줘”처럼 요청합니다.
3. 여러 수정 사항은 **Annotate**로 메모합니다.
4. Codex에 “열린 annotation을 모두 반영하고 검증해줘”라고 요청합니다.
5. 수정이 검증되면 annotation 핀이 초록색 체크로 바뀝니다.

`Esc`를 누르면 열린 대화상자나 Inspect/Annotate 모드를 닫을 수 있습니다.

## 도구 18개

### Preview (8)

- `preview_start` — React/Vue/Vanilla Vite 프리뷰 시작
- `preview_attach` — 실행 중인 Next.js/Vite 등의 개발 서버에 인스펙터 프록시 연결
- `preview_update` — 프리뷰 파일 수정·삭제 후 HMR 반영
- `preview_status` — 세션 상태 확인
- `preview_stop` — 세션 종료
- `preview_export` — 대상 프레임워크로 변환해 ZIP 내보내기
- `preview_screenshot` — 현재는 Phase 2 자리표시자이며 이미지 대신 안내 메시지를 반환
- `preview_errors` — 런타임 오류와 `console.error` 확인

### Inspector (4)

- `preview_select_element` — 인스펙터 모드 켜기·끄기 또는 세션 선택 조회
- `inspector_get_selection` — 모든 세션에서 가장 최근에 클릭한 요소 조회
- `inspector_clear_selection` — 현재 선택 지우기
- `inspector_highlight` — CSS selector 또는 `data-at`으로 요소 강조

### Annotations (4)

- `annotation_list` — 브라우저에 남긴 핀과 코멘트 조회
- `annotation_resolve` — 수정 완료 항목을 해결 처리하고 메모 남기기
- `annotation_remove` — 지정한 annotation 삭제
- `annotation_to_prompt` — annotation을 코딩 에이전트용 Markdown 작업 목록으로 변환

### Knowledge (2)

- `query_ontology` — 로컬 디자인 지식 저장소 검색
- `validate_design` — 대비, 터치 타깃, 계층, 간격 규칙 검증

## Annotation 작업 방식

- 같은 요소에 여러 핀을 남길 수 있습니다.
- Annotate 모드에서 드래그하면 최대 30개 요소를 하나의 그룹 annotation으로 묶을 수 있습니다.
- 핀은 페이지 경로별로 표시되지만 MCP 도구는 모든 페이지의 annotation을 조회할 수 있습니다.
- **Copy Prompt**는 현재 페이지의 열린 annotation을 Markdown 작업 목록으로 복사합니다.
- 일괄 삭제는 실수 방지를 위해 두 번 확인합니다.

각 annotation에는 코멘트, 상태, 요소 이름, CSS 경로, 소스 위치(`data-at`), 계산된 스타일, 텍스트, 크기와 HTML 일부가 포함됩니다.

> Annotation UI는 `preview_attach`의 주입 프록시에서 제공됩니다. `preview_start`로 만든 세션에서 annotation이 필요하면 생성된 Vite URL에 `preview_attach`를 한 번 더 사용하세요.

## Codex가 클릭에서 얻는 정보

`inspector_get_selection`은 다음 정보를 반환합니다.

- `sourceLocation` — `{ file, line, column }`
- `elementName` — id, test id, aria label, component name 등을 우선순위로 해석한 정확한 이름
- `uiTerm` / `uiDescription` — Card, Hero Section, Stack Layout 같은 UI/UX 용어
- `tag`, `className`, `textContent`
- `boundingRect`
- `computedStyles` — 배경색, 글자색, 폰트, padding, margin, display, position, 크기, radius, gap
- `parentChain`

## 검증

```bash
cd servers
npm test
npm start
```

`npm start`가 `[ui-inspector] MCP server running on stdio`를 출력하면 서버가 정상적으로 시작된 것입니다. 확인 후 `Ctrl+C`로 종료하세요.

문제가 생기면 다음 순서로 확인하세요.

1. 전역 설치라면 Codex를 다시 시작하고 `$ui-inspector` Skill과 `ui_inspector` MCP가 보이는지 확인
2. 수동 설치라면 `node --version`이 18.14.1 이상인지 확인
3. `servers/node_modules`가 없다면 의존성 설치를 다시 실행
4. 저장소 범위 설치라면 Codex에서 저장소 루트를 열었는지 확인
5. MCP 서버 목록에서 `ui_inspector` 상태 확인

현재 버전의 `preview_screenshot`은 실제 이미지를 만들지 않습니다. 시각 확인은 반환된 `preview_url`을 브라우저에서 열어 진행하세요.

## 원본과 출처

- 원본: [beyondworks/UI-Inspector](https://github.com/beyondworks/UI-Inspector)
- 이 저장소는 원본의 Git 기록을 유지하는 GitHub 포크이며 Codex 설정과 안내만 추가합니다.
