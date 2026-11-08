/* ---------- Mitspieler: Dungeonbrowser, Freunde, Chat ---------- */
let DB = null, USER = null, ROOM = null, ME = null;
let groups = [], friends = [], peers = [], myGroupId = null, chatRoom = "welt", chatUnsub = null, chatMsgs = [];
let socTab = "lfg", missions = [], lastStart = Date.now();
const GROUP_ROLES = ["schutz", "spur", "bau", "licht", "heil"];
const FRESH = 3 * 3600 * 1000;
const pairKey = (a, b) => [a, b].sort().join("__");
const ssay = h => { $("socMsg").innerHTML = h; };
function socNote(t) { $("socNote").textContent = t; $("socNote").hidden = !t; }
function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function btnEl(label, fn, cls = "chip") { const b = el("button", cls, label); b.type = "button"; b.addEventListener("click", fn); return b; }
function rowEl(ic, title, sub, actions, online) {
  const r = el("div", "wk-row"), t = el("span", "t"), s1 = el("strong"), s2 = el("span", null, sub);
  if (online) s1.appendChild(el("span", "on"));
  s1.appendChild(document.createTextNode(title));
  t.append(s1, s2); r.append(el("span", "ic", ic), t);
  if (actions && actions.length) { const a = el("div", "acts"); actions.forEach(b => a.appendChild(b)); r.appendChild(a); }
  return r;
}
async function names(ids) {
  const ps = USER && ids.length ? await USER.profiles(ids) : {};
  return id => id === ME ? "Du" : ((ps[id] && ps[id].name) || "Spieler");
}
const onlineIds = () => new Set(peers.filter(p => p.by && !p.isMe).map(p => p.by));
const friendOf = id => friends.find(f => f.users && f.users.includes(id));
const myGroup = () => groups.find(g => g.id === myGroupId);

function missionsAvail() {
  const out = [], max = unlockedMax();
  for (let n = 1; n <= max; n++) {
    const s = getSettlement(n);
    s.levels.forEach((l, i) => { if (l.mode >= 1 && !isLocked(l)) out.push({ key: l.id, n, i, name: l.name, place: s.name, size: l.mode === 1 ? 2 : 5 }); });
    if (secretOpen(s)) { const g = getSecret(n); out.push({ key: g.id, n, i: -1, name: g.name, place: s.name, size: 5 }); }
  }
  return out;
}
function canPlay(m) {
  if (!m || m.n > unlockedMax()) return false;
  const s = getSettlement(m.n);
  return m.i === -1 ? secretOpen(s) : !!s.levels[m.i] && !isLocked(s.levels[m.i]);
}
function launchMission(m) {
  if (!canPlay(m)) { ssay("Eure Gruppe ist gestartet, aber diese Mission hast du selbst noch nicht freigeschaltet."); return; }
  cur = m.n; save();
  const l = m.i === -1 ? getSecret(m.n) : getSettlement(m.n).levels[m.i];
  startLevel(l);
  say(`👥 <b>Gruppenmission!</b> ${l.intro}<br><span style="color:var(--muted)">Im Prototyp spielt jeder seine eigene Runde. Sprecht euch im Gruppenchat ab.</span>`);
}

function fillSelects() {
  missions = missionsAvail();
  const ms = $("mSel"), keep = ms.value; ms.innerHTML = "";
  missions.forEach((m, idx) => { const o = el("option", null, `${m.place} · ${m.name} (${m.size === 2 ? "zu zweit" : "zu fünft"})`); o.value = idx; ms.appendChild(o); });
  if (!missions.length) { const o = el("option", null, "Noch keine Gruppenmission frei"); o.value = ""; ms.appendChild(o); }
  if (keep && ms.querySelector(`option[value="${keep}"]`)) ms.value = keep;
  const rs = $("rSel");
  if (!rs.options.length) {
    const any = el("option", null, "Egal, Hauptsache los"); any.value = "any"; rs.appendChild(any);
    GROUP_ROLES.forEach(r => { const o = el("option", null, `${ROLE[r].ic} ${ROLE[r].rl}`); o.value = r; rs.appendChild(o); });
  }
  $("autoFind").disabled = !missions.length || !DB;
}

