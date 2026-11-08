/* ---------- Dungeon ---------- */
const COLS = 7, ROWS = 10, S = 60;
let level, theme, grid, stage, px, py, role = "heil", done, burst = [], tries = 3;
let fx = { shield: false, reveal: false, skip: false }, lostHeart = false, runCustom = {}, potUsed = 0, startTries = 3, actUsed = new Set();
let POT_MAX = 2;
const MAX_TRIES = 3;
function paintLives() {
  let h = "Versuche:";
  for (let i = 0; i < Math.max(MAX_TRIES, tries); i++) h +=` <span class="h${i < tries ? "" : " off"}" aria-hidden="true">💛</span>`;
  $("lives").innerHTML = h + `<span class="sr" style="position:absolute;left:-9999px">${tries} von ${MAX_TRIES} übrig</span>`;
}
$("retry").addEventListener("click", () => { if (level.coop) level.resume = false; startLevel(level); if (level.coop) coopSync(true, true); });
$("failHome").addEventListener("click", () => leaveDungeon());
const cv = $("c"), ctx = cv.getContext("2d");
const say = h => { $("msg").innerHTML = riddleBox() + h; $("msg").scrollTop = 0; if (level && level.coop) { coopLog.push(String(h).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()); coopLog = coopLog.slice(-8); } };

const rolesEl = $("roles");
function buildRoles() {
  ROLES = [...BASE_ROLES, ...PET_ROLES.filter(p => rescued[p.from])];
  rolesEl.innerHTML = "";
  rolesEl.style.setProperty("--cols", ROLES.length);
  rolesEl.classList.toggle("compact", ROLES.length > 5);
  ROLES.forEach(r => {
    const b = document.createElement("button");
    b.type = "button"; b.className = "role"; b.id = "role-" + r.id;
    b.innerHTML = `<span class="ic" aria-hidden="true">${r.ic}</span>${cosOf(r.id) ? `<span class="cos" aria-hidden="true">${cosOf(r.id).ic}</span>` : ""}<span class="nm">${r.nm}</span><span class="rl">${r.rl}</span>${RUNE[r.id] ? `<span class="rn" title="Runenzeichen">${RUNE[r.id]}</span>` : ""}`;
    if (HP && HP.stam[r.id] != null) { b.insertAdjacentHTML("beforeend", `<span class="stam${HP.stam[r.id] ? "" : " out"}" title="So oft kann ${r.nm} hier noch helfen">${HP.stam[r.id] ? "💪" + HP.stam[r.id] : "😴"}</span>`); if (!HP.stam[r.id]) b.classList.add("tired"); }
    if (HOVER) { const idx = ROLES.indexOf(r) + 1; b.insertAdjacentHTML("beforeend", `<span class="kb">${keyLabel("r" + idx)}</span>`); }
    const theirs = level && level.coop && !myRoles().includes(r.id);
    if (theirs) { b.classList.add("theirs"); b.insertAdjacentHTML("beforeend", `<span class="who" title="Das steuert ${seatName(seatOfRole(r.id))}">${seatIcon(seatOfRole(r.id))}</span>`); }
    b.addEventListener("click", () => {
      if (theirs) { const st = seatOfRole(r.id); say(st === "host" ? `🧙 <b>${r.nm}</b> steuert im Koop der Spieler, der das Spiel erstellt hat.` : `${seatIcon(st)} <b>${r.nm}</b> steuert im Koop ${seatName(st)}. ${/claude/i.test(seatName(st)) ? `Schreib Claude im Chat, was ${r.nm} machen soll!` : "Warte, bis dein Mitspieler zieht."}`); return; }
      role = r.id; paintRoles(); say(`<b>${r.nm}</b> ist bereit (${r.rl}).`);
    });
    rolesEl.appendChild(b);
  });
}
function paintRoles() { ROLES.forEach(r => $("role-" + r.id).setAttribute("aria-pressed", String(r.id === role))); }

