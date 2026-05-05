// Design choice: minute (0-59) linearly maps to flock spread (300→70px),
//               making the passage of each hour visible as a slow gathering

registerSketch('sk3', function (p) {
  const CANVAS_SIZE = 680;
  const OCEAN_H = CANVAS_SIZE / 3;
  const GULL_N  = 38;

  let waveOff = 0;
  let gulls   = [];

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

  p.setup = function () {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(30);
    initGulls();
  };

  p.draw = function () {
    const now     = new Date();
    const mn      = now.getMinutes();
    const cluster = mn / 59; // 0 = fully scattered, 1 = fully clustered

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

    // ---- Seagulls: minute-based clustering ----
    for (let i = 0; i < gulls.length; i++) {
      const g  = gulls[i];
      const dx = g.tx - g.x;
      const dy = g.ty - g.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      if (dist < 15) {
        // Spread shrinks as minute increases (scattered → clustered)
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

      g.flap += 0.09;
      const wing = p.sin(g.flap) * 5.5;
      p.stroke(230, 242, 255, 195);
      p.strokeWeight(1.5);
      p.noFill();
      p.beginShape();
      p.vertex(g.x - g.size, g.y - wing * 0.65);
      p.vertex(g.x,          g.y + wing * 0.35);
      p.vertex(g.x + g.size, g.y - wing * 0.65);
      p.endShape();
    }

    // ---- Minute label ----
    p.noStroke();
    p.fill(180, 210, 255, 190);
    p.textSize(10);
    p.textAlign(p.RIGHT);
    p.textStyle(p.NORMAL);
    p.text('Minute=' + (mn < 10 ? '0' + mn : mn) + ' · ' + (mn < 30 ? 'Scattered' : 'Clustered'),
           CANVAS_SIZE - 18, OCEAN_H - 10);

    // ---- Legend panel (top-right) ----
    drawLegend();

    // Draw frame
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(0, 0, p.width - 1, p.height - 1);
  };

  function drawLegend() {
    const bx = CANVAS_SIZE - 150, by = 18, bw = 133, bh = 58;
    p.fill(10, 30, 70, 170);
    p.noStroke();
    p.rect(bx, by, bw, bh, 6);
    p.noStroke();
    p.fill(180, 210, 255, 210);
    p.textSize(9);
    p.textAlign(p.LEFT);
    p.textStyle(p.NORMAL);
    p.text('0 min – Scattered', bx + 8, by + 14);
    for (let i = 0; i < 6; i++) {
      const gx = bx + 14 + i * 18, gy = by + 28;
      p.stroke(220, 235, 255, 200);
      p.strokeWeight(1.2);
      p.noFill();
      p.beginShape();
      p.vertex(gx - 7, gy - 2);
      p.vertex(gx,     gy + 2);
      p.vertex(gx + 7, gy - 2);
      p.endShape();
    }
    p.noStroke();
    p.fill(180, 210, 255, 210);
    p.text('59 min – Clustered', bx + 8, by + 44);
    for (let i = 0; i < 6; i++) {
      const gx = bx + 48 + i * 12, gy = by + 56;
      p.stroke(220, 235, 255, 210);
      p.strokeWeight(1.2);
      p.noFill();
      p.beginShape();
      p.vertex(gx - 5, gy - 2);
      p.vertex(gx,     gy + 2);
      p.vertex(gx + 5, gy - 2);
      p.endShape();
    }
  }

  p.windowResized = function () { p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE); };
});