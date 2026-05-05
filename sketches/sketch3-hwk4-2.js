// Design choice: three-toed gull print encodes seconds visually;
//               each second leaves a mark, making time literally walk across the sand

registerSketch('sk3', function (p) {
  const CANVAS_SIZE = 680;
  const OCEAN_H = CANVAS_SIZE / 3;
  const GULL_N  = 38;

  const DIGITS = {
    '0': [[1,1,1],[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,0,1],[1,1,1]],
    '1': [[0,1,0],[1,1,0],[0,1,0],[0,1,0],[0,1,0],[0,1,0],[1,1,1]],
    '2': [[1,1,1],[0,0,1],[0,0,1],[1,1,1],[1,0,0],[1,0,0],[1,1,1]],
    '3': [[1,1,1],[0,0,1],[0,0,1],[0,1,1],[0,0,1],[0,0,1],[1,1,1]],
    '4': [[1,0,1],[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1],[0,0,1]],
    '5': [[1,1,1],[1,0,0],[1,0,0],[1,1,1],[0,0,1],[0,0,1],[1,1,1]],
    '6': [[1,1,1],[1,0,0],[1,0,0],[1,1,1],[1,0,1],[1,0,1],[1,1,1]],
    '7': [[1,1,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1],[0,0,1]],
    '8': [[1,1,1],[1,0,1],[1,0,1],[1,1,1],[1,0,1],[1,0,1],[1,1,1]],
    '9': [[1,1,1],[1,0,1],[1,0,1],[1,1,1],[0,0,1],[0,0,1],[1,1,1]],
    ':': [[0],[0],[1],[0],[1],[0],[0]]
  };

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function buildFormation(timeStr) {
    const CW = 14, CH = 16;
    const chars = timeStr.split('');
    const widths = chars.map(c => (DIGITS[c] ? DIGITS[c][0].length * CW + 6 : 0));
    const totalW = widths.reduce((a, b) => a + b, 0);
    let ox = CANVAS_SIZE / 2 - totalW / 2;
    const startY = 88;
    const pts = [];
    for (let i = 0; i < chars.length; i++) {
      const grid = DIGITS[chars[i]];
      if (!grid) { ox += widths[i]; continue; }
      for (let r = 0; r < grid.length; r++) {
        for (let c = 0; c < grid[r].length; c++) {
          if (grid[r][c]) {
            pts.push({ x: ox + c * CW + CW / 2, y: startY + r * CH + CH / 2 });
          }
        }
      }
      ox += widths[i];
    }
    return pts;
  }

  let waveOff   = 0;
  let gulls     = [];
  let formation = [];
  let isForming = false;
  let progress  = 0;
  let holdTimer = null;

  // Footprint state
  let footprints = [];
  let lastSec    = -1;

  function initGulls() {
    gulls = [];
    for (let i = 0; i < GULL_N; i++) {
      gulls.push({
        x:     p.random(40, CANVAS_SIZE - 40),
        y:     p.random(15, OCEAN_H - 18),
        tx:    p.random(40, CANVAS_SIZE - 40),
        ty:    p.random(15, OCEAN_H - 18),
        speed: p.random(0.35, 0.85),
        size:  p.random(8, 17),
        flap:  p.random(0, p.TWO_PI)
      });
    }
  }

  function updateFormation() {
    const now = new Date();
    const ts  = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
    formation = buildFormation(ts);
    while (gulls.length < formation.length) {
      gulls.push({
        x: p.random(40, CANVAS_SIZE - 40), y: p.random(15, OCEAN_H - 18),
        tx: p.random(40, CANVAS_SIZE - 40), ty: p.random(15, OCEAN_H - 18),
        speed: p.random(0.35, 0.75), size: p.random(8, 16),
        flap: p.random(0, p.TWO_PI)
      });
    }
  }

  // Draw a three-toed seagull footprint
  function drawGullPrint(x, y, angle, sz) {
    p.push();
    p.translate(x, y);
    p.rotate(angle);
    p.fill(125, 95, 60, 165);
    p.noStroke();
    const s = sz * 5.5;

    // Middle toe
    p.push(); p.rotate(-0.05);
    p.rect(-s * 0.14, -s * 1.55, s * 0.28, s * 1.4, 2);
    p.triangle(0, -s * 1.55, -s * 0.28, -s * 2.05, s * 0.28, -s * 2.05);
    p.pop();

    // Left toe
    p.push(); p.rotate(-0.58);
    p.rect(-s * 0.12, -s * 1.3, s * 0.24, s * 1.2, 2);
    p.triangle(0, -s * 1.3, -s * 0.24, -s * 1.78, s * 0.2, -s * 1.78);
    p.pop();

    // Right toe
    p.push(); p.rotate(0.58);
    p.rect(-s * 0.12, -s * 1.3, s * 0.24, s * 1.2, 2);
    p.triangle(0, -s * 1.3, -s * 0.2, -s * 1.78, s * 0.24, -s * 1.78);
    p.pop();

    // Heel pad
    p.ellipse(0, 0, s * 0.72, s * 0.72);
    p.pop();
  }

  p.setup = function () {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(30);
    initGulls();
    updateFormation();
  };

  p.draw = function () {
    const now     = new Date();
    const mn      = now.getMinutes();
    const sc      = now.getSeconds();
    const cluster = mn / 59;

    // ---- Sky ----
    for (let y = 0; y < OCEAN_H; y++) {
      const t = y / OCEAN_H;
      p.stroke(p.lerp(160, 50, t), p.lerp(200, 120, t), p.lerp(240, 180, t));
      p.line(0, y, CANVAS_SIZE, y);
    }

    // ---- Ocean base ----
    waveOff += 0.018;
    p.noStroke();
    p.fill(30, 80, 155, 220);
    p.rect(0, OCEAN_H - 5, CANVAS_SIZE, 30);

    // ---- Layered waves ----
    for (let w = 0; w < 5; w++) {
      const baseY = OCEAN_H + w * 9;
      const alpha = 160 - w * 25;
      p.fill(70 + w * 12, 130 + w * 8, 200, alpha);
      p.noStroke();
      p.beginShape();
      for (let x = 0; x <= CANVAS_SIZE; x += 6) {
        const wy = baseY + p.sin(x * 0.028 + waveOff + w * 0.7) * 8;
        p.vertex(x, wy);
      }
      p.vertex(CANVAS_SIZE, CANVAS_SIZE);
      p.vertex(0, CANVAS_SIZE);
      p.endShape(p.CLOSE);
    }

    // ---- Beach ----
    p.noStroke();
    p.fill(215, 188, 145);
    p.rect(0, OCEAN_H + 18, CANVAS_SIZE, CANVAS_SIZE - OCEAN_H - 18);
    p.fill(195, 168, 125, 140);
    for (let i = 0; i < 220; i++) {
      p.ellipse(
        (i * 139.7) % CANVAS_SIZE,
        OCEAN_H + 20 + (i * 67.3) % (CANVAS_SIZE - OCEAN_H - 20),
        3, 2
      );
    }

    // ---- Add one footprint per second ----
    if (sc !== lastSec) {
      if (sc === 0) {
        footprints = []; // reset at top of each minute
      } else {
        footprints.push({
          x:     p.random(55, CANVAS_SIZE - 55),
          y:     p.random(OCEAN_H + 40, CANVAS_SIZE - 40),
          angle: p.random(-0.5, 0.5),
          sz:    p.random(0.7, 1.3)
        });
      }
      lastSec = sc;
    }

    // Draw all accumulated footprints
    for (const f of footprints) {
      drawGullPrint(f.x, f.y, f.angle, f.sz);
    }

    // ---- Formation press/release logic ----
    if (p.mouseIsPressed && p.mouseX > 0 && p.mouseX < CANVAS_SIZE &&
        p.mouseY > 0 && p.mouseY < CANVAS_SIZE) {
      if (!isForming) { isForming = true; progress = 0; holdTimer = null; updateFormation(); }
    } else if (!p.mouseIsPressed && isForming && progress > 0) {
      if (!holdTimer) holdTimer = p.frameCount;
      if (p.frameCount - holdTimer > 55) progress -= 0.04;
      if (progress <= 0) { isForming = false; progress = 0; holdTimer = null; }
    }
    if (isForming) {
      progress = p.min(progress + 0.028, 1);
      if (progress >= 1 && !holdTimer) holdTimer = p.frameCount;
    }

    // ---- Seagulls ----
    for (let i = 0; i < gulls.length; i++) {
      const g = gulls[i];
      if (!isForming) {
        const dx   = g.tx - g.x;
        const dy   = g.ty - g.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        if (dist < 15) {
          const spread = p.lerp(300, 70, cluster);
          const cx = CANVAS_SIZE / 2 + p.cos(i * 2.39) * spread * 0.55;
          const cy = OCEAN_H * 0.44  + p.sin(i * 1.73) * spread * 0.22;
          g.tx = p.constrain(cx + p.random(-spread * 0.55, spread * 0.55), 40, CANVAS_SIZE - 40);
          g.ty = p.constrain(cy + p.random(-28, 28), 18, OCEAN_H - 16);
        }
        g.x += (dx / dist) * g.speed;
        g.y += (dy / dist) * g.speed * 0.55;
        g.x  = p.constrain(g.x, 40, CANVAS_SIZE - 40);
        g.y  = p.constrain(g.y, 18, OCEAN_H - 16);
      }
      const ti = formation[i] || { x: CANVAS_SIZE / 2, y: OCEAN_H * 0.45 };
      const fx = isForming ? p.lerp(g.x, ti.x, progress) : g.x;
      const fy = isForming ? p.lerp(g.y, ti.y, progress) : g.y;
      g.flap += 0.09;
      const wing  = p.sin(g.flap) * 5.5;
      const alpha = isForming ? p.lerp(190, 255, progress) : 195;
      p.stroke(230, 242, 255, alpha);
      p.strokeWeight(isForming ? 2.2 : 1.5);
      p.noFill();
      p.beginShape();
      p.vertex(fx - g.size, fy - wing * 0.65);
      p.vertex(fx,          fy + wing * 0.35);
      p.vertex(fx + g.size, fy - wing * 0.65);
      p.endShape();
    }

    // ---- Labels ----
    p.noStroke(); p.fill(180, 210, 255, 190);
    p.textSize(10); p.textAlign(p.RIGHT); p.textStyle(p.NORMAL);
    p.text('Minute=' + pad2(mn) + ' · ' + (mn < 30 ? 'Scattered' : 'Clustered'),
           CANVAS_SIZE - 18, OCEAN_H - 10);

    p.noStroke(); p.fill(100, 70, 30, 185);
    p.textSize(10); p.textAlign(p.LEFT);
    p.text('footprints: ' + sc + 's · resets each minute', 18, CANVAS_SIZE - 14);

    drawLegend();

    p.noStroke(); p.fill(40, 80, 140, 150);
    p.textSize(11); p.textAlign(p.CENTER); p.textStyle(p.NORMAL);
    p.text('点击并按住 → 海鸥在空中拼出当前时间', CANVAS_SIZE / 2, CANVAS_SIZE - 2);

    // Draw frame
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(0, 0, p.width - 1, p.height - 1);
  };

  function drawLegend() {
    const bx = CANVAS_SIZE - 150, by = 18, bw = 133, bh = 58;
    p.fill(10, 30, 70, 170); p.noStroke();
    p.rect(bx, by, bw, bh, 6);
    p.noStroke(); p.fill(180, 210, 255, 210);
    p.textSize(9); p.textAlign(p.LEFT); p.textStyle(p.NORMAL);
    p.text('0 min – Scattered', bx + 8, by + 14);
    for (let i = 0; i < 6; i++) {
      const gx = bx + 14 + i * 18, gy = by + 28;
      p.stroke(220, 235, 255, 200); p.strokeWeight(1.2); p.noFill();
      p.beginShape();
      p.vertex(gx - 7, gy - 2); p.vertex(gx, gy + 2); p.vertex(gx + 7, gy - 2);
      p.endShape();
    }
    p.noStroke(); p.fill(180, 210, 255, 210);
    p.text('59 min – Clustered', bx + 8, by + 44);
    for (let i = 0; i < 6; i++) {
      const gx = bx + 48 + i * 12, gy = by + 56;
      p.stroke(220, 235, 255, 210); p.strokeWeight(1.2); p.noFill();
      p.beginShape();
      p.vertex(gx - 5, gy - 2); p.vertex(gx, gy + 2); p.vertex(gx + 5, gy - 2);
      p.endShape();
    }
  }

  p.mousePressed = function () {
    if (p.mouseX > 0 && p.mouseX < CANVAS_SIZE && p.mouseY > 0 && p.mouseY < CANVAS_SIZE) {
      isForming = true; progress = 0; holdTimer = null;
      updateFormation();
    }
  };

  p.mouseReleased = function () { holdTimer = null; };
  p.windowResized = function () { p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE); };
});