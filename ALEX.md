# Nebelpfad Koop: Anleitung für KI-Mitspieler (z. B. Alex)

Ein Koop-Spiel liegt in der Firebase Realtime Database unter `coop/<SPIELCODE>`.
Der Spieler, der das Spiel erstellt, führt das Spiel. Der Mitspieler steuert **Luna (licht)**, **Holm (bau)** und **Ole (otter)**
und schickt seine Züge in das Feld `claude`.

## 1. Anmelden (anonym, einmal pro Stunde)

```
POST https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=AIzaSyBwnT7BI0mH7u1yA8agQ0cqAl5fvtC2z1o
Content-Type: application/json

{"returnSecureToken": true}
```

Die Antwort enthält `idToken` (1 Stunde gültig) und `refreshToken`.

## 2. Spielfeld lesen

```
GET https://nebelpfad-8feed-default-rtdb.europe-west1.firebasedatabase.app/coop/<SPIELCODE>.json?auth=<idToken>
```

Wichtige Felder:

| Feld | Bedeutung |
|---|---|
| `grid` | 10 Zeilen à 7 Zeichen, Zeile 0 ist oben |
| `pos` | `[x, y]` der Laterne (die Gruppe steht immer zusammen) |
| `stage` | Fortschritt bei mehrteiligen Feldern, Schlüssel `"x,y"` |
| `custom` | Begleiter-Reihenfolge für verwunschene Felder `Q`, Schlüssel `"x,y"` |
| `tries` | gemeinsame Herzen |
| `done` / `won` / `failed` | Spielende |
| `log` | die letzten Meldungen |
| `applied` / `result` | ID und Ergebnis des zuletzt ausgeführten Mitspieler-Zugs |

Zeichen im Spielfeld:

| Zeichen | Bedeutung | Wer hilft |
|---|---|---|
| `.` `B` `S` | frei (Weg, Brücke, Samenfund) | laufen |
| `#` `~` | Wand / tiefes Wasser | nicht begehbar |
| `T` | Dornenranken | Bruno (schutz) |
| `R` | Felsbrocken | Bruno (schutz) |
| `H` | Spurenfeld | Pip (spur) |
| `W` | Bach | **Holm (bau)** |
| `D` | Schattenwand | **Luna (licht)** |
| `G` | Hecke | Funke (fuchs) |
| `U` | Seerosenteich | **Ole (otter)** |
| `N` | Nebelwand | erst **Luna (licht)**, dann Pip (spur) |
| `X` | Sterntor | **Luna (licht)**, Pip (spur), **Holm (bau)** |
| `Q` | verwunschenes Feld | Reihenfolge in `custom["x,y"]`, aktueller Schritt = `stage["x,y"]` (Standard 0) |
| `A` `F` `O` `Z` | gefangenes Tier | Heilerin (heil) |

## 3. Einen Zug schicken

```
PATCH https://nebelpfad-8feed-default-rtdb.europe-west1.firebasedatabase.app/coop/<SPIELCODE>.json?auth=<idToken>
Content-Type: application/json

{"claude": {"id": "<immer eine neue, eindeutige ID>", "type": "use", "role": "licht", "dir": "right"}}
```

* `type`: `"use"` (Begleiter auf ein Hindernis anwenden) oder `"move"` (auf ein freies Feld laufen)
* `role`: nur bei `use`: `"licht"`, `"bau"` oder `"otter"`
* `dir`: `"up"`, `"down"`, `"left"`, `"right"`, immer von `pos` aus gesehen

Danach steht in `applied` die ID und in `result` das Ergebnis des Zugs.
Gut ist: nur ziehen, wenn das Feld neben `pos` einen eigenen Begleiter braucht, und vorher kurz warten,
ob sich `pos` noch ändert.

## Zu dritt spielen (Lani + Alex + Claude)

Lani wählt im Koop-Menü **„Zu dritt spielen“**. Dann steht im Spielstand `"size": 3` und es gibt zwei Plätze:

| Platz | Name im Spielstand | Züge schicken in | Begleiter | Antwort steht in |
|---|---|---|---|---|
| 1 | `partnerName` | `claude` | `claudeRoles` (Luna `licht`, Holm `bau`) | `applied` / `result` |
| 2 | `partner2Name` | `claude2` | `claude2Roles` (Pip `spur`, Ole `otter`) | `applied2` / `result2` |

Lani steuert Bruno (`schutz`), Funke (`fuchs`) und die Heilerin (`heil`).

**Alex nimmt Platz 1** – also alles genau wie bisher, nur mit weniger Begleitern. Lies immer `claudeRoles`, dort stehen deine.
Zum Anmelden einmal: `PATCH {"partnerName": "Alex"}`.

**Claude nimmt Platz 2:** `PATCH {"partner2Name": "Claude"}` und Züge als
`PATCH {"claude2": {"id": "...", "type": "use", "role": "otter", "dir": "right"}}`.

Wer dran ist: Steht neben der Laterne (`pos`) ein Hindernis, dessen nächster Schritt einen deiner Begleiter braucht, bist du dran.

## Weiter laufen (neu)

Ein Zug muss nicht mehr nur ein Feld weit gehen:

- `{"type": "move", "dir": "up", "run": true}` läuft in diese Richtung weiter, folgt Kurven im Gang und hält an der nächsten Abzweigung oder direkt vor dem nächsten Hindernis.
- `{"type": "move", "to": [x, y]}` läuft auf dem kürzesten freien Weg zu Feld x,y. Ist x,y ein Hindernis, hält die Gruppe direkt davor.
- Ohne `run` und `to` geht ein `move` wie bisher genau ein Feld.

Wo die Gruppe angekommen ist, steht danach in `pos` und in `result`.

## Zurufe, freie Begleiter und Zeit (neu)

- **Begleiter:** Lani kann vor dem Start frei einteilen, wer welchen Begleiter steuert. Lies deshalb immer `claudeRoles` (Platz 1) bzw. `claude2Roles` (Platz 2), dort stehen deine. Die volle Einteilung steht in `seats`.
- **Zurufe:** `PATCH {"shout_claude": {"id": "eindeutig", "e": "👍", "t": <Zeit in Millisekunden>}}` (Platz 2: `shout_claude2`). Erlaubt sind `👍`, `❤️`, `❓` (Was jetzt?), `⏳` (Warte kurz!), `👉` (Du bist dran!) und `🎉` (Super!). Lanis Zurufe stehen in `shout_host`.
- **Gegen die Uhr:** Wenn `level.timed` true ist, steht in `tLeft`, wie viele Sekunden noch übrig sind.
- Lanis Name steht in `hostName`.

## Chat im Koop (neu)

Nachrichten liegen in einer eigenen Liste neben dem Spielstand:

- Lesen: `GET .../coop/<SPIELCODE>-chat.json?auth=<idToken>` (jede Nachricht hat `n` = Name, `m` = Text, `t` = Zeit in Millisekunden)
- Schreiben: `POST .../coop/<SPIELCODE>-chat.json?auth=<idToken>` mit `{"n": "Alex", "m": "Hallo!", "t": <Zeit in Millisekunden>}`

## Allgemeiner Chat im Ort (neu)

Für alle Spieler, auch außerhalb eines Koop-Spiels:

- Lesen: `GET .../coop/WELTCHAT.json?auth=<idToken>`
- Schreiben: `POST .../coop/WELTCHAT.json?auth=<idToken>` mit `{"n": "Alex", "m": "Hallo!", "t": <Zeit in Millisekunden>}`

## Wer ist da? (neu)

Jeder Spieler schreibt alle 5 Sekunden einen Zeitstempel ins Spiel: `here_host`, `here_claude` oder `here_claude2` (Millisekunden, `Date.now()`). Daran sieht das Spiel, wer gerade da ist (🟢), und zeigt die Mitspieler neben der Laterne. Wenn du als KI mitspielst, schick bei jedem Zug einfach `here_<dein Platz>` mit, z. B. PATCH `{"here_claude": 1794100000000}`.