async function tryJoin(gid, want) {
  const ref = DB.doc("groups/" + gid);
  const l = await ref.acquire({ holder: ME, ttlMs: 4000 }).catch(() => ({ acquired: false }));
  if (!l.acquired) return false;
  const s = await ref.get(); if (!s.exists) return false;
  const d = s.data(), mem = d.members || {};
  if (mem[ME]) { myGroupId = gid; return true; }
  if (Object.keys(mem).length >= d.size) return false;
  const taken = Object.values(mem);
  let role = want;
  if (want === "any" || taken.includes(want)) {
    if (want !== "any" && d.size === 5) return false;
    role = GROUP_ROLES.find(r => !taken.includes(r));
  }
  if (!role) return false;
  await ref.update({ members: { [ME]: role }, updated: Date.now() });
  myGroupId = gid; return true;
}
async function leaveGroup() {
  const gid = myGroupId; if (!gid) return;
  const ref = DB.doc("groups/" + gid);
  await ref.acquire({ holder: ME, ttlMs: 4000 }).catch(() => null);
  const s = await ref.get();
  if (s.exists) {
    const d = s.data(), mem = { ...(d.members || {}) }; delete mem[ME];
    const left = Object.keys(mem);
    if (!left.length) await ref.delete();
    else await ref.set({ mission: d.mission, size: d.size, members: mem, leader: d.leader === ME ? left[0] : d.leader, status: "open", created: d.created || Date.now(), updated: Date.now() });
  }
  myGroupId = null;
}
async function autoFind() {
  const m = missions[$("mSel").value], want = $("rSel").value;
  if (!m || !DB) return;
  $("autoFind").disabled = true; ssay("🔎 Suche nach Mitspielern …");
  try {
    if (myGroupId) await leaveGroup();
    const cands = groups.filter(g => g.mission && g.mission.key === m.key && Object.keys(g.members || {}).length < g.size);
    for (const g of cands) { if (await tryJoin(g.id, want)) { ssay(`✨ Gruppe gefunden für <b>${m.name}</b>!`); return; } }
    const ref = DB.collection("groups").doc();
    await ref.set({ mission: m, size: m.size, members: { [ME]: want === "any" ? "heil" : want }, leader: ME, status: "open", created: Date.now(), updated: Date.now() });
    myGroupId = ref.id;
    ssay(`Neue Gruppe für <b>${m.name}</b> erstellt. Sobald jemand dieselbe Mission sucht, kommt er automatisch zu dir.`);
  } catch (e) {
    ssay(e && e.code === "quota_exceeded" ? "Der Speicher ist voll. Alte Gruppen müssen erst gelöscht werden." : "Das hat gerade nicht geklappt. Versuch es gleich noch einmal.");
  } finally { $("autoFind").disabled = false; }
}
async function joinGroup(gid) {
  const g = groups.find(x => x.id === gid);
  if (!g) { ssay("Diese Gruppe gibt es nicht mehr."); return; }
  if (!canPlay(g.mission)) { ssay("Diese Mission hast du noch nicht freigeschaltet."); return; }
  try {
    if (myGroupId && myGroupId !== gid) await leaveGroup();
    ssay(await tryJoin(gid, "any") ? `✨ Du bist jetzt in der Gruppe für <b>${g.mission.name}</b>.` : "Die Gruppe ist schon voll.");
  } catch (e) { ssay("Beitreten hat gerade nicht geklappt."); }
}
async function startGroup() {
  const g = myGroup(); if (!g) return;
  await DB.doc("groups/" + g.id).update({ status: "started", startedAt: Date.now(), updated: Date.now() }).catch(() => ssay("Starten hat gerade nicht geklappt."));
}

