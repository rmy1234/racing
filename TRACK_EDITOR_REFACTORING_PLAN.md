# Track Editor 코드 분리 계획서

## 현재 상태 분석

- **파일 크기**: 3,849줄
- **구조**:
  - HTML 구조: ~470줄
  - CSS 스타일: ~255줄  
  - JavaScript 코드: ~3,124줄
    - TrackEditor 클래스: ~3,050줄
    - 초기화 코드: ~74줄

## 분리 계획

### 1단계: CSS 분리
**목적**: 스타일 코드를 별도 파일로 분리하여 유지보수성 향상

**파일 구조**:
```
public/
  css/
    track-editor.css  (신규 생성)
  track-editor.html   (수정)
```

**변경 사항**:
- `<style>` 태그 내부의 모든 CSS를 `track-editor.css`로 이동
- HTML에서 `<link rel="stylesheet" href="/css/track-editor.css">` 추가

**예상 효과**:
- HTML 파일 크기: 3,849줄 → ~3,594줄 (약 255줄 감소)
- CSS 파일 재사용 가능
- 스타일 수정 시 HTML 파일 편집 불필요

---

### 2단계: JavaScript 모듈화

#### 2-1. 유틸리티 함수 분리
**파일**: `public/js/track-editor/utils.js`

**포함 기능**:
- 좌표 변환 함수들
  - `canvasToWorld()`
  - `worldToCanvas()`
  - `getCanvasPoint()`
- 검색/찾기 함수들
  - `findPointAt()`
  - `findCheckpointAt()`
  - `findKerbAt()`
  - `findSpawnAt()`
  - `findStartLineAt()`
  - `snapToTrackCenter()`
  - `calculateCheckpointAngle()`
  - `findNearestTrackBoundary()`
- 경로 처리 함수들
  - `getSmoothPath()`
  - `extractPathSegment()`

**예상 라인 수**: ~350줄

---

#### 2-2. 렌더링 모듈 분리
**파일**: `public/js/track-editor/renderer.js`

**포함 기능**:
- 렌더링 관련 메서드들
  - `render()` - 메인 렌더링 함수
  - `renderMinimap()` - 미니맵 렌더링
  - `scheduleRender()` - 렌더링 스케줄링
  - `drawSmoothPath()` - 부드러운 경로 그리기
  - `drawPathBasedKerb()` - 경로 기반 연석 그리기
  - `drawCurvedKerb()` - 곡선 연석 그리기
  - `getTrackBounds()` - 트랙 경계 계산

**예상 라인 수**: ~600줄

**참고**: 렌더링 함수는 TrackEditor 인스턴스의 상태에 많이 의존하므로, 클래스 메서드로 유지하되 별도 파일로 분리

---

#### 2-3. 포인트 관리 모듈
**파일**: `public/js/track-editor/point-manager.js`

**포함 기능**:
- 포인트 추가/삭제/선택
  - `addPoint()`
  - `deletePoint()`
  - `selectPoint()`
  - `updateSelectedPoint()`
  - `updateSelectedPointInfo()`
  - `setPointType()`
  - `updatePointList()`

**예상 라인 수**: ~150줄

---

#### 2-4. 체크포인트 관리 모듈
**파일**: `public/js/track-editor/checkpoint-manager.js`

**포함 기능**:
- 체크포인트 추가/삭제/선택
  - `addCheckpoint()`
  - `deleteCheckpoint()`
  - `selectCheckpoint()`
  - `updateSelectedCheckpoint()`
  - `updateSelectedCheckpointInfo()`
  - `updateCheckpointList()`

**예상 라인 수**: ~150줄

---

#### 2-5. 연석(Kerb) 관리 모듈
**파일**: `public/js/track-editor/kerb-manager.js`

**포함 기능**:
- 연석 추가/삭제/선택
  - `addKerb()`
  - `deleteKerb()`
  - `selectKerb()`
  - `updateSelectedKerb()`
  - `updateSelectedKerbInfo()`
  - `updateKerbList()`

**예상 라인 수**: ~200줄

---

#### 2-6. 출발 위치 관리 모듈
**파일**: `public/js/track-editor/spawn-manager.js`

**포함 기능**:
- 출발 위치 추가/삭제/선택
  - `addSpawn()`
  - `deleteSpawn()`
  - `selectSpawn()`
  - `updateSelectedSpawn()`
  - `updateSelectedSpawnInfo()`
  - `updateSpawnList()`

**예상 라인 수**: ~150줄

---

#### 2-7. 이벤트 핸들러 모듈
**파일**: `public/js/track-editor/event-handler.js`

**포함 기능**:
- 마우스 이벤트
  - `handleCanvasClick()`
  - `handleMouseDown()`
  - `handleMouseMove()`
  - `handleMouseUp()`
  - `handleWheel()`
- 미니맵 이벤트
  - `handleMinimapMouseDown()`
  - `handleMinimapMouseMove()`
  - `handleMinimapMouseUp()`
  - `updateMinimapView()`
