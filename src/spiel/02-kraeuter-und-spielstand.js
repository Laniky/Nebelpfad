/* ---------- Kräuter und Tränke ---------- */
const HERBS = {
  mond:  { ic: "🌿", nm: "Mondkraut", time: "nacht",    from: "Samenfunde in Abenteuern, Dank von Tieren, Ernte" },
  tau:   { ic: "🍃", nm: "Tauwurz",      from: "Samenfunde in Abenteuern, Dank von Tieren, Ernte" },
  stern: { ic: "🌼", nm: "Sternblume",   from: "Samenfunde in Abenteuern, Dank von Tieren, Ernte" },
  sonne: { ic: "🌻", nm: "Sonnenkraut", time: "tag",  from: "Samenfunde in Abenteuern, Dank von Tieren, Ernte" },
  tulpe: { ic: "🌷", nm: "Mondtulpe", time: "nacht",    from: "Samenfunde in Abenteuern, Dank von Tieren, Ernte" },
  pilz:  { ic: "🍄", nm: "Glühpilz", time: "nacht",     from: "Etwas seltener: Samenfunde, Dank von Tieren, Ernte, Geheimstädte" },
  kleeb: { ic: "🍀", nm: "Glücksklee",   from: "Etwas seltener: Samenfunde, Dank von Tieren, Ernte" },
  feuer: { ic: "🌺", nm: "Feuerblüte", time: "tag",   from: "Etwas seltener: Samenfunde, Dank von Tieren, Ernte" },
  beere: { ic: "🫐", nm: "Nebelbeere",   from: "Etwas seltener: Samenfunde, Dank von Tieren, Ernte" },
  rose:  { ic: "🌹", nm: "Nebelrose",    from: "Selten: Geheimstädte, Glücksfunde in Abenteuern, Ernte", rare: true },
  klee:  { ic: "☘️", nm: "Kristallklee", from: "Selten: Geheimstädte, Glücksfunde in Abenteuern, Ernte", rare: true },
  frost: { ic: "❄️", nm: "Frostfarn",    from: "Selten: Geheimstädte, Glücksfunde in Abenteuern, Ernte", rare: true },
  moos:  { ic: "🌟", nm: "Sternmoos", time: "nacht",    from: "Selten: Geheimstädte, Glücksfunde in Abenteuern, Ernte", rare: true },
  kirsch: { ic: "🌸", nm: "Kirschblüte", time: "tag",  from: "Nur im Frühling: Blütenfest", fest: true },
  gluehb: { ic: "🍒", nm: "Glühkirsche",  from: "Nur im Sommer: Glühwürmchenfest", fest: true },
  kuerb:  { ic: "🎃", nm: "Kürbisranke",  from: "Nur im Herbst: Laternenfest", fest: true },
  eisbl:  { ic: "💠", nm: "Eisblüte",     from: "Nur im Winter: Schneedorf", fest: true }
};
// Tag und Nacht nach der echten Uhrzeit: Nacht ist von 19 bis 7 Uhr
const realNight = (d = new Date()) => d.getHours() >= 19 || d.getHours() < 7;
const isNight = d => { if (!d && typeof H !== "undefined" && H && H.timeHex && Date.now() < H.timeHex.until) return H.timeHex.mode === "nacht"; return realNight(d || new Date()); };
const timeOk = h => !HERBS[h].time || (HERBS[h].time === "nacht") === isNight();
const timeIc = h => HERBS[h].time === "nacht" ? "🌙" : HERBS[h].time === "tag" ? "☀️" : "";
const POTIONS = {
  gluck: { ic: "🍵", nm: "Glückstee",        eff: "Der nächste falsche Begleiter kostet kein Herz.", need: { mond: 1, tau: 1 } },
  spur:  { ic: "🔮", nm: "Spürsinn-Elixier", eff: "Zeigt in diesem Abenteuer über jedem Hindernis, wer helfen kann.", need: { stern: 1, tau: 1 } },
  herz:  { ic: "💛", nm: "Herztrank",        eff: "Schenkt dir ein weiteres Leben, auch über 3 Herzen hinaus.", need: { mond: 3, pilz: 2, rose: 2 }, rare: true },
  nebel: { ic: "🌫️", nm: "Nebelflug-Trank",  eff: "Das nächste Hindernis öffnet sich ganz ohne Begleiter.", need: { klee: 2, rose: 2, stern: 3 }, rare: true },
  sonnen: { ic: "🌞", nm: "Sonnentrunk",     eff: "Deine Laterne leuchtet in diesem Abenteuer viel weiter.", need: { sonne: 1, tau: 1 } },
  tulpen: { ic: "🌸", nm: "Tulpentau",       eff: "Jeder Samenfund in diesem Abenteuer gibt doppelt so viele Samen.", need: { tulpe: 1, mond: 1 } },
  kleeg:  { ic: "🍀", nm: "Kleeglückstrank", eff: "Am Ende dieses Abenteuers gibt es doppelt so viele Belohnungs-Samen.", need: { kleeb: 1, stern: 1 } },
  feuerel:{ ic: "🔥", nm: "Feuerelixier",    eff: "Verbrennt sofort alle Dornenranken in diesem Abenteuer.", need: { feuer: 1, pilz: 1 } },
  beeren: { ic: "🧃", nm: "Beerenkraft",     eff: "Heilt ein verlorenes Herz (bis zu 3 Herzen).", need: { beere: 1, mond: 1 } },
  voll:  { ic: "💖", nm: "Vollherz-Trank",   eff: "Füllt alle verlorenen Herzen wieder auf.", need: { klee: 3, pilz: 2, mond: 3 }, rare: true },
  frostat:{ ic: "🧊", nm: "Frostatem",       eff: "Friert alles Wasser ein: Bäche und Teiche werden sofort zu Wegen.", need: { frost: 2, beere: 2, klee: 2 }, rare: true },
  sterne: { ic: "💫", nm: "Sternenelixier",  eff: "Alle verwunschenen Felder in diesem Abenteuer öffnen sich sofort.", need: { moos: 2, rose: 2, sonne: 3 }, rare: true },
  regen:  { ic: "🌈", nm: "Regenbogentrank", eff: "Zwei Extra-Herzen und Schutz vor dem nächsten Fehler.", need: { moos: 2, frost: 2, feuer: 2, kleeb: 2 }, rare: true }
};
const BASIC_RECIPES = ["gluck", "spur", "sonnen", "tulpen", "kleeg", "feuerel", "beeren"];
const RARE_ORDER = ["herz", "nebel", "voll", "frostat", "sterne", "regen"];
const SEED_POOL = ["mond", "mond", "tau", "tau", "stern", "stern", "sonne", "sonne", "tulpe", "tulpe", "pilz", "kleeb", "feuer", "beere"];
const RARE_SEEDS = ["rose", "klee", "frost", "moos"];
const rollSeed = () => SEED_POOL[Math.floor(Math.random() * SEED_POOL.length)];
// Zufälliger Fund: meist normale Samen, manchmal selten
const rollDrop = (rare = 0.1) => Math.random() < rare ? RARE_SEEDS[Math.floor(Math.random() * RARE_SEEDS.length)] : rollSeed();
const SECRET_NAMES = ["Nebelhort", "Schattenkrone", "Mondgruft", "Sternenkeller", "Silberschlund", "Dämmerhallen", "Eulenschlucht", "Kristallgrotte"];

