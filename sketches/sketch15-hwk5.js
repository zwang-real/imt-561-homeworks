// sketch15-hwk5.js
// HWK5: Narrative Visualization — "When Philly Sleeps"
// Commit 3: encode food category with color; add glow effect; add live count panel
registerSketch('sk15', function (p) {
  const CANVAS_SIZE = 800;

  // ── Layout ───────────────────────────────────────────────
  const MAP_X = 30, MAP_Y = 80, MAP_W = 500, MAP_H = 560;
  const PANEL_X = 548, PANEL_Y = 80, PANEL_W = 220, PANEL_H = 360;

  // ── Palette ──────────────────────────────────────────────
  const BG         = '#0d1b2a';
  const MAP_BG     = '#0a1520';
  const NEIGH_FILL = '#0f2035';
  const NEIGH_STR  = '#1e3a52';
  const CITY_STR   = '#2a5070';
  const OPEN_COL   = '#FFD166';
  const TEXT_COL   = '#d4cfc7';
  const DIM_COL    = '#3a5068';

  // Category color encoding — each type gets a distinct hue
  const CAT_COLORS = {
    'Pizza & Italian':     '#FF6B6B',
    'Bars & Nightlife':    '#A78BFA',
    'Burgers & Fast Food': '#FB923C',
    'Asian':               '#34D399',
    'American':            '#60A5FA',
    'Coffee & Dessert':    '#F472B6',
    'Other':               '#94A3B8',
  };
  const CAT_ORDER = Object.keys(CAT_COLORS);

  // ── Data ─────────────────────────────────────────────────
  let mapData    = [];
  let hourlyData = {};
  let geoData    = null;
  let dataLoaded = false;
  let geoLoaded  = false;

  // ── Geo bounds ───────────────────────────────────────────
  const LAT_MIN = 39.865, LAT_MAX = 40.138;
  const LON_MIN = -75.282, LON_MAX = -74.958;

  // ── Time ─────────────────────────────────────────────────
  const HOURS = [18, 19, 20, 21, 22, 23, 0, 1, 2, 3, 4];
  let currentHourIdx = 0;
  let playing  = true;
  let lastTick = 0;
  const TICK_MS = 1100;

  const SL_X = MAP_X, SL_Y = MAP_Y + MAP_H + 28, SL_W = MAP_W;
  let draggingSlider = false;

  // ════════════════════════════════════════════════════════
  p.preload = function () {
    p.loadJSON('data/philly_map_ready.json', function (d) {
      mapData = Array.isArray(d) ? d : Object.values(d);
    });
    p.loadJSON('data/hourly_survival.json', function (d) {
      const arr = Array.isArray(d) ? d : Object.values(d);
      arr.forEach(row => {
        const h = String(row.hour);
        if (!hourlyData[h]) hourlyData[h] = {};
        hourlyData[h][row.category] = row.count;
      });
      dataLoaded = true;
    });
    p.loadJSON(
      'https://raw.githubusercontent.com/blackmad/neighborhoods/master/philadelphia.geojson',
      function (d) { geoData = d; geoLoaded = true; },
      function ()  { geoLoaded = true; }
    );
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
    if (playing && p.millis() - lastTick > TICK_MS) {
      currentHourIdx = (currentHourIdx + 1) % HOURS.length;
      lastTick = p.millis();
    }
    const hourKey = String(HOURS[currentHourIdx]);
    drawTitle();
    drawMap(hourKey);
    drawPanel(hourKey);
    drawSlider();
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
    p.text('which restaurants survive the night?   drag slider · click to pause', MAP_X, 44);
  }

  // ── Map ──────────────────────────────────────────────────
  function drawMap(hourKey) {
    p.fill(MAP_BG); p.stroke(NEIGH_STR); p.strokeWeight(1);
    p.rect(MAP_X, MAP_Y, MAP_W, MAP_H, 4);
    if (geoLoaded && geoData && geoData.features) drawNeighborhoods();

    for (let i = 0; i < mapData.length; i++) {
      const d = mapData[i];
      if (!d.latitude || !d.longitude) continue;
      const x = geoLonToX(d.longitude);
      const y = geoLatToY(d.latitude);

      const dist = Math.hypot(p.mouseX - x, p.mouseY - y);
      const hovered = dist < 8 && p.mouseX > MAP_X && p.mouseX < MAP_X + MAP_W
                               && p.mouseY > MAP_Y && p.mouseY < MAP_Y + MAP_H;
      const dotR  = hovered ? 4.5 : 1.8;
      const margin = dotR * 2.5;
      if (x < MAP_X + margin || x > MAP_X + MAP_W - margin ||
          y < MAP_Y + margin || y > MAP_Y + MAP_H - margin) continue;

      const openHours = d.open_by_hour || {};
      if (openHours[hourKey] !== true) continue;

      // category color encoding with glow + white core
      const catCol = CAT_COLORS[d.super_category] || OPEN_COL;

      const glowC = p.color(catCol);
      glowC.setAlpha(hovered ? 50 : 18);
      p.fill(glowC); p.noStroke();
      p.ellipse(x, y, dotR * 5, dotR * 5);

      const midC = p.color(catCol);
      midC.setAlpha(hovered ? 220 : 160);
      p.fill(midC);
      p.ellipse(x, y, dotR * 2, dotR * 2);

      p.fill(255, 255, 255, hovered ? 255 : 200);
      p.ellipse(x, y, dotR * 0.85, dotR * 0.85);
    }

    const hourStr = formatHour(HOURS[currentHourIdx]);
    p.fill(8, 18, 30, 210); p.noStroke();
    p.rect(MAP_X + MAP_W - 82, MAP_Y + MAP_H - 30, 76, 24, 3);
    p.fill(OPEN_COL);
    p.textSize(14); p.textAlign(p.CENTER, p.CENTER); p.textStyle(p.BOLD);
    p.text(hourStr, MAP_X + MAP_W - 44, MAP_Y + MAP_H - 18);
    p.textStyle(p.NORMAL);
  }

  // ── Neighborhood polygons ────────────────────────────────
  function drawNeighborhoods() {
    p.push();
    geoData.features.forEach(feature => {
      const geom = feature.geometry;
      if (!geom) return;
      const polys = geom.type === 'Polygon' ? [geom.coordinates]
        : geom.type === 'MultiPolygon' ? geom.coordinates : [];
      polys.forEach(poly => {
        poly.forEach(ring => {
          p.beginShape();
          p.fill(NEIGH_FILL); p.stroke(NEIGH_STR); p.strokeWeight(0.6);
          ring.forEach(([lon, lat]) => p.vertex(geoLonToX(lon), geoLatToY(lat)));
          p.endShape(p.CLOSE);
        });
      });
    });
    geoData.features.forEach(feature => {
      const geom = feature.geometry;
      if (!geom) return;
      const polys = geom.type === 'Polygon' ? [geom.coordinates]
        : geom.type === 'MultiPolygon' ? geom.coordinates : [];
      polys.forEach(poly => {
        poly.forEach(ring => {
          p.beginShape();
          p.noFill(); p.stroke(CITY_STR); p.strokeWeight(1.4);
          ring.forEach(([lon, lat]) => p.vertex(geoLonToX(lon), geoLatToY(lat)));
          p.endShape(p.CLOSE);
        });
      });
    });
    p.pop();
  }

  // ── Side panel: live venue count by category ─────────────
  function drawPanel(hourKey) {
    p.fill(8, 22, 36); p.stroke(NEIGH_STR); p.strokeWeight(1);
    p.rect(PANEL_X, PANEL_Y, PANEL_W, PANEL_H, 4);
    p.noStroke(); p.fill(DIM_COL);
    p.textSize(9); p.textAlign(p.LEFT, p.TOP);
    p.text('OPEN VENUES BY TYPE', PANEL_X + 12, PANEL_Y + 12);

    const hData = hourlyData[hourKey] || {};
    let maxCount = 1;
    CAT_ORDER.forEach(c => { if ((hData[c] || 0) > maxCount) maxCount = hData[c]; });

    const rowH = 50;
    CAT_ORDER.forEach((cat, i) => {
      const count   = hData[cat] || 0;
      const rowY    = PANEL_Y + 30 + i * rowH;
      const barMaxW = PANEL_W - 24;
      const barW    = count > 0 ? p.map(count, 0, maxCount, 4, barMaxW) : 0;
      const col     = p.color(CAT_COLORS[cat]);

      p.fill(15, 32, 50); p.noStroke();
      p.rect(PANEL_X + 12, rowY + 26, barMaxW, 6, 2);
      if (barW > 0) {
        col.setAlpha(200); p.fill(col);
        p.rect(PANEL_X + 12, rowY + 26, barW, 6, 2);
      }
      col.setAlpha(255); p.fill(col);
      p.ellipse(PANEL_X + 17, rowY + 10, 7, 7);
      p.fill(TEXT_COL); p.textSize(10); p.textAlign(p.LEFT, p.TOP);
      p.text(cat, PANEL_X + 27, rowY + 5);
      p.fill(OPEN_COL); p.textSize(13); p.textStyle(p.BOLD);
      p.textAlign(p.RIGHT, p.TOP);
      p.text(count, PANEL_X + PANEL_W - 10, rowY + 3);
      p.textStyle(p.NORMAL);
    });
  }

  // ── Simple time slider ───────────────────────────────────
  function drawSlider() {
    const trackY = SL_Y + 8;
    p.stroke('#1e3a52'); p.strokeWeight(2);
    p.line(SL_X, trackY, SL_X + SL_W, trackY);
    HOURS.forEach((h, i) => {
      const x = p.map(i, 0, HOURS.length - 1, SL_X, SL_X + SL_W);
      p.stroke(DIM_COL); p.strokeWeight(1);
      p.line(x, trackY - 4, x, trackY + 4);
      p.noStroke();
      p.fill(i === currentHourIdx ? TEXT_COL : DIM_COL);
      p.textSize(9); p.textAlign(p.CENTER, p.TOP);
      p.text(formatHourShort(h), x, trackY + 7);
    });
    const thumbX = p.map(currentHourIdx, 0, HOURS.length - 1, SL_X, SL_X + SL_W);
    p.fill(OPEN_COL); p.noStroke();
    p.ellipse(thumbX, trackY, 14, 14);
    const overBtn = p.mouseX > SL_X + SL_W + 14 && p.mouseX < SL_X + SL_W + 70
                 && p.mouseY > SL_Y && p.mouseY < SL_Y + 20;
    p.fill(overBtn ? OPEN_COL : DIM_COL);
    p.textSize(11); p.textAlign(p.LEFT, p.TOP);
    p.text(playing ? '⏸ pause' : '▶ play', SL_X + SL_W + 16, SL_Y + 2);
  }

  // ── Helpers ──────────────────────────────────────────────
  function geoLonToX(lon) {
    return p.map(lon, LON_MIN, LON_MAX, MAP_X + 4, MAP_X + MAP_W - 4);
  }
  function geoLatToY(lat) {
    return p.map(lat, LAT_MIN, LAT_MAX, MAP_Y + MAP_H - 4, MAP_Y + 4);
  }
  function formatHour(h) {
    if (h === 0)  return '12 AM';
    if (h < 12)   return h + ' AM';
    if (h === 12) return '12 PM';
    return (h - 12) + ' PM';
  }
  function formatHourShort(h) {
    if (h === 0)  return '12a';
    if (h < 12)   return h + 'p';
    if (h === 12) return '12p';
    return (h - 12) + 'a';
  }

  // ── Footnote ─────────────────────────────────────────────
  function drawFootnote() {
    p.noStroke(); p.fill(DIM_COL);
    p.textSize(8); p.textAlign(p.LEFT, p.BOTTOM);
    p.text('Source: Yelp Open Dataset · Philadelphia restaurants · hover a dot to inspect',
      MAP_X, CANVAS_SIZE - 6);
  }

  // ── Mouse ────────────────────────────────────────────────
  p.mousePressed = function () {
    if (p.mouseX < 0 || p.mouseX > CANVAS_SIZE ||
        p.mouseY < 0 || p.mouseY > CANVAS_SIZE) return;
    const trackY = SL_Y + 8;
    if (p.mouseY > trackY - 12 && p.mouseY < trackY + 20
        && p.mouseX >= SL_X && p.mouseX <= SL_X + SL_W) {
      draggingSlider = true; playing = false; updateSlider();
    }
    if (p.mouseX > SL_X + SL_W + 14 && p.mouseX < SL_X + SL_W + 70
        && p.mouseY > SL_Y && p.mouseY < SL_Y + 20) {
      playing = !playing; lastTick = p.millis();
    }
  };
  p.mouseDragged = function () { if (draggingSlider) updateSlider(); };
  p.mouseReleased = function () { draggingSlider = false; };
  function updateSlider() {
    const raw = p.constrain(p.mouseX, SL_X, SL_X + SL_W);
    currentHourIdx = p.constrain(
      Math.round(p.map(raw, SL_X, SL_X + SL_W, 0, HOURS.length - 1)),
      0, HOURS.length - 1
    );
  }

  p.windowResized = function () { p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE); };
});