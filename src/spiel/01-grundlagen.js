const $ = id => document.getElementById(id);
const OPT = (() => { const o = { font: 0, clear: false, calm: null, remind: true }; try { Object.assign(o, JSON.parse(localStorage.getItem("nebelpfad-opt") || "{}")); } catch (e) {} return o; })();
let reduce = OPT.calm != null ? !!OPT.calm : matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ---------- Begleiter ---------- */
const BASE_ROLES = [
  { id: "schutz", ic: "🐻", nm: "Bruno", rl: "Beschützer" },
  { id: "spur",   ic: "🦔", nm: "Pip",   rl: "Spurenleser" },
  { id: "bau",    ic: "🦫", nm: "Holm",  rl: "Bastler" },
  { id: "licht",  ic: "🦉", nm: "Luna",  rl: "Lichtmagier" },
  { id: "heil",   ic: "✨", nm: "Du",    rl: "Heilerin" }
];
const PET_ROLES = [
  { id: "fuchs", ic: "🦊", nm: "Funke", rl: "Schleicher", from: "wald" },
  { id: "otter", ic: "🦦", nm: "Ole",   rl: "Taucher",    from: "see" }
];
const ROLE = Object.fromEntries([...BASE_ROLES, ...PET_ROLES].map(r => [r.id, r]));
const RUNE = { schutz: "🛡️", spur: "🐾", bau: "🔨", licht: "☀️", fuchs: "🌾", otter: "💧" };
const RUNE_ROLES = Object.keys(RUNE);
let ROLES = BASE_ROLES.slice();