const MONDTAL = [
  { id: "wald", name: "Der Dornenwald", ic: "🌲", theme: "wald", wall: "tree", mode: 0, gen: { count: 3, tier: 0 }, fixedFirst: true, animalTile: "F", animal: "🦊", animalName: "Fuchs", who: "Der Fuchs",
    home: "am Waldrand", spot: "Waldrand", desc: "Ein verzauberter Fuchs, Dornen und Schatten.",
    intro: "Ein kleiner Fuchs ist tief im Wald verzaubert worden. <b>Tippe auf ein Feld neben dir</b>, um zu laufen.",
    map: ["#####F#", "#####.#", "#####D#", "#..W..#", "#H#####", "#.#####", "#...###", "###T###", "###.###", "###P###"] },
  { id: "see", name: "Der Nebelsee", ic: "🌫️", theme: "see", wall: "tree", mode: 1, gen: { count: 4, tier: 0 }, fixedFirst: true, animalTile: "O", animal: "🦦", animalName: "Otter", who: "Der Otter",
    home: "am Dorfteich", spot: "Dorfteich", desc: "Ein eingefrorener Otter hinter dichtem Nebel.",
    intro: "Über dem See liegt ein seltsamer Nebel. Irgendwo dort draußen ist ein Otter gefangen. <b>Tippe auf ein Feld neben dir</b>, um zu laufen.",
    map: ["~~O~~~~", "~~N~~~~", "#~.~~~#", "#~H~.~#", "#~...~#", "#~~W~~#", "#~~.~~#", "###R###", "###.###", "###P###"] },
  { id: "wiese", name: "Die Sternwiese", ic: "🌙", theme: "wiese", wall: "tree", mode: 2, gen: { count: 6, tier: 0 }, fixedFirst: true, animalTile: "Z", animal: "🦌", animalName: "Hirsch", who: "Der Sternenhirsch",
    home: "auf der Wiese", spot: "Wiese", requires: ["wald", "see"],
    desc: "Der Wächter des Waldes. Du brauchst alle deine Begleiter.",
    lockedDesc: "Rette zuerst Fuchs und Otter. Ihre Fähigkeiten brauchst du hier.",
    intro: "Über der Sternwiese funkelt der Himmel. Ganz oben wartet der Sternenhirsch. Heute brauchst du <b>alle</b> deine Begleiter, auch Funke und Ole!",
    map: ["#Z#####", "#X#####", "#.....#", "#####G#", "#.....#", "#U#####", "#.#####", "#...T.#", "#####.#", "#####P#"] }
];

