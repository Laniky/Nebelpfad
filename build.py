"""Baut Nebelpfad aus den Teilen in src/ zusammen.

  python3 build.py

Ergebnis:
  index.html            die Webseite (GitHub Pages) mit Firebase und App-Funktion
  build/nebelpfad.html  die Version für die Claude-Spielseite (Artifact)
"""
import glob, os

HERE = os.path.dirname(os.path.abspath(__file__))
def rd(p): return open(os.path.join(HERE, p), encoding="utf-8").read()

js = "".join(rd(os.path.relpath(f, HERE)) for f in sorted(glob.glob(os.path.join(HERE, "src/spiel/*.js"))))
game = rd("src/kopf.html") + "<style>\n" + rd("src/stil.css") + "</style>\n" + rd("src/seite.html") + "<script>\n" + js + "</script>" + rd("src/fuss.html")
os.makedirs(os.path.join(HERE, "build"), exist_ok=True)
open(os.path.join(HERE, "build/nebelpfad.html"), "w", encoding="utf-8").write(game)

# ---- Webseite ----
cfg = '{apiKey:"AIzaSyBwnT7BI0mH7u1yA8agQ0cqAl5fvtC2z1o",authDomain:"nebelpfad-8feed.firebaseapp.com",databaseURL:"https://nebelpfad-8feed-default-rtdb.europe-west1.firebasedatabase.app",projectId:"nebelpfad-8feed",storageBucket:"nebelpfad-8feed.firebasestorage.app",messagingSenderId:"120999948818",appId:"1:120999948818:web:e1577a4e01882ba48fdecb"}'
v = "10.12.2"
desc = "Ein gemütliches Märchen-Abenteuer: Rette verzauberte Tiere mit deinen Begleitern, allein oder zusammen im Koop."
head = ('<!doctype html><html lang="de"><head><meta charset="utf-8">'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
        '<meta name="theme-color" content="#0f1420">'
        f'<meta name="description" content="{desc}"><meta property="og:title" content="Nebelpfad"><meta property="og:description" content="{desc}">'
        '<meta property="og:type" content="website"><meta property="og:url" content="https://laniky.github.io/Nebelpfad/">'
        '<meta property="og:image" content="https://laniky.github.io/Nebelpfad/icons/icon-512.png">'
        '<link rel="manifest" href="manifest.webmanifest"><link rel="icon" href="icons/icon-192.png">'
        '<link rel="apple-touch-icon" href="icons/apple-touch-icon.png"><meta name="apple-mobile-web-app-capable" content="yes">'
        '<meta name="apple-mobile-web-app-title" content="Nebelpfad">'
        '<style>*,*::before,*::after{box-sizing:border-box}:root{color-scheme:dark;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}'
        'body{margin:0;font:14px system-ui,sans-serif}img{max-width:100%}[hidden]{display:none!important}</style>'
        + "".join(f'<script src="https://www.gstatic.com/firebasejs/{v}/firebase-{m}-compat.js"></script>' for m in ("app", "auth", "database"))
        + "<script>window.NP_FB_CONFIG=" + cfg + ";</script></head><body>")
sw = '<script>if("serviceWorker" in navigator)addEventListener("load",()=>navigator.serviceWorker.register("sw.js").catch(()=>{}));</script>'
s = game.replace("Der Koop-Modus braucht die Spielseite auf claude.ai und eine Anmeldung.", "Koop braucht eine Internetverbindung.")
s = s.replace("Mitspieler suchen geht nur in der geteilten Spielseite auf claude.ai.", "Dungeonbrowser, Freunde und Chat gibt es im Moment nur in der Claude-Version. Auf dieser Webseite kommen sie bald dazu.")
open(os.path.join(HERE, "index.html"), "w", encoding="utf-8").write(head + s + sw + "</body></html>")
print("fertig: index.html und build/nebelpfad.html")
