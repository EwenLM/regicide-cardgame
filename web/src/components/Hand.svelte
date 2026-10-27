<script>
  /** Votre main + barre d’action (aperçu des dégâts, jouer, céder, défausser, choix du suivant après un Bouffon). */
  import { g, act, toggle } from "../lib/game.svelte.js";
  import { byOrder, total } from "../lib/cards.js";
  import { preview } from "../lib/preview.js";
  import Card from "./Card.svelte";
  const v = $derived(g.view);
  const mine = $derived(v.players[v.turn].pid === v.you);
  const cards = $derived(v.hand.toSorted(byOrder));
  const pv = $derived(preview(v, g.sel));
  const canYield = $derived(v.yields < v.players.length - 1);
  const enough = $derived(total(g.sel) >= v.pending);
</script>

<section aria-labelledby="main">
  <header><h2 id="main">Votre main</h2><small>{cards.length} cartes · {g.sel.length} sélectionnée{g.sel.length > 1 ? "s" : ""}</small></header>

  <ul aria-label="Cartes en main" data-live={mine && ["play", "discard"].includes(v.phase) || null}>
    {#each cards as c (c)}
      <li><Card card={c} selected={g.sel.includes(c)} onclick={() => toggle(c)} /></li>
    {:else}<li><small>Main vide</small></li>{/each}
  </ul>

  <aside data-panel data-tone="soufre" aria-live="polite">
    {#if v.phase === "won" || v.phase === "lost"}
      <p>La partie est terminée.</p>
    {:else if !mine}
      <p><strong>{v.players[v.turn].name}</strong> joue. Préparez la suite.</p>
    {:else if v.phase === "play"}
      <small>Votre attaque</small>
      <p data-big>{pv.damage} dégâts</p>
      {#if pv.error}<p role="alert" data-error>{pv.error}</p>{:else if pv.effects.length}<p>{pv.effects.join(" · ")}</p>{:else}<p>Sélectionnez des cartes pour frapper.</p>{/if}
      <button data-variant="ink" disabled={!g.sel.length || !!pv.error} onclick={() => act("play", { cards: g.sel })}>Jouer la sélection →</button>
      <button data-variant="ghost" disabled={!canYield} onclick={() => act("yield")}>Passer et encaisser</button>
    {:else if v.phase === "discard"}
      <small>La riposte frappe</small>
      <p data-big>{total(g.sel)} / {v.pending}</p>
      <p>Défaussez au moins {v.pending} points de cartes.</p>
      <button data-variant="danger" disabled={!enough} onclick={() => act("discard", { cards: g.sel })}>Défausser →</button>
    {:else if v.phase === "jester"}
      <p><strong>Bouffon !</strong> Qui joue ensuite ?</p>
      {#each v.players as p, i}<button data-size="s" onclick={() => act("pick", { i })}>{p.name}</button>{/each}
    {/if}
  </aside>
</section>

<style>
  section { display: grid; grid-template-columns: 1fr minmax(230px, 280px); gap: var(--s5); align-items: end; padding: var(--s5); background: var(--papier); border-top: var(--bord); }
  header { grid-column: 1 / -1; display: flex; justify-content: space-between; align-items: baseline; gap: var(--s3); flex-wrap: wrap; }
  header h2 { margin: 0; }
  ul { --card-w: 84px; display: flex; justify-content: safe center; padding: var(--s6) var(--s4) var(--s3); overflow-x: auto; align-items: flex-end; }
  li { margin-right: -14px; }
  @media (max-width: 800px) { ul { --card-w: 68px; } li { margin-right: -22px; } }
  li:hover, li:focus-within { z-index: 2; }
  ul:not([data-live]) li { opacity: .75; }
  aside { display: grid; gap: var(--s2); }
  aside p { margin: 0; }
  p[data-big] { font: 400 2.4rem/1 var(--f-display); text-transform: uppercase; }
  p[data-error] { color: var(--vermillon); font-weight: 700; }
  @media (max-width: 800px) { section { grid-template-columns: 1fr; } }
</style>
