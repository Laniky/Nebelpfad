/* ---------- Hexenhaus ---------- */
let selSeed = null;
const hsay = h => { $("hMsg").innerHTML = h; };
const bagHtml = (bag, defs, empty) => {
  const ks = Object.keys(defs).filter(k => bag[k]);
  return ks.length ? ks.map(k => `<span class="chip">${defs[k].ic} ${defs[k].nm} ×${bag[k]}</span>`).join("") : `<span class="none">${empty}</span>`;
};
const canBrew = id => Object.entries(POTIONS[id].need).every(([h, n]) => (H.herbs[h] || 0) >= n);
const openNote = (s, was) => !was && secretOpen(s) ? `<br>🗝️ Alle Geheimaufgaben in ${s.name} erfüllt! <b>${getSecret(s.n).name}</b> ist jetzt offen.` : "";

function renderHouse() {
  const s = getSettlement(cur);
  if (selSeed && !H.seeds[selSeed]) selSeed = null;
  { const d = new Date(); $("hSub").textContent = `Dein Hexenhaus in ${s.name}. 🕰️ ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")} Uhr · ${phaseText()}`; }
  const pl = $("plots"); pl.innerHTML = "";
  H.plots.forEach((p, i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "plot"; b.id = "plot-" + i;
    const act = lastAct && lastAct.i === i ? lastAct.t : "";
    let soil = "hard", inner = "", lab = "";
    if (!p) { lab = `Feste Erde<br><b>🪏 Umgraben</b>`; }
    else if (p.soil) { soil = "dug"; inner = `<span class="e hole" aria-hidden="true"></span>`; lab = selSeed ? `<b>${HERBS[selSeed].ic} hier pflanzen</b>` : "Lockere Erde<br>Samen wählen"; }
    else if (p.w < 3) {
      soil = act === "water" || act === "grow" ? "dug wet" : "dug";
      b.dataset.w = p.w;
      const plant = p.w === 0 ? "🌱" : p.w === 1 ? "☘️" : HERBS[p.h].ic;
      inner = `<span class="e${p.w === 2 ? " bud" : ""}" aria-hidden="true">${plant}</span>`;
      if (p.pest === "weed") inner += `<span class="pest weed" aria-hidden="true">🌾</span>`;
      if (p.pest === "snail") inner += `<span class="pest snail" aria-hidden="true">🐌</span>`;
      const dots = `<span class="wdots" aria-label="${p.w} von 3 Mal gegossen">${[0, 1, 2].map(k => `<i class="${k < p.w ? "on" : ""}"></i>`).join("")}</span>`;
      const nm2 = `${HERBS[p.h].nm} ${timeIc(p.h)}`;
      lab = p.pest === "weed" ? `${nm2}<br><b>✋ Unkraut zupfen</b>` : p.pest === "snail" ? `${nm2}<br><b>👋 Schnecke verscheuchen</b>` : !timeOk(p.h) ? `${nm2}<br>😴 schläft gerade ${dots}` : `${nm2}<br>💧 Gießen ${dots}`;
      if (!timeOk(p.h) && !p.pest) b.classList.add("sleep");
      if (p.pest) b.classList.add("pesty");
    }
    else { soil = "dug"; b.classList.add("ready"); inner = `<span class="e" aria-hidden="true">${HERBS[p.h].ic}</span>`; lab = `${HERBS[p.h].nm}<br><b>🧺 Ernten!</b>`; }
    b.classList.add(...soil.split(" "));
    if (act) b.classList.add(act);
    const tool = { dig: "🪏", water: "🫗", grow: "🫗", ripe: "🫗", pull: "✋", shoo: "👋", plant: "🌰" }[act];
    b.innerHTML = `<span class="soilbed" aria-hidden="true"></span>${inner}<span class="s">${lab}</span>` + (tool && !reduce ? `<span class="tool t-${act}" aria-hidden="true">${tool}</span>` : "");
    b.addEventListener("click", () => plotClick(i));
    pl.appendChild(b);
  });
  const sb = $("seedBag"); sb.innerHTML = "";
  const seedKeys = Object.keys(HERBS).filter(k => H.seeds[k]);
  if (!seedKeys.length) sb.innerHTML = `<span class="none">Keine Samen mehr. Gerettete Tiere und Geheimstädte schenken dir neue.</span>`;
  seedKeys.forEach(k => {
    const c = document.createElement("button"); c.type = "button"; c.className = "chip"; c.id = "seed-" + k;
    c.setAttribute("aria-pressed", String(selSeed === k));
    c.textContent = `${HERBS[k].ic} ${HERBS[k].nm}${timeIc(k) ? " " + timeIc(k) : ""} ×${H.seeds[k]}`;
    c.addEventListener("click", () => { selSeed = selSeed === k ? null : k; renderHouse(); hsay(selSeed ? `${HERBS[k].ic} ${HERBS[k].nm} ausgewählt. Tippe auf ein leeres Beet.` : "Kein Samen ausgewählt."); });
    sb.appendChild(c);
  });
  $("herbBag").innerHTML = bagHtml(H.herbs, HERBS, "Noch keine Kräuter. Ernte welche im Garten.");
  const rl = $("recipes"); rl.innerHTML = "";
  Object.entries(POTIONS).forEach(([id, p]) => {
    const row = document.createElement("div"); row.className = "wk-row";
    if (!H.recipes.includes(id)) {
      row.innerHTML = `<span class="ic" aria-hidden="true">❔</span><span class="t"><strong>Seltenes Rezept</strong><span>Versteckt in einer Geheimstadt.</span></span>`;
      rl.appendChild(row); return;
    }
    const ing = Object.entries(p.need).map(([h, n]) => `${HERBS[h].ic} ${Math.min(H.herbs[h] || 0, n)}/${n}`).join(" · ");
    const have = H.potions[id] || 0;
    row.innerHTML = `<span class="ic" aria-hidden="true">${p.ic}</span><span class="t"><strong>${p.nm}${p.rare ? ' <small class="rare">selten</small>' : ""} <span class="have${have ? "" : " zero"}" title="So viele hast du schon">🧪 ${have} im Vorrat</span></strong><span>${p.eff}<br>${ing}</span></span>`;
    const b = document.createElement("button"); b.type = "button"; b.className = "btn sm"; b.id = "brew-" + id; b.textContent = "Brauen"; b.disabled = !canBrew(id);
    b.addEventListener("click", () => brew(id));
    row.appendChild(b); rl.appendChild(row);
  });
  $("potBag").innerHTML = bagHtml(H.potions, POTIONS, "Noch keine Tränke.");
  lastAct = null;
}

