/**
 * État partagé du front + client WebSocket.
 * `g` est un objet réactif (runes Svelte 5) : les composants le lisent directement.
 * Le serveur est la seule autorité : ce module envoie des intentions et affiche l’état reçu.
 */
const ls = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch { /* stockage indisponible */ } },
};
let token = ls.get("viva_token");
if (!token) { token = crypto.randomUUID?.() ?? String(Math.random()).slice(2) + Date.now(); ls.set("viva_token", token); }

export const g = $state({
  online: false,
  view: null,          // dernier état reçu du serveur (voir docs/PROTOCOL.md)
  note: "",            // message d’erreur ou d’information
  sel: [],             // cartes sélectionnées dans la main
  rules: false,        // fenêtre des règles ouverte
  name: ls.get("viva_name") ?? "",
});

let ws, retry = 0;

export function connect() {
  ws = new WebSocket(`${location.protocol === "https:" ? "wss" : "ws"}://${location.host}/ws`);
  ws.onopen = () => {
    g.online = true; retry = 0;
    const code = ls.get("viva_room");          // reconnexion automatique à sa place
    if (code) send({ t: "join", code, name: g.name || "Joueur", token });
  };
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.t === "state") { g.view = m; g.note = ""; ls.set("viva_room", m.code); g.sel = g.sel.filter((c) => m.hand.includes(c)); }
    else if (m.t === "err") { g.note = m.msg; if (/introuvable|commencée/.test(m.msg)) { ls.set("viva_room", null); g.view = null; } }
    else if (m.t === "closed") { g.view = null; g.sel = []; ls.set("viva_room", null); g.note = m.msg; }
  };
  ws.onclose = () => { g.online = false; setTimeout(connect, Math.min(5000, 500 * 2 ** retry++)); };
}

const send = (o) => ws?.readyState === 1 && ws.send(JSON.stringify(o));
const setName = (n) => { g.name = n.trim(); ls.set("viva_name", g.name); return g.name; };

export function create(name) {
  if (!setName(name)) return (g.note = "Entrez un pseudo.");
  send({ t: "create", name: g.name, token });
}
export function join(code, name) {
  const c = code.trim().toUpperCase();
  if (!setName(name) || c.length !== 4) return (g.note = "Un pseudo et un code à 4 lettres sont nécessaires.");
  send({ t: "join", code: c, name: g.name, token });
}
export function leave() { send({ t: "leave" }); g.view = null; g.sel = []; ls.set("viva_room", null); }
/** Envoie une action de jeu (start, play, yield, discard, pick, again) et vide la sélection. */
export function act(t, extra = {}) { send({ t, ...extra }); g.sel = []; }
export function toggle(card) {
  const v = g.view;
  if (!v || v.players[v.turn].pid !== v.you || !["play", "discard"].includes(v.phase)) return;
  g.sel = g.sel.includes(card) ? g.sel.filter((c) => c !== card) : [...g.sel, card];
}
