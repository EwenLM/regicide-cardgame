/**
 * Utilitaires de cartes. Une carte est une chaîne « rang + couleur » : 7H, 10D, KS, AC.
 * Les Bouffons sont X1, X2. Même encodage que le serveur (voir docs/PROTOCOL.md).
 */
export const GLYPH = { H: "♥", D: "♦", C: "♣", S: "♠" };
export const SUIT_NAME = { H: "cœur", D: "carreau", C: "trèfle", S: "pique" };
export const rank = (c) => c.slice(0, -1);
export const suit = (c) => c.slice(-1);
export const isJester = (c) => c[0] === "X";
export const isRoyal = (c) => !isJester(c) && "JQK".includes(rank(c));
export const value = (c) => (isJester(c) ? 0 : { A: 1, J: 10, Q: 15, K: 20 }[rank(c)] ?? +rank(c));
export const maxHp = (c) => ({ J: 20, Q: 30, K: 40 })[rank(c)];
export const attack = (c) => ({ J: 10, Q: 15, K: 20 })[rank(c)];
export const total = (cards) => cards.reduce((s, c) => s + value(c), 0);
const ROYAL_NAME = { J: "Valet", Q: "Dame", K: "Roi" };
const DE = { H: "de cœur", D: "de carreau", C: "de trèfle", S: "de pique" };
export const royalName = (c) => `${ROYAL_NAME[rank(c)]} ${DE[suit(c)]}`;
/** Tri d’affichage de la main : par couleur puis par valeur. */
export const byOrder = (a, b) => key(a) - key(b);
const key = (c) => (isJester(c) ? 999 : "HDCS".indexOf(suit(c)) * 100 + value(c));