/* ---------- Animationen im Hexenhaus ---------- */
let lastAct = null, brewing = false;
const POTCOL = { gluck: "#9fe0a8", spur: "#b48cf2", herz: "#f2c76b", nebel: "#d4dcef", sonnen: "#ffd36b", tulpen: "#f5a3c7", kleeg: "#6fd88a",
  feuerel: "#ff8a3a", beeren: "#8f9cff", voll: "#ff7fb0", frostat: "#9fe4ff", sterne: "#e8d67a", regen: "#c9a6ff" };
const rectOf = e => e.getBoundingClientRect();
function fly(text, from, to, o = {}) {
  if (reduce || !from) return;
  const s = el("span", "fly" + (o.cls ? " " + o.cls : ""), text);
  const x = from.left + from.width / 2 + (o.jx || 0), y = from.top + from.height / 2 + (o.jy || 0);
  s.style.left = x + "px"; s.style.top = y + "px";
  const dx = to ? to.left + to.width / 2 - x : (o.dx || 0), dy = to ? to.top + to.height / 2 - y : (o.dy == null ? -70 : o.dy);
  s.style.setProperty("--dx", dx + "px"); s.style.setProperty("--dy", dy + "px");
  s.style.setProperty("--ms", (o.ms || 1000) + "ms"); s.style.animationDelay = (o.delay || 0) + "ms";
  $("fxLayer").appendChild(s);
  setTimeout(() => s.remove(), (o.ms || 1000) + (o.delay || 0) + 50);
}
function plotClick(i) {
  const p = H.plots[i], pe = $("plot-" + i), r = pe ? rectOf(pe) : null;
  const clumps = n => { for (let k = 0; k < n; k++) fly("•", r, null, { cls: "clump", dx: (Math.random() - .5) * 90, dy: -30 - Math.random() * 40, delay: 150 + k * 40, ms: 700 }); };
  if (!p) {
    H.plots[i] = { soil: 1 }; lastAct = { i, t: "dig" }; SND.fx.dig(); clumps(8);
    hsay(selSeed ? `🪏 Umgegraben! Die Erde ist schön locker. Tippe noch einmal, um ${HERBS[selSeed].ic} ${HERBS[selSeed].nm} zu pflanzen.` : "🪏 Umgegraben! Die Erde ist schön locker. Wähle unten einen Samen und tippe auf das Beet.");
  } else if (p.soil) {
    if (!selSeed) { hsay("Wähle zuerst unten einen Samen aus."); return; }
    add(H.seeds, selSeed, -1); H.plots[i] = { h: selSeed, w: 0, pest: null }; lastAct = { i, t: "plant" };
    SND.fx.plant(); fly("🌱", r, null, { dy: -40, ms: 700, delay: 350 });
    hsay(`${HERBS[selSeed].ic} ${HERBS[selSeed].nm} gepflanzt. Jetzt dreimal gießen und gut aufpassen!`);
  } else if (p.w < 3 && p.pest === "weed") {
    p.pest = null; lastAct = { i, t: "pull" }; SND.fx.pull();
    fly("🌾", r, null, { dx: 70, dy: -90, ms: 900, delay: 250 }); clumps(4);
    const bonus = Math.random() < 0.08 ? rollDrop(0.1) : null; if (bonus) { add(H.seeds, bonus); fly("🌱", r, null, { dx: -30, dy: -60, delay: 500 }); }
    hsay("✋ Unkraut ausgezupft! Jetzt hat dein Kraut wieder Platz." + (bonus ? ` Im Unkraut hing ein Samen: ${HERBS[bonus].ic} ${HERBS[bonus].nm} 🌱` : ""));
  } else if (p.w < 3 && p.pest === "snail") {
    p.pest = null; lastAct = { i, t: "shoo" }; SND.fx.shoo();
    fly("🐌", r, null, { dx: 110, dy: 10, ms: 1400, delay: 200 });
    hsay("👋 Die Schnecke kriecht beleidigt davon. Deine Blätter sind gerettet!");
  } else if (p.w < 3 && !timeOk(p.h)) {
    const night = HERBS[p.h].time === "nacht";
    fly(night ? "😴" : "🌙", r, null, { dy: -40, ms: 900 });
    hsay(night ? `🌙 ${HERBS[p.h].ic} ${HERBS[p.h].nm} ist ein <b>Nachtkraut</b>. Tagsüber schläft es und wächst nicht. Komm nach 19 Uhr wieder, dann kannst du es gießen.` : `☀️ ${HERBS[p.h].ic} ${HERBS[p.h].nm} ist ein <b>Tagkraut</b>. Nachts schläft es und wächst nicht. Ab 7 Uhr morgens kannst du es wieder gießen.`);
    return;
  } else if (p.w < 3) {
    p.w++; lastAct = { i, t: p.w < 3 ? "water" : "ripe" }; SND.fx.water();
    for (let k = 0; k < 6; k++) fly("💧", r, null, { cls: "drop", ms: 650, delay: 300 + k * 70, jx: (Math.random() - .5) * (r ? r.width * .5 : 0) });
    let pestTxt = "";
    if (p.w < 3 && Math.random() < 0.4) { p.pest = Math.random() < 0.6 ? "weed" : "snail"; pestTxt = p.pest === "weed" ? " Oh, zwischen den Blättern sprießt Unkraut! Zupf es aus, bevor du wieder gießt." : " Oh, eine Schnecke hat dein Kraut entdeckt! Verscheuch sie, bevor du wieder gießt."; }
    if (p.w === 3) { fly("✨", r, null, { dy: -60, delay: 700 }); fly("✨", r, null, { dx: 30, dy: -40, delay: 800 }); }
    hsay(p.w < 3 ? `💧 Gegossen (${p.w}/3). ${p.w === 2 ? "Eine Knospe bildet sich!" : "Die Pflanze wächst!"}${pestTxt}` : `✨ ${HERBS[p.h].nm} blüht und ist reif. Tippe zum Ernten!`);
  } else {
    const s = getSettlement(cur), was = secretOpen(s);
    const TFg = teamFx(), hv2 = 2 + TFg.garden;
    if (Math.random() < 0.08) { H.gems = (H.gems || 0) + 1; setTimeout(() => hsay($("hMsg").innerHTML + " 💎 Zwischen den Wurzeln funkelt ein Diamant!"), 0); fly("💎", r, null, { dy: -70, dx: -26, delay: 400 }); }
    add(H.herbs, p.h, hv2); statsOf(cur).harvest += hv2; xpAdd(2); H.plots[i] = null; lastAct = { i, t: "harvest" }; SND.fx.harvest();
    const back = Math.random() < (TFg.gardenSeed > 0 ? 0.5 : 0.2); if (back) add(H.seeds, p.h);
    const hb = $("herbBag") && !$("herbBag").closest("[hidden]") ? rectOf($("herbBag")) : null;
    for (let k = 0; k < hv2; k++) fly(HERBS[p.h].ic, r, hb, { dx: (k - (hv2 - 1) / 2) * 34, dy: -80, delay: k * 120, ms: 1100 });
    fly(`+${hv2}`, r, null, { cls: "txt", dy: -50, delay: 150 });
    if (back) fly("🌱", r, null, { dy: -45, dx: 28, delay: 500, ms: 900 });
    hsay(`🧺 ${hv2}× ${HERBS[p.h].nm} geerntet!` + (back ? ` Und die Pflanze hat dir einen neuen Samen geschenkt 🌱` : "") + " Die Erde ist jetzt wieder fest, grab sie um, bevor du neu pflanzt." + openNote(s, was));
  }
  saveH(); renderHouse();
}
function brew(id) {
  if (brewing || !canBrew(id)) return;
  const p = POTIONS[id], s = getSettlement(cur), was = secretOpen(s);
  const btn = $("brew-" + id), from = btn ? rectOf(btn) : null, c = $("cauldron"), cr = rectOf(c);
  Object.entries(p.need).forEach(([h, n]) => add(H.herbs, h, -n));
  add(H.potions, id, 1); statsOf(cur).brew++; saveH(); xpAdd(3);
  const finish = () => {
    renderHouse();
    const pb = $("potBag"); fly(p.ic, rectOf(c), rectOf(pb), { ms: 950 });
    setTimeout(() => { pb.classList.remove("bump"); void pb.offsetWidth; pb.classList.add("bump"); }, reduce ? 0 : 800);
    $("cauldronCap").textContent = `Frisch gebraut: ${p.ic} ${p.nm}`; SND.fx.brewed();
    hsay(`⚗️ Es blubbert und funkelt … Du hast <b>${p.ic} ${p.nm}</b> gebraut!` + openNote(s, was));
    brewing = false;
  };
  if (reduce) { c.style.setProperty("--brew", POTCOL[id] || "#6fd8a8"); brewing = true; finish(); return; }
  brewing = true;
  document.querySelectorAll("#recipes .btn").forEach(b => { b.disabled = true; });
  hsay("⚗️ Die Kräuter fallen in den Kessel …");
  $("cauldronCap").textContent = "Es brodelt und zischt …";
  let d = 0;
  Object.entries(p.need).forEach(([h, n]) => { for (let k = 0; k < n; k++) { fly(HERBS[h].ic, from, cr, { delay: d, ms: 700 }); setTimeout(SND.fx.plop, d + 650); d += 160; } });
  setTimeout(() => {
    c.style.setProperty("--brew", POTCOL[id] || "#6fd8a8");
    c.parentElement.style.setProperty("--cbrew", POTCOL[id] || "#6fd8a8");
    c.classList.remove("boil"); void c.offsetWidth; c.classList.add("boil"); SND.fx.bubble();
    for (let k = 0; k < 4; k++) fly("✨", cr, null, { dx: (k - 1.5) * 26, dy: -70, delay: k * 90, ms: 900 });
  }, d + 500);
  setTimeout(finish, d + 1300);
}
let houseSec = "gardenSec";
function openHouse(sec) {
  houseSec = sec === "alchSec" ? "alchSec" : "gardenSec";
  const garden = houseSec === "gardenSec";
  renderHouse();
  $("gardenSec").hidden = !garden; $("alchSec").hidden = garden;
  $("hTitle").textContent = garden ? "Kräutergarten" : "Alchemietisch";
  $("houseSwitch").textContent = garden ? "⚗️ Alchemie" : "🌱 Garten";
  hsay(garden ? "Willkommen im Kräutergarten 🌱 Pflanze Samen, gieße sie und ernte Kräuter." : "Willkommen am Alchemietisch ⚗️ Braue aus deinen Kräutern Tränke für deine Abenteuer.");
  show("houseView");
}
$("toGarden").addEventListener("click", () => openHouse("gardenSec"));
$("toAlchemy").addEventListener("click", () => openHouse("alchSec"));
$("houseBack").addEventListener("click", () => openHex());
$("houseSwitch").addEventListener("click", () => openHouse(houseSec === "gardenSec" ? "alchSec" : "gardenSec"));

