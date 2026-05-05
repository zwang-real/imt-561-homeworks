// Design choice: establish 680x680 canvas with a gradient sky
//               that fades from light blue at top to deeper blue at horizon

registerSketch('sk3', function (p) {
  const CANVAS_SIZE = 680;
  const OCEAN_H = CANVAS_SIZE / 3;

  p.setup = function () {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.frameRate(30);
  };

  p.draw = function () {
    // Sky gradient: draw line by line from top to horizon
    for (let y = 0; y < OCEAN_H; y++) {
      const t = y / OCEAN_H;
      p.stroke(p.lerp(160, 50, t), p.lerp(200, 120, t), p.lerp(240, 180, t));
      p.line(0, y, CANVAS_SIZE, y);
    }

    // Draw frame
    p.noFill();
    p.stroke(0);
    p.strokeWeight(1);
    p.rect(0, 0, p.width - 1, p.height - 1);
  };

  p.windowResized = function () { p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE); };
});