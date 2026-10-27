<script>
  /** Écran de jeu : titre d’état, jauge « La chute de la cour », alliés, ennemi, piles, journal de bataille. */
  import { g, act } from "../lib/game.svelte.js";
  import { suit, rank, maxHp, attack, royalName, GLYPH } from "../lib/cards.js";
  import Card from "./Card.svelte";
  import Hand from "./Hand.svelte";
  const v = $derived(g.view);
  const me = $derived(v.players[v.turn]);
  const mine = $derived(me.pid === v.you);
  const self = $derived(v.players.find((p) => p.pid === v.you));
  const e = $derived(v.enemy);
  const left = $derived(Math.max(0, maxHp(e.c) - e.dmg));
  const att = $derived(Math.max(0, attack(e.c) - e.shield));
  const done = $derived(v.phase === "won" || v.phase === "lost");
  const title = $derived(
    v.phase === "won" ? "La cour est tombée !" : v.phase === "lost" ? "La cour a gagné…"
    : !mine ? `${me.name} réfléchit.`
    : v.phase === "discard" ? `${self.name}, encaissez la riposte.`
    : v.phase === "jester" ? "Bouffon ! Désignez le suivant."
    : `${self.name}, à vous de frapper.`);
  /** 12 emplacements : royaux tombés, ennemi courant, royaux à venir (Valets, puis Dames, puis Rois). */
  const slots = $derived(Array.from({ length: 12 }, (_, i) =>
    i < v.fallen.length ? { state: "fallen", card: v.fallen[i] }
    : i === v.fallen.length && !done ? { state: "current", card: e.c }
    : { state: "waiting", rank: "JQK"[Math.floor(i / 4)] }));
</script>

<main>
  <header>
    <small>Le royaume tremble · {v.fallen.length}/12 royaux tombés</small>
    <h1>{title}</h1>
    <ol aria-label="La chute de la cour">
      {#each slots as s}
        <li data-state={s.state} data-suit={s.card ? suit(s.card) : null} aria-label={s.state === "waiting" ? "À venir" : s.state === "fallen" ? "Tombé" : "En combat"}>
          <b>{s.card ? rank(s.card) : s.rank}</b><span aria-hidden="true">{s.card ? GLYPH[suit(s.card)] : "·"}</span>
        </li>
      {/each}
    </ol>
    {#if done && v.host === v.you}<button data-variant="primary" onclick={() => act("again")}>Rejouer →</button>{/if}
  </header>

  <div>
    <aside data-panel aria-labelledby="allies">
      <h2 id="allies">Les alliés</h2>
      <ul>
        {#each v.players as p, i}
          <li data-turn={i === v.turn && !done || null} data-off={!p.on || null}>
            <strong>{p.name}{p.pid === v.you ? " (vous)" : ""}</strong>
            <small>{p.n} cartes{!p.on ? " · hors ligne" : i === v.turn && !done ? " · joue" : ""}</small>
          </li>
        {/each}
      </ul>
    </aside>

    <section data-panel data-suit={suit(e.c)} aria-labelledby="ennemi">
      <small>Ennemi actuel · la cour résiste</small>
      <h2 id="ennemi">{royalName(e.c)}</h2>
      <div>
        <Card card={e.c} big />
        <dl>
          <dt>Points de vie</dt>
          <dd><progress max={maxHp(e.c)} value={left}></progress><b>{left} / {maxHp(e.c)} PV</b></dd>
          <dt>Attaque</dt><dd><b>{att}</b>{#if e.shield} <mark data-tone="info">−{e.shield} ♠</mark>{/if}</dd>
          <dt>Immunité</dt><dd>{#if e.jest}<mark data-tone="succes">Annulée</mark>{:else}<mark data-tone="encre">{GLYPH[suit(e.c)]} sans effet</mark>{/if}</dd>
        </dl>
      </div>
    </section>

    <aside>
      <ul aria-label="Piles">
        <li><Card back /><small>Pioche {v.tavernN}</small></li>
        <li>{#if v.top}<Card card={v.top} />{:else}<span data-empty></span>{/if}<small>Défausse {v.discardN}</small></li>
      </ul>
      <section data-panel aria-labelledby="bataille">
        <h2 id="bataille">La bataille</h2>
        <ol>{#each v.log.toReversed().slice(0, 6) as l}<li>{l}</li>{/each}</ol>
      </section>
    </aside>
  </div>
</main>
<Hand />

<style>
  main { max-width: 1200px; margin: 0 auto; padding: var(--s5); display: grid; gap: var(--s5); }
  main > header { display: grid; gap: var(--s2); justify-items: start; }
  main > header h1 { font-size: clamp(1.8rem, 5vw, 3.2rem); margin: 0; }
  main > header ol { display: flex; flex-wrap: wrap; gap: var(--s1); }
  main > header li { display: grid; place-items: center; width: 34px; height: 46px; border: 2px solid var(--encre); background: var(--craie); font: 700 .8rem/1 var(--f-mono); color: var(--suit, var(--encre)); }
  li[data-state="fallen"] { background: var(--tint); opacity: .85; text-decoration: line-through; }
  li[data-state="current"] { background: var(--soufre); box-shadow: 3px 3px 0 var(--encre); transform: translateY(-3px); }
  li[data-state="waiting"] { opacity: .55; border-style: dashed; }
  main > div { display: grid; grid-template-columns: 220px 1fr 260px; gap: var(--s5); align-items: start; }
  aside:first-child ul { display: grid; gap: var(--s2); margin-top: var(--s3); }
  aside:first-child li { padding: var(--s2) var(--s3); border: 2px solid var(--encre); display: grid; }
  li[data-turn] { background: var(--soufre); box-shadow: 3px 3px 0 var(--encre); }
  li[data-off] { opacity: .5; }
  section[data-suit] { background: var(--tint); }
  section[data-suit] > div { display: flex; gap: var(--s5); flex-wrap: wrap; align-items: flex-start; }
  dl { display: grid; gap: var(--s1); margin: 0; flex: 1; min-width: 180px; }
  dt { font: 700 .72rem var(--f-mono); text-transform: uppercase; letter-spacing: .08em; margin-top: var(--s2); }
  dd { margin: 0; display: grid; gap: var(--s1); justify-items: start; } dd b { font: 400 1.6rem var(--f-display); }
  aside:last-child { display: grid; gap: var(--s4); }
  aside:last-child > ul { display: flex; gap: var(--s5); }
  aside:last-child > ul li { display: grid; gap: var(--s2); justify-items: start; }
  span[data-empty] { width: 64px; aspect-ratio: 5 / 7; border: var(--trait) dashed var(--encre); }
  section[aria-labelledby="bataille"] ol { display: grid; gap: var(--s2); margin-top: var(--s3); font-size: .85rem; }
  section[aria-labelledby="bataille"] li { padding-bottom: var(--s2); border-bottom: 2px dashed var(--encre); }
  @media (max-width: 960px) { main > div { grid-template-columns: 1fr; } section[data-suit] { order: -1; } }
</style>