function secretWin() {
  done = true;
  const s = getSettlement(cur), first = !H.secret[s.n];
  H.secret[s.n] = true;
  let text = "";
  const nextRec = RARE_ORDER.find(r => !H.recipes.includes(r));
  if (first && nextRec) { H.recipes.push(nextRec); text += `Du hast ein seltenes Rezept gefunden: <b>${POTIONS[nextRec].ic} ${POTIONS[nextRec].nm}</b>!<br>${POTIONS[nextRec].eff}<br><br>`; }
  else if (first) text += "Alle seltenen Rezepte kennst du schon. Dafür ist die Rolle voller Schätze.<br><br>";
  const extra = Math.random() < 0.5 ? "frost" : "moos";
  const sr = Math.random() < 0.5 ? "rose" : "klee"; add(H.seeds, sr, 1); add(H.seeds, extra, 1); saveH();
  text += `In der Rolle versteckt: ${HERBS[sr].ic} 1× ${HERBS[sr].nm} und ${HERBS[extra].ic} 1× ${HERBS[extra].nm} als Samen.`;
  text += perfectBonus();
  text += weaverHint(); if (Math.random() < 0.15) gemAdd(1);
  $("winIcon").textContent = "📜";
  $("winTitle").textContent = `${level.name} geschafft!`;
  $("winText").innerHTML = text;
  $("home").textContent = `Zurück nach ${s.name}`;
  setTimeout(() => { $("win").hidden = false; }, reduce ? 0 : 1100);
}

