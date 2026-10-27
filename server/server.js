"use strict";
const http = require("http"), fs = require("fs"), path = require("path"), crypto = require("crypto");
const { WebSocketServer } = require("ws");

// ---------- Configuration (variables d'environnement) ----------
const E = process.env, MIN = 60e3;
const PORT = +E.PORT || 3000;
const T = {
  lobby: (+E.LOBBY_TTL_MIN || 30) * MIN,   // salle d'attente inactive
  idle: (+E.IDLE_TTL_MIN || 120) * MIN,    // partie en cours sans aucune action
  empty: (+E.EMPTY_TTL_MIN || 10) * MIN,   // plus aucun joueur connecté
  done: (+E.DONE_TTL_MIN || 15) * MIN,     // partie terminée (victoire/défaite)
  away: (+E.AWAY_TURN_S || 90) * 1000,     // joueur déconnecté bloquant le tour
  sweep: (+E.SWEEP_S || 30) * 1000,
};
const MAX_ROOMS = +E.MAX_ROOMS || 300;

// ---------- Cartes ----------
const SUITS = "HDCS", HS = [8, 7, 6, 5];
const rk = c => c.slice(0, -1), su = c => c.slice(-1), isJ = c => c[0] === "X";
const val = c => isJ(c) ? 0 : ({ A: 1, J: 10, Q: 15, K: 20 })[rk(c)] || +rk(c);
const hp = c => ({ J: 20, Q: 30, K: 40 })[rk(c)], atk = c => ({ J: 10, Q: 15, K: 20 })[rk(c)];
const sum = a => a.reduce((x, c) => x + val(c), 0);
const shuf = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = crypto.randomInt(i + 1);[a[i], a[j]] = [a[j], a[i]]; } return a; };
const lbl = c => isJ(c) ? "Bouffon" : rk(c) + ({ H: "♥", D: "♦", C: "♣", S: "♠" })[su(c)];
const bad = m => { throw new Error(m); };

// ---------- Salles ----------
const rooms = new Map();
const now = () => Date.now();
const log = (r, m) => { r.log.push(m); if (r.log.length > 40) r.log.shift(); };

