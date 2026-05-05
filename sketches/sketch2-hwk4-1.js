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
    p.createCanvas(800, 800);
    p.frameRate(60);
    p.textFont('Arial, Helvetica, sans-serif');
    
    let cx = p.width / 2;
    let cy = p.height / 2;

    // Repositioning UI to be centered under the watch
    paceSlider = p.createSlider(3, 10, 5, 0.1);
    paceSlider.position(cx - 160, cy + 320); 
    paceSlider.size(140);

    // Start/Pause Button
    toggleButton = p.createButton('▶  Start');
    toggleButton.position(cx + 20, cy + 315);
    toggleButton.style('background', '#1a1a18');
    toggleButton.style('color', '#fafaf7');
    toggleButton.style('padding', '8px 20px');
    toggleButton.style('border-radius', '6px');
    toggleButton.style('cursor', 'pointer');
    toggleButton.mousePressed(toggleRun);
  };
  
p.draw = function () {
    // 1. INITIALIZE COORDINATES FIRST
    // Define these at the top so the 'running' block can access them
    let cx = p.width / 2;
    let cy = p.height / 2;
    let dialCy = cy + DIAL_CY_OFF;

    // 2. SIMULATION LOGIC
    if (running) {
      elapsedMs = p.millis() - startMs;
      const dt = p.deltaTime / 1000; 
      
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

    // 3. RENDER LAYERS (Order: Bottom to Top)
    p.background(COL.bg); 
    
    drawBackground(cx, cy);
    drawWatchBand(cx, cy);
    drawWatchCase(cx, cy);
    drawScreen(cx, cy);
    
    // Always draw these so the watch face isn't empty when paused
    drawClockTime(cx, dialCy - 44);
    drawPanels(cx, cy, dialCy); 
    drawSliderLabel(cx - 160, cy + 310);

    // 4. DIAL AND HANDS
    const elSec = elapsedMs / 1000;
    const expDist = (running || elapsedMs > 0) ? (elSec / (targetPace * 60)) % 1.0 : 0;
    const actualAngle = angForDist(lapDist);
    const targetAngle = angForDist(expDist);

    drawDial(cx, dialCy);

    // Clip and draw dynamic hands
    p.drawingContext.save();
    p.drawingContext.beginPath();
    rrPath(cx - CW + PAD, cy - CH + PAD, (CW - PAD) * 2, (CH - PAD) * 2, 26);
    p.drawingContext.clip();
    
    drawHand(cx, dialCy, actualAngle, DIAL_R - 12, [220, 80, 30], 4.0);
    drawHand(cx, dialCy, targetAngle, DIAL_R - 12, [30, 120, 220], 2.2);
    
    p.fill(COL.text);
    p.noStroke();
    p.circle(cx, dialCy, 9);
    p.drawingContext.restore();
  };

  // ---  New Helper Functions ---
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
  /**
   * Draws the circular watch dial with ticks and distance labels
   */
  function drawDial(cx, cy) {
    const R = DIAL_R;
    p.drawingContext.save();
    
    // Track ring
    p.noFill();
    p.stroke('rgba(0,0,0,0.07)');
    p.strokeWeight(5);
    p.circle(cx, cy, (R - 4) * 2);

    // Major and Minor Ticks
    for (let i = 0; i < 40; i++) {
      const ang = -p.HALF_PI + (i / 40) * p.TWO_PI;
      const isMajor = i % 10 === 0;
      const r1 = R - (isMajor ? 20 : 11);
      const r2 = R - 2;
      
      p.stroke(isMajor ? 'rgba(30,30,30,0.65)' : 'rgba(30,30,30,0.22)');
      p.strokeWeight(isMajor ? 2 : 1);
      p.line(cx + p.cos(ang) * r1, cy + p.sin(ang) * r1, 
             cx + p.cos(ang) * r2, cy + p.sin(ang) * r2);
    }

    // Distance Labels (Visual cues for the runner)
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(9);
    p.fill(COL.textMid);
    p.text('0 km', cx, cy - R + 32);
    p.fill(COL.labelFaint);
    p.text('0.5 km', cx, cy + R - 32);
    
    p.drawingContext.restore();
  }

  /**
   * Utility to map distance (0.0 - 1.0) to a rotation angle in radians
   */
  function angForDist(d) {
    // Starts at -90 degrees (top of the clock)
    return -p.HALF_PI + (d / 1.0) * p.TWO_PI;
  }

  /**
   * Draws a watch hand given an angle and length
   */
  function drawHand(cx, cy, ang, len, rgb, sw) {
    const ex = cx + p.cos(ang) * len;
    const ey = cy + p.sin(ang) * len;
    
    p.stroke(rgb[0], rgb[1], rgb[2]);
    p.strokeWeight(sw);
    p.strokeCap(p.ROUND);
    p.line(cx, cy, ex, ey);
    
    // Small counter-weight on the opposite side
    const tx = cx + p.cos(ang + p.PI) * 13;
    const ty = cy + p.sin(ang + p.PI) * 13;
    p.strokeWeight(sw * 0.5);
    p.line(cx, cy, tx, ty);
  }

  /**
   * Draws the 4 rows of data panels below the dial
   */
  function drawPanels(cx, cy, dialCy) {
    const innerW = (CW - PAD) * 2;
    const pw = innerW - 16; // panel width
    const px = cx - pw / 2;
    const PANEL_GAP = 6;
    const PH = 24; // panel height
    const PGAP = 5; // panel gap
    const top = dialCy + DIAL_R + PANEL_GAP;

    // Row 1: Actual vs Target Pace
    const apM = p.floor(actualPace);
    const apS = p.nf(p.round((actualPace % 1) * 60), 2);
    const tpM = p.floor(targetPace);
    const tpS = p.nf(p.round((targetPace % 1) * 60), 2);

    drawPanel(px, top, pw, PH, '● ACTUAL', `${apM}:${apS}`, '○ TARGET', `${tpM}:${tpS}`, [220, 80, 30]);

    // Row 2: Heart Rate & Lap Distance
    const hrColor = heartRate > 150 ? 'rgba(220,50,50,0.3)' : 'rgba(60,160,100,0.2)';
    drawPanel(px, top + PH + PGAP, pw, PH, '♥ HEART', `${heartRate} bpm`, 'LAP DIST', `${p.nf(lapDist, 1, 2)} km`, hrColor);

    // Row 3: Current Lap & Total Distance
    drawPanel(px, top + (PH + PGAP) * 2, pw, PH, 'LAP', `${lapCount}`, 'TOTAL', `${p.nf(totalDist, 1, 2)} km`, 'rgba(0,0,0,0.1)');

    // Row 4: Elapsed Time
    drawPanel(px, top + (PH + PGAP) * 3, pw, PH, 'ELAPSED', fmtTime(elapsedMs), null, null, 'rgba(30,120,220,0.2)');
  }

  /**
   * Reusable component for a data panel row
   */
  function drawPanel(x, y, w, h, lLab, lVal, rLab, rVal, accent) {
    p.fill('rgba(0,0,0,0.03)');
    p.stroke(accent);
    p.strokeWeight(1);
    p.rectMode(p.CORNER); // Ensure rect draws from corner for panels
    p.rect(x, y, w, h, 5);

    p.noStroke();
    p.textSize(7);
    p.fill(COL.labelFaint);
    p.textAlign(p.LEFT, p.TOP);
    p.text(lLab, x + 8, y + 4);

    p.textSize(11);
    p.fill(COL.text);
    p.textStyle(p.BOLD);
    p.text(lVal, x + 8, y + h - 4);

    if (rLab) {
      p.textSize(7);
      p.fill(COL.labelFaint);
      p.textAlign(p.RIGHT, p.TOP);
      p.text(rLab, x + w - 8, y + 4);
      p.textSize(11);
      p.fill(COL.text);
      p.text(rVal, x + w - 8, y + h - 4);
    }
    p.textStyle(p.NORMAL);
  }

  function fmtTime(ms) {
    const s = p.floor(ms / 1000);
    const m = p.floor(s / 60);
    const sec = s % 60;
    return p.nf(m, 2) + ':' + p.nf(sec, 2);
  }
});