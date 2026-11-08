/* ---------- Tierlichtung ---------- */
const GL_DECO = {
  blume:  { ic: "🌸", nm: "Blumen", cost: 2, cls: "sm" }, sonne: { ic: "🌻", nm: "Sonnenblume", cost: 2 }, pilz: { ic: "🍄", nm: "Pilz", cost: 2, cls: "sm" },
  stamm:  { ic: "🪵", nm: "Baumstamm", cost: 3 }, stein: { ic: "🪨", nm: "Stein", cost: 3 }, laterne: { ic: "🏮", nm: "Laterne", cost: 4 },
  busch:  { ic: "🌳", nm: "Baum", cost: 5, cls: "big" }, brunnen: { ic: "⛲", nm: "Brunnen", cost: 6, cls: "big" }, haus: { ic: "🏡", nm: "Tierhäuschen", cost: 8, cls: "big" },
  regen:  { ic: "🌈", nm: "Regenbogen", cost: 10, cls: "big" },
  statue: { ic: "🗿", nm: "Statue", cost: 6, cls: "big", lvl: 11 }, karussell: { ic: "🎠", nm: "Karussell", cost: 8, cls: "big", lvl: 17 }, schloss: { ic: "🏰", nm: "Schlösschen", cost: 12, cls: "big", lvl: 24 }
};
const GL_LINES = ["Danke, dass du mich gerettet hast!", "Hier ist es so schön ruhig.", "Spielst du ein bisschen mit mir?", "Ich hab heute schon drei Schmetterlinge gesehen!", "Erzählst du mir, was du im Nebel erlebt hast?", "Ich fühl mich hier richtig zu Hause.", "Hast du etwas Leckeres dabei?", "Die anderen Tiere sind sehr nett zu mir."];
const GL_FAV = ["mond", "tau", "stern", "pilz", "sonne", "tulpe", "kleeb"];
const FOODS = { karotte: { ic: "🥕", nm: "Karotte" }, apfel: { ic: "🍎", nm: "Apfel" }, nuss: { ic: "🌰", nm: "Nuss" }, beere: { ic: "🍓", nm: "Beeren" }, fisch: { ic: "🐟", nm: "Fisch" }, honig: { ic: "🍯", nm: "Honig" }, klee: { ic: "🍀", nm: "Klee" }, korn: { ic: "🌾", nm: "Körner" } };
const FAV_FOOD = { Hase: "karotte", Eichhörnchen: "nuss", Dachs: "beere", Schildkröte: "klee", Schwan: "korn", Frosch: "beere", Waschbär: "fisch", Katze: "fisch", Schaf: "klee", Schmetterling: "honig", Wolf: "fisch", Adler: "fisch", Fuchs: "apfel", Otter: "fisch", Hirsch: "apfel", Pfau: "korn", Igel: "apfel", Eule: "nuss", Bär: "honig", Panda: "klee", Biber: "apfel", Maus: "korn", Pferd: "karotte", Einhorn: "apfel", Sterndrache: "honig", Löwe: "fisch", Wolkenwal: "fisch" };
const foodFav = nm => FAV_FOOD[nm] || Object.keys(FOODS)[[...nm].reduce((a, c) => a + c.charCodeAt(0), 3) % Object.keys(FOODS).length];
function addFood(n) { const G = glState(); G.food = G.food || {}; const ks = Object.keys(FOODS), got = []; for (let i = 0; i < n; i++) { const k = ks[Math.floor(Math.random() * ks.length)]; G.food[k] = Math.min(20, (G.food[k] || 0) + 1); got.push(k); } return got; }
function refillBasket() {
  const G = glState(); G.food = G.food || {};
  if (G.foodDay === today()) return null;
  const first = !G.foodDay; G.foodDay = today();
  // Lieblingsfutter der Bewohner kommt bevorzugt in den Korb
  const favs = rescuedAnimals().map(a => foodFav(a.nm)); const got = [];
  for (let i = 0; i < (first ? 10 : 8) + foodBonus(heroLvl()); i++) { const k = favs.length && Math.random() < 0.6 ? favs[Math.floor(Math.random() * favs.length)] : Object.keys(FOODS)[Math.floor(Math.random() * 8)]; G.food[k] = Math.min(20, (G.food[k] || 0) + 1); got.push(k); }
  saveH(); return got;
}
let glSel = null, glTimer = null, glPos = {};
const gsay = h => { $("gMsg").innerHTML = h; };
function glState() { H.glade = H.glade || { friend: {}, deco: [], fed: {} }; return H.glade; }
function rescuedAnimals() {
  const out = [], seen = new Set();
  Object.keys(rescued).forEach(id => {
    let l = MONDTAL.find(m => m.id === id);
    if (!l) { const [n, i] = id.split("-").map(Number); l = n ? getSettlement(n).levels[i] : null; }
    if (l && l.animalName && !seen.has(l.animalName)) { seen.add(l.animalName); out.push({ ic: l.animal, nm: l.animalName }); }
  });
  (H.festAnimals || []).forEach(a => { if (!seen.has(a.nm)) { seen.add(a.nm); out.push(a); } });
  return out;
}
const rufName = f => f >= 10 ? "🌟 Beste Freunde" : f >= 6 ? "💛 Vertraut" : f >= 3 ? "😊 Freundlich" : f >= 1 ? "👀 Neugierig" : "🙈 Scheu";
const favOf = nm => GL_FAV[[...nm].reduce((a, c) => a + c.charCodeAt(0), 0) % GL_FAV.length];
const today = () => new Date().toISOString().slice(0, 10);
function payHerbs(n) {
  const total = Object.values(H.herbs).reduce((a, b) => a + b, 0); if (total < n) return false;
  for (let k = 0; k < n; k++) { const top = Object.keys(H.herbs).filter(h => H.herbs[h] > 0).sort((a, b) => H.herbs[b] - H.herbs[a])[0]; add(H.herbs, top, -1); }
  return true;
}
function openGlade() {
  const got = refillBasket();
  show("gladeView"); renderGlade(true); clInfo();
  if (got) setTimeout(() => gsay(`🧺 Der Futterkorb ist frisch gefüllt: ${got.map(k => FOODS[k].ic).join(" ")}`), 2200);
}
function renderGlade(greet) {
  const G = glState(), an = rescuedAnimals(), box = $("glItems");
  box.innerHTML = "";
  (H.festDeco || []).forEach(fk => { const F = FESTS[fk]; if (F && !GL_DECO["fest_" + fk]) GL_DECO["fest_" + fk] = { ic: F.deco[0], nm: F.deco[1], cost: 3 }; });
  (H.festDeco2 || []).forEach(fk => { const D2 = FEST_DECO2[fk]; if (D2 && !GL_DECO["fest2_" + fk]) GL_DECO["fest2_" + fk] = { ic: D2[0], nm: D2[1], cost: 2 }; });
  G.deco.forEach((d, i) => {
    const D = GL_DECO[d.k]; if (!D) return;
    const e = el("span", "gl-deco" + (D.cls ? " " + D.cls : ""), D.ic); e.style.left = d.x + "%"; e.style.top = d.y + "%"; e.style.zIndex = Math.round(d.y);
    e.addEventListener("click", ev => { if (glSel !== "sweep") return; ev.stopPropagation(); G.deco.splice(i, 1); add(H.herbs, GL_FAV[i % GL_FAV.length], D.cost); saveH(); gsay(`↩️ ${D.ic} ${D.nm} weggenommen. Du bekommst ${D.cost} Kräuter zurück.`); renderGlade(); });
    box.appendChild(e);
  });
  an.forEach((a, i) => {
    const p = glPos[a.nm] || (glPos[a.nm] = { x: 12 + Math.random() * 76, y: 45 + Math.random() * 45 });
    const b = el("button", "gl-an rest"); b.type = "button"; b.id = "gl-" + i; b.setAttribute("aria-label", a.nm);
    b.innerHTML = `<span class="bd">${a.ic}</span><span class="nm">${a.nm}</span>`;
    b.style.left = p.x + "%"; b.style.top = p.y + "%"; b.style.zIndex = Math.round(p.y) + 1;
    b.addEventListener("click", ev => { if (glSel && glSel.startsWith("d:")) return; ev.stopPropagation(); petAnimal(a, b); });
    box.appendChild(b);
  });
  $("glade").classList.toggle("sweep", glSel === "sweep");
  $("gSub").textContent = an.length ? `${an.length} ${an.length === 1 ? "Tier wohnt" : "Tiere wohnen"} hier.` : "Noch wohnt hier niemand.";
  // Futter
  const fb = $("gFood"); fb.innerHTML = "";
  const fk = Object.keys(FOODS).filter(k => (G.food || {})[k]);
  fk.forEach(k => { const c = btnEl(`${FOODS[k].ic} ${FOODS[k].nm} ×${G.food[k]}`, () => { glSel = glSel === "o:" + k ? null : "o:" + k; renderGlade(); gsay(glSel ? `${FOODS[k].ic} ${FOODS[k].nm} ausgewählt. Tippe auf ein Tier, um es zu füttern.` : "Nichts ausgewählt."); }); c.setAttribute("aria-pressed", String(glSel === "o:" + k)); fb.appendChild(c); });
  const hk = Object.keys(HERBS).filter(k => H.herbs[k]);
  if (!hk.length && !fk.length) fb.innerHTML = `<span class="none">Der Futterkorb ist leer. Morgen füllt er sich wieder, und nach jeder Rettung kommt Futter dazu.</span>`;
  hk.forEach(k => { const c = btnEl(`${HERBS[k].ic} ${HERBS[k].nm} ×${H.herbs[k]}`, () => { glSel = glSel === "f:" + k ? null : "f:" + k; renderGlade(); gsay(glSel ? `${HERBS[k].ic} ausgewählt. Tippe auf ein Tier, um es zu füttern.` : "Nichts ausgewählt."); }); c.setAttribute("aria-pressed", String(glSel === "f:" + k)); fb.appendChild(c); });
  // Schmuck
  const db = $("gDeco"); db.innerHTML = "";
  (H.festDeco || []).forEach(fk => { const F = FESTS[fk]; if (F && !GL_DECO["fest_" + fk]) GL_DECO["fest_" + fk] = { ic: F.deco[0], nm: F.deco[1], cost: 3 }; });
  (H.festDeco2 || []).forEach(fk => { const D2 = FEST_DECO2[fk]; if (D2 && !GL_DECO["fest2_" + fk]) GL_DECO["fest2_" + fk] = { ic: D2[0], nm: D2[1], cost: 2 }; });
  Object.entries(GL_DECO).filter(([k, D]) => !D.lvl || heroLvl() >= D.lvl).forEach(([k, D]) => { const c = btnEl(`${D.ic} ${D.nm} · ${D.cost} 🌿`, () => { glSel = glSel === "d:" + k ? null : "d:" + k; renderGlade(); gsay(glSel ? `${D.ic} ${D.nm} ausgewählt. Tippe auf die Wiese, wo es stehen soll.` : "Nichts ausgewählt."); }); c.setAttribute("aria-pressed", String(glSel === "d:" + k)); db.appendChild(c); });
  const sw = btnEl("↩️ Wegnehmen", () => { glSel = glSel === "sweep" ? null : "sweep"; renderGlade(); gsay(glSel ? "↩️ Tippe auf einen Schmuck, um ihn wegzunehmen." : "Nichts ausgewählt."); }); sw.setAttribute("aria-pressed", String(glSel === "sweep")); db.appendChild(sw);
  // Freundschaft
  const fl = $("gFriends");
  fl.innerHTML = an.length ? an.map(a => { const f = G.friend[a.nm] || 0, fav = HERBS[favOf(a.nm)];
    return `<div class="wk-row"><span class="ic" aria-hidden="true">${a.ic}</span><span class="t"><strong>${a.nm} · ${rufName(f)}</strong><span>Ruf: ${"❤️".repeat(Math.min(f, 10))}${"🤍".repeat(Math.max(0, 10 - f))}<br>Mag am liebsten: ${FOODS[foodFav(a.nm)].ic} ${FOODS[foodFav(a.nm)].nm} und ${fav.ic} ${fav.nm}${f >= 10 ? " · Beste Freunde 🌟" : ""}</span></span></div>`; }).join("")
    : `<span class="none">Rette Tiere in den Abenteuern, dann ziehen sie hier ein.</span>`;
  if (greet) {
    if (!an.length) gsay("🌳 Die Lichtung ist noch leer. Jedes Tier, das du rettest, zieht hier ein.");
    else { const few = an.slice(0, 3).map(a => a.ic + " " + a.nm).join(", "); gsay(`🌳 ${few}${an.length > 3 ? " und die anderen" : ""} ${an.length === 1 ? "freut sich" : "freuen sich"}, dass du vorbeikommst!`);
      setTimeout(() => document.querySelectorAll(".gl-an").forEach((b, i) => setTimeout(() => hopFx(b, "❤️"), i * 120)), 300); }
  }
  startWander();
  if (!CL) try { clInfo(); } catch (e) {}
}
function hopFx(b, ic) { b.classList.remove("hop"); void b.offsetWidth; b.classList.add("hop"); if (ic) fly(ic, rectOf(b), null, { dy: -50, ms: 900 }); }
function glBubble(b, txt) {
  const sb = el("div", "gl-say", txt); sb.style.left = b.style.left; sb.style.top = `calc(${b.style.top} - 44px)`;
  $("glItems").appendChild(sb); setTimeout(() => sb.remove(), 3300);
}
function petAnimal(a, b) {
  const G = glState();
  SND.fx.voice(a.nm);
  if (glSel && (glSel.startsWith("f:") || glSel.startsWith("o:"))) {
    const isFood = glSel.startsWith("o:"), k = glSel.slice(2), bag = isFood ? (G.food = G.food || {}) : H.herbs, DEF = isFood ? FOODS : HERBS;
    if (!bag[k]) { glSel = null; renderGlade(); return; }
    const fd = G.fed[a.nm] && G.fed[a.nm].d === today() ? G.fed[a.nm] : (G.fed[a.nm] = { d: today(), n: 0 });
    if (fd.n >= 3) { hopFx(b); glBubble(b, "Ich bin pappsatt! Morgen wieder? 😊"); gsay(`${a.ic} ${a.nm} ist für heute satt.`); return; }
    add(bag, k, -1); fd.n++;
    const fav = isFood ? foodFav(a.nm) === k : favOf(a.nm) === k, plus = fav ? 2 : 1, before = G.friend[a.nm] || 0, now = Math.min(10, before + plus); G.friend[a.nm] = now;
    fly(DEF[k].ic, rectOf(b), null, { dy: -10, ms: 600 });
    setTimeout(() => { hopFx(b, fav ? "💖" : "❤️"); if (fav) fly("❤️", rectOf(b), null, { dx: 24, dy: -40, delay: 150 }); }, 450);
    SND.fx.plop();
    let gift = "";
    if (before < 3 && now >= 3) { const g = [rollDrop(0.2)]; g.forEach(x => add(H.seeds, x)); gift = ` 🎁 Zum Dank schenkt ${a.nm} dir Samen: ${g.map(x => HERBS[x].ic + " " + HERBS[x].nm).join(", ")}.`; }
    if (before < 6 && now >= 6) { const r = RARE_SEEDS[Math.floor(Math.random() * RARE_SEEDS.length)]; add(H.seeds, r); gift += ` 🎁 ${a.nm} bringt dir einen seltenen Samen: ${HERBS[r].ic} ${HERBS[r].nm}!`; }
    if (rufName(before) !== rufName(now)) gift = ` ⭐ Dein Ruf bei ${a.nm} steigt: <b>${rufName(now)}</b>!` + gift;
    if (before < 10 && now >= 10) { add(H.potions, "herz"); gift += ` 🌟 Ihr seid jetzt beste Freunde! ${a.nm} schenkt dir einen ${POTIONS.herz.ic} ${POTIONS.herz.nm}.`; SND.fx.win(); }
    glBubble(b, fav ? "Mmh, mein Lieblingsessen! 💖" : "Lecker, danke!");
    gsay(`${a.ic} ${a.nm} futtert ${DEF[k].ic} ${DEF[k].nm}.${fav ? " Das mag es am allerliebsten, doppelter Ruf!" : " +1 Ruf."}${gift}`);
    if (!bag[k]) glSel = null; saveH(); renderGlade(); return;
  }
  hopFx(b, "❤️");
  glBubble(b, GL_LINES[Math.floor(Math.random() * GL_LINES.length)]);
}
function startWander() {
  if (glTimer) clearInterval(glTimer);
  if (reduce) return;
  glTimer = setInterval(() => {
    if ($("gladeView").hidden) { clearInterval(glTimer); glTimer = null; return; }
    document.querySelectorAll(".gl-an").forEach(b => {
      if (Math.random() < 0.45) return;
      const nm = b.getAttribute("aria-label"), p = glPos[nm]; if (!p) return;
      const nx = Math.max(6, Math.min(94, p.x + (Math.random() - 0.5) * 36)), ny = Math.max(42, Math.min(94, p.y + (Math.random() - 0.5) * 22));
      const dist = Math.hypot(nx - p.x, (ny - p.y) * 1.4), ms = Math.max(1200, dist * 140);
      b.classList.toggle("flip", nx > p.x); b.classList.remove("rest"); b.style.setProperty("--ms", ms + "ms");
      p.x = nx; p.y = ny; b.style.left = nx + "%"; b.style.top = ny + "%"; b.style.zIndex = Math.round(ny) + 1;
      setTimeout(() => b.classList.add("rest"), ms);
    });
  }, 2600);
}
$("glade").addEventListener("click", e => {
  if (CL) return;
  if (!glSel || !glSel.startsWith("d:")) { if (!glSel) gsay("Tippe auf ein Tier, um es zu streicheln, oder wähle unten Futter oder Schmuck."); return; }
  const G = glState(), k = glSel.slice(2), D = GL_DECO[k], r = $("glade").getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * 100, y = (e.clientY - r.top) / r.height * 100;
  if (y < 30) { gsay("Da oben stehen die großen Bäume. Stell es lieber auf die Wiese."); return; }
  if (G.deco.length >= 24) { gsay("Die Lichtung ist schon ganz voll. Nimm mit ↩️ etwas weg."); return; }
  if (!payHerbs(D.cost)) { gsay(`Dafür brauchst du ${D.cost} Kräuter. Ernte welche im Garten.`); return; }
  G.deco.push({ k, x: Math.round(x * 10) / 10, y: Math.round(y * 10) / 10 }); saveH();
  SND.fx.plant(); gsay(`${D.ic} ${D.nm} steht jetzt auf der Lichtung!`);
  renderGlade(); fly("✨", { left: e.clientX - 5, top: e.clientY - 20, width: 10, height: 10 }, null, { dy: -40 });
});
$("toGlade").addEventListener("click", openGlade);
$("gladeBack").addEventListener("click", () => { glSel = null; showVillage(); });
/* ---------- Tastatur ---------- */
const KEY_ACTIONS = [
  ["up", "Nach oben laufen"], ["down", "Nach unten laufen"], ["left", "Nach links laufen"], ["right", "Nach rechts laufen"],
  ["r1", "Begleiter 1 (Bruno)"], ["r2", "Begleiter 2 (Pip)"], ["r3", "Begleiter 3 (Holm)"], ["r4", "Begleiter 4 (Luna)"],
  ["r5", "Begleiter 5 (Du)"], ["r6", "Begleiter 6 (Funke)"], ["r7", "Begleiter 7 (Ole)"],
  ["acts", "Tierkräfte auf- und zuklappen"], ["pots", "Tränke auf- und zuklappen"]
];
const KEY_DEFAULT = { up: "w", down: "s", left: "a", right: "d", r1: "1", r2: "2", r3: "3", r4: "4", r5: "5", r6: "6", r7: "7", acts: "k", pots: "t" };
const HOVER = matchMedia("(hover: hover)").matches;
let KEYS = { ...KEY_DEFAULT }, waitKey = null;
try { Object.assign(KEYS, JSON.parse(localStorage.getItem("nebelpfad-keys") || "{}")); } catch (e) {}
const saveKeys = () => { try { localStorage.setItem("nebelpfad-keys", JSON.stringify(KEYS)); } catch (e) {} };
const keyLabel = a => { const k = KEYS[a] || ""; return k === " " ? "Leer" : k.length === 1 ? k.toUpperCase() : k; };
function renderKeys() {
  const box = $("keyList"); if (!box) return; box.innerHTML = "";
  KEY_ACTIONS.forEach(([a, label]) => {
    const b = btnEl(waitKey === a ? "Taste drücken …" : keyLabel(a), () => { waitKey = a; renderKeys(); }, waitKey === a ? "btn sm" : "chip");
    b.id = "key-" + a;
    box.appendChild(rowEl("⌨️", label, a === "up" || a === "down" || a === "left" || a === "right" ? "Die Pfeiltasten gehen immer zusätzlich." : "", [b]));
  });
  box.appendChild(btnEl("Auf Standard zurücksetzen", () => { KEYS = { ...KEY_DEFAULT }; waitKey = null; saveKeys(); renderKeys(); }, "chip"));
}
addEventListener("keydown", e => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (waitKey) {
    e.preventDefault();
    if (e.key !== "Escape") {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
      Object.keys(KEYS).forEach(a => { if (KEYS[a] === k) KEYS[a] = ""; });
      KEYS[waitKey] = k; saveKeys();
    }
    waitKey = null; renderKeys(); return;
  }
  if ($("dungeonView").hidden) return;
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement && document.activeElement.tagName)) return;
  const k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
  const arrows = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] };
  const act = Object.keys(KEYS).find(a => KEYS[a] && KEYS[a] === k);
  const mv = arrows[e.key] || { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[act];
  if (mv) { e.preventDefault(); if (e.repeat && walkTimer) return; go(px + mv[0], py + mv[1]); return; }
  if (!act) return;
  if (act[0] === "r" && /^r\d$/.test(act)) {
    const r = ROLES[+act.slice(1) - 1]; if (!r) return;
    if (level && level.coop && !myRoles().includes(r.id)) { e.preventDefault(); say(`<b>${r.nm}</b> steuert im Koop der andere Spieler.`); return; }
    e.preventDefault(); role = r.id; paintRoles(); say(`<b>${r.nm}</b> ist bereit (${r.rl}).`); return;
  }
  if (act === "acts" && !$("tgActs").hidden) { e.preventDefault(); togglePanel("tgActs", "actBar", renderActs); }
  if (act === "pots") { e.preventDefault(); togglePanel("tgPots", "potbar", renderPotbar); }
});

