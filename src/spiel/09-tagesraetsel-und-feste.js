/* ---------- Tagesrätsel: jeden Tag ein festes Dungeon, für alle gleich ---------- */
const dayKey = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const daySeed = k => Number(k.replace(/-/g, "")) * 7919 % 2147483647;
let dailyT0 = 0;
function dailyLevel() {
  const k = dayKey(), rng = rngFor(daySeed(k));
  const keys = Object.keys(THEMES), tk = keys[Math.floor(rng() * keys.length)], th = THEMES[tk];
  const a = ANIMALS[Math.floor(rng() * ANIMALS.length)], [ench, ring] = ENCH[Math.floor(rng() * ENCH.length)];
  const name = `Tagesrätsel: ${th.art} ${PREFIX[Math.floor(rng() * PREFIX.length)]}${th.noun}`;
  return { id: "tag-" + k, daily: k, fair: true, seed: daySeed(k) + 17, baseOnly: true, noSeeds: true, name, ic: "🧩", theme: tk, wall: th.wall, mode: 0,
    animal: a[0], animalName: a[1], who: a[2], ring, gen: { count: 10, tier: 1, maze: true },
    intro: `🧩 <b>Tagesrätsel vom ${k.split("-").reverse().join(".")}:</b> Heute sieht dieses Dungeon für alle Spieler gleich aus. Schaffst du es mit allen Herzen? Hier helfen nur die fünf Grund-Begleiter.`,
    animalHint: `${a[2]} ist gefangen in ${ench}. Nur die Heilerin kann den Zauber lösen.` };
}
function dailyStreak() {
  const D = H.daily || {}; let n = 0, d = new Date();
  if (!(D[dayKey(d)] && D[dayKey(d)].won)) d.setDate(d.getDate() - 1);
  while (D[dayKey(d)] && D[dayKey(d)].won) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
const dRef = k => FB ? FB.ref("coop/TAG" + k.replace(/-/g, "")) : null;
async function dailyList(k) {
  try {
    if (DB) { const d = await DB.doc("coop/tag" + k.replace(/-/g, "")).get(); return d.exists ? (d.data().list || []) : []; }
    if (FB) return Object.values((await dRef(k).get()).val() || {});
  } catch (e) {}
  return [];
}
async function addDaily(k, e) {
  try {
    if (DB) { const l = await dailyList(k); l.push(e); await DB.doc("coop/tag" + k.replace(/-/g, "")).set({ list: l.slice(-50) }); }
    else if (FB) await dRef(k).push(e);
  } catch (e2) {}
}
function showDaily() {
  const k = dayKey(), D = (H.daily || {})[k], st = dailyStreak();
  try { $("dailyName").value = localStorage.getItem("nebelpfad-coopname") || ""; } catch (e) {}
  const L = dailyLevel();
  $("dailyCard").innerHTML = `<h2>🧩 Tagesrätsel</h2>
    <p class="sub" style="margin:0">${L.animal} Heute wartet <b>${L.who.replace(/^Der |^Die |^Das /, m => m.toLowerCase())}</b> in diesem Dungeon: ${L.name.replace("Tagesrätsel: ", "")}. Das Dungeon ist für alle gleich und gibt es nur heute. Morgen kommt ein neues.</p>
    <p style="margin:0">${D && D.won ? `✅ Heute geschafft mit ${"💛".repeat(D.hearts)}${"🖤".repeat(Math.max(0, 3 - D.hearts))} in ${D.t.toFixed(1).replace(".", ",")} Sekunden${D.tries > 1 ? ` (im ${D.tries}. Anlauf)` : ""}.` : D && D.tries ? `Heute schon ${D.tries} ${D.tries === 1 ? "Anlauf" : "Anläufe"}. Versuch es noch einmal!` : "Heute noch nicht gespielt."}</p>
    <p style="margin:0">🔥 Serie: <b>${st} ${st === 1 ? "Tag" : "Tage"}</b> in Folge geschafft</p>`;
  const b = btnEl(D && D.won ? "Noch einmal spielen" : "Tagesrätsel starten", () => {
    H.daily = H.daily || {}; const e = H.daily[k] = H.daily[k] || { tries: 0 }; if (!e.won) e.tries++; saveH();
    dailyT0 = Date.now(); startLevel(dailyLevel());
  }, "btn");
  $("dailyCard").appendChild(b);
  show("dailyView"); renderDailyBest(k);
}
async function renderDailyBest(k) {
  const l = (await dailyList(k)).filter(e => e && e.t).sort((a, b) => (b.hearts - a.hearts) || (a.tries - b.tries) || (a.t - b.t)).slice(0, 10);
  $("dailyBest").innerHTML = l.length ? l.map((e, i) => `<div class="wk-row"><span class="ic" aria-hidden="true">${["🥇", "🥈", "🥉"][i] || "⭐"}</span><span class="t"><strong>${String(e.name || "Jemand").replace(/</g, "")}</strong><span>${"💛".repeat(e.hearts || 0)} · ${(+e.t).toFixed(1).replace(".", ",")} Sekunden${e.tries > 1 ? ` · ${e.tries}. Anlauf` : ""}</span></span></div>`).join("")
    : `<span class="none">Heute hat es noch niemand geschafft. Sei die Erste!</span>`;
}
function dailyWin() {
  done = true;
  const k = level.daily, used = (Date.now() - dailyT0) / 1000; H.daily = H.daily || {};
  const e = H.daily[k] = H.daily[k] || { tries: 1 }, first = !e.won;
  let gift = [];
  if (first) {
    e.won = true; e.hearts = tries; e.t = Math.round(used * 10) / 10;
    gift = [rollDrop(0.2)]; if (tries >= 3) gift.push(RARE_SEEDS[Math.floor(Math.random() * RARE_SEEDS.length)]);
    gift.forEach(g => add(H.seeds, g)); gemAdd(1);
    let nm = ""; try { nm = ($("dailyName").value || localStorage.getItem("nebelpfad-coopname") || "").trim().slice(0, 20); } catch (x) {}
    addDaily(k, { name: nm || "Ohne Namen", hearts: tries, t: e.t, tries: e.tries || 1 });
  }
  saveH();
  const st = dailyStreak();
  $("winIcon").textContent = level.animal; $("winTitle").textContent = "Tagesrätsel gelöst! 🧩";
  $("winText").innerHTML = first
    ? `Geschafft mit ${"💛".repeat(tries)}${"🖤".repeat(Math.max(0, 3 - tries))} in <b>${e.t.toFixed(1).replace(".", ",")} Sekunden</b>. Dein Ergebnis steht jetzt in der Tages-Bestenliste.<br>🔥 Serie: ${st} ${st === 1 ? "Tag" : "Tage"} in Folge.<br><br>🎁 Belohnung: ${gift.map(g => HERBS[g].ic + " " + HERBS[g].nm + (HERBS[g].rare ? " (selten!)" : "")).join(", ")} als Samen.${tries >= 3 ? " Für alle Herzen gab es einen seltenen Samen extra." : ""}`
    : `Noch einmal geschafft! Für die Bestenliste zählt dein erster Sieg von heute. Morgen wartet ein neues Rätsel.`;
  $("home").textContent = "Zurück";
  setTimeout(() => { $("win").hidden = false; }, reduce ? 0 : 1100);
}
$("mtab-daily").addEventListener("click", showDaily);
function showFest() { renderFest(); show("festView"); }
$("mtab-fest").addEventListener("click", showFest);
$("mgX").addEventListener("click", mgClose);
$("mgModal").addEventListener("keydown", e => { if (e.key === "Escape") mgClose(); });
$("dailyName").addEventListener("change", () => { try { localStorage.setItem("nebelpfad-coopname", $("dailyName").value.trim().slice(0, 20)); } catch (e) {} });

/* ---------- Feste im Jahr ---------- */
const FESTS = {
  winter: { nm: "Schneedorf", ic: "❄️", months: [0], theme: "gipfel", seed: "eisbl", fx: "snow", col: "#ffffff",
    txt: "Leise fällt Schnee auf die Berge, und im Dorf glitzern die Eiszapfen.", animals: [["🐧", "Schneepinguin", "Der Schneepinguin"], ["🐻‍❄️", "Eisbär", "Der Eisbär"], ["🦭", "Eisrobbe", "Die Eisrobbe"]], deco: ["⛄", "Schneemann"], deco2: ["🛷", "Schlitten"], piece: ["⛄", "Schneebälle", "Schneeball"], coin: ["❄️", "Eiskristalle"], cos: ["🧤", "Fäustlinge"], span: "1. bis 31. Januar", mon: "Januar" },
  masken: { nm: "Maskenfest", ic: "🎭", months: [1], theme: "ruine", seed: "eisbl", fx: "confetti", col: "#f5a3c7",
    txt: "In der alten Ruine wird getanzt, und überall fliegt buntes Konfetti.", animals: [["🦝", "Maskenwaschbär", "Der Maskenwaschbär"], ["🦜", "Konfettipapagei", "Der Konfettipapagei"], ["🐼", "Maskenpanda", "Der Maskenpanda"]], deco: ["🎪", "Festzelt"], deco2: ["🎈", "Luftballons"], piece: ["🎭", "Maskenteile", "Maskenteil"], coin: ["🎊", "Konfetti"], cos: ["🎭", "Ballmaske"], span: "1. bis 28. Februar", mon: "Februar" },
  fruehling: { nm: "Blütenfest", ic: "🌷", months: [2], theme: "wiese", seed: "kirsch", fx: "petal", col: "#f5b8d0",
    txt: "Überall blühen die Bäume, und rosa Blüten tanzen durch die Luft.", animals: [["🐣", "Frühlingsküken", "Das Frühlingsküken"], ["🐝", "Blütenbiene", "Die Blütenbiene"], ["🐞", "Marienkäfer", "Der Marienkäfer"]], deco: ["🌷", "Tulpenbeet"], deco2: ["🪺", "Vogelnest"], piece: ["🌸", "Blütenblätter", "Blütenblatt"], coin: ["🐞", "Glückskäfer"], cos: ["👒", "Blütenhut"], span: "1. bis 31. März", mon: "März" },
  regen: { nm: "Regenbogenfest", ic: "🌈", months: [3], theme: "see", seed: "kirsch", fx: "rain", col: "#9fd8ff",
    txt: "Nach jedem Aprilschauer spannt sich ein Regenbogen über den See.", animals: [["🐸", "Regenfrosch", "Der Regenfrosch"], ["🐌", "Regenschnecke", "Die Regenschnecke"], ["🦆", "Regenente", "Die Regenente"]], deco: ["🪣", "Regentonne"], deco2: ["🌧️", "Regenwolke"], piece: ["🌈", "Regenbogenfarben", "Regenbogenfarbe"], coin: ["💧", "Tautropfen"], cos: ["☂️", "Regenschirm"], span: "1. bis 30. April", mon: "April" },
  falter: { nm: "Falterfest", ic: "🦋", months: [4], theme: "wiese", seed: "kirsch", fx: "petal", col: "#ffe27a",
    txt: "Die Wiesen summen und duften, und tausend Falter tanzen über den Blumen.", animals: [["🦋", "Zitronenfalter", "Der Zitronenfalter"], ["🐛", "Raupe Rosalie", "Die Raupe Rosalie"], ["🐦", "Maienvogel", "Der Maienvogel"]], deco: ["🌼", "Blumenwiese"], deco2: ["🍯", "Honigtopf"], piece: ["🪻", "Fliederblüten", "Fliederblüte"], coin: ["🍯", "Honigtropfen"], cos: ["🌼", "Gänseblümchenkranz"], span: "1. bis 31. Mai", mon: "Mai" },
  sommer: { nm: "Sonnwendfest", ic: "☀️", months: [5], theme: "see", seed: "gluehb", fx: "spark", col: "#ffd36b",
    txt: "Der längste Tag des Jahres: Die Sonne glitzert auf dem Wasser.", animals: [["🦩", "Flamingo", "Der Flamingo"], ["🐠", "Sonnenfisch", "Der Sonnenfisch"], ["🦀", "Strandkrabbe", "Die Strandkrabbe"]], deco: ["🪁", "Drachen"], deco2: ["⛱️", "Sonnenschirm"], piece: ["☀️", "Sonnenstrahlen", "Sonnenstrahl"], coin: ["🐚", "Muscheln"], cos: ["🕶️", "Sonnenbrille"], span: "1. bis 30. Juni", mon: "Juni" },
  gluehw: { nm: "Glühwürmchenfest", ic: "✨", months: [6], theme: "wald", seed: "gluehb", fx: "firefly", col: "#e8ff8a",
    txt: "In den warmen Nächten leuchten tausend Glühwürmchen im Wald.", animals: [["🦗", "Grille", "Die Grille"], ["🦇", "Nachtfledermaus", "Die Nachtfledermaus"], ["🦎", "Sommereidechse", "Die Sommereidechse"]], deco: ["🛖", "Waldhütte"], deco2: ["🔥", "Lagerfeuer"], piece: ["✨", "Glühfunken", "Glühfunken"], coin: ["🫐", "Waldbeeren"], cos: ["🌙", "Mondanhänger"], span: "1. bis 31. Juli", mon: "Juli" },
  sterne: { nm: "Sternschnuppenfest", ic: "🌠", months: [7], theme: "gipfel", seed: "gluehb", fx: "star", col: "#c9d4ff",
    txt: "Hoch oben auf dem Gipfel regnet es Sternschnuppen. Wünsch dir was!", animals: [["🐢", "Sternenschildkröte", "Die Sternenschildkröte"], ["🐬", "Nachtdelfin", "Der Nachtdelfin"], ["🐑", "Traumschaf", "Das Traumschaf"]], deco: ["🔭", "Fernrohr"], deco2: ["🌌", "Sternenteppich"], piece: ["⭐", "Sternensplitter", "Sternensplitter"], coin: ["🌟", "Sternstaub"], cos: ["⭐", "Sternhaarspange"], span: "1. bis 31. August", mon: "August" },
  ernte: { nm: "Erntefest", ic: "🌾", months: [8], theme: "wiese", seed: "kuerb", fx: "leaf", col: "#e8b86b",
    txt: "Die Felder sind golden, und überall duftet es nach Äpfeln und Brot.", animals: [["🐹", "Erntehamster", "Der Erntehamster"], ["🐻", "Honigbär", "Der Honigbär"], ["🐭", "Feldmaus", "Die Feldmaus"]], deco: ["🌽", "Maiskolben"], deco2: ["🥧", "Erntekuchen"], piece: ["🌾", "Ährenbündel", "Ährenbündel"], coin: ["🍎", "Äpfel"], cos: ["🧺", "Erntekörbchen"], span: "1. bis 30. September", mon: "September" },
  kuerbis: { nm: "Kürbisfest", ic: "🍂", months: [9], theme: "wald", seed: "kuerb", fx: "leaf", col: "#ff9a3a",
    txt: "Bunte Blätter wirbeln durch den Wald, und überall leuchten Kürbisse.", animals: [["🐈‍⬛", "Kürbiskatze", "Die Kürbiskatze"], ["🦡", "Herbstdachs", "Der Herbstdachs"], ["🐗", "Eichelschwein", "Das Eichelschwein"]], deco: ["🌰", "Kastanienkorb"], deco2: ["🍏", "Apfelkiste"], piece: ["🍂", "Herbstblätter", "Herbstblatt"], coin: ["🍬", "Bonbons"], cos: ["🍁", "Ahornkrone"], span: "1. bis 31. Oktober", mon: "Oktober" },
  herbst: { nm: "Laternenfest", ic: "🏮", months: [10], theme: "wald", seed: "kuerb", fx: "lantern", col: "#ffb35a",
    txt: "Im Wald schweben warme Laternen, und es riecht nach Kürbis und Kastanien.", animals: [["🦔", "Laternenigel", "Der Laternenigel"], ["🦉", "Herbstkauz", "Der Herbstkauz"], ["🐿️", "Kastanienhörnchen", "Das Kastanienhörnchen"]], deco: ["🎃", "Kürbis"], deco2: ["🍂", "Laubhaufen"], piece: ["🏮", "Laternenteile", "Laternenteil"], coin: ["🌰", "Kastanien"], cos: ["🎃", "Kürbismütze"], span: "1. bis 30. November", mon: "November" },
  lichter: { nm: "Lichtermarkt", ic: "🕯️", months: [11], theme: "gipfel", seed: "eisbl", fx: "snow", col: "#ffd36b",
    txt: "Auf dem Markt duftet es nach Lebkuchen, und überall funkeln Lichter im Schnee.", animals: [["🦌", "Rentier", "Das Rentier"], ["🐰", "Schneehase", "Der Schneehase"], ["🦊", "Polarfuchs", "Der Polarfuchs"]], deco: ["🎄", "Tannenbaum"], deco2: ["🕯️", "Kerzenkranz"], piece: ["🔔", "Glöckchen", "Glöckchen"], coin: ["🍪", "Lebkuchen"], cos: ["🧦", "Ringelsocken"], span: "1. bis 31. Dezember", mon: "Dezember" }
};
const festNow = (d = new Date()) => { const k = Object.keys(FESTS).find(k => FESTS[k].months.includes(d.getMonth())); return { k, ...FESTS[k] }; };
const festYear = (d = new Date()) => d.getFullYear();
function festState() { const F = festNow(), id = F.k + "-" + festYear(); H.fest = H.fest || {}; H.fest[id] = H.fest[id] || { done: [] }; return { F, id, st: H.fest[id] }; }
function festLevel() {
  const { F, st } = festState(), th = THEMES[F.theme];
  const next0 = F.animals.find(a => !st.done.includes(a[1]));
  // Alle Festtiere gerettet: Beim Weiterfeiern wartet ein Festgeschenk statt eines Tieres
  const replay = !next0, next = next0 || [F.ic, "Festgeschenk", "Das Festgeschenk"];
  return { id: "fest-" + F.k, fest: F.k, festReplay: replay, name: `${F.ic} ${F.nm}: ${th.art} ${PREFIX[Math.floor(Math.random() * PREFIX.length)]}${th.noun}`, ic: F.ic, theme: F.theme, wall: th.wall, mode: 0,
    animal: next[0], animalName: next[1], who: next[2],
    ring: F.col, gen: { count: 9, tier: 1 },
    animalTile: null,
    intro: replay ? `${F.ic} <b>${F.nm}!</b> ${F.txt} Alle Festtiere sind schon gerettet. Am Ende des Weges wartet ein <b>Festgeschenk</b> mit ${FEST_COIN[F.k][1]} und Festsamen auf dich.` : `${F.ic} <b>${F.nm}!</b> ${F.txt} Irgendwo hier wartet <b>${next[2].replace(/^D/, "d")}</b> auf dich.`,
    animalHint: replay ? "Ein schön verpacktes Festgeschenk, mit einem Zauberband verschnürt. Nur deine Hände können es öffnen." : `${next[2]} ist in einem Festzauber gefangen. Nur die Heilerin kann den Zauber lösen.` };
}
function festWin() {
  done = true;
  if (level.festReplay) {
    const { F } = festState(), sd = Math.random() < 0.4 ? 1 : 0; if (sd) add(H.seeds, F.seed, sd);
    addFood(1);
    const coinTxt = coinGain(5 + Math.floor(Math.random() * 3)); saveH();
    $("winIcon").textContent = "🎁"; $("winTitle").textContent = `${F.nm}: Festgeschenk geöffnet!`;
    $("winText").innerHTML = `Im Geschenk liegen:<br>${coinTxt}<br>🎁 ${sd ? `1× ${HERBS[F.seed].ic} ${HERBS[F.seed].nm} als Samen und ` : ""}ein Leckerbissen für die Lichtung.`;
    $("home").textContent = "Zurück";
    setTimeout(() => { $("win").hidden = false; }, reduce ? 0 : 1100);
    return;
  }
  const { F, st } = festState(), nm = level.animalName, first = !st.done.includes(nm);
  if (first) st.done.push(nm);
  H.festAnimals = H.festAnimals || []; if (!H.festAnimals.some(a => a.nm === nm)) H.festAnimals.push({ ic: level.animal, nm });
  const n = 1; add(H.seeds, F.seed, n);
  const extra = []; addFood(2); gemAdd(first ? 1 : 0);
  const coinTxt = coinGain(first ? 8 : 4);
  let txt = `${level.animal} <b>${nm}</b> zieht auf deine Tierlichtung 🌳<br><br>${coinTxt}<br>🎁 Belohnung: ${n}× ${HERBS[F.seed].ic} ${HERBS[F.seed].nm} als Samen (gibt es nur zu diesem Fest!).`;
  H.festDeco = H.festDeco || []; if (!H.festDeco.includes(F.k)) { H.festDeco.push(F.k); txt += `<br>${F.deco[0]} Neu für die Lichtung: <b>${F.deco[1]}</b>.`; }
  if (first && st.done.length === 3) txt = `${level.animal} <b>${nm}</b> ist frei, und damit hast du <b>alle drei Festtiere</b> gerettet: ${F.animals.map(a => a[0] + " " + a[1]).join(", ")}. Sie wohnen jetzt alle auf deiner Tierlichtung 🌳` + txt.slice(txt.indexOf("<br><br>")) + `<br><br>🎁 Ab jetzt findest du beim Weiterfeiern Festgeschenke mit ${FEST_COIN[F.k][1]} und Festsamen.`;
  saveH();
  $("winIcon").textContent = level.animal; $("winTitle").textContent = first && st.done.length === 3 ? `🌟 ${F.nm} abgeschlossen!` : `${F.nm}: ${nm} ist frei!`; $("winText").innerHTML = txt; $("home").textContent = "Zurück";
  setTimeout(() => { $("win").hidden = false; }, reduce ? 0 : 1100);
}
const FEST_PIECE = Object.fromEntries(Object.entries(FESTS).map(([k, f]) => [k, f.piece]));
const FEST_NEED = 5;
const FEST_SPAN = Object.fromEntries(Object.entries(FESTS).map(([k, f]) => [k, f.span]));
// Jedes Fest hat seine eigene Währung
const FEST_COIN = Object.fromEntries(Object.entries(FESTS).map(([k, f]) => [k, f.coin]));
const FEST_DECO2 = Object.fromEntries(Object.entries(FESTS).map(([k, f]) => [k, f.deco2]));
const coinsOf = st => st.coins || 0;
function shopItems(F) {
  const C = FEST_COIN[F.k], d2 = FEST_DECO2[F.k], ck = "f_" + F.k, cos = COSTUMES[ck];
  return [
    { id: "seed", ic: HERBS[F.seed].ic, nm: `${HERBS[F.seed].nm}-Samen`, txt: "2 Festsamen für deinen Garten", cost: 4, buy: () => add(H.seeds, F.seed, 2) },
    { id: "rare", ic: "🌹", nm: "Seltener Samen", txt: "Ein zufälliger seltener Samen", cost: 8, buy: () => add(H.seeds, RARE_SEEDS[Math.floor(Math.random() * RARE_SEEDS.length)]) },
    { id: "food", ic: "🧺", nm: "Festkorb", txt: "4 Leckerbissen für die Tierlichtung", cost: 3, buy: () => addFood(4) },
    { id: "cos", ic: cos.ic, nm: cos.nm, txt: "Festkleidung für einen Begleiter (im Tierbuch anziehen)", cost: 15, once: () => (H.costOwned || []).includes(ck), buy: () => { H.costOwned = H.costOwned || []; H.costOwned.push(ck); } },
    { id: "deco", ic: d2[0], nm: d2[1], txt: "Besonderer Schmuck für die Lichtung", cost: 10, once: () => (H.festDeco2 || []).includes(F.k), buy: () => { H.festDeco2 = H.festDeco2 || []; H.festDeco2.push(F.k); } },
    { id: "potion", ic: POTIONS.herz.ic, nm: POTIONS.herz.nm, txt: POTIONS.herz.eff, cost: 12, buy: () => add(H.potions, "herz") },
    { id: "gem", ic: "💎", nm: "Diamant", txt: "Zum Verhexen der Zeit", cost: 10, buy: () => { H.gems = (H.gems || 0) + 1; } }
  ];
}
const cic = k => `<span class="cic cic-${k}" aria-hidden="true">${FEST_COIN[k][0]}</span>`;
function coinGain(n) { const { F, st } = festState(); st.coins = coinsOf(st) + n; saveH(); return `${cic(F.k)} +${n} ${FEST_COIN[F.k][1]}`; }
function renderFest() {
  const { F, st } = festState(), box = $("festBox"); if (!box) return;
  const P = FEST_PIECE[F.k], have = st.pieces || 0, allDone = st.done.length >= 3, next = F.animals.find(a => !st.done.includes(a[1]));
  box.className = "card fest fest-" + F.k; box.style.borderColor = F.col; box.style.background = `linear-gradient(160deg, ${F.col}2e, var(--panel) 70%)`;
  box.innerHTML = `<h2>${F.ic} ${F.nm} <small class="span">(${FEST_SPAN[F.k]})</small></h2><p class="sub" style="margin:0">${F.txt}</p>
    <p style="margin:0">Festtiere: ${F.animals.map(a => st.done.includes(a[1]) ? `${a[0]} ${a[1]} ✅` : `❔ ${a[1]}`).join(" · ")}</p>
    ${allDone ? `<p class="fest-done">🌟 <b>${F.nm} abgeschlossen!</b> Du hast alle drei Festtiere gerettet, sie wohnen jetzt auf deiner Tierlichtung. Feier ruhig weiter: Am Ende jedes Weges wartet jetzt ein 🎁 Festgeschenk mit ${FEST_COIN[F.k][1]} und Festsamen.</p>` : `<p style="margin:0">Um <b>${next[1]}</b> zu finden, brauchst du <b>${FEST_NEED} ${P[1]}</b>. Die bekommst du in den Fest-Minispielen.</p>
    <div class="pieces" aria-label="${have} von ${FEST_NEED} ${P[1]}">${Array.from({ length: FEST_NEED }, (_, i) => `<span class="${i < have ? "on" : ""}">${P[0]}</span>`).join("")}</div>`}
    <p class="sub" style="margin:0">Nur jetzt: ${HERBS[F.seed].ic} ${HERBS[F.seed].nm}-Samen und ${F.deco[0]} ${F.deco[1]} für die Lichtung.</p>
    <p style="margin:0">Festwährung: <b class="coins">${cic(F.k)} ${coinsOf(st)} ${FEST_COIN[F.k][1]}</b></p>`;
  const games = el("div", "mg-list");
  MINIGAMES.forEach(g => games.appendChild(btnEl(`${g.ic} ${g.nm}`, () => openMinigame(g.id), "chip")));
  box.appendChild(games);
  const ready = allDone || have >= FEST_NEED;
  const go2 = btnEl(allDone ? "🎁 Weiterfeiern und Festgeschenk suchen" : ready ? `${P[0]} Festabenteuer starten` : `🔒 Festabenteuer (${have}/${FEST_NEED} ${P[1]})`, () => {
    if (!ready) { $("festBox").querySelector(".pieces").classList.remove("bump"); void box.offsetWidth; $("festBox").querySelector(".pieces").classList.add("bump"); return; }
    if (!allDone) { st.pieces = have - FEST_NEED; saveH(); }
    startLevel(festLevel());
  }, "btn");
  if (!ready) go2.classList.add("locked");
  box.appendChild(go2);
  // Festmarkt
  const C = FEST_COIN[F.k], shop = el("div", "shop");
  shop.innerHTML = `<h3>🛍️ Festmarkt</h3><p class="sub" style="margin:0">Hier bezahlst du mit ${cic(F.k)} ${C[1]}. Die bekommst du in den Minispielen und im Festabenteuer.</p>`;
  shopItems(F).forEach(it => {
    const sold = it.once && it.once(), row = el("div", "wk-row");
    row.innerHTML = `<span class="ic" aria-hidden="true">${it.ic}</span><span class="t"><strong>${it.nm}</strong><span>${it.txt}</span></span>`;
    const b = btnEl(sold ? "✓ gekauft" : `${it.cost} ${C[0]}`, () => {
      if (sold) return;
      if (coinsOf(st) < it.cost) { $("festMsg").textContent = `Dafür brauchst du ${it.cost} ${C[0]} ${C[1]}. Du hast ${coinsOf(st)}.`; SND.fx.wrong(); return; }
      st.coins = coinsOf(st) - it.cost; it.buy(); saveH(); SND.fx.brewed();
      renderFest(); $("festMsg").textContent = `🛍️ Gekauft: ${it.ic} ${it.nm}!` + (it.id === "cos" ? " Zieh es im Tierbuch einem Begleiter an." : it.id === "deco" ? " Du findest es jetzt beim Schmücken auf der Tierlichtung." : "");
    }, "btn sm");
    if (!sold) b.innerHTML = `${it.cost} ${cic(F.k)}`;
    b.disabled = !!sold; if (!sold && coinsOf(st) < it.cost) b.classList.add("locked");
    row.appendChild(b); shop.appendChild(row);
  });
  const msg = el("p", "note"); msg.id = "festMsg"; msg.setAttribute("aria-live", "polite");
  shop.appendChild(msg); box.appendChild(shop);
}
/* ---------- Fest-Minispiele ---------- */
const MINIGAMES = [
  { id: "memory", ic: "🃏", nm: "Paare finden" },
  { id: "catch", ic: "🧺", nm: "Auffangen" },
  { id: "simon", ic: "🎶", nm: "Melodie merken" }
];
let MG = null;
function mgEnd(win, txt) {
  if (!MG) return;
  clearInterval(MG.timer); clearTimeout(MG.to);
  const { F, st } = festState(), P = FEST_PIECE[F.k];
  let out = txt;
  const earn = win ? 3 + Math.floor(Math.random() * 3) : 1;
  out += `<br><br>${coinGain(earn)}`;
  if (win) { st.pieces = Math.min(FEST_NEED, (st.pieces || 0) + 1); saveH(); SND.fx.win(); xpAdd(6); out += `<br>${P[0]} <b>+1 ${P[2]}!</b> Du hast jetzt ${st.pieces}/${FEST_NEED}.` + (st.pieces >= FEST_NEED && st.done.length < 3 ? " Das reicht! Jetzt kannst du das Festabenteuer starten." : ""); }
  else SND.fx.fail();
  $("mgBody").innerHTML = `<div class="mg-res"><div class="big">${win ? "🎉" : "🌫️"}</div><p>${out}</p></div>`;
  const again = btnEl("Noch einmal", () => openMinigame(MG.id), "btn"), back = btnEl("Zurück zum Fest", mgClose, "back");
  const row = el("div", "modal-btns"); row.append(back, again); $("mgBody").appendChild(row);
  MG.over = true; renderFest();
}
function mgClose() { if (MG) { clearInterval(MG.timer); clearTimeout(MG.to); } MG = null; $("mgModal").hidden = true; renderFest(); }
function openMinigame(id) {
  if (MG) { clearInterval(MG.timer); clearTimeout(MG.to); }
  const { F } = festState(), g = MINIGAMES.find(x => x.id === id);
  MG = { id, F };
  $("mgModal").hidden = false; $("mgModal").className = "modal mg fest-" + F.k; $("mgModal").querySelector(".mg-box").style.setProperty("border-color", F.col, "important");
  $("mgTitle").textContent = `${g.ic} ${g.nm}`;
  ({ memory: mgMemory, catch: mgCatch, simon: mgSimon })[id](F);
}
// 1) Paare finden: 6 Paare, höchstens 14 Fehlversuche
function mgMemory(F) {
  const ics = [...F.animals.map(a => a[0]), F.deco[0], HERBS[F.seed].ic, F.ic];
  const cards = [...ics, ...ics].sort(() => Math.random() - .5);
  let open = [], found = 0, miss = 0; const MAXMISS = 8;
  $("mgBody").innerHTML = `<p class="mg-info">Finde alle Paare! Du darfst dich <b id="mgMiss">${MAXMISS}</b>-mal irren.</p><div class="mg-mem"></div>`;
  const grid = $("mgBody").querySelector(".mg-mem");
  cards.forEach((ic, i) => {
    const c = el("button", "mg-card"); c.type = "button"; c.innerHTML = `<span class="back">❔</span><span class="front">${ic}</span>`; c.setAttribute("aria-label", "Karte " + (i + 1));
    c.addEventListener("click", () => {
      if (!MG || MG.over || c.classList.contains("up") || open.length >= 2) return;
      c.classList.add("up"); SND.fx.click(); open.push([c, ic]);
      if (open.length === 2) {
        const [[a, x], [b, y]] = open;
        if (x === y) { a.classList.add("ok"); b.classList.add("ok"); open = []; found++; SND.fx.plop(); if (found === ics.length) MG.to = setTimeout(() => mgEnd(true, `Alle ${ics.length} Paare gefunden, mit ${miss} ${miss === 1 ? "Irrtum" : "Irrtümern"}!`), 500); }
        else { miss++; $("mgMiss").textContent = Math.max(0, MAXMISS - miss); MG.to = setTimeout(() => { a.classList.remove("up"); b.classList.remove("up"); open = []; if (miss >= MAXMISS) mgEnd(false, "Oh nein, zu viele Irrtümer. Versuch es gleich noch einmal!"); }, 750); }
      }
    });
    grid.appendChild(c);
  });
}
// 2) Auffangen: Festteile fallen vom Himmel, tippe sie an. Nebelwolken nicht berühren!
function mgCatch(F) {
  const P = FEST_PIECE[F.k], GOAL = 12, TIME = 30;
  let got = 0, end = Date.now() + TIME * 1000;
  $("mgBody").innerHTML = `<p class="mg-info">Fang <b>${GOAL}</b> ${P[0]} ein, bevor die Zeit abläuft! Tippe sie an. Pass auf die 🌫️ Nebelwolken auf, die kosten 3 Sekunden.</p><div class="mg-hud"><span id="mgT">⏳ ${TIME}</span><span id="mgG">${P[0]} 0/${GOAL}</span></div><div class="mg-sky"></div>`;
  const sky = $("mgBody").querySelector(".mg-sky");
  const spawn = () => {
    const bad = Math.random() < 0.25, it = el("button", "mg-fall" + (bad ? " bad" : ""), bad ? "🌫️" : P[0]); it.type = "button";
    it.style.left = (6 + Math.random() * 84) + "%"; it.style.animationDuration = (2.6 + Math.random() * 1.6) + "s";
    it.addEventListener("pointerdown", e => { e.preventDefault(); if (!MG || MG.over) return;
      if (bad) { end -= 3000; SND.fx.wrong(); it.textContent = "💨"; }
      else { got++; SND.fx.plop(); it.textContent = "✨"; $("mgG").textContent = `${P[0]} ${got}/${GOAL}`; if (got >= GOAL) mgEnd(true, `Super gefangen! ${GOAL} ${P[1]} in deinem Korb.`); }
      it.classList.add("hit"); setTimeout(() => it.remove(), 250); });
    it.addEventListener("animationend", () => it.remove());
    sky.appendChild(it);
  };
  MG.timer = setInterval(() => {
    if (!MG || MG.over) return;
    if (Math.random() < 0.45) spawn();
    const left = Math.max(0, (end - Date.now()) / 1000); $("mgT").textContent = `⏳ ${Math.ceil(left)}`;
    if (left <= 0) mgEnd(false, `Die Zeit ist um! Du hast ${got} von ${GOAL} gefangen. Gleich noch einmal?`);
  }, 250);
  spawn();
}
// 3) Melodie merken: Laternen leuchten nacheinander auf, tippe sie in der gleichen Reihenfolge
function mgSimon(F) {
  const COLS = ["#e0566b", "#ffd36b", "#6fc3ff", "#7cd67c"], NOTES = [60, 64, 67, 72], GOAL = 6;
  const ic = FEST_PIECE[F.k][0];
  let seq = [], pos = 0, busy = true; MG.seq = seq;
  $("mgBody").innerHTML = `<p class="mg-info">Schau genau hin: Die Lichter leuchten nacheinander auf und spielen eine Melodie. Tippe sie danach in der <b>gleichen Reihenfolge</b>. Schaffst du ${GOAL} Töne?</p><p class="mg-hud"><span id="mgLvl">Runde 1/${GOAL}</span><span id="mgSt">👀 Zuschauen …</span></p><div class="mg-simon"></div>`;
  const pads = COLS.map((c, i) => { const b = el("button", "mg-pad", ic); b.type = "button"; b.style.setProperty("--c", c); b.setAttribute("aria-label", "Licht " + (i + 1)); $("mgBody").querySelector(".mg-simon").appendChild(b); return b; });
  const flash = i => { pads[i].classList.add("lit"); SND.fx.note(NOTES[i]); setTimeout(() => pads[i].classList.remove("lit"), 380); };
  const play = () => { busy = true; $("mgSt").textContent = "👀 Zuschauen …"; seq.forEach((v, k) => { MG.to = setTimeout(() => { flash(v); if (k === seq.length - 1) setTimeout(() => { busy = false; pos = 0; if ($("mgSt")) $("mgSt").textContent = "👆 Jetzt du!"; }, 450); }, 600 + k * 600); }); };
  const next = () => { seq.push(Math.floor(Math.random() * 4)); $("mgLvl").textContent = `Runde ${seq.length}/${GOAL}`; play(); };
  pads.forEach((b, i) => b.addEventListener("click", () => {
    if (!MG || MG.over || busy) return;
    flash(i);
    if (i !== seq[pos]) { busy = true; MG.to = setTimeout(() => mgEnd(false, `Ups, falsches Licht! Du hast ${seq.length - 1} ${seq.length - 1 === 1 ? "Runde" : "Runden"} geschafft.`), 400); return; }
    pos++;
    if (pos >= seq.length) { busy = true; if (seq.length >= GOAL) MG.to = setTimeout(() => mgEnd(true, `Wunderschön! Du hast dir alle ${GOAL} Töne gemerkt.`), 500); else MG.to = setTimeout(next, 700); }
  }));
  next();
}
// Festliche Teilchen über dem Spielfeld
let festParts = [];
function festFx(t) {
  const F = FESTS[level.fest]; if (!F || reduce) return;
  if (!festParts.length) for (let i = 0; i < 22; i++) festParts.push({ x: Math.random() * cv.width, y: Math.random() * cv.height, s: Math.random(), p: Math.random() * 6 });
  if (festParts.length < 26 && Math.random() < 0.05) festParts.push({ x: Math.random() * cv.width, y: F.fx === "lantern" || F.fx === "firefly" ? cv.height + 10 : -10, s: Math.random(), p: Math.random() * 6 });
  ctx.save();
  festParts = festParts.filter(q => q.y > -30 && q.y < cv.height + 30);
  festParts.forEach(q => {
    q.p += 0.03;
    if (F.fx === "snow") { q.y += 0.6 + q.s; q.x += Math.sin(q.p) * 0.5; ctx.fillStyle = "#ffffffcc"; ctx.beginPath(); ctx.arc(q.x, q.y, 1.5 + q.s * 2, 0, 7); ctx.fill(); }
    if (F.fx === "petal") { q.y += 0.5 + q.s * 0.6; q.x += Math.sin(q.p) * 1.1; ctx.fillStyle = "#f5b8d0dd"; ctx.beginPath(); ctx.ellipse(q.x, q.y, 3.5, 2, q.p, 0, 7); ctx.fill(); }
    if (F.fx === "lantern") { q.y -= 0.35 + q.s * 0.3; q.x += Math.sin(q.p) * 0.3; const g = ctx.createRadialGradient(q.x, q.y, 1, q.x, q.y, 14); g.addColorStop(0, "#ffd08acc"); g.addColorStop(1, "#ff9a3a00"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q.x, q.y, 14, 0, 7); ctx.fill(); ctx.fillStyle = "#ff9a3a"; ctx.fillRect(q.x - 3, q.y - 4, 6, 8); }
    if (F.fx === "confetti") { q.y += 0.7 + q.s * 0.6; q.x += Math.sin(q.p * 2) * 0.8; ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(q.p * 3); ctx.fillStyle = ["#e0566b", "#ffd36b", "#6fc3ff", "#7cd67c", "#b48cf2"][Math.floor(q.s * 5)]; ctx.fillRect(-3, -1.5, 6, 3); ctx.restore(); }
    if (F.fx === "rain") { q.y += 2.4 + q.s * 1.5; q.x -= 0.4; ctx.strokeStyle = "#9fd8ffaa"; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - 2, q.y + 8); ctx.stroke(); }
    if (F.fx === "spark") { q.y += 0.25; q.x += Math.sin(q.p) * 0.4; const a = Math.abs(Math.sin(q.p * 2)); ctx.fillStyle = `rgba(255,227,122,${a})`; ctx.beginPath(); ctx.arc(q.x, q.y, 1.6 + q.s * 1.6, 0, 7); ctx.fill(); }
    if (F.fx === "star") { q.y += 0.15; const a = Math.abs(Math.sin(q.p * 1.3)); ctx.fillStyle = `rgba(230,236,255,${a})`; ctx.beginPath(); ctx.arc(q.x, q.y, 1.2 + q.s * 1.4, 0, 7); ctx.fill(); if (q.s > .93) { ctx.strokeStyle = `rgba(255,255,255,${a})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(q.x, q.y); ctx.lineTo(q.x - 18, q.y - 8); ctx.stroke(); q.x += 2; } }
    if (F.fx === "leaf") { q.y += 0.6 + q.s * 0.5; q.x += Math.sin(q.p) * 1.2; ctx.save(); ctx.translate(q.x, q.y); ctx.rotate(Math.sin(q.p) * 1.2); ctx.fillStyle = ["#e8862e", "#c9562a", "#e8b86b"][Math.floor(q.s * 3)]; ctx.beginPath(); ctx.ellipse(0, 0, 4.5, 2.4, 0, 0, 7); ctx.fill(); ctx.restore(); }
    if (F.fx === "firefly") { q.y -= 0.25 + q.s * 0.3; q.x += Math.sin(q.p * 1.7) * 0.8; const a = 0.4 + 0.6 * Math.abs(Math.sin(q.p * 2)); ctx.fillStyle = `rgba(232,255,138,${a})`; ctx.shadowColor = "#e8ff8a"; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(q.x, q.y, 2.2, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
  });
  ctx.restore();
}


