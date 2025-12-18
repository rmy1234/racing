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
  
  // AlphaTauri 스타일 F1 차량 그리기 (탑다운 뷰)
  drawCar(car, isLocalPlayer = false) {
    const ctx = this.ctx;
    const { x, y } = car.position;
    const angle = car.angle;
    
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle + Math.PI / 2); // 위쪽이 앞쪽
    
    // 차량 크기 (실제 F1 비율에 좀 더 가깝게)
    const length = 52;
    const width = 20;
    const bodyWidth = width * 0.6;
    
    // 그림자
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(2, 4, width / 2 + 4, length / 2 + 4, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // 바닥/플로어
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.roundRect(-bodyWidth * 0.9, -length / 2.1, bodyWidth * 1.8, length * 0.95, 4);
    ctx.fill();
    
    // 차체 메인 컬러 (레드 F1)
    const bodyGradient = ctx.createLinearGradient(0, -length / 2, 0, length / 2);
    bodyGradient.addColorStop(0, '#c71f1f');
    bodyGradient.addColorStop(0.5, '#ff3b3b');
    bodyGradient.addColorStop(1, '#990d0d');
    ctx.fillStyle = bodyGradient;
    
    // 모노코크 + 엔진커버
    ctx.beginPath();
    // 노즈 팁
    ctx.moveTo(0, -length / 2);
    ctx.lineTo(bodyWidth * 0.22, -length / 2 + 8);
    ctx.lineTo(bodyWidth * 0.32, -length / 2 + 16);
    // 콕핏 앞
    ctx.lineTo(bodyWidth * 0.35, -length / 6);
    // 사이드팟/엔진커버
    ctx.lineTo(bodyWidth * 0.5, length / 6);
    ctx.lineTo(bodyWidth * 0.35, length / 2.3);
    ctx.lineTo(0, length / 2);
    ctx.lineTo(-bodyWidth * 0.35, length / 2.3);
    ctx.lineTo(-bodyWidth * 0.5, length / 6);
    ctx.lineTo(-bodyWidth * 0.35, -length / 6);
    ctx.lineTo(-bodyWidth * 0.32, -length / 2 + 16);
    ctx.lineTo(-bodyWidth * 0.22, -length / 2 + 8);
    ctx.closePath();
    ctx.fill();
    
    // 차체 테두리
    ctx.strokeStyle = '#5b0000';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // 에어 인테이크 & 엔진 상단 라인
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, -length / 6);
    ctx.lineTo(0, length / 3.2);
    ctx.stroke();
    
    // 프론트 윙 메인 플레이트
    const wingSpan = width + 18;
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.roundRect(-wingSpan / 2, -length / 2 + 4, wingSpan, 5, 2);
    ctx.fill();
    
    // 프론트 윙 플랩
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.roundRect(-wingSpan / 2, -length / 2 + 7, wingSpan, 3, 2);
    ctx.fill();
    
    // 프론트 윙 엔드플레이트
    ctx.fillStyle = '#d50000';
    ctx.fillRect(-wingSpan / 2, -length / 2 + 2, 3, 10);
    ctx.fillRect(wingSpan / 2 - 3, -length / 2 + 2, 3, 10);
    
    // 리어 윙
    const rearWingSpan = width + 10;
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.roundRect(-rearWingSpan / 2, length / 3.2, rearWingSpan, 5, 2);
    ctx.fill();
    
    // 리어 윙 플랩
    ctx.fillStyle = '#e0e0e0';
    ctx.beginPath();
    ctx.roundRect(-rearWingSpan / 2 + 2, length / 3.2 + 3, rearWingSpan - 4, 3, 2);
    ctx.fill();
    
    // 리어 윙 기둥
    ctx.fillStyle = '#111';
    ctx.fillRect(-2, length / 4.2, 4, length / 10);
    
    // 콕핏/헬멧
    ctx.fillStyle = '#444';
    ctx.beginPath();
    ctx.ellipse(0, -length / 10, bodyWidth * 0.35, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#f5f5f5';
    ctx.beginPath();
    ctx.arc(0, -length / 10, 4.2, 0, Math.PI * 2);
    ctx.fill();
    
    // 헬멧 바이저 라인
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, -length / 10, 3.2, Math.PI * 0.15, Math.PI - Math.PI * 0.15);
    ctx.stroke();
    
    // 헬로 (Halo)
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, -length / 10, 8, Math.PI * 0.7, Math.PI * 0.3, true);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -length / 10 + 2);
    ctx.lineTo(0, -length / 40);
    ctx.stroke();
    
    // 차체 상단 번호
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 8px Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('10', 0, length / 8);
    
    // 서스펜션 암
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1.5;
    const frontY = -length / 3.4;
    const rearY = length / 4.2;
    const armX = bodyWidth * 0.55;
    ctx.beginPath();
    ctx.moveTo(armX, frontY);
    ctx.lineTo(width / 2 + 4, frontY);
    ctx.moveTo(-armX, frontY);
    ctx.lineTo(-width / 2 - 4, frontY);
    ctx.moveTo(armX * 0.9, rearY);
    ctx.lineTo(width / 2 + 4, rearY);
    ctx.moveTo(-armX * 0.9, rearY);
    ctx.lineTo(-width / 2 - 4, rearY);
    ctx.stroke();
    
    // 타이어 (타원형 휠)
    this.drawTire(ctx, -width / 2 - 4, frontY, 9, 6);
    this.drawTire(ctx, width / 2 + 4, frontY, 9, 6);
    this.drawTire(ctx, -width / 2 - 4, rearY, 10, 7);
    this.drawTire(ctx, width / 2 + 4, rearY, 10, 7);
    
    ctx.restore();
    
    // 닉네임 표시
    ctx.fillStyle = isLocalPlayer ? '#00ff88' : '#ffffff';
    ctx.font = 'bold 12px Rajdhani';
    ctx.textAlign = 'center';
    ctx.fillText(car.nickname, x, y - 30);
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