function rngFor(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const pick = (rng, arr) => arr[Math.floor(rng() * arr.length)];
const tierOf = n => Math.min(Math.floor((n - 1) / 3), TIERS.length - 1);

// Weg vom Start (unten) zum Tier (oben): abwechselnd Gänge und einzelne Durchgänge, ohne Abkürzungen
function genMap(rng) {
  const g = Array.from({ length: 10 }, () => Array(7).fill("#"));
  const path = [];
  let x = 1 + Math.floor(rng() * 5);
  g[9][x] = "P"; path.push([x, 9]);
  g[8][x] = "."; path.push([x, 8]);
  for (let r = 7; r >= 1; r -= 2) {
    let nx; do { nx = 1 + Math.floor(rng() * 5); } while (nx === x && rng() < 0.85);
    const step = nx > x ? 1 : -1;
    g[r][x] = "."; path.push([x, r]);
    for (let cx = x; cx !== nx;) { cx += step; g[r][cx] = "."; path.push([cx, r]); }
    x = nx;
    if (r > 1) { g[r - 1][x] = "."; path.push([x, r - 1]); }
  }
  g[0][x] = "A"; path.push([x, 0]);
  return { g, path };
}

function genLevel(n, i, tier, rng, used) {
  const tk = pick(rng, Object.keys(THEMES)), th = THEMES[tk];
  const name = `${th.art} ${pick(rng, PREFIX)}${th.noun}`;
  const pool = i === 2 && tier >= 2 ? RARE : ANIMALS;
  let a, guard = 0; do { a = pick(rng, pool); } while (used.has(a[1]) && guard++ < 30); used.add(a[1]);
  const [ench, ring] = pick(rng, ENCH);
  const { g, path } = genMap(rng);
  const count = Math.min(3 + Math.floor(n / 2) + i, 10);
  const cand = []; for (let k = 1; k < path.length - 1; k++) cand.push(k);
  for (let k = cand.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [cand[k], cand[j]] = [cand[j], cand[k]]; }
  const chosen = cand.slice(0, Math.min(count, cand.length));
  const custom = {}, multiP = Math.min(0.15 + 0.12 * tier, 0.6);
  chosen.forEach(k => {
    const [x, y] = path[k];
    let t = rng() < multiP ? pick(rng, tier >= 1 ? ["N", "X", "Q", "Q"] : ["N", "Q"]) : pick(rng, BASIC);
    if (t === "Q") {
      const len = 2 + Math.min(tier, 2), seq = [];
      while (seq.length < len) { const r = pick(rng, RUNE_ROLES); if (r !== seq[seq.length - 1]) seq.push(r); }
      custom[x + "," + y] = seq;
    }
    g[y][x] = t;
  });
  const who = a[2], whoL = who[0].toLowerCase() + who.slice(1);
  return {
    id: `${n}-${i}`, name, ic: th.ic, theme: tk, wall: th.wall, mode: i,
    animal: a[0], animalName: a[1], who, home: th.home, spot: th.spot,
    requires: i === 2 ? [`${n}-0`, `${n}-1`] : null,
    desc: `${a[1]} retten · jedes Mal ein neuer Weg`,
    lockedDesc: "Rette zuerst die anderen beiden Tiere hier.",
    intro: `${name}: Irgendwo hier ist ${whoL} gefangen. <b>Tippe auf ein Feld neben dir</b>, um zu laufen.`,
    animalHint: `${who} ist gefangen in ${ench}. Nur eine Heilerin kann den Zauber lösen.`,
    ring, map: g.map(r => r.join("")), custom, gen: { count: chosen.length, tier }
  };
}

// Irrgarten mit mehreren Wegen zum Ziel (Labyrinth mit Schleifen)
function genMaze(rng) {
  const g = Array.from({ length: 10 }, () => Array(7).fill("#"));
  const CX = [1, 3, 5], CY = [1, 3, 5, 7, 9], seen = new Set(), key = (i, j) => i + "," + j;
  const open = (x, y) => { if (g[y][x] === "#") g[y][x] = "."; };
  const st0 = [Math.floor(rng() * 3), 4], stack = [st0]; seen.add(key(...st0)); open(CX[st0[0]], CY[4]);
  while (stack.length) {
    const [i, j] = stack[stack.length - 1];
    const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].map(([a, b]) => [i + a, j + b]).filter(([a, b]) => a >= 0 && a < 3 && b >= 0 && b < 5 && !seen.has(key(a, b)));
    if (!nb.length) { stack.pop(); continue; }
    const [a, b] = nb[Math.floor(rng() * nb.length)];
    seen.add(key(a, b)); open(CX[a], CY[b]); open((CX[i] + CX[a]) / 2, (CY[j] + CY[b]) / 2); stack.push([a, b]);
  }
  // zusätzliche Verbindungen: so entstehen mehrere Wege
  for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) {
    if (i < 2 && g[CY[j]][CX[i] + 1] === "#" && rng() < 0.45) g[CY[j]][CX[i] + 1] = ".";
    if (j < 4 && g[CY[j] + 1][CX[i]] === "#" && rng() < 0.45) g[CY[j] + 1][CX[i]] = ".";
  }
  const sx = CX[Math.floor(rng() * 3)], gx = CX[Math.floor(rng() * 3)];
  g[9][sx] = "P"; g[0][gx] = "A";
  const opens = [];
  for (let y = 0; y < 10; y++) for (let x = 0; x < 7; x++) if (g[y][x] === ".") opens.push([x, y]);
  for (let k = opens.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [opens[k], opens[j]] = [opens[j], opens[k]]; }
  return { g, path: [[sx, 9], ...opens, [gx, 0]] };
}

