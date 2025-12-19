// Windows 전용: 포트 3000을 사용 중인 프로세스를 찾아 종료
// npm run start:dev 실행 시 prestart:dev 훅에서 자동 실행됨

const { execSync } = require('child_process');

const PORT = process.env.PORT || 3000;

function killPort(port) {
  try {
    // :포트 번호가 포함된 줄 검색
    const output = execSync(`netstat -ano | findstr :${port}`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });

    const lines = output
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const pids = new Set();

    for (const line of lines) {
      // 예시 형식:
      // TCP    0.0.0.0:3000   0.0.0.0:0   LISTENING   35464
      const parts = line.split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0') {
        pids.add(pid);
      }
    }

    if (pids.size === 0) {
      return;
    }

    console.log(`[kill-port] Port ${port} is in use by PIDs: ${[
      ...pids,
    ].join(', ')}`);

    for (const pid of pids) {
      try {
        execSync(`taskkill /F /PID ${pid}`, {
          stdio: ['ignore', 'pipe', 'ignore'],
        });
        console.log(`[kill-port] Killed PID ${pid}`);
      } catch (e) {
        // 이미 종료되었거나 권한 문제 등은 무시
      }
    }
  } catch {
    // netstat 결과가 없으면 (포트 미사용) 에러가 날 수 있으니 무시
  }
}

if (process.platform === 'win32') {
  killPort(PORT);
} else {
  console.log(
    `[kill-port] 현재 스크립트는 Windows 전용입니다. (platform=${process.platform})`,
  );
}





