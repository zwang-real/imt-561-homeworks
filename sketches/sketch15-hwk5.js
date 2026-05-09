// Instance-mode sketch for tab 15
// "When Philly Sleeps" — Late Night Food Survival Map
// Commit 6: final polish — fix pixel density, clean all comments to English
registerSketch('sk15', function (p) {
  const CANVAS_SIZE = 800;

  // ── Layout ──────────────────────────────────────────────
  const MAP_X = 30, MAP_Y = 80, MAP_W = 500, MAP_H = 560;
  const PANEL_X = 548, PANEL_Y = 80, PANEL_W = 220, PANEL_H = 390;
  const DIAL_CX = 548 + 110, DIAL_CY = 570, DIAL_R = 100;

  // ── Palette ──────────────────────────────────────────────
  const BG         = '#0d1b2a';
  const MAP_BG     = '#0a1520';
  const NEIGH_FILL = '#0f2035';
  const NEIGH_STR  = '#1e3a52';
  const CITY_STR   = '#2a5070';
  const OPEN_COL   = '#FFD166';
  const TEXT_COL   = '#d4cfc7';
  const DIM_COL    = '#3a5068';
  const ACCENT     = '#4FC3F7';

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

  // ── Data ────────────────────────────────────────────────
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

  let draggingDial = false;
  let hoveredDot   = null;

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

  // ════════════════════════════════════════════════════════
  p.setup = function () {
    p.createCanvas(CANVAS_SIZE, CANVAS_SIZE);
    p.textFont('monospace');
  };

  // ════════════════════════════════════════════════════════
  p.draw = function () {
    p.background(BG);
    if (!dataLoaded || mapData.length === 0) { drawLoading(); return; }

    if (playing && p.millis() - lastTick > TICK_MS) {
      currentHourIdx = (currentHourIdx + 1) % HOURS.length;
      lastTick = p.millis();
    }

    const hour    = HOURS[currentHourIdx];
    const hourKey = String(hour);

    drawTitle();
    drawMap(hour, hourKey);
    drawPanel(hourKey);
    drawDial();
    drawHoverTooltip();
    drawFootnote();
  };

  // ── Loading ──────────────────────────────────────────────
  function drawLoading() {
    p.fill(TEXT_COL); p.noStroke();
    p.textSize(13); p.textAlign(p.CENTER, p.CENTER);
    p.text('loading philly…', CANVAS_SIZE / 2, CANVAS_SIZE / 2);
  }

  // ── Title ────────────────────────────────────────────────
  function drawTitle() {
    p.noStroke();
    p.fill(OPEN_COL);
    p.textSize(21); p.textAlign(p.LEFT, p.TOP); p.textStyle(p.BOLD);
    p.text('WHEN PHILLY SLEEPS', MAP_X, 16);
    p.fill(DIM_COL);
    p.textSize(10); p.textStyle(p.NORMAL);
    p.text('which restaurants survive the night?   drag the clock · click to pause', MAP_X, 44);
  }

  // ── Map ──────────────────────────────────────────────────
  function drawMap(hour, hourKey) {
    p.fill(MAP_BG); p.stroke(NEIGH_STR); p.strokeWeight(1);
    p.rect(MAP_X, MAP_Y, MAP_W, MAP_H, 4);

    if (geoLoaded && geoData && geoData.features) drawNeighborhoods();

    hoveredDot = null;
    const mx = p.mouseX, my = p.mouseY;

    for (let i = 0; i < mapData.length; i++) {
      const d = mapData[i];
      if (!d.latitude || !d.longitude) continue;

      const x = geoLonToX(d.longitude);
      const y = geoLatToY(d.latitude);

      const openHours = d.open_by_hour || {};
      const isOpen = openHours[hourKey] === true;
      if (!isOpen) continue;

      // determine hover BEFORE using it
      const dist   = Math.hypot(mx - x, my - y);
      const hovered = dist < 8 && mx > MAP_X && mx < MAP_X + MAP_W
                               && my > MAP_Y && my < MAP_Y + MAP_H;

      const dotR  = hovered ? 4.5 : 1.8;
      const margin = dotR * 2.5;

      // clip via math — skip dots whose glow would spill outside map rect
      if (x < MAP_X + margin || x > MAP_X + MAP_W - margin ||
          y < MAP_Y + margin || y > MAP_Y + MAP_H - margin) continue;

      if (hovered) {
        hoveredDot = { x, y, name: d.name, cat: d.super_category, stars: d.stars };
      }

      const catCol = CAT_COLORS[d.super_category] || OPEN_COL;

      // glow halo
      const glowC = p.color(catCol);
      glowC.setAlpha(hovered ? 50 : 18);
      p.fill(glowC); p.noStroke();
      p.ellipse(x, y, dotR * 5, dotR * 5);

      // category color ring
      const midC = p.color(catCol);
      midC.setAlpha(hovered ? 220 : 160);
      p.fill(midC);
      p.ellipse(x, y, dotR * 2, dotR * 2);

      // white core
      p.fill(255, 255, 255, hovered ? 255 : 200);
      p.ellipse(x, y, dotR * 0.85, dotR * 0.85);
    }

    // hour badge
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

  function geoLonToX(lon) {
    return p.map(lon, LON_MIN, LON_MAX, MAP_X + 4, MAP_X + MAP_W - 4);
  }
  function geoLatToY(lat) {
    return p.map(lat, LAT_MIN, LAT_MAX, MAP_Y + MAP_H - 4, MAP_Y + 4);
  }

  // ── Side panel ───────────────────────────────────────────
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

  // ── Clock dial ───────────────────────────────────────────
  function drawDial() {
    const cx = DIAL_CX, cy = DIAL_CY, r = DIAL_R;

    const lateStart = hourToAngle(22);
    const lateEnd   = hourToAngle(4) + p.TWO_PI;
    p.noStroke(); p.fill(30, 60, 120, 130);
    p.arc(cx, cy, r * 2 + 8, r * 2 + 8, lateStart, lateEnd);

    p.fill(MAP_BG); p.stroke(NEIGH_STR); p.strokeWeight(1.2);
    p.ellipse(cx, cy, r * 2, r * 2);

    p.noStroke(); p.fill(ACCENT);
    p.textSize(7.5); p.textAlign(p.CENTER, p.CENTER);
    p.text('LATE\nNIGHT', cx + r * 0.36, cy - r * 0.52);

    HOURS.forEach((h, idx) => {
      const ang = hourToAngle(h);
      p.stroke(idx === currentHourIdx ? OPEN_COL : DIM_COL);
      p.strokeWeight(idx === currentHourIdx ? 2.5 : 1);
      p.line(
        cx + Math.cos(ang) * r * 0.80, cy + Math.sin(ang) * r * 0.80,
        cx + Math.cos(ang) * r * 0.93, cy + Math.sin(ang) * r * 0.93
      );
      p.noStroke();
      p.fill(idx === currentHourIdx ? OPEN_COL : DIM_COL);
      p.textSize(8); p.textAlign(p.CENTER, p.CENTER);
      p.text(formatHourShort(h),
        cx + Math.cos(ang) * r * 0.66,
        cy + Math.sin(ang) * r * 0.66);
    });

    const handAng = hourToAngle(HOURS[currentHourIdx]);
    p.stroke(OPEN_COL); p.strokeWeight(2.5);
    p.line(cx, cy,
      cx + Math.cos(handAng) * r * 0.76,
      cy + Math.sin(handAng) * r * 0.76);

    p.fill(OPEN_COL); p.noStroke();
    p.ellipse(cx, cy, 8, 8);

    p.noFill(); p.stroke(NEIGH_STR); p.strokeWeight(1.5);
    p.ellipse(cx, cy, r * 2 + 10, r * 2 + 10);

    const overBtn = p.mouseY > cy + r + 4 && p.mouseY < cy + r + 24
                 && Math.abs(p.mouseX - cx) < 38;
    p.noStroke(); p.fill(overBtn ? OPEN_COL : DIM_COL);
    p.textSize(10); p.textAlign(p.CENTER, p.TOP);
    p.text(playing ? '⏸  pause' : '▶  play', cx, cy + r + 8);
  }

  function hourToAngle(h) {
    return -p.HALF_PI + (h % 12 / 12) * p.TWO_PI;
  }

  // ── Hover tooltip ────────────────────────────────────────
  function drawHoverTooltip() {
    if (!hoveredDot) return;
    const { x, y, name, cat, stars } = hoveredDot;

    const TW = 200, TH = 44;
    let tx = x + 12, ty = y - TH - 6;
    if (tx + TW > MAP_X + MAP_W - 2) tx = x - TW - 12;
    if (ty < MAP_Y + 2) ty = y + 10;

    p.fill(6, 16, 28, 240);
    p.stroke(CAT_COLORS[cat] || OPEN_COL); p.strokeWeight(1);
    p.rect(tx, ty, TW, TH, 5);

    p.noStroke();
    p.fill(CAT_COLORS[cat] || OPEN_COL);
    p.textSize(11); p.textStyle(p.BOLD); p.textAlign(p.LEFT, p.TOP);
    let dn = name || '?';
    while (p.textWidth(dn) > TW - 20 && dn.length > 4) dn = dn.slice(0, -1);
    if (dn !== name) dn += '…';
    p.text(dn, tx + 10, ty + 8);

    p.textStyle(p.NORMAL); p.fill(DIM_COL); p.textSize(9);
    p.text((cat || '') + '   ★ ' + (stars || '?'), tx + 10, ty + 26);
  }

  // ── Footnote ─────────────────────────────────────────────
  function drawFootnote() {
    p.noStroke(); p.fill(DIM_COL);
    p.textSize(8); p.textAlign(p.LEFT, p.BOTTOM);
    p.text('Source: Yelp Open Dataset · Philadelphia restaurants · hover a dot to inspect',
      MAP_X, CANVAS_SIZE - 6);
  }

  // ── Helpers ──────────────────────────────────────────────
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

  // ── Mouse ────────────────────────────────────────────────
  p.mousePressed = function () {
    if (p.mouseX < 0 || p.mouseX > CANVAS_SIZE ||
        p.mouseY < 0 || p.mouseY > CANVAS_SIZE) return;

    if (p.mouseY > DIAL_CY + DIAL_R + 4 && p.mouseY < DIAL_CY + DIAL_R + 26
        && Math.abs(p.mouseX - DIAL_CX) < 40) {
      playing = !playing;
      lastTick = p.millis();
      return;
    }
    if (Math.hypot(p.mouseX - DIAL_CX, p.mouseY - DIAL_CY) < DIAL_R + 16) {
      draggingDial = true;
      playing = false;
      updateDialFromMouse();
    }
  };

  p.mouseDragged = function () {
    if (draggingDial) updateDialFromMouse();
  };

  p.mouseReleased = function () { draggingDial = false; };

  function updateDialFromMouse() {
    const ang = Math.atan2(p.mouseY - DIAL_CY, p.mouseX - DIAL_CX);
    const h12 = ((ang + p.HALF_PI) / p.TWO_PI * 12 + 12) % 12;
    let best = 0, bestDist = Infinity;
    HOURS.forEach((h, idx) => {
      const diff = Math.min(Math.abs(h12 - h % 12), 12 - Math.abs(h12 - h % 12));
      if (diff < bestDist) { bestDist = diff; best = idx; }
    });
    currentHourIdx = best;
  }

  p.windowResized = function () { p.resizeCanvas(CANVAS_SIZE, CANVAS_SIZE); };
});