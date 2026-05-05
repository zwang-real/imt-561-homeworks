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

  // ---------- 2. Layout Constants (v5) ----------
  const W   = 380;
  const H   = 600;
  const CW  = 148;   // Case half-width
  const CH  = 200;   // Case half-height
  const PAD = 13;    // Screen inset
  const DIAL_R = 106;
  const GAP    = 10;
  const PH     = 24;
  const PGAP   = 4;
  const DIAL_DY      = -(CH - PAD) + 8 + DIAL_R;   // = -73
  const PANEL_TOP_DY = DIAL_DY + DIAL_R + GAP;       // = 43

  // ---------- 3. Color Palette (v5) ----------
  const COL = {
    bg:           '#f0f0ec',
    bgInner:      '#e4e4de',
    band:         '#bbb8b0',
    bandStroke:   '#9e9b94',
    caseGrad:     ['#dedad2', '#c8c5bd', '#b6b3ac'],
    caseStroke:   '#aeaba4',
    screen:       '#fafaf7',
    screenStroke: '#c8c5be',
    dialTrack:    'rgba(0,0,0,0.07)',
    tickMajor:    'rgba(30,30,30,0.60)',
    tickMinor:    'rgba(30,30,30,0.20)',
    labelFaint:   '#aaa9a0',
    textMid:      '#444440',
    text:         '#1a1a18',
    handActual:   [220, 80,  30],
    handTarget:   [30,  120, 220],
    sectorTarget: 'rgba(30,120,220,0.12)',
    sectorActual: 'rgba(220,80,30,0.14)',
    panelBg:      'rgba(0,0,0,0.035)',
    accentActual: 'rgba(220,80,30,0.22)',
    accentTarget: 'rgba(30,120,220,0.18)',
    accentHR:     'rgba(60,160,100,0.22)',
    accentHRHigh: 'rgba(220,50,50,0.28)',
    accentNeutral:'rgba(80,80,80,0.12)',
  };

  p.setup = function () {
    p.createCanvas(800, 800);
    p.frameRate(60);
    p.textFont('Arial, Helvetica, sans-serif');

    let cx = p.width / 2;
    let cy = p.height / 2;

    paceSlider = p.createSlider(3, 10, 5, 0.1);
    paceSlider.position(cx - 160, cy + 320);
    paceSlider.size(180);
    paceSlider.style('accent-color', '#dc5020');

    toggleButton = p.createButton('▶  Start');
    toggleButton.position(cx + 60, cy + 315);
    toggleButton.style('background', '#1a1a18');
    toggleButton.style('color', '#fafaf7');
    toggleButton.style('border', 'none');
    toggleButton.style('padding', '8px 20px');
    toggleButton.style('border-radius', '6px');
    toggleButton.style('cursor', 'pointer');
    toggleButton.style('font-weight', '600');
    toggleButton.style('font-family', 'Arial, sans-serif');
    toggleButton.style('font-size', '13px');
    toggleButton.mousePressed(toggleRun);
  };

  p.draw = function () {
    let cx = p.width / 2;
    let cy = p.height / 2;
    let dialCy = cy + DIAL_DY;

    if (running) {
      elapsedMs = p.millis() - startMs;
      const dt = p.deltaTime / 1000;
      targetPace = paceSlider.value();
      actualPace = p.lerp(actualPace, targetPace + p.sin(elapsedMs / 8000) * 0.35, 0.005);
      totalDist += (1 / (actualPace * 60)) * dt;
      lapDist = totalDist % 1.0;
      lapCount = p.floor(totalDist) + 1;
      hrPhase += dt * 0.3;
      heartRate = p.constrain(p.round(60 + (10 - actualPace) * 12 + p.sin(hrPhase) * 4), 60, 195);
    }

    const elSec   = elapsedMs / 1000;
    const expDist = (running || elapsedMs > 0) ? (elSec / (targetPace * 60)) % 1.0 : 0;
    const aAng = angForDist(lapDist);
    const tAng = angForDist(expDist);

    p.drawingContext.shadowColor = 'transparent';
    drawBg(cx, cy);
    drawBand(cx, cy);
    drawCase(cx, cy);
    drawScreen(cx, cy);
    drawDial(cx, dialCy, aAng, tAng);

    // Hands + center dot clipped to screen
    p.drawingContext.save();
    p.drawingContext.beginPath();
    rrPath(cx - CW + PAD, cy - CH + PAD, (CW - PAD) * 2, (CH - PAD) * 2, 26);
    p.drawingContext.clip();
    p.drawingContext.shadowColor = 'transparent';
    drawHand(cx, dialCy, aAng, DIAL_R - 11, COL.handActual, 4.0);  // thick, bottom
    drawHand(cx, dialCy, tAng, DIAL_R - 11, COL.handTarget, 2.2);  // thin, top
    p.fill(COL.text); p.noStroke(); p.circle(cx, dialCy, 9);
    p.drawingContext.restore();

    drawPanels(cx, cy);
    drawSliderLabel(cx, cy);
  };

  // ---  Helper Functions ---
  function toggleRun() {
    running = !running;
    if (running) {
      startMs = p.millis() - elapsedMs;
      toggleButton.html('⏸  Pause');
    } else {
      toggleButton.html('▶  Start');
    }
  }

  function drawSliderLabel(cx, cy) {
    const tp = paceSlider.value(), m = p.floor(tp), s = p.nf(p.round((tp % 1) * 60), 2);
    p.drawingContext.shadowColor = 'transparent';
    p.fill(COL.textMid); p.noStroke();
    p.textFont('Arial,Helvetica,sans-serif'); p.textSize(12); p.textStyle(p.NORMAL);
    p.textAlign(p.LEFT, p.CENTER);
    p.text(`Target pace:  ${m}:${s} /km`, cx - 160, cy + 335);
  }

  // ---------- DRAWING HELPERS ----------

  function drawBg(cx, cy) {
    p.background(COL.bg);
    p.noStroke();
    for (let r = p.max(W, H); r > 0; r -= 8) {
      p.fill(p.lerpColor(p.color(COL.bgInner), p.color(COL.bg), r / p.max(W, H)));
      p.ellipse(cx, cy, r * 1.3, r);
    }
  }

  function drawBand(cx, cy) {
    const bw = 86, bx = cx - 43, rh = CH;
    p.drawingContext.shadowColor = 'rgba(0,0,0,0.14)';
    p.drawingContext.shadowBlur = 10; p.drawingContext.shadowOffsetY = 3;
    p.fill(COL.band); p.stroke(COL.bandStroke); p.strokeWeight(1.2);
    p.beginShape();
      p.vertex(bx + 10, cy - p.height/2); p.vertex(bx + bw - 10, cy - p.height/2);
      p.vertex(bx + bw, cy - p.height/2 + 10);
      p.vertex(bx + bw, cy - rh + 18); p.vertex(bx, cy - rh + 18);
      p.vertex(bx, cy - p.height/2 + 10);
    p.endShape(p.CLOSE);
    p.beginShape();
      p.vertex(bx, cy + rh - 18); p.vertex(bx + bw, cy + rh - 18);
      p.vertex(bx + bw, cy + p.height/2 - 10);
      p.vertex(bx + bw - 10, cy + p.height/2); p.vertex(bx + 10, cy + p.height/2);
      p.vertex(bx, cy + p.height/2 - 10);
    p.endShape(p.CLOSE);
    p.noFill(); p.stroke(COL.bandStroke); p.strokeWeight(0.7);
    for (let i = 1; i <= 3; i++) {
      const ty = (cy - p.height/2 + 10) + (cy - rh + 18 - (cy - p.height/2 + 10)) * (i / 4);
      p.line(bx + 8, ty, bx + bw - 8, ty);
      const by = (cy + rh - 18) + (cy + p.height/2 - 10 - (cy + rh - 18)) * (i / 4);
      p.line(bx + 8, by, bx + bw - 8, by);
    }
    p.drawingContext.shadowColor = 'transparent';
  }

  function drawCase(cx, cy) {
    p.drawingContext.shadowColor = 'rgba(0,0,0,0.20)';
    p.drawingContext.shadowBlur = 20; p.drawingContext.shadowOffsetY = 5;
    const g = p.drawingContext.createLinearGradient(cx - CW, cy - CH, cx + CW, cy + CH);
    g.addColorStop(0, COL.caseGrad[0]); g.addColorStop(0.5, COL.caseGrad[1]); g.addColorStop(1, COL.caseGrad[2]);
    p.drawingContext.fillStyle = g; p.drawingContext.strokeStyle = COL.caseStroke; p.drawingContext.lineWidth = 2;
    p.drawingContext.beginPath(); rrPath(cx - CW, cy - CH, CW * 2, CH * 2, 40);
    p.drawingContext.fill(); p.drawingContext.stroke();
    p.drawingContext.shadowColor = 'transparent';
  }

  function drawScreen(cx, cy) {
    p.drawingContext.shadowColor = 'transparent';
    p.drawingContext.fillStyle = COL.screen; p.drawingContext.strokeStyle = COL.screenStroke; p.drawingContext.lineWidth = 1.5;
    p.drawingContext.beginPath(); rrPath(cx - CW + PAD, cy - CH + PAD, (CW - PAD) * 2, (CH - PAD) * 2, 28);
    p.drawingContext.fill(); p.drawingContext.stroke();
  }

  function drawDial(cx, cy, aAng, tAng) {
    const R = DIAL_R;
    const hcy = p.height / 2;

    p.drawingContext.save();
    p.drawingContext.beginPath();
    rrPath(cx - CW + PAD, hcy - CH + PAD, (CW - PAD) * 2, (CH - PAD) * 2, 28);
    p.drawingContext.clip();
    p.drawingContext.shadowColor = 'transparent';

    // dial bg
    p.fill(COL.screen); p.noStroke(); p.circle(cx, cy, R * 2 + 4);

    // sector shading
    const aN = ((aAng + p.HALF_PI) % p.TWO_PI + p.TWO_PI) % p.TWO_PI;
    const tN = ((tAng + p.HALF_PI) % p.TWO_PI + p.TWO_PI) % p.TWO_PI;
    if (p.abs(aN - tN) > 0.002) {
      if (tN > aN) drawSector(cx, cy, R - 4, aAng, tAng, COL.sectorTarget);
      else         drawSector(cx, cy, R - 4, tAng, aAng, COL.sectorActual);
    }

    // track ring
    p.noFill(); p.stroke(COL.dialTrack); p.strokeWeight(5);
    p.circle(cx, cy, (R - 4) * 2);

    // ticks
    for (let i = 0; i < 40; i++) {
      const ang = -p.HALF_PI + (i / 40) * p.TWO_PI;
      const maj = i % 10 === 0;
      p.stroke(maj ? COL.tickMajor : COL.tickMinor); p.strokeWeight(maj ? 2 : 1);
      p.line(cx + p.cos(ang) * (R - (maj ? 20 : 11)), cy + p.sin(ang) * (R - (maj ? 20 : 11)),
             cx + p.cos(ang) * (R - 2),               cy + p.sin(ang) * (R - 2));
    }

    // distance labels
    p.noStroke(); p.textFont('Arial,Helvetica,sans-serif'); p.textAlign(p.CENTER, p.CENTER); p.textStyle(p.NORMAL);
    const LR = R - 30;
    [{txt:'0 km',a:-p.HALF_PI,big:true},{txt:'0.25',a:0,big:false},
     {txt:'0.5 km',a:p.HALF_PI,big:true},{txt:'0.75',a:p.PI,big:false}].forEach(({txt,a,big}) => {
      p.fill(big ? COL.textMid : COL.labelFaint); p.textSize(big ? 10 : 8);
      p.text(txt, cx + p.cos(a) * LR, cy + p.sin(a) * LR);
    });

    drawClockTime(cx, cy - 42);

    // center dot placeholder
    p.fill(COL.text); p.noStroke(); p.circle(cx, cy, 9);
    p.drawingContext.restore();
  }

  function drawSector(cx, cy, r, startA, endA, col) {
    let ea = endA; if (ea <= startA) ea += p.TWO_PI;
    const dc = p.drawingContext;
    dc.beginPath(); dc.moveTo(cx, cy); dc.arc(cx, cy, r, startA, ea, false); dc.closePath();
    dc.fillStyle = col; dc.shadowColor = 'transparent'; dc.fill();
  }

  function drawClockTime(x, y) {
    const now = new Date();
    const hh = p.nf(now.getHours(), 2), mm = p.nf(now.getMinutes(), 2), ss = p.nf(now.getSeconds(), 2);
    p.drawingContext.shadowColor = 'transparent';
    p.noStroke(); p.textFont('Arial,Helvetica,sans-serif'); p.textAlign(p.CENTER, p.CENTER);
    p.fill(COL.labelFaint); p.textSize(7.5); p.textStyle(p.NORMAL); p.text('TIME OF DAY', x, y - 13);
    p.fill(COL.text); p.textSize(21); p.textStyle(p.BOLD); p.text(`${hh}:${mm}`, x, y + 4);
    p.fill(COL.labelFaint); p.textSize(9); p.textStyle(p.NORMAL); p.text(ss, x, y + 20);
    p.textStyle(p.NORMAL);
  }

  function drawHand(cx, cy, ang, len, rgb, sw) {
    p.drawingContext.shadowColor = 'transparent';
    p.stroke(rgb[0], rgb[1], rgb[2]); p.strokeWeight(sw); p.strokeCap(p.ROUND);
    p.line(cx, cy, cx + p.cos(ang) * len, cy + p.sin(ang) * len);
    // counter-hand tail (v5 style)
    p.strokeWeight(sw * 0.5);
    p.line(cx, cy, cx + p.cos(ang + p.PI) * 13, cy + p.sin(ang + p.PI) * 13);
  }

  function drawPanels(cx, cy) {
    p.drawingContext.shadowColor = 'transparent';

    const pw  = (CW - PAD) * 2 - 16;  // 254
    const px  = cx - pw / 2;
    const top = cy + PANEL_TOP_DY;

    const apM = p.floor(actualPace), apS = p.nf(p.round((actualPace % 1) * 60), 2);
    const tpM = p.floor(targetPace), tpS = p.nf(p.round((targetPace % 1) * 60), 2);
    const hrAcc = heartRate > 150 ? COL.accentHRHigh : COL.accentHR;

    // Row 1: Actual pace | Target pace (coloured values)
    drawPanel(px, top,             pw, PH,
      '● ACTUAL PACE', `${apM}:${apS} /km`,
      '○ TARGET PACE', `${tpM}:${tpS} /km`,
      'rgba(0,0,0,0.06)', [COL.handActual, COL.handTarget]);

    // Row 2: Heart rate | Lap dist
    drawPanel(px, top + (PH + PGAP),     pw, PH,
      '♥ HEART RATE', `${heartRate} bpm`,
      'LAP DIST', `${p.nf(lapDist, 1, 2)} km`,
      hrAcc, null);

    // Row 3: Lap count | Total dist
    drawPanel(px, top + (PH + PGAP) * 2, pw, PH,
      'LAP', `${lapCount}`,
      'TOTAL DIST', `${p.nf(totalDist, 1, 2)} km`,
      COL.accentNeutral, null);

    // Row 4: Elapsed time
    drawPanel(px, top + (PH + PGAP) * 3, pw, PH,
      'ELAPSED', fmtTime(elapsedMs),
      null, null,
      COL.accentNeutral, null);

    // Legend
    drawLegend(cx, top + (PH + PGAP) * 4 + 6);
  }

  function drawPanel(x, y, w, h, lLbl, lVal, rLbl, rVal, accent, valCols) {
    p.drawingContext.shadowColor = 'transparent';
    p.drawingContext.fillStyle = COL.panelBg;
    p.drawingContext.strokeStyle = accent;
    p.drawingContext.lineWidth = 1;
    p.drawingContext.beginPath(); rrPath(x, y, w, h, 5);
    p.drawingContext.fill(); p.drawingContext.stroke();

    p.noStroke(); p.textFont('Arial,Helvetica,sans-serif');

    p.fill(COL.labelFaint); p.textSize(7); p.textStyle(p.NORMAL); p.textAlign(p.LEFT, p.TOP);
    p.text(lLbl, x + 8, y + 4);

    const lc = valCols ? valCols[0] : null;
    if (lc) p.fill(lc[0], lc[1], lc[2]); else p.fill(COL.text);
    p.textSize(12); p.textStyle(p.BOLD); p.textAlign(p.LEFT, p.BOTTOM);
    p.text(lVal, x + 8, y + h - 3);

    if (rLbl) {
      p.fill(COL.labelFaint); p.textSize(7); p.textStyle(p.NORMAL); p.textAlign(p.RIGHT, p.TOP);
      p.text(rLbl, x + w - 8, y + 4);
      const rc = valCols ? valCols[1] : null;
      if (rc) p.fill(rc[0], rc[1], rc[2]); else p.fill(COL.text);
      p.textSize(12); p.textStyle(p.BOLD); p.textAlign(p.RIGHT, p.BOTTOM);
      p.text(rVal, x + w - 8, y + h - 3);
    }
    p.textStyle(p.NORMAL);
  }

  function drawLegend(cx, y) {
    p.drawingContext.shadowColor = 'transparent';
    p.textFont('Arial,Helvetica,sans-serif'); p.textSize(8); p.textStyle(p.NORMAL);
    p.stroke(COL.handActual[0], COL.handActual[1], COL.handActual[2]); p.strokeWeight(2.5);
    p.line(cx - 96, y, cx - 76, y);
    p.noStroke(); p.fill(COL.textMid); p.textAlign(p.LEFT, p.CENTER); p.text('Actual pace', cx - 72, y);
    p.stroke(COL.handTarget[0], COL.handTarget[1], COL.handTarget[2]); p.strokeWeight(2);
    p.line(cx + 6, y, cx + 26, y);
    p.noStroke(); p.fill(COL.textMid); p.textAlign(p.LEFT, p.CENTER); p.text('Target pace', cx + 30, y);
  }

  function fmtTime(ms) {
    const s = p.floor(ms / 1000), m = p.floor(s / 60);
    return p.nf(m, 2) + ':' + p.nf(s % 60, 2);
  }

  function angForDist(d) { return -p.HALF_PI + (d / 1.0) * p.TWO_PI; }

  function rrPath(x, y, w, h, r) {
    const dc = p.drawingContext;
    dc.moveTo(x + r, y); dc.lineTo(x + w - r, y); dc.quadraticCurveTo(x + w, y, x + w, y + r);
    dc.lineTo(x + w, y + h - r); dc.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    dc.lineTo(x + r, y + h); dc.quadraticCurveTo(x, y + h, x, y + h - r);
    dc.lineTo(x, y + r); dc.quadraticCurveTo(x, y, x + r, y); dc.closePath();
  }
});