async function renderLfg() {
  if ($("socialView").hidden || socTab !== "lfg") return;
  fillSelects();
  const ids = new Set();
  groups.forEach(g => Object.keys(g.members || {}).forEach(i => ids.add(i)));
  onlineIds().forEach(i => ids.add(i));
  const nm = await names([...ids]), on = onlineIds();

  const box = $("myGroup"); box.innerHTML = "";
  const g = myGroup();
  if (!g) box.appendChild(el("p", "none", "Du bist in keiner Gruppe. Wähle oben eine Mission und lass dir Mitspieler suchen."));
  else {
    const mem = g.members || {}, cnt = Object.keys(mem).length, full = cnt >= g.size;
    box.appendChild(rowEl("⚔️", g.mission.name, `${g.mission.place} · ${cnt}/${g.size} Spieler${full ? " · komplett!" : " · suche weitere …"}`));
    Object.entries(mem).forEach(([id, r]) => {
      const acts = [];
      if (id !== ME && !friendOf(id)) acts.push(btnEl("💛 Freund", () => addFriend(id)));
      box.appendChild(rowEl(ROLE[r] ? ROLE[r].ic : "✨", nm(id), (ROLE[r] ? ROLE[r].rl : "") + (g.leader === id ? " · Gruppenleitung" : ""), acts, on.has(id)));
    });
    if (g.size === 5) GROUP_ROLES.filter(r => !Object.values(mem).includes(r)).forEach(r => box.appendChild(rowEl(ROLE[r].ic, "Freier Platz", `${ROLE[r].rl} gesucht`)));
    const bar = el("div", "bag");
    bar.appendChild(btnEl(full ? (g.status === "started" ? "Nochmal starten" : "Mission starten") : `Mit ${cnt} starten`, startGroup, "btn sm"));
    bar.appendChild(btnEl("💬 Gruppenchat", () => { switchTab("chat"); openChat("g:" + g.id); }));
    bar.appendChild(btnEl("Gruppe verlassen", async () => { await leaveGroup().catch(() => {}); ssay("Du hast die Gruppe verlassen."); renderLfg(); }));
    box.appendChild(bar);
  }

  const list = $("groupList"); list.innerHTML = "";
  const open = groups.filter(x => x.id !== myGroupId && x.mission && Object.keys(x.members || {}).length < x.size);
  if (!open.length) list.appendChild(el("p", "none", "Gerade sucht niemand. Erstelle oben eine Gruppe, dann finden dich die anderen."));
  open.forEach(x => {
    const mem = x.members || {}, free = x.size === 5 ? GROUP_ROLES.filter(r => !Object.values(mem).includes(r)).map(r => ROLE[r].ic).join(" ") : "";
    const b = btnEl("Beitreten", () => joinGroup(x.id), "btn sm"); b.disabled = !canPlay(x.mission);
    list.appendChild(rowEl("⚔️", x.mission.name, `${x.mission.place} · ${Object.keys(mem).length}/${x.size} · geleitet von ${nm(x.leader)}${free ? " · frei: " + free : ""}${canPlay(x.mission) ? "" : " · noch nicht freigeschaltet"}`, [b]));
  });

  const ol = $("onlineList"); ol.innerHTML = "";
  if (!ROOM) ol.appendChild(el("p", "none", "Wer gerade online ist, siehst du, sobald die Verbindung steht."));
  else if (!on.size) ol.appendChild(el("p", "none", "Gerade ist niemand außer dir hier."));
  on.forEach(id => ol.appendChild(rowEl("🧙", nm(id), friendOf(id) ? (friendOf(id).status === "ok" ? "Freund" : "Anfrage offen") : "Spielt gerade Nebelpfad", friendOf(id) ? [] : [btnEl("💛 Freund", () => addFriend(id))], true)));
}

