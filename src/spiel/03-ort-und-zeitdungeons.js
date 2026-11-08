/* ---------- Ort ---------- */
function drawVillage(s) {
  const T = TIERS[s.tier], rng = rngFor(s.n * 31 + 5), v = $("village");
  v.style.setProperty("--sky1", ["#0d1426", "#101630", "#161437", "#1c1240", "#22104a"][s.tier]);
  v.style.setProperty("--sky2", ["#17213a", "#1b2442", "#221f4a", "#2a1d55", "#331c60"][s.tier]);
  let h = `<div class="moon"></div>`;
  for (let i = 0; i < 28; i++) h += `<i class="star" style="left:${(rng() * 96 + 2).toFixed(1)}%;top:${(rng() * 38 + 2).toFixed(1)}%"></i>`;
  if (T.glow) for (let i = 0; i < 9; i++) h += `<i class="float" style="left:${(rng() * 90 + 5).toFixed(1)}%;top:${(rng() * 30 + 18).toFixed(1)}%;animation-delay:${(rng() * 4).toFixed(1)}s"></i>`;
  h += `<div class="ground" style="left:-5%;width:45%;background:#1d3a2a"></div>
        <div class="ground" style="left:33%;width:38%;background:#1a3048;height:22%"></div>
        <div class="ground" style="left:64%;width:42%;background:#24331f"></div>`;
  const spans = T.castle ? [[2, 35], [65, 98]] : [[4, 96]];
  const per = Math.ceil(T.houses / spans.length);
  spans.forEach(([a, b]) => {
    const step = (b - a) / per;
    for (let i = 0; i < per; i++) {
      const tower = s.tier >= 1 && rng() < 0.35;
      const w = tower ? Math.min(step * .55, 6) : Math.min(step * .8, 13);
      const left = a + step * i + (step - w) / 2;
      h += `<div class="house${tower ? " tower" : ""}${T.glow && tower ? " gold" : ""}" style="left:${left.toFixed(1)}%;width:${w.toFixed(1)}%"></div>`;
    }
  });
  if (T.castle) {
    h += `<div class="house tower${T.glow ? " gold" : ""}" style="left:37%;width:6%"></div>
          <div class="keep" style="left:42%;width:16%"></div>
          <div class="house tower${T.glow ? " gold" : ""}" style="left:57%;width:6%"></div>`;
  }
  ["2%", "35%", "68%"].forEach((pos, i) => {
    const l = s.levels[i], has = rescued[l.id];
    h += `<div class="spot" style="left:${pos}"><div class="a ${has ? "" : "locked"}" aria-hidden="true">${l.animal}</div>
          <div class="l">${has ? `<b>${l.animalName}</b>` : "noch leer"}<br>${l.spot}</div></div>`;
  });
  if (H.starOrt && H.starOrt[s.n]) h += `<div class="bigstar" title="Alle Sterne geholt" aria-hidden="true">🌟</div>`;
  v.innerHTML = h;
}

