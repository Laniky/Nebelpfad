/* ---------- Denk-Rätsel für schwere Dungeons ---------- */
// Andere Begleiter, die ein Hindernis auch schaffen (nur in schweren Dungeons)
const ALT = { T: ["schutz", "fuchs"], R: ["schutz", "bau"], H: ["spur", "fuchs"], W: ["bau", "otter"], D: ["licht"], G: ["fuchs", "spur"], U: ["otter", "bau"] };
const ALT_SOLVE = {
  "T:fuchs": "<b>Funke</b> schlüpft geschickt zwischen den Ranken hindurch und knabbert die dicksten Triebe durch. Der Weg ist frei.",
  "R:bau": "<b>Holm</b> schiebt einen Ast unter den Felsbrocken und hebelt ihn zur Seite.",
  "H:fuchs": "<b>Funke</b> hat eine feine Nase und erschnuppert die richtige Spur.",
  "W:otter": "<b>Ole</b> schwimmt hinüber und spannt ein Seil, an dem du dich sicher entlanghangelst.",
  "G:spur": "<b>Pip</b> findet unten an der Hecke einen alten Igeltunnel und führt dich hindurch.",
  "U:bau": "<b>Holm</b> baut aus Schilf und Ästen ein kleines Floß."
};
const RIDDLE = {
  T: "„Ich steche und ranke und halte dich fest. Wer stark ist oder flink, der kommt an mir vorbei.“",
  R: "„Ich bin schwer und rund und schlafe im Weg. Wer schiebt oder hebelt mich zur Seite?“",
  H: "„Hier laufen tausend Spuren kreuz und quer. Wer hat eine feine Nase?“",
  W: "„Ich fließe und rausche und höre nie auf. Wer baut mir einen Steg oder schwimmt hinüber?“",
  D: "„Ich bin dunkler als die dunkelste Nacht. Nur eines vertreibt mich.“",
  G: "„Ich bin grün und dicht, nur ein winziger Spalt. Wer ist klein genug oder findet einen Tunnel?“",
  U: "„Ich bin tief und still, mit Seerosen bedeckt. Wer taucht hinab oder baut ein Floß?“"
};
const STAM_MAX_NOTE = "Jeder Begleiter hat hier nur begrenzt Kraft.";
let HP = null;
const MECHS = ["riddle", "tired", "switch", "wander", "alt"];
const MECH_NAME = { riddle: "❔ Rätselfelder", tired: "💪 Müde Begleiter", switch: "🕯️ Schalter", wander: "🔄 Wandelnde Felder", alt: "🔀 Andere Begleiter" };
// Wie viele Denk-Rätsel ein Dungeon bekommt: normal 1, Geheimstadt (zu fünft) 3, Irrgarten und Nebelnetz alle 5
function mechCount(l) {
  if (!l || l.coop || l.daily || l.fest || l.timed || l.farm) return 0;
  if (l.superD || l.weaver) return 5;
  if (l.secret) return 3;
  if (l.fixedFirst && !rescued[l.id]) return 0;
  return 1;
}
const wForm = k => { const c = HP && HP.wander[k]; return c ? c[Math.floor(HP.steps / 3) % c.length] : null; };
function hardSetup(l) {
  HP = null;
  const nMech = mechCount(l);
  if (!nMech || l.resume) return;
  const mech = new Set(MECHS.slice().sort(() => Math.random() - .5).slice(0, nMech));
  const avail = new Set(ROLES.map(r => r.id)), cells = [];
  for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) cells.push([x, y]);
  const plain = cells.filter(([x, y]) => BASIC.includes(grid[y][x]));
  const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  HP = { veil: new Set(), wander: {}, sw: {}, stam: {}, steps: 0, told: new Set(), mech };
  // Wandelnde Hindernisse: 1 bis 2 Felder verwandeln sich alle 3 Schritte
  const forms = BASIC.filter(t => OBST[t].needs.every(r => avail.has(r)));
  if (mech.has("wander")) shuffle(plain).slice(0, Math.max(1, Math.min(2, Math.floor(plain.length / 5)))).forEach(([x, y]) => {
    const cyc = shuffle(forms.slice()).slice(0, 3); if (cyc.length < 2) return;
    grid[y][x] = "V"; HP.wander[x + "," + y] = cyc;
  });
  // Rätselfelder: etwa ein Drittel der übrigen einfachen Hindernisse ist verhüllt
  if (mech.has("riddle")) { const pl = cells.filter(([x, y]) => BASIC.includes(grid[y][x])); pl.forEach(([x, y]) => { if (Math.random() < 0.35) HP.veil.add(x + "," + y); }); if (!HP.veil.size && pl.length) HP.veil.add(pl[0][0] + "," + pl[0][1]); }
  // Schalter: an einer Sackgasse, wenn es mindestens 2 Hindernisse der passenden Sorte gibt
  const deadEnds = shuffle(cells.filter(([x, y]) => grid[y][x] === "." && Math.abs(x - px) + Math.abs(y - py) > 1 && NB.filter(([a, b]) => { const c = grid[y + b] && grid[y + b][x + a]; return c && c !== "#" && c !== "~"; }).length === 1));
  if (mech.has("switch")) shuffle(Object.keys(SWITCHES)).forEach(ch => {
    const S0 = SWITCHES[ch]; if (!S0.needs.every(r => avail.has(r))) return;
    if (cells.filter(([x, y]) => grid[y][x] === S0.target).length < 2 || !deadEnds.length) return;
    const [x, y] = deadEnds.shift(); grid[y][x] = ch; HP.sw[x + "," + y] = ch;
  });
  // Müde Begleiter: Kraft so verteilen, dass es mit klugem Einsatz genau reicht (plus etwas Luft)
  const use = {}; ROLES.forEach(r => { if (r.id !== "heil") use[r.id] = 0; });
  cells.forEach(([x, y]) => {
    const c = grid[y][x], k = x + "," + y;
    if (BASIC.includes(c)) { const opts = (mech.has("alt") ? ALT[c] : OBST[c].needs).filter(r => avail.has(r)); const r = opts[Math.floor(Math.random() * opts.length)]; use[r]++; }
    else if (c === "V") HP.wander[k].forEach(f => OBST[f].needs.forEach(r => { if (r in use) use[r]++; }));
    else if (c === "Q") runCustom[k].forEach(r => use[r]++);
    else if (OBST[c] && !OBST[c].animal && c !== "S") OBST[c].needs.forEach(r => { if (r in use) use[r]++; });
  });
  const used = Object.keys(use).filter(r => use[r] > 0);
  shuffle(used).slice(0, 2).forEach(r => use[r]++);
  if (mech.has("tired")) HP.stam = use;
  const parts = [];
  if (mech.has("tired")) parts.push("💪 Jeder Begleiter hat hier nur begrenzt Kraft. Die Zahl auf seinem Knopf zeigt, wie oft er noch helfen kann.");
  if (mech.has("alt")) parts.push("🔀 Manche Hindernisse schaffen hier auch <b>andere Begleiter</b>.");
  if (HP.veil.size) parts.push("❔ Verhüllte Felder verraten sich nur durch ein Rätsel.");
  if (Object.keys(HP.wander).length) parts.push("🔄 Manche Felder verwandeln sich alle 3 Schritte.");
  if (Object.keys(HP.sw).length) parts.push("🕯️ Irgendwo gibt es einen Schalter, der viele Hindernisse auf einmal löst.");
  if (!parts.length) { HP = null; return; }
  HP.note = `<br><br>🧠 <b>${parts.length === 1 ? "Denk-Rätsel" : parts.length + " Denk-Rätsel"}!</b> ` + parts.join(" ");
}
function altOk(t, role) { return !!(HP && HP.mech.has("alt") && ALT[t] && ALT[t].includes(role)); }
// Rätsel verraten, wenn man neben einem verhüllten Feld steht. Es kommt ganz oben ins Textfeld, damit man es sofort sieht.
// Rätsel-Hinweis: bleibt sichtbar, solange du neben einem verhüllten Feld stehst
function riddleBox() {
  if (!HP || done || !grid) return "";
  for (const [a, b] of NB) {
    const k = (px + a) + "," + (py + b), c = grid[py + b] && grid[py + b][px + a];
    if (HP.veil.has(k) && RIDDLE[c]) return `<div class="riddle">❔ <b>Das verhüllte Feld ${a === 0 ? (b < 0 ? "über" : "unter") : (a < 0 ? "links neben" : "rechts neben")} dir flüstert:</b><br><i>${RIDDLE[c]}</i><br><small>Welcher Begleiter ist gemeint? Wähle ihn und tippe auf das Feld.</small></div>`;
  }
  return "";
}
function tellRiddle() {
  const r = riddleBox(); if (!r || $("msg").querySelector(".riddle")) return;
  $("msg").innerHTML = r + $("msg").innerHTML; $("msg").scrollTop = 0;
}
function afterMove() {
  if (HP) {
    HP.steps++;
    tellRiddle();
    if (Object.keys(HP.wander).length && HP.steps % 3 === 0) SND.fx.click();
  }
}
// Deutlicher Hinweis auf Wasserfeldern: bauen (Holm) oder tauchen (Ole)
function waterTag(x, y, c) {
  // In Dungeons mit Denk-Rätseln kein Schild, dort soll man selbst überlegen
  if (HP) return;
  const txt = c === "W" ? "🔨 bauen" : "🤿 tauchen";
  ctx.save(); ctx.font = "bold 10px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  const w = Math.min(S - 4, ctx.measureText(txt).width + 10), cx = x * S + S / 2, ty = y * S + 9;
  ctx.fillStyle = c === "W" ? "#3a2a12e6" : "#10304ae6"; ctx.strokeStyle = c === "W" ? "#f2c76b" : "#9fd8ff"; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.roundRect ? ctx.roundRect(cx - w / 2, ty - 7, w, 14, 7) : ctx.rect(cx - w / 2, ty - 7, w, 14); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.fillText(txt, cx, ty + .5); ctx.restore();
}
function drawVeil(cx, cy, t) {
  const g = ctx.createRadialGradient(cx, cy, 3, cx, cy, 28);
  g.addColorStop(0, "#9a7ad8"); g.addColorStop(.6, "#4a3a78"); g.addColorStop(1, "#2a2244");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 25, 0, 7); ctx.fill();
  ctx.strokeStyle = "#c9b4ff"; ctx.lineWidth = 2;
  for (let i = 0; i < 2; i++) { const a0 = (reduce ? 0 : t / (900 + i * 300)) + i * 3; ctx.beginPath(); ctx.arc(cx, cy, 14 + i * 6, a0, a0 + 2.2); ctx.stroke(); }
  ctx.font = "24px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("❔", cx, cy + 1);
}
function drawWander(x, y, t) {
  const k = x + "," + y, c = HP && HP.wander[k]; if (!c) return;
  const cx = x * S + S / 2, cy = y * S + S / 2, i = Math.floor(HP.steps / 3) % c.length, nx = c[(i + 1) % c.length], left = 3 - HP.steps % 3;
  ctx.strokeStyle = "#c9b4ff"; ctx.lineWidth = 2; ctx.setLineDash([4, 4]); ctx.lineDashOffset = reduce ? 0 : -t / 60;
  ctx.strokeRect(x * S + 3, y * S + 3, S - 6, S - 6); ctx.setLineDash([]);
  ctx.fillStyle = "#0b0f18dd"; ctx.beginPath(); ctx.arc(x * S + 12, y * S + S - 12, 10, 0, 7); ctx.fill();
  ctx.font = "12px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText({ T: "🌿", R: "🪨", H: "🐾", W: "💧", D: "🌑", G: "🌳", U: "🪷" }[nx] || "🔄", x * S + 12, y * S + S - 11);
  ctx.fillStyle = "#c9b4ff"; for (let d = 0; d < left; d++) { ctx.beginPath(); ctx.arc(x * S + 26 + d * 6, y * S + S - 8, 2, 0, 7); ctx.fill(); }
}
/* ---------- Der Nebelweber und sein Tagebuch ---------- */
const DIARY = [
  ["Der Sturm", "Ich weiß noch, wie der große Sturm kam. Die Bäume bogen sich, und die Tiere zitterten in ihren Höhlen und Nestern. Ich hatte nur meinen Webstuhl und meine silbernen Fäden."],
  ["Die Decke", "Also webte ich. Tag und Nacht webte ich eine Decke aus Nebel, so groß wie das ganze Land. Darunter war es still und weich. Kein Wind kam hindurch."],
  ["Stille", "Der Sturm ist längst vorbei. Aber unter meiner Decke ist es so ruhig geworden. Manchmal höre ich tagelang nichts außer meinen eigenen Schritten."],
  ["Vergessen", "Heute wollte ich die Decke wieder aufziehen. Ich habe am Faden gezogen, aber er hat sich nur fester gewickelt. Ich habe vergessen, wie man aufhört."],
  ["Die Tiere", "Einige Tiere haben sich im Nebel verirrt. Damit ihnen nichts geschieht, habe ich sie in Zauber gehüllt, wie in kleine Kokons. Dort schlafen sie sicher, bis ich einen Weg finde."],
  ["Ein Licht", "Heute sah ich ein Licht im Nebel. Eine Laterne! Jemand ging mutig durch den Wald, mit einem Bären und einem Igel an der Seite. Ich habe mich hinter einem Baum versteckt."],
  ["Sie löst die Zauber", "Die Heilerin mit der Laterne kann meine Kokons öffnen. Die Tiere wachen auf und laufen ihr nach. Ich bin froh. Und ein bisschen traurig, denn jetzt bin ich wieder allein."],
  ["Die Lichtung", "Ich habe mich zur Lichtung geschlichen. Dort spielen alle Tiere, die sie gerettet hat. Ein Hase hat mich gesehen und ist nicht weggelaufen. Er hat mir sogar zugezwinkert."],
  ["Mut", "Ich glaube, ich muss mit ihr sprechen. Aber was, wenn sie böse ist, weil ich den Nebel gemacht habe? Ich habe meine Fäden heute dreimal verknotet vor Aufregung."],
  ["Ein Brief", "Ich habe ihr diese Seiten hingelegt, Stück für Stück, in den Dungeons. Wenn sie sie findet, versteht sie vielleicht, warum es den Nebel gibt."],
  ["Der Faden", "Ich weiß jetzt, wie man den Nebel auflöst. Nicht mit Ziehen und nicht mit Zaubern. Mit Freundschaft. Jedes gerettete Tier lockert einen Faden."],
  ["Morgen", "Wenn alle Tiere frei sind, wird die Decke ganz leicht. Dann falte ich sie zusammen und lege sie auf die Lichtung, als Kissen für die Tiere. Und vielleicht darf ich dann bleiben."]
];
const WEAVER_TALK = [
  ["Das erste Treffen", "Du hast mich gefunden … Bitte erschrick nicht. Ich bin der Nebelweber. Den Nebel habe ich gemacht, damals beim großen Sturm. Ich wollte nur, dass alle sicher sind."],
  ["Das zweite Treffen", "Du bist schon wieder da. Und du bist nicht böse auf mich? Die Tiere erzählen, dass du ihnen jeden Tag Futter bringst. Vielleicht kann ich auch helfen. Ich kenne alle Wege im Nebel."],
  ["Das dritte Treffen", "Weißt du, was ich gemerkt habe? Seit du da bist, ist mein Nebel ein bisschen heller geworden. Jedes Lachen auf deiner Lichtung lockert einen Faden. Danke."],
  ["Das vierte Treffen", "Ich webe jetzt etwas Neues: Decken für die Tiere, Schals für Bruno und kleine Hüte für Pip. Es macht viel mehr Freude, für Freunde zu weben als gegen den Sturm."],
  ["Ein Freund", "Du kommst immer wieder zu mir, obwohl ich nur ein alter Weber bin. Ich glaube, das nennt man Freundschaft. Wenn du magst, warte ich in jeder großen Stadt auf dich."]
];
const WEAVER_HINTS = [
  "Am Rand des Nebels glitzert kurz ein silberner Faden, dann ist er weg.",
  "Für einen Moment siehst du eine Gestalt in einem langen grauen Mantel zwischen den Bäumen.",
  "Ein feiner Faden hängt an einem Ast. Er fühlt sich kühl an, wie Nebel.",
  "Du hörst ganz leise das Klappern eines Webstuhls, irgendwo weit weg.",
  "Das gerettete Tier schaut zurück in den Nebel, als würde es jemandem zuwinken."
];
let diaryAt = null, diaryNew = new Set();
const isCapital = s => s.tier >= 2;
function placeDiary(l) {
  diaryAt = null;
  H.diary = H.diary || [];
  if (l.coop || l.daily || l.timed || l.resume || H.diary.length >= DIARY.length) return;
  if (Math.random() > (l.secret || l.superD ? 0.7 : 0.35)) return;
  const free = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] === "." && Math.abs(x - px) + Math.abs(y - py) > 2) free.push([x, y]);
  if (free.length) { const [x, y] = free[Math.floor(Math.random() * free.length)]; diaryAt = x + "," + y; }
}
function checkDiary() {
  if (!diaryAt || diaryAt !== px + "," + py) return;
  diaryAt = null; H.diary = H.diary || [];
  const i = H.diary.length; if (i >= DIARY.length) return;
  H.diary.push(i); diaryNew.add(i); saveH(); SND.fx.seed();
  say(`📜 Du findest eine <b>Tagebuchseite</b>: „${DIARY[i][0]}“. Lies sie im Ort unter 📜 Tagebuch.`);
}
function drawDiary(t) {
  if (!diaryAt) return;
  const [x, y] = diaryAt.split(",").map(Number), cx = x * S + S / 2, cy = y * S + S / 2;
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
  g.addColorStop(0, `rgba(243,230,200,${reduce ? .5 : .35 + .25 * Math.sin(t / 420)})`); g.addColorStop(1, "rgba(243,230,200,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 7); ctx.fill();
  ctx.font = "22px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("📜", cx, cy + (reduce ? 0 : Math.sin(t / 500) * 2));
}
function weaverHint() { return Math.random() < 0.25 ? `<br><br><i>🕸️ ${WEAVER_HINTS[Math.floor(Math.random() * WEAVER_HINTS.length)]}</i>` : ""; }
function getWeaver(n) {
  const rng = rngFor(n * 3301 + 77), keys = Object.keys(THEMES), tk = pick(rng, keys), th = THEMES[tk], tier = tierOf(n);
  return { id: `w${n}`, weaver: true, name: `Das Nebelnetz von ${getSettlement(n).name}`, ic: "🕸️", theme: tk, wall: th.wall, mode: 2, map: [],
    animal: "🧶", animalName: "Nebelweber", who: "Der Nebelweber", ring: "#c9d4ff",
    gen: { maze: true, count: Math.min(16 + tier * 2, 24), tier: Math.min(tier + 2, 4), multiP: 0.6 },
    intro: `🕸️ <b>Das große Abschlussrätsel!</b> Silberne Nebelfäden spannen sich über den ganzen Weg. Ganz am Ende sitzt jemand an einem Webstuhl …`,
    animalHint: "Eine Gestalt im grauen Mantel, ganz in Nebelfäden eingesponnen. Vielleicht kannst du sie befreien?" };
}
function weaverWin() {
  done = true;
  const s = getSettlement(cur); H.weaver = H.weaver || {};
  const first = !H.weaver[s.n]; H.weaver[s.n] = true;
  const met = Object.keys(H.weaver).length, talk = WEAVER_TALK[Math.min(met, WEAVER_TALK.length) - 1];
  const seeds = Array.from({ length: first ? 2 : 1 }, () => RARE_SEEDS[Math.floor(Math.random() * RARE_SEEDS.length)]); seeds.forEach(k => add(H.seeds, k));
  if (first) { add(H.potions, "voll"); add(H.potions, "herz"); gemAdd(3); }
  let page = "";
  H.diary = H.diary || [];
  if (first && H.diary.length < DIARY.length) { const i = H.diary.length; H.diary.push(i); diaryNew.add(i); page = `<br>📜 Er schenkt dir eine Tagebuchseite: „${DIARY[i][0]}“.`; }
  saveH();
  $("winIcon").textContent = "🧶"; $("winTitle").textContent = first ? talk[0] : "Der Nebelweber winkt dir zu";
  $("winText").innerHTML = (first ? `<i>„${talk[1]}“</i><br>` : `<i>„Schön, dass du mich wieder besuchst!“</i><br>`)
    + `<br>🎁 ${seeds.map(k => HERBS[k].ic + " " + HERBS[k].nm).join(", ")} als seltene Samen${first ? ", dazu ein 💖 Vollherz-Trank und ein 💛 Herztrank" : ""}.${page}`;
  $("home").textContent = `Zurück nach ${s.name}`;
  setTimeout(() => { $("win").hidden = false; }, reduce ? 0 : 1100);
}
function openDiary() {
  H.diary = H.diary || [];
  const n = H.diary.length, met = Object.keys(H.weaver || {}).length;
  $("diarySub").textContent = `${n} von ${DIARY.length} Seiten gefunden. Sie liegen versteckt in den Abenteuern.`;
  $("weaverCard").innerHTML = met
    ? `<h2>🧶 Der Nebelweber</h2><p class="sub" style="margin:0">Du hast ihn ${met === 1 ? "einmal" : met + " Mal"} getroffen.</p>` + WEAVER_TALK.slice(0, Math.min(met, WEAVER_TALK.length)).map(w => `<p style="margin:0"><b>${w[0]}:</b> <i>„${w[1]}“</i></p>`).join("")
    : `<h2>🕸️ Ein Geheimnis im Nebel</h2><p class="sub" style="margin:0">Wer hat den Nebel gemacht? In jeder <b>Hauptstadt</b> und jeder größeren Stadt wartet ein großes Abschlussrätsel, sobald dort alle drei Tiere gerettet sind. Vielleicht findest du dort eine Antwort.</p>`;
  $("diaryPages").innerHTML = DIARY.map((d, i) => H.diary.includes(i)
    ? `<article class="page${diaryNew.has(i) ? " new" : ""}"><h3>Seite ${i + 1}: ${d[0]}</h3><p>${d[1]}</p></article>`
    : `<article class="page missing"><h3>Seite ${i + 1}</h3><p>Diese Seite hast du noch nicht gefunden.</p></article>`).join("");
  diaryNew.clear();
  show("diaryView");
}
$("toDiary").addEventListener("click", openDiary);
$("diaryBack").addEventListener("click", showVillage);

/* ---------- Kostüme: Belohnung für Sterne ---------- */
const COSTUMES = {
  schleife: { ic: "🎀", nm: "Schleife", stars: 1 }, schal: { ic: "🧣", nm: "Schal", stars: 3 }, kranz: { ic: "🌸", nm: "Blumenkranz", stars: 5 },
  brille: { ic: "👓", nm: "Brille", stars: 7 }, muetze: { ic: "🧢", nm: "Mütze", stars: 9 }, hut: { ic: "🎩", nm: "Zylinder", stars: 12 },
  zauber: { ic: "🪄", nm: "Zauberstab", stars: 15 }, krone: { ic: "👑", nm: "Krone", stars: 20 },
  // Festkleidung: nur auf dem Festmarkt zu kaufen
};
Object.entries(FESTS).forEach(([k, f]) => { COSTUMES["f_" + k] = { ic: f.cos[0], nm: f.cos[1], fest: k }; });
Object.assign(COSTUMES, { l_feder: { ic: "🪶", nm: "Federschmuck", lvl: 13 }, l_regen: { ic: "🌈", nm: "Regenbogenband", lvl: 22 }, l_horn: { ic: "🦄", nm: "Einhornhorn", lvl: 35 } });
const cosOk = k => { const C = COSTUMES[k]; return !!C && (C.fest ? (H.costOwned || []).includes(k) : C.lvl ? heroLvl() >= C.lvl : starCount() >= C.stars); };
const starCount = () => Object.keys(H.stars || {}).length + Object.keys(H.starOrt || {}).length * 2;
const cosOf = r => { const k = (H.costume || {})[r]; return k && cosOk(k) ? COSTUMES[k] : null; };
function renderCostumes() {
  const n = starCount(), box = $("costList"); if (!box) return;
  const next = Object.values(COSTUMES).find(c => !c.fest && !c.lvl && c.stars > n);
  $("costSum").textContent = `Du hast ${n} ⭐ (jedes Abenteuer mit allen Herzen gibt einen Stern, eine Sternentruhe zählt doppelt).` + (next ? ` Nächstes Kostüm: ${next.ic} ${next.nm} ab ${next.stars} ⭐.` : " Du hast alle Kostüme freigeschaltet!");
  box.innerHTML = "";
  [...BASE_ROLES, ...PET_ROLES.filter(p => rescued[p.from])].forEach(r => {
    const row = el("div", "wk-row cosrow"), c = cosOf(r.id);
    row.innerHTML = `<span class="ic" aria-hidden="true">${r.ic}${c ? `<small>${c.ic}</small>` : ""}</span><span class="t"><strong>${r.nm}</strong><span>${c ? `trägt: ${c.nm}` : "noch ohne Kostüm"}</span></span>`;
    const bx = el("div", "bx");
    const none = btnEl("✖", () => { H.costume = H.costume || {}; delete H.costume[r.id]; saveH(); renderCostumes(); }); none.setAttribute("aria-label", "Kein Kostüm"); none.setAttribute("aria-pressed", String(!c)); bx.appendChild(none);
    Object.entries(COSTUMES).filter(([k, C]) => !(C.fest || C.lvl) || cosOk(k)).forEach(([k, C]) => {
      const ok = cosOk(k), b = btnEl(C.ic, () => {
        if (!ok) { $("beastMsg").textContent = `${C.ic} ${C.nm} gibt es ab ${C.stars} ⭐. Hol dir Sterne, indem du Abenteuer ohne verlorenes Herz schaffst.`; return; }
        H.costume = H.costume || {}; H.costume[r.id] = k; saveH(); SND.fx.seed(); $("beastMsg").textContent = `${r.ic} ${r.nm} trägt jetzt ${C.ic} ${C.nm}. Steht ${r.id === "heil" ? "dir" : r.nm === "Luna" || r.nm === "Ole" ? "ihr" : "ihm"} super!`; renderCostumes();
      }, "chip" + (ok ? "" : " lk"));
      b.setAttribute("aria-label", `${C.nm}${ok ? "" : `, ab ${C.stars} Sternen`}`); b.setAttribute("aria-pressed", String(!!c && (H.costume || {})[r.id] === k)); b.title = ok ? C.nm : `${C.nm} · ab ${C.stars} ⭐`;
      bx.appendChild(b);
    });
    row.appendChild(bx); box.appendChild(row);
  });
}

/* ---------- Allgemeiner Chat im Ort ---------- */
let wcUnsub = null, wcMsgs = [], wcSeen = 0;
try { wcSeen = +(localStorage.getItem("nebelpfad-wcseen") || 0); } catch (e) {}
const wcName = () => { let n = ""; try { n = localStorage.getItem("nebelpfad-coopname") || ""; } catch (e) {} return n || "Gast"; };
function wcListen() {
  if (wcUnsub || !FB) return;
  const r = FB.ref("coop/WELTCHAT"), h = r.on("value", sn => {
    wcMsgs = Object.values(sn.val() || {}).filter(m => m && m.m).sort((a, b) => (a.t || 0) - (b.t || 0)).slice(-60);
    renderWChat();
  });
  wcUnsub = () => r.off("value", h);
}
function renderWChat() {
  const open = !$("wchatView").hidden, me = wcName();
  $("wcLog").innerHTML = wcMsgs.length ? wcMsgs.map(m => `<div class="cm${m.n === me ? " me" : ""}"><b>${String(m.n || "?").replace(/</g, "&lt;")} <small style="color:var(--muted);font-weight:400">${m.t ? new Date(m.t).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : ""}</small></b>${String(m.m).replace(/</g, "&lt;")}</div>`).join("") : `<span class="none">Noch ist es still hier. Sag doch Hallo! 👋</span>`;
  const last = wcMsgs.length ? wcMsgs[wcMsgs.length - 1].t || 0 : 0;
  if (open) { wcSeen = last; try { localStorage.setItem("nebelpfad-wcseen", wcSeen); } catch (e) {} $("wcLog").scrollTop = 1e6; }
  const unread = wcMsgs.filter(m => (m.t || 0) > wcSeen && m.n !== me).length;
  $("wcBadge").hidden = !unread; $("wcBadge").textContent = unread;
}
function openWChat() {
  if (DB && !FB) { show("socialView"); switchTab("chat"); return; }
  show("wchatView"); $("wcName").value = wcName() === "Gast" ? "" : wcName();
  $("wcNote").hidden = !!FB; $("wcNote").textContent = "Die Verbindung zum Online-Dienst wird gerade aufgebaut … Gleich geht es los.";
  wcListen(); renderWChat();
}
$("toWChat").addEventListener("click", openWChat);
$("wchatBack").addEventListener("click", showVillage);
$("wcName").addEventListener("change", () => { try { localStorage.setItem("nebelpfad-coopname", $("wcName").value.trim().slice(0, 20)); } catch (e) {} renderWChat(); });
$("wcForm").addEventListener("submit", e => {
  e.preventDefault();
  const m = $("wcIn").value.trim().slice(0, 200); if (!m) return;
  if (!FB) { $("wcNote").hidden = false; return; }
  if ($("wcName").value.trim()) try { localStorage.setItem("nebelpfad-coopname", $("wcName").value.trim().slice(0, 20)); } catch (x) {}
  $("wcIn").value = "";
  FB.ref("coop/WELTCHAT").push({ n: wcName(), m, t: Date.now() }).catch(() => { $("wcNote").hidden = false; $("wcNote").textContent = "Die Nachricht konnte gerade nicht geschickt werden."; });
});
// Ungelesene Nachrichten auch im Ort anzeigen, sobald die Verbindung steht
setInterval(() => { if (FB && !wcUnsub) wcListen(); }, 3000);