async function addFriend(id) {
  if (!DB || !ME || id === ME) return;
  const ref = DB.doc("friends/" + pairKey(ME, id));
  try {
    const s = await ref.get();
    if (s.exists) { const d = s.data(); if (d.status === "pending" && d.from !== ME) { await ref.update({ status: "ok" }); ssay("💛 Ihr seid jetzt Freunde!"); } return; }
    await ref.set({ users: [ME, id].sort(), from: ME, status: "pending", created: Date.now() });
    ssay("💛 Freundschaftsanfrage gesendet.");
  } catch (e) { ssay("Die Anfrage hat gerade nicht geklappt."); }
}
async function renderFriends() {
  const n = friends.filter(f => f.status === "pending" && f.from !== ME).length;
  $("reqBadge").innerHTML = n ? `<span class="badge">${n}</span>` : "";
  if ($("socialView").hidden || socTab !== "friends") return;
  const other = f => f.users.find(u => u !== ME);
  const nm = await names(friends.map(other)), on = onlineIds(), box = $("friendList");
  box.innerHTML = "";
  const inc = friends.filter(f => f.status === "pending" && f.from !== ME);
  const ok = friends.filter(f => f.status === "ok");
  const out = friends.filter(f => f.status === "pending" && f.from === ME);
  if (inc.length) { box.appendChild(el("h3", null, "Anfragen")); inc.forEach(f => box.appendChild(rowEl("💌", nm(other(f)), "möchte mit dir befreundet sein",
    [btnEl("Annehmen", () => DB.doc("friends/" + f.id).update({ status: "ok" }).catch(() => {}), "btn sm"), btnEl("Ablehnen", () => DB.doc("friends/" + f.id).delete().catch(() => {}))], on.has(other(f))))); }
  box.appendChild(el("h3", null, "Deine Freunde"));
  if (!ok.length) box.appendChild(el("p", "none", "Noch keine Freunde. Füge Mitspieler aus deiner Gruppe oder der Online-Liste hinzu."));
  ok.forEach(f => {
    const id = other(f), acts = [btnEl("💬 Chatten", () => { switchTab("chat"); openChat("p:" + f.id); })];
    if (myGroup()) acts.push(btnEl("⚔️ Einladen", () => sendChat("p:" + f.id, `Komm in meine Gruppe: ${myGroup().mission.name}`, myGroupId)));
    acts.push(btnEl("Entfernen", () => DB.doc("friends/" + f.id).delete().catch(() => {})));
    box.appendChild(rowEl("💛", nm(id), on.has(id) ? "online" : "gerade nicht online", acts, on.has(id)));
  });
  if (out.length) { box.appendChild(el("h3", null, "Gesendet")); out.forEach(f => box.appendChild(rowEl("⏳", nm(other(f)), "Anfrage wartet auf Antwort", [btnEl("Zurückziehen", () => DB.doc("friends/" + f.id).delete().catch(() => {}))]))); }
}

function openChat(room) {
  if (!DB) return;
  chatRoom = room; chatMsgs = [];
  if (chatUnsub) chatUnsub();
  chatUnsub = DB.collection("chat").where("room", "==", room).orderBy("ts", "desc").limit(60)
    .onSnapshot(s => { chatMsgs = s.docs.map(d => ({ id: d.id, ...d.data() })).reverse(); renderChatLog(); },
      () => { $("chatLog").textContent = "Der Chat ist gerade nicht erreichbar."; });
  renderChatRooms(); renderChatLog();
}
async function renderChatRooms() {
  const box = $("chatRooms"); box.innerHTML = "";
  const ok = friends.filter(f => f.status === "ok"), nm = await names(ok.map(f => f.users.find(u => u !== ME)));
  const chip = (label, room) => { const b = btnEl(label, () => openChat(room)); b.setAttribute("aria-pressed", String(chatRoom === room)); box.appendChild(b); };
  chip("🌍 Weltchat", "welt");
  if (myGroup()) chip("⚔️ Gruppe", "g:" + myGroupId);
  ok.forEach(f => chip("💛 " + nm(f.users.find(u => u !== ME)), "p:" + f.id));
}
async function renderChatLog() {
  const log = $("chatLog"); if ($("socialView").hidden || socTab !== "chat") return;
  const nm = await names([...new Set(chatMsgs.map(m => m.from))]);
  log.innerHTML = "";
  if (!chatMsgs.length) log.appendChild(el("p", "none", chatRoom === "welt" ? "Noch ist es still im Weltchat. Sag hallo! 👋" : "Noch keine Nachrichten."));
  chatMsgs.forEach(m => {
    const d = el("div", "cm" + (m.from === ME ? " me" : ""));
    d.appendChild(el("b", null, nm(m.from)));
    d.appendChild(el("time", null, new Date(m.ts).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })));
    d.appendChild(el("div", null, String(m.text || "")));
    if (m.invite && m.from !== ME) d.appendChild(btnEl("⚔️ Gruppe beitreten", () => { switchTab("lfg"); joinGroup(m.invite); }));
    log.appendChild(d);
  });
  log.scrollTop = log.scrollHeight;
}
async function sendChat(room, text, invite) {
  if (!DB || !ME || !text.trim()) return;
  try { await DB.collection("chat").add({ room, from: ME, text: text.trim().slice(0, 300), ts: Date.now(), ...(invite ? { invite } : {}) }); if (invite) ssay("⚔️ Einladung verschickt."); }
  catch (e) { ssay(e && e.code === "quota_exceeded" ? "Der Chat-Speicher ist voll." : "Die Nachricht konnte gerade nicht gesendet werden."); }
}
$("chatForm").addEventListener("submit", e => { e.preventDefault(); const t = $("chatIn").value; $("chatIn").value = ""; sendChat(chatRoom, t); });