function startLevel(l) {
  try { stopWalk(); } catch (e) {}
  // Schon gerettetes Tier: Beim erneuten Besuch wartet ein Dankeschön statt des Tieres
  if (!l.replay && !l.resume && !l.coop && !l.fest && !l.daily && !l.timed && !l.farm && !l.superD && !l.weaver && !l.secret && l.id && rescued[l.id] && l.animalName) {
    l = { ...l, replay: true, thanks: { ic: l.animal, nm: l.animalName, who: l.who }, animalTile: null, animal: "🎁", animalName: "Dankeschön", ring: "#f2c76b",
      intro: `${l.name}: Hier hast du ${akk(l.who)} schon gerettet. ${({ Der: "Er", Die: "Sie", Das: "Es" })[l.who.split(" ")[0]] || "Es"} wohnt jetzt bei dir, aber am Ende des Weges hat ${({ Der: "er", Die: "sie", Das: "es" })[l.who.split(" ")[0]] || "es"} dir zum Dank ein <b>🎁 Geschenk</b> versteckt.`,
      animalHint: "Ein kleines Geschenk mit einer Schleife, von einem Zauber verschnürt. Deine Hände öffnen es." };
  }
  level = l; theme = THEMES[l.theme];
  buildRoles();
  // Mondtal beim ersten Mal wie gebaut, danach (und überall sonst) jedes Mal neu
  const run = l.gen && !l.resume && (!l.fixedFirst || rescued[l.id]) ? randomMap(l) : { map: l.map, custom: l.custom || {} };
  grid = run.map.map(r => r.split("")); runCustom = run.custom;
  stage = {};
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] === "P") { px = x; py = y; grid[y][x] = "."; }
  // Samenfunde: bei jedem Besuch neu verteilt, so kann man sie farmen
  const free = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] === "." && !(x === px && y === py)) free.push([x, y]);
  const TF = l.fair ? { time: 0, seedSpots: 0, shield: 0, bright: 0, heart: 0, loot: 0, garden: 0, gardenSeed: 0, rareFind: 0, reveal: 0, freeze: 0, burn: 0 } : teamFx();
  // Samenfunde sind selten: in normalen Abenteuern nur manchmal einer, im Kräuterpfad zwei bis drei
  for (let n = l.resume || l.noSeeds ? 0 : (l.farm ? (l.farmCfg ? l.farmCfg.spots[0] + Math.floor(Math.random() * (l.farmCfg.spots[1] - l.farmCfg.spots[0] + 1)) : 2) : (Math.random() < 0.35 ? 1 : 0)) + (l.secret ? 1 : 0) + TF.seedSpots; n > 0 && free.length; n--) {
    const [sx, sy] = free.splice(Math.floor(Math.random() * free.length), 1)[0]; grid[sy][sx] = "S";
  }
  hardSetup(l);
  done = false; burst = []; role = "heil"; buildRoles(); paintRoles();
  $("win").hidden = true; $("fail").hidden = true; $("failText").textContent = FAIL_HEARTS;
  try { chatSetup(l.coop); } catch (e) {}
  $("shouts").hidden = !l.coop || (!!DB && !guestMode); if (l.coop && !$("shouts").hidden) buildShouts();
  $("timer").hidden = !l.timed; if (l.timed) { if (timerId) { clearInterval(timerId); timerId = null; } timeLeft = l.limit + TF.time; }
  POT_MAX = l.fair ? 2 : potMaxFor(heroLvl());
  tries = MAX_TRIES + TF.heart + (l.fair ? 0 : heartBonus(heroLvl())); startTries = tries; actUsed = new Set(); paintLives();
  fx = { shield: TF.shield, reveal: !!TF.reveal, skip: false, bright: !!TF.bright, seedx2: false, loot: false }; lostHeart = false; potUsed = 0; renderPotbar();
  if (TF.burn) for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] === "T") grid[y][x] = ".";
  if (TF.freeze) { let left = TF.freeze; for (let y = ROWS - 1; y >= 0 && left; y--) for (let x = 0; x < COLS && left; x++) if ("WU".includes(grid[y][x])) { grid[y][x] = "B"; left--; } }
  const tb = $("teamBar"); tb.innerHTML = ""; tb.className = "potbar fxsum";
  const parts = fxParts(TF);
  if (parts.length) { tb.appendChild(el("span", null, "Dauerhaft dank deiner Tiere:")); parts.forEach(t => tb.appendChild(el("span", "chip", t))); }
  renderActs();
  $("dTitle").textContent = l.name;
  $("back").textContent = "Zurück";
  placeDiary(l); placeGem(l);
  say(l.intro + (HP && HP.note ? HP.note : "")); tellRiddle();
  showDungeon();
}

