import { isJester, rank, suit, value, total, GLYPH } from "./cards.js";

/**
 * Aperçu INDICATIF d’un coup (le serveur fait foi). Reprend les règles du moteur :
 * validation du jeu, immunité de l’ennemi, doublement ♣, protection ♠.
 * @returns {{ error: string|null, total: number, damage: number, effects: string[] }}
 */
export function preview(view, sel) {
  const out = { error: null, total: total(sel), damage: 0, effects: [] };
  if (!sel.length) return out;
  const e = view.enemy;
  if (sel.some(isJester)) {
    if (sel.length > 1) out.error = "Le Bouffon se joue seul.";
    else out.effects.push("Immunité de l’ennemi annulée");
    return out;
  }
  const aces = sel.filter((c) => rank(c) === "A"), others = sel.filter((c) => rank(c) !== "A");
  if (aces.length > 1) out.error = "Un seul Compagnon animal (As) par jeu.";
  else if (others.length > 1) {
    if (others.some((c) => rank(c) !== rank(others[0]))) out.error = "Un combo doit réunir des cartes de même valeur.";
    else if (!["2", "3", "4", "5"].includes(rank(others[0])) || total(others) > 10) out.error = "Combo : cartes 2 à 5 de même valeur, total ≤ 10.";
  }
  const active = (s) => sel.some((c) => suit(c) === s) && (e.jest || suit(e.c) !== s);
  const blocked = (s) => sel.some((c) => suit(c) === s) && !active(s);
  out.damage = out.total;
  if (active("C")) { out.damage *= 2; out.effects.push("Coup doublé"); }
  if (active("S")) out.effects.push(`Riposte −${out.total}`);
  if (active("H")) out.effects.push(`${out.total} cartes remises sous la pioche`);
  if (active("D")) out.effects.push(`${out.total} cartes piochées par l’équipe`);
  for (const s of "HDCS") if (blocked(s)) out.effects.push(`${GLYPH[s]} sans effet : l’ennemi est immunisé`);
  return out;
}
