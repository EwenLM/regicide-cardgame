<script>
  /** Racine : en-tête, aiguillage d’écran (accueil / salle / table), notifications, pied de page. */
  import { g, leave } from "./lib/game.svelte.js";
  import Landing from "./components/Landing.svelte";
  import Lobby from "./components/Lobby.svelte";
  import Table from "./components/Table.svelte";
  import Rules from "./components/Rules.svelte";
  const v = $derived(g.view);
</script>

{#if !g.online}<p role="status" data-banner>Connexion perdue, reconnexion…</p>{/if}

<header>
  <a href="/" aria-label="Viva la Revolution ! — accueil">
    <svg viewBox="0 0 16 16" width="34" height="34" aria-hidden="true"><rect width="16" height="16" fill="var(--soufre)" stroke="var(--encre)" stroke-width="2"/><path d="M3 12V5l2.5 3L8 4l2.5 4L13 5v7z" fill="var(--encre)"/></svg>
    <strong>Viva la Revolution !</strong>
  </a>
  {#if v}
    <p><small>Partie privée</small> <mark>Code {v.code}</mark></p>
    <nav><button data-size="s" onclick={() => (g.rules = true)}>Règles du jeu</button>
      <button data-size="s" data-variant="danger" onclick={leave}>Quitter la partie</button></nav>
  {:else}
    <nav><button data-size="s" data-variant="ghost" onclick={() => (g.rules = true)}>Comment jouer ?</button><mark data-tone="danger">Mort aux rois</mark></nav>
  {/if}
</header>

{#if !v}<Landing />{:else if v.phase === "lobby"}<Lobby />{:else}<Table />{/if}

{#if v && g.note}<p role="status" data-toast>{g.note}</p>{/if}

<footer>
  <strong>Du caractère, jamais au détriment du jeu.</strong>
  <small>Jeu coopératif · inspiré de Régicide · projet indépendant</small>
</footer>
<Rules />

<style>
  header { display: flex; align-items: center; justify-content: space-between; gap: var(--s4); flex-wrap: wrap; padding: var(--s3) var(--s5); background: var(--soufre); border-bottom: var(--bord); }
  header a { display: flex; align-items: center; gap: var(--s3); text-decoration: none; font: 400 1.05rem var(--f-display); text-transform: uppercase; }
  header p { margin: 0; display: flex; gap: var(--s2); align-items: center; }
  nav { display: flex; gap: var(--s3); align-items: center; }
  footer { display: flex; justify-content: space-between; flex-wrap: wrap; gap: var(--s2); padding: var(--s4) var(--s5); background: var(--encre); color: var(--craie); font-family: var(--f-display); text-transform: uppercase; }
  footer small { font-family: var(--f-mono); }
  p[data-banner] { margin: 0; max-width: none; background: var(--vermillon); color: var(--craie); text-align: center; padding: var(--s2); font-weight: 700; }
  p[data-toast] { position: fixed; inset: auto var(--s4) var(--s4) auto; max-width: 340px; margin: 0; padding: var(--s3) var(--s4); background: var(--encre); color: var(--craie); border: var(--bord); box-shadow: 4px 4px 0 var(--vermillon); z-index: 10; font-weight: 700; }
</style>