function renderVillage() {
  const s = getSettlement(cur), T = TIERS[s.tier];
  $("vName").textContent = s.name;
  $("vSub").textContent = `${T.name} · Ort ${s.n}. Jedes Tier, das du rettest, findet hier ein Zuhause.`;
  { const F = festNow(); $("vSub").textContent += ` ${F.ic} Gerade ist ${F.nm}! Schau in den Reiter Fest.`; }

  const max = unlockedMax(), pl = $("places"); pl.innerHTML = "";
  for (let n = 1; n <= max; n++) {
    const p = getSettlement(n), b = document.createElement("button");
    b.type = "button"; b.className = "place"; b.id = "place-" + n;
    b.innerHTML = `${H.starOrt && H.starOrt[n] ? "🌟 " : ""}${p.name} <small>${TIERS[p.tier].name}</small>`;
    b.setAttribute("aria-current", String(n === cur));
    b.addEventListener("click", () => { cur = n; save(); renderVillage(); });
    pl.appendChild(b);
  }
  const lk = document.createElement("span"); lk.className = "place locked"; lk.textContent = "🔒 ???"; pl.appendChild(lk);
  const act = $("place-" + cur); if (act) pl.scrollLeft = act.offsetLeft - 20;

  drawVillage(s);
  $("savedHere").textContent = s.levels.filter(l => rescued[l.id]).length;
  $("savedAll").textContent = Object.keys(rescued).length;
  $("starsHere").textContent = s.levels.filter(l => H.stars && H.stars[l.id]).length + (H.starOrt && H.starOrt[s.n] ? " 🌟" : "");

  if (isDone(s)) {
    const nx = getSettlement(s.n + 1);
    $("bannerText").innerHTML = `Alle Tiere in ${s.name} sind gerettet! Ein neuer Weg ist frei: <b>${nx.name}</b> (${TIERS[nx.tier].name}).`;
    $("travel").textContent = `Weiterreisen nach ${nx.name}`;
    $("banner").hidden = false;
  } else $("banner").hidden = true;

  const tr = $("trips"); tr.innerHTML = "";
  s.levels.forEach(l => {
    const locked = isLocked(l), b = document.createElement("button");
    b.type = "button"; b.className = "trip" + (locked ? " is-locked" : ""); b.id = "trip-" + l.id;
    const st = locked ? `<span class="st">🔒</span>` : rescued[l.id] ? `<span class="st ok">${H.stars && H.stars[l.id] ? "⭐ " : ""}gerettet</span>` : `<span class="st">offen</span>`;
    b.innerHTML = `<span class="ic" aria-hidden="true">${l.ic}</span><span class="t"><strong>${l.name}</strong><span>${MODES[l.mode]} · ${locked ? l.lockedDesc : l.desc}</span></span>${st}`;
    b.addEventListener("click", () => { if (!locked) startLevel(l); });
    tr.appendChild(b);
  });

  // Superschwerer Irrgarten: öffnet sich, wenn alle drei Tiere hier gerettet sind
  const sup = getSuper(s.n), supOpen = isDone(s), sb2 = document.createElement("button");
  sb2.type = "button"; sb2.className = "trip" + (supOpen ? " secret" : " is-locked"); sb2.id = "trip-super";
  const stS = !supOpen ? `<span class="st">🔒</span>` : H.superDone && H.superDone[s.n] ? `<span class="st ok">🏆 geschafft</span>` : `<span class="st">offen</span>`;
  sb2.innerHTML = `<span class="ic" aria-hidden="true">🌀</span><span class="t"><strong>${sup.name}</strong><span>Superschwer · ${supOpen ? "ein Irrgarten mit mehreren Wegen, am Ende wartet das Kristallherz 💎" : "öffnet sich, wenn alle drei Tiere hier gerettet sind"}</span></span>${stS}`;
  sb2.addEventListener("click", () => { if (supOpen) startLevel(sup); });
  tr.appendChild(sb2);
  if (isCapital(s)) {
    const wv = getWeaver(s.n), wOpen = isDone(s), wb = document.createElement("button");
    wb.type = "button"; wb.className = "trip" + (wOpen ? " secret" : " is-locked"); wb.id = "trip-weaver";
    const stW = !wOpen ? `<span class="st">🔒</span>` : H.weaver && H.weaver[s.n] ? `<span class="st ok">🧶 getroffen</span>` : `<span class="st">offen</span>`;
    wb.innerHTML = `<span class="ic" aria-hidden="true">🕸️</span><span class="t"><strong>${wv.name}</strong><span>Großes Abschlussrätsel · ${wOpen ? "silberne Fäden überall, und am Ende wartet jemand Geheimnisvolles" : "öffnet sich, wenn alle drei Tiere hier gerettet sind"}</span></span>${stW}`;
    wb.addEventListener("click", () => { if (wOpen) startLevel(wv); });
    tr.appendChild(wb);
  }

  const tasks = tasksOf(s), open = tasks.every(t => t.done), sec = getSecret(s.n);
  $("tasks").innerHTML = tasks.map(t => `<div class="task${t.done ? " ok" : ""}"><span class="ck" aria-hidden="true">${t.done ? "✓" : ""}</span><span class="tt">${t.txt}</span><span class="pg">${t.prog}</span></div>`).join("");
  const sb = $("secretBtn");
  sb.className = "trip" + (open ? " secret" : " is-locked");
  const st2 = !open ? `<span class="st">🔒</span>` : H.secret[s.n] ? `<span class="st ok">${H.stars && H.stars[sec.id] ? "⭐ " : ""}geschafft</span>` : `<span class="st">offen</span>`;
  sb.innerHTML = `<span class="ic" aria-hidden="true">🗝️</span><span class="t"><strong>${sec.name}</strong><span>${open ? "Freiwillig und richtig schwer. Am Ende wartet ein seltenes Rezept." : "Erfülle alle drei Geheimaufgaben, um sie zu öffnen."}</span></span>${st2}`;
  sb.onclick = () => { if (open) startLevel(sec); };
}
$("travel").addEventListener("click", () => { cur = getSettlement(cur).n + 1; save(); renderVillage(); scrollTo(0, 0); });
// Zwei Warnungen, bevor wirklich alles gelöscht wird
let resetStep = 0;
function resetDialog(step) {
  resetStep = step; $("rmOk").hidden = false; $("rmOk").disabled = false; $("rmCancel").textContent = "Abbrechen";
  const m = $("resetModal");
  if (step === 1) {
    $("rmIcon").textContent = "⚠️"; $("rmTitle").textContent = "Spielstand zurücksetzen?";
    $("rmText").innerHTML = "Damit wird <b>das gesamte Spiel</b> gelöscht und du fängst ganz von vorne an. Möchtest du das wirklich?";
    $("rmOk").textContent = "Ja, weiter";
  } else {
    $("rmIcon").textContent = "🛑"; $("rmTitle").textContent = "Bist du dir ganz sicher?";
    $("rmText").innerHTML = "<b>Das kann man nicht rückgängig machen!</b><br>Alle Orte und Städte, gerettete Tiere, Sterne, Samen, Kräuter, Tränke, Rezepte, die Tierlichtung mit Ruf und Schmuck, Tagebuchseiten, Kostüme, Feste, Serien, Bestzeiten, dein Name und deine Einstellungen sind dann weg.";
    $("rmOk").textContent = "Ja, alles löschen";
  }
  m.hidden = false; $("rmCancel").focus();
}
$("resetAll").addEventListener("click", () => resetDialog(1));
try { if (sessionStorage.getItem("nebelpfad-was-reset")) { sessionStorage.removeItem("nebelpfad-was-reset"); setTimeout(() => { $("vSub").textContent = "🌱 Das gesamte Spiel wurde zurückgesetzt. Willkommen zu einem ganz neuen Abenteuer!"; }, 300); } } catch (e) {}
$("rmCancel").addEventListener("click", () => { $("resetModal").hidden = true; resetStep = 0; });
$("resetModal").addEventListener("keydown", e => { if (e.key === "Escape") { $("resetModal").hidden = true; resetStep = 0; } });
$("rmOk").addEventListener("click", () => {
  if (resetStep === "hex") { castTimeHex(); return; }
  if (resetStep === 1) { resetDialog(2); return; }
  $("resetModal").hidden = true; resetStep = 0;
  // Wirklich alles löschen, was das Spiel gespeichert hat, und neu starten
  try { Object.keys(localStorage).filter(k => k.startsWith("nebelpfad")).forEach(k => localStorage.removeItem(k)); } catch (e) {}
  rescued = {}; cur = 1; H = defaultH();
  try { sessionStorage.setItem("nebelpfad-was-reset", "1"); } catch (e) {}
  location.reload();
});