/* ---------- Hindernisse ---------- */
const OBST = {
  T: { needs: ["schutz"], after: ".", hint: "Dichte Dornenranken. Jemand Starkes müsste sie zurückhalten …",
       solve: ["<b>Bruno</b> stemmt sich gegen die Dornenranken und hält sie zur Seite. Der Weg ist frei."] },
  H: { needs: ["spur"], after: ".", hint: "Im Nebel laufen viele Spuren durcheinander. Wer findet die richtige?",
       solve: ["<b>Pip</b> schnuppert am Boden, findet die richtige Spur und führt dich sicher hindurch."] },
  W: { needs: ["bau"], after: "B", hint: "Rauschendes Wasser. Ohne Brücke kommst du nicht hinüber. Hier muss <b>gebaut</b> werden 🔨 (Holm).",
       solve: ["<b>Holm</b> schleppt Äste heran und baut eine kleine Brücke."] },
  D: { needs: ["licht"], after: ".", hint: "Eine Wand aus Schatten. Hier braucht es Licht.",
       solve: ["<b>Luna</b> breitet die Flügel aus. Silbernes Licht vertreibt die Schatten."] },
  R: { needs: ["schutz"], after: ".", hint: "Ein schwerer, moosiger Felsbrocken versperrt den Weg.",
       solve: ["<b>Bruno</b> schiebt den Felsbrocken mit einem zufriedenen Brummen zur Seite."] },
  N: { needs: ["licht", "spur"], after: ".", hint: "Dicker, kalter Nebel. Erst braucht es Licht, dann jemanden, der Spuren lesen kann.",
       solve: ["<b>Luna</b> leuchtet in den Nebel. Jetzt sieht man Spuren, aber viele laufen durcheinander …",
               "<b>Pip</b> findet die richtige Spur und führt dich sicher durch den Nebel."],
       mid: "Im Licht sieht man viele Spuren durcheinander. Wer findet die richtige?" },
  G: { needs: ["fuchs"], after: ".", hint: "Eine dichte Hecke mit einem winzigen Spalt. Da passt nur jemand Kleines und Flinkes durch.",
       solve: ["<b>Funke</b> huscht durch den Spalt, zieht von innen am Riegel und die Heckentür schwingt auf."] },
  U: { needs: ["otter"], after: "B", hint: "Ein tiefer Seerosenteich. Auf der anderen Seite schaukelt ein altes Floß. Hier muss <b>getaucht</b> werden 🤿 (Ole).",
       solve: ["<b>Ole</b> taucht hinüber und schiebt das Floß zu dir. Jetzt kommst du trocken ans andere Ufer."] },
  X: { needs: ["licht", "spur", "bau"], after: ".", hint: "Ein uraltes Sterntor. Drei Sternsteine darauf sind erloschen. Vielleicht kann Licht helfen?",
       solve: ["<b>Luna</b> leuchtet die Sternsteine an. Sie flackern, aber das Tor bleibt zu …",
               "<b>Pip</b> entdeckt alte Zeichen im Moos: Die Steine müssen in der richtigen Reihenfolge gedreht werden!",
               "<b>Holm</b> dreht die Steine. Klick, klick, klick … das Sterntor öffnet sich!"],
       mid: "Die Sternsteine flackern. Hier braucht es jetzt noch mehr Hilfe." },
  Z: { needs: ["heil"], animal: true, hint: "Ein Hirsch mit einem Geweih aus Sternenlicht, gefangen in einem Schattenkreis. Nur eine Heilerin kann ihn befreien.",
       solve: ["Du gehst ganz langsam auf ihn zu. Dein Licht und das seines Geweihs fließen zusammen …"] },
  F: { needs: ["heil"], animal: true, hint: "Der Fuchs ist in einem Dornenkreis gefangen. Nur eine Heilerin kann den Zauber lösen.",
       solve: ["Du legst die Hände auf den Dornenkreis. Der Zauber zerfällt zu Glitzerstaub …"] },
  O: { needs: ["heil"], animal: true, hint: "Ein kleiner Otter, eingefroren in schimmerndem Zaubereis. Nur eine Heilerin kann ihn befreien.",
       solve: ["Deine Hände werden warm. Das Zaubereis schmilzt Tropfen für Tropfen …"] }
};
const BASIC = ["T", "H", "W", "D", "R", "G", "U"];
// Schalter in schweren Dungeons: ein Begleiter löst damit alle Hindernisse einer Sorte auf einmal
const SWITCHES = {
  k: { needs: ["licht"], target: "D", ic: "🕯️", nm: "alte Fackel", after: ".", hint: "Eine alte, erloschene Fackel auf einem Steinsockel. Wer könnte sie zum Leuchten bringen? Vielleicht vertreibt ihr Licht alle Schatten hier …",
       solve: ["<b>Luna</b> entzündet die Fackel. Ein warmer Lichtschein flutet den ganzen Dungeon, und <b>alle Schattenwände</b> lösen sich auf!"] },
  l: { needs: ["schutz"], target: "R", ic: "🪵", nm: "schwerer Hebel", after: ".", hint: "Ein riesiger, verrosteter Hebel. Dafür braucht es viel Kraft. Irgendwo grollt es, als hingen Felsen daran …",
       solve: ["<b>Bruno</b> legt sich mit aller Kraft gegen den Hebel. Es rumpelt laut, und <b>alle Felsbrocken</b> rollen davon!"] },
  m: { needs: ["bau"], target: "W", ic: "⚙️", nm: "Schleusenrad", after: ".", hint: "Ein klemmendes Schleusenrad aus Holz. Wer geschickt ist, könnte es reparieren und das Wasser umleiten …",
       solve: ["<b>Holm</b> repariert das Schleusenrad und dreht es. Das Wasser fließt ab, und über <b>alle Bäche</b> führen jetzt Stege!"] },
  n: { needs: ["spur"], target: "H", ic: "🗿", nm: "Spurenstein", after: ".", hint: "Ein Stein voller eingeritzter Pfotenabdrücke. Wer Spuren lesen kann, versteht vielleicht, was er bedeutet …",
       solve: ["<b>Pip</b> liest die Spuren auf dem Stein und folgt ihnen. Plötzlich sind <b>alle Spurenfelder</b> klar und sicher!"] }
};
Object.assign(OBST, SWITCHES);

