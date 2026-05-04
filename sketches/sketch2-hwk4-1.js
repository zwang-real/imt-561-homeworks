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

  p.draw = function () {
    p.background(COL.bg); 
    
    // Centering the watch on the 800x800 canvas
    let cx = p.width / 2;
    let cy = p.height / 2;

    // Temporary placeholder for the watch body
    p.rectMode(p.CENTER);
    p.noFill();
    p.stroke(COL.caseStroke);
    p.rect(cx, cy, CW * 2, CH * 2, 40); 

    p.fill(COL.textMid);
    p.noStroke();
    p.textAlign(p.CENTER, p.CENTER);
    p.text('Step 1: Environment Initialized', cx, cy);
  };
});