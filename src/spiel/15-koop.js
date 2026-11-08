/* ---------- Koop-Modus ---------- */
// Gemeinsames Spielfeld. Der Spieler, der das Spiel erstellt, führt das Spiel (Host).
// Mitspieler schicken ihre Züge in die Felder "claude" (Platz 1) und "claude2" (Platz 2).
// In der Claude-Version liegt das Spiel unter coop/aktuell, auf der Webseite in Firebase unter coop/<Spielcode>.
let coopLog = [], coopUnsub = null, coopResult = "", coopResult2 = "", coopSig = "", coopTimer = null;
let lastIds = { claude: null, claude2: null }, coopApplied = null, coopApplied2 = null;
let FB = null, coopCode = null, guestMode = false, coopPartnerName = "", myLastId = null;
let coopSize = 2, mySeat = null, coopNames = {}, coopSeats = null, coopTimedOn = false, lastShout = {};
const SEAT_ROLES = { 2: { claude: ["licht", "bau", "otter"] }, 3: { claude: ["licht", "bau"], claude2: ["spur", "otter"] } };
const seatsNow = () => coopSeats || SEAT_ROLES[coopSize] || SEAT_ROLES[2];
const partnerRoles = () => Object.values(seatsNow()).flat();
const COOP_CLAUDE = SEAT_ROLES[2].claude;
const seatOfRole = r => Object.keys(seatsNow()).find(s => seatsNow()[s].includes(r)) || "host";
const myRoles = () => guestMode ? (seatsNow()[mySeat] || []) : ROLES.map(x => x.id).filter(r => !partnerRoles().includes(r));
const seatName = s => s === "host" ? (coopNames.host || "Spielleitung") : s === "claude" ? (DB ? "Claude" : (coopNames.claude || "Mitspieler 1")) : (coopNames.claude2 || "Mitspieler 2");
const seatIcon = s => s === "host" ? "🧙" : /claude/i.test(seatName(s)) ? "🤖" : "🧑";
const PN = () => seatName("claude");
const PNc = () => { const n = PN(); return n[0].toUpperCase() + n.slice(1); };
const PI = () => seatIcon("claude");
const partnerList = () => Object.keys(seatsNow()).map(seatName).join(coopSize === 3 ? " und " : "");
const coopRef = () => DB.doc("coop/aktuell");
const fbRef = () => FB.ref("coop/" + coopCode);
const CB = {
  ok: () => !!(DB || (FB && coopCode)),
  set: p => DB ? coopRef().set(p) : fbRef().set(JSON.parse(JSON.stringify(p))),
  update: p => DB ? coopRef().update(p) : fbRef().update(JSON.parse(JSON.stringify(p))),
  get: async () => {
    if (DB) { const s = await coopRef().get(); return s.exists ? s.data() : null; }
    const s = await fbRef().get(); return s.exists() ? s.val() : null;
  },
  listen: cb => {
    if (DB) return DB.collection("coop").onSnapshot(s => { const d = s.docs.find(x => x.id === "aktuell"); if (d) cb(d.data()); }, () => {});
    const r = fbRef(), h = r.on("value", s => { const v = s.val(); if (v) cb(v); });
    return () => r.off("value", h);
  }
};
function coopPayload() {
  const have = ROLES.map(x => x.id), S = seatsNow();
  return {
    grid: grid.map(r => r.join("")), custom: runCustom || {}, stage: { ...stage }, pos: [px, py], tries, done: !!done,
    won: !!(done && !$("win").hidden), failed: !!(done && !$("fail").hidden), log: coopLog.slice(-8), size: coopSize,
    claudeRoles: (S.claude || []).filter(r => have.includes(r)), claude2Roles: (S.claude2 || []).filter(r => have.includes(r)),
    seats: { claude: S.claude || [], ...(S.claude2 ? { claude2: S.claude2 } : {}) }, hostName: coopNames.host || "",
    tLeft: level && level.timed ? Math.ceil(timeLeft) : null,
    laniRoles: have.filter(r => !partnerRoles().includes(r)),
    applied: coopApplied, result: coopResult, applied2: coopApplied2, result2: coopResult2, updated: Date.now()
  };
}
// Wen-Fall für Tiernamen: "Der Hase" -> "den Hasen"
const WEAK = { "Hase": "Hasen", "Löwe": "Löwen", "Waschbär": "Waschbären" };
const akk = w => w.replace(/^Der (.+)$/, (_, n) => "den " + (WEAK[n] || n)).replace(/^Die /, "die ").replace(/^Das /, "das ");
let coopNoticeKey = "";
function coopSync(force, full) {
  if (guestMode || !CB.ok() || !level || !level.coop) return;
  // Hinweis, wenn ein Hindernis neben dir einen Begleiter eines Mitspielers braucht
  if (!done) {
    let needSeat = null;
    const near = [[0, -1], [0, 1], [-1, 0], [1, 0]].map(([dx, dy]) => [px + dx, py + dy]).find(([x, y]) => {
      const c = grid[y] && grid[y][x]; if (!c || ".BS#~".includes(c)) return false;
      const o = getObst(c, x + "," + y), need = o && o.needs[stage[x + "," + y] || 0];
      if (need && partnerRoles().includes(need)) { needSeat = seatOfRole(need); return true; } return false;
    });
    const nk = near ? near + ":" + (stage[near + ""] || 0) : "";
    if (near && coopNoticeKey !== nk) $("msg").insertAdjacentHTML("beforeend", `<br>${seatIcon(needSeat)} <b>Jetzt ist ${seatName(needSeat)} dran!</b> ${DB ? "Schreib einfach „du“ in den Chat." : (/claude/i.test(seatName(needSeat)) ? "Schreib Claude im Chat „du“." : "Warte kurz, bis dein Mitspieler zieht.")}`);
    coopNoticeKey = nk;
  }
  const p = coopPayload(), sig = JSON.stringify([p.grid, p.pos, p.stage, p.tries, p.done, p.won, p.failed, p.applied, p.applied2, p.tLeft]);
  if (!force && sig === coopSig) return;
  coopSig = sig;
  if (full) {
    const L = level;
    p.level = { name: L.name, theme: L.theme, wall: L.wall, animal: L.animal, animalName: L.animalName, who: L.who, ring: L.ring, animalHint: L.animalHint, intro: L.intro, gen: L.gen, timed: !!L.timed, limit: L.limit || 0 };
    if (coopCode) p.code = coopCode;
    if (coopNames.claude) p.partnerName = coopNames.claude;
    if (coopNames.claude2) p.partner2Name = coopNames.claude2;
    CB.set(p).catch(() => say("Der Koop-Spielstand konnte gerade nicht gespeichert werden."));
  } else CB.update(p).catch(() => {});
}
function readNames(d) {
  if (d.hostName) coopNames.host = d.hostName;
  if (d.seats && d.seats.claude) coopSeats = { claude: d.seats.claude || [], ...(d.seats.claude2 ? { claude2: d.seats.claude2 } : {}) };
  if (d.partnerName) coopNames.claude = d.partnerName;
  if (d.partner2Name) coopNames.claude2 = d.partner2Name;
  if (d.size) coopSize = d.size;
  coopPartnerName = coopNames.claude || "";
}
const SHOUTS = [["👍", "👍"], ["❤️", "❤️"], ["❓", "❓ Was jetzt?"], ["⏳", "⏳ Warte kurz!"], ["👉", "👉 Du bist dran!"], ["🎉", "🎉 Super!"]];
const myShoutKey = () => guestMode ? (mySeat || "claude") : "host";
function showShout(k, e) {
  const txt = (SHOUTS.find(x => x[0] === e) || [e, String(e).slice(0, 24)])[1];
  const b = el("div", "bubble"); b.innerHTML = `<span class="big2">${k === "host" ? "🧙" : seatIcon(k)}</span> ${seatName(k)}: ${txt.replace(/</g, "")}`;
  b.style.left = (25 + Math.random() * 50) + "%";
  $("shoutFx").appendChild(b); setTimeout(() => b.remove(), 2900);
  SND.fx.click();
}
function buildShouts() {
  const box = $("shouts"); box.innerHTML = "";
  SHOUTS.forEach(([e, txt]) => box.appendChild(btnEl(txt, () => {
    const id = Date.now() + "-" + Math.floor(Math.random() * 1e5), k = myShoutKey();
    lastShout[k] = id; showShout(k, e);
    if (CB.ok()) CB.update({ ["shout_" + k]: { id, e, t: Date.now() } }).catch(() => {});
  })));
}
function readShouts(d) {
  ["host", "claude", "claude2"].forEach(k => {
    const sh = d["shout_" + k]; if (!sh || !sh.id || sh.id === lastShout[k]) return;
    lastShout[k] = sh.id;
    if (k !== myShoutKey() && Math.abs(Date.now() - (+sh.t || 0)) < 20000) showShout(k, sh.e);
  });
}
function coopListen() {
  if (coopUnsub || !CB.ok()) return;
  coopUnsub = CB.listen(d => {
    if (level && level.coop && !$("dungeonView").hidden) readShouts(d);
    const before = JSON.stringify(coopNames); readNames(d);
    if (guestMode) { guestRender(d); return; }
    if (JSON.stringify(coopNames) !== before && level && level.coop) { buildRoles(); paintRoles(); }
    if (!level || !level.coop || $("dungeonView").hidden) return;
    ["claude", "claude2"].forEach(seat => {
      const c = d[seat], ap = seat === "claude" ? d.applied : d.applied2;
      if (!c || !c.id || c.id === lastIds[seat] || c.id === ap) return;
      lastIds[seat] = c.id; applyClaude(c, seat);
    });
  });
}
function applyClaude(c, seat = "claude") {
  const dirs = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0], hoch: [0, -1], runter: [0, 1], links: [-1, 0], rechts: [1, 0] };
  const d = dirs[c.dir], setRes = t => { if (seat === "claude") { coopApplied = c.id; coopResult = t; } else { coopApplied2 = c.id; coopResult2 = t; } };
  setRes("");
  if (c.type === "move" && (c.run || Array.isArray(c.to)) && !done) {
    const steps = Array.isArray(c.to) ? pathTo(+c.to[0], +c.to[1]) : d ? runSteps(px, py, d[0], d[1]) : null;
    if (!steps || !steps.length) { setRes(steps === null ? "Dahin führt gerade kein freier Weg." : "Da geht es nicht weiter."); coopSync(true); return; }
    walkSteps(steps, () => { $("msg").innerHTML = `${seatIcon(seat)} <b>${seatName(seat)}</b>: ` + $("msg").innerHTML; setRes(`Gelaufen bis ${px},${py}. ` + $("msg").textContent); coopSync(true); });
    return;
  }
  if (!d) { setRes("Unbekannte Richtung"); coopSync(true); return; }
  if (done) { setRes("Das Abenteuer ist schon vorbei."); coopSync(true); return; }
  const prev = role, nm = seatName(seat);
  const tgt = grid[py + d[1]] && grid[py + d[1]][px + d[0]];
  if (c.type !== "use" && tgt && !".BS#~".includes(tgt)) { setRes(`Da ist ein Hindernis. Dazu braucht ${nm} einen Begleiter (type: use).`); coopSync(true); return; }
  if (c.type === "use") {
    if (!(seatsNow()[seat] || []).includes(c.role) || !ROLES.some(r => r.id === c.role)) { setRes(`Diesen Begleiter steuert ${nm} nicht. Erlaubt: ${(seatsNow()[seat] || []).join(", ")}.`); coopSync(true); return; }
    role = c.role;
  }
  coopActor = seat;
  tryStep(px + d[0], py + d[1]);
  coopActor = "lani";
  if (c.type === "use") { role = prev; paintRoles(); }
  $("msg").innerHTML = `${seatIcon(seat)} <b>${nm}</b>${c.type === "use" ? ` (${ROLE[c.role].nm})` : ""}: ` + $("msg").innerHTML;
  setRes($("msg").textContent);
  coopSync(true);
}
let coopActor = "lani";
const COOP_LIMIT = { 2: 150, 3: 180 };
const teamNames = () => ["host", ...Object.keys(seatsNow())].map(seatName).join(", ").replace(/, ([^,]*)$/, " und $1");
async function bestList() {
  try {
    if (DB) { const d = await DB.doc("coop/bestzeit").get(); return d.exists ? (d.data().list || []) : []; }
    if (FB) { const v = (await FB.ref("coop/BESTZEIT").get()).val() || {}; return Object.values(v); }
  } catch (e) {}
  return [];
}
async function addBest(e) {
  try {
    if (DB) { const l = await bestList(); l.push(e); l.sort((a, b) => a.t - b.t); await DB.doc("coop/bestzeit").set({ list: l.slice(0, 30) }); }
    else if (FB) await FB.ref("coop/BESTZEIT").push(e);
  } catch (e2) {}
}
async function renderBest() {
  const box = $("coopBest"); if (!box) return;
  const l = (await bestList()).filter(e => e && e.t).sort((a, b) => a.t - b.t).slice(0, 10);
  box.innerHTML = l.length ? l.map((e, i) => `<div class="wk-row"><span class="ic" aria-hidden="true">${["🥇", "🥈", "🥉"][i] || "⭐"}</span><span class="t"><strong>${String(e.names || "").replace(/</g, "")}</strong><span>${e.t.toFixed(1).replace(".", ",")} Sekunden · ${e.size === 3 ? "zu dritt" : "zu zweit"} · ${"💛".repeat(e.hearts || 0)}</span></span></div>`).join("")
    : `<span class="none">Noch keine Zeiten. Spielt gegen die Uhr und holt euch Platz 1!</span>`;
}
function coopWin() {
  done = true;
  let timeTxt = "";
  if (level.timed) {
    stopTimer(); const used = level.limit - timeLeft, ratio = timeLeft / level.limit;
    const medal = ratio >= 0.5 ? "🥇 Gold" : ratio >= 0.25 ? "🥈 Silber" : "🥉 Bronze";
    timeTxt = `<br><br>⏳ Geschafft in <b>${used.toFixed(1).replace(".", ",")} Sekunden</b>. Medaille: ${medal}. Eure Zeit steht jetzt in der Koop-Bestenliste 🏆`;
    addBest({ names: teamNames(), size: coopSize, t: Math.round(used * 10) / 10, hearts: tries, d: new Date().toISOString().slice(0, 10) });
    if (ratio >= 0.5) add(H.seeds, RARE_SEEDS[Math.floor(Math.random() * RARE_SEEDS.length)]);
  }
  const gift = [rollDrop(0.2)]; gift.forEach(k => add(H.seeds, k)); saveH();
  $("winIcon").textContent = level.animal;
  $("winTitle").textContent = "Gemeinsam geschafft! 🤝";
  $("winText").innerHTML = `Du${coopSize === 3 ? ", " + seatName("claude") + " und " + seatName("claude2") : " und " + PN()} habt ${akk(level.who)} zusammen befreit.${timeTxt}<br><br>🎁 Belohnung: ${gift.map(k => HERBS[k].ic + " " + HERBS[k].nm).join(", ")} als Samen.`;
  $("home").textContent = "Zurück zum Ort";
  setTimeout(() => { $("win").hidden = false; coopSync(true); }, reduce ? 0 : 1100);
}
const rolesTxt = rs => rs.map(r => ROLE[r] ? ROLE[r].nm : r).join(", ").replace(/, ([^,]*)$/, " und $1");
function startCoop() {
  const keys = Object.keys(THEMES), tk = keys[Math.floor(Math.random() * keys.length)], th = THEMES[tk];
  const a = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
  const [ench, ring] = ENCH[Math.floor(Math.random() * ENCH.length)];
  const name = `Koop: ${th.art} ${PREFIX[Math.floor(Math.random() * PREFIX.length)]}${th.noun}`;
  coopLog = []; coopApplied = coopApplied2 = null; guestMode = false;
  const codeTxt = coopCode ? ` Euer Spielcode: <b>${coopCode}</b>.` : "";
  const mine = ["schutz", "spur", "heil", "fuchs", "licht", "bau", "otter"].filter(r => !partnerRoles().includes(r));
  const seatTxt = Object.keys(seatsNow()).map((s, i) => `${coopNames[s] || "Platz " + (i + 1)}: ${rolesTxt(seatsNow()[s])}`).join(" · ");
  startLevel({
    id: "koop", coop: true, name, ic: "🤝", theme: tk, wall: th.wall, mode: 1, animal: a[0], animalName: a[1], who: a[2], ring,
    gen: { count: coopSize === 3 ? 10 : 8, tier: 1 }, ...(coopTimedOn ? { timed: true, limit: COOP_LIMIT[coopSize] || 150, tm: { id: "koop", limit: COOP_LIMIT[coopSize] || 150 } } : {}),
    intro: DB
      ? `🤝 <b>Koop mit Claude!</b> Du steuerst Bruno, Pip, Funke und die Heilerin, Claude steuert Luna, Holm und Ole (🤖). Braucht ein Hindernis einen von Claudes Begleitern, schreib Claude im Chat.`
      : `🤝 <b>Koop zu ${coopSize === 3 ? "dritt" : "zweit"}${coopTimedOn ? " gegen die Uhr" : ""}!</b>${codeTxt} Du steuerst ${rolesTxt(mine)}. ${seatTxt}.${coopTimedOn ? ` ⏳ Ihr habt ${COOP_LIMIT[coopSize]} Sekunden.` : ""}`,
    animalHint: `${a[2]} ist gefangen in ${ench}. Nur die Heilerin kann den Zauber lösen.`
  });
  coopSync(true, true);
}
function resumeCoop(d) {
  readNames(d);
  coopLog = d.log || []; coopApplied = d.applied || null; coopApplied2 = d.applied2 || null; guestMode = false;
  lastIds = { claude: d.applied || null, claude2: d.applied2 || null };
  startLevel({ id: "koop", coop: true, resume: true, ic: "🤝", mode: 1, ...d.level, map: d.grid, custom: d.custom || {} });
  px = d.pos[0]; py = d.pos[1]; stage = { ...(d.stage || {}) }; tries = d.tries; paintLives();
  if (level.timed && d.tLeft != null) { stopTimer(); timeLeft = d.tLeft; startTimer(); }
  say(`🤝 Willkommen zurück im Koop! Es geht da weiter, wo ihr aufgehört habt.${coopCode ? ` Spielcode: <b>${coopCode}</b>` : ""}`);
  coopSync(true);
  ["claude", "claude2"].forEach(seat => { const c = d[seat], ap = seat === "claude" ? d.applied : d.applied2; if (c && c.id && c.id !== ap) { lastIds[seat] = c.id; applyClaude(c, seat); } });
}