function newRoom(code, host) {
  return { code, host: host.pid, players: [host], phase: "lobby", tavern: [], discard: [], castle: [], enemy: null,
    turn: 0, yields: 0, pending: 0, fallen: [], log: [], created: now(), updated: now() };
}
function deal(r) {
  const n = r.players.length; let t = [];
  for (const s of SUITS) for (const x of ["A", 2, 3, 4, 5, 6, 7, 8, 9, 10]) t.push(x + s);
  for (let i = 1; i <= [2, 0, 1, 2][n - 1]; i++) t.push("X" + i);
  r.tavern = shuf(t); r.castle = [];
  for (const x of ["K", "Q", "J"]) r.castle.push(...shuf(["H", "D", "C", "S"].map(s => x + s)));
  r.players.forEach(p => p.hand = []);
  for (let k = 0; k < HS[n - 1]; k++) r.players.forEach(p => p.hand.push(r.tavern.pop()));
  Object.assign(r, { discard: [], enemy: { c: r.castle.pop(), dmg: 0, shield: 0, jest: false }, turn: 0, yields: 0, pending: 0, fallen: [], phase: "play", log: [] });
  log(r, "La partie commence !");
}
function valid(sel) {
  if (sel.some(isJ)) return sel.length === 1 ? null : "Le Bouffon se joue seul.";
  const A = sel.filter(c => rk(c) === "A"), O = sel.filter(c => rk(c) !== "A");
  if (A.length > 1) return "Un seul Compagnon animal (As) par jeu.";
  if (O.length > 1) {
    if (O.some(c => rk(c) !== rk(O[0]))) return "Un combo doit avoir des cartes de même valeur.";
    if (!["2", "3", "4", "5"].includes(rk(O[0])) || sum(O) > 10) return "Combo : cartes 2 à 5 de même valeur, total ≤ 10.";
  }
  return null;
}
function nextTurn(r) { r.turn = (r.turn + 1) % r.players.length; r.phase = "play"; r.pending = 0; }
function afterHit(r, p) {
  const need = Math.max(0, atk(r.enemy.c) - r.enemy.shield);
  if (need <= 0) return nextTurn(r);
  r.pending = need;
  if (sum(p.hand) < need) { r.phase = "lost"; log(r, `${p.name} ne peut pas encaisser ${need} dégâts. Défaite…`); }
  else { r.phase = "discard"; log(r, `${p.name} doit défausser ${need} points.`); }
}
function doPlay(r, p, sel) {
  const h = p.hand, e = r.enemy, n = r.players.length;
  sel.forEach(c => h.splice(h.indexOf(c), 1)); r.yields = 0;
  if (sel.length === 1 && isJ(sel[0])) {
    e.jest = true; r.discard.push(sel[0]); log(r, `${p.name} joue le Bouffon : immunité annulée.`);
    if (n === 1) { r.discard.push(...h.splice(0)); while (h.length < 8 && r.tavern.length) h.push(r.tavern.pop()); r.phase = "play"; }
    else r.phase = "jester";
    return;
  }
  const total = sum(sel), suits = [...new Set(sel.map(su))], eff = k => suits.includes(k) && (e.jest || su(e.c) !== k);
  let dmg = total; const fx = [];
  if (eff("H")) { r.discard = shuf(r.discard); const k = Math.min(total, r.discard.length); r.tavern.unshift(...r.discard.splice(0, k)); fx.push(`♥ ${k} cartes soignées`); }
  r.discard.push(...sel);
  if (eff("D")) {
    let k = total, d = 0;
    while (k > 0 && r.tavern.length) {
      let ok = false;
      for (let j = 0; j < n && k > 0 && r.tavern.length; j++) {
        const q = r.players[(r.turn + j) % n];
        if (q.hand.length < HS[n - 1]) { q.hand.push(r.tavern.pop()); k--; d++; ok = true; }
      }
      if (!ok) break;
    }
    fx.push(`♦ ${d} cartes piochées`);
  }
  if (eff("C")) { dmg *= 2; fx.push("♣ dégâts doublés"); }
  if (eff("S")) { e.shield += total; fx.push(`♠ attaque −${total}`); }
  e.dmg += dmg;
  log(r, `${p.name} joue ${sel.map(lbl).join(" ")} : ${dmg} dégâts${fx.length ? " (" + fx.join(", ") + ")" : ""}.`);
  if (e.dmg >= hp(e.c)) {
    const exact = e.dmg === hp(e.c); (exact ? r.tavern : r.discard).push(e.c);
    r.fallen.push(e.c);
    log(r, `${lbl(e.c)} est vaincu${exact ? " pile (carte sur la pioche)" : ""} !`);
    if (!r.castle.length) { r.phase = "won"; return log(r, "Les douze royaux sont tombés. Victoire !"); }
    r.enemy = { c: r.castle.pop(), dmg: 0, shield: 0, jest: false }; r.phase = "play";
  } else afterHit(r, p);
}
const canYield = r => r.yields < r.players.length - 1;
function doYield(r, p) { r.yields++; log(r, `${p.name} cède.`); afterHit(r, p); }
function doDiscard(r, p, sel) {
  sel.forEach(c => { p.hand.splice(p.hand.indexOf(c), 1); r.discard.push(c); });
  log(r, `${p.name} défausse ${sel.map(lbl).join(" ")}.`); nextTurn(r);
}

