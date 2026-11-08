/* ---------- Zeichnen ---------- */
function tree(x, y, t, seed) {
  const cx = x * S + S / 2, by = y * S + S * .9;
  ctx.fillStyle = "#14201d"; ctx.fillRect(x * S, y * S, S, S);
  const sway = reduce ? 0 : Math.sin(t / 1400 + seed) * 1.5;
  ctx.fillStyle = "#0c1614";
  ctx.beginPath(); ctx.moveTo(cx + sway, y * S + 4); ctx.lineTo(cx + S * .42, by); ctx.lineTo(cx - S * .42, by); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#1f3a30";
  ctx.beginPath(); ctx.moveTo(cx + sway, y * S + 12); ctx.lineTo(cx + S * .3, by - 10); ctx.lineTo(cx - S * .3, by - 10); ctx.closePath(); ctx.fill();
  if (seed % 3 === 0) {
    ctx.fillStyle = "#7fd6c8"; ctx.shadowColor = "#7fd6c8"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.arc(x * S + 12, y * S + S - 8, 3.5, Math.PI, 0); ctx.fill(); ctx.shadowBlur = 0;
  }
}
function rock(x, y, t, seed) {
  ctx.fillStyle = "#16181f"; ctx.fillRect(x * S, y * S, S, S);
  ctx.fillStyle = "#23262f"; ctx.beginPath(); ctx.ellipse(x * S + S * .35, y * S + S * .62, S * .3, S * .25, 0, 0, 7); ctx.fill();
  ctx.fillStyle = "#2c303a"; ctx.beginPath(); ctx.ellipse(x * S + S * .68, y * S + S * .36, S * .24, S * .2, 0, 0, 7); ctx.fill();
  if (seed % 4 === 0) {
    const a = reduce ? .8 : .5 + .3 * Math.sin(t / 700 + seed);
    ctx.fillStyle = `rgba(159,216,255,${a})`; ctx.shadowColor = "#9fd8ff"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(x * S + 14, y * S + 22); ctx.lineTo(x * S + 19, y * S + 34); ctx.lineTo(x * S + 9, y * S + 34); ctx.closePath(); ctx.fill(); ctx.shadowBlur = 0;
  }
}
function path(x, y, seed) {
  ctx.fillStyle = theme.path[0]; ctx.fillRect(x * S, y * S, S, S);
  ctx.fillStyle = theme.path[1];
  ctx.beginPath(); ctx.ellipse(x * S + S / 2 + (seed % 5) - 2, y * S + S / 2, S * .34, S * .28, seed, 0, Math.PI * 2); ctx.fill();
}
function lake(x, y, t, seed) {
  ctx.fillStyle = "#12253d"; ctx.fillRect(x * S, y * S, S, S);
  const a = reduce ? .25 : .15 + .15 * Math.sin(t / 900 + seed);
  ctx.strokeStyle = `rgba(150,190,230,${a})`; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x * S + 10, y * S + 20 + seed % 9); ctx.lineTo(x * S + 28, y * S + 20 + seed % 9); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(x * S + 30, y * S + 42); ctx.lineTo(x * S + 50, y * S + 42); ctx.stroke();
}
function stream(x, y, t, bridge) {
  ctx.fillStyle = "#1c3a5c"; ctx.fillRect(x * S, y * S + 6, S, S - 12);
  ctx.strokeStyle = "#5f93c7"; ctx.lineWidth = 2;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    for (let k = 0; k <= S; k += 6) { const yy = y * S + 16 + i * 14 + Math.sin((k + (reduce ? 0 : t / 60) + i * 20) / 8) * 2; k ? ctx.lineTo(x * S + k, yy) : ctx.moveTo(x * S + k, yy); }
    ctx.stroke();
  }
  if (bridge) { ctx.fillStyle = "#7a5634"; for (let i = 0; i < 5; i++) ctx.fillRect(x * S + 8 + i * 9, y * S + 4, 6, S - 8); ctx.fillStyle = "#5c3f25"; ctx.fillRect(x * S + 4, y * S + S / 2 - 3, S - 8, 6); }
}
function boulder(cx, cy, t, still) {
      // Großer Felsbrocken: hell, mit Umriss, Rissen und Moos. Er wackelt leicht, als wolle er gleich rollen.
      const tt = reduce || still ? 0 : t, wob = Math.sin(tt / 380) * 0.07 * (Math.sin(tt / 2300) > 0.3 ? 1 : 0.25), lift = Math.abs(Math.sin(tt / 380)) * (Math.sin(tt / 2300) > 0.3 ? 2 : 0);
      ctx.save();
      ctx.fillStyle = "rgba(0,0,0,.4)"; ctx.beginPath(); ctx.ellipse(cx, cy + 20, 23 - lift, 6, 0, 0, 7); ctx.fill();
      ctx.translate(cx, cy + 18); ctx.rotate(wob); ctx.translate(0, -18 - lift);
      const rk = new Path2D("M-24 14 C-27 2 -22 -12 -10 -19 C0 -25 14 -22 21 -13 C27 -5 27 8 22 15 C14 21 -16 22 -24 14 Z");
      const gr = ctx.createLinearGradient(-20, -22, 18, 20); gr.addColorStop(0, "#c9c2b4"); gr.addColorStop(.45, "#9a9384"); gr.addColorStop(1, "#5e5a52");
      ctx.fillStyle = gr; ctx.fill(rk);
      ctx.lineWidth = 2.5; ctx.strokeStyle = "#2a2722"; ctx.stroke(rk);
      ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.beginPath(); ctx.ellipse(-9, -11, 8, 4, -.5, 0, 7); ctx.fill();
      ctx.strokeStyle = "#3d3a33"; ctx.lineWidth = 1.6; ctx.lineCap = "round";
      ctx.beginPath(); ctx.moveTo(4, -18); ctx.lineTo(1, -8); ctx.lineTo(7, -1); ctx.lineTo(4, 8); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-15, 4); ctx.lineTo(-8, 8); ctx.stroke();
      ctx.fillStyle = "#5fa860"; ctx.beginPath(); ctx.ellipse(12, -15, 9, 4, .35, 0, 7); ctx.fill();
      ctx.fillStyle = "#7cc477"; ctx.beginPath(); ctx.ellipse(10, -17, 4, 2, .35, 0, 7); ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#8d877b"; [[-22, 20, 3], [24, 19, 2.5], [18, 23, 2]].forEach(([dx, dy, r]) => { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, r, 0, 7); ctx.fill(); });
      if (lift > 1.5 && !reduce) { ctx.fillStyle = "rgba(210,200,180,.35)"; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(cx - 20 + i * 20, cy + 22 - lift * 2, 2.5, 0, 7); ctx.fill(); } }
}
function animalTile(cx, cy, t, emoji, ring) {
  ctx.fillStyle = "#06080e"; ctx.beginPath(); ctx.arc(cx, cy, 25, 0, 7); ctx.fill();
  ctx.strokeStyle = ring; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, 24, 0, 7); ctx.stroke();
  ctx.shadowColor = ring; ctx.shadowBlur = reduce ? 14 : 10 + 8 * Math.sin(t / 400);
  ctx.font = "30px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(emoji, cx, cy + 2); ctx.shadowBlur = 0;
}