/* Mitspieler-Ansicht auf der Webseite: zeigt das Spielfeld des Hosts und schickt eigene Züge */
let guestShownEnd = false;
function guestStart(d) {
  guestMode = true; guestShownEnd = false; readNames(d);
  startLevel({ id: "koop", coop: true, resume: true, ic: "🤝", mode: 1, ...d.level, map: d.grid, custom: d.custom || {} });
  role = myRoles()[0] || "licht"; paintRoles();
  guestRender(d);
  say(`🤝 Du bist im Spiel <b>${coopCode}</b>! Du steuerst ${rolesTxt(myRoles())}. Wähle einen davon und tippe auf das Feld neben der Laterne.`);
}
function guestRender(d) {
  if (!d || !d.grid) return;
  readNames(d);
  if (d.level && level && d.level.name !== level.name) { level = { ...level, ...d.level }; theme = THEMES[level.theme]; $("dTitle").textContent = level.name; }
  grid = d.grid.map(r => r.split("")); runCustom = d.custom || {}; stage = { ...(d.stage || {}) };
  if (d.tLeft != null) { $("timer").hidden = false; const ts = d.tLeft; $("timer").textContent = `⏳ ${Math.floor(ts / 60)}:${String(ts % 60).padStart(2, "0")}`; $("timer").classList.toggle("low", ts <= 10); }
  if (px !== d.pos[0] || py !== d.pos[1]) SND.fx.step();
  px = d.pos[0]; py = d.pos[1]; tries = d.tries; done = !!d.done; paintLives();
  const ap = mySeat === "claude2" ? d.applied2 : d.applied, res = mySeat === "claude2" ? d.result2 : d.result;
  if (ap && ap === myLastId && res) { $("msg").textContent = res; myLastId = null; }
  else if (d.log && d.log.length) { const last = d.log[d.log.length - 1]; if (last && $("msg").dataset.last !== last) { $("msg").dataset.last = last; $("msg").textContent = "🧙 " + last; } }
  if (d.won && guestShownEnd !== "won") {
    guestShownEnd = "won"; $("fail").hidden = true;
    $("winIcon").textContent = level.animal; $("winTitle").textContent = "Gemeinsam geschafft! 🤝";
    $("winText").innerHTML = `Ihr habt ${akk(level.who)} zusammen befreit!`; $("home").textContent = "Zurück zum Ort"; $("win").hidden = false;
  } else if (d.failed && !d.won && !guestShownEnd) {
    guestShownEnd = "failed";
    $("failText").textContent = "Die Herzen sind aufgebraucht. Wer das Spiel erstellt hat, kann neu beginnen. Dann geht es hier automatisch weiter."; $("fail").hidden = false;
  } else if (!d.done) { guestShownEnd = false; $("win").hidden = true; $("fail").hidden = true; }
}
function guestAct(tx, ty) {
  if (done) return;
  const dist = Math.abs(tx - px) + Math.abs(ty - py);
  if (dist === 0) return;
  if (dist > 1) {
    if (pathTo(tx, ty) === null) { say("Dahin führt gerade kein freier Weg."); return; }
    myLastId = Date.now() + "-" + Math.floor(Math.random() * 1e6);
    CB.update({ [mySeat || "claude"]: { id: myLastId, type: "move", role: null, to: [tx, ty] } }).catch(() => say("Der Zug konnte gerade nicht geschickt werden."));
    say("👣 Ihr lauft los …"); return;
  }
  const c = grid[ty][tx], dir = tx > px ? "right" : tx < px ? "left" : ty > py ? "down" : "up";
  if (c === "#" || c === "~") { say(WALL_MSG[c === "~" ? "lake" : level.wall] || "Hier geht es nicht weiter."); return; }
  const type = ".BS".includes(c) ? "move" : "use";
  if (type === "use" && !myRoles().includes(role)) { say(`Wähle zuerst einen deiner Begleiter: ${rolesTxt(myRoles())}.`); return; }
  myLastId = Date.now() + "-" + Math.floor(Math.random() * 1e6);
  CB.update({ [mySeat || "claude"]: { id: myLastId, type, role: type === "use" ? role : null, dir } }).catch(() => say("Der Zug konnte gerade nicht geschickt werden."));
  say(type === "use" ? `✨ ${ROLE[role].nm} ist unterwegs …` : "👣 Ihr lauft weiter …");
}