- 줌/뷰 컨트롤
  - `zoomIn()`
  - `zoomOut()`
  - `resetView()`

**예상 라인 수**: ~300줄

---

#### 2-8. UI 업데이트 모듈
**파일**: `public/js/track-editor/ui-manager.js`

**포함 기능**:
- UI 상태 업데이트
  - `setMode()`
  - `togglePreview()`
  - `updateStatus()`
  - `setupEventListeners()` - 이벤트 리스너 설정
- 저장/로드
  - `saveToStorage()`
  - `loadFromStorage()`

**예상 라인 수**: ~400줄

---

#### 2-9. 코드 생성 모듈
**파일**: `public/js/track-editor/code-generator.js`

**포함 기능**:
- 트랙 데이터 코드 생성
  - `updateCodeOutput()` - 트랙 코드 생성
  - `copyCode()` - 코드 클립보드 복사

**예상 라인 수**: ~100줄

---

#### 2-10. 트랙 관리 모듈
**파일**: `public/js/track-editor/track-manager.js`

**포함 기능**:
- 트랙 생성/로드/초기화
  - `newTrack()` - 새 트랙 생성
  - `loadTrack()` - 트랙 로드
  - `clearTrack()` - 트랙 초기화

**예상 라인 수**: ~250줄

---

#### 2-11. 메인 TrackEditor 클래스
**파일**: `public/js/track-editor/track-editor.js`

**포함 기능**:
- TrackEditor 클래스 정의
  - `constructor()` - 초기화
  - `resizeCanvas()` - 캔버스 크기 조정
  - 위 모듈들의 메서드들을 클래스 메서드로 통합
- 초기화 코드
  - 전역 변수 선언
  - window.addEventListener('load') 핸들러

**예상 라인 수**: ~200줄 (클래스 구조 + 통합)

---

## 최종 파일 구조

```
public/
  track-editor.html           (~470줄) - HTML 구조만
  css/
    track-editor.css          (~255줄) - 모든 스타일
  js/
    track-editor/
      track-editor.js         (~200줄) - 메인 클래스
      utils.js                (~350줄) - 유틸리티 함수
      renderer.js             (~600줄) - 렌더링 로직
      point-manager.js        (~150줄) - 포인트 관리
      checkpoint-manager.js   (~150줄) - 체크포인트 관리
      kerb-manager.js         (~200줄) - 연석 관리
      spawn-manager.js        (~150줄) - 출발 위치 관리
      event-handler.js        (~300줄) - 이벤트 핸들러
      ui-manager.js           (~400줄) - UI 관리
      code-generator.js       (~100줄) - 코드 생성
      track-manager.js        (~250줄) - 트랙 관리
```

## 구현 방법

### 옵션 1: ES6 모듈 방식 (권장)
- 각 모듈을 ES6 모듈로 작성
- `export`/`import` 사용
- HTML에서 `<script type="module">` 사용

**장점**:
- 모던 JavaScript 표준
- 명확한 의존성 관리
- 트리 쉐이킹 가능

**단점**:
- 일부 구형 브라우저 미지원 (하지만 현대 브라우저는 모두 지원)

### 옵션 2: 전역 네임스페이스 방식
- 각 모듈을 전역 객체로 노출 (예: `TrackEditorUtils`, `TrackEditorRenderer`)
- 스크립트를 순서대로 로드

**장점**:
- 모든 브라우저 호환
- 구현이 간단

**단점**:
- 전역 네임스페이스 오염
- 의존성 관리가 수동

## 권장 구현 순서

1. **CSS 분리** (가장 간단, 즉시 효과)
2. **유틸리티 함수 분리** (의존성이 낮음)
3. **렌더링 모듈 분리** (큰 부분이지만 독립적)
4. **관리자 모듈들 분리** (point, checkpoint, kerb, spawn)
5. **이벤트 핸들러 분리**
6. **UI 및 코드 생성 모듈 분리**
7. **트랙 관리 모듈 분리**
8. **메인 클래스 정리 및 통합**

## 예상 효과

- **파일 크기 감소**: 각 파일이 200-600줄로 관리 가능한 크기
- **가독성 향상**: 기능별로 파일이 분리되어 이해하기 쉬움
- **유지보수성 향상**: 특정 기능 수정 시 해당 파일만 편집
- **재사용성 향상**: 모듈을 다른 프로젝트에서도 활용 가능
- **테스트 용이성**: 각 모듈을 독립적으로 테스트 가능

## 주의사항

1. **상태 공유**: TrackEditor 인스턴스의 상태를 여러 모듈에서 공유하므로 주의 필요
2. **의존성 순서**: 스크립트 로드 순서가 중요 (utils → renderer → managers → main)
3. **기존 기능 유지**: 리팩토링 시 기존 기능이 정상 작동하는지 철저히 테스트 필요
4. **점진적 마이그레이션**: 한 번에 모든 것을 변경하지 말고 단계적으로 진행

