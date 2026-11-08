/* ---------- Aufräum-Spiel auf der Tierlichtung ---------- */
const CL_BINS = [
  { id: "kompost", ic: "🪣", nm: "Kompost", hint: "Laub, Blätter, Apfelreste", items: ["🍂", "🍁", "🍃", "🍏"] },
  { id: "stein", ic: "🪨", nm: "Steinhaufen", hint: "Steine, Kastanien, Stöcke, Muscheln", items: ["🪨", "🌰", "🪵", "🐚"] },
  { id: "nest", ic: "🪺", nm: "Nestkiste", hint: "Federn, Wolle, Fäden", items: ["🪶", "🧶", "🧵", "🎀"] }
];
const CL_TIME = 40;
let CL = null;
const binOf = ic => CL_BINS.find(b => b.items.includes(ic));
function clDay() { const G = glState(); return G.cleanDay === today(); }
function clInfo() {
  const G = glState(), best = G.cleanBest || 0;
  $("clInfo").innerHTML = (clDay() ? "✨ Heute ist die Lichtung schon blitzblank. Du kannst trotzdem noch einmal spielen, für deinen Rekord." : "🍂 Über Nacht hat der Wind Laub, Steine und Federn auf die Lichtung geweht. Räum auf, bevor die Zeit abläuft!")
    + `<br>So geht's: Tippe auf ein Ding und dann auf den richtigen Korb darunter. Richtig sortiert gibt es Punkte, und mehrere hintereinander geben Bonus. Falsch sortiert kostet 3 Sekunden.${best ? `<br>🏆 Dein Rekord: ${best} Punkte` : ""}`;
  $("glade").classList.toggle("messy", !clDay());
  const box = $("glItems"); box.querySelectorAll(".gl-mess").forEach(e => e.remove());
  if (!clDay()) for (let i = 0; i < 9; i++) { const b = CL_BINS[i % 3], e = el("span", "gl-mess", b.items[i % 4]); e.style.left = (8 + (i * 37) % 84) + "%"; e.style.top = (40 + (i * 23) % 52) + "%"; box.appendChild(e); }
}
function clStart() {
  if (CL) return;
  glSel = null;
  CL = { t0: Date.now(), end: Date.now() + CL_TIME * 1000, score: 0, combo: 0, sel: null, items: [], timer: null, spawn: 0, sorted: 0, wrong: 0 };
  $("clLayer").hidden = false; $("clHud").hidden = false; $("clBins").hidden = false; $("clCard").hidden = true;
  $("glItems").querySelectorAll(".gl-mess").forEach(e => e.remove());
  const bins = $("clBins"); bins.innerHTML = "";
  CL_BINS.forEach(b => { const btn = el("button", "cl-bin"); btn.type = "button"; btn.id = "clb-" + b.id; btn.innerHTML = `<span class="ic" aria-hidden="true">${b.ic}</span><b>${b.nm}</b><small>${b.items.join(" ")}</small>`; btn.addEventListener("click", () => clDrop(b)); bins.appendChild(btn); });
  for (let i = 0; i < 6; i++) clSpawn();
  gsay("🧹 Los geht's! Tippe auf ein Ding und dann auf den passenden Korb.");
  $("glade").scrollIntoView({ block: "start", behavior: reduce ? "auto" : "smooth" });
  CL.timer = setInterval(clTick, 100);
}
function clSpawn() {
  if (!CL || CL.items.length >= 9) return;
  const b = CL_BINS[Math.floor(Math.random() * 3)], ic = b.items[Math.floor(Math.random() * b.items.length)];
  const it = el("button", "cl-it", ic); it.type = "button"; it.setAttribute("aria-label", "Ding zum Aufräumen");
  it.style.left = (8 + Math.random() * 84) + "%"; it.style.top = (38 + Math.random() * 54) + "%";
  it.addEventListener("click", ev => { ev.stopPropagation(); if (!CL) return; CL.sel && CL.sel.classList.remove("sel"); CL.sel = it; it.classList.add("sel"); SND.fx.click(); document.querySelectorAll(".cl-bin").forEach(x => x.classList.add("ready")); });
  it.dataset.born = Date.now();
  $("clLayer").appendChild(it); CL.items.push(it);
}
function clDrop(b) {
  if (!CL || !CL.sel) { gsay("Tippe zuerst auf ein Ding auf der Wiese."); return; }
  const it = CL.sel, ok = binOf(it.textContent) === b, btn = $("clb-" + b.id);
  document.querySelectorAll(".cl-bin").forEach(x => x.classList.remove("ready"));
  btn.classList.remove("ok", "bad"); void btn.offsetWidth;
  if (ok) {
    CL.combo++; CL.sorted++; const pts = 1 + Math.floor(CL.combo / 3); CL.score += pts;
    btn.classList.add("ok"); fly(it.textContent, rectOf(it), rectOf(btn), { ms: 500 }); if (CL.combo % 3 === 0) fly(`+${pts}`, rectOf(btn), null, { cls: "txt", dy: -40 });
    SND.fx.plop();
    it.remove(); CL.items = CL.items.filter(x => x !== it); CL.sel = null;
    if (Math.random() < 0.85) clSpawn(); if (CL.items.length < 4) clSpawn();
  } else {
    CL.combo = 0; CL.wrong++; CL.end -= 3000; btn.classList.add("bad"); SND.fx.wrong();
    gsay(`Hoppla, ${it.textContent} gehört nicht in ${b.nm === "Kompost" ? "den Kompost" : b.nm === "Steinhaufen" ? "den Steinhaufen" : "die Nestkiste"}. −3 Sekunden!`);
    it.classList.remove("sel"); CL.sel = null;
  }
  clHud();
}
function clHud() {
  const left = Math.max(0, (CL.end - Date.now()) / 1000);
  $("clTime").textContent = `⏳ ${Math.ceil(left)}`; $("clTime").classList.toggle("low", left <= 10);
  $("clScore").textContent = `⭐ ${CL.score}`; $("clCombo").textContent = CL.combo >= 3 ? `🔥 ${CL.combo}er-Serie` : "";
}
function clTick() {
  if (!CL) return;
  if ($("gladeView").hidden) { clStop(false); return; }
  // ab und zu weht der Wind etwas Neues herein, und ein Tier läuft durch und lässt etwas fallen
  if (Math.random() < 0.035) clSpawn();
  const now = Date.now(); CL.items.forEach(i => i.classList.toggle("old", now - (+i.dataset.born) > 6000));
  clHud();
  if (now >= CL.end) clStop(true);
}
function clStop(finished) {
  clearInterval(CL.timer);
  const res = CL; CL = null;
  $("clLayer").innerHTML = ""; $("clLayer").hidden = true; $("clHud").hidden = true; $("clBins").hidden = true; $("clCard").hidden = false;
  if (!finished) { clInfo(); return; }
  const G = glState(), first = !clDay(), rec = res.score > (G.cleanBest || 0);
  if (rec) G.cleanBest = res.score;
  let txt = `🧹 <b>Fertig!</b> Du hast ${res.sorted} Dinge richtig einsortiert und <b>${res.score} Punkte</b> geholt.${rec ? " 🏆 Neuer Rekord!" : ""}`;
  if (first) {
    G.cleanDay = today(); xpAdd(8);
    const food = addFood(res.score >= 25 ? 4 : res.score >= 12 ? 3 : 2), seed = res.score >= 25 ? rollDrop(0.2) : null; if (seed) add(H.seeds, seed);
    txt += `<br>🎁 Die Tiere bedanken sich: ${food.map(k => FOODS[k].ic).join(" ")} für den Futterkorb${seed ? ` und ${HERBS[seed].ic} ${HERBS[seed].nm} als Samen` : ""}.`;
    if (res.score >= 12) { H.gems = gems() + 1; txt += " 💎 Unter dem Laub lag ein Diamant!"; }
    if (res.score >= 12) { rescuedAnimals().forEach(a => { G.friend[a.nm] = Math.min(10, (G.friend[a.nm] || 0) + 1); }); txt += " ⭐ Alle Tiere freuen sich über die saubere Lichtung: +1 Ruf bei allen!"; }
    SND.fx.win();
  } else txt += " Heute gab es die Belohnung schon, morgen wieder.";
  saveH(); renderGlade(); clInfo(); gsay(txt);
}
$("clStart").addEventListener("click", clStart);