// Bei jedem Betreten ein neuer Weg mit neuen Hindernissen, nur mit Begleitern, die man schon hat
function randomMap(l) {
  const rng = rngFor(l.seed != null ? l.seed : Math.floor(Math.random() * 2147483647));
  const avail = new Set((l.baseOnly ? BASE_ROLES : ROLES).map(r => r.id)), p = l.gen, tier = p.tier;
  const basic = BASIC.filter(t => OBST[t].needs.every(r => avail.has(r)));
  const runeRoles = RUNE_ROLES.filter(r => avail.has(r));
  const { g, path } = p.maze ? genMaze(rng) : genMap(rng);
  if (l.animalTile) { const [ax, ay] = path[path.length - 1]; g[ay][ax] = l.animalTile; }
  const cand = []; for (let k = 1; k < path.length - 1; k++) cand.push(k);
  for (let k = cand.length - 1; k > 0; k--) { const j = Math.floor(rng() * (k + 1)); [cand[k], cand[j]] = [cand[j], cand[k]]; }
  const chosen = p.secret ? cand.filter(() => rng() >= 0.2) : cand.slice(0, Math.min(p.count, cand.length));
  const multiP = p.multiP != null ? p.multiP : p.secret ? 0.7 : Math.min(0.15 + 0.12 * tier, 0.6);
  const multiPool = p.secret ? ["N", "X", "Q", "Q", "Q"] : tier >= 1 ? ["N", "X", "Q", "Q"] : ["N", "Q"];
  const custom = {};
  chosen.forEach(k => {
    const [x, y] = path[k];
    const t = rng() < multiP ? pick(rng, multiPool) : pick(rng, basic);
    if (t === "Q") {
      const len = (p.secret ? 3 : 2) + Math.min(tier, 2), seq = [];
      while (seq.length < len) { const r = pick(rng, runeRoles); if (r !== seq[seq.length - 1]) seq.push(r); }
      custom[x + "," + y] = seq;
    }
    g[y][x] = t;
  });
  return { map: g.map(r => r.join("")), custom };
}

