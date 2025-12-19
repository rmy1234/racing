// ============================================
// 트랙 목록 정의 및 관리
// ============================================
// ⚠️ 새로운 트랙 추가 시:
// 1. public/js/tracks/[track-id].js 파일 생성
// 2. 아래 TRACKS 객체에 새 트랙 추가
// 3. src/game/tracks/track-configs.ts에도 서버 설정 추가 필요!
// ============================================
const TRACKS = {
  'basic-circuit': {
    id: 'basic-circuit',
    name: '기본 서킷',
    data: null // tracks/basic-circuit.js에서 로드
  },
  'monza': {
    id: 'monza',
    name: '몬차 서킷',
    data: null // tracks/monza.js에서 로드
  }
};

// 트랙 데이터 로드 (각 트랙 파일에서 호출)
function registerTrack(trackId, trackData) {
  if (TRACKS[trackId]) {
    TRACKS[trackId].data = trackData;
  }
}

// 현재 선택된 트랙을 가져오는 함수
function getTrack(trackId) {
  const trackInfo = TRACKS[trackId];
  if (!trackInfo || !trackInfo.data) {
    // 기본값으로 기본 서킷 반환
    return TRACKS['basic-circuit'].data;
  }
  return trackInfo.data;
}

// 사용 가능한 모든 트랙 목록 반환
function getAvailableTracks() {
  return Object.values(TRACKS).map(track => ({
    id: track.id,
    name: track.name
  }));
}

// 기본 트랙 (렌더러 초기화용)
let Track = null;

// 모든 트랙이 로드된 후 기본 트랙 설정
function initializeDefaultTrack() {
  Track = TRACKS['basic-circuit'].data || null;
}
