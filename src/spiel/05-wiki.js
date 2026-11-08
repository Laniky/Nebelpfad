/* ---------- Wiki ---------- */
let wikiFrom = "village";
const WIKI_OBST = [
  ["T", "🌿", "Dornenranken", "Lila Ranken, die den Weg zuwuchern."],
  ["R", "🪨", "Felsbrocken", "Ein großer, moosiger Brocken, der leicht wackelt. Bruno schiebt ihn an, dann rollt er aus dem Weg."],
  ["H", "🐾", "Spurenfeld", "Heller Nebel mit vielen Spuren durcheinander. Nur Pip findet die richtige."],
  ["W", "🌊", "Bach", "Rauschendes Wasser. Danach liegt dort eine Brücke."],
  ["D", "🌑", "Schattenwand", "Wirbelnde Dunkelheit, die nur Licht vertreibt."],
  ["G", "🌳", "Hecke mit Spalt", "Nur jemand Kleines und Flinkes passt hindurch."],
  ["U", "🌸", "Seerosenteich", "Tief, mit einem Floß auf der anderen Seite."],
  ["N", "🌫️", "Nebelwand", "Zwei Schritte: erst Licht, dann die richtige Spur."],
  ["X", "⭐", "Sterntor", "Drei Schritte: Licht, Zeichen lesen, Steine drehen."],
  ["Q", "🔮", "Verwunschenes Feld", "Mehrere Hindernisse liegen hintereinander. Ist eins gelöst, taucht das nächste auf, bis das Feld frei ist."]
];
const needText = t => t === "Q" ? "mehrere nacheinander" : OBST[t].needs.map(r => `${ROLE[r].ic} ${ROLE[r].nm}`).join(" → ");

function rescuedNames() {
  const set = new Set();
  Object.keys(rescued).forEach(id => {
    const m = MONDTAL.find(l => l.id === id);
    if (m) { set.add(m.animalName); return; }
    const [n, i] = id.split("-").map(Number);
    if (n && getSettlement(n).levels[i]) set.add(getSettlement(n).levels[i].animalName);
  });
  return set;
}

