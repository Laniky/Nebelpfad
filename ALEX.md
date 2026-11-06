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
