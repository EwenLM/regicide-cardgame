<script>
  /**
   * Une carte. Sans `onclick` : <article> décoratif. Avec `onclick` : <button> accessible.
   * Thème de couleur : attribut data-suit (voir tokens.css). Aucune classe.
   */
  import { rank, suit, isJester, isRoyal, GLYPH, SUIT_NAME } from "../lib/cards.js";
  import Royal from "./Royal.svelte";
  let { card = null, back = false, selected = false, big = false, onclick = null } = $props();
  const jester = $derived(card && isJester(card));
  const label = $derived(back ? "Carte face cachée" : jester ? "Bouffon" : `${rank(card)} de ${SUIT_NAME[suit(card)]}`);
</script>

<svelte:element
  this={onclick ? "button" : "article"}
  data-card data-back={back || null} data-selected={selected || null} data-big={big || null}
  data-suit={back || jester ? null : suit(card)} data-royal={card && isRoyal(card) || null}
  aria-label={label} aria-pressed={onclick ? selected : null} {onclick}
>
  {#if !back}
    <header><b>{jester ? "★" : rank(card)}</b><span aria-hidden="true">{jester ? "" : GLYPH[suit(card)]}</span></header>
    {#if isRoyal(card)}<figure><Royal rank={rank(card)} /></figure>
    {:else}<p aria-hidden="true">{jester ? "🃏" : GLYPH[suit(card)]}</p>{/if}
  {/if}
</svelte:element>

<style>
  [data-card] {
    --w: var(--card-w, 64px); position: relative; display: block; flex: none; padding: 0; margin: 0;
    width: var(--w); aspect-ratio: 5 / 7; background: var(--craie); color: var(--suit, var(--encre));
    border: var(--bord); box-shadow: var(--relief); text-align: left; overflow: hidden;
  }
  [data-card][data-big] { --w: 150px; }
  header { position: absolute; inset: 4px auto auto 5px; display: grid; justify-items: center; line-height: 1; font: 700 calc(var(--w) * .26) var(--f-display); z-index: 1; }
  header span { font-size: .8em; }
  p { position: absolute; inset: 0; display: grid; place-items: center; margin: 0; font-size: calc(var(--w) * .55); line-height: 1; max-width: none; }
  figure { position: absolute; inset: 0 0 0 0; margin: 0; }
  [data-royal] header { background: var(--craie); padding: 2px 3px; border: 2px solid var(--encre); inset: 4px auto auto 4px; }
  /* Dos de carte : motif cobalt à étoile, comme sur les maquettes */
  [data-back] {
    background: var(--cobalt) radial-gradient(circle at 50% 50%, var(--soufre) 0 14%, transparent 15%);
    background-image: repeating-linear-gradient(45deg, transparent 0 7px, #0003 7px 9px), radial-gradient(circle, var(--soufre) 0 12%, transparent 13%);
  }
  button[data-card] { cursor: pointer; transition: transform .1s, box-shadow .1s; }
  button[data-card]:hover { transform: translateY(-8px); }
  button[data-card][data-selected] { transform: translateY(-20px); box-shadow: 6px 6px 0 var(--encre); background: var(--soufre); }
  button[data-card][data-selected] header { background: transparent; }
</style>
