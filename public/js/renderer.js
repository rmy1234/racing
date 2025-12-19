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
  // @param {Object} car - 차량 상태 객체 (position, angle, steerAngle, nickname 등)
  // @param {boolean} isLocalPlayer - 로컬 플레이어 여부 (닉네임 색상 변경용)
  drawCar(car, isLocalPlayer = false) {
    // 캔버스 컨텍스트 가져오기
    const ctx = this.ctx;
    
    // 차량 위치 좌표 추출
    const { x, y } = car.position;
    
    // 차체 각도 (라디안) - 차량이 향하는 방향
    const angle = car.angle;
    
    // 앞바퀴 조향각 (라디안) - 조향 입력에 따라 변함
    const steer = car.steerAngle || 0;

    // 차량 색상 팔레트 가져오기 (차량 스킨에 따라 다른 색상)
    const palette = this.getCarPalette(car, isLocalPlayer);

    // 캔버스 상태 저장 (변환 후 복원하기 위해)
    ctx.save();
    
    // 차량 위치로 좌표계 이동
    ctx.translate(x, y);
    
    // 차체 각도만큼 회전 (Math.PI / 2는 캔버스 좌표계 보정)
    // - 캔버스는 위쪽이 -y, 아래쪽이 +y
    // - 게임에서는 위쪽이 +y이므로 90도 회전 보정 필요
    ctx.rotate(angle + Math.PI / 2);

    // ========================================
    // 차량 기본 치수 (픽셀 단위)
    // ========================================
    const length = 90;        // 차량 전체 길이 (앞뒤)
    const width = 27;        // 차량 전체 폭 (좌우)
    const bodyWidth = 16;    // 차체 본체 폭 (중앙 몸체)

    // ========================================
    // 바퀴 위치 계산 (다른 요소들이 참조)
    // ========================================
    const frontWheelY = -length * 0.35;   // 앞바퀴 Y 위치 (더 앞으로)
    const rearWheelY = length * 0.28;     // 뒷바퀴 Y 위치
    const wheelOffsetX = width * 0.65;    // 바퀴 X 오프셋 (중앙에서 좌우로)

    // ========================================
    // 1) 바닥 플로어 (언더바디) - 직사각형 형태
    // ========================================
    // 이미지처럼 큰 회전 없이 직사각형 형태의 바닥
    ctx.fillStyle = palette.floor;
    ctx.beginPath();
    ctx.roundRect(
      -width * 0.55,          // 왼쪽
      -length * 0.15,         // 앞쪽 (앞바퀴 뒤쪽부터)
      width * 1.1,            // 폭
      length * 0.5,           // 길이 (뒷바퀴 앞까지)
      3                       // 모서리 둥글기
    );
    ctx.fill();

    // ========================================
    // 2) 메인 차체 (이미지 기반 재디자인)
    // ========================================
    // 이미지 특징:
    // - 노즈: 좁게 시작
    // - 중간: 사이드팟에서 갑자기 넓어짐
    // - 엔진커버: 뒤로 가면서 다시 좁아짐
    
    const bodyGrad = ctx.createLinearGradient(-bodyWidth, 0, bodyWidth, 0);
    bodyGrad.addColorStop(0, palette.bodyEdge);
    bodyGrad.addColorStop(0.5, palette.bodyTopMid || palette.bodyTop);
    bodyGrad.addColorStop(1, palette.bodyEdge);
    ctx.fillStyle = bodyGrad;

    ctx.beginPath();
    
    // 노즈 팁
    const noseTipY = -length * 0.52;
    const noseWidth = wheelOffsetX * 0.45;  // 노즈 폭
    
    ctx.moveTo(0, noseTipY); // 노즈 끝점
    
    // 오른쪽 노즈: 좁게 유지
    ctx.bezierCurveTo(
      noseWidth * 0.3, noseTipY + 5,
      noseWidth * 0.6, -length * 0.35,
      noseWidth * 0.7, -length * 0.2       // 노즈가 좁게 유지됨
    );
    
    // 오른쪽: 사이드팟에서 갑자기 넓어짐
    ctx.bezierCurveTo(
      noseWidth * 0.8, -length * 0.15,
      width * 0.5, -length * 0.1,          // 급격히 넓어짐
      width * 0.55, 0                      // 사이드팟 최대 폭
    );
    
    // 오른쪽: 사이드팟에서 엔진커버로 (점점 좁아짐)
    ctx.bezierCurveTo(
      width * 0.55, length * 0.1,
      width * 0.45, length * 0.2,
      bodyWidth * 0.3, length * 0.4        // 엔진커버 끝
    );
    
    // 뒤쪽 직선
    ctx.lineTo(-bodyWidth * 0.3, length * 0.4);
    
    // 왼쪽: 엔진커버에서 사이드팟으로
    ctx.bezierCurveTo(
      -width * 0.45, length * 0.2,
      -width * 0.55, length * 0.1,
      -width * 0.55, 0                     // 사이드팟 최대 폭
    );
    
    // 왼쪽: 사이드팟에서 노즈로 (급격히 좁아짐)
    ctx.bezierCurveTo(
      -width * 0.5, -length * 0.1,
      -noseWidth * 0.8, -length * 0.15,
      -noseWidth * 0.7, -length * 0.2      // 노즈로 수렴
    );
    
    // 왼쪽 노즈
    ctx.bezierCurveTo(
      -noseWidth * 0.6, -length * 0.35,
      -noseWidth * 0.3, noseTipY + 5,
      0, noseTipY                          // 노즈 팁
    );
    
    ctx.closePath();
    ctx.fill();

    // ========================================
    // 3) 앞바퀴와 노즈 연결 서스펜션 (검은색)
    // ========================================
    // 차체에서 바퀴로 갈수록 좁아지는 형태
    // 차체 연결부는 노즈 경계에 붙어있음
    ctx.fillStyle = '#111';
    
    // 왼쪽 앞바퀴 서스펜션 (차체에 붙어서 시작, 바퀴로 갈수록 좁아짐)
    ctx.beginPath();
    // 차체 연결부 (노즈 경계에 붙어있음) - 넓게 시작
    ctx.moveTo(-noseWidth * 0.6, -length * 0.37);   // 상단 (노즈 경계)
    ctx.lineTo(-noseWidth * 0.6, -length * 0.28);    // 하단 (노즈 경계)
    // 바퀴 연결부 - 좁게 끝남
    ctx.lineTo(-wheelOffsetX + 2, frontWheelY + 1);  // 바퀴 하단
    ctx.lineTo(-wheelOffsetX + 2, frontWheelY - 1);  // 바퀴 상단
    ctx.closePath();
    ctx.fill();
    
    // 오른쪽 앞바퀴 서스펜션 (차체에 붙어서 시작, 바퀴로 갈수록 좁아짐)
    ctx.beginPath();
    // 차체 연결부 (노즈 경계에 붙어있음) - 넓게 시작
    ctx.moveTo(noseWidth * 0.6, -length * 0.37);    // 상단 (노즈 경계)
    ctx.lineTo(noseWidth * 0.6, -length * 0.28);     // 하단 (노즈 경계)
    // 바퀴 연결부 - 좁게 끝남
    ctx.lineTo(wheelOffsetX - 2, frontWheelY + 1);   // 바퀴 하단
    ctx.lineTo(wheelOffsetX - 2, frontWheelY - 1);   // 바퀴 상단
    ctx.closePath();
    ctx.fill();
    
    // ========================================
    // 4) 뒷바퀴와 차체 연결 서스펜션 (검은색)
    // ========================================
    // 왼쪽 뒷바퀴 서스펜션
    ctx.beginPath();
    ctx.moveTo(-bodyWidth * 0.4, length * 0.3);
    ctx.lineTo(-wheelOffsetX + 4, rearWheelY - 3);
    ctx.lineTo(-wheelOffsetX + 4, rearWheelY + 3);
    ctx.lineTo(-bodyWidth * 0.4, length * 0.3);
    ctx.closePath();
    ctx.fill();
    
    // 오른쪽 뒷바퀴 서스펜션
    ctx.beginPath();
    ctx.moveTo(bodyWidth * 0.4, length * 0.3);
    ctx.lineTo(wheelOffsetX - 4, rearWheelY - 3);
    ctx.lineTo(wheelOffsetX - 4, rearWheelY + 3);
    ctx.lineTo(bodyWidth * 0.4, length * 0.3);
    ctx.closePath();
    ctx.fill();

    // ========================================
    // 5) 프론트 윙 (화살표 형태, 앞으로 뾰족하고 안쪽으로 들어감)
    // ========================================
    // 이미지처럼 양 끝이 화살표 형태로 앞으로 뾰족하고 안쪽으로 들어감
    const frontWingY = noseTipY - 3;
    const frontWingSpan = wheelOffsetX * 2.0;   // 앞바퀴 사이 너비
    const arrowTipY = frontWingY - 4;           // 화살표 뾰족한 끝 (앞으로)
    const arrowInnerY = frontWingY + 3;         // 화살표 안쪽 들어간 부분

    // 프론트 윙 메인 구조
    ctx.fillStyle = palette.bodyTop;
    ctx.beginPath();
    
    // 왼쪽 화살표 끝 (뾰족하게 앞으로)
    ctx.moveTo(-frontWingSpan / 2 - 3, arrowTipY);
    // 왼쪽 화살표 안쪽 (뒤로 들어감)
    ctx.lineTo(-frontWingSpan / 2, arrowInnerY);
    // 왼쪽 안쪽에서 중앙 방향으로
    ctx.lineTo(-frontWingSpan / 2 + 8, arrowInnerY + 2);
    // 중앙 연결부
    ctx.lineTo(-noseWidth * 0.6, frontWingY + 4);
    ctx.lineTo(0, frontWingY + 3);
    ctx.lineTo(noseWidth * 0.6, frontWingY + 4);
    // 오른쪽 안쪽에서 끝 방향으로
    ctx.lineTo(frontWingSpan / 2 - 8, arrowInnerY + 2);
    ctx.lineTo(frontWingSpan / 2, arrowInnerY);
    // 오른쪽 화살표 끝 (뾰족하게 앞으로)
    ctx.lineTo(frontWingSpan / 2 + 3, arrowTipY);
    // 오른쪽 끝 앞부분
    ctx.lineTo(frontWingSpan / 2, arrowTipY - 1);
    // 오른쪽에서 중앙으로 (앞쪽 라인)
    ctx.lineTo(frontWingSpan / 2 - 6, frontWingY);
    ctx.lineTo(noseWidth * 0.8, frontWingY + 1);
    ctx.lineTo(0, frontWingY);
    ctx.lineTo(-noseWidth * 0.8, frontWingY + 1);
    ctx.lineTo(-frontWingSpan / 2 + 6, frontWingY);
    // 왼쪽 끝 앞부분
    ctx.lineTo(-frontWingSpan / 2, arrowTipY - 1);
    ctx.closePath();
    ctx.fill();

    // 엔드플레이트 (화살표 형태 강조)
    ctx.fillStyle = palette.bodyTop;
    // 왼쪽 엔드플레이트
    ctx.beginPath();
    ctx.moveTo(-frontWingSpan / 2 - 4, arrowTipY - 2);  // 앞쪽 끝
    ctx.lineTo(-frontWingSpan / 2 - 5, arrowTipY);       // 뾰족한 끝
    ctx.lineTo(-frontWingSpan / 2 - 2, arrowInnerY + 4); // 뒤쪽
    ctx.lineTo(-frontWingSpan / 2 + 1, arrowInnerY + 4);
    ctx.lineTo(-frontWingSpan / 2, arrowTipY - 2);
    ctx.closePath();
    ctx.fill();
    
    // 오른쪽 엔드플레이트
    ctx.beginPath();
    ctx.moveTo(frontWingSpan / 2 + 4, arrowTipY - 2);
    ctx.lineTo(frontWingSpan / 2 + 5, arrowTipY);
    ctx.lineTo(frontWingSpan / 2 + 2, arrowInnerY + 4);
    ctx.lineTo(frontWingSpan / 2 - 1, arrowInnerY + 4);
    ctx.lineTo(frontWingSpan / 2, arrowTipY - 2);
    ctx.closePath();
    ctx.fill();

    // ========================================
    // 6) 리어 윙 (뒷바퀴 사이, 겹치지 않게)
    // ========================================
    // 리어 윙이 뒷바퀴와 겹치지 않도록 크기 조절
    const rearWingY = rearWheelY + 2;
    const rearWingSpan = wheelOffsetX * 1.0;  // 뒷바퀴 안쪽보다 좁게

    // 메인 플레이트 (바디 색상과 통일)
    ctx.fillStyle = palette.bodyTop;  // 바디 색상과 통일
    ctx.beginPath();
    ctx.roundRect(-rearWingSpan / 2, rearWingY, rearWingSpan, 6, 2);
    ctx.fill();

    // 윙 플랩 (바디 색상과 통일)
    ctx.fillStyle = palette.bodyTop;  // 바디 색상과 통일
    ctx.beginPath();
    ctx.roundRect(-rearWingSpan / 2 + 2, rearWingY + 3, rearWingSpan - 4, 4, 2);
    ctx.fill();

    // 엔드플레이트 (바디 색상과 통일)
    ctx.fillStyle = palette.bodyTop;  // 바디 색상과 통일
    ctx.fillRect(-rearWingSpan / 2 - 3, rearWingY - 2, 5, 14);
    ctx.fillRect(rearWingSpan / 2 - 2, rearWingY - 2, 5, 14);
    
    // 리어 윙 지지대
    ctx.fillStyle = palette.floor;
    ctx.fillRect(-2, length * 0.35, 4, rearWingY - length * 0.35);

    // ========================================
    // 7) 콕핏 / 헬멧
    // ========================================
    // 운전석과 드라이버 헬멧 그리기
    
    // 콕핏 위치 계산
    const cockpitY = -length * 0.1;  // 콕핏 Y 위치: -8 (차량 앞쪽)
    
    // 콕핏 구멍 (운전석 열린 부분)
    // - ellipse(x, y, radiusX, radiusY, rotation, startAngle, endAngle)
    //   x: 0 (중앙)
    //   y: cockpitY = -8
    //   radiusX: bodyWidth * 0.35 = 5.6 (가로 반지름)
    //   radiusY: 7 (세로 반지름)
    //   rotation: 0 (회전 없음)
    //   startAngle: 0
    //   endAngle: Math.PI * 2 (전체 원)
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.ellipse(0, cockpitY, bodyWidth * 0.35, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 드라이버 헬멧
    // - arc(x, y, radius, startAngle, endAngle)
    //   x: 0 (중앙)
    //   y: cockpitY - 1 = -9 (콕핏보다 1px 위)
    //   radius: 4.5 (헬멧 반지름)
    ctx.fillStyle = palette.helmet;
    ctx.beginPath();
    ctx.arc(0, cockpitY - 1, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // 바이저 (헬멧 앞면의 검은 선)
    // - arc로 반원 형태의 바이저 그리기
    //   startAngle: Math.PI * 0.15 ≈ 27도
    //   endAngle: Math.PI - Math.PI * 0.15 ≈ 153도
    ctx.strokeStyle = '#111';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(0, cockpitY - 1, 3.3, Math.PI * 0.15, Math.PI - Math.PI * 0.15);
    ctx.stroke();

    // ========================================
    // 8) 헤일로 (안전 구조물)
    // ========================================
    // F1 차량의 헤일로 (드라이버 보호용 티타늄 구조물)
    // - 콕핏 위에 위치한 반원형 구조물
    
    // 헤일로 아크 (위쪽 반원)
    // - arc(x, y, radius, startAngle, endAngle, anticlockwise)
    //   x: 0 (중앙)
    //   y: cockpitY = -8
    //   radius: 9 (헤일로 반지름)
    //   startAngle: Math.PI * 0.7 ≈ 126도
    //   endAngle: Math.PI * 0.3 ≈ 54도
    //   anticlockwise: true (반시계 방향)
    ctx.strokeStyle = palette.halo;
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.arc(0, cockpitY, 9, Math.PI * 0.7, Math.PI * 0.3, true);
    ctx.stroke();
    
    // 헤일로 중앙 지지대 (세로 선)
    // - moveTo(x, y): 시작점 (0, -6)
    // - lineTo(x, y): 끝점 (0, 2)
    ctx.beginPath();
    ctx.moveTo(0, cockpitY + 2);  // (0, -6)
    ctx.lineTo(0, cockpitY + 10); // (0, 2)
    ctx.stroke();

    // ========================================
    // 9) 바퀴 (이미지 기반 위치)
    // ========================================
    // 이미지 특징:
    // - 앞바퀴: 차체 앞쪽, 노즈 옆에 위치
    // - 뒷바퀴: 차체 뒤쪽, 리어 윙 옆에 위치
    // - 뒷바퀴가 앞바퀴보다 약간 큼
    
    // 바퀴 치수 정의
    const tireFrontW = 8;   // 앞바퀴 폭 (가로)
    const tireFrontH = 14;  // 앞바퀴 높이 (세로)
    const tireRearW = 9;    // 뒷바퀴 폭 (가로) - 더 넓음
    const tireRearH = 18;   // 뒷바퀴 높이 (세로) - 더 큼

    // 앞바퀴 (조향 가능)
    const visualSteer = steer * 1.5;  // 시각적 조향각 증폭
    
    // 왼쪽 앞바퀴
    this.drawSteeringTire(ctx, -wheelOffsetX, frontWheelY, tireFrontH, tireFrontW, visualSteer);
    // 오른쪽 앞바퀴
    this.drawSteeringTire(ctx, wheelOffsetX, frontWheelY, tireFrontH, tireFrontW, visualSteer);

    // 뒷바퀴 (고정 - 조향 불가)
    ctx.fillStyle = '#111';
    // 왼쪽 뒷바퀴
    ctx.fillRect(-wheelOffsetX - tireRearW / 2, rearWheelY - tireRearH / 2, tireRearW, tireRearH);
    // 오른쪽 뒷바퀴
    ctx.fillRect(wheelOffsetX - tireRearW / 2, rearWheelY - tireRearH / 2, tireRearW, tireRearH);

    // 캔버스 변환 상태 복원 (translate, rotate 이전 상태로)
    ctx.restore();

    // ========================================
    // 닉네임 표시
    // ========================================
    // 차량 위에 플레이어 닉네임 표시
    // - 로컬 플레이어: 초록색 (#00ff88)
    // - 다른 플레이어: 흰색 (#ffffff)
    // - 위치: 차량 위쪽 (y - length * 0.65 = y - 52)
    ctx.fillStyle = isLocalPlayer ? '#00ff88' : '#ffffff';
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(car.nickname, x, y - length * 0.65);
  }
  
  // ========================================
  // 조향이 가능한 바퀴를 그리기 위한 보조 함수
  // ========================================
  // 앞바퀴를 조향각에 따라 회전시켜 그리는 함수
  // @param {CanvasRenderingContext2D} ctx - 캔버스 컨텍스트
  // @param {number} x - 바퀴 X 위치 (차량 중심 기준)
  // @param {number} y - 바퀴 Y 위치 (차량 중심 기준)
  // @param {number} h - 바퀴 높이 (세로)
  // @param {number} w - 바퀴 폭 (가로)
  // @param {number} steerAngle - 조향각 (라디안)
  drawSteeringTire(ctx, x, y, h, w, steerAngle) {
    // 바퀴 위치로 좌표계 이동 및 회전을 위한 상태 저장
    ctx.save();
    
    // 바퀴 위치로 좌표계 이동
    ctx.translate(x, y);
    
    // 조향각만큼 회전 (바퀴가 향하는 방향)
    ctx.rotate(steerAngle);
    
    // 타이어 본체
    // - roundRect(x, y, width, height, radius)
    //   x: -w / 2 (중앙 기준 왼쪽 끝)
    //   y: -h / 2 (중앙 기준 위쪽 끝)
    //   width: w (바퀴 폭)
    //   height: h (바퀴 높이)
    //   radius: 2 (모서리 둥글기)
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h / 2, w, h, 2);
    ctx.fill();
    
    // 타이어 광택/무늬 (앞뒤 구분용)
    // - 바퀴 위쪽에 어두운 선을 그려 앞뒤 구분
    // - fillRect(x, y, width, height)
    //   x: -w / 2 (왼쪽 끝)
    //   y: -h / 2 (위쪽 끝)
    //   width: w (전체 폭)
    //   height: 2 (무늬 두께)
    ctx.fillStyle = '#333';
    ctx.fillRect(-w / 2, -h / 2, w, 2);
    
    // 좌표계 변환 상태 복원
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