function renderWiki() {
  const known = rescuedNames();
  const beasts = [
    ...MONDTAL.map(l => [l.animal, l.animalName, false]),
    ...ANIMALS.map(a => [a[0], a[1], false]),
    ...RARE.map(a => [a[0], a[1], true])
  ];
  const found = beasts.filter(b => known.has(b[1])).length;
  const row = (ic, name, txt, need) => `<div class="wk-row"><span class="ic" aria-hidden="true">${ic}</span><span class="t"><strong>${name}</strong><span>${txt}</span></span>${need ? `<span class="need">${need}</span>` : ""}</div>`;
  const wallTxt = { tree: "Wände aus alten Bäumen", lake: "umgeben von tiefem Wasser", rock: "Wände aus Fels und Kristallen" };

  $("wikiBody").innerHTML = `
  <section class="wk-sec" id="wk-start"><h2>Grundlagen</h2>
    <ul class="wk-tip">
      <li>Du bist die <b>Heilerin</b> mit der Laterne. Nur du kannst verzauberte Tiere befreien.</li>
      <li>Tippe einfach auf das Feld, wo du hinmöchtest. Die Heilerin läuft auf dem kürzesten freien Weg genau dorthin und sammelt Samen unterwegs ein. Tippst du auf ein Hindernis weiter weg, läuft sie bis direkt davor. Mit den Pfeiltasten gehst du ein Feld weit.</li>
      <li>Vor einem Hindernis wählst du unten den passenden Begleiter und tippst dann auf das Hindernis.</li>
      <li>Am Ende legst du die Hände auf das verzauberte Tier. <b>Nur mit 20 % Glück</b> löst sich der Zauber, sonst flieht das Tier zurück in den Nebel und du versuchst es noch einmal. Damit es nicht zu frustrierend wird, klappt es nach 6 Fehlversuchen beim selben Tier ganz sicher. Bereits gerettete Tiere kannst du jederzeit wieder besuchen.</li>
      <li>Du hast <b>3 Versuche</b> 💛💛💛. Jeder falsche Begleiter kostet einen. Sind alle weg, bringt dich der Nebel an den Anfang zurück.</li>
      <li>Gegen Bäume, Wasser oder Fels zu laufen kostet nichts.</li>
      <li>Schaffst du ein Abenteuer mit <b>allen Herzen</b>, gibt es eine Extra-Belohnung: ein Bonus-Samen mit guter Chance auf einen seltenen, und beim ersten Mal einen ⭐ für das Abenteuer. Ein Fehler, den der Glückstee abfängt, zählt nicht als verlorenes Herz. Entwischt dir das Tier am Ende, bekommst du den ⭐ trotzdem, nur ohne Bonus-Samen.</li>
      <li>Holst du in einem Ort alle 3 ⭐, öffnest du einmalig die <b>Sternentruhe</b>: zwei seltene Samen, ein Herztrank und ein weiterer Trank. Über dem Ort leuchtet danach ein goldener Stern 🌟.</li>
      <li>Jeder Ort hat einen <b>🌀 superschweren Irrgarten</b>. Er öffnet sich, wenn alle drei Tiere dort gerettet sind. Darin gibt es <b>mehrere Wege</b> zum Ziel, und überall warten Hindernisse. Such dir den Weg aus, der am besten zu deinen Begleitern und Tränken passt. Beim ersten Sieg gibt es das 🏆 Meisterabzeichen.</li>
      <li>Auch die Zeitdungeons sind Irrgärten mit mehreren Wegen. Der kürzeste Weg ist nicht immer der schnellste!</li>
      <li>🏆 Für jede Stufe der Zeitdungeons gibt es eine <b>Tages-Bestenliste</b>. Für jeden Namen zählt die beste Zeit des Tages, und jeden Morgen beginnt sie neu.</li>
      <li>In den <b>⏳ Zeitdungeons</b> läuft eine Sanduhr. Erreichst du die Zeitsanduhr rechtzeitig, gibt es je nach übriger Zeit Gold, Silber oder Bronze mit Samen als Belohnung, und deine Bestzeit wird gespeichert.</li>
      <li>⚖️ <b>Gleiche Chancen:</b> Die Zeitdungeons und das Tagesrätsel sehen an einem Tag für alle Spieler gleich aus. Darin wirken keine Tierfähigkeiten, keine Tierkräfte und keine Haustiere, nur die fünf Grund-Begleiter. Tränke darfst du benutzen, die kann jeder brauen. Jeden Tag gibt es neue Wege.</li>
      <li>Gerettete Tiere haben <b>Fähigkeiten</b>. Alle geretteten Tiere helfen dir automatisch überall mit, zum Beispiel mit Extra-Herzen, mehr Samen oder mehr Zeit. Außerdem hat jedes Tier eine <b>Tierkraft zum Antippen</b>, einmal pro Abenteuer, über den Begleiter-Knöpfen. Im 🐾 Tierbuch siehst du, wer was kann.</li>
      <li>Jedes Abenteuer sieht bei jedem Betreten anders aus: neuer Weg, neue Hindernisse, neue Runen. Nur das allererste Mal in Mondtal ist der Weg fest.</li>
      <li>Jedes gerettete Tier zieht in deinen Ort. Sind alle drei gerettet, öffnet sich der nächste Ort.</li>
      <li>🔓 <b>Schritt für Schritt:</b> Am Anfang ist noch nicht alles offen. Nach dem <b>1.</b> geretteten Tier öffnen sich Hexenhaus, Kräuterpfad und Tierlichtung, nach dem <b>2.</b> Tagesrätsel und Tagebuch, nach dem <b>3.</b> Zeitdungeons und Feste. Neues erkennst du an einem roten Punkt 🔴.</li>
      <li>🔔 <b>Erinnerungen:</b> Im Ort siehst du oben, was gerade auf dich wartet, zum Beispiel reife Beete, Kräuter zum Gießen, das Tagesrätsel, das Ende eines Festes oder die verhexte Zeit. Tippe darauf, dann kommst du direkt hin.</li>
      <li>📤 <b>Teilen:</b> Nach einem Sieg kannst du dein Ergebnis teilen, zum Beispiel Tagesrätsel oder Zeitdungeon mit Herzen und Zeit. Auf dem Handy öffnet sich das Teilen-Menü, sonst wird der Text kopiert und du fügst ihn in Discord oder im Chat ein.</li>
      <li>🧭 Beim allerersten Start erklärt dir eine kleine <b>Einführung</b> das Wichtigste. In den ⚙️ Einstellungen kannst du sie jederzeit noch einmal ansehen.</li>
    </ul>
  </section>

  <section class="wk-sec" id="wk-begleiter"><h2>Begleiter</h2>
    <p>Im fertigen Spiel übernehmen Mitspieler diese Rollen. Allein helfen dir deine Tiere.</p>
    <div class="wk-list">
      ${row("🐻", "Bruno · Beschützer 🛡️", "Stark und ruhig. Hält Dornen zurück und schiebt Felsen weg.")}
      ${row("🦔", "Pip · Spurenleser 🐾", "Findet versteckte Pfade, richtige Spuren und alte Zeichen.")}
      ${row("🦫", "Holm · Bastler 🔨", "Baut Brücken und bringt alte Mechanismen wieder zum Laufen.")}
      ${row("🦉", "Luna · Lichtmagier ☀️", "Vertreibt Schatten und bringt Licht in den Nebel.")}
      ${row("✨", "Du · Heilerin", "Löst den Zauber von gefangenen Tieren.")}
      ${row("🦊", "Funke · Schleicher 🌾", rescued.wald ? "Huscht durch enge Spalten und öffnet Riegel von innen." : "Schließt sich dir an, wenn du den Fuchs im Dornenwald rettest.")}
      ${row("🦦", "Ole · Taucher 💧", rescued.see ? "Schwimmt durch tiefes Wasser und holt Flöße heran." : "Schließt sich dir an, wenn du den Otter im Nebelsee rettest.")}
    </div>
  </section>

  <section class="wk-sec" id="wk-hind"><h2>Hindernisse</h2>
    <p>Rechts steht, wer helfen kann. Bei Pfeilen müssen mehrere nacheinander ran.</p>
    <div class="wk-list">${WIKI_OBST.map(([t, ic, n, d]) => row(ic, n, d, needText(t))).join("")}</div>
  </section>

  <section class="wk-sec" id="wk-runen"><h2>Verwunschene Felder</h2>
    <p>Ein verwunschenes Feld hat einen lila schimmernden Rand. Darauf liegen mehrere Hindernisse hintereinander: zum Beispiel erst Wald, den Funke löst, dann fließendes Wasser für Holm, dann Dornen für Bruno. Ist eins gelöst, taucht das nächste auf, bis das Feld frei ist und du darüber laufen kannst. Die kleinen Punkte unten zeigen, wie viele Hindernisse noch fehlen. In größeren Orten werden es mehr. Die Zeichen an den Begleiter-Knöpfen zeigen, wer zu welchem Hindernis passt.</p>
    <div class="wk-list">${Object.entries(RUNE).map(([r, s]) => row(s, ROLE[r].nm, ROLE[r].rl, `${ROLE[r].ic}`)).join("")}</div>
  </section>

  <section class="wk-sec" id="wk-orte"><h2>Orte und Stufen</h2>
    <p>Jeder Ort hat drei Abenteuer: <b>Solo</b>, <b>Zu zweit</b> und <b>Zu fünft</b>. Das große Abenteuer öffnet sich, wenn die anderen beiden geschafft sind. Mit jedem Ort gibt es mehr Hindernisse.</p>
    <div class="wk-list">
      ${row("🏡", "Dorf", "Ort 1 bis 3. Kleine Häuser, ruhige Wege. Hier beginnt alles in Mondtal.")}
      ${row("🏰", "Stadt", "Ort 4 bis 6. Mehr Häuser, erste Türme, Sterntore tauchen auf.")}
      ${row("👑", "Hauptstadt", "Ort 7 bis 9. Mit Burg. Im großen Abenteuer warten seltene Tiere.")}
      ${row("🌟", "Sternenstadt", "Ort 10 bis 12. Goldene Türme und schwebende Laternen.")}
      ${row("☁️", "Himmelsreich", "Ab Ort 13. Die höchste Stufe, und es geht endlos weiter.")}
    </div>
  </section>

  <section class="wk-sec" id="wk-land"><h2>Landschaften</h2>
    <div class="wk-list">${Object.values(THEMES).map(th => row(th.ic, th.noun[0].toUpperCase() + th.noun.slice(1), `${wallTxt[th.wall]}. Tiere wohnen danach ${th.home}.`)).join("")}</div>
  </section>

  <section class="wk-sec" id="wk-tiere"><h2>Tierbuch</h2>
    <p>Entdeckt: <b style="color:var(--lantern)">${found}</b> von ${beasts.length}. Unbekannte Tiere bleiben im Schatten, bis du sie rettest.</p>
    <div class="beasts">${beasts.map(([e, n, rare]) => {
      const k = known.has(n);
      return `<div class="beast${k ? "" : " unk"}"><span class="e" aria-hidden="true">${e}</span>${k ? n : "???"}${rare ? `<span class="rare">selten</span>` : ""}</div>`;
    }).join("")}</div>
  </section>

  <section class="wk-sec" id="wk-ton"><h2>🎵 Musik und Geräusche</h2>
    <p>Nebelpfad spielt ruhige, weiche Hintergrundklänge. Nur ab und zu erklingt eine kurze, sanfte Flötenmelodie, danach ist es wieder lange still. Im Ort klingt sie warm und fröhlich, im Haus ruhig und in den Abenteuern geheimnisvoll. Jede Landschaft hat ihre eigene Tonart. Die Musik wird jedes Mal neu gespielt, darum klingt sie nie ganz gleich.</p>
    <ul class="wk-tip">
      <li>Der Knopf 🎵 schaltet weiter: <b>Musik an</b> → <b>nur Geräusche</b> 🔔 → <b>Ton aus</b> 🔇. Am Computer geht das auch mit der Taste <b>M</b>.</li>
      <li>Gerettete Tiere haben eine eigene Stimme: Du hörst sie bei der Rettung und wenn du sie auf der Tierlichtung antippst.</li>
      <li>Jeder Begleiter hat seinen eigenen Klang, wenn er ein Hindernis löst. Auch Samen, Gießen, Ernten und das Blubbern im Kessel hörst du.</li>
      <li>Die Musik erzeugt das Spiel selbst. Sie enthält keine fremden Lieder und darf deshalb frei mit dem Spiel veröffentlicht werden.</li>
      <li>In den <b>⚙️ Einstellungen</b> stellst du Musik und Geräusche getrennt leiser oder lauter.</li>
    </ul>
  </section>
  <section class="wk-sec" id="wk-set"><h2>⚙️ Einstellungen, Cloud und App</h2>
    <p>Den Knopf <b>⚙️ Einstellungen</b> findest du im Ort.</p>
    <ul class="wk-tip">
      <li>☁️ <b>Spielstand sichern:</b> Normalerweise liegt dein Spielstand nur in diesem Browser. Tippe auf „In der Cloud sichern“, dann bekommst du einen Speicher-Code mit 8 Zeichen. Ab da sichert sich dein Spiel jede Minute von selbst. Auf einem anderen Handy gibst du den Code unter „Spielstand von einem anderen Gerät laden“ ein. Spiel am besten immer nur auf einem Gerät gleichzeitig. Lautstärke und Schrift bleiben auf jedem Gerät, wie du sie eingestellt hast.</li>
      <li>📲 <b>Als App:</b> Auf der Webseite kannst du Nebelpfad auf den Startbildschirm legen. Dann startet es im Vollbild ohne Browserleiste und geht auch ohne Internet. Nur Koop, Chat, Cloud und Bestenlisten brauchen eine Verbindung.</li>
      <li>🔠 <b>Schrift:</b> Normal, Groß oder Sehr groß.</li>
      <li>👀 <b>Klare Sicht:</b> Der Nebel im Dungeon ist heller, und Schalter zeigen unter dem Symbol, welche Hindernisse sie lösen (Schatten, Felsen, Wasser oder Spuren). Das hilft auch bei Farbschwäche.</li>
      <li>🍃 <b>Ruhige Bewegung:</b> Weniger Animationen, kein Wackeln und Hüpfen.</li>
      <li>🔔 <b>Erinnerungen</b> im Ort kannst du hier aus- und einschalten.</li>
    </ul>
  </section>
  <section class="wk-sec" id="wk-keys"><h2>⌨️ Tastatur</h2>
    <p>Im Browser am Computer steuerst du alles auch mit der Tastatur. Tippe auf eine Taste und drücke dann die neue Taste, um sie zu ändern. Mit Esc brichst du ab.</p>
    <div class="wk-list" id="keyList"></div>
  </section>

  <section class="wk-sec" id="wk-mit"><h2>Mitspieler</h2>
    <p>Über <b>👥 Mitspieler</b> im Ort findest du den Dungeonbrowser: Wähle eine Mission „Zu zweit“ oder „Zu fünft“ und deine Rolle, dann sucht das Spiel automatisch eine passende Gruppe oder erstellt eine neue. Mitspieler kannst du als Freunde hinzufügen, ihnen schreiben und sie in deine Gruppe einladen. Im Weltchat triffst du alle, die gerade spielen.</p>
  </section>

  <section class="wk-sec" id="wk-lvl"><h2>⭐ Level der Heilerin</h2>
    <p>Oben im Ort siehst du das Level deiner Heilerin. Für fast alles bekommst du Erfahrung: gerettete Tiere, Geheimstädte, Irrgärten, Koop, Tagesrätsel, Zeitdungeons, Feste, Minispiele, Ernten und Brauen. Tippe auf die Leiste, dann siehst du alle Belohnungen.</p>
    <ul class="wk-tip">
      <li>Auf <b>jedem Level</b> gibt es 💎 Diamanten, auf jedem 5. Level sogar 4.</li>
      <li><b>Titel:</b> ${TITLES.map(t => `${t[1]} (Level ${t[0]})`).join(", ")}.</li>
      <li><b>Laternenfarben:</b> ${LAMPS.map(L => `${L[3]} (Level ${L[0]})`).join(", ")}. Die Farbe wählst du auf der Seite deiner Heilerin.</li>
      <li><b>Mehr Möglichkeiten:</b> größerer Futterkorb (Level 6), neue Beete (Level 7, 14 und 21), 3 Tränke pro Abenteuer (Level 10) und ein 4. Herz (Level 30, nicht in Zeitdungeons und im Tagesrätsel).</li>
      <li><b>Kleidung:</b> 🪶 Federschmuck (Level 13), 🌈 Regenbogenband (Level 22), 🦄 Einhornhorn (Level 35). <b>Lichtungsschmuck:</b> 🗿 Statue (Level 11), 🎠 Karussell (Level 17), 🏰 Schlösschen (Level 24).</li>
    </ul>
  </section>

  <section class="wk-sec" id="wk-erfolge"><h2>🏅 Erfolge</h2>
    <p>Für besondere Leistungen bekommst du Erfolge, und jeder Erfolg schenkt dir 💎 Diamanten. Alle Erfolge siehst du auf der Seite deiner Heilerin (oben im Ort auf die Level-Leiste tippen).</p>
    <div class="wk-list">${ACH.map(a => row((H.ach || {})[a.id] ? a.ic : "🔒", a.nm, a.txt, "+" + a.gem + " 💎")).join("")}</div>
  </section>

  <section class="wk-sec" id="wk-denk"><h2>🧠 Denk-Rätsel</h2>
    <p>In vielen Dungeons musst du gut überlegen, welchen Begleiter du wo einsetzt. Wie viele Denk-Rätsel es gibt, hängt vom Dungeon ab:</p>
    <div class="wk-list">
      ${row("🌿", "Kräuterpfad", "Keine Rätsel. Im Reiter 🌿 Kräuter: ein kurzer oder langer Weg nur zum Farmen von Kräutern und Samen, ohne Tier und ohne Haustier-Begleiter.", "0")}
      ${row("🏡", "Normale Abenteuer", "Ein zufälliges Denk-Rätsel.", "1")}
      ${row("🗝️", "Geheimstädte (zu fünft)", "Drei zufällige Denk-Rätsel.", "3")}
      ${row("🌀", "Irrgarten und 🕸️ Nebelnetz", "Alle fünf Denk-Rätsel auf einmal.", "5")}
    </div>
    <ul class="wk-tip">
      <li><b>❔ Rätselfelder:</b> Das Hindernis ist verhüllt. Wenn du daneben stehst, flüstert es dir einen kleinen Reim zu. Errate, welcher Begleiter gemeint ist.</li>
      <li><b>💪 Müde Begleiter:</b> Jeder Begleiter kann nur so oft helfen, wie die Zahl auf seinem Knopf zeigt. Ist er erschöpft (😴), musst du einen anderen Weg oder Begleiter finden. Tipp: Spar die Kraft der Begleiter auf, die nur sie selbst einsetzen können.</li>
      <li><b>🕯️ Schalter:</b> In einer Sackgasse steht manchmal eine Fackel (Luna), ein Hebel (Bruno), ein Schleusenrad (Holm) oder ein Spurenstein (Pip). Damit löst du <b>alle</b> Hindernisse einer Sorte auf einmal. Lohnt sich der Umweg?</li>
      <li><b>🔄 Wandelnde Felder:</b> Ein gestrichelt umrandetes Feld verwandelt sich alle 3 Schritte. Unten links siehst du, was als Nächstes kommt, die Punkte zeigen die übrigen Schritte.</li>
      <li><b>🔀 Andere Begleiter:</b> Manche Hindernisse schaffen auch andere: Dornen auch Funke, Felsen auch Holm, Spurennebel auch Funke, Wasser auch Ole, Hecken auch Pip und Teiche auch Holm. Nur Schatten braucht immer Luna.</li>
    </ul>
  </section>

  <section class="wk-sec" id="wk-kostuem"><h2>🧣 Kostüme</h2>
    <p>Im <b>🐾 Tierbuch</b> ziehst du deinen Begleitern Kostüme an. Sie tragen sie auf den Knöpfen unter dem Spielfeld und auch, wenn sie im Abenteuer ein Hindernis lösen.</p>
    <p>Kostüme schaltest du mit Sternen frei. Jedes Abenteuer, das du ohne verlorenes Herz schaffst, gibt einen ⭐, und jede Sternentruhe zählt doppelt.</p>
    <div class="wk-list">${Object.values(COSTUMES).map(c => row(c.ic, c.nm, c.fest ? `Festkleidung vom Festmarkt (${FESTS[c.fest].nm})` : "", c.fest ? "Festmarkt" : c.lvl ? `ab Level ${c.lvl}` : `ab ${c.stars} ⭐`)).join("")}</div>
  </section>

  <section class="wk-sec" id="wk-weber"><h2>🕸️ Der Nebelweber und das Tagebuch</h2>
    <p>Wer hat eigentlich den Nebel gemacht? Das findest du nach und nach heraus.</p>
    <ul class="wk-tip">
      <li><b>📜 Tagebuchseiten:</b> In manchen Abenteuern liegt irgendwo auf dem Weg eine leuchtende Seite. Lauf darüber, um sie einzusammeln. Es gibt ${DIARY.length} Seiten, und sie erzählen die Geschichte der Reihe nach. Lesen kannst du sie im Ort unter <b>📜 Tagebuch</b>. In Geheimstädten und Irrgärten liegen sie öfter.</li>
      <li><b>Hinweise:</b> Nach einer Rettung siehst du manchmal etwas Seltsames im Nebel, zum Beispiel einen silbernen Faden.</li>
      <li><b>🕸️ Das große Abschlussrätsel:</b> In jeder Hauptstadt und jeder noch größeren Stadt öffnet sich ein Nebelnetz, wenn dort alle drei Tiere gerettet sind. Es ist ein langer Irrgarten voller verzauberter Felder. Am Ende triffst du den <b>Nebelweber</b>. Bei jedem Treffen erzählt er dir mehr, und du bekommst seltene Samen, Tränke und eine Tagebuchseite.</li>
    </ul>
  </section>

  <section class="wk-sec" id="wk-fest"><h2>🎉 Feste im Jahr</h2>
    <p>Jeden Monat feiert das Land ein anderes Fest. Das aktuelle Fest findest du oben im Reiter <b>Fest</b>, und im Ort steht ein Hinweis.</p>
    <div class="wk-list">${Object.values(FESTS).map(F => row(F.ic, F.nm, `${F.txt} Festtiere: ${F.animals.map(a => a[0] + " " + a[1]).join(", ")}. Nur dann: ${HERBS[F.seed].ic} ${HERBS[F.seed].nm}-Samen und ${F.deco[0]} ${F.deco[1]} für die Lichtung.`, F.mon)).join("")}</div>
    <ul class="wk-tip">
      <li>Im Festabenteuer schweben Blüten, Glühwürmchen, Laternen oder Schneeflocken über dem Spielfeld.</li>
      <li><b>Festteile sammeln:</b> Die Festtiere findest du nicht sofort. Erst brauchst du <b>5 Festteile</b> (bei jedem Fest andere, zum Beispiel 🌸 Blütenblätter oder 🏮 Laternenteile). Jedes gewonnene Fest-Minispiel gibt ein Teil. Mit 5 Teilen öffnet sich das Festabenteuer für das nächste Tier.</li>
      <li><b>Die Minispiele:</b> 🃏 <b>Paare finden</b> (6 Paare, höchstens 8 Irrtümer), 🧺 <b>Auffangen</b> (12 Festteile in 30 Sekunden antippen, die 🌫️ Nebelwolken kosten Zeit) und 🎶 <b>Melodie merken</b> (die Lichter leuchten nacheinander auf, tippe sie in der gleichen Reihenfolge nach, bis zu 6 Töne).</li>
      <li><b>🛍️ Festwährung und Festmarkt:</b> Jedes Fest hat seine eigene Währung, zum Beispiel 🐞 Glückskäfer beim Blütenfest, 🌰 Kastanien beim Laternenfest oder 🍪 Lebkuchen beim Lichtermarkt. Du bekommst sie in jedem Minispiel (3 bis 5 für einen Sieg, 1 als Trost) und im Festabenteuer. Auf dem Festmarkt kaufst du damit Festsamen, seltene Samen, Futterkörbe, Herztränke, Diamanten, besonderen Schmuck für die Lichtung und <b>Festkleidung</b> für deine Begleiter, bei jedem Fest eine andere: ${Object.values(FESTS).map(f => f.cos[0] + " " + f.cos[1]).join(", ")}.</li>
      <li>Jedes gerettete Festtier zieht auf deine Tierlichtung und bleibt dort für immer.</li>
      <li>Nach allen drei Festtieren kannst du mit „Noch einmal feiern“ weiterspielen. Dann wartet am Ende kein Tier mehr, sondern ein 🎁 <b>Festgeschenk</b> mit Festwährung und Festsamen.</li>
    </ul>
  </section>

  <section class="wk-sec" id="wk-tag"><h2>🧩 Tagesrätsel</h2>
    <p>Im Reiter <b>🗓️ Täglich</b> wartet jeden Tag ein neues Rätsel-Dungeon. Es ist an diesem Tag für <b>alle Spieler gleich</b>, so könnt ihr vergleichen, wer es am besten geschafft hat. Es helfen nur die fünf Grund-Begleiter, damit alle die gleichen Chancen haben.</p>
    <ul class="wk-tip">
      <li>In der <b>🏆 Tages-Bestenliste</b> zählt dein erster Sieg des Tages: zuerst die meisten Herzen, dann die wenigsten Anläufe, dann die schnellste Zeit.</li>
      <li>Belohnung beim ersten Sieg: ein Samen, und mit allen Herzen einen seltenen Samen extra.</li>
      <li>🔥 <b>Serie:</b> Schaffst du das Rätsel mehrere Tage hintereinander, wächst deine Serie.</li>
    </ul>
  </section>

  <section class="wk-sec" id="wk-lichtung"><h2>🌳 Tierlichtung</h2>
    <p>Garten und Kessel findest du im Ort unter <b>🍭 Hexenhaus</b>, einem Lebkuchenhaus. Darunter stehen links der Zauberkessel und rechts die Kräuterbeete, und auf einen Blick siehst du, ob etwas reif ist. Tagsüber scheint dort die Sonne, nachts leuchten die Fenster.</p>
    <p>Über <b>🌳 Lichtung</b> im Ort besuchst du alle Tiere, die du gerettet hast. Sie laufen über die Wiese und freuen sich, wenn du vorbeikommst.</p>
    <ul class="wk-tip">
      <li><b>Streicheln:</b> Tippe auf ein Tier, dann hüpft es und erzählt dir etwas. Jedes Tier hat seine eigene Stimme.</li>
      <li><b>Füttern:</b> Im <b>🧺 Futterkorb</b> liegen Karotten 🥕, Äpfel 🍎, Nüsse 🌰, Beeren 🍓, Fisch 🐟, Honig 🍯, Klee 🍀 und Körner 🌾. Er füllt sich jeden Tag neu, und nach jeder Rettung kommen zwei Leckerbissen dazu. Auch Kräuter kannst du verfüttern. Wähle das Futter und tippe auf ein Tier. Das bringt dir ❤️ <b>Ruf</b> bei diesem Tier. Lieblingsfutter (zum Beispiel 🥕 für den Hasen oder 🐟 für die Katze) und das Lieblingskraut zählen doppelt. Pro Tag mag jedes Tier bis zu drei Leckerbissen.</li>
      <li><b>Ruf-Stufen:</b> 🙈 Scheu → 👀 Neugierig (1 Herz) → 😊 Freundlich (3) → 💛 Vertraut (6) → 🌟 Beste Freunde (10). Deinen Ruf bei jedem Tier siehst du unten auf der Lichtung.</li>
      <li><b>Geschenke:</b> Bei 3 Herzen schenkt dir das Tier einen Samen, bei 6 Herzen einen seltenen Samen, und bei 10 Herzen seid ihr beste Freunde 🌟 und du bekommst einen Herztrank.</li>
      <li><b>🧹 Aufräum-Spiel:</b> Jeden Tag weht der Wind Laub, Steine und Federn auf die Lichtung. Tippe auf ein Ding und dann auf den richtigen Korb: 🪣 Kompost (Laub, Blätter, Apfelreste), 🪨 Steinhaufen (Steine, Zapfen, Stöcke) oder 🪺 Nestkiste (Federn, Wolle, Fäden). Du hast 40 Sekunden. Drei richtige hintereinander geben Bonuspunkte, falsch sortieren kostet 3 Sekunden. Einmal am Tag gibt es Futter und Samen, und ab 12 Punkten +1 Ruf bei allen Tieren.</li>
      <li><b>Schmücken:</b> Blumen, Pilze, Laternen, ein Brunnen, ein Tierhäuschen und sogar ein Regenbogen. Du bezahlst mit Kräutern, egal welchen. Mit ↩️ nimmst du Schmuck wieder weg und bekommst die Kräuter zurück.</li>
    </ul>
  </section>

  <section class="wk-sec" id="wk-koop"><h2>🤝 Koop</h2>
    <p>Im Koop spielt ihr zu zweit oder zu dritt auf <b>einem</b> Spielfeld. Wer das Spiel erstellt, bekommt einen Spielcode und gibt ihn weiter.</p>
    <ul class="wk-tip">
      <li><b>Wer steuert wen?</b> Vor dem Start tippst du bei jedem Begleiter an, wer ihn steuert: du, Platz 1 oder Platz 2. Jeder Mitspieler braucht mindestens einen Begleiter. Deine Einteilung merkt sich das Spiel.</li>
      <li><b>💬 Chat:</b> Im Ort gibt es den Knopf <b>💬 Chat</b> für alle Spieler. Im Koop gibt es zusätzlich oben neben dem Musik-Knopf einen 💬-Knopf für ein kleines Chatfenster. Dort könnt ihr euch richtig schreiben. Neue Nachrichten zeigt ein roter Punkt und eine kurze Sprechblase.</li>
      <li><b>💬 Zurufe:</b> Unter dem Spielfeld gibt es Knöpfe wie 👍, ❤️, „❓ Was jetzt?“, „⏳ Warte kurz!“, „👉 Du bist dran!“ und „🎉 Super!“. Sie erscheinen bei allen als Sprechblase über dem Spielfeld.</li>
      <li><b>⏳ Gegen die Uhr:</b> Setz beim Erstellen den Haken. Zu zweit habt ihr 150 Sekunden, zu dritt 180. Schafft ihr es, landet eure Zeit in der <b>🏆 Koop-Bestenliste</b>. Mit Gold gibt es zusätzlich einen seltenen Samen.</li>
      <li>👀 <b>Wer ist da?</b> Über dem Spielfeld siehst du alle Mitspieler. 🟢 heißt: gerade im Spiel. Ihre Symbole laufen neben deiner Laterne mit.</li>
      <li>🔄 <b>Wiedereinstieg:</b> Lädst du die Seite neu oder fliegst kurz raus, kommst du automatisch zurück in euer Spiel. Bricht die Verbindung ab, verbindet sich das Spiel von selbst neu. Tippst du selbst auf „Zurück“, verlässt du das Spiel ganz.</li>
    </ul>
  </section>

  <section class="wk-sec" id="wk-geheim"><h2>Geheimstädte</h2>
    <p>Jeder Ort hat drei Geheimaufgaben. Eine ist immer, alle Tiere dort zu retten. Die anderen sind zum Beispiel ein Abenteuer ohne verlorenes Herz, Kräuter ernten oder Tränke brauen, während du dort bist.</p>
    <p>Sind alle drei erfüllt, öffnet sich die Geheimstadt des Ortes. Sie ist freiwillig und <b>richtig schwer</b>: fast jedes Feld ist ein Hindernis, und die Runenreihen sind lang. Beim ersten Sieg findest du ein seltenes Rezept, bei jedem Sieg seltene Samen.</p>
  </section>

  <section class="wk-sec" id="wk-garten"><h2>Kräutergarten</h2>
    <p>So arbeitest du im Beet:</p>
    <ul class="wk-tip">
      <li>🪏 <b>Umgraben:</b> Feste Erde musst du zuerst auflockern. Nach jeder Ernte ist die Erde wieder fest.</li>
      <li>🌱 <b>Pflanzen:</b> Wähle unten einen Samen und tippe auf die lockere Erde.</li>
      <li>💧 <b>Gießen:</b> Dreimal gießen. Aus dem Keimling wird ein Pflänzchen, dann eine Knospe, dann blüht das Kraut.</li>
      <li>✋ <b>Unkraut</b> und 👋 <b>Schnecken:</b> Nach dem Gießen kann Unkraut wachsen oder eine Schnecke auftauchen. Dann musst du sie zuerst wegschaffen, bevor du wieder gießen kannst. Manchmal hängt im Unkraut sogar ein Samen.</li>
      <li>💎 <b>Diamanten:</b> Sie liegen manchmal funkelnd auf dem Weg in Abenteuern (in Geheimstädten, Irrgärten und im Nebelnetz öfter). Außerdem gibt es sie manchmal bei Rettungen, beim Ernten, im Kräuterkorb, beim Aufräumen, für das Tagesrätsel, für Festtiere und für große Siege.</li>
      <li>🔮 <b>Zeit verhexen:</b> Tippe im Hexenhaus auf die Uhr. Für 5 💎 machst du aus Tag Nacht oder aus Nacht Tag, 30 Minuten lang. Das geht in beide Richtungen, auch wenn die Zeit gerade schon verhext ist. So kannst du Nacht- oder Tagkräuter gießen, wann du willst.</li>
      <li>🕰️ <b>Uhr:</b> Im Hexenhaus zeigt eine Uhr die Spielzeit und wie lange es noch bis zur Nacht oder zum Morgen dauert. Die Spielzeit ist die echte Uhrzeit.</li>
      <li>🌙☀️ <b>Tag und Nacht:</b> Manche Kräuter wachsen nur nachts (🌙 Mondkraut, Mondtulpe, Glühpilz, Sternmoos), andere nur am Tag (☀️ Sonnenkraut, Feuerblüte, Kirschblüte). Es zählt die echte Uhrzeit: Nacht ist von 19 bis 7 Uhr. Pflanzen kannst du jederzeit, aber gießen nur, wenn das Kraut wach ist. Alle anderen Kräuter wachsen immer.</li>
      <li>🧺 <b>Ernten:</b> Du bekommst zwei Kräuter. Nur ab und zu (20 %) schenkt dir die Pflanze auch einen neuen Samen.</li>
    </ul>
    <p>Es gibt keine Wartezeit, alles geht sofort.</p>
    <p><b>So erkennst du deine Beete:</b> Helle, rissige Erde ist fest und muss umgegraben werden. Dunkle, gefurchte Erde ist locker und bereit zum Pflanzen. Nach dem Gießen glänzt sie nass. Ein <b>goldener Rand</b> heißt „reif, bitte ernten“, ein <b>oranger Rand</b> heißt „Unkraut oder Schnecke, bitte kümmern“.</p>
    <p>Garten und Alchemietisch sind zwei eigene Seiten. Oben rechts kommst du mit einem Knopf direkt vom einen zum anderen.</p>
    <p><b>Samen bekommen:</b> Nach jeder Rettung gibt es einen zufälligen Samen, manchmal sogar einen seltenen. Samen sind kostbar, geh sparsam mit ihnen um! In manchen Abenteuern leuchtet ein seltener 🌱 Samenfund auf dem Weg. Lauf einfach drüber. Zum Farmen gibt es den Reiter <b>🌿 Kräuter</b> mit dem kurzen und dem langen Kräuterpfad, dort liegen immer mehrere Samenfunde. Sie werden bei jedem Besuch neu verteilt, auch in Abenteuern, die du schon geschafft hast.</p>
    <div class="wk-list">${Object.values(HERBS).map(hb => row(hb.ic, hb.nm + (hb.rare ? ' <small class="rare">selten</small>' : ""), hb.from)).join("")}</div>
  </section>

  <section class="wk-sec" id="wk-alch"><h2>Alchemietisch</h2>
    <p>Am Alchemietisch braust du aus Kräutern Tränke. Neben jedem Rezept steht, wie viele du davon schon im Vorrat hast (🧪). Im Abenteuer trinkst du sie über die Tränke-Leiste. <b>Pro Abenteuer kannst du höchstens 2 Tränke trinken</b>, wähle also gut aus.</p>
    ${[["Einfache Rezepte", false], ["Seltene Rezepte", true]].map(([title, rare]) => `
    <h3>${title}</h3>
    ${rare ? "<p>Seltene Rezepte findest du in Geheimstädten: bei jedem ersten Sieg dort ein neues, in der Reihenfolge dieser Tabelle.</p>" : ""}
    <div class="wk-table"><table>
      <thead><tr><th>Trank und Wirkung</th><th>Zutaten</th></tr></thead>
      <tbody>${(rare ? RARE_ORDER : BASIC_RECIPES).map(id => { const p = POTIONS[id], known = H.recipes.includes(id); return `<tr>
        <td><span class="tn">${p.ic} ${p.nm}</span>${rare ? ` <small class="${known ? "ok" : "rare"}">${known ? "✓ bekannt" : "🔒 noch nicht gefunden"}</small>` : ""}<br><span class="te">${p.eff}</span></td>
        <td>${Object.entries(p.need).map(([h, n]) => `${n}× ${HERBS[h].ic} ${HERBS[h].nm}`).join("<br>")}</td></tr>`; }).join("")}</tbody>
    </table></div>`).join("")}
  </section>`;
}
