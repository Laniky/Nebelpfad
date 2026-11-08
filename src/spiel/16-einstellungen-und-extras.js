/* ==========================================================
   Verbesserungen: Einstellungen, Cloud-Spielstand, App, Einführung,
   Freischalten, Erinnerungen, Erfolge, Teilen, Bestenliste, Koop
   ========================================================== */
const escH = t => String(t == null ? "" : t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
function showToast(h, big, ms = 4200, tries = 0) {
  const t = $("toast");
  if (!t.hidden && tries < 6) { setTimeout(() => showToast(h, big, ms, tries + 1), 1500); return; }
  t.className = "toast" + (big ? " big" : ""); t.innerHTML = h; t.hidden = false;
  clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, ms);
}
const agoTxt = t => { const m = Math.round((Date.now() - t) / 60000); if (m < 1) return "gerade eben"; if (m < 60) return `vor ${m} Min.`; const h = Math.round(m / 60); if (h < 24) return `vor ${h} Std.`; const d = new Date(t); return `am ${d.getDate()}.${d.getMonth() + 1}.${d.getFullYear()}`; };
const inClaude = () => !!(window.claude && typeof window.claude.use === "function");

/* ---------- Einstellungen ---------- */
const saveOpt = () => { try { localStorage.setItem("nebelpfad-opt", JSON.stringify(OPT)); } catch (e) {} };
function applyOpt() {
  document.documentElement.style.fontSize = ["", "112%", "125%"][OPT.font || 0] || "";
  document.documentElement.classList.toggle("calm", !!reduce);
}
applyOpt();
function renderSettings() {
  const v = SND.vol; $("volM").value = v.m; $("volF").value = v.f; $("volMv").textContent = v.m + " %"; $("volFv").textContent = v.f + " %";
  [...$("optFont").children].forEach(b => b.setAttribute("aria-pressed", String(+b.dataset.v === (OPT.font || 0))));
  $("optClear").checked = !!OPT.clear; $("optCalm").checked = !!reduce; $("optRemind").checked = OPT.remind !== false;
  renderCloud(); renderApp();
}
function openSettings() { renderSettings(); show("setView"); }
$("toSet").addEventListener("click", openSettings);
$("setBack").addEventListener("click", showVillage);
$("volM").addEventListener("input", e => { SND.setVol(+e.target.value, null); $("volMv").textContent = e.target.value + " %"; });
$("volF").addEventListener("input", e => { SND.setVol(null, +e.target.value); $("volFv").textContent = e.target.value + " %"; });
$("volF").addEventListener("change", () => { try { SND.fx.seed(); } catch (e) {} });
$("optFont").addEventListener("click", e => { const b = e.target.closest("button"); if (!b) return; OPT.font = +b.dataset.v; saveOpt(); applyOpt(); renderSettings(); });
$("optClear").addEventListener("change", e => { OPT.clear = e.target.checked; saveOpt(); });
$("optCalm").addEventListener("change", e => { OPT.calm = e.target.checked; reduce = OPT.calm; saveOpt(); applyOpt(); });
$("optRemind").addEventListener("change", e => { OPT.remind = e.target.checked; saveOpt(); });