// Welches echte Hindernis zu welchem Begleiter gehört
const visOf = (r, i) => ({ schutz: i % 2 ? "R" : "T", spur: "H", bau: "W", licht: "D", fuchs: "G", otter: "U" })[r] || "T";
const VIS_NAME = { T: "Dornenranken", R: "ein schwerer Felsbrocken", H: "ein Nebel voller Spuren", W: "fließendes Wasser", D: "eine Schattenwand", G: "eine Hecke mit einem winzigen Spalt", U: "ein tiefer Seerosenteich" };
function getObst(t, k) {
  if (t === "V") { const f = wForm(k) || "T", O = OBST[f]; return { ...O, wform: f, hint: O.hint + `<br><span style="color:var(--muted)">🔄 Dieses Feld verwandelt sich alle 3 Schritte.</span>` }; }
  if (t === "A") return { needs: ["heil"], animal: true, hint: level.animalHint, solve: ["Du legst die Hände auf den Zauber. Er zerfällt zu Glitzerstaub …"] };
  if (t === "Q") {
    // Verwunschenes Feld: mehrere echte Hindernisse liegen hintereinander
    const seq = runCustom[k], vis = seq.map((r, i) => visOf(r, i));
    const part = i => `<br><span style="color:var(--muted)">Verwunschenes Feld: Teil ${i + 1} von ${seq.length}</span>`;
    return {
      needs: seq, after: ".",
      hint: OBST[vis[0]].hint + part(0),
      solve: seq.map((r, i) => OBST[vis[i]].solve[0] + (i === seq.length - 1 ? " Der Zauber löst sich, das Feld ist frei!" : `<br>Doch dahinter wartet schon das Nächste: <b>${VIS_NAME[vis[i + 1]]}</b>. (noch ${seq.length - i - 1})`)),
      midFn: step => OBST[vis[step]].hint + part(step)
    };
  }
  return OBST[t];
}

