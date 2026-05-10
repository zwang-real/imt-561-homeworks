// sketch15-hwk5.js
// HWK5: Narrative Visualization — "When Philly Sleeps"
// Commit 5: add circular zoom lens on hover for spatial context
registerSketch('sk15', function (p) {
  const CANVAS_SIZE = 800;

  // ── Layout ───────────────────────────────────────────────
  const MAP_X = 30, MAP_Y = 80, MAP_W = 500, MAP_H = 560;
  const PANEL_X = 548, PANEL_Y = 80, PANEL_W = 220, PANEL_H = 360;
  const DIAL_CX = 548 + 110, DIAL_CY = 560, DIAL_R = 90;

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
    const hour    = HOURS[currentHourIdx];
    const hourKey = String(hour);
    drawTitle();
    drawMap(hourKey);
    drawPanel(hourKey);
    drawDial();
    drawZoomLens();       // new: magnifier on hover
    drawHoverTooltip();
    drawFootnote();
  };

  // ── Title ────────────────────────────────────────────────
  function drawTitle() {
    p.noStroke();
    p.fill(OPEN_COL);
    p.textSize(21); p.textAlign(p.LEFT, p.TOP); p.textStyle(p.BOLD);
    p.text('WHEN PHILLY SLEEPS', MAP_X, 16);
    p.fill('#8ab4d4');        // brighter than DIM_COL
    p.textSize(15);           // was 10
    p.textStyle(p.NORMAL);
    p.text('Which restaurants survive the night?   Drag the clock · Click to pause', MAP_X, 42);
  }

  // ── Map ──────────────────────────────────────────────────
  function drawMap(hourKey) {
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
      if (openHours[hourKey] !== true) continue;

      const dist   = Math.hypot(mx - x, my - y);
      const hovered = dist < 8 && mx > MAP_X && mx < MAP_X + MAP_W
                               && my > MAP_Y && my < MAP_Y + MAP_H;
      const dotR  = hovered ? 4.5 : 1.8;
      const margin = dotR * 2.5;
      if (x < MAP_X + margin || x > MAP_X + MAP_W - margin ||
          y < MAP_Y + margin || y > MAP_Y + MAP_H - margin) continue;

      if (hovered) {
      hoveredDot = { x, y, name: d.name, cat: d.super_category, stars: d.stars };
      playing = false;
    }

      const catCol = CAT_COLORS[d.super_category] || OPEN_COL;
      const glowC  = p.color(catCol); glowC.setAlpha(hovered ? 50 : 18);
      p.fill(glowC); p.noStroke(); p.ellipse(x, y, dotR * 5, dotR * 5);
      const midC = p.color(catCol); midC.setAlpha(hovered ? 220 : 160);
      p.fill(midC); p.ellipse(x, y, dotR * 2, dotR * 2);
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
      if (barW > 0) { col.setAlpha(200); p.fill(col); p.rect(PANEL_X + 12, rowY + 26, barW, 6, 2); }
      col.setAlpha(255); p.fill(col); p.ellipse(PANEL_X + 17, rowY + 10, 7, 7);
      p.fill(TEXT_COL); p.textSize(10); p.textAlign(p.LEFT, p.TOP);
      p.text(cat, PANEL_X + 27, rowY + 5);
      p.fill(OPEN_COL); p.textSize(13); p.textStyle(p.BOLD); p.textAlign(p.RIGHT, p.TOP);
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
    p.textSize(7.5); p.textAlign(p.CENTER, p.CENTER); p.textLeading(10);
    p.text('LATE\nNIGHT', cx + r * 0.42, cy - r * 0.48);
    HOURS.forEach((h, idx) => {
      const ang = hourToAngle(h);
      p.stroke(idx === currentHourIdx ? OPEN_COL : DIM_COL);
      p.strokeWeight(idx === currentHourIdx ? 2.5 : 1);
      p.line(cx + Math.cos(ang) * r * 0.80, cy + Math.sin(ang) * r * 0.80,
             cx + Math.cos(ang) * r * 0.93, cy + Math.sin(ang) * r * 0.93);
      p.noStroke();
      p.fill(idx === currentHourIdx ? OPEN_COL : DIM_COL);
      p.textSize(8); p.textAlign(p.CENTER, p.CENTER);
      p.text(formatHourShort(h), cx + Math.cos(ang) * r * 0.66, cy + Math.sin(ang) * r * 0.66);
    });
    const handAng = hourToAngle(HOURS[currentHourIdx]);
    p.stroke(OPEN_COL); p.strokeWeight(2.5);
    p.line(cx, cy, cx + Math.cos(handAng) * r * 0.76, cy + Math.sin(handAng) * r * 0.76);
    p.fill(OPEN_COL); p.noStroke(); p.ellipse(cx, cy, 8, 8);
    p.noFill(); p.stroke(NEIGH_STR); p.strokeWeight(1.5);
    p.ellipse(cx, cy, r * 2 + 10, r * 2 + 10);
    const overBtn = p.mouseY > cy + r + 4 && p.mouseY < cy + r + 24
                 && Math.abs(p.mouseX - cx) < 38;
    p.noStroke(); p.fill(overBtn ? OPEN_COL : DIM_COL);
    p.textSize(13); p.textAlign(p.CENTER, p.TOP);
    p.text(playing ? '⏸  pause' : '▶  play', cx, cy + r + 8);
  }

  function hourToAngle(h) { return -p.HALF_PI + (h % 12 / 12) * p.TWO_PI; }

  // ── Zoom lens: circular magnifier centered on hovered dot ─
  function drawZoomLens() {
    if (!hoveredDot) return;
    const { x, y } = hoveredDot;
    const hourKey = String(HOURS[currentHourIdx]);
    const LENS_R = 70, ZOOM = 3.5;

    // position lens — prefer top-right, adjust if out of bounds
    let lx = x + LENS_R + 14;
    let ly = y - LENS_R - 14;
    if (lx + LENS_R > MAP_X + MAP_W - 4) lx = x - LENS_R - 14;
    if (ly - LENS_R < MAP_Y + 4)         ly = y + LENS_R + 14;

    const ctx = p.drawingContext;

    // amber glow ring around lens
    ctx.save();
    ctx.shadowColor = 'rgba(255, 209, 102, 0.3)';
    ctx.shadowBlur  = 12;
    p.noFill(); p.stroke(OPEN_COL); p.strokeWeight(1.5);
    p.ellipse(lx, ly, LENS_R * 2, LENS_R * 2);
    ctx.restore();

    // clip rendering to circular lens area
    ctx.save();
    ctx.beginPath();
    ctx.arc(lx, ly, LENS_R - 1, 0, Math.PI * 2);
    ctx.clip();

    p.fill(MAP_BG); p.noStroke();
    p.ellipse(lx, ly, LENS_R * 2, LENS_R * 2);

    // draw zoomed neighborhood outlines
    if (geoLoaded && geoData && geoData.features) {
      geoData.features.forEach(feature => {
        const geom = feature.geometry;
        if (!geom) return;
        const polys = geom.type === 'Polygon' ? [geom.coordinates]
          : geom.type === 'MultiPolygon' ? geom.coordinates : [];
        polys.forEach(poly => {
          poly.forEach(ring => {
            p.beginShape();
            p.fill(NEIGH_FILL); p.stroke(NEIGH_STR); p.strokeWeight(0.8);
            ring.forEach(([lon, lat]) => {
              p.vertex(lx + (geoLonToX(lon) - x) * ZOOM,
                       ly + (geoLatToY(lat) - y) * ZOOM);
            });
            p.endShape(p.CLOSE);
          });
        });
      });
    }

    // draw zoomed open dots near the hovered location
    for (let i = 0; i < mapData.length; i++) {
      const d = mapData[i];
      if (!d.latitude || !d.longitude) continue;
      const openHours = d.open_by_hour || {};
      if (openHours[hourKey] !== true) continue;
      const ox = geoLonToX(d.longitude);
      const oy = geoLatToY(d.latitude);
      if (Math.hypot(ox - x, oy - y) > LENS_R / ZOOM * 1.2) continue;

      const sx = lx + (ox - x) * ZOOM;
      const sy = ly + (oy - y) * ZOOM;
      const catCol     = CAT_COLORS[d.super_category] || OPEN_COL;
      const isHoverDot = Math.hypot(ox - x, oy - y) < 2;
      const dr = isHoverDot ? 6 : 3.5;

      const gc = p.color(catCol); gc.setAlpha(25);
      p.fill(gc); p.noStroke(); p.ellipse(sx, sy, dr * 4, dr * 4);
      const mc = p.color(catCol); mc.setAlpha(200);
      p.fill(mc); p.ellipse(sx, sy, dr * 2, dr * 2);
      p.fill(255, 255, 255, isHoverDot ? 255 : 180);
      p.ellipse(sx, sy, dr * 0.8, dr * 0.8);
    }

    // crosshair at lens center
    p.stroke(OPEN_COL); p.strokeWeight(0.8);
    p.line(lx - 8, ly, lx + 8, ly);
    p.line(lx, ly - 8, lx, ly + 8);

    ctx.restore();

    // redraw lens border outside clip so it's crisp
    p.noFill(); p.stroke(OPEN_COL); p.strokeWeight(1.5);
    p.ellipse(lx, ly, LENS_R * 2, LENS_R * 2);

    // connector line from dot to lens edge
    p.stroke(OPEN_COL); p.strokeWeight(0.6);
    const ang = Math.atan2(ly - y, lx - x);
    p.line(x + Math.cos(ang) * 6,       y + Math.sin(ang) * 6,
           lx - Math.cos(ang) * LENS_R, ly - Math.sin(ang) * LENS_R);
  }

  // ── Hover tooltip ────────────────────────────────────────
  function drawHoverTooltip() {
    if (!hoveredDot) return;
    const { x, y, name, cat, stars } = hoveredDot;
    const TW = 200, TH = 44;
    let tx = x + 12, ty = y - TH - 6;
    if (tx + TW > MAP_X + MAP_W - 2) tx = x - TW - 12;
    if (ty < MAP_Y + 2) ty = y + 10;
    p.fill(6, 16, 28, 240); p.stroke(CAT_COLORS[cat] || OPEN_COL); p.strokeWeight(1);
    p.rect(tx, ty, TW, TH, 5);
    p.noStroke(); p.fill(CAT_COLORS[cat] || OPEN_COL);
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
    p.fill('#5a7a8a');        // slightly brighter
    p.textSize(13);           // was 8
    p.textAlign(p.LEFT, p.BOTTOM);
    p.text('Source: Yelp Open Dataset · Philadelphia restaurants · Hover a dot to inspect',
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
    if (h === 0)  return '12';
    if (h < 12)   return String(h);
    if (h === 12) return '12';
    return String(h - 12);
  }

  // ── Mouse ────────────────────────────────────────────────
  p.mousePressed = function () {
    if (p.mouseX < 0 || p.mouseX > CANVAS_SIZE ||
        p.mouseY < 0 || p.mouseY > CANVAS_SIZE) return;
    if (p.mouseY > DIAL_CY + DIAL_R + 4 && p.mouseY < DIAL_CY + DIAL_R + 30
        && Math.abs(p.mouseX - DIAL_CX) < 50) {
      playing = !playing; lastTick = p.millis(); return;
    }
    if (Math.hypot(p.mouseX - DIAL_CX, p.mouseY - DIAL_CY) < DIAL_R + 16) {
      draggingDial = true; playing = false; updateDialFromMouse();
    }
  };
  p.mouseDragged = function () { if (draggingDial) updateDialFromMouse(); };
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