function switchTab(t) {
  socTab = t;
  ["lfg", "friends", "chat"].forEach(x => { $("tab-" + x).setAttribute("aria-selected", String(x === t)); $("pane-" + x).hidden = x !== t; });
  if (t === "lfg") renderLfg();
  if (t === "friends") renderFriends();
  if (t === "chat") { if (!chatUnsub) openChat("welt"); else { renderChatRooms(); renderChatLog(); } }
}
["lfg", "friends", "chat"].forEach(x => $("tab-" + x).addEventListener("click", () => switchTab(x)));
$("autoFind").addEventListener("click", autoFind);
$("toSocial").addEventListener("click", () => { show("socialView"); switchTab(socTab); });
$("socialBack").addEventListener("click", showVillage);

async function initSocial() {
  fillSelects();
  const c = window.claude;
  if (!c || typeof c.use !== "function") { socNote("Mitspieler suchen geht nur in der geteilten Spielseite auf claude.ai."); return; }
  const loadTimer = setTimeout(() => { if (!DB) socNote("Die Verbindung zu den anderen Spielern steht noch nicht. Versuch es gleich noch einmal."); }, 10000);
  [DB, USER, ROOM] = await Promise.all([c.use("db"), c.use("user"), c.use("room")].map(p => p.catch(() => null)));
  ME = USER ? await USER.id() : null;
  clearTimeout(loadTimer);
  if (!DB || !ME) { socNote("Für Dungeonbrowser, Freunde und Chat musst du bei Claude angemeldet sein und Zugriff auf diese Seite haben."); fillSelects(); return; }
  socNote("");
  fillSelects();
  DB.collection("groups").onSnapshot(s => {
    groups = s.docs.map(d => ({ id: d.id, ...d.data() })).filter(g => Date.now() - (g.updated || 0) < FRESH);
    const mine = groups.find(g => g.members && g.members[ME]);
    myGroupId = mine ? mine.id : null;
    if (mine && mine.status === "started" && (mine.startedAt || 0) > lastStart) { lastStart = mine.startedAt; launchMission(mine.mission); }
    renderLfg();
  }, () => socNote("Der Dungeonbrowser ist gerade nicht erreichbar."));
  DB.collection("friends").where("users", "array-contains", ME).onSnapshot(s => {
    friends = s.docs.map(d => ({ id: d.id, ...d.data() })); renderFriends(); renderLfg();
  }, () => {});
  if (ROOM) {
    ROOM.presence({ id: ME }).catch(() => {});
    ROOM.onPeers(ch => { peers = ch.peers; renderLfg(); renderFriends(); }, () => { ROOM = null; renderLfg(); });
  }
}
initSocial();