function tryStep(tx, ty) {
  if (level && level.coop && guestMode) { if (!(tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS)) guestAct(tx, ty); return; }
  if (!level || done) return;
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return;
  if (Math.abs(tx - px) + Math.abs(ty - py) !== 1) { say("Tippe auf ein Feld <b>direkt neben</b> dir."); return; }
  const t = grid[ty][tx];
  if (t === "S") {
    px = tx; py = ty; grid[ty][tx] = "."; sparkle(tx, ty); SND.fx.seed();
    const k2 = rollDrop(level.secret ? 0.3 : teamFx().rareFind ? 0.25 : 0.1); add(H.seeds, k2, fx.seedx2 ? 2 : 1); saveH();
    say(`🌱 Du findest Samen: <b>${fx.seedx2 ? "2× " : ""}${HERBS[k2].ic} ${HERBS[k2].nm}</b>!${HERBS[k2].rare ? " Ein seltener Fund ✨" : ""}`);
    afterMove(); return;
  }
  if (t === "." || t === "B") { px = tx; py = ty; SND.fx.step(); checkDiary(); checkGem(); afterMove(); return; }
  if (t === "#") { say(WALL_MSG[level.wall]); return; }
  if (t === "~") { say(WALL_MSG.lake); return; }
  const k = tx + "," + ty, o = getObst(t, k); if (!o) return;
  if (fx.skip > 0 && !o.animal) {
    fx.skip--; say("🌫️ Wie von Zauberhand öffnet sich der Weg."); sparkle(tx, ty); SND.fx.solve("licht"); tileAnim(tx, ty, "magic", t);
    grid[ty][tx] = o.after; delete stage[k]; return;
  }
  const step = stage[k] || 0, need = o.needs[step], vt = o.wform || t;
  const alt = role !== need && BASIC.includes(vt) && altOk(vt, role);
  if (role === need || alt) {
    if (HP && role !== "heil" && HP.stam[role] != null && HP.stam[role] <= 0) {
      const others = (BASIC.includes(vt) && HP.mech.has("alt") ? ALT[vt] : [need]).filter(r => r !== role && ROLES.some(q => q.id === r) && (HP.stam[r] == null || HP.stam[r] > 0));
      say(`😴 <b>${ROLE[role].nm}</b> ist zu müde und kann in diesem Dungeon nicht mehr helfen. ` + (others.length ? `Vielleicht schafft ${others.map(r => ROLE[r].nm).join(" oder ")} dieses Hindernis?` : `Hier kommt leider keiner mehr weiter. Tippe auf <b>Zurück</b> und versuch es mit einem neuen Plan noch einmal. Tipp: Spar die Kraft der Begleiter auf, die nur sie selbst einsetzen können.`)); return;
    }
    if (HP && role !== "heil" && HP.stam[role] != null) { HP.stam[role]--; buildRoles(); paintRoles(); }
    say(alt ? ALT_SOLVE[vt + ":" + role] : o.solve[step]); sparkle(tx, ty); SND.fx.solve(role);
    const last = step + 1 >= o.needs.length;
    tileAnim(tx, ty, role, t === "Q" ? visOf(need, step) : t === "V" ? vt : (last && !o.animal ? t : null));
    if (!last) { stage[k] = step + 1; return; }
    if (o.animal) { rescue(); return; }
    grid[ty][tx] = t === "V" ? OBST[vt].after : o.after; delete stage[k];
    if (HP) { HP.veil.delete(k); delete HP.wander[k]; }
    if (o.target) {
      let n = 0;
      for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] === o.target && !stage[x + "," + y]) { grid[y][x] = OBST[o.target].after; tileAnim(x, y, need, o.target); if (HP) HP.veil.delete(x + "," + y); n++; }
      $("msg").innerHTML += ` <span style="color:var(--muted)">(${n} Felder auf einmal!)</span>`;
    }
    if (HP && role !== "heil" && HP.stam[role] === 0) $("msg").innerHTML += `<br>😴 ${ROLE[role].nm} ist jetzt erschöpft.`;
  } else {
    const veiled = HP && HP.veil.has(k);
    const base = veiled ? `❔ Das verhüllte Feld flüstert: <i>${RIDDLE[t]}</i>` : step > 0 ? (o.midFn ? o.midFn(step) : o.mid || o.hint) : o.hint;
    const who = role === "heil" ? "Du kannst" : ROLE[role].nm + " kann";
    if (fx.shield > 0) {
      fx.shield--;
      say(`${base} <br><span style="color:var(--muted)">${who} hier nicht helfen, aber du bist geschützt 🛡️. Kein Herz verloren.</span>`);
      return;
    }
    tries--; lostHeart = true; paintLives(); if (tries > 0) SND.fx.wrong();
    if (tries <= 0) {
      done = true;
      say(`${who} hier leider nicht helfen. Der Nebel wird dichter …`);
      setTimeout(() => { $("fail").hidden = false; }, reduce ? 0 : 900);
      return;
    }
    say(`${base} <br><span style="color:var(--muted)">${who} hier gerade nicht helfen. Noch ${tries} ${tries === 1 ? "Versuch" : "Versuche"}.</span>`);
  }
}