/* ---------- Cloud-Spielstand: mit einem Code auf jedem Gerät ---------- */
const CLOUD_KEY = "nebelpfad-cloud";
const NOSYNC = ["nebelpfad-cloud", "nebelpfad-cooplive", "nebelpfad-opt", "nebelpfad-vol", "nebelpfad-sound"];
let cloud = null; try { cloud = JSON.parse(localStorage.getItem(CLOUD_KEY) || "null"); } catch (e) {}
const cloudOk = () => !!(DB || FB);
const fmtCode = c => c.slice(0, 4) + "-" + c.slice(4);
function packSave() {
  const o = {};
  try { Object.keys(localStorage).filter(k => k.startsWith("nebelpfad") && !NOSYNC.includes(k)).sort().forEach(k => { o[k] = localStorage.getItem(k); }); } catch (e) {}
  return o;
}
async function cloudPut(code, data) {
  const v = { t: Date.now(), d: JSON.stringify(data), v: 1 };
  if (DB) await DB.doc("coop/save-" + code).set(v); else if (FB) await FB.ref("coop/SAVE-" + code).set(v); else throw new Error("offline");
  return v.t;
}
async function cloudFetch(code) {
  if (DB) { const d = await DB.doc("coop/save-" + code).get(); return d.exists ? d.data() : null; }
  if (FB) return (await FB.ref("coop/SAVE-" + code).get()).val();
  throw new Error("offline");
}
let cloudSig = "", cloudBusy = false, loadArm = null;
async function cloudSync(force) {
  if (!cloud || !cloudOk() || cloudBusy) return false;
  const data = packSave(), sig = JSON.stringify(data);
  if (!force && sig === cloudSig) return true;
  cloudBusy = true;
  try { cloud.t = await cloudPut(cloud.code, data); cloudSig = sig; cloud.err = false; localStorage.setItem(CLOUD_KEY, JSON.stringify({ code: cloud.code, t: cloud.t })); }
  catch (e) { cloud.err = true; }
  cloudBusy = false;
  if (!$("setView").hidden) renderCloud();
  return !cloud.err;
}
setInterval(() => cloudSync(false), 60000);
document.addEventListener("visibilitychange", () => { if (document.hidden) cloudSync(false); });
function renderCloud() {
  const box = $("cloudBox");
  if (!cloudOk()) { box.innerHTML = `<p class="sub" style="margin:0">Die Verbindung zum Online-Dienst wird gerade aufgebaut … Schau gleich noch einmal hier vorbei.</p>`; setTimeout(() => { if (!$("setView").hidden && cloudOk()) renderCloud(); }, 1500); return; }
  const keepIn = $("cloudIn") ? $("cloudIn").value : "";
  box.innerHTML = (cloud
      ? `<p style="margin:0">Dein Speicher-Code:</p><div class="savecode">${fmtCode(cloud.code)}</div>
         <p class="sub" style="margin:0">${cloud.err ? "⚠️ Das letzte Sichern hat nicht geklappt. Ich versuche es gleich noch einmal." : cloud.t ? `✅ Zuletzt gesichert ${agoTxt(cloud.t)}.` : "Wird gesichert …"} Dein Spiel sichert sich ab jetzt jede Minute von selbst. Schreib dir den Code gut auf: Damit holst du dein Spiel auf ein anderes Handy. Spiel am besten immer nur auf einem Gerät gleichzeitig.</p>`
      : `<p class="sub" style="margin:0">Im Moment liegt dein Spielstand nur in diesem Browser. Löschst du den Verlauf oder wechselst das Handy, wäre er weg. Sichere ihn in der Cloud: Du bekommst einen Code, mit dem du dein Spiel überall wieder laden kannst.</p>`)
    + `<div class="row-btns" id="cloudBtns"></div>
    <details class="cloud-load"${loadArm || keepIn ? " open" : ""}><summary>Spielstand von einem anderen Gerät laden</summary>
      <div class="row-btns"><input class="tin" id="cloudIn" maxlength="9" autocomplete="off" placeholder="z. B. K7QM-X2PA" aria-label="Speicher-Code"><button class="btn sm" id="cloudLoad" type="button">${loadArm ? "Ja, wirklich laden" : "Laden"}</button></div>
      <p class="note" id="cloudNote"${loadArm ? "" : " hidden"}>${loadArm ? `⚠️ Gefunden! Dieser Spielstand wurde ${agoTxt(loadArm.t)} gesichert. Dein jetziger Spielstand auf diesem Gerät wird dabei ersetzt. Tippe zum Bestätigen noch einmal.` : ""}</p>
    </details>`;
  $("cloudIn").value = loadArm ? fmtCode(loadArm.code) : keepIn;
  const bx = $("cloudBtns");
  if (!cloud) bx.appendChild(btnEl("☁️ In der Cloud sichern", async () => {
    cloud = { code: Array.from({ length: 8 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("") };
    renderCloud(); const ok = await cloudSync(true);
    if (ok) showToast("☁️ Gesichert! Schreib dir deinen Code gut auf.", true); else { cloud = null; renderCloud(); showToast("Das Sichern hat gerade nicht geklappt. Versuch es gleich noch einmal."); }
  }, "btn sm"));
  else {
    bx.appendChild(btnEl("Jetzt sichern", async () => { const ok = await cloudSync(true); showToast(ok ? "☁️ Gesichert!" : "Das Sichern hat gerade nicht geklappt."); }, "btn sm"));
    bx.appendChild(btnEl("📋 Code kopieren", () => copyTxt(fmtCode(cloud.code), "📋 Code kopiert!")));
  }
  $("cloudIn").addEventListener("input", () => { if (loadArm) { loadArm = null; $("cloudLoad").textContent = "Laden"; $("cloudNote").hidden = true; } });
  $("cloudLoad").addEventListener("click", cloudLoadClick);
}
async function cloudLoadClick() {
  const c = $("cloudIn").value.toUpperCase().replace(/[^A-Z0-9]/g, ""), note = $("cloudNote");
  if (c.length !== 8) { note.hidden = false; note.textContent = "Der Code hat 8 Zeichen, zum Beispiel K7QM-X2PA."; return; }
  if (loadArm && loadArm.code === c) { applyLoad(loadArm); return; }
  note.hidden = false; note.textContent = "Ich suche den Spielstand …";
  let d = null; try { d = await cloudFetch(c); } catch (e) {}
  if (!d || !d.d) { loadArm = null; note.textContent = "Zu diesem Code gibt es keinen Spielstand. Prüf den Code noch einmal."; return; }
  loadArm = { code: c, t: d.t, d: d.d }; renderCloud();
}
function applyLoad(L) {
  let data; try { data = JSON.parse(L.d); } catch (e) { return; }
  window.__npLoading = true;
  try {
    Object.keys(localStorage).filter(k => k.startsWith("nebelpfad") && !NOSYNC.includes(k)).forEach(k => localStorage.removeItem(k));
    Object.entries(data).forEach(([k, v]) => { if (k.startsWith("nebelpfad") && !NOSYNC.includes(k)) localStorage.setItem(k, v); });
    localStorage.setItem(CLOUD_KEY, JSON.stringify({ code: L.code, t: L.t }));
  } catch (e) {}
  location.reload();
}
async function copyTxt(t, okMsg) {
  try { await navigator.clipboard.writeText(t); showToast(okMsg); return true; } catch (e) {}
  try { const a = document.createElement("textarea"); a.value = t; a.style.position = "fixed"; a.style.opacity = "0"; document.body.appendChild(a); a.select(); const ok = document.execCommand("copy"); a.remove(); if (ok) { showToast(okMsg); return true; } } catch (e) {}
  showToast("Kopieren ging nicht. Hier zum Abschreiben:<br>" + escH(t).replace(/\n/g, "<br>"), false, 9000); return false;
}

/* ---------- Als App installieren ---------- */
let bip = null;
addEventListener("beforeinstallprompt", e => { e.preventDefault(); bip = e; if (!$("setView").hidden) renderApp(); });
function renderApp() {
  const box = $("appBox"), standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  $("appCard").hidden = inClaude();
  if (standalone) { box.innerHTML = `<p class="sub" style="margin:0">✅ Nebelpfad läuft schon als App. Das Spiel geht auch ohne Internet, nur Koop, Chat, Cloud und Bestenlisten brauchen eine Verbindung.</p>`; return; }
  box.innerHTML = `<p class="sub" style="margin:0">Leg Nebelpfad als Symbol auf deinen Startbildschirm. Dann startet es im Vollbild ohne Browserleiste und geht auch ohne Internet.</p>`
    + (bip ? `<div class="row-btns"><button class="btn sm" id="appInstall" type="button">📲 Jetzt installieren</button></div>`
      : `<ul class="wk-tip"><li><b>Chrome:</b> Menü ⋮ oben rechts → „App installieren“ oder „Zum Startbildschirm hinzufügen“</li><li><b>Samsung Internet:</b> Menü ☰ unten → „Seite hinzufügen zu“ → „Startbildschirm“</li><li><b>iPhone (Safari):</b> Teilen-Knopf → „Zum Home-Bildschirm“</li></ul>`);
  if (bip) $("appInstall").onclick = async () => { bip.prompt(); try { await bip.userChoice; } catch (e) {} bip = null; renderApp(); };
}

/* ---------- Einführung für neue Spieler ---------- */
const TUT = [
  ["🏮", "Willkommen im Nebelpfad!", "Du bist die Heilerin mit der Laterne. Im Nebel wurden Tiere verzaubert, und nur du kannst sie befreien. Deine Begleiter helfen dir dabei."],
  ["👆", "Laufen", "Tippe im Dungeon auf ein Feld, dann läufst du direkt dorthin. Den Weg zwischen den Hindernissen findest du von selbst."],
  ["🐻🦔🦫🦉", "Deine Begleiter", "Jedes Hindernis braucht den richtigen Helfer: <b>Bruno</b> 🐻 räumt Dornen und Felsen weg, <b>Pip</b> 🦔 liest Spuren im Nebel, <b>Holm</b> 🦫 baut Stege über Wasser, und <b>Luna</b> 🦉 vertreibt Schatten. Wähle unten einen Begleiter und tippe auf das Hindernis neben dir."],
  ["💛", "Herzen", "Wählst du den falschen Begleiter, kostet das ein Herz. Lies die Hinweise im Textfeld, sie verraten dir, wer helfen kann. Schaffst du ein Abenteuer ohne verlorenes Herz, bekommst du einen ⭐."],
  ["✨", "Tiere befreien", "Am Ende des Weges wartet das verzauberte Tier. Lege als Heilerin die Hände auf den Zauber. Manchmal ist er hartnäckig und das Tier huscht davon. Dann versuch es einfach noch einmal."],
  ["🏡", "Dein Dorf wächst", "Gerettete Tiere ziehen bei dir ein. Nach und nach öffnen sich Hexenhaus, Kräutergarten, Tierlichtung, Tagesrätsel, Feste und mehr. Neues erkennst du am roten Punkt. Viel Spaß! 💜"]
];
let tutI = 0;
function tutShow() {
  const [ic, ti, tx] = TUT[tutI];
  $("tutIc").textContent = ic; $("tutTitle").textContent = ti; $("tutText").innerHTML = tx;
  $("tutDots").innerHTML = TUT.map((_, i) => `<i class="${i === tutI ? "on" : ""}"></i>`).join("");
  $("tutNext").textContent = tutI === TUT.length - 1 ? "Los geht's!" : "Weiter";
  $("tutSkip").hidden = tutI === TUT.length - 1;
}
function openTut() { tutI = 0; tutShow(); $("tutModal").hidden = false; $("tutNext").focus(); }
function closeTut() { $("tutModal").hidden = true; if (!H.tut) { H.tut = true; saveH(); } }
$("tutNext").addEventListener("click", () => { if (tutI < TUT.length - 1) { tutI++; tutShow(); try { SND.fx.step(); } catch (e) {} } else closeTut(); });
$("tutSkip").addEventListener("click", closeTut);
$("tutModal").addEventListener("keydown", e => { if (e.key === "Escape") closeTut(); });
$("tutAgain").addEventListener("click", openTut);

/* ---------- Schritt für Schritt freischalten ---------- */
const rescuedN = () => Object.keys(rescued).filter(k => rescued[k]).length;
const FEATS = [
  { id: "hex", ic: "🍭", nm: "Hexenhaus mit Kräutergarten und Kessel", need: 1, els: ["mtab-hex", "toHex", "hexH2", "toHexCard"], dot: ["mtab-hex", "toHex"] },
  { id: "farm", ic: "🌿", nm: "Kräuterpfad", need: 1, els: ["mtab-farm"] },
  { id: "glade", ic: "🌳", nm: "Tierlichtung", need: 1, els: ["toGlade"] },
  { id: "daily", ic: "🗓️", nm: "Tagesrätsel", need: 2, els: ["mtab-daily"] },
  { id: "diary", ic: "📜", nm: "Tagebuch", need: 2, els: ["toDiary"], or: () => (H.diary || []).length > 0 },
  { id: "time", ic: "⏳", nm: "Zeitdungeons", need: 3, els: ["mtab-time"] },
  { id: "fest", ic: "🎉", nm: "Feste", need: 3, els: ["mtab-fest"] }
];
const FEAT = Object.fromEntries(FEATS.map(f => [f.id, f]));
const featOpen = f => rescuedN() >= f.need || !!(f.or && f.or());
if (!H.feat) {
  // Wer schon spielt, bekommt alles Freigeschaltete ohne roten Punkt
  H.feat = {}; const old = rescuedN() > 0 || (H.xp || 0) > 0;
  FEATS.forEach(f => { if (featOpen(f)) H.feat[f.id] = old ? "seen" : "new"; });
  if (old) H.tut = true;
  saveH();
}
function refreshFeats(announce) {
  const fresh = [];
  FEATS.forEach(f => {
    const open = featOpen(f);
    if (open && !H.feat[f.id]) { H.feat[f.id] = "new"; fresh.push(f); }
    f.els.forEach(id => { const e = $(id); if (e) e.hidden = !open; });
    (f.dot || f.els).forEach(id => { const e = $(id); if (e) e.classList.toggle("newdot", open && H.feat[f.id] === "new"); });
  });
  if (fresh.length) { saveH(); if (announce !== false) showToast(`🔓 <b>Neu freigeschaltet:</b><br>${fresh.map(f => f.ic + " " + f.nm).join("<br>")}`, true, 5200); }
}
FEATS.forEach(f => f.els.forEach(id => { const e = $(id); if (e) e.addEventListener("click", () => { if (H.feat[f.id] === "new") { H.feat[f.id] = "seen"; saveH(); refreshFeats(false); } }); }));

/* ---------- Kleine Erinnerungen im Dorf ---------- */
function festDaysLeft() { const n = new Date(), end = new Date(n.getFullYear(), n.getMonth() + 1, 0); return end.getDate() - n.getDate(); }
function reminders() {
  const out = [];
  if (OPT.remind === false) return out;
  if (featOpen(FEAT.hex)) {
    const P = H.plots.filter(p => p && p.h);
    const ripe = P.filter(p => p.w >= 3).length, pest = P.filter(p => p.w < 3 && p.pest).length, thirsty = P.filter(p => p.w < 3 && !p.pest && timeOk(p.h)).length;
    if (ripe) out.push(["✨", `${ripe} ${ripe === 1 ? "Beet ist" : "Beete sind"} reif zum Ernten`, openHex]);
    if (pest) out.push(["🐌", `${pest} ${pest === 1 ? "Beet braucht" : "Beete brauchen"} deine Hilfe`, openHex]);
    else if (thirsty) out.push(["💧", `${thirsty} ${thirsty === 1 ? "Kraut kann" : "Kräuter können"} jetzt gegossen werden`, openHex]);
  }
  const ha = hexActive();
  if (ha) { const m = Math.ceil((ha.until - Date.now()) / 60000); if (m <= 10) out.push(["🔮", `Die verhexte Zeit endet in ${m} Min.`, openHex]); }
  if (featOpen(FEAT.daily)) {
    const D = (H.daily || {})[dayKey()], st = dailyStreak();
    if (!D || !D.won) out.push(["🧩", st ? `Das Tagesrätsel wartet. Halte deine Serie von ${st} ${st === 1 ? "Tag" : "Tagen"} 🔥` : "Das Tagesrätsel von heute wartet", showDaily]);
  }
  if (featOpen(FEAT.fest)) {
    const { F, st } = festState(), left = festDaysLeft();
    if ((st.done || []).length < 3 && left <= 5) out.push([F.ic, `${F.nm} endet ${left ? `in ${left} ${left === 1 ? "Tag" : "Tagen"}` : "heute"}! Noch ${3 - (st.done || []).length} Festtier${3 - (st.done || []).length === 1 ? "" : "e"} warten.`, showFest]);
  }
  return out;
}
function renderRemind() {
  const box = $("remind"), list = reminders();
  box.innerHTML = ""; box.hidden = !list.length;
  list.forEach(([ic, txt, fn]) => {
    const b = document.createElement("button"); b.type = "button";
    b.innerHTML = `<span class="ic" aria-hidden="true">${ic}</span><span>${txt}</span><span class="go">ansehen ›</span>`;
    b.addEventListener("click", fn); box.appendChild(b);
  });
}
let lastNightState = null, hexWarned = 0;
setInterval(() => {
  try {
    if (!$("villageView").hidden) renderRemind();
    if (OPT.remind === false) return;
    const ha = hexActive();
    if (ha && ha.until !== hexWarned && ha.until - Date.now() < 5 * 60000) { hexWarned = ha.until; showToast(`🔮 Die verhexte Zeit endet in ${Math.ceil((ha.until - Date.now()) / 60000)} Minuten.`); }
    const n = isNight();
    if (lastNightState !== null && n !== lastNightState && featOpen(FEAT.hex)) {
      const w = H.plots.filter(p => p && p.h && p.w < 3 && HERBS[p.h].time === (n ? "nacht" : "tag")).length;
      showToast(n ? `🌙 Es ist Nacht geworden.${w ? ` ${w} Nachtkr${w === 1 ? "aut kann" : "äuter können"} jetzt wachsen!` : ""}` : `☀️ Es ist Tag geworden.${w ? ` ${w} Tagkr${w === 1 ? "aut kann" : "äuter können"} jetzt wachsen!` : ""}`);
    }
    lastNightState = n;
  } catch (e) {}
}, 30000);

/* ---------- Erfolge ---------- */
const sumStats = k => Object.values(H.stats || {}).reduce((a, s) => a + ((s && s[k]) || 0), 0);
const cnt = k => (H.cnt || {})[k] || 0;
const bump = (k, n = 1) => { H.cnt = H.cnt || {}; H.cnt[k] = (H.cnt[k] || 0) + n; saveH(); };
const festDoneTotal = () => Object.values(H.fest || {}).reduce((a, f) => a + ((f && f.done) || []).length, 0);
const ACH = [
  { id: "r1", ic: "🐾", nm: "Erste Rettung", txt: "Befreie dein erstes Tier", ok: () => rescuedN() >= 1, gem: 1 },
  { id: "r10", ic: "🦊", nm: "Tierfreundin", txt: "Befreie 10 Tiere", ok: () => rescuedN() >= 10, gem: 3 },
  { id: "r25", ic: "🦁", nm: "Retterin des Nebels", txt: "Befreie 25 Tiere", ok: () => rescuedN() >= 25, gem: 5 },
  { id: "s5", ic: "⭐", nm: "Sternensammlerin", txt: "Sammle 5 Sterne", ok: () => Object.keys(H.stars || {}).length >= 5, gem: 2 },
  { id: "chest", ic: "🌟", nm: "Sternentruhe", txt: "Öffne eine Sternentruhe", ok: () => Object.keys(H.starOrt || {}).length >= 1, gem: 2 },
  { id: "flaw", ic: "💛", nm: "Ohne Kratzer", txt: "Schaffe den Irrgarten oder das Abschlussrätsel ohne verlorenes Herz", ok: () => cnt("flawSuper") > 0, gem: 4 },
  { id: "d1", ic: "🧩", nm: "Rätselfreundin", txt: "Löse ein Tagesrätsel", ok: () => Object.values(H.daily || {}).some(d => d && d.won), gem: 1 },
  { id: "d7", ic: "🔥", nm: "Eine Woche dabei", txt: "Löse 7 Tagesrätsel in Folge", ok: () => dailyStreak() >= 7, gem: 4 },
  { id: "gold", ic: "🥇", nm: "Blitzschnell", txt: "Hol Gold in einem Zeitdungeon", ok: () => Object.values(H.timeBest || {}).some(b => b && b.medal === "🥇"), gem: 2 },
  { id: "coop", ic: "🤝", nm: "Zusammen stark", txt: "Gewinne ein Koop-Spiel", ok: () => cnt("coop") > 0, gem: 2 },
  { id: "fest1", ic: "🎉", nm: "Festgast", txt: "Rette ein Festtier", ok: () => festDoneTotal() >= 1, gem: 1 },
  { id: "fest3", ic: "🎊", nm: "Festkönigin", txt: "Rette alle drei Tiere eines Festes", ok: () => Object.values(H.fest || {}).some(f => f && (f.done || []).length >= 3), gem: 3 },
  { id: "harv", ic: "🌿", nm: "Kräuterhexe", txt: "Ernte 20 Kräuter", ok: () => sumStats("harvest") >= 20, gem: 2 },
  { id: "brew", ic: "⚗️", nm: "Trankmeisterin", txt: "Braue 15 Tränke", ok: () => sumStats("brew") >= 15, gem: 2 },
  { id: "friend", ic: "💞", nm: "Beste Freunde", txt: "Erreiche den vollen Ruf (10 ❤️) bei einem Tier", ok: () => Object.values((H.glade || {}).friend || {}).some(v => v >= 10), gem: 3 },
  { id: "diary", ic: "📜", nm: "Das ganze Tagebuch", txt: "Finde alle Seiten des Tagebuchs", ok: () => (H.diary || []).length >= DIARY.length, gem: 4 },
  { id: "lvl10", ic: "🏮", nm: "Erfahrene Heilerin", txt: "Erreiche Level 10", ok: () => heroLvl() >= 10, gem: 3 },
  { id: "gems", ic: "💎", nm: "Funkelfund", txt: "Finde insgesamt 15 Diamanten", ok: () => cnt("gemFound") >= 15, gem: 2 }
];
function checkAch() {
  if (!H) return;
  H.ach = H.ach || {}; const got = [];
  ACH.forEach(a => { if (H.ach[a.id]) return; let ok = false; try { ok = a.ok(); } catch (e) {} if (ok) { H.ach[a.id] = Date.now(); H.gems = (H.gems || 0) + a.gem; got.push(a); } });
  if (!got.length) return;
  saveH(); try { renderLvlBar(); } catch (e) {}
  const sum = got.reduce((a, x) => a + x.gem, 0);
  showToast(got.length > 2 ? `🏅 <b>${got.length} Erfolge geschafft!</b> +${sum} 💎<br><small>Alle Erfolge siehst du auf der Seite deiner Heilerin.</small>` : got.map(a => `🏅 <b>Erfolg: ${a.ic} ${a.nm}</b> +${a.gem} 💎`).join("<br>"), true, 5200);
  if (!$("heroView").hidden) renderAch();
}
setInterval(checkAch, 5000);
function renderAch() {
  H.ach = H.ach || {}; const n = ACH.filter(a => H.ach[a.id]).length;
  $("achSum").textContent = `${n} von ${ACH.length}`;
  $("heroAch").innerHTML = ACH.map(a => { const g = !!H.ach[a.id]; return `<div class="ach${g ? " got" : ""}"><span class="ic" aria-hidden="true">${g ? a.ic : "🔒"}</span><b>${a.nm}</b><small>${a.txt}</small><small class="gm">${g ? "✓ geschafft" : "+" + a.gem + " 💎"}</small></div>`; }).join("");
}
new MutationObserver(() => { if (!$("heroView").hidden) try { checkAch(); renderAch(); } catch (e) {} }).observe($("heroView"), { attributes: true, attributeFilter: ["hidden"] });
{ const _ga = gemAdd; gemAdd = function (n) { const r = _ga.apply(this, arguments); if (n > 0) bump("gemFound", n); return r; }; }
{ const _sw = superWin; superWin = function () { const lh = lostHeart; const r = _sw.apply(this, arguments); if (!lh) bump("flawSuper"); return r; }; }
{ const _ww = weaverWin; weaverWin = function () { const lh = lostHeart; const r = _ww.apply(this, arguments); if (!lh) bump("flawSuper"); return r; }; }
{ const _cw = coopWin; coopWin = function () { const r = _cw.apply(this, arguments); bump("coop"); return r; }; }

/* ---------- Ergebnis teilen ---------- */
const SITE_URL = "https://laniky.github.io/Nebelpfad/";
const heartsTxt = (n, max) => "💛".repeat(Math.max(0, n)) + "🖤".repeat(Math.max(0, max - n));
const dateTxt = (d = new Date()) => `${d.getDate()}.${d.getMonth() + 1}.`;
let shareCache = null;
function buildShare() {
  if (!level || $("winIcon").textContent === "🌫️") return null;
  if (level.daily) {
    const D = (H.daily || {})[level.daily]; if (!D || !D.won) return null;
    return `🧩 Nebelpfad · Tagesrätsel ${dateTxt()}\n${heartsTxt(D.hearts, 3)} in ${D.t.toFixed(1).replace(".", ",")} Sekunden\n🔥 Serie: ${dailyStreak()} ${dailyStreak() === 1 ? "Tag" : "Tage"}\n${SITE_URL}`;
  }
  if (level.timed && level.tm && !level.coop) {
    const used = level.tm.limit - timeLeft, r = timeLeft / level.tm.limit, m = r >= 0.5 ? "🥇 Gold" : r >= 0.25 ? "🥈 Silber" : "🥉 Bronze";
    return `⏳ Nebelpfad · Zeitdungeon ${level.tm.nm} (${dateTxt()})\n${m} in ${used.toFixed(1).replace(".", ",")} Sekunden\nHeute ist der Weg für alle gleich. Schaffst du es schneller?\n${SITE_URL}`;
  }
  if (level.coop) return `🤝 Nebelpfad Koop: Wir haben ${level.animal} ${akk(level.who)} zusammen befreit!${level.timed && level.limit ? ` ⏳ in ${(level.limit - timeLeft).toFixed(1).replace(".", ",")} Sekunden` : ""}\n${SITE_URL}`;
  if (level.fest) return `${level.animal} Nebelpfad · ${festNow().nm}: ${level.who} ist frei! ${heartsTxt(tries, startTries)}\n${SITE_URL}`;
  if (level.farm || level.replay) return null;
  if (level.animalName) return `${level.animal} Ich habe ${akk(level.who)} im Nebelpfad befreit! ${heartsTxt(tries, startTries)}${lostHeart ? "" : " ⭐"}\n${SITE_URL}`;
  return null;
}
new MutationObserver(() => { if (!$("win").hidden) { shareCache = buildShare(); $("shareBtn").hidden = !shareCache; } }).observe($("win"), { attributes: true, attributeFilter: ["hidden"] });
$("shareBtn").addEventListener("click", async () => {
  const t = shareCache; if (!t) return;
  if (navigator.share) { try { await navigator.share({ text: t }); return; } catch (e) { if (e && e.name === "AbortError") return; } }
  copyTxt(t, "📋 Ergebnis kopiert! Füg es einfach in Discord oder im Chat ein.");
});

/* ---------- Tages-Bestenliste der Zeitdungeons ---------- */
const tDay = () => dayKey().replace(/-/g, "");
async function timeBoard() {
  try {
    if (DB) { const d = await DB.doc("coop/zeit" + tDay()).get(); return d.exists ? (d.data().list || []) : []; }
    if (FB) return Object.values((await FB.ref("coop/ZEIT" + tDay()).get()).val() || {});
  } catch (e) {}
  return [];
}
async function addTimeBoard(e) {
  try {
    if (DB) { const l = await timeBoard(); l.push(e); await DB.doc("coop/zeit" + tDay()).set({ list: l.slice(-200) }); }
    else if (FB) await FB.ref("coop/ZEIT" + tDay()).push(e);
  } catch (x) {}
}
let tbMode = "leicht";
const myName = () => { try { return (localStorage.getItem("nebelpfad-coopname") || "").trim(); } catch (e) { return ""; } };
async function renderTimeBoard() {
  const seg = $("tbMode"); seg.innerHTML = "";
  TIME_MODES.forEach(m => { const b = btnEl(`${m.ic} ${m.nm}`, () => { tbMode = m.id; renderTimeBoard(); }); b.setAttribute("aria-pressed", String(tbMode === m.id)); seg.appendChild(b); });
  const box = $("timeBestList");
  const all = (await timeBoard()).filter(e => e && e.m === tbMode && e.t > 0), best = {};
  all.forEach(e => { const k = String(e.n || "Ohne Namen").slice(0, 20); if (!best[k] || e.t < best[k]) best[k] = e.t; });
  const rows = Object.entries(best).sort((a, b) => a[1] - b[1]).slice(0, 10), me = myName();
  box.innerHTML = rows.length ? rows.map(([n, t], i) => `<div class="wk-row tb-row${n === me ? " me" : ""}"><span class="ic" aria-hidden="true">${["🥇", "🥈", "🥉"][i] || "⭐"}</span><span class="t"><strong>${escH(n)}${n === me ? " (du)" : ""}</strong><span>${t.toFixed(1).replace(".", ",")} Sekunden</span></span></div>`).join("")
    : `<span class="none">Heute ist hier noch niemand durchgekommen. Sei die Erste!</span>`;
}
new MutationObserver(() => { if (!$("timeView").hidden) try { $("timeName").value = myName(); renderTimeBoard(); } catch (e) {} }).observe($("timeView"), { attributes: true, attributeFilter: ["hidden"] });
$("timeName").addEventListener("change", () => { try { localStorage.setItem("nebelpfad-coopname", $("timeName").value.trim().slice(0, 20)); } catch (e) {} renderTimeBoard(); });
{ const _tw = timeWin; timeWin = function () {
  const r = _tw.apply(this, arguments);
  try {
    const used = Math.round((level.tm.limit - timeLeft) * 10) / 10;
    addTimeBoard({ n: myName() || "Ohne Namen", m: level.tm.id, t: used, at: Date.now() });
    $("winText").innerHTML += `<br><br>🏆 Deine Zeit steht jetzt in der Tages-Bestenliste${myName() ? "" : ". Trag unter den Zeitdungeons deinen Namen ein, damit man dich erkennt"}.`;
  } catch (e) {}
  return r;
}; }

/* ---------- Koop: wer ist da, Wiedereinstieg, Verbindung ---------- */
const LIVE_KEY = "nebelpfad-cooplive";
let mates = {};
function liveSet() {
  if (DB || !coopCode || !level || !level.coop) return;
  try { localStorage.setItem(LIVE_KEY, JSON.stringify({ code: coopCode, guest: !!guestMode, seat: mySeat, name: guestMode ? coopNames[mySeat] : coopNames.host, t: Date.now() })); } catch (e) {}
}
function liveClear() { try { localStorage.removeItem(LIVE_KEY); } catch (e) {} }
{ const _a = startCoop; startCoop = function () { const r = _a.apply(this, arguments); liveSet(); return r; }; }
{ const _a = resumeCoop; resumeCoop = function () { const r = _a.apply(this, arguments); liveSet(); return r; }; }
{ const _a = guestStart; guestStart = function () { const r = _a.apply(this, arguments); liveSet(); return r; }; }
{ const _a = guestRender; guestRender = function () { const was = guestShownEnd; const r = _a.apply(this, arguments); if (guestShownEnd === "won" && was !== "won") bump("coop"); return r; }; }
{ const _a = readNames; readNames = function (d) { if (d) ["host", "claude", "claude2"].forEach(s => { if (d["here_" + s]) mates[s] = d["here_" + s]; }); const r = _a.apply(this, arguments); try { if (level && level.coop && !DB && !$("dungeonView").hidden) renderWho(); } catch (e) {} return r; }; }
["back", "home"].forEach(id => $(id).addEventListener("click", () => { if (level && level.coop) liveClear(); }));
const meSeat = () => guestMode ? mySeat : "host";
const mateOn = s => s === meSeat() || (mates[s] && Date.now() - mates[s] < 20000);
function renderWho() {
  const box = $("coopWho"), seats = ["host", ...Object.keys(seatsNow())];
  box.innerHTML = seats.map(s => `<span class="who-chip${mateOn(s) ? " on" : ""}">${seatIcon(s)} ${escH(seatName(s))}${s === meSeat() ? " (du)" : ""} ${mateOn(s) ? "🟢" : "⚪"}</span>`).join("");
  box.hidden = false;
}
function drawMates(lx, ly, t) {
  Object.keys(seatsNow()).forEach((s, i) => {
    const on = mateOn(s), ox = (i === 0 ? -1 : 1) * 20, oy = -18 + (reduce ? 0 : Math.sin(t / 420 + i * 2) * 2);
    ctx.save(); ctx.globalAlpha = on ? 1 : .45;
    ctx.fillStyle = "#0b0f18d0"; ctx.beginPath(); ctx.arc(lx + ox, ly + oy, 10, 0, 7); ctx.fill();
    ctx.strokeStyle = on ? "#8fe0ad" : "#8d97ad"; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.font = "13px serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(seatIcon(s), lx + ox, ly + oy + 1);
    ctx.restore();
  });
}
setInterval(() => {
  if (!level || !level.coop || DB || !coopCode || $("dungeonView").hidden || !CB.ok()) { $("coopWho").hidden = true; return; }
  const me = meSeat(); if (!me) return;
  mates[me] = Date.now(); CB.update({ ["here_" + me]: Date.now() }).catch(() => {});
  liveSet(); renderWho();
}, 5000);
let fbConn = null, connWatch = false;
setInterval(() => {
  if (connWatch || !FB) return; connWatch = true;
  try {
    FB.ref(".info/connected").on("value", s => {
      const c = !!s.val(), inCoop = level && level.coop && !$("dungeonView").hidden;
      if (fbConn === true && !c && inCoop) showToast("📡 Die Verbindung ist kurz weg … Ich verbinde dich automatisch neu.", false, 6000);
      if (fbConn === false && c && inCoop) { showToast("✅ Wieder verbunden! Weiter geht's."); if (guestMode) CB.get().then(d => { if (d) guestRender(d); }).catch(() => {}); else coopSync(true); }
      fbConn = c;
    });
  } catch (e) {}
}, 1000);
async function autoRejoin() {
  let L = null; try { L = JSON.parse(localStorage.getItem(LIVE_KEY) || "null"); } catch (e) {}
  if (!L || !L.code || DB || Date.now() - L.t > 3 * 3600e3) return;
  for (let i = 0; i < 60 && !FB; i++) await new Promise(r => setTimeout(r, 250));
  if (!FB || $("villageView").hidden) return;
  useCode(L.code);
  const d = await CB.get().catch(() => null);
  if (!d || !d.grid || d.won || $("villageView").hidden) { liveClear(); return; }
  if (L.guest) {
    coopSize = d.size || 2; lastShout = {}; readNames(d);
    ["host", "claude", "claude2"].forEach(k => { if (d["shout_" + k]) lastShout[k] = d["shout_" + k].id; });
    mySeat = L.seat || "claude"; coopNames[mySeat] = L.name || "Mitspieler";
    guestStart(d); coopListen();
  } else { coopListen(); resumeCoop(d); }
  showToast(`🤝 Willkommen zurück! Du bist wieder im Koop-Spiel <b>${escH(L.code)}</b>.`, true);
}

/* ---------- Start ---------- */
{ const _rv = renderVillage; renderVillage = function () { const r = _rv.apply(this, arguments); try { if (!featOpen(FEAT.fest)) $("vSub").textContent = $("vSub").textContent.replace(/ \S+ Gerade ist .*Reiter Fest\./u, ""); refreshFeats(); renderRemind(); } catch (e) { console.error(e); } return r; }; }
setTimeout(() => {
  if (!H.tut && !rescuedN()) openTut();
  autoRejoin();
  checkAch();
}, 600);

