// sketch15-hwk5.js
// HWK5: Narrative Visualization — "When Philly Sleeps"
// Commit 1: basic scaffold — load data, draw map frame and uniform yellow dots
registerSketch('sk15', function (p) {
  const CANVAS_SIZE = 800;

  // ── Layout ───────────────────────────────────────────────
  const MAP_X = 30, MAP_Y = 80, MAP_W = 500, MAP_H = 560;

  // ── Palette ──────────────────────────────────────────────
  const BG      = '#0d1b2a';
  const MAP_BG  = '#0a1520';
  const OPEN_COL= '#FFD166';
  const TEXT_COL= '#d4cfc7';
  const DIM_COL = '#3a5068';

  // ── Data ─────────────────────────────────────────────────
  let mapData   = [];
  let dataLoaded = false;

  // ── Geo bounds (Philadelphia) ─────────────────────────────
  const LAT_MIN = 39.865, LAT_MAX = 40.138;
  const LON_MIN = -75.282, LON_MAX = -74.958;

  // ── Show all venues at a fixed hour (6 PM) for now ───────
  const FIXED_HOUR = '18';

  // ════════════════════════════════════════════════════════
  p.preload = function () {
    p.loadJSON('data/philly_map_ready.json', function (d) {
      mapData = Array.isArray(d) ? d : Object.values(d);
      dataLoaded = true;
    });
  };

  p.setup = function () {
    p.pixelDensity(1);
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.textFont('monospace');
  };

  p.draw = function () {
    p.background(BG);
    if (!dataLoaded || mapData.length === 0) {
      p.fill(TEXT_COL); p.noStroke();
      p.textSize(13); p.textAlign(p.CENTER, p.CENTER);
      p.text('loading philly…', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
      return;
    }
    drawTitle();
    drawMap();
    drawFootnote();
  };

  // ── Title ────────────────────────────────────────────────
  function drawTitle() {
    p.noStroke();
    p.fill(OPEN_COL);
    p.textSize(21); p.textAlign(p.LEFT, p.TOP); p.textStyle(p.BOLD);
    p.text('WHEN PHILLY SLEEPS', MAP_X, 16);
    p.fill(DIM_COL);
    p.textSize(10); p.textStyle(p.NORMAL);
    p.text('which restaurants survive the night?', MAP_X, 44);
  }

  // ── Map: draw all open dots at fixed hour as uniform yellow ─
  function drawMap() {
    p.fill(MAP_BG); p.stroke('#1e3a52'); p.strokeWeight(1);
    p.rect(MAP_X, MAP_Y, MAP_W, MAP_H, 4);

    for (let i = 0; i < mapData.length; i++) {
      const d = mapData[i];
      if (!d.latitude || !d.longitude) continue;

      const x = p.map(d.longitude, LON_MIN, LON_MAX, MAP_X + 4, MAP_X + MAP_W - 4);
      const y = p.map(d.latitude,  LAT_MIN, LAT_MAX, MAP_Y + MAP_H - 4, MAP_Y + 4);

      // clip to map bounds
      if (x < MAP_X + 5 || x > MAP_X + MAP_W - 5 ||
          y < MAP_Y + 5 || y > MAP_Y + MAP_H - 5) continue;

      const openHours = d.open_by_hour || {};
      if (openHours[FIXED_HOUR] !== true) continue;

      // uniform yellow dot — no category color yet
      p.fill(OPEN_COL); p.noStroke();
      p.ellipse(x, y, 4, 4);
    }

    // hour label
    p.fill(8, 18, 30, 210); p.noStroke();
    p.rect(MAP_X + MAP_W - 82, MAP_Y + MAP_H - 30, 76, 24, 3);
    p.fill(OPEN_COL);
    p.textSize(14); p.textAlign(p.CENTER, p.CENTER); p.textStyle(p.BOLD);
    p.text('6 PM', MAP_X + MAP_W - 44, MAP_Y + MAP_H - 18);
    p.textStyle(p.NORMAL);
  }

  // ── Footnote ─────────────────────────────────────────────
  function drawFootnote() {
    p.noStroke(); p.fill(DIM_COL);
    p.textSize(8); p.textAlign(p.LEFT, p.BOTTOM);
    p.text('Source: Yelp Open Dataset · Philadelphia restaurants',
      MAP_X, CANVAS_SIZE - 6);
  }

  p.windowResized = function () { p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE); };
});