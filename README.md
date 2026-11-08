# Nebelpfad

Ein gemütliches Märchen-Abenteuer: Rette verzauberte Tiere mit deinen Begleitern, allein oder zusammen im Koop.

**Spielen:** https://laniky.github.io/Nebelpfad/

## Aufbau

Das Spiel ist in Teile aufgeteilt, damit man Dinge leichter findet:

| Ordner / Datei | Inhalt |
| --- | --- |
| `src/kopf.html` | Titel und Schriftarten |
| `src/stil.css` | Aussehen (Farben, Abstände, Animationen) |
| `src/seite.html` | Alle Seiten des Spiels (Ort, Dungeon, Hexenhaus, Wiki …) |
| `src/spiel/01-…17-*.js` | Die Spiellogik, nach Themen sortiert (Dungeon, Musik, Feste, Koop …) |
| `build.py` | Setzt alle Teile zu einer Datei zusammen |
| `index.html` | Fertige Webseite (wird von `build.py` erzeugt, nicht von Hand ändern) |
| `manifest.webmanifest`, `sw.js`, `icons/` | Damit man Nebelpfad als App auf den Startbildschirm legen kann |
| `ALEX.md` | Anleitung, wie eine KI im Koop mitspielen kann |

## Ändern und bauen

1. Die passende Datei in `src/` ändern.
2. `python3 build.py` ausführen.
3. `index.html` hochladen (committen und pushen). GitHub Pages zeigt die neue Version nach ein, zwei Minuten.
