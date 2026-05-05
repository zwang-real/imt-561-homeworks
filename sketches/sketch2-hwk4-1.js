// Instance-mode sketch for HWK 4 - Clock 1 (Running Watch)
registerSketch('sk2', function (p) {
  // --- 1. Simulation State -----------------
  let running = false;
  let startMs = 0;
  let elapsedMs = 0;
  let totalDist = 0;
  let lapDist = 0;
  let lapCount = 1;
  let heartRate = 72;
  let hrPhase = 0;
  let actualPace = 8.0;
  let targetPace = 5.0;

  let paceSlider;
  let toggleButton;
  // ---------- 2. Layout Constants ----------
  const W = 380;
  const H = 600;
  const CW = 148;   // Case half-width
  const CH = 200;   // Case half-height
  const PAD = 13;   // Screen inset
  const DIAL_R = 118; 
  const DIAL_CY_OFF = -(CH - PAD) + 10 + DIAL_R; 

  // ---------- 3. Color Palette ----------
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

  // ---  Initialize UI Elements ---
    // Target Pace Slider (3 to 10 min/km)
    paceSlider = p.createSlider(3, 10, 5, 0.1);
    paceSlider.position(p.width / 2 - 190, p.height / 2 + 320);
    paceSlider.size(200);

    // Start/Pause Button
    toggleButton = p.createButton('▶  Start');
    toggleButton.position(p.width / 2 + 40, p.height / 2 + 315);
    toggleButton.style('background', '#1a1a18');
    toggleButton.style('color', '#fafaf7');
    toggleButton.style('padding', '8px 20px');
    toggleButton.style('border-radius', '6px');
    toggleButton.style('cursor', 'pointer');
    toggleButton.mousePressed(toggleRun);
  };

  p.draw = function () {
    // --- 3. Simulation Logic (Updates every frame) ---
    if (running) {
      elapsedMs = p.millis() - startMs;
      const dt = p.deltaTime / 1000; // time change in seconds
      
      targetPace = paceSlider.value();
      // Smoothly transition actual pace toward target
      actualPace = p.lerp(actualPace, targetPace + p.sin(elapsedMs / 8000) * 0.35, 0.005);

      const speedKmS = 1 / (actualPace * 60);
      totalDist += speedKmS * dt;
      lapDist = totalDist % 1.0;
      lapCount = p.floor(totalDist) + 1;

      // Simulate heart rate based on pace
      hrPhase += dt * 0.3;
      const baseHR = 60 + (10 - actualPace) * 12;
      heartRate = p.constrain(p.round(baseHR + p.sin(hrPhase) * 4), 60, 195);
    }

    // --- 4. Render Layers ---
    p.background(COL.bg); 
    let cx = p.width / 2;
    let cy = p.height / 2;
    let dialCy = cy + DIAL_CY_OFF;

    drawBackground(cx, cy);
    drawWatchBand(cx, cy);
    drawWatchCase(cx, cy);
    drawScreen(cx, cy);
    drawClockTime(cx, dialCy - 44);

    // Add a label for the slider
    drawSliderLabel(cx - 190, cy + 310);
  };

  // --- 5. New Helper Functions ---
  function toggleRun() {
    running = !running;
    if (running) {
      startMs = p.millis() - elapsedMs;
      toggleButton.html('⏸  Pause');
    } else {
      toggleButton.html('▶  Start');
    }
  }

  function drawSliderLabel(x, y) {
    p.fill(COL.textMid);
    p.noStroke();
    p.textSize(12);
    p.textAlign(p.LEFT, p.CENTER);
    const m = p.floor(paceSlider.value());
    const s = p.nf(p.round((paceSlider.value() - m) * 60), 2);
    p.text(`Target pace: ${m}:${s} /km`, x, y);
  }


  // ---------- HELPER FUNCTIONS (The "Definitions") ----------


  function drawClockTime(x, y) {
    const hh = p.nf(p.hour(), 2);
    const mm = p.nf(p.minute(), 2);
    const ss = p.nf(p.second(), 2);

    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);

    p.fill(COL.labelFaint);
    p.textSize(8);
    p.textStyle(p.NORMAL);
    p.text('TIME OF DAY', x, y - 13);

    p.fill(COL.text);
    p.textSize(24);
    p.textStyle(p.BOLD);
    p.text(`${hh}:${mm}`, x, y + 4);

    p.fill(COL.labelFaint);
    p.textSize(10);
    p.textStyle(p.NORMAL);
    p.text(ss, x, y + 21);
    
    p.textStyle(p.NORMAL); 
  }

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