const settlements = {};
function getSettlement(n) {
  if (settlements[n]) return settlements[n];
  let s;
  if (n === 1) s = { n, name: "Mondtal", tier: 0, levels: MONDTAL };
  else {
    const rng = rngFor(n * 9973 + 17), tier = tierOf(n), used = new Set();
    const name = pick(rng, PREFIX) + pick(rng, TIERS[tier].suf);
    s = { n, name, tier, levels: [0, 1, 2].map(i => genLevel(n, i, tier, rng, used)) };
  }
  return (settlements[n] = s);
}

/* ---------- Spielstand (nur in diesem Browser) ---------- */
const KEY = "nebelpfad-v1", KEY_CUR = "nebelpfad-ort";
let rescued = {};
try { rescued = JSON.parse(localStorage.getItem(KEY) || "{}") || {}; } catch (e) { rescued = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(rescued)); localStorage.setItem(KEY_CUR, String(cur)); } catch (e) {} };
const isDone = s => s.levels.every(l => rescued[l.id]);
const isLocked = l => l.requires && !l.requires.every(r => rescued[r]);
function unlockedMax() { let n = 1; while (isDone(getSettlement(n))) n++; return n; }
let cur = 1;
try { cur = parseInt(localStorage.getItem(KEY_CUR) || "1", 10) || 1; } catch (e) {}
cur = Math.max(1, Math.min(cur, unlockedMax()));

// Hexenhaus-Spielstand
const KEY_H = "nebelpfad-haus";
const defaultH = () => ({ v: 1, v2: true, seeds: { mond: 3, tau: 3, stern: 2, pilz: 1, sonne: 2, tulpe: 2, kleeb: 1 }, herbs: {}, potions: {}, recipes: BASIC_RECIPES.slice(),
  plots: Array(9).fill(null), stats: {}, secret: {} });
let H = null;
try { H = JSON.parse(localStorage.getItem(KEY_H) || "null"); } catch (e) { H = null; }
if (!H || !H.v) H = defaultH();
// Neue Kräuter und Rezepte auch für bestehende Spielstände
if (!H.v2) {
  H.v2 = true;
  BASIC_RECIPES.forEach(r => { if (!H.recipes.includes(r)) H.recipes.push(r); });
  H.seeds.sonne = (H.seeds.sonne || 0) + 2; H.seeds.tulpe = (H.seeds.tulpe || 0) + 2; H.seeds.kleeb = (H.seeds.kleeb || 0) + 1;
}
while (H.plots.length < 9) H.plots.push(null);
setTimeout(() => { try { while (H.plots.length < 9 + extraPlots(heroLvl())) H.plots.push(null); renderLvlBar(); } catch (e) {} }, 0);
const saveH = () => { try { localStorage.setItem(KEY_H, JSON.stringify(H)); } catch (e) {} };
const add = (bag, k, n = 1) => { bag[k] = (bag[k] || 0) + n; if (bag[k] <= 0) delete bag[k]; };
const statsOf = n => H.stats[n] || (H.stats[n] = { perfect: false, harvest: 0, brew: 0 });

/* ---------- Geheimaufgaben und Geheimstädte ---------- */
function tasksOf(s) {
  const st = statsOf(s.n), hv = 3 + s.n, bw = 1 + Math.floor(s.n / 2);
  const all = {
    rescue:  { txt: `Rette alle drei Tiere in ${s.name}`, done: isDone(s), prog: `${s.levels.filter(l => rescued[l.id]).length}/3` },
    perfect: { txt: "Schaffe ein Abenteuer hier, ohne ein Herz zu verlieren", done: !!st.perfect, prog: st.perfect ? "1/1" : "0/1" },
    harvest: { txt: `Ernte ${hv} Kräuter im Garten, während du hier bist`, done: st.harvest >= hv, prog: `${Math.min(st.harvest, hv)}/${hv}` },
    brew:    { txt: `Braue ${bw} ${bw === 1 ? "Trank" : "Tränke"} am Alchemietisch, während du hier bist`, done: st.brew >= bw, prog: `${Math.min(st.brew, bw)}/${bw}` }
  };
  const rng = rngFor(s.n * 577 + 3), opts = ["perfect", "harvest", "brew"], drop = opts[Math.floor(rng() * 3)];
  return ["rescue", ...opts.filter(o => o !== drop)].map(id => ({ id, ...all[id] }));
}
const secretOpen = s => tasksOf(s).every(t => t.done);