// Extra-Belohnung, wenn man kein Herz verloren hat
function perfectBonus(noSeed) {
  if (lostHeart) return "";
  const b = noSeed ? [] : [rollDrop(0.3)]; b.forEach(k => add(H.seeds, k));
  H.stars = H.stars || {};
  const firstStar = !H.stars[level.id]; H.stars[level.id] = true; saveH();
  let txt = noSeed ? (firstStar ? `<br><br>💛 <b>Alle Herzen behalten!</b> Dafür bekommst du trotzdem den ⭐ für dieses Abenteuer.` : "") : `<br><br>💛 <b>Alle Herzen behalten!</b> Extra-Belohnung: ${b.map(k => HERBS[k].ic + " " + HERBS[k].nm + (HERBS[k].rare ? " (selten!)" : "")).join(", ")} als Samen` + (firstStar ? " und ein ⭐ für dieses Abenteuer." : ".");
  // Alle Sterne eines Ortes: einmalige Sternentruhe
  const s = getSettlement(cur); H.starOrt = H.starOrt || {};
  if (!level.secret && !H.starOrt[s.n] && s.levels.every(l => H.stars[l.id])) {
    H.starOrt[s.n] = true;
    const rares = [0, 1].map(() => RARE_SEEDS[Math.floor(Math.random() * RARE_SEEDS.length)]);
    rares.forEach(k => add(H.seeds, k));
    const pot = ["sonnen", "tulpen", "kleeg"][Math.floor(Math.random() * 3)];
    add(H.potions, "herz"); add(H.potions, pot); saveH();
    txt += `<br><br>🌟 <b>Alle 3 Sterne in ${s.name}!</b> Du öffnest die <b>Sternentruhe</b>: ${rares.map(k => HERBS[k].ic + " " + HERBS[k].nm).join(", ")} als seltene Samen, dazu ${POTIONS.herz.ic} ${POTIONS.herz.nm} und ${POTIONS[pot].ic} ${POTIONS[pot].nm}. Über ${s.name} leuchtet jetzt für immer ein goldener Stern.`;
  }
  return txt;
}
const RESCUE_CHANCE = 0.20, RESCUE_PITY = 6;
function farmLevel(s) {
  const keys = Object.keys(THEMES), tk = keys[Math.floor(Math.random() * keys.length)], th = THEMES[tk];
  const F = typeof farmSel !== "undefined" ? farmSel : { count: 4, herbs: [4, 6], spots: [2, 3] };
  return { id: "farm-" + s.n, farm: true, farmCfg: F, baseOnly: true, name: `🌿 Kräuterpfad: ${th.art} ${PREFIX[Math.floor(Math.random() * PREFIX.length)]}${th.noun}`, ic: "🌿", theme: tk, wall: th.wall, mode: 0,
    animal: "🧺", animalName: "Kräuterkorb", who: "Der Kräuterkorb", ring: "#8fe0ad", gen: { count: F.count, tier: 0 },
    intro: "🌿 <b>Kräuterpfad:</b> Ein gemütlicher, einfacher Weg. Hier wachsen überall Kräuter. Sammle die 🌱 Samenfunde ein und hol dir am Ende den Kräuterkorb.",
    animalHint: "Ein Korb voller frischer Kräuter, mit einem kleinen Zauber verschlossen. Deine Hände öffnen ihn." };
}
function farmWin() {
  done = true;
  const pool = SEED_POOL, got = {};
  const fc = level.farmCfg || { herbs: [2, 3] };
  for (let i = 0; i < fc.herbs[0] + Math.floor(Math.random() * (fc.herbs[1] - fc.herbs[0] + 1)); i++) { const h = pool[Math.floor(Math.random() * pool.length)]; got[h] = (got[h] || 0) + 1; add(H.herbs, h); }
  const sd = Math.random() < 0.25 ? rollDrop(0.1) : null; if (sd) add(H.seeds, sd); if (Math.random() < 0.2) gemAdd(1); saveH();
  $("winIcon").textContent = "🧺"; $("winTitle").textContent = "Kräuterkorb geöffnet!";
  $("winText").innerHTML = `Der Korb ist voller frischer Kräuter:<br>${Object.entries(got).map(([h, n]) => `${n}× ${HERBS[h].ic} ${HERBS[h].nm}`).join(", ")}${sd ? `<br>Dazu ein Samen: ${HERBS[sd].ic} ${HERBS[sd].nm}.` : ""}<br><br>Die Kräuter liegen schon in deiner Kräutertasche, bereit zum Brauen ⚗️`;
  $("home").textContent = "Zurück";
  setTimeout(() => { $("win").hidden = false; }, reduce ? 0 : 900);
}
function escapeWin(n) {
  done = true; window.__escaped = true;
  const s = getSettlement(cur), g = Math.random() < 0.35 ? rollDrop(0.1) : null; if (g) add(H.seeds, g); saveH();
  const left = RESCUE_PITY - n;
  $("winIcon").textContent = "🌫️";
  $("winTitle").textContent = "Fast geschafft …";
  $("winText").innerHTML = `Du legst die Hände auf den Zauber. Er flackert und knistert, doch ${level.who.replace(/^D/, "d")} erschrickt und huscht zurück in den Nebel.<br><br>Der Zauber lässt sich nur mit Glück lösen (20 % Chance). ${left > 0 ? `Gib nicht auf! Spätestens nach ${left} weiteren ${left === 1 ? "Versuch" : "Versuchen"} klappt es ganz sicher.` : "Beim nächsten Mal klappt es ganz sicher!"}${g ? `<br><br>🎁 Als Trost: ${HERBS[g].ic} ${HERBS[g].nm} als Samen.` : ""}` + perfectBonus(true);
  $("home").textContent = `Zurück nach ${s.name}`;
  setTimeout(() => { $("win").hidden = false; }, reduce ? 0 : 1100);
}
function replayWin() {
  done = true;
  const s = getSettlement(cur), T = level.thanks, roll = Math.random();
  let inside;
  if (roll < 0.45) inside = "Das Geschenk ist leer, nur ein kleiner Zettel liegt darin: <i>„Danke, dass du mich besuchst!“</i> 💌";
  else if (roll < 0.85) { const f = addFood(1)[0]; inside = `Im Geschenk liegt ${FOODS[f].ic} ${FOODS[f].nm} für die Lichtung.`; }
  else if (roll < 0.93) { const pk = Object.keys(POTIONS).filter(k => !POTIONS[k].rare)[Math.floor(Math.random() * 4)]; add(H.potions, pk); inside = `Im Geschenk liegt ein Trank: ${POTIONS[pk].ic} ${POTIONS[pk].nm}.`; }
  else { H.gems = (H.gems || 0) + 1; inside = "Im Geschenk funkelt ein 💎 Diamant!"; }
  saveH();
  $("winIcon").textContent = T.ic;
  $("winTitle").textContent = `Ein Dankeschön ${T.who.replace(/^Der /, "vom ").replace(/^Das /, "vom ").replace(/^Die /, "von der ")}!`;
  $("winText").innerHTML = `${T.who} wohnt schon bei dir und freut sich, dass du noch einmal vorbeikommst. ${inside}` + perfectBonus() + weaverHint();
  $("home").textContent = `Zurück nach ${s.name}`;
  setTimeout(() => { $("win").hidden = false; }, reduce ? 0 : 1100);
}
function rescue() {
  if (level.replay) { replayWin(); return; }
  if (level.coop) { coopWin(); return; }
  if (level.farm) { farmWin(); return; }
  if (level.weaver) { weaverWin(); return; }
  if (level.daily) { dailyWin(); return; }
  if (level.fest) { festWin(); return; }
  if (level.timed) { timeWin(); return; }
  if (level.superD) { superWin(); return; }
  const wasOpen = secretOpen(getSettlement(cur));
  if (!lostHeart) { statsOf(cur).perfect = true; saveH(); }
  if (level.secret) { secretWin(); return; }
  // Nur mit 20 % Glück lässt sich der Zauber beim ersten Mal lösen. Nach 6 Fehlversuchen klappt es sicher.
  H.tryRescue = H.tryRescue || {};
  const fails = H.tryRescue[level.id] || 0;
  if (!rescued[level.id] && !(Math.random() < RESCUE_CHANCE || fails >= RESCUE_PITY)) { H.tryRescue[level.id] = fails + 1; saveH(); escapeWin(fails + 1); return; }
  delete H.tryRescue[level.id];
  done = true; rescued[level.id] = true; save();
  const foodGot = addFood(2);
  const s = getSettlement(cur), pet = PET_ROLES.find(p => p.from === level.id);
  let text = `${level.who} folgt dir zurück nach ${s.name} und zieht ${level.home} ein.`;
  const gift = Array.from({ length: (fx.loot ? 2 : 1) + teamFx().loot }, () => rollDrop()); gift.forEach(k => add(H.seeds, k)); saveH();
  text += `<br><br>🎁 Zufällige Belohnung: ${gift.map(k => HERBS[k].ic + " " + HERBS[k].nm + (HERBS[k].rare ? " (selten!)" : "")).join(", ")} als Samen.`;
  text += perfectBonus();
  text += weaverHint(); if (Math.random() < 0.15) gemAdd(1);
  if (!wasOpen && secretOpen(s)) text += `<br><br>🗝️ Alle Geheimaufgaben erfüllt! <b>${getSecret(s.n).name}</b> ist jetzt offen.`;
  text += `<br>🧺 Für die Tierlichtung: ${foodGot.map(k => FOODS[k].ic + " " + FOODS[k].nm).join(", ")}.`;
  if (pet) text += `<br><br>Ab jetzt hilft dir <b>${pet.nm}</b> als ${pet.rl}!`;
  if (isDone(s)) {
    const nx = getSettlement(s.n + 1), first = nx.tier !== s.tier && TIERS[nx.tier].first;
    text += `<br><br>🌟 Alle Tiere in ${s.name} sind gerettet! Ein neuer Weg ist frei: <b>${nx.name}</b>` + (first ? `, ${first}!` : ".");
  }
  $("winIcon").textContent = level.animal;
  $("winTitle").textContent = `${level.who} ist frei!`;
  $("winText").innerHTML = text;
  $("home").textContent = `Zurück nach ${s.name}`;
  setTimeout(() => { $("win").hidden = false; }, reduce ? 0 : 1100);
}