/* ---------- Tränke im Abenteuer ---------- */
function renderPotbar() {
  const pb = $("potbar"); pb.innerHTML = "";
  const ks = Object.keys(POTIONS).filter(k => H.potions[k]);
  $("tgPots").textContent = `🧪 Tränke · ${ks.length ? `${potUsed}/${POT_MAX}` : "keine"} ${pb.hidden ? "▾" : "▴"}`;
  if (!ks.length) { pb.innerHTML = `<span>Keine Tränke dabei. Im Hexenhaus kannst du welche brauen.</span>`; return; }
  if (potUsed >= POT_MAX) pb.insertAdjacentHTML("beforeend", `<span>Schon ${POT_MAX} Tränke getrunken.</span>`);
  ks.forEach(k => {
    const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.id = "drink-" + k;
    b.disabled = potUsed >= POT_MAX; if (b.disabled) b.style.opacity = ".4";
    b.textContent = `${POTIONS[k].ic} ${POTIONS[k].nm} ×${H.potions[k]}`;
    b.addEventListener("click", () => drink(k));
    pb.appendChild(b);
  });
}
function drink(k) {
  if (guestMode && level && level.coop) { say("Tränke nutzt im Koop der Spieler, der das Spiel erstellt hat."); return; }
  if (done || !H.potions[k]) return;
  if (potUsed >= POT_MAX) { say(`🧪 Du hast in diesem Abenteuer schon ${POT_MAX} Tränke getrunken. Mehr geht nicht, sonst wird dir schwindelig!`); return; }
  const NEED_TILES = { feuerel: ["T", "Dornenranken"], frostat: ["WU", "Wasser"], sterne: ["Q", "verwunschenen Felder"] };
  if (NEED_TILES[k] && !grid.flat().some(c => NEED_TILES[k][0].includes(c))) { say(`${POTIONS[k].ic} Hier gibt es keine ${NEED_TILES[k][1]}. Heb dir den Trank für ein anderes Abenteuer auf.`); return; }
  if (k === "beeren" && tries >= MAX_TRIES) { say("🧃 Deine Herzen sind schon alle voll. Heb dir die Beerenkraft für später auf."); return; }
  add(H.potions, k, -1); potUsed++; saveH(); SND.fx.potion();
  const change = (from, to) => { let n = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (from.includes(grid[y][x])) { tileAnim(x, y, "magic", grid[y][x]); grid[y][x] = to; delete stage[x + "," + y]; sparkle(x, y); n++; } return n; };
  if (k === "sonnen") { fx.bright = true; say("🌞 Deine Laterne strahlt hell wie die Sonne. Du siehst jetzt viel weiter."); }
  if (k === "tulpen") { fx.seedx2 = true; say("🌸 Ein süßer Duft umgibt dich. Jeder Samenfund zählt jetzt doppelt."); }
  if (k === "kleeg") { fx.loot = true; say("🍀 Das Glück ist mit dir. Am Ende gibt es doppelt so viele Belohnungs-Samen."); }
  if (k === "feuerel") { const n = change(["T"], "."); say(n ? `🔥 Ein warmer Funkenregen! ${n} ${n === 1 ? "Dornenranke verbrennt" : "Dornenranken verbrennen"} zu Asche.` : "🔥 Es knistert, aber hier gibt es keine Dornenranken."); }
  if (k === "beeren") { tries++; paintLives(); say("🧃 Süß und kräftig! Ein Herz leuchtet wieder."); }
  if (k === "frostat") { const n = change(["W", "U"], "B"); say(n ? `🧊 Eisiger Atem! ${n}× Wasser friert zu einem sicheren Weg.` : "🧊 Kalter Atem, aber hier gibt es kein Wasser zum Einfrieren."); }
  if (k === "sterne") { const n = change(["Q"], "."); say(n ? `💫 Sternenlicht fließt über den Boden. ${n} ${n === 1 ? "verwunschenes Feld wird" : "verwunschene Felder werden"} frei.` : "💫 Es funkelt, aber hier gibt es keine verwunschenen Felder."); }
  if (k === "regen") { tries += 2; fx.shield = (+fx.shield || 0) + 1; paintLives(); say("🌈 Ein Regenbogen umhüllt dich: zwei Extra-Herzen und Schutz vor dem nächsten Fehler."); }
  if (k === "gluck") { fx.shield = (+fx.shield || 0) + 1; say("🍵 Du trinkst den Glückstee. Der nächste falsche Begleiter kostet kein Herz."); }
  if (k === "spur") { fx.reveal = true; say("🔮 Deine Augen funkeln. Über jedem Hindernis siehst du jetzt, wer helfen kann."); }
  if (k === "herz") { tries++; paintLives(); say("💛 Ein warmes Leuchten: Du hast ein Herz mehr!"); }
  if (k === "nebel") { fx.skip = (+fx.skip || 0) + 1; say("🌫️ Du wirst ganz leicht. Das nächste Hindernis öffnet sich ohne Begleiter."); }
  if (k === "voll") { tries = Math.max(tries, MAX_TRIES); paintLives(); say("💖 Alle deine Herzen leuchten wieder."); }
  renderPotbar();
}