/* ---------- Reiter Kräuter ---------- */
const FARM_PATHS = [
  { id: "kurz", ic: "🌿", nm: "Kurzer Kräuterpfad", txt: "Ein paar Schritte, schnell geschafft", count: 3, herbs: [1, 2], spots: [0, 1] },
  { id: "lang", ic: "🍃", nm: "Langer Kräuterpfad", txt: "Mehr Hindernisse, dafür mehr Kräuter und Samenfunde", count: 6, herbs: [2, 4], spots: [1, 2] }
];
let farmSel = FARM_PATHS[0];
function showFarm() {
  const box = $("farmList"); box.innerHTML = "";
  FARM_PATHS.forEach(f => {
    const b = el("button", "trip"); b.type = "button"; b.id = "farm-" + f.id;
    b.innerHTML = `<span class="ic" aria-hidden="true">${f.ic}</span><span class="t"><strong>${f.nm}</strong><span>${f.txt} · ${f.herbs[0]} bis ${f.herbs[1]} Kräuter im Korb</span></span><span class="st">Start</span>`;
    b.addEventListener("click", () => { farmSel = f; startLevel(farmLevel(getSettlement(cur))); });
    box.appendChild(b);
  });
  $("farmBag").innerHTML = bagHtml(H.herbs, HERBS, "Noch keine Kräuter. Lauf einen Kräuterpfad!");
  show("farmView");
}
$("mtab-farm").addEventListener("click", showFarm);
$("farmToGarden").addEventListener("click", () => openHouse("gardenSec"));
$("farmToAlch").addEventListener("click", () => openHouse("alchSec"));