/* ---------- Welt ---------- */
const THEMES = {
  wald:   { noun: "wald",   art: "Der", ic: "🌲", path: ["#2b3a33", "#34463d"], wall: "tree", spot: "Waldrand",   home: "im Wald" },
  see:    { noun: "see",    art: "Der", ic: "🌫️", path: ["#2c3540", "#3a4552"], wall: "lake", spot: "Teich",      home: "am Teich" },
  hoehle: { noun: "höhle",  art: "Die", ic: "🕯️", path: ["#2e2a33", "#3a3540"], wall: "rock", spot: "Felsen",     home: "in den Felsen" },
  wiese:  { noun: "wiese",  art: "Die", ic: "🌙", path: ["#26352a", "#2f4133"], wall: "tree", spot: "Wiese",      home: "auf der Wiese" },
  sumpf:  { noun: "sumpf",  art: "Der", ic: "🌿", path: ["#29342a", "#334033"], wall: "lake", spot: "Schilfufer", home: "am Schilfufer" },
  ruine:  { noun: "ruine",  art: "Die", ic: "🏛️", path: ["#33323a", "#403e48"], wall: "rock", spot: "Alter Turm", home: "im alten Turm" },
  gipfel: { noun: "gipfel", art: "Der", ic: "⛰️", path: ["#30343c", "#3c414b"], wall: "rock", spot: "Hügel",      home: "auf dem Hügel" }
};
const WALL_MSG = {
  tree: "Alte, knorrige Bäume. Hier geht es nicht weiter.",
  lake: "Tiefes, dunkles Wasser. Da schwimmst du lieber nicht hinein.",
  rock: "Kalter, harter Fels. Hier geht es nicht weiter."
};
const TIERS = [
  { name: "Dorf",         first: "",                          suf: ["tal", "bach", "au", "hain", "wiesen", "feld"], houses: 3 },
  { name: "Stadt",        first: "deine erste Stadt",         suf: ["burg", "stedt", "brück", "hafen", "heim"],    houses: 6 },
  { name: "Hauptstadt",   first: "deine erste Hauptstadt",    suf: ["krone", "feste", "thron", "glanz"],          houses: 8,  castle: true },
  { name: "Sternenstadt", first: "deine erste Sternenstadt",  suf: ["licht", "stern", "schein"],                  houses: 9,  castle: true, glow: true },
  { name: "Himmelsreich", first: "dein erstes Himmelsreich",  suf: ["himmel", "reich", "sphäre"],                 houses: 10, castle: true, glow: true }
];
const PREFIX = ["Stern", "Nebel", "Silber", "Moos", "Dämmer", "Eulen", "Farn", "Tau", "Glüh", "Wolken", "Kristall", "Laternen", "Mondschein", "Funken", "Birken", "Rosen"];
const ANIMALS = [
  ["🐇", "Hase", "Der Hase"], ["🐿️", "Eichhörnchen", "Das Eichhörnchen"], ["🦡", "Dachs", "Der Dachs"], ["🐢", "Schildkröte", "Die Schildkröte"],
  ["🦢", "Schwan", "Der Schwan"], ["🐸", "Frosch", "Der Frosch"], ["🦝", "Waschbär", "Der Waschbär"], ["🐈", "Katze", "Die Katze"],
  ["🐑", "Schaf", "Das Schaf"], ["🦋", "Schmetterling", "Der Schmetterling"], ["🐺", "Wolf", "Der Wolf"], ["🦅", "Adler", "Der Adler"],
  ["🦚", "Pfau", "Der Pfau"], ["🦩", "Flamingo", "Der Flamingo"], ["🐼", "Panda", "Der Panda"], ["🐧", "Pinguin", "Der Pinguin"]
];
const RARE = [["🦄", "Einhorn", "Das Einhorn"], ["🐉", "Sterndrache", "Der Sterndrache"], ["🦁", "Löwe", "Der Löwe"], ["🐳", "Wolkenwal", "Der Wolkenwal"]];
const ENCH = [["einem Dornenkreis", "#b48cf2"], ["schimmerndem Zaubereis", "#9fd8ff"], ["einem Schattenkreis", "#f2c76b"],
  ["einem Netz aus Mondfäden", "#c9d3e6"], ["einem tiefen Zauberschlaf", "#e9a0c8"]];
const MODES = ["Solo", "Zu zweit", "Zu fünft"];