// ---------- Réseau ----------
const send = (ws, o) => { if (ws && ws.readyState === 1) ws.send(JSON.stringify(o)); };
function view(r, p) {
  return { t: "state", code: r.code, you: p.pid, phase: r.phase, host: r.host, turn: r.turn, yields: r.yields, pending: r.pending,
    players: r.players.map(q => ({ pid: q.pid, name: q.name, n: q.hand.length, on: !!q.ws })),
    fallen: r.fallen, tavernN: r.tavern.length, castleN: r.castle.length, discardN: r.discard.length, top: r.discard[r.discard.length - 1] || null,
    enemy: r.enemy, log: r.log.slice(-10), hand: p.hand };
}
function broadcast(r) { r.updated = now(); r.players.forEach(p => send(p.ws, view(r, p))); }
function closeRoom(r, msg) {
  r.players.forEach(p => { send(p.ws, { t: "closed", msg }); if (p.ws) p.ws.code = null; });
  rooms.delete(r.code);
}
function attach(ws, r, p) {
  if (p.ws && p.ws !== ws) { p.ws.code = null; send(p.ws, { t: "closed", msg: "Connecté depuis un autre onglet." }); }
  p.ws = ws; p.seen = now(); ws.code = r.code;
}
const cleanName = s => typeof s === "string" ? s.trim().slice(0, 14) : "";
const okToken = s => typeof s === "string" && s.length >= 8 && s.length <= 64;
const getCards = (m, p) => {
  const a = m.cards; if (!Array.isArray(a) || !a.length || a.length > 10) bad("Choisissez des cartes.");
  if (new Set(a).size !== a.length || a.some(c => typeof c !== "string" || !p.hand.includes(c))) bad("Cartes invalides.");
  return a;
};
function handle(ws, m) {
  if (m.t === "create") {
    const name = cleanName(m.name); if (!name || !okToken(m.token)) bad("Pseudo requis.");
    if (rooms.size >= MAX_ROOMS) bad("Serveur plein, réessayez plus tard.");
    let code; do { code = Array.from({ length: 4 }, () => "ABCDEFGHJKLMNPQRSTUVWXYZ"[crypto.randomInt(24)]).join(""); } while (rooms.has(code));
    const p = { pid: crypto.randomBytes(4).toString("hex"), token: m.token, name, ws: null, hand: [], seen: now() };
    const r = newRoom(code, p); rooms.set(code, r); attach(ws, r, p); return broadcast(r);
  }
  if (m.t === "join") {
    const r = rooms.get(String(m.code || "").toUpperCase()); if (!r) bad("Salle introuvable.");
    if (!okToken(m.token)) bad("Jeton invalide.");
    let p = r.players.find(x => x.token === m.token);
    if (!p) {
      const name = cleanName(m.name); if (!name) bad("Pseudo requis.");
      if (r.phase !== "lobby") bad("Partie déjà commencée."); if (r.players.length >= 4) bad("Salle pleine (4 max).");
      p = { pid: crypto.randomBytes(4).toString("hex"), token: m.token, name, ws: null, hand: [], seen: now() }; r.players.push(p);
    }
    attach(ws, r, p); return broadcast(r);
  }
  const r = rooms.get(ws.code); if (!r) bad("Vous n’êtes dans aucune salle.");
  const p = r.players.find(x => x.ws === ws); if (!p) bad("Joueur inconnu.");
  p.seen = now();
  const mine = r.players[r.turn] === p;
  switch (m.t) {
    case "leave":
      ws.code = null; p.ws = null;
      if (r.phase === "lobby") { r.players = r.players.filter(x => x !== p); if (!r.players.length) return rooms.delete(r.code); if (r.host === p.pid) r.host = r.players[0].pid; }
      return broadcast(r);
    case "start":
      if (r.host !== p.pid || r.phase !== "lobby") bad("Seul l’hôte peut lancer la partie."); deal(r); break;
    case "again":
      if (r.host !== p.pid || !["won", "lost"].includes(r.phase)) bad("Action impossible."); r.phase = "lobby"; r.players.forEach(q => q.hand = []); break;
    case "play": { if (!mine || r.phase !== "play") bad("Ce n’est pas votre tour.");
      const sel = getCards(m, p), e = valid(sel); if (e) bad(e); doPlay(r, p, sel); break; }
    case "yield":
      if (!mine || r.phase !== "play") bad("Ce n’est pas votre tour.");
      if (!canYield(r)) bad("Vous ne pouvez pas céder : tous les autres viennent de le faire."); doYield(r, p); break;
    case "discard": { if (!mine || r.phase !== "discard") bad("Rien à défausser.");
      const sel = getCards(m, p); if (sum(sel) < r.pending) bad(`Il faut défausser au moins ${r.pending} points (sélection : ${sum(sel)}).`); doDiscard(r, p, sel); break; }
    case "pick": { if (!mine || r.phase !== "jester") bad("Action impossible.");
      const i = m.i | 0; if (i < 0 || i >= r.players.length) bad("Joueur invalide.");
      r.turn = i; r.phase = "play"; log(r, `${r.players[i].name} jouera ensuite.`); break; }
    default: bad("Message inconnu.");
  }
  broadcast(r);
}

