<script>
  /** Page d’accueil : accroche, formulaire (créer / rejoindre), pouvoirs. Écran sans partie en cours. */
  import { g, create, join } from "../lib/game.svelte.js";
  let name = $state(g.name), code = $state("");
  const POWERS = [
    ["H", "Soigner la pioche", "Remet des cartes de la défausse sous la pioche."],
    ["D", "Revitaliser l’équipe", "Fait piocher des cartes à tous les alliés."],
    ["C", "Frapper deux fois", "Les dégâts du coup sont doublés."],
    ["S", "Réduire l’attaque", "Affaiblit durablement la riposte de l’ennemi."],
  ];
  const GL = { H: "♥", D: "♦", C: "♣", S: "♠" };
</script>

<section aria-labelledby="accroche">
  <div>
    <small>Jeu de cartes coopératif · 1 à 4 joueurs</small>
    <h1 id="accroche">La cour va tomber.</h1>
    <p><strong>Pas de rivalités. Des alliés.</strong></p>
    <p>Douze figures royales tiennent le royaume. Combinez vos cartes et leurs pouvoirs pour renverser la cour. Une seule règle : on gagne ensemble ou on perd ensemble.</p>
  </div>

  <aside data-panel data-tone="soufre" aria-labelledby="jouer">
    <h2 id="jouer">À vous de jouer.</h2>
    <form onsubmit={(e) => { e.preventDefault(); create(name); }}>
      <label><span>Votre pseudo</span>
        <input bind:value={name} maxlength="14" autocomplete="nickname" placeholder="Camille" aria-invalid={g.note && !name.trim() ? "true" : null}></label>
      <button data-variant="ink" type="submit">Créer une partie →</button>
    </form>
    <hr>
    <form onsubmit={(e) => { e.preventDefault(); join(code, name); }}>
      <label><span>Code d’invitation</span>
        <input bind:value={code} maxlength="4" autocapitalize="characters" placeholder="ABCD"
          aria-invalid={g.note && /introuvable|code|pleine/i.test(g.note) ? "true" : null} aria-describedby="aide-code">
        {#if g.note}<small id="aide-code" role="alert">{g.note}</small>
        {:else}<small id="aide-code">Quatre lettres, données par l’hôte.</small>{/if}</label>
      <button type="submit">Rejoindre l’équipe →</button>
    </form>
  </aside>
</section>

<ul aria-label="Le jeu en bref">
  <li>12 figures à renverser</li><li>4 pouvoirs, 1 pioche</li><li>Une seule équipe</li><li>De 1 à 4 joueurs</li>
</ul>

<section aria-labelledby="force">
  <h2 id="force">Votre force ? Les combinaisons.</h2>
  <ol>
    {#each POWERS as [s, titre, texte]}
      <li data-suit={s}><b aria-hidden="true">{GL[s]}</b><h3>{titre}</h3><p>{texte}</p></li>
    {/each}
  </ol>
</section>

<style>
  section:first-of-type { display: grid; grid-template-columns: 1.3fr 1fr; gap: var(--s6); align-items: start; padding: var(--s7) var(--s5); max-width: 1100px; margin: 0 auto; }
  hr { border: 0; border-top: var(--trait) dashed var(--encre); margin: var(--s4) 0; }
  aside { box-shadow: var(--relief-haut); }
  aside button { width: 100%; }
  ul { display: flex; flex-wrap: wrap; gap: var(--s2) var(--s6); justify-content: center; background: var(--encre); color: var(--craie); padding: var(--s3) var(--s4); font: 700 .75rem var(--f-mono); text-transform: uppercase; letter-spacing: .1em; }
  ul li::before { content: "■ "; color: var(--soufre); }
  section:last-of-type { padding: var(--s7) var(--s5); max-width: 1100px; margin: 0 auto; }
  ol { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: var(--s5); }
  li[data-suit] { background: var(--craie); border: var(--bord); box-shadow: var(--relief); padding: var(--s4); }
  li[data-suit] b { display: grid; place-items: center; width: 44px; height: 44px; border: var(--bord); background: var(--tint); color: var(--suit); font-size: 1.6rem; margin-bottom: var(--s3); }
  li[data-suit] p { margin: 0; }
  @media (max-width: 800px) { section:first-of-type { grid-template-columns: 1fr; padding-block: var(--s6); } }
</style>