/* ---------- Feld-Animationen beim Lösen ---------- */
let anims = [];
function tileAnim(x, y, kind, from) {
  if (reduce) return;
  anims = anims.filter(a => !(a.x === x && a.y === y));
  anims.push({ x, y, kind, from: from || null, t0: performance.now(), dur: 1300 });
}
function drawAnims(now) {
  anims = anims.filter(a => now - a.t0 < a.dur);
  anims.forEach(a => {
    const p = (now - a.t0) / a.dur, cx = a.x * S + S / 2, cy = a.y * S + S / 2, role = ROLE[a.kind];
    ctx.save(); ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const fade = p < .7 ? 1 : (1 - p) / .3;
    if (a.kind === "licht") {
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 12 + p * 40);
      g.addColorStop(0, `rgba(255,244,210,${.8 * fade})`); g.addColorStop(1, "rgba(255,244,210,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 12 + p * 40, 0, 7); ctx.fill();
      ctx.strokeStyle = `rgba(255,236,170,${fade})`; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, 6 + p * 36, 0, 7); ctx.stroke();
    }
    if (a.kind === "spur") {
      ctx.font = "13px serif";
      for (let i = 0; i < 4; i++) { const q = (p - i * .14) / .3; if (q <= 0) continue; ctx.globalAlpha = Math.min(1, q) * fade; ctx.fillText("🐾", cx - 18 + i * 12, cy + 18 - i * 12); }
    }
    if (a.kind === "schutz") {
      for (let i = 0; i < 7; i++) { const ang = i / 7 * Math.PI * 2, r = 8 + p * 26; ctx.fillStyle = `rgba(190,180,165,${.6 * fade})`;
        ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * r, cy + 12 + Math.sin(ang) * r * .45, 4 + p * 5, 0, 7); ctx.fill(); }
    }
    if (a.kind === "bau") {
      [0.15, 0.4, 0.65].forEach(h => { const q = (p - h) / .18; if (q < 0 || q > 1) return;
        ctx.strokeStyle = `rgba(242,199,107,${1 - q})`; ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) { const ang = i / 6 * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * 6, cy + 10 + Math.sin(ang) * 6); ctx.lineTo(cx + Math.cos(ang) * (8 + q * 14), cy + 10 + Math.sin(ang) * (8 + q * 14)); ctx.stroke(); } });
    }
    if (a.kind === "fuchs") {
      ctx.strokeStyle = `rgba(255,150,80,${fade})`; ctx.lineWidth = 3; ctx.lineCap = "round";
      for (let i = 0; i < 3; i++) { const sx = cx - 28 + p * 56; ctx.beginPath(); ctx.moveTo(sx - 18, cy - 10 + i * 10); ctx.lineTo(sx, cy - 10 + i * 10); ctx.stroke(); }
    }
    if (a.kind === "otter") {
      for (let i = 0; i < 3; i++) { const q = p - i * .15; if (q <= 0) continue; ctx.strokeStyle = `rgba(150,210,255,${(1 - q) * fade})`; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(cx, cy + 6, 6 + q * 30, 3 + q * 14, 0, 0, 7); ctx.stroke(); }
    }
    if (a.kind === "heil") {
      for (let i = 0; i < 9; i++) { const ang = i / 9 * Math.PI * 2 + p * 7, r = 6 + p * 22;
        ctx.fillStyle = i % 2 ? `rgba(143,224,173,${fade})` : `rgba(242,199,107,${fade})`;
        ctx.beginPath(); ctx.arc(cx + Math.cos(ang) * r, cy + Math.sin(ang) * r, 3, 0, 7); ctx.fill(); }
    }
    if (a.kind === "magic") {
      ctx.strokeStyle = `rgba(200,160,255,${fade})`; ctx.lineWidth = 2;
      for (let i = 0; i < 8; i++) { const ang = i / 8 * Math.PI * 2 + p; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * (4 + p * 10), cy + Math.sin(ang) * (4 + p * 10)); ctx.lineTo(cx + Math.cos(ang) * (10 + p * 26), cy + Math.sin(ang) * (10 + p * 26)); ctx.stroke(); }
    }
    // Der Begleiter erscheint kurz auf dem Feld
    if (role) {
      const sc = p < .18 ? (p / .18) * 1.25 : 1.25 - (p - .18) * .35;
      ctx.globalAlpha = p < .7 ? 1 : (1 - p) / .3;
      ctx.shadowColor = "#000"; ctx.shadowBlur = 8;
      const bob = a.kind === "schutz" ? Math.sin(p * 40) * 3 * (1 - p) : a.kind === "bau" ? -Math.abs(Math.sin(p * 14)) * 6 : 0;
      ctx.font = `${Math.round(26 * sc)}px serif`; ctx.fillText(role.ic, cx + bob, cy - 8 - p * 12);
      const cs = cosOf(a.kind); if (cs) { ctx.font = `${Math.round(15 * sc)}px serif`; ctx.fillText(cs.ic, cx + bob + 9 * sc, cy - 22 * sc - p * 12); }
      if (a.kind === "bau") { ctx.font = "16px serif"; ctx.fillText("🔨", cx + 14, cy - 18 + Math.abs(Math.sin(p * 14)) * 8); }
    }
    ctx.restore();
  });
}
function draw(t) {
  ctx.clearRect(0, 0, cv.width, cv.height);
  if (!level) return;
  const wallFn = level.wall === "lake" ? lake : level.wall === "rock" ? rock : tree;
  const cell = (c, x, y, noReveal) => {
    const seed = x * 7 + y * 13, cx = x * S + S / 2, cy = y * S + S / 2, k = x + "," + y;
    if (c === "V") { cell(wForm(k) || "T", x, y, noReveal); if (!noReveal) drawWander(x, y, t); return; }
    if (!noReveal && HP && HP.veil.has(k) && BASIC.includes(c)) { path(x, y, seed); drawVeil(cx, cy, t); return; }
    if (SWITCHES[c]) {
      path(x, y, seed);
      const g = ctx.createRadialGradient(cx, cy, 3, cx, cy, 26); g.addColorStop(0, `rgba(242,199,107,${reduce ? .35 : .25 + .15 * Math.sin(t / 500)})`); g.addColorStop(1, "rgba(242,199,107,0)");
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 26, 0, 7); ctx.fill();
      ctx.fillStyle = "#4a4f5e"; ctx.fillRect(cx - 14, cy + 8, 28, 10);
      ctx.font = "26px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(SWITCHES[c].ic, cx, cy - 4);
      if (OPT.clear) { ctx.font = "bold 9px sans-serif"; ctx.fillStyle = "#fff"; ctx.fillText({ D: "Schatten", R: "Felsen", W: "Wasser", H: "Spuren" }[SWITCHES[c].target] || "", cx, cy + 13); }
      return;
    }
    if (c === "#") wallFn(x, y, t, seed);
    else if (c === "~" || c === "O" || c === "U") lake(x, y, t, seed);
    else if (c === "W" || c === "B") stream(x, y, t, c === "B");
    else path(x, y, seed);

    if (c === "H") {
      // Pips Spurenfeld: heller Nebel mit vielen Spuren durcheinander
      for (let i = 0; i < 4; i++) {
        const ox = Math.sin((reduce ? 0 : t / 900) + i * 1.7) * 8, oy = Math.cos((reduce ? 0 : t / 1100) + i) * 6;
        const g = ctx.createRadialGradient(cx + ox, cy + oy, 2, cx + ox, cy + oy, 30);
        g.addColorStop(0, "rgba(220,230,255,.55)"); g.addColorStop(1, "rgba(200,210,230,0)");
        ctx.fillStyle = g; ctx.fillRect(x * S - 10, y * S - 10, S + 20, S + 20);
      }
      ctx.fillStyle = "#3b4658";
      [[-14, 14], [-6, 2], [6, -8], [14, 10], [-12, -14], [10, 18]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.ellipse(cx + dx, cy + dy, 2.5, 4, 0, 0, 7); ctx.fill(); });
    }
    if (c === "T") {
      ctx.strokeStyle = "#8a5bc7"; ctx.lineWidth = 3; ctx.lineCap = "round";
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * Math.PI * 2 + (reduce ? 0 : t / 3000);
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(cx + Math.cos(a) * 22, cy + Math.sin(a) * 4, cx + Math.cos(a + .6) * 26, cy + Math.sin(a + .6) * 26); ctx.stroke();
      }
      ctx.fillStyle = "#c79bf5";
      for (let i = 0; i < 6; i++) { const a = i + .3; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * 18, cy + Math.sin(a) * 18, 2, 0, 7); ctx.fill(); }
    }
    if (c === "D") {
      ctx.fillStyle = "#06080e"; ctx.fillRect(x * S, y * S, S, S);
      ctx.strokeStyle = "#3a2f5a"; ctx.lineWidth = 2;
      for (let i = 0; i < 3; i++) { const s0 = (reduce ? 0 : t / (700 + i * 200)) + i; ctx.beginPath(); ctx.arc(cx, cy, 8 + i * 7, s0, s0 + 2); ctx.stroke(); }
    }
    if (c === "R") boulder(cx, cy, t);
    if (c === "N") {
      const lit = (stage[k] || 0) > 0;
      for (let i = 0; i < 4; i++) {
        const ox = Math.sin((reduce ? 0 : t / 900) + i * 1.7) * 8, oy = Math.cos((reduce ? 0 : t / 1100) + i) * 6;
        const g = ctx.createRadialGradient(cx + ox, cy + oy, 2, cx + ox, cy + oy, 30);
        g.addColorStop(0, lit ? "rgba(220,230,255,.55)" : "rgba(200,210,230,.85)"); g.addColorStop(1, "rgba(200,210,230,0)");
        ctx.fillStyle = g; ctx.fillRect(x * S - 10, y * S - 10, S + 20, S + 20);
      }
      if (lit) {
        ctx.fillStyle = "#3b4658";
        [[-14, 14], [-6, 2], [6, -8], [14, 10], [-12, -14], [10, 18]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.ellipse(cx + dx, cy + dy, 2.5, 4, 0, 0, 7); ctx.fill(); });
      }
    }
    if (c === "G") {
      ctx.fillStyle = "#1a3324"; ctx.fillRect(x * S + 2, y * S + 6, S - 4, S - 12);
      ctx.fillStyle = "#24482f";
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x * S + 8 + i * 9, y * S + 12 + (i % 2) * 6, 8, 0, 7); ctx.fill(); }
      ctx.fillStyle = "#070b09"; ctx.fillRect(cx - 3, y * S + 22, 6, S - 30);
    }
    if (c === "U") {
      ctx.fillStyle = "#2f5a3a";
      [[-16, -12], [14, -6], [-8, 16]].forEach(([dx, dy]) => { ctx.beginPath(); ctx.arc(cx + dx, cy + dy, 7, .4, Math.PI * 2 - .1); ctx.lineTo(cx + dx, cy + dy); ctx.fill(); });
      ctx.fillStyle = "#e9b8d6"; ctx.beginPath(); ctx.arc(cx + 14, cy - 6, 2.5, 0, 7); ctx.fill();
    }
    if (c === "X") {
      const lit = stage[k] || 0;
      ctx.fillStyle = "#4a4f5e"; ctx.fillRect(x * S + 6, y * S + 10, 10, S - 12); ctx.fillRect(x * S + S - 16, y * S + 10, 10, S - 12);
      ctx.beginPath(); ctx.arc(cx, y * S + 18, S / 2 - 6, Math.PI, 0); ctx.lineTo(x * S + S - 16, y * S + 18); ctx.arc(cx, y * S + 18, S / 2 - 16, 0, Math.PI, true); ctx.fill();
      ctx.fillStyle = "#1c2030"; ctx.fillRect(x * S + 16, y * S + 18, S - 32, S - 20);
      for (let i = 0; i < 3; i++) {
        const on = i < lit;
        ctx.fillStyle = on ? "#f2c76b" : "#2c3140"; ctx.shadowColor = "#f2c76b"; ctx.shadowBlur = on ? 10 : 0;
        ctx.beginPath(); ctx.arc(x * S + 18 + i * 12, y * S + 12, 4, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
      }
    }
    if (c === "Q") {
      const seq = runCustom[k], st = stage[k] || 0;
      // Das aktuelle echte Hindernis zeigen, mit einem Hauch Zaubernebel
      const n = seq.length;
      if (st < n) { ctx.save(); cell(visOf(seq[st], st), x, y, true); ctx.restore(); }
      const pulse = reduce ? .5 : .5 + .5 * Math.sin(t / 500);
      const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, 34);
      g.addColorStop(0, "rgba(205,195,240,0)"); g.addColorStop(1, `rgba(205,195,240,${.18 + .12 * pulse})`);
      ctx.fillStyle = g; ctx.fillRect(x * S, y * S, S, S);
      ctx.strokeStyle = `rgba(180,140,242,${.45 + .35 * pulse})`; ctx.lineWidth = 2;
      ctx.strokeRect(x * S + 2, y * S + 2, S - 4, S - 4);
      // kleine Punkte: wie viele Schritte noch fehlen
      ctx.fillStyle = "#0b0f18aa"; ctx.fillRect(cx - n * 4 - 3, y * S + S - 13, n * 8 + 6, 10);
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = i < st ? "#5fd18c" : i === st ? "#f2c76b" : "#5a6070";
        ctx.beginPath(); ctx.arc(cx + (i - (n - 1) / 2) * 8, y * S + S - 8, 2.6, 0, 7); ctx.fill();
      }
    }
    if (c === "Z") animalTile(cx, cy, t, "🦌", "#f2c76b");
    if (c === "F") animalTile(cx, cy, t, "🦊", "#b48cf2");
    if (c === "O") animalTile(cx, cy, t, "🦦", "#9fd8ff");
    if (c === "A") animalTile(cx, cy, t, level.animal, level.ring);
    if (c === "S") {
      const g2 = ctx.createRadialGradient(cx, cy, 2, cx, cy, 20);
      g2.addColorStop(0, `rgba(143,224,173,${reduce ? .5 : .35 + .25 * Math.sin(t / 380 + seed)})`); g2.addColorStop(1, "rgba(143,224,173,0)");
      ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 7); ctx.fill();
      ctx.font = "22px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("🌱", cx, cy + 1);
    }
    if (!noReveal && fx.reveal && (c in OBST || c === "Q" || c === "A")) {
      const o = getObst(c, k), need = o && o.needs[stage[k] || 0];
      if (need) {
        ctx.fillStyle = "#0b0f18cc"; ctx.beginPath(); ctx.arc(x * S + S - 12, y * S + 12, 11, 0, 7); ctx.fill();
        ctx.font = "15px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(ROLE[need].ic, x * S + S - 12, y * S + 13);
      }
    }
  };
  const now = performance.now(), rolling = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) {
    cell(grid[y][x], x, y);
    // altes Feld blendet langsam aus
    const an = anims.find(a => a.x === x && a.y === y && a.from);
    if (an) { const p = (now - an.t0) / an.dur;
      if (an.from === "R") {
        // Bruno rollt den Felsbrocken weg: erst ruckeln, dann rollt er aus dem Feld
        const q = Math.max(0, (p - .15) / .7), shake = p < .15 ? Math.sin(p * 120) * 2.5 : 0, cx0 = x * S + S / 2, cy0 = y * S + S / 2;
        if (q < 1) rolling.push(() => { ctx.save(); ctx.globalAlpha = q < .6 ? 1 : 1 - (q - .6) / .4;
          ctx.translate(cx0 + shake + q * q * S * 1.1, cy0 + 4); ctx.rotate(q * q * 3.2); ctx.translate(-cx0, -cy0 - 4); boulder(cx0, cy0, now, true); ctx.restore(); });
      } else if (p < .75) { ctx.save(); ctx.globalAlpha = 1 - p / .75; cell(an.from, x, y, true); ctx.restore(); } }
  }
  rolling.forEach(f => f());
  drawDiary(t); drawGem(t);
  drawAnims(now);
  // Heilerin mit Laterne
  const lx = px * S + S / 2, ly = py * S + S / 2;
  const glow = ctx.createRadialGradient(lx, ly, 2, lx, ly, S * .55);
  const lc = lampCol(t), lg = lc.startsWith("hsl") ? lc.replace("hsl", "hsla").replace(")", ", .8)") : lc + "cc", lg0 = lc.startsWith("hsl") ? lc.replace("hsl", "hsla").replace(")", ", 0)") : lc + "00";
  glow.addColorStop(0, lg); glow.addColorStop(1, lg0);
  ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(lx, ly, S * .55, 0, 7); ctx.fill();
  ctx.fillStyle = "#3b2c5c"; ctx.beginPath(); ctx.moveTo(lx, ly - 18); ctx.lineTo(lx + 13, ly + 16); ctx.lineTo(lx - 13, ly + 16); ctx.closePath(); ctx.fill();
  ctx.fillStyle = "#f3dcc0"; ctx.beginPath(); ctx.arc(lx, ly - 6, 6, 0, 7); ctx.fill();
  ctx.fillStyle = lc; ctx.beginPath(); ctx.arc(lx + 12, ly + 4, 4, 0, 7); ctx.fill();
  if (level && level.coop && !DB) try { drawMates(lx, ly, t); } catch (e) {}

  // Nebel rund um die Laterne
  const fr = fx.bright ? 1.9 : 1;
  const fog = ctx.createRadialGradient(lx, ly, S * 1.7 * fr, lx, ly, S * 3.9 * fr);
  fog.addColorStop(0, "#0b0f1800"); fog.addColorStop(1, OPT.clear ? "#0b0f1890" : "#0b0f18d6");
  ctx.fillStyle = fog; ctx.fillRect(0, 0, cv.width, cv.height);
  if (!reduce) for (let i = 0; i < 4; i++) {
    const fx = ((t / (90 + i * 30)) + i * 120) % (cv.width + 200) - 100, fy = 80 + i * 140;
    const m = ctx.createRadialGradient(fx, fy, 5, fx, fy, 110);
    m.addColorStop(0, "#c9d3e614"); m.addColorStop(1, "#c9d3e600");
    ctx.fillStyle = m; ctx.fillRect(fx - 110, fy - 110, 220, 220);
  }
  burst = burst.filter(p => (p.life -= .015) > 0);
  burst.forEach(p => { p.x += p.vx; p.y += p.vy; ctx.fillStyle = `rgba(242,199,107,${p.life})`; ctx.beginPath(); ctx.arc(p.x * S, p.y * S, 2.5, 0, 7); ctx.fill(); });
}
function loop(t) { if (!$("dungeonView").hidden) { draw(t); if (level && level.fest) festFx(t); } requestAnimationFrame(loop); }