// ---------- Nettoyage ----------
// Un joueur absent qui bloque le tour est remplacé par un coup automatique prudent.
function autoAct(r) {
  const p = r.players[r.turn];
  if (!p || p.ws || now() - p.seen < T.away) return false;
  log(r, `${p.name} est absent : coup automatique.`);
  if (r.phase === "play") { if (canYield(r) || !p.hand.length) doYield(r, p); else doPlay(r, p, [p.hand[0]]); }
  else if (r.phase === "discard") {
    const sel = []; let s = 0;
    for (const c of p.hand.slice().sort((a, b) => val(b) - val(a))) { if (s >= r.pending) break; sel.push(c); s += val(c); }
    doDiscard(r, p, sel);
  } else if (r.phase === "jester") { r.turn = (r.turn + 1) % r.players.length; r.phase = "play"; }
  p.seen = now() - T.away + 15e3; // laisse un délai avant le prochain coup automatique
  return true;
}
function sweep() {
  const t = now();
  for (const r of [...rooms.values()]) {
    r.players.forEach(p => { if (p.ws) p.seen = t; });
    const lastSeen = Math.max(...r.players.map(p => p.seen)), idle = t - r.updated, nobody = !r.players.some(p => p.ws);
    let why = null;
    if (nobody && t - lastSeen > T.empty) why = "Salle fermée : plus aucun joueur connecté.";
    else if (r.phase === "lobby" && idle > T.lobby) why = "Salle fermée : inactive trop longtemps.";
    else if (["won", "lost"].includes(r.phase) && idle > T.done) why = "Partie terminée : salle fermée.";
    else if (idle > T.idle) why = "Partie abandonnée : salle fermée.";
    if (why) { closeRoom(r, why); continue; }
    if (["play", "discard", "jester"].includes(r.phase) && autoAct(r)) broadcast(r);
  }
}
setInterval(sweep, T.sweep).unref();

// ---------- HTTP + WebSocket ----------
const STATIC = path.resolve(E.STATIC_DIR || path.join(__dirname, "..", "web", "dist"));
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".woff2": "font/woff2", ".woff": "font/woff", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon", ".json": "application/json" };
const HEADERS = { "x-content-type-options": "nosniff", "referrer-policy": "no-referrer",
  "content-security-policy": "default-src 'self'; connect-src 'self' ws: wss:; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-ancestors 'none'" };
function serveFile(res, file, immutable) {
  const stream = fs.createReadStream(file);
  stream.on("open", () => { res.writeHead(200, { ...HEADERS, "content-type": MIME[path.extname(file)] || "application/octet-stream", "cache-control": immutable ? "public, max-age=31536000, immutable" : "no-cache" }); stream.pipe(res); });
  stream.on("error", () => { res.writeHead(404, HEADERS); res.end("Not found"); });
}
const server = http.createServer((req, res) => {
  let p; try { p = decodeURIComponent(req.url.split("?")[0]); } catch { res.writeHead(400); return res.end(); }
  if (p === "/healthz") { res.writeHead(200, { "content-type": "application/json" }); return res.end(JSON.stringify({ ok: true, rooms: rooms.size })); }
  const file = path.join(STATIC, p === "/" ? "index.html" : p);
  if (!file.startsWith(STATIC + path.sep)) { res.writeHead(403); return res.end(); }  // anti path-traversal
  fs.stat(file, (err, st) => err || !st.isFile()
    ? (path.extname(p) ? (res.writeHead(404, HEADERS), res.end("Not found")) : serveFile(res, path.join(STATIC, "index.html"), false))
    : serveFile(res, file, p.startsWith("/assets/")));
});
const wss = new WebSocketServer({ server, path: "/ws", maxPayload: 2048 });
wss.on("connection", ws => {
  ws.alive = true; ws.msgs = 0; ws.code = null;
  ws.on("pong", () => ws.alive = true);
  ws.on("message", raw => {
    if (++ws.msgs > 40) return ws.close(1008, "rate limit");
    let m; try { m = JSON.parse(raw); } catch { return; }
    try { handle(ws, m); } catch (e) { send(ws, { t: "err", msg: e.message }); }
  });
  ws.on("close", () => {
    const r = rooms.get(ws.code); if (!r) return;
    const p = r.players.find(x => x.ws === ws); if (p) { p.ws = null; p.seen = now(); }
    broadcast(r);
  });
});
setInterval(() => wss.clients.forEach(w => { if (!w.alive) return w.terminate(); w.alive = false; w.ping(); }), 30e3).unref();
setInterval(() => wss.clients.forEach(w => w.msgs = 0), 10e3).unref();
server.listen(PORT, () => console.log(`Régicide en écoute sur :${PORT}`));
process.on("SIGTERM", () => { wss.clients.forEach(w => w.close(1001)); server.close(() => process.exit(0)); });
