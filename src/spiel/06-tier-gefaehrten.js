/* ---------- Tier-Gefährten ---------- */
const TEAM_MAX = 3;
const ABIL = {
  "Hirsch":        ["Sternenlicht", "Deine Laterne leuchtet viel weiter.", { bright: 1 }],
  "Hase":          ["Flinke Pfoten", "+10 Sekunden in Zeitdungeons.", { time: 10 }],
  "Eichhörnchen":  ["Sammelfreude", "Ein zusätzlicher Samenfund in jedem Abenteuer.", { seedSpots: 1 }],
  "Dachs":         ["Grabeprofi", "Ein zusätzlicher Samenfund in jedem Abenteuer.", { seedSpots: 1 }],
  "Schildkröte":   ["Panzer", "Der erste falsche Begleiter kostet kein Herz.", { shield: 1 }],
  "Schwan":        ["Anmut", "Ein Belohnungs-Samen mehr nach jedem Abschluss.", { loot: 1 }],
  "Frosch":        ["Teichfreund", "Im Garten erntest du ein Kraut mehr.", { garden: 1 }],
  "Waschbär":      ["Glücksfinder", "Samenfunde sind öfter selten.", { rareFind: 1 }],
  "Katze":         ["Nachtaugen", "Deine Laterne leuchtet viel weiter.", { bright: 1 }],
  "Schaf":         ["Kuschelwolle", "Ein Extra-Herz zu Beginn.", { heart: 1 }],
  "Schmetterling": ["Blütenzauber", "Beim Ernten bekommst du viel öfter einen Samen zurück (50 % statt 20 %).", { gardenSeed: 1 }],
  "Wolf":          ["Rudelspur", "Zeigt über jedem Hindernis, wer helfen kann.", { reveal: 1 }],
  "Adler":         ["Adlerflug", "+15 Sekunden in Zeitdungeons.", { time: 15 }],
  "Pfau":          ["Pracht", "Ein Belohnungs-Samen mehr nach jedem Abschluss.", { loot: 1 }],
  "Flamingo":      ["Balance", "Der erste falsche Begleiter kostet kein Herz.", { shield: 1 }],
  "Panda":         ["Gemütlichkeit", "Ein Extra-Herz zu Beginn.", { heart: 1 }],
  "Pinguin":       ["Eisrutsche", "Ein Bach oder Teich ist zu Beginn schon zugefroren.", { freeze: 1 }],
  "Einhorn":       ["Heilhorn", "Zwei Extra-Herzen zu Beginn.", { heart: 2 }],
  "Sterndrache":   ["Drachenfeuer", "Alle Dornenranken verbrennen zu Beginn.", { burn: 1 }],
  "Löwe":          ["Löwenmut", "Zwei falsche Begleiter kosten kein Herz.", { shield: 2 }],
  "Wolkenwal":     ["Wolkenmeer", "Zwei Belohnungs-Samen mehr und öfter seltene Funde.", { loot: 2, rareFind: 1 }]
};
const ALL_BEASTS = () => [...MONDTAL.map(l => [l.animal, l.animalName, false]), ...ANIMALS.map(a => [a[0], a[1], false]), ...RARE.map(a => [a[0], a[1], true])];
const emojiOf = n => (ALL_BEASTS().find(b => b[1] === n) || ["🐾"])[0];
function teamFx() {
  const known = rescuedNames(), f = { time: 0, seedSpots: 0, shield: 0, bright: 0, heart: 0, loot: 0, garden: 0, gardenSeed: 0, rareFind: 0, reveal: 0, freeze: 0, burn: 0 };
  [...known].filter(n => ABIL[n]).forEach(n => Object.entries(ABIL[n][2]).forEach(([k, v]) => { f[k] += v; }));
  return f;
}
// Tierkräfte zum Antippen, je Tier einmal pro Abenteuer
const ACT = {
  "Hirsch":        ["Sternenblick", "Zeigt über jedem Hindernis, wer helfen kann.", "reveal"],
  "Hase":          ["Sprint", "+15 Sekunden im Zeitdungeon.", "time15"],
  "Eichhörnchen":  ["Nussversteck", "Findet sofort einen Samen.", "seed"],
  "Dachs":         ["Buddeln", "Findet sofort einen Samen.", "seed"],
  "Schildkröte":   ["Panzerschild", "Schützt dich vor dem nächsten Fehler.", "shield"],
  "Schwan":        ["Federgeschenk", "Schenkt dir einen Samen, manchmal einen seltenen.", "gift"],
  "Frosch":        ["Teichkraut", "Bringt dir ein Kraut für den Alchemietisch.", "herb"],
  "Waschbär":      ["Glücksgriff", "Findet sofort einen seltenen Samen.", "rare"],
  "Katze":         ["Katzensprung", "Das nächste Hindernis öffnet sich ohne Begleiter.", "skip"],
  "Schaf":         ["Kuschelpause", "Heilt ein verlorenes Herz.", "heal"],
  "Schmetterling": ["Bestäuben", "Bringt dir ein Kraut für den Alchemietisch.", "herb"],
  "Wolf":          ["Heulen", "Das nächste Hindernis öffnet sich ohne Begleiter.", "skip"],
  "Adler":         ["Adlerauge", "+20 Sekunden im Zeitdungeon.", "time20"],
  "Pfau":          ["Rad schlagen", "Schenkt dir einen Samen, manchmal einen seltenen.", "gift"],
  "Flamingo":      ["Standfest", "Schützt dich vor dem nächsten Fehler.", "shield"],
  "Panda":         ["Bambussnack", "Heilt ein verlorenes Herz.", "heal"],
  "Pinguin":       ["Eisrutsche", "Friert alles Wasser in diesem Abenteuer ein.", "freeze"],
  "Einhorn":       ["Heilhorn", "Schenkt dir zwei Extra-Herzen.", "heart2"],
  "Sterndrache":   ["Drachenatem", "Alle verwunschenen Felder in diesem Abenteuer öffnen sich.", "runes"],
  "Löwe":          ["Brüllen", "Die nächsten zwei Hindernisse öffnen sich ohne Begleiter.", "skip2"],
  "Wolkenwal":     ["Wolkenregen", "Schenkt dir zwei Samen.", "gift2"]
};
function fxParts(F) {
  const p = [];
  if (F.heart) p.push(`❤️ +${F.heart} ${F.heart === 1 ? "Herz" : "Herzen"}`);
  if (F.shield) p.push(`🛡️ ${F.shield} Fehler frei`);
  if (F.seedSpots) p.push(`🌱 +${F.seedSpots} Samenfund${F.seedSpots === 1 ? "" : "e"}`);
  if (F.loot) p.push(`🎁 +${F.loot} Belohnung`);
  if (F.rareFind) p.push("🍀 öfter seltene Funde");
  if (F.time) p.push(`⏱️ +${F.time} s`);
  if (F.bright) p.push("🔦 weiter sehen");
  if (F.reveal) p.push("💡 Hinweise");
  if (F.garden) p.push(`🧺 +${F.garden} Ernte`);
  if (F.gardenSeed) p.push("🌸 öfter Samen zurück");
  if (F.freeze) p.push(`🧊 ${F.freeze}× Eis`);
  if (F.burn) p.push("🔥 keine Dornen");
  return p;
}
function renderActs() {
  const bar = $("actBar"); bar.innerHTML = "";
  const list = [...rescuedNames()].filter(n => ACT[n]).sort((a, b) => actUsed.has(a) - actUsed.has(b));
  const tg = $("tgActs"), open = !bar.hidden;
  tg.hidden = !list.length || !!(level && level.fair);
  if (level && level.fair) { bar.hidden = true; return; }
  tg.textContent = `🐾 Kräfte · ${list.filter(n => !actUsed.has(n)).length} frei ${open ? "▴" : "▾"}`;
  if (!list.length) { bar.hidden = true; return; }
  list.forEach(n => {
    const used = actUsed.has(n), b = btnEl(`${emojiOf(n)} ${ACT[n][0]}${used ? " ✓" : ""}`, () => doAct(n), "chip");
    b.disabled = used || done; b.title = `${n}: ${ACT[n][1]}`; b.id = "act-" + n;
    bar.appendChild(b);
  });
}
function togglePanel(btnId, panelId, render) {
  const p = $(panelId), open = p.hidden; p.hidden = !open;
  $(btnId).setAttribute("aria-expanded", String(open)); render();
}
$("tgActs").addEventListener("click", () => togglePanel("tgActs", "actBar", renderActs));
$("tgPots").addEventListener("click", () => togglePanel("tgPots", "potbar", renderPotbar));
function doAct(n) {
  if (guestMode && level && level.coop) { say("Tierkräfte nutzt im Koop der Spieler, der das Spiel erstellt hat."); return; }
  if (done || actUsed.has(n) || !ACT[n]) return;
  const [nm, desc, k] = ACT[n], e = emojiOf(n);
  const change = (from, to) => { let c = 0; for (let y = 0; y < ROWS; y++) for (let x = 0; x < COLS; x++) if (from.includes(grid[y][x])) { tileAnim(x, y, "magic", grid[y][x]); grid[y][x] = to; delete stage[x + "," + y]; sparkle(x, y); c++; } return c; };
  const nope = t => { say(`${e} ${t}`); };
  let txt = desc;
  if (k === "reveal") { if (fx.reveal) return nope("Du siehst die Helfer schon über den Hindernissen."); fx.reveal = true; }
  if (k === "time15" || k === "time20") {
    if (!level.timed) return nope(`${n}s Kraft wirkt nur in Zeitdungeons.`);
    const s = k === "time15" ? 15 : 20; stopTimer(); timeLeft += s; startTimer(); txt = `+${s} Sekunden auf der Sanduhr!`;
  }
  if (["seed", "gift", "rare", "gift2"].includes(k)) {
    const got = Array.from({ length: k === "gift2" ? 2 : 1 }, () => k === "rare" ? RARE_SEEDS[Math.floor(Math.random() * RARE_SEEDS.length)] : k === "seed" ? rollSeed() : rollDrop(0.3));
    got.forEach(s => add(H.seeds, s)); saveH();
    txt = `Du bekommst Samen: ${got.map(s => HERBS[s].ic + " " + HERBS[s].nm).join(", ")}.`;
  }
  if (k === "herb") { const hs = Object.keys(HERBS).filter(h => !HERBS[h].rare), h = hs[Math.floor(Math.random() * hs.length)]; add(H.herbs, h); saveH(); txt = `Du bekommst ${HERBS[h].ic} ${HERBS[h].nm} für den Alchemietisch.`; }
  if (k === "shield") fx.shield = (+fx.shield || 0) + 1;
  if (k === "skip") fx.skip = (+fx.skip || 0) + 1;
  if (k === "skip2") fx.skip = (+fx.skip || 0) + 2;
  if (k === "heal") { if (tries >= startTries) return nope("Deine Herzen sind noch alle da. Heb dir die Kraft für später auf."); tries++; paintLives(); }
  if (k === "heart2") { tries += 2; paintLives(); }
  if (k === "freeze") { const c = change(["W", "U"], "B"); if (!c) return nope("Hier gibt es kein Wasser zum Einfrieren."); txt = `${c}× Wasser friert zu einem sicheren Weg.`; }
  if (k === "runes") { const c = change(["Q"], "."); if (!c) return nope("Hier gibt es keine verwunschenen Felder."); txt = `${c} ${c === 1 ? "verwunschenes Feld wird" : "verwunschene Felder werden"} frei.`; }
  actUsed.add(n); sparkle(px, py);
  say(`${e} <b>${n}: ${nm}!</b> ${txt}`);
  renderActs();
}
function toggleTeam(n) {
  H.team = (H.team || []).filter(x => x !== n).length !== (H.team || []).length ? H.team.filter(x => x !== n) : [...(H.team || []), n];
  if (H.team.length > TEAM_MAX) { H.team.pop(); $("beastMsg").textContent = `Dein Team ist voll. Nimm erst ein Tier heraus (höchstens ${TEAM_MAX}).`; }
  else $("beastMsg").textContent = H.team.includes(n) ? `${emojiOf(n)} ${n} ist jetzt in deinem Team: ${ABIL[n][0]}!` : `${emojiOf(n)} ${n} ruht sich im Dorf aus.`;
  saveH(); renderBeasts(true);
}
function renderBeasts(keepMsg) {
  try { renderCostumes(); } catch (e) {}
  const homes = {};
  Object.keys(rescued).forEach(id => {
    let n = 1, l = MONDTAL.find(x => x.id === id);
    if (!l) { const [a, i] = id.split("-").map(Number); if (!a || !getSettlement(a).levels[i]) return; n = a; l = getSettlement(a).levels[i]; }
    (homes[l.animalName] = homes[l.animalName] || []).push(`${getSettlement(n).name} · ${l.spot}`);
  });
  const beasts = ALL_BEASTS();
  const found = beasts.filter(b => homes[b[1]]).length;
  $("beastSum").textContent = `${found} von ${beasts.length} Tieren entdeckt.`;
  $("beastMsg").textContent = "Jedes gerettete Tier hilft dir automatisch überall mit: in allen Abenteuern, Geheimstädten, Zeitdungeons und im Garten.";
  const F = teamFx(), parts = [];
  if (F.heart) parts.push(`❤️ +${F.heart} ${F.heart === 1 ? "Herz" : "Herzen"}`);
  if (F.shield) parts.push(`🛡️ ${F.shield} ${F.shield === 1 ? "Fehler" : "Fehler"} frei`);
  if (F.seedSpots) parts.push(`🌱 +${F.seedSpots} Samenfund${F.seedSpots === 1 ? "" : "e"}`);
  if (F.loot) parts.push(`🎁 +${F.loot} Belohnungs-Samen`);
  if (F.rareFind) parts.push("🍀 öfter seltene Funde");
  if (F.time) parts.push(`⏱️ +${F.time} s Zeit`);
  if (F.bright) parts.push("🔦 weiter sehen");
  if (F.reveal) parts.push("💡 Hinweise über Hindernissen");
  if (F.garden) parts.push(`🧺 +${F.garden} Kraut beim Ernten`);
  if (F.gardenSeed) parts.push("🌸 öfter Samen zurück");
  if (F.freeze) parts.push(`🧊 ${F.freeze}× Wasser gefroren`);
  if (F.burn) parts.push("🔥 keine Dornen");
  $("teamHead").textContent = "Alle Fähigkeiten zusammen";
  const tc = $("teamChips"); tc.innerHTML = "";
  if (!parts.length) tc.appendChild(el("span", "none", "Noch keine Tier-Fähigkeiten. Rette Tiere, dann helfen sie dir automatisch."));
  parts.forEach(t => tc.appendChild(el("span", "chip", t)));
  const kn = $("beastKnown"); kn.innerHTML = "";
  const g = $("beastGrid"); g.innerHTML = "";
  if (!found) kn.appendChild(el("p", "none", "Noch kein Tier gerettet. Los geht's im Dornenwald!"));
  beasts.forEach(([e, n, rare]) => {
    const h = homes[n];
    if (h) {
      const where = h[0] + (h.length > 1 ? ` (+${h.length - 1})` : "");
      if (n === "Fuchs" || n === "Otter") { kn.appendChild(rowEl(e, n, `${where} · hilft dir immer als ${n === "Fuchs" ? "Funke, der Schleicher 🌾" : "Ole, der Taucher 💧"}`)); return; }
      const a = ABIL[n];
      kn.appendChild(rowEl(e, `${n}${rare ? " · selten" : ""}`, `${a ? `Immer aktiv: ${a[1]} ` : ""}${ACT[n] ? `Zum Antippen (1× pro Abenteuer): ${ACT[n][0]}, ${ACT[n][1]} ` : ""}Wohnt in ${where}.`, [el("span", "st ok", "✓ aktiv")]));
    } else {
      const d = el("div", "beast unk");
      d.appendChild(el("span", "e", e)); d.appendChild(el("span", "nm2", "???"));
      if (rare) d.appendChild(el("span", "rare", "selten"));
      g.appendChild(d);
    }
  });
  if (!g.children.length) g.appendChild(el("p", "none", "Du hast alle Tiere entdeckt! 🌟"));
  saveH();
  show("beastView");
}
$("toBeasts").addEventListener("click", renderBeasts);
$("beastBack").addEventListener("click", showVillage);
function openWiki(from) {
  wikiFrom = from; renderWiki(); renderKeys();
  show("wikiView");
}
$("wikiFromVillage").addEventListener("click", () => openWiki("village"));
$("wikiFromDungeon").addEventListener("click", () => openWiki("dungeon"));
$("wikiBack2").addEventListener("click", () => $("wikiBack").click());
$("wikiTop").addEventListener("click", () => scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
$("wikiBack").addEventListener("click", () => { if (wikiFrom === "dungeon") { buildRoles(); paintRoles(); showDungeon(); } else showVillage(); });
$("wikiView").addEventListener("click", e => {
  const a = e.target.closest(".wk-nav a"); if (!a) return;
  e.preventDefault(); const t = document.querySelector(a.getAttribute("href")); if (t) t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
});
const leaveDungeon = () => { if (level && level.farm) showFarm(); else if (level && level.fest) showFest(); else if (level && level.daily) showDaily(); else if (level && level.timed && !level.coop) showTime(); else showVillage(); };
$("back").addEventListener("click", leaveDungeon);
$("home").addEventListener("click", leaveDungeon);