function show(id) {
  if (id !== "dungeonView") stopTimer();
  $("mainTabs").hidden = !(id === "villageView" || id === "timeView" || id === "dailyView" || id === "farmView" || id === "hexView" || id === "festView");
  $("mtab-fest").setAttribute("aria-selected", String(id === "festView"));
  $("mtab-hex").setAttribute("aria-selected", String(id === "hexView"));
  $("mtab-daily").setAttribute("aria-selected", String(id === "dailyView"));
  $("mtab-farm").setAttribute("aria-selected", String(id === "farmView"));
  $("mtab-ort").setAttribute("aria-selected", String(id === "villageView"));
  $("mtab-time").setAttribute("aria-selected", String(id === "timeView")); ["villageView", "dungeonView", "wikiView", "houseView", "socialView", "timeView", "beastView", "coopView", "gladeView", "dailyView", "diaryView", "wchatView", "farmView", "hexView", "festView", "heroView", "setView"].forEach(v => { $(v).hidden = v !== id; }); scrollTo(0, 0);
  try { SND.setMood(id === "dungeonView" ? "dungeon" : id === "houseView" ? "haus" : "dorf", level && level.theme); } catch (e) {} }
function showVillage() { renderVillage(); show("villageView"); }
function showDungeon() { show("dungeonView"); if (level && level.timed && !done && !(level.coop && guestMode)) startTimer(); }