function sparkle(x, y) {
  for (let i = 0; i < 26; i++) burst.push({ x: x + .5, y: y + .5, vx: (Math.random() - .5) * .08, vy: (Math.random() - .5) * .08 - .02, life: 1 });
}

/* ---------- Weiter laufen: bis zum nächsten Hindernis oder zur nächsten Abzweigung ---------- */
const FREE = ".BSP";
const isFree = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && FREE.includes(grid[y][x]);
const isObst = (x, y) => x >= 0 && y >= 0 && x < COLS && y < ROWS && !FREE.includes(grid[y][x]) && !"#~".includes(grid[y][x]);
const NB = [[0, -1], [1, 0], [0, 1], [-1, 0]];
// Weg durch einen Gang: läuft geradeaus, folgt Kurven und hält an Abzweigungen oder vor Hindernissen
function runSteps(sx, sy, dx, dy) {
  const steps = []; let x = sx, y = sy, px0 = null, py0 = null;
  for (let n = 0; n < 40; n++) {
    let nx = x + dx, ny = y + dy;
    if (!isFree(nx, ny)) {
      if (!steps.length) return steps;
      const opts = NB.filter(([ax, ay]) => isFree(x + ax, y + ay) && !(x + ax === px0 && y + ay === py0));
      if (opts.length !== 1) break;
      [dx, dy] = opts[0]; nx = x + dx; ny = y + dy;
    }
    px0 = x; py0 = y; x = nx; y = ny; steps.push([x, y]);
    if (NB.some(([ax, ay]) => isObst(x + ax, y + ay))) break;
    const ways = NB.filter(([ax, ay]) => isFree(x + ax, y + ay) && !(x + ax === px0 && y + ay === py0));
    if (ways.length !== 1) break;
  }
  return steps;
}
// Kürzester Weg über freie Felder zu einem Ziel (bei einem Hindernis: bis direkt davor)
function pathTo(tx, ty) {
  const goalFree = isFree(tx, ty), goal = (x, y) => goalFree ? x === tx && y === ty : Math.abs(x - tx) + Math.abs(y - ty) === 1;
  if (goal(px, py)) return [];
  const prev = { [px + "," + py]: null }, q = [[px, py]];
  while (q.length) {
    const [x, y] = q.shift();
    for (const [ax, ay] of NB) {
      const nx = x + ax, ny = y + ay, k = nx + "," + ny;
      if (k in prev || !isFree(nx, ny)) continue;
      prev[k] = x + "," + y;
      if (goal(nx, ny)) { const out = []; let c = k; while (c && c !== px + "," + py) { out.unshift(c.split(",").map(Number)); c = prev[c]; } return out; }
      q.push([nx, ny]);
    }
  }
  return null;
}
let walkTimer = null;
function stopWalk() { if (walkTimer) { clearTimeout(walkTimer); walkTimer = null; } }
function walkSteps(steps, after) {
  stopWalk();
  const next = () => {
    walkTimer = null;
    if (!steps.length || done) { if (after) after(); return; }
    const [x, y] = steps.shift(), ox = px, oy = py;
    tryStep(x, y);
    if (px === ox && py === oy) { if (after) after(); return; }
    walkTimer = setTimeout(next, reduce ? 0 : 75);
  };
  next();
}
// Ein Tipp oder eine Taste: neben dir ein Hindernis → Begleiter einsetzen, sonst losgehen
function go(tx, ty) {
  if (!level || done) return;
  if (tx < 0 || ty < 0 || tx >= COLS || ty >= ROWS) return;
  if (level.coop && guestMode) { guestAct(tx, ty); return; }
  const dist = Math.abs(tx - px) + Math.abs(ty - py);
  if (dist === 0) return;
  if (dist === 1) { stopWalk(); tryStep(tx, ty); return; }
  const steps = pathTo(tx, ty);
  if (steps === null) { say(isObst(tx, ty) ? "Zu diesem Hindernis führt gerade kein freier Weg. Räum zuerst die Hindernisse vor dir weg." : "Dahin führt gerade kein freier Weg."); return; }
  if (!steps.length) { if (dist === 1) tryStep(tx, ty); return; }
  walkSteps(steps);
}
cv.addEventListener("click", e => {
  const r = cv.getBoundingClientRect();
  go(Math.floor((e.clientX - r.left) / r.width * COLS), Math.floor((e.clientY - r.top) / r.height * ROWS));
});