const superCache = {};
function getSuper(n) {
  if (superCache[n]) return superCache[n];
  const rng = rngFor(n * 7919 + 5), tier = tierOf(n), keys = Object.keys(THEMES), tk = pick(rng, keys), th = THEMES[tk];
  const name = "Irrgarten " + pick(rng, SECRET_NAMES);
  return (superCache[n] = {
    id: `x${n}`, superD: true, name, ic: "🌀", theme: tk, wall: th.wall, mode: 2, map: [],
    animal: "💎", animalName: "Kristallherz", who: "Das Kristallherz", ring: "#9fe4ff",
    gen: { maze: true, count: Math.min(14 + tier * 2, 22), tier: Math.min(tier + 2, 4), multiP: 0.55 },
    intro: `${name}: <b>Superschwer!</b> Viele Wege führen durch den Irrgarten, und überall warten Hindernisse. Finde den besten Weg zum Kristallherz.`,
    animalHint: "Das Kristallherz, eingeschlossen in einem Zauber. Nur deine heilenden Hände können es befreien."
  });
}
function superWin() {
  done = true;
  const s = getSettlement(cur); H.superDone = H.superDone || {};
  const first = !H.superDone[s.n]; H.superDone[s.n] = true;
  const seeds = Array.from({ length: first ? 2 : 1 }, () => RARE_SEEDS[Math.floor(Math.random() * RARE_SEEDS.length)]);
  seeds.forEach(k => add(H.seeds, k)); if (first) add(H.potions, "voll"); gemAdd(first ? 2 : 0); saveH();
  $("winIcon").textContent = "💎";
  $("winTitle").textContent = `${level.name} bezwungen!`;
  $("winText").innerHTML = (first ? `🏆 Das Meisterabzeichen von ${s.name} gehört dir!<br><br>` : "Du hast den Irrgarten wieder bezwungen.<br><br>")
    + `🎁 Belohnung: ${seeds.map(k => HERBS[k].ic + " " + HERBS[k].nm).join(", ")} als seltene Samen${first ? ", dazu ein 💖 Vollherz-Trank" : ""}.`;
  $("home").textContent = `Zurück nach ${s.name}`;
  setTimeout(() => { $("win").hidden = false; }, reduce ? 0 : 1100);
}
const secretCache = {};
function getSecret(n) {
  if (secretCache[n]) return secretCache[n];
  const rng = rngFor(n * 4241 + 99), tier = Math.min(tierOf(n) + 1, TIERS.length - 1);
  const tk = pick(rng, ["hoehle", "ruine", "sumpf", "gipfel"]), th = THEMES[tk];
  const name = "Geheimstadt " + pick(rng, SECRET_NAMES);
  const { g, path } = genMap(rng), custom = {};
  for (let k = 1; k < path.length - 1; k++) {
    if (rng() < 0.2) continue;
    const [x, y] = path[k];
    const t = rng() < 0.7 ? pick(rng, ["N", "X", "Q", "Q", "Q"]) : pick(rng, BASIC);
    if (t === "Q") {
      const len = 3 + Math.min(tier, 2), seq = [];
      while (seq.length < len) { const r = pick(rng, RUNE_ROLES); if (r !== seq[seq.length - 1]) seq.push(r); }
      custom[x + "," + y] = seq;
    }
    g[y][x] = t;
  }
  return (secretCache[n] = {
    id: `g${n}`, secret: true, name, ic: "🗝️", theme: tk, wall: th.wall, mode: 2,
    animal: "📜", animalName: "Rezeptrolle", who: "Die Rezeptrolle", ring: "#f2c76b",
    intro: `${name}: Tief unter dem Ort liegt eine vergessene Stadt. Hier ist es <b>richtig schwer</b>. Ganz am Ende wartet eine alte Rezeptrolle.`,
    animalHint: "Eine uralte Rezeptrolle, verschlossen mit einem Zaubersiegel. Nur deine heilenden Hände können es öffnen.",
    map: g.map(r => r.join("")), custom, gen: { tier, secret: true }
  });
}