/* ---------- Zeitdungeons ---------- */
const TIME_MODES = [
  { id: "leicht", ic: "🌱", nm: "Leicht", limit: 100, gen: { count: 7, tier: 0, maze: true } },
  { id: "mittel", ic: "🔥", nm: "Mittel", limit: 90, gen: { count: 10, tier: 1, maze: true } },
  { id: "schwer", ic: "🌙", nm: "Schwer", limit: 80, gen: { count: 13, tier: 2, maze: true } }
];
const FAIL_HEARTS = "Drei Versuche sind aufgebraucht. Ein sanfter Wind trägt dich zurück an den Anfang. Der Weg ist wieder verschlossen, aber du kennst ihn jetzt schon ein bisschen.";
let timeLeft = 0, timerId = null, timerEnd = 0;
function startTimer() {
  if (timerId) clearInterval(timerId);
  timerEnd = Date.now() + timeLeft * 1000; timerId = setInterval(tick, 100); tick();
}
function stopTimer() {
  if (!timerId) return;
  clearInterval(timerId); timerId = null; timeLeft = Math.max(0, (timerEnd - Date.now()) / 1000);
}
function tick() {
  timeLeft = Math.max(0, (timerEnd - Date.now()) / 1000);
  const s = Math.ceil(timeLeft);
  $("timer").textContent = `⏳ ${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  $("timer").classList.toggle("low", s <= 10);
  if (timeLeft <= 0 && !done) {
    stopTimer(); done = true;
    say("⏳ Die Sanduhr ist abgelaufen …");
    $("failText").textContent = "Die Sanduhr ist abgelaufen. Der Nebel trägt dich sanft zurück. Versuch es gleich noch einmal, der Weg wird neu gewürfelt.";
    setTimeout(() => { $("fail").hidden = false; }, reduce ? 0 : 400);
  }
}
function showTime() {
  const box = $("timeList"); box.innerHTML = "";
  TIME_MODES.forEach(m => {
    const best = (H.timeBest || {})[m.id], b = document.createElement("button");
    b.type = "button"; b.className = "trip"; b.id = "time-" + m.id;
    b.innerHTML = `<span class="ic" aria-hidden="true">${m.ic}</span><span class="t"><strong>${m.nm}</strong><span>${m.limit} Sekunden · ${best ? `Bestzeit ${best.t.toFixed(1).replace(".", ",")} s ${best.medal}` : "noch keine Zeit"}</span></span><span class="st">Start</span>`;
    b.addEventListener("click", () => openTime(m));
    box.appendChild(b);
  });
  show("timeView");
}
function openTime(m) {
  // Für alle Spieler gleich: Weg, Landschaft und Hindernisse hängen nur vom Tag und der Stufe ab
  const seed = (daySeed(dayKey()) + 101 * (TIME_MODES.indexOf(m) + 1)) % 2147483647, rng = rngFor(seed);
  const keys = Object.keys(THEMES), tk = keys[Math.floor(rng() * keys.length)], th = THEMES[tk];
  startLevel({
    id: "t-" + m.id, timed: true, fair: true, seed, baseOnly: true, noSeeds: true, limit: m.limit, tm: m, mode: 0, gen: m.gen,
    name: `${th.art} ${PREFIX[Math.floor(rng() * PREFIX.length)]}${th.noun}`, ic: "⏳", theme: tk, wall: th.wall,
    animal: "⏳", animalName: "Zeitsanduhr", who: "Die Zeitsanduhr", ring: "#9fd8ff",
    intro: `⏳ <b>Zeitdungeon ${m.nm}:</b> Erreiche die Zeitsanduhr in ${m.limit} Sekunden! ⚖️ Heute ist dieser Weg für alle Spieler gleich, ohne Tierfähigkeiten und Haustiere. So hat jeder dieselbe Chance. Morgen gibt es einen neuen.`,
    animalHint: "Die Zeitsanduhr, umhüllt von einem Zauber. Nur deine heilenden Hände können sie lösen."
  });
}
function timeWin() {
  stopTimer(); done = true;
  const m = level.tm, used = m.limit - timeLeft, ratio = timeLeft / m.limit;
  const medal = ratio >= 0.5 ? ["🥇", "Gold", 2] : ratio >= 0.25 ? ["🥈", "Silber", 1] : ["🥉", "Bronze", 0];
  const gift = Array.from({ length: medal[2] }, (_, i) => i === 1 ? RARE_SEEDS[Math.floor(Math.random() * RARE_SEEDS.length)] : rollDrop(0.15));
  gift.forEach(k => add(H.seeds, k));
  H.timeBest = H.timeBest || {};
  const prev = H.timeBest[m.id], rec = !prev || used < prev.t;
  if (rec) H.timeBest[m.id] = { t: used, medal: medal[0] };
  saveH();
  $("winIcon").textContent = medal[0];
  $("winTitle").textContent = `Zeitdungeon geschafft!`;
  $("winText").innerHTML = `Geschafft in <b>${used.toFixed(1).replace(".", ",")} Sekunden</b>. Medaille: ${medal[0]} ${medal[1]}.`
    + (rec ? "<br>🎉 Neue Bestzeit!" : `<br>Deine Bestzeit: ${prev.t.toFixed(1).replace(".", ",")} Sekunden`)
    + (gift.length ? `<br><br>🎁 Belohnung: ${gift.map(k => HERBS[k].ic + " " + HERBS[k].nm + (HERBS[k].rare ? " (selten!)" : "")).join(", ")} als Samen.` : "<br><br>Für Bronze gibt es keine Samen. Schaffst du Silber oder Gold?");
  $("home").textContent = "Zurück zu den Zeitdungeons";
  setTimeout(() => { $("win").hidden = false; }, reduce ? 0 : 900);
}
$("mtab-ort").addEventListener("click", showVillage);
$("mtab-time").addEventListener("click", showTime);