/* Koop-Chat: eigene Liste neben dem Spielstand, damit sie beim Neustart nicht verloren geht */
let kcUnsub = null, kcSeen = 0, kcMsgs = [];
const chatRef = () => FB.ref("coop/" + coopCode + "-chat");
const myChatName = () => guestMode ? (coopNames[mySeat] || "Mitspieler") : (coopNames.host || "Spielleitung");
function chatListen() {
  if (kcUnsub || DB || !FB || !coopCode) return;
  const r = chatRef(), h = r.on("value", sn => {
    const v = sn.val() || {}; kcMsgs = Object.values(v).filter(m => m && m.m).sort((a, b) => (a.t || 0) - (b.t || 0)).slice(-40);
    renderKChat();
  });
  kcUnsub = () => r.off("value", h);
}
function renderKChat() {
  const open = !$("kcPanel").hidden, me = myChatName();
  $("kcLog").innerHTML = kcMsgs.length ? kcMsgs.map(m => `<div class="cm${m.n === me ? " me" : ""}"><b>${String(m.n || "?").replace(/</g, "&lt;")}</b>${String(m.m).replace(/</g, "&lt;")}</div>`).join("") : `<span class="none">Noch keine Nachrichten. Schreib deinen Mitspielern etwas!</span>`;
  if (open) { kcSeen = kcMsgs.length; $("kcLog").scrollTop = 1e6; }
  const unread = kcMsgs.slice(kcSeen).filter(m => m.n !== me);
  $("kcBadge").hidden = !unread.length; $("kcBadge").textContent = unread.length;
  if (!open && unread.length && level && level.coop) { const m = unread[unread.length - 1]; if (m.t && Date.now() - m.t < 15000 && m._shown !== true) { m._shown = true; const b = el("div", "bubble"); b.textContent = `💬 ${m.n}: ${String(m.m).slice(0, 40)}`; b.style.left = "50%"; $("shoutFx").appendChild(b); setTimeout(() => b.remove(), 2900); SND.fx.click(); } }
}
$("kcBtn").addEventListener("click", () => {
  const p = $("kcPanel"); p.hidden = !p.hidden; $("kcBtn").setAttribute("aria-expanded", String(!p.hidden));
  renderKChat(); if (!p.hidden) $("kcIn").focus();
});
$("kcForm").addEventListener("submit", e => {
  e.preventDefault();
  const m = $("kcIn").value.trim().slice(0, 200); if (!m || !FB || !coopCode) return;
  $("kcIn").value = "";
  chatRef().push({ n: myChatName(), m, t: Date.now() }).catch(() => say("Die Nachricht konnte gerade nicht geschickt werden."));
});
function chatSetup(on) {
  const show = !!(on && FB && !DB && coopCode);
  $("kcBtn").hidden = !show; if (!show) $("kcPanel").hidden = true;
  if (show) chatListen();
}
/* Koop-Menü auf der Webseite */
const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const newCode = () => Array.from({ length: 5 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
function useCode(c) { if (coopUnsub) { coopUnsub(); coopUnsub = null; } if (kcUnsub) { kcUnsub(); kcUnsub = null; } kcMsgs = []; kcSeen = 0; coopCode = c; }
async function openCoop() {
  if (DB) {
    coopSize = 2; coopSeats = null; coopTimedOn = false; coopListen();
    let d = null;
    try { d = await CB.get(); } catch (e) {}
    if (d && !d.done && d.grid && d.level) resumeCoop(d); else startCoop();
    return;
  }
  show("coopView"); renderSeatEditor(); renderBest();
  let last = null; try { last = localStorage.getItem("nebelpfad-coopcode"); } catch (e) {}
  $("coopResume").hidden = !last; if (last) $("coopResume").textContent = `Letztes Spiel ${last} fortsetzen`;
  try { $("coopName").value = localStorage.getItem("nebelpfad-coopname") || ""; } catch (e) {}
  $("coopNote").textContent = FB ? "" : "Die Verbindung zum Online-Dienst wird gerade aufgebaut … Versuch es in ein paar Sekunden noch einmal.";
}
/* Wer steuert wen: frei einstellbar, für zu zweit und zu dritt getrennt gespeichert */
let menuSize = 2, seatCfg = null;
const ALL_ROLE_IDS = ["schutz", "spur", "bau", "licht", "heil", "fuchs", "otter"];
function loadSeatCfg() {
  if (seatCfg) return;
  seatCfg = { 2: {}, 3: {} };
  [2, 3].forEach(n => ALL_ROLE_IDS.forEach(r => { seatCfg[n][r] = Object.keys(SEAT_ROLES[n]).find(st => SEAT_ROLES[n][st].includes(r)) || "host"; }));
  try { const sv = JSON.parse(localStorage.getItem("nebelpfad-seats") || "null"); if (sv && sv[2] && sv[3]) seatCfg = sv; } catch (e) {}
}
const cfgSeats = n => { const o = { claude: [] }; if (n === 3) o.claude2 = []; ALL_ROLE_IDS.forEach(r => { const st = seatCfg[n][r]; if (o[st]) o[st].push(r); }); return o; };
function renderSeatEditor() {
  loadSeatCfg();
  $("coopSz2").setAttribute("aria-pressed", String(menuSize === 2)); $("coopSz3").setAttribute("aria-pressed", String(menuSize === 3));
  const box = $("seatEditor"); box.innerHTML = "";
  const allRoles = [...BASE_ROLES, ...PET_ROLES];
  const opts = menuSize === 3 ? [["host", "🧙 Du"], ["claude", "Platz 1"], ["claude2", "Platz 2"]] : [["host", "🧙 Du"], ["claude", "Mitspieler"]];
  ALL_ROLE_IDS.forEach(r => {
    const R0 = allRoles.find(x => x.id === r); if (!R0) return;
    if (!opts.some(o => o[0] === seatCfg[menuSize][r])) seatCfg[menuSize][r] = "host";
    const pet = PET_ROLES.find(x => x.id === r), have = !pet || rescued[pet.from];
    const row = el("div", "wk-row seatrow");
    row.innerHTML = `<span class="ic" aria-hidden="true">${R0.ic}</span><span class="t"><strong>${R0.nm}</strong><span>${R0.rl}${have ? "" : " · noch nicht befreit"}</span></span>`;
    const bx = el("div", "seatbtns");
    opts.forEach(([st, lab]) => { const b = btnEl(lab, () => { seatCfg[menuSize][r] = st; try { localStorage.setItem("nebelpfad-seats", JSON.stringify(seatCfg)); } catch (e) {} renderSeatEditor(); }); b.setAttribute("aria-pressed", String(seatCfg[menuSize][r] === st)); bx.appendChild(b); });
    row.appendChild(bx); box.appendChild(row);
  });
}
$("coopSz2").addEventListener("click", () => { menuSize = 2; renderSeatEditor(); });
$("coopSz3").addEventListener("click", () => { menuSize = 3; renderSeatEditor(); });
function createCoop(size) {
  if (!FB) { $("coopNote").textContent = "Noch keine Verbindung zum Online-Dienst. Versuch es gleich noch einmal."; return; }
  loadSeatCfg();
  const seats = cfgSeats(size), have = [...BASE_ROLES, ...PET_ROLES.filter(x => rescued[x.from])].map(r => r.id);
  const empty = Object.keys(seats).find(st => !seats[st].some(r => have.includes(r)));
  if (empty) { $("coopNote").textContent = `${empty === "claude2" ? "Platz 2" : size === 3 ? "Platz 1" : "Dein Mitspieler"} hat noch keinen Begleiter, den du schon befreit hast. Gib ihm mindestens einen.`; return; }
  const nm = $("coopName").value.trim().slice(0, 20); try { localStorage.setItem("nebelpfad-coopname", nm); } catch (e) {}
  useCode(newCode()); try { localStorage.setItem("nebelpfad-coopcode", coopCode); } catch (e) {}
  coopSize = size; coopSeats = seats; coopTimedOn = $("coopTimed").checked;
  coopNames = nm ? { host: nm } : {}; coopPartnerName = ""; lastIds = { claude: null, claude2: null }; lastShout = {};
  coopListen(); startCoop();
}
$("coopNew").addEventListener("click", () => createCoop(menuSize));
$("coopResume").addEventListener("click", async () => {
  if (!FB) return;
  let c = null; try { c = localStorage.getItem("nebelpfad-coopcode"); } catch (e) {}
  if (!c) return;
  useCode(c);
  const d = await CB.get().catch(() => null);
  if (!d || !d.grid) { $("coopNote").textContent = "Dieses Spiel gibt es nicht mehr. Erstell einfach ein neues."; return; }
  coopListen(); resumeCoop(d);
});
$("coopJoin").addEventListener("click", async () => {
  if (!FB) { $("coopNote").textContent = "Noch keine Verbindung zum Online-Dienst. Versuch es gleich noch einmal."; return; }
  const c = $("coopCodeIn").value.trim().toUpperCase(), nm = $("coopName").value.trim().slice(0, 20) || "Mitspieler";
  if (!/^[A-Z0-9]{4,6}$/.test(c)) { $("coopNote").textContent = "Der Spielcode hat 5 Zeichen, zum Beispiel K7QMX."; return; }
  try { localStorage.setItem("nebelpfad-coopname", nm); } catch (e) {}
  useCode(c);
  const d = await CB.get().catch(() => null);
  if (!d || !d.grid) { $("coopNote").textContent = "Zu diesem Code gibt es kein Spiel. Prüf den Code noch einmal."; return; }
  coopSize = d.size || 2; lastShout = {}; readNames(d); ['host', 'claude', 'claude2'].forEach(k => { if (d['shout_' + k]) lastShout[k] = d['shout_' + k].id; });
  // freien Platz suchen (oder den eigenen, wenn man mit demselben Namen zurückkommt)
  if (d.partnerName === nm) mySeat = "claude";
  else if (coopSize === 3 && d.partner2Name === nm) mySeat = "claude2";
  else if (!d.partnerName) mySeat = "claude";
  else if (coopSize === 3 && !d.partner2Name) mySeat = "claude2";
  else { $("coopNote").textContent = "Dieses Spiel ist schon voll."; return; }
  await CB.update(mySeat === "claude" ? { partnerName: nm } : { partner2Name: nm }).catch(() => {});
  coopNames[mySeat] = nm;
  guestStart(d); coopListen();
});
$("coopBack").addEventListener("click", showVillage);
$("toCoop").addEventListener("click", openCoop);
setInterval(() => { if (level && level.coop && !$("dungeonView").hidden) coopSync(false); }, 700);

/* Online-Dienst für die Webseite (Firebase), nur außerhalb von Claude */
(function initOnline() {
  if (window.claude && typeof window.claude.use === "function") return;
  if (typeof firebase === "undefined" || !window.NP_FB_CONFIG) return;
  try {
    firebase.initializeApp(window.NP_FB_CONFIG);
    firebase.auth().signInAnonymously().then(() => { FB = firebase.database(); if (!$("coopView").hidden) $("coopNote").textContent = ""; })
      .catch(() => { if ($("coopNote")) $("coopNote").textContent = "Die Anmeldung beim Online-Dienst hat nicht geklappt."; });
  } catch (e) {}
})();

