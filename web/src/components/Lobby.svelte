<script>
  /** Salle d’attente : code à partager, liste des alliés, lancement par l’hôte. */
  import { g, act } from "../lib/game.svelte.js";
  const v = $derived(g.view);
  const host = $derived(v.host === v.you);
  let copied = $state(false);
  async function copy() { try { await navigator.clipboard.writeText(v.code); copied = true; setTimeout(() => (copied = false), 1500); } catch { /* presse-papiers refusé */ } }
</script>

<section aria-labelledby="salle">
  <small>Salle d’attente</small>
  <h1 id="salle">Rassemblez l’équipe.</h1>
  <div data-panel data-tone="soufre">
    <small>Code d’invitation</small>
    <p aria-label={`Code ${v.code.split("").join(" ")}`}><output>{v.code}</output></p>
    <button onclick={copy}>{copied ? "Copié ✓" : "Copier le code"}</button>
  </div>
  <div data-panel>
    <h2>Les alliés ({v.players.length}/4)</h2>
    <ul>
      {#each v.players as p}
        <li><strong>{p.name}{p.pid === v.you ? " (vous)" : ""}</strong>
          {#if p.pid === v.host}<mark>Hôte</mark>{/if}
          {#if !p.on}<mark data-tone="danger">Hors ligne</mark>{/if}</li>
      {/each}
    </ul>
    {#if host}<button data-variant="primary" onclick={() => act("start")}>Lancer la partie →</button>
    {:else}<p>L’hôte lancera la partie. Patience, allié.</p>{/if}
    <small>Une salle inactive est fermée automatiquement.</small>
  </div>
</section>

<style>
  section { max-width: 640px; margin: 0 auto; padding: var(--s7) var(--s5); display: grid; gap: var(--s5); }
  output { display: block; font: 400 clamp(3rem, 14vw, 5.5rem) var(--f-display); letter-spacing: .12em; line-height: 1; margin: var(--s2) 0 var(--s3); }
  p { margin: 0; }
  ul { display: grid; gap: var(--s2); margin-bottom: var(--s4); }
  li { display: flex; gap: var(--s2); align-items: center; padding: var(--s2) var(--s3); border: 2px solid var(--encre); background: var(--papier); }
</style>