/* ---------- Level der Heilerin ---------- */
const LVL_MAX = 50;
const xpNeed = l => 40 + 20 * (l - 1);           // so viel Erfahrung braucht ein Level
function heroLvl(xp = H.xp || 0) { let l = 1; while (l < LVL_MAX && xp >= xpNeed(l)) { xp -= xpNeed(l); l++; } return l; }
function heroProg(xp = H.xp || 0) { let l = 1; while (l < LVL_MAX && xp >= xpNeed(l)) { xp -= xpNeed(l); l++; } return { l, cur: xp, need: l < LVL_MAX ? xpNeed(l) : 0 }; }
const TITLES = [[1, "Lehrling der Laterne"], [3, "Nebelwandlerin"], [5, "Laternenträgerin"], [8, "Tierfreundin"], [10, "Kräuterhexe"], [15, "Mondheilerin"], [20, "Sternenhüterin"], [25, "Hüterin des Nebels"], [30, "Meisterheilerin"], [40, "Legende von Nebelpfad"], [50, "Herz des Waldes"]];
const titleOf = l => TITLES.filter(t => t[0] <= l).pop()[1];
const LAMPS = [[1, "gold", "#f2c76b", "Gold"], [4, "rosa", "#f5a3c7", "Rosenlicht"], [6, "gruen", "#7cd67c", "Waldgrün"], [9, "blau", "#6fc3ff", "Mondblau"], [12, "lila", "#b48cf2", "Zauberlila"], [18, "weiss", "#f3f6ff", "Sternenweiß"], [28, "rainbow", "rainbow", "Regenbogen"]];
const lampCol = t => { const k = (H.lamp || "gold"), L = LAMPS.find(x => x[1] === k && x[0] <= heroLvl()) || LAMPS[0]; if (L[2] !== "rainbow") return L[2]; return `hsl(${((t || performance.now()) / 20) % 360}, 85%, 70%)`; };
const extraPlots = l => (l >= 7) + (l >= 14) + (l >= 21);
const potMaxFor = l => l >= 10 ? 3 : 2;
const heartBonus = l => l >= 30 ? 1 : 0;
const foodBonus = l => l >= 6 ? 2 : 0;
// Was es auf jedem besonderen Level gibt (Diamanten gibt es auf jedem Level)
const LVL_REWARDS = [
  ...TITLES.slice(1).map(t => [t[0], "📜", "Titel", `„${t[1]}“`]),
  ...LAMPS.slice(1).map(L => [L[0], "🏮", "Laternenfarbe", L[3]]),
  [6, "🧺", "Größerer Futterkorb", "Jeden Tag 2 Leckerbissen mehr für die Lichtung"],
  [7, "🌱", "Neues Beet", "Ein 10. Beet im Kräutergarten"],
  [10, "🧪", "Größere Tranktasche", "3 statt 2 Tränke pro Abenteuer"],
  [11, "🗿", "Lichtungsschmuck", "Eine Statue für deine Tierlichtung"],
  [13, "🪶", "Kleidung", "Federschmuck für einen Begleiter"],
  [14, "🌱", "Neues Beet", "Ein 11. Beet im Kräutergarten"],
  [17, "🎠", "Lichtungsschmuck", "Ein Karussell für die Tiere"],
  [21, "🌱", "Neues Beet", "Ein 12. Beet im Kräutergarten"],
  [22, "🌈", "Kleidung", "Regenbogenband für einen Begleiter"],
  [24, "🏰", "Lichtungsschmuck", "Ein kleines Schloss für die Lichtung"],
  [30, "💛", "Extra-Herz", "Ein 4. Herz in allen Abenteuern (außer Zeitdungeons und Tagesrätsel)"],
  [35, "🦄", "Kleidung", "Einhornhorn für einen Begleiter"]
].sort((a, b) => a[0] - b[0]);
const gemsFor = l => 1 + (l % 5 === 0 ? 3 : 0);
let xpNote = 0, lvlNote = [];
function xpAdd(n, quiet) {
  if (!n || typeof H === "undefined") return;
  const before = heroLvl(); H.xp = (H.xp || 0) + n; const after = heroLvl();
  for (let l = before + 1; l <= after; l++) {
    const g = gemsFor(l); H.gems = (H.gems || 0) + g;
    const rw = LVL_REWARDS.filter(r => r[0] === l).map(r => `${r[1]} ${r[2]}: ${r[3]}`);
    lvlNote.push(`⬆️ <b>Level ${l}!</b> ${titleOf(l) !== titleOf(l - 1) ? `Neuer Titel: <b>${titleOf(l)}</b>. ` : ""}Geschenk: 💎 ${g}${rw.length ? " · " + rw.join(" · ") : ""}`);
  }
  while (H.plots.length < 9 + extraPlots(after)) H.plots.push(null);
  saveH();
  xpNote += n;
  if (after > before) { SND.fx.win(); $("lvlBar").classList.remove("up"); void $("lvlBar").offsetWidth; $("lvlBar").classList.add("up"); }
  if (!quiet) xpToast();
  renderLvlBar();
}
let toastT = null;
function xpToast() {
  if (!xpNote && !lvlNote.length) return;
  const t = $("toast"); t.className = "toast" + (lvlNote.length ? " big" : "");
  const notes = lvlNote.length > 2 ? [`⬆️ <b>${lvlNote.length} Level aufgestiegen!</b> Alle Geschenke siehst du auf der Seite deiner Heilerin.`, lvlNote[lvlNote.length - 1]] : lvlNote;
  t.innerHTML = (xpNote ? `⭐ +${xpNote} Erfahrung` : "") + (notes.length ? "<br>" + notes.join("<br>") : "");
  t.hidden = false; xpNote = 0; lvlNote = [];
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 4200);
}
// Beim Gewinnbild: Erfahrung und Level-Aufstieg direkt in den Text
function xpFlush() {
  if (!xpNote && !lvlNote.length) return;
  $("winText").innerHTML += `<br><br>⭐ <b>+${xpNote} Erfahrung</b>` + (lvlNote.length ? "<br>" + lvlNote.join("<br>") : "");
  xpNote = 0; lvlNote = [];
}
function winXp() {
  if (!level) return 0;
  if (window.__escaped) { window.__escaped = false; return 12; }
  if (level.replay) return 12;
  if (level.coop) return 20; if (level.weaver) return 60; if (level.superD) return 50; if (level.secret) return 40;
  if (level.daily) return 25; if (level.timed) return 15; if (level.farm) return 8; if (level.fest) return level.festReplay ? 10 : 25;
  return 30;
}
function renderLvlBar() {
  const P = heroProg(), b = $("lvlBar"); if (!b) return;
  b.innerHTML = `<span class="lv">${P.l}</span><span class="info"><span class="ti2">${titleOf(P.l)}</span><span class="xpbar"><i style="width:${P.need ? Math.round(P.cur / P.need * 100) : 100}%"></i></span><small>${P.need ? `${P.cur} / ${P.need} Erfahrung bis Level ${P.l + 1}` : "Höchstes Level erreicht!"}</small></span>`;
}
function openHero() {
  const P = heroProg(), l = P.l;
  $("heroSub").textContent = `Level ${l} · ${titleOf(l)}`;
  $("heroCard").innerHTML = `<span class="lv">${l}</span><h2 style="margin:4px 0 0">${titleOf(l)}</h2><span class="xpbar"><i style="width:${P.need ? Math.round(P.cur / P.need * 100) : 100}%"></i></span><small>${P.need ? `${P.cur} / ${P.need} Erfahrung bis Level ${l + 1}` : "Höchstes Level erreicht!"} · insgesamt ${H.xp || 0} Erfahrung</small>
    <small>Gerade aktiv: ${9 + extraPlots(l)} Beete · ${potMaxFor(l)} Tränke pro Abenteuer${heartBonus(l) ? " · 4 Herzen" : ""}${foodBonus(l) ? " · größerer Futterkorb" : ""}</small>`;
  const lp = $("heroLamps"); lp.innerHTML = "";
  LAMPS.forEach(L => { const b = el("button", "lamp" + (L[2] === "rainbow" ? " rainbow" : "")); b.type = "button"; b.style.background = L[2]; b.title = `${L[3]} (ab Level ${L[0]})`; b.setAttribute("aria-label", b.title);
    b.disabled = l < L[0]; b.setAttribute("aria-pressed", String((H.lamp || "gold") === L[1]));
    b.addEventListener("click", () => { H.lamp = L[1]; saveH(); openHero(); }); lp.appendChild(b); });
  const all = [];
  for (let k = 2; k <= Math.min(LVL_MAX, Math.max(l + 6, 36)); k++) { const rw = LVL_REWARDS.filter(r => r[0] === k); all.push([k, `💎 ${gemsFor(k)}` + (rw.length ? " · " + rw.map(r => `${r[1]} ${r[2]}: ${r[3]}`).join(" · ") : "")]); }
  $("heroRewards").innerHTML = all.map(([k, t]) => `<div class="wk-row rw-row${k > l ? " lock" : ""}"><span class="ic" aria-hidden="true">${k <= l ? "✅" : "🔒"}</span><span class="t"><strong>Level ${k}</strong><span>${t}</span></span></div>`).join("");
  $("heroXp").innerHTML = [["🐾", "Tier gerettet", 30], ["🌫️", "Tier entwischt (Fast geschafft)", 12], ["🗝️", "Geheimstadt", 40], ["🌀", "Irrgarten", 50], ["🕸️", "Nebelnetz", 60], ["🤝", "Koop", 20], ["🧩", "Tagesrätsel", 25], ["⏳", "Zeitdungeon", 15], ["🎉", "Festtier (Festgeschenk 10)", 25], ["🌿", "Kräuterpfad", 8], ["🎲", "Fest-Minispiel gewonnen", 6], ["🧹", "Aufräum-Spiel", 8], ["🧺", "Ernten", 2], ["⚗️", "Trank brauen", 3]]
    .map(([ic, t, n]) => `<div class="wk-row"><span class="ic" aria-hidden="true">${ic}</span><span class="t"><strong>${t}</strong></span><span class="need">+${n} ⭐</span></div>`).join("");
  show("heroView");
}
$("lvlBar").addEventListener("click", openHero);
setTimeout(renderLvlBar, 0);
$("heroBack").addEventListener("click", showVillage);
/* ---------- Diamanten 💎 und Zeit verhexen ---------- */
let gemAt = null, gemNote = 0;
const gems = () => H.gems || 0;
function gemAdd(n) { if (!n) return; H.gems = gems() + n; gemNote += n; saveH(); }
// Beim Gewinnbild einen Hinweis auf gefundene Diamanten anhängen
function gemFlush() {
  if (!gemNote) return;
  $("winText").innerHTML += `<br><br>💎 <b>+${gemNote} ${gemNote === 1 ? "Diamant" : "Diamanten"}!</b> Du hast jetzt ${gems()} 💎.`;
  gemNote = 0;
}
function placeGem(l) {
  gemAt = null;
  if (l.coop || l.fair || l.resume) return;
  if (Math.random() > (l.secret || l.superD || l.weaver ? 0.6 : 0.25)) return;
  const free = []; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (grid[y][x] === "." && Math.abs(x - px) + Math.abs(y - py) > 2 && diaryAt !== x + "," + y) free.push([x, y]);
  if (free.length) { const [x, y] = free[Math.floor(Math.random() * free.length)]; gemAt = x + "," + y; }
}
function checkGem() {
  if (!gemAt || gemAt !== px + "," + py) return;
  gemAt = null; H.gems = gems() + 1; saveH(); SND.fx.seed(); sparkle(px, py);
  say(`💎 Du findest einen funkelnden <b>Diamanten</b>! Jetzt hast du ${gems()} 💎. Damit kannst du im Hexenhaus die Zeit verhexen.`);
}
function drawGem(t) {
  if (!gemAt) return;
  const [x, y] = gemAt.split(",").map(Number), cx = x * S + S / 2, cy = y * S + S / 2;
  const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 22);
  g.addColorStop(0, `rgba(159,228,255,${reduce ? .5 : .35 + .3 * Math.sin(t / 300)})`); g.addColorStop(1, "rgba(159,228,255,0)");
  ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, 22, 0, 7); ctx.fill();
  ctx.font = "22px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("💎", cx, cy + (reduce ? 0 : Math.sin(t / 450) * 2));
}
// Zeit verhexen: für 5 Diamanten eine Stunde lang Tag oder Nacht
const HEX_COST = 5, HEX_MIN = 30;
const hexActive = () => H && H.timeHex && Date.now() < H.timeHex.until ? H.timeHex : null;
function openTimeHex() {
  const night = isNight(), act = hexActive(), want = night ? "Tag" : "Nacht";
  $("rmIcon").textContent = "🔮";
  $("rmTitle").textContent = "Zeit verhexen";
  if (act) {
    const m = Math.ceil((act.until - Date.now()) / 60000);
    $("rmText").innerHTML = `Die Zeit ist gerade verhext! Noch <b>${m} Minuten</b> ist es ${act.mode === "nacht" ? "🌙 Nacht" : "☀️ Tag"}. Danach läuft die Uhr wieder ganz normal.<br><br>Du kannst sie auch wieder <b>umgekehrt verhexen</b> und ${act.mode === "nacht" ? "den ☀️ Tag" : "die 🌙 Nacht"} herbeizaubern, für ${HEX_MIN} Minuten. Das kostet ${HEX_COST} 💎. Du hast <b>${gems()} 💎</b>.`;
    $("rmOk").hidden = false; $("rmOk").disabled = gems() < HEX_COST; $("rmOk").textContent = `🔮 ${want} herbeizaubern (${HEX_COST} 💎)`;
  } else {
    $("rmText").innerHTML = `Mit einem Zauberspruch machst du aus ${night ? "der Nacht einen hellen ☀️ Tag" : "dem Tag eine dunkle 🌙 Nacht"}, für <b>${HEX_MIN} Minuten</b>. So wachsen ${night ? "die Tagkräuter" : "die Nachtkräuter"}, auch wenn es draußen ${night ? "dunkel" : "hell"} ist.<br><br>Das kostet <b>${HEX_COST} 💎</b>. Du hast <b>${gems()} 💎</b>.` + (gems() < HEX_COST ? "<br><br>Dir fehlen noch Diamanten. Du findest sie in Abenteuern, beim Ernten, im Kräuterpfad, im Tagesrätsel, auf Festen und beim Aufräumen." : "");
    $("rmOk").hidden = false; $("rmOk").disabled = gems() < HEX_COST; $("rmOk").textContent = `🔮 ${want} herbeizaubern (${HEX_COST} 💎)`;
  }
  resetStep = "hex"; $("resetModal").hidden = false; $("rmCancel").textContent = gems() < HEX_COST ? "Schließen" : "Abbrechen"; $("rmCancel").focus();
}
function castTimeHex() {
  if (gems() < HEX_COST) return;
  H.gems -= HEX_COST; H.timeHex = { mode: isNight() ? "tag" : "nacht", until: Date.now() + HEX_MIN * 60000 }; saveH();
  SND.fx.brewed(); $("resetModal").hidden = true; resetStep = 0;
  for (let i = 0; i < 8; i++) fly(["✨", "🔮", "⭐"][i % 3], rectOf($("hxClock")), null, { dx: (i - 4) * 18, dy: -60 - (i % 3) * 20, delay: i * 70, ms: 1100 });
  openHex();
  $("hxSub").textContent = H.timeHex.mode === "nacht" ? "🔮 Du hast die Nacht herbeigezaubert! 30 Minuten lang wachsen jetzt die Nachtkräuter." : "🔮 Du hast den Tag herbeigezaubert! 30 Minuten lang wachsen jetzt die Tagkräuter.";
}
/* ---------- Hexenhaus-Übersicht ---------- */
// Uhr: Spielzeit ist die echte Uhrzeit. Nacht von 19 bis 7 Uhr.
function untilSwitch(d = new Date()) {
  const t = new Date(d); t.setSeconds(0, 0);
  const act = hexActive(); if (act) { const m = Math.ceil((act.until - d) / 60000); return `${m} Min. (verhext 🔮)`; }
  const night = realNight(d);
  if (night) { if (d.getHours() >= 19) t.setDate(t.getDate() + 1); t.setHours(7, 0); }
  else t.setHours(19, 0);
  const m = Math.max(0, Math.round((t - d) / 60000)), h = Math.floor(m / 60), mm = m % 60;
  return h && !mm ? `${h} Std.` : (h ? `${h} Std. ` : "") + `${mm} Min.`;
}
const phaseText = () => isNight() ? `🌙 Nacht · der Tag beginnt in ${untilSwitch()}` : `☀️ Tag · die Nacht beginnt in ${untilSwitch()}`;
function tickClock() {
  const d = new Date(), h = d.getHours(), m = d.getMinutes();
  if ($("hxTime")) {
    $("hxTime").textContent = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} Uhr`;
    $("hxPhase").textContent = phaseText();
    $("hxHour").setAttribute("transform", `rotate(${(h % 12) * 30 + m * .5} 30 30)`);
    $("hxMin").setAttribute("transform", `rotate(${m * 6} 30 30)`);
  }
  if ($("hxGems")) $("hxGems").textContent = `💎 ${gems()}`;
  if (!$("hexView").hidden && $("hxScene").classList.contains("night") !== isNight()) openHex();
  if (!$("houseView").hidden) { const s = getSettlement(cur); $("hSub").textContent = `Dein Hexenhaus in ${s.name}. 🕰️ ${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")} Uhr · ${phaseText()}`; }
}
setInterval(tickClock, 20000);
function openHex() {
  const night = isNight();
  $("hxScene").classList.toggle("night", night);
  $("hxSub").textContent = night ? "🌙 Es ist Nacht. Im Lebkuchenhaus brennt Licht, und die Nachtkräuter wachsen." : "☀️ Es ist Tag. Die Sonne scheint auf dein Lebkuchenhaus, und die Tagkräuter wachsen.";
  const g = $("hxGrid"); g.innerHTML = "";
  let ripe = 0, pest = 0, free = 0;
  H.plots.forEach(p => {
    const c = el("span");
    if (!p) { c.className = "hx-hard"; free++; }
    else if (p.soil) { c.textContent = "·"; free++; }
    else if (p.w >= 3) { c.className = "hx-ready"; c.textContent = HERBS[p.h].ic; ripe++; }
    else { if (p.pest) { c.className = "hx-pest"; pest++; } c.textContent = p.pest === "snail" ? "🐌" : p.pest === "weed" ? "🌾" : p.w === 0 ? "🌱" : "☘️"; }
    g.appendChild(c);
  });
  tickClock(); $("hxClock").classList.toggle("hexed", !!hexActive());
  $("hxBedInfo").textContent = ripe ? `✨ ${ripe} ${ripe === 1 ? "Beet ist" : "Beete sind"} reif!` : pest ? `🐌 ${pest} ${pest === 1 ? "Beet braucht" : "Beete brauchen"} Hilfe` : free === 9 ? "Alles frei, pflanze etwas!" : "Pflanzen, gießen, ernten";
  show("hexView");
}
$("toHex").addEventListener("click", openHex);
$("toHexCard").addEventListener("click", openHex);
$("mtab-hex").addEventListener("click", openHex);
$("hexBack").addEventListener("click", showVillage);
$("hxPot").addEventListener("click", () => openHouse("alchSec"));
$("hxClock").addEventListener("click", openTimeHex);
$("hxClock").addEventListener("keydown", e => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openTimeHex(); } });
$("hxBeds").addEventListener("click", () => openHouse("gardenSec"));
