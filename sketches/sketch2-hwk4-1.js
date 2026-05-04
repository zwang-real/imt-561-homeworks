// Instance-mode sketch for HWK 4 - Clock 1 (Running Watch)
registerSketch('sk2', function (p) {
  // ---------- 1. Layout Constants ----------
  const W = 380;
  const H = 600;
  const CW = 148;   // Case half-width
  const CH = 200;   // Case half-height
  const PAD = 13;   // Screen inset
  const DIAL_R = 118; 
  const DIAL_CY_OFF = -(CH - PAD) + 10 + DIAL_R; 

  // ---------- 2. Color Palette ----------
  const COL = {
    bg: '#f0f0ec',
    bgInner: '#e4e4de',
    band: '#bbb8b0',
    bandStroke: '#9e9b94',
    caseGrad: ['#dedad2', '#c8c5bd', '#b6b3ac'],
    caseStroke: '#aeaba4',
    screen: '#fafaf7',
    screenStroke: '#c8c5be',
    text: '#1a1a18',
    textMid: '#444440',
    labelFaint: '#aaa9a0'
  };

  p.setup = function () {
    // Creating an 800x800 canvas as per assignment limits
    p.createCanvas(800, 800);
    p.frameRate(60);
    p.textFont('Arial, Helvetica, sans-serif');
  };

  // Inside the registerSketch('sk2', function (p) { ... })

  p.draw = function () {
    p.background(COL.bg); 
    
    let cx = p.width / 2;
    let cy = p.height / 2;

    // 1. Draw Background Effect
    drawBackground(cx, cy);
    
    // 2. Draw Watch Hardware
    drawWatchBand(cx, cy);
    drawWatchCase(cx, cy);
    drawScreen(cx, cy);
  };

  // --- Background with radial-like effect ---
  function drawBackground(cx, cy) {
    p.noStroke();
    for (let r = 800; r > 0; r -= 8) {
      const t = r / 800;
      p.fill(p.lerpColor(p.color(COL.bgInner), p.color(COL.bg), t));
      p.ellipse(cx, cy, r * 1.3, r);
    }
  }

  // --- The Watch Band (Straps) ---
  function drawWatchBand(cx, cy) {
    const bw = 86; // band width
    const bx = cx - bw / 2;
    const rh = CH;

    p.drawingContext.shadowColor = 'rgba(0,0,0,0.14)';
    p.drawingContext.shadowBlur = 10;
    p.drawingContext.shadowOffsetY = 3;

    p.fill(COL.band);
    p.stroke(COL.bandStroke);
    p.strokeWeight(1.2);

    // Top Band
    p.beginShape();
    p.vertex(bx + 10, 0);
    p.vertex(bx + bw - 10, 0);
    p.vertex(bx + bw, 10);
    p.vertex(bx + bw, cy - rh + 18);
    p.vertex(bx, cy - rh + 18);
    p.vertex(bx, 10);
    p.endShape(p.CLOSE);

    // Bottom Band
    p.beginShape();
    p.vertex(bx, cy + rh - 18);
    p.vertex(bx + bw, cy + rh - 18);
    p.vertex(bx + bw, p.height - 10);
    p.vertex(bx + bw - 10, p.height);
    p.vertex(bx + 10, p.height);
    p.vertex(bx, p.height - 10);
    p.endShape(p.CLOSE);

    p.drawingContext.shadowColor = 'transparent';
  }

  // --- The Metallic Case ---
  function drawWatchCase(cx, cy) {
    p.drawingContext.shadowColor = 'rgba(0,0,0,0.20)';
    p.drawingContext.shadowBlur = 20;
    p.drawingContext.shadowOffsetY = 5;

    // Create linear gradient for metal look
    const g = p.drawingContext.createLinearGradient(cx - CW, cy - CH, cx + CW, cy + CH);
    g.addColorStop(0, COL.caseGrad[0]);
    g.addColorStop(0.5, COL.caseGrad[1]);
    g.addColorStop(1, COL.caseGrad[2]);

    p.drawingContext.fillStyle = g;
    p.drawingContext.strokeStyle = COL.caseStroke;
    p.drawingContext.lineWidth = 2;
    
    p.drawingContext.beginPath();
    rrPath(cx - CW, cy - CH, CW * 2, CH * 2, 40);
    p.drawingContext.fill();
    p.drawingContext.stroke();
    p.drawingContext.shadowColor = 'transparent';
  }

  // --- The Glass Screen ---
  function drawScreen(cx, cy) {
    p.drawingContext.fillStyle = COL.screen;
    p.drawingContext.strokeStyle = COL.screenStroke;
    p.drawingContext.lineWidth = 1.5;
    p.drawingContext.beginPath();
    rrPath(cx - CW + PAD, cy - CH + PAD, (CW - PAD) * 2, (CH - PAD) * 2, 28);
    p.drawingContext.fill();
    p.drawingContext.stroke();
  }

  // --- Helper: Rounded Rectangle Path ---
  function rrPath(x, y, w, h, r) {
    const dc = p.drawingContext;
    dc.moveTo(x + r, y);
    dc.lineTo(x + w - r, y);
    dc.quadraticCurveTo(x + w, y, x + w, y + r);
    dc.lineTo(x + w, y + h - r);
    dc.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    dc.lineTo(x + r, y + h);
    dc.quadraticCurveTo(x, y + h, x, y + h - r);
    dc.lineTo(x, y + r);
    dc.quadraticCurveTo(x, y, x + r, y);
    dc.closePath();
  }
});