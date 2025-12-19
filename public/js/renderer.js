// 캔버스 렌더러
class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.smoothPath = null;
  }
  
  clear() {
    // 잔디 배경
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
    gradient.addColorStop(0, '#2d5a27');
    gradient.addColorStop(0.5, '#1e4620');
    gradient.addColorStop(1, '#2d5a27');
    
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    
    // 잔디 텍스처 패턴
    this.drawGrassPattern();
  }
  
  drawGrassPattern() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * this.canvas.width;
      const y = Math.random() * this.canvas.height;
      this.ctx.fillRect(x, y, 2, 2);
    }
  }
  
  drawTrack() {
    const ctx = this.ctx;
    
    // 부드러운 트랙 경로 캐시
    if (!this.smoothPath) {
      this.smoothPath = Track.getSmoothPath(200);
    }
    
    // 트랙 외곽선 (진한 회색 테두리)
    ctx.strokeStyle = '#333';
    ctx.lineWidth = Track.trackWidth + 20;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    this.drawPath(this.smoothPath);
    ctx.stroke();
    
    // 트랙 본체 (아스팔트)
    const trackGradient = ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
    trackGradient.addColorStop(0, '#3d3d3d');
    trackGradient.addColorStop(0.5, '#4a4a4a');
    trackGradient.addColorStop(1, '#3d3d3d');
    
    ctx.strokeStyle = trackGradient;
    ctx.lineWidth = Track.trackWidth;
    this.drawPath(this.smoothPath);
    ctx.stroke();
    
    // 트랙 중앙선 (점선)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 20]);
    this.drawPath(this.smoothPath);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 연석 그리기
    this.drawCurbs();
    
    // 시작/결승선 그리기
    this.drawStartLine();
    
    // 체크포인트 (디버그용, 필요시 주석 해제)
    // this.drawCheckpoints();
  }
  
  drawPath(points) {
    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    
    ctx.closePath();
  }
  
  drawCurbs() {
    const ctx = this.ctx;
    
    Track.curbs.forEach(curb => {
      ctx.save();
      ctx.translate(curb.x, curb.y);
      ctx.rotate(curb.angle);
      
      // 빨간색-흰색 줄무늬 연석
      const stripeWidth = 10;
      const numStripes = Math.ceil(curb.width / stripeWidth);
      
      for (let i = 0; i < numStripes; i++) {
        ctx.fillStyle = i % 2 === 0 ? '#ff3333' : '#ffffff';
        ctx.fillRect(
          -curb.width / 2 + i * stripeWidth,
          -curb.height / 2,
          stripeWidth,
          curb.height
        );
      }
      
      ctx.restore();
    });
  }
  
  drawStartLine() {
    const ctx = this.ctx;
    const startLine = Track.startLine;
    
    ctx.save();
    ctx.translate(startLine.x, startLine.y);
    // startLine.angle 은 트랙 진행 방향(접선)이라고 보고,
    // 여기에 90도 회전시켜 트랙을 가로지르는 형태로 표시
    ctx.rotate(startLine.angle + Math.PI / 2);
    
    // 체커 플래그 패턴 (트랙 폭과 동일한 길이)
    const rows = 2;
    const cols = 8;
    const lineLength = Track.trackWidth;
    const squareSize = lineLength / cols;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        ctx.fillStyle = (row + col) % 2 === 0 ? '#ffffff' : '#000000';
        ctx.fillRect(
          -lineLength / 2 + col * squareSize,
          -rows * squareSize / 2 + row * squareSize,
          squareSize,
          squareSize
        );
      }
    }
    
    ctx.restore();
  }
  
  drawCheckpoints() {
    const ctx = this.ctx;
    
    Track.checkpoints.forEach((cp, index) => {
      ctx.beginPath();
      ctx.arc(cp.x, cp.y, 30, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
      ctx.fill();
      
      ctx.fillStyle = '#fff';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(`CP${index}`, cp.x, cp.y + 5);
    });
  }
  
  // F1 스타일 차량 그리기 (캔버스 벡터 드로잉)
  drawCar(car, isLocalPlayer = false) {
    const ctx = this.ctx;
    const { x, y } = car.position;
    const angle = car.angle;
    const steer = car.steerAngle || 0;

    const palette = this.getCarPalette(car, isLocalPlayer);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2);

    const length = 80;
    const width = 30;
    const bodyWidth = 16;

    // 1) 바닥 플로어 / 디퓨저
    ctx.fillStyle = palette.floor;
    ctx.beginPath();
    ctx.roundRect(-width * 0.45, -length * 0.45, width * 0.9, length * 0.9, 6);
    ctx.fill();

    // 2) 메인 차체 (노즈 + 모노코크 + 엔진커버)
    const bodyGrad = ctx.createLinearGradient(-bodyWidth, 0, bodyWidth, 0);
    bodyGrad.addColorStop(0, palette.bodyEdge);
    bodyGrad.addColorStop(0.5, palette.bodyTopMid || palette.bodyTop);
    bodyGrad.addColorStop(1, palette.bodyEdge);
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    ctx.moveTo(0, -length * 0.5); // 노즈 팁
    ctx.bezierCurveTo(
      bodyWidth * 0.7, -length * 0.45,
      bodyWidth * 0.9, -length * 0.15,
      bodyWidth * 0.9, 0
    );
    ctx.bezierCurveTo(
      bodyWidth * 1.0, length * 0.15,
      bodyWidth * 0.7, length * 0.4,
      bodyWidth * 0.3, length * 0.48
    );
    ctx.lineTo(-bodyWidth * 0.3, length * 0.48);
    ctx.bezierCurveTo(
      -bodyWidth * 0.7, length * 0.4,
      -bodyWidth * 1.0, length * 0.15,
      -bodyWidth * 0.9, 0
    );
    ctx.bezierCurveTo(
      -bodyWidth * 0.9, -length * 0.15,
      -bodyWidth * 0.7, -length * 0.45,
      0, -length * 0.5
    );
    ctx.closePath();
    ctx.fill();

    // 3) 중앙 스트라이프
    ctx.fillStyle = palette.stripe;
    ctx.beginPath();
    ctx.roundRect(
      -bodyWidth * 0.22,
      -length * 0.48,
      bodyWidth * 0.44,
      length * 0.75,
      bodyWidth * 0.22
    );
    ctx.fill();

    // 4) 사이드팟 (양옆 벌어진 부분)
    ctx.fillStyle = palette.sidepod;
    ctx.beginPath();
    ctx.moveTo(bodyWidth * 0.9, -length * 0.05);
    ctx.bezierCurveTo(
      width * 0.65, -length * 0.0,
      width * 0.65, length * 0.15,
      bodyWidth * 0.9, length * 0.18
    );
    ctx.lineTo(bodyWidth * 0.5, length * 0.18);
    ctx.bezierCurveTo(
      bodyWidth * 0.8, length * 0.05,
      bodyWidth * 0.8, -length * 0.05,
      bodyWidth * 0.5, -length * 0.12
    );
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-bodyWidth * 0.9, -length * 0.05);
    ctx.bezierCurveTo(
      -width * 0.65, -length * 0.0,
      -width * 0.65, length * 0.15,
      -bodyWidth * 0.9, length * 0.18
    );
    ctx.lineTo(-bodyWidth * 0.5, length * 0.18);
    ctx.bezierCurveTo(
      -bodyWidth * 0.8, length * 0.05,
      -bodyWidth * 0.8, -length * 0.05,
      -bodyWidth * 0.5, -length * 0.12
    );
    ctx.closePath();
    ctx.fill();

    // 5) 프론트 윙
    const noseY = -length * 0.5;
    const frontWingY = noseY - 8;
    const frontWingSpan = width + 18;

    // 메인 플레이트
    ctx.fillStyle = palette.frontWingMain;
    ctx.beginPath();
    ctx.roundRect(
      -frontWingSpan / 2,
      frontWingY,
      frontWingSpan,
      6,
      3
    );
    ctx.fill();

    // 윙 플랩
    ctx.fillStyle = palette.frontWingFlap;
    ctx.beginPath();
    ctx.roundRect(
      -frontWingSpan / 2,
      frontWingY + 4,
      frontWingSpan,
      4,
      2
    );
    ctx.fill();

    // 엔드플레이트
    ctx.fillStyle = palette.frontWingEndplateInner;
    ctx.fillRect(-frontWingSpan / 2 - 3, frontWingY - 2, 5, 16);
    ctx.fillRect(frontWingSpan / 2 - 2, frontWingY - 2, 5, 16);

    ctx.fillStyle = palette.frontWingEndplateOuter;
    ctx.fillRect(-frontWingSpan / 2 - 3, frontWingY + 3, 5, 6);
    ctx.fillRect(frontWingSpan / 2 - 2, frontWingY + 3, 5, 6);

    // 6) 리어 윙
    const rearWingY = length * 0.38;
    const rearWingSpan = width + 10;

    ctx.fillStyle = palette.rearWingMain;
    ctx.beginPath();
    ctx.roundRect(
      -rearWingSpan / 2,
      rearWingY,
      rearWingSpan,
      6,
      3
    );
    ctx.fill();

    ctx.fillStyle = palette.rearWingFlap;
    ctx.beginPath();
    ctx.roundRect(
      -rearWingSpan / 2 + 2,
      rearWingY + 3,
      rearWingSpan - 4,
      4,
      2
    );
    ctx.fill();

    // 리어 윙 엔드플레이트
    ctx.fillStyle = palette.rearWingEndplateInner;
    ctx.fillRect(-rearWingSpan / 2 - 2, rearWingY - 2, 5, 16);
    ctx.fillRect(rearWingSpan / 2 - 3, rearWingY - 2, 5, 16);

    ctx.fillStyle = palette.rearWingEndplateOuter;
    ctx.fillRect(-rearWingSpan / 2 - 2, rearWingY + 4, 5, 6);
    ctx.fillRect(rearWingSpan / 2 - 3, rearWingY + 4, 5, 6);

    // 7) 콕핏 / 헬멧
    const cockpitY = -length * 0.1;
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(0, cockpitY, bodyWidth * 0.35, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = palette.helmet;
    ctx.beginPath();
    ctx.arc(0, cockpitY - 1, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 바이저
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, cockpitY - 1, 3.3, Math.PI * 0.15, Math.PI - Math.PI * 0.15);
    ctx.stroke();

    // 8) 헤일로
    ctx.strokeStyle = palette.halo;
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.arc(0, cockpitY, 9, Math.PI * 0.7, Math.PI * 0.3, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, cockpitY + 2);
    ctx.lineTo(0, cockpitY + 10);
    ctx.stroke();

    // 9) 바퀴
    const tireFrontW = 7;
    const tireFrontH = 13;
    const tireRearW = 8;
    const tireRearH = 16;

    const frontY = -length * 0.3;
    const rearY = length * 0.23;
    const offsetX = width * 0.55;

    // 앞바퀴 (조향) - 시각적 회전각 증폭
    // - 실제 조향각이 작아서 잘 안보이므로 1.5배 증폭
    // - 너무 크면 비현실적, 너무 작으면 안보임
    const visualSteer = steer * 1.5;
    this.drawSteeringTire(ctx, -offsetX, frontY, tireFrontH, tireFrontW, visualSteer);
    this.drawSteeringTire(ctx, offsetX, frontY, tireFrontH, tireFrontW, visualSteer);

    // 뒷바퀴 (고정)
    ctx.fillStyle = '#111';
    ctx.fillRect(-offsetX - tireRearW / 2, rearY - tireRearH / 2, tireRearW, tireRearH);
    ctx.fillRect(offsetX - tireRearW / 2, rearY - tireRearH / 2, tireRearW, tireRearH);

    ctx.restore();

    // 닉네임 표시
    ctx.fillStyle = isLocalPlayer ? '#00ff88' : '#ffffff';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(car.nickname, x, y - length * 0.65);
  }
  
  // 조향이 가능한 바퀴를 그리기 위한 보조 함수
  drawSteeringTire(ctx, x, y, h, w, steerAngle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(steerAngle); // 조향 각도만큼 회전
    
    // 타이어 본체
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 2);
    ctx.fill();
    
    // 타이어 광택/무늬 (앞뒤 구분)
    ctx.fillStyle = '#333';
    ctx.fillRect(-w / 2, -h / 2, w, 2);
    
    ctx.restore();
  }

  // car.carSkin 값(문자열)을 기반으로 팔레트를 선택
  getCarPalette(car, isLocalPlayer) {
    const presets = [
      // 파란 바디 + 노란 스트라이프 (로컬 기본)
      {
        id: 'blue_yellow',
        floor: '#05070c',
        bodyTop: '#2d6ce8',
        bodyTopMid: '#347cf5',
        bodyBottom: '#123271',
        bodyEdge: '#061021',
        stripe: '#ffd447',
        sidepod: '#173a86',
        frontWingMain: '#f5f7ff',
        frontWingFlap: '#dde4ff',
        frontWingEndplateInner: '#ffd447',
        frontWingEndplateOuter: '#ff3b3b',
        rearWingMain: '#f5f7ff',
        rearWingFlap: '#dde4ff',
        rearWingEndplateInner: '#ff3b3b',
        rearWingEndplateOuter: '#ffd447',
        halo: '#1b2340',
        helmet: '#f5f5f5',
      },
      // 레드/블랙
      {
        id: 'red_black',
        floor: '#050505',
        bodyTop: '#c71f1f',
        bodyTopMid: '#e53333',
        bodyBottom: '#7b0505',
        bodyEdge: '#2b0000',
        stripe: '#ffffff',
        sidepod: '#1a1a1a',
        frontWingMain: '#f5f5f5',
        frontWingFlap: '#dedede',
        frontWingEndplateInner: '#ff3b3b',
        frontWingEndplateOuter: '#000000',
        rearWingMain: '#f5f5f5',
        rearWingFlap: '#dedede',
        rearWingEndplateInner: '#ff3b3b',
        rearWingEndplateOuter: '#000000',
        halo: '#222222',
        helmet: '#f5f5f5',
      },
      // 블랙/시안
      {
        id: 'black_cyan',
        floor: '#020307',
        bodyTop: '#15181f',
        bodyTopMid: '#252b3a',
        bodyBottom: '#070a10',
        bodyEdge: '#010308',
        stripe: '#00e1ff',
        sidepod: '#121926',
        frontWingMain: '#e8f9ff',
        frontWingFlap: '#cdefff',
        frontWingEndplateInner: '#00e1ff',
        frontWingEndplateOuter: '#ff3b3b',
        rearWingMain: '#e8f9ff',
        rearWingFlap: '#cdefff',
        rearWingEndplateInner: '#00e1ff',
        rearWingEndplateOuter: '#ff3b3b',
        halo: '#141a26',
        helmet: '#f5f5f5',
      },
      // 그린/화이트
      {
        id: 'green_white',
        floor: '#02140b',
        bodyTop: '#0f9f4f',
        bodyTopMid: '#12b861',
        bodyBottom: '#066633',
        bodyEdge: '#02331a',
        stripe: '#ffffff',
        sidepod: '#0a5a32',
        frontWingMain: '#f5fff7',
        frontWingFlap: '#ddf7e4',
        frontWingEndplateInner: '#ffffff',
        frontWingEndplateOuter: '#0f9f4f',
        rearWingMain: '#f5fff7',
        rearWingFlap: '#ddf7e4',
        rearWingEndplateInner: '#ffffff',
        rearWingEndplateOuter: '#0f9f4f',
        halo: '#06331a',
        helmet: '#f5f5f5',
      },
    ];

    const key =
      (car && typeof car.carSkin === 'string' && car.carSkin) ||
      (isLocalPlayer ? 'blue_yellow' : 'red_black');

    // id가 명시적으로 매핑되는 경우 우선 사용
    const direct = presets.find((p) => key === p.id || key === `${p.id}.png`);
    if (direct) return direct;

    // 그 외에는 문자열 해시 기반으로 팔레트 선택
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = (hash + key.charCodeAt(i) * 17) | 0;
    }
    const index = Math.abs(hash) % presets.length;
    return presets[index];
  }
  
  drawTire(ctx, x, y, width, height) {
    // 타이어 외곽
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.ellipse(x, y, width / 2, height / 2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 타이어 측면 하이라이트 링
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(x, y, width / 2 - 1, height / 2 - 1, 0, 0, Math.PI * 2);
    ctx.stroke();

    // 림
    ctx.fillStyle = '#c0c0c0';
    ctx.beginPath();
    ctx.ellipse(x, y, width / 3, height / 3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 림 중심
    ctx.fillStyle = '#777';
    ctx.beginPath();
    ctx.arc(x, y, Math.min(width, height) / 8, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // 미니맵 그리기
  drawMinimap(cars, localPlayerId) {
    const ctx = this.ctx;
    const mapX = 20;
    const mapY = 20;
    const mapWidth = 150;
    const mapHeight = 100;

    const path = Track.centerPath;

    // 트랙 실제 경계를 기준으로 스케일/위치 계산 (찌그러짐 방지)
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    path.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });

    const trackWidth = maxX - minX;
    const trackHeight = maxY - minY;

    const scale = Math.min(mapWidth / trackWidth, mapHeight / trackHeight);

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    const originX = mapX + mapWidth / 2;
    const originY = mapY + mapHeight / 2;
    
    // 미니맵 배경
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(mapX - 5, mapY - 5, mapWidth + 10, mapHeight + 10);
    
    // 트랙 미니맵
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(
      originX + (path[0].x - centerX) * scale,
      originY + (path[0].y - centerY) * scale,
    );

    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(
        originX + (path[i].x - centerX) * scale,
        originY + (path[i].y - centerY) * scale,
      );
    }
    ctx.closePath();
    ctx.stroke();
    
    // 차량 표시
    cars.forEach(car => {
      const isLocal = car.id === localPlayerId;
      ctx.fillStyle = isLocal ? '#00ff88' : '#ff6b35';
      ctx.beginPath();
      ctx.arc(
        originX + (car.position.x - centerX) * scale,
        originY + (car.position.y - centerY) * scale,
        isLocal ? 4 : 3,
        0,
        Math.PI * 2
      );
      ctx.fill();
    });
  }
  
  // 속도 효과 (모션 블러)
  drawSpeedEffect(car) {
    // 바람 / 모션 블러 효과 제거
    return;
  }
}

