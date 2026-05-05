// Design choice: each gull steers toward a random target in the sky zone;
//               M-shape wing drawn with beginShape encodes flapping via sin()

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

    // ---- Seagulls: wander toward random targets ----
    for (let i = 0; i < gulls.length; i++) {
      const g  = gulls[i];
      const dx = g.tx - g.x;
      const dy = g.ty - g.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      // Pick a new random target when close enough
      if (dist < 15) {
        g.tx = p.random(40, CANVAS_SIZE - 40);
        g.ty = p.random(15, OCEAN_H - 16);
      }

      g.x += (dx / dist) * g.speed;
      g.y += (dy / dist) * g.speed * 0.55;
      g.x  = p.constrain(g.x, 40, CANVAS_SIZE - 40);
      g.y  = p.constrain(g.y, 18, OCEAN_H - 16);

      // Draw M-shape wing
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

    // Draw frame
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(0, 0, p.width - 1, p.height - 1);
  };

  p.windowResized = function () { p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE); };
});