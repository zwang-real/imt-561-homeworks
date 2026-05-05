// Design choice: 5 wave layers with varying opacity and speed create
//               a sense of depth; waveOff advances each frame for motion

registerSketch('sk3', function (p) {
  const CANVAS_SIZE = 680;
  const OCEAN_H = CANVAS_SIZE / 3;

  let waveOff = 0;

  p.setup = function () {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(30);
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

    // Draw frame
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(0, 0, p.width - 1, p.height - 1);
  };

  p.windowResized = function () { p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE); };
});