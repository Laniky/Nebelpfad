/* ---------- Musik und Geräusche ----------
   Alles wird live im Browser erzeugt (Web Audio). Es gibt keine fremden Musikdateien,
   die Musik ist also eigene Musik des Spiels und darf frei mitveröffentlicht werden. */
const SND = (() => {
  let ctx = null, master, musicBus, sfxBus, verb, timer = null, nextT = 0, beat = 0, mood = "dorf", root = 60, last = 4, chordI = 0;
  let mode = 0; try { mode = +(localStorage.getItem("nebelpfad-sound") || 0); } catch (e) {}
  // 0 = Musik + Geräusche, 1 = nur Geräusche, 2 = aus
  // Lautstärke aus den Einstellungen (0 bis 100)
  let vol = { m: 70, f: 80 }; try { Object.assign(vol, JSON.parse(localStorage.getItem("nebelpfad-vol") || "{}")); } catch (e) {}
  const MV = () => 0.31 * vol.m / 100, FV = () => 0.62 * vol.f / 100;
  const MOODS = {
    dorf:    { scale: [0, 2, 4, 7, 9],  chords: [0, 9, 5, 7],   beat: 0.8,  pad: [0, 4, 7] },
    dungeon: { scale: [0, 3, 5, 7, 10], chords: [0, 8, 10, 0],  beat: 0.95, pad: [0, 3, 7] },
    haus:    { scale: [0, 2, 4, 7, 9],  chords: [0, 5, 9, 7],   beat: 0.85, pad: [0, 4, 9] }
  };
  const ROOTS = { wald: 62, see: 60, hoehle: 57, wiese: 64, moor: 59, gipfel: 61 };
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  function init() {
    if (ctx) return true;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
    ctx = new AC();
    master = ctx.createGain(); master.gain.value = 0.8; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.gain.value = mode === 0 ? MV() : 0; musicBus.connect(master);
    sfxBus = ctx.createGain(); sfxBus.gain.value = mode < 2 ? FV() : 0; sfxBus.connect(master);
    // weicher Hall aus selbst erzeugtem Rauschen
    verb = ctx.createConvolver(); const len = ctx.sampleRate * 2.4, buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = buf.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3); }
    verb.buffer = buf; const vg = ctx.createGain(); vg.gain.value = 0.55; verb.connect(vg); vg.connect(master);
    timer = setInterval(schedule, 90);
    return true;
  }
  function tone(f, t, dur, { type = "sine", vol = 0.2, bus = sfxBus, att = 0.005, wet = 0.3, slide = 0 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t); if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, f * slide), t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + att); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(bus);
    if (wet) { const w = ctx.createGain(); w.gain.value = wet; g.connect(w); w.connect(verb); }
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, { vol = 0.1, freq = 1200, q = 1, bus = sfxBus } = {}) {
    const n = ctx.createBufferSource(), b = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * dur), ctx.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    n.buffer = b; const f = ctx.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = freq; f.Q.value = q;
    const g = ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    n.connect(f); f.connect(g); g.connect(bus); n.start(t);
  }
  // Weicher Flötenton: langsam ein- und ausblenden, kein harter Anschlag
  const box = (m, t, v = 0.1) => {
    const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter(), lfo = ctx.createOscillator(), lg = ctx.createGain();
    o.type = "sine"; o.frequency.value = mtof(m); lfo.frequency.value = 4.5; lg.gain.value = 2.5; lfo.connect(lg); lg.connect(o.frequency);
    f.type = "lowpass"; f.frequency.value = 1400;
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + 0.35); g.gain.exponentialRampToValueAtTime(0.0001, t + 3);
    o.connect(f); f.connect(g); g.connect(musicBus); const w = ctx.createGain(); w.gain.value = 0.6; g.connect(w); w.connect(verb);
    o.start(t); lfo.start(t); o.stop(t + 3.1); lfo.stop(t + 3.1);
  };
  let rest = 6, phrase = 0;
  function pad(chordRoot, t, len, M) {
    M.pad.forEach((iv, i) => {
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = "triangle"; o.frequency.value = mtof(chordRoot - 12 + iv); o.detune.value = (i - 1) * 6;
      f.type = "lowpass"; f.frequency.value = 700;
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.05, t + len * 0.4); g.gain.linearRampToValueAtTime(0.0001, t + len);
      o.connect(f); f.connect(g); g.connect(musicBus); const w = ctx.createGain(); w.gain.value = 0.4; g.connect(w); w.connect(verb);
      o.start(t); o.stop(t + len + 0.1);
    });
  }
  function schedule() {
    if (!ctx || mode !== 0 || ctx.state !== "running") return;
    const M = MOODS[mood];
    if (nextT < ctx.currentTime) nextT = ctx.currentTime + 0.05;
    while (nextT < ctx.currentTime + 0.35) {
      const bar = Math.floor(beat / 8), cr = root + M.chords[bar % M.chords.length];
      if (beat % 8 === 0) { pad(cr, nextT, M.beat * 8.6, M); tone(mtof(cr - 24), nextT, M.beat * 7, { type: "sine", vol: 0.06, bus: musicBus, att: 1.2, wet: 0.2 }); chordI = bar; }
      // Melodie nur ab und zu: kurze Phrase aus 2 bis 4 Tönen, dann lange Pause
      if (rest > 0) rest--;
      else {
        if (!phrase) phrase = 2 + Math.floor(Math.random() * 3);
        last = Math.max(0, Math.min(7, last + [-2, -1, -1, 1, 1, 2][Math.floor(Math.random() * 6)]));
        box(root + M.scale[last % 5] + 12 * Math.floor(last / 5), nextT, 0.08);
        if (--phrase === 0) rest = 10 + Math.floor(Math.random() * 14);
      }
      nextT += M.beat * (Math.random() < 0.2 ? 1.5 : 1); beat++;
    }
  }
  function setMood(m, theme) {
    const nr = (m === "dungeon" && ROOTS[theme]) || (m === "haus" ? 62 : 60);
    if (m === mood && nr === root) return;
    mood = m; root = nr; beat = 0; last = 4; rest = 6; phrase = 0;
    if (ctx && mode === 0) { const g = musicBus.gain, t = ctx.currentTime; g.cancelScheduledValues(t); g.setValueAtTime(0.0001, t); g.linearRampToValueAtTime(MV(), t + 3); }
  }
  function applyMode() {
    try { localStorage.setItem("nebelpfad-sound", mode); } catch (e) {}
    document.querySelectorAll(".sndBtn").forEach(b => {
      const full = b.dataset.full === "1";
      b.textContent = mode === 0 ? (full ? "🎵 Musik an" : "🎵") : mode === 1 ? (full ? "🔔 Nur Geräusche" : "🔔") : (full ? "🔇 Ton aus" : "🔇");
      b.setAttribute("aria-label", mode === 0 ? "Musik und Geräusche an. Tippen für nur Geräusche" : mode === 1 ? "Nur Geräusche. Tippen für Ton aus" : "Ton aus. Tippen für Musik an");
    });
    if (!ctx) return;
    const t = ctx.currentTime;
    musicBus.gain.cancelScheduledValues(t); musicBus.gain.setTargetAtTime(mode === 0 ? MV() : 0, t, 0.3);
    sfxBus.gain.setTargetAtTime(mode < 2 ? FV() : 0, t, 0.05);
  }
  const play = fn => { if (mode < 2 && init() && ctx.state === "running") fn(ctx.currentTime + 0.01); };
  const fx = {
    step:   () => play(t => tone(320 + Math.random() * 40, t, 0.12, { type: "triangle", vol: 0.06, wet: 0.05, slide: 0.7 })),
    seed:   () => play(t => [0, 4, 7, 12].forEach((s, i) => tone(mtof(76 + s), t + i * 0.07, 0.5, { vol: 0.12 }))),
    solve:  r => play(t => {
      const base = { schutz: 55, spur: 72, bau: 60, licht: 79, heil: 76, fuchs: 67, otter: 64 }[r] || 69;
      [0, 7, 12].forEach((s, i) => tone(mtof(base + s), t + i * 0.08, 0.7, { type: i ? "sine" : "triangle", vol: 0.13 }));
      if (r === "bau" || r === "otter") for (let k = 0; k < 3; k++) noise(t + k * 0.06, 0.15, { vol: 0.05, freq: 800 + k * 300, q: 4 });
      if (r === "schutz") noise(t, 0.3, { vol: 0.06, freq: 200, q: 1 });
    }),
    wrong:  () => play(t => { tone(196, t, 0.35, { type: "triangle", vol: 0.12, slide: 0.75 }); tone(185, t + 0.12, 0.4, { type: "triangle", vol: 0.08, slide: 0.7 }); }),
    win:    () => play(t => [0, 4, 7, 12, 16, 19, 24].forEach((s, i) => tone(mtof(67 + s), t + i * 0.11, 1.4, { vol: 0.13, wet: 0.5 }))),
    fail:   () => play(t => [12, 7, 3, 0].forEach((s, i) => tone(mtof(57 + s), t + i * 0.22, 0.9, { type: "triangle", vol: 0.1, wet: 0.5 }))),
    plant:  () => play(t => { tone(500, t, 0.15, { vol: 0.12, slide: 1.8, wet: 0.1 }); noise(t, 0.1, { vol: 0.04, freq: 2500 }); }),
    water:  () => play(t => { for (let k = 0; k < 5; k++) tone(900 + Math.random() * 700, t + k * 0.08, 0.12, { vol: 0.06, slide: 0.5, wet: 0.2 }); }),
    harvest:() => play(t => { noise(t, 0.25, { vol: 0.06, freq: 3000, q: 0.7 }); [0, 5, 9].forEach((s, i) => tone(mtof(72 + s), t + 0.1 + i * 0.08, 0.5, { vol: 0.1 })); }),
    plop:   () => play(t => tone(260 + Math.random() * 120, t, 0.18, { vol: 0.12, slide: 2.2, wet: 0.2 })),
    bubble: () => play(t => { for (let k = 0; k < 9; k++) tone(180 + Math.random() * 260, t + k * 0.09 + Math.random() * 0.04, 0.16, { vol: 0.07, slide: 2.5, wet: 0.25 }); noise(t, 0.9, { vol: 0.03, freq: 400, q: 0.8 }); }),
    brewed: () => play(t => [0, 4, 7, 11, 14].forEach((s, i) => tone(mtof(72 + s), t + i * 0.09, 1, { vol: 0.11, wet: 0.5 }))),
    potion: () => play(t => { tone(600, t, 0.4, { vol: 0.1, slide: 2, wet: 0.4 }); tone(900, t + 0.1, 0.5, { vol: 0.08, slide: 1.6, wet: 0.4 }); }),
    dig:    () => play(t => { for (let k = 0; k < 3; k++) { noise(t + k * 0.18, 0.16, { vol: 0.09, freq: 350, q: 0.9 }); tone(140, t + k * 0.18, 0.12, { type: "triangle", vol: 0.06, wet: 0.05, slide: 0.6 }); } }),
    pull:   () => play(t => { noise(t, 0.2, { vol: 0.07, freq: 2200, q: 0.6 }); tone(420, t + 0.15, 0.25, { vol: 0.1, slide: 2.4, wet: 0.2 }); }),
    shoo:   () => play(t => { [0, 5].forEach((s, i) => tone(mtof(70 + s), t + i * 0.12, 0.3, { type: "triangle", vol: 0.08, wet: 0.2 })); noise(t, 0.25, { vol: 0.04, freq: 1500, q: 0.5 }); }),
    voice:  nm => play(t => { const h = [...String(nm)].reduce((a, c) => a * 31 + c.charCodeAt(0), 7) >>> 0, base = 300 + (h % 9) * 70, n = 1 + (h >> 4) % 3, up = (h >> 7) % 2;
      for (let k = 0; k < n; k++) tone(base * (1 + k * 0.12), t + k * 0.13, 0.16, { type: (h >> 9) % 2 ? "triangle" : "sine", vol: 0.1, slide: up ? 1.5 : 0.7, wet: 0.25 }); }),
    note:   m => play(t => { tone(mtof(m), t, 0.5, { vol: 0.14, wet: 0.35 }); tone(mtof(m + 12), t, 0.25, { type: "triangle", vol: 0.04, wet: 0.3 }); }),
    click:  () => play(t => tone(700, t, 0.06, { type: "triangle", vol: 0.04, wet: 0 }))
  };
  // Browser erlauben Ton erst nach der ersten Berührung
  const wake = () => { if (mode < 2 && init() && ctx.state !== "running") ctx.resume(); };
  addEventListener("pointerdown", wake, { capture: true }); addEventListener("keydown", wake, { capture: true });
  document.addEventListener("visibilitychange", () => { if (!ctx) return; document.hidden ? ctx.suspend() : (mode < 2 && ctx.resume()); });
  function cycle() { mode = (mode + 1) % 3; wake(); applyMode(); if (mode === 1) fx.click(); }
  function setVol(m, f) { if (m != null) vol.m = m; if (f != null) vol.f = f; try { localStorage.setItem("nebelpfad-vol", JSON.stringify(vol)); } catch (e) {} applyMode(); }
  return { fx, setMood, cycle, applyMode, setVol, get vol() { return { ...vol }; }, get mode() { return mode; } };
})();
document.querySelectorAll(".sndBtn").forEach(b => b.addEventListener("click", SND.cycle));
SND.applyMode();
addEventListener("keydown", e => { if ((e.key === "m" || e.key === "M") && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName) && !e.ctrlKey && !e.metaKey && !waitKey && !Object.values(KEYS).includes("m")) SND.cycle(); });
// Gewinn- und Verlustbild hören (gilt für alle Spielarten, auch im Koop)
new MutationObserver(() => { if (!$("win").hidden) { try { xpAdd(winXp(), true); xpFlush(); } catch (e) {} gemFlush(); SND.fx.win(); if (level && level.animalName) setTimeout(() => SND.fx.voice(level.animalName), 900); } }).observe($("win"), { attributes: true, attributeFilter: ["hidden"] });
new MutationObserver(() => { if (!$("fail").hidden) SND.fx.fail(); }).observe($("fail"), { attributes: true, attributeFilter: ["hidden"] });



