<script>
  /** Fenêtre « Règles du jeu » : <dialog> natif, piloté par g.rules. */
  import { g } from "../lib/game.svelte.js";
  let box;
  $effect(() => { if (g.rules && !box.open) box.showModal(); else if (!g.rules && box.open) box.close(); });
</script>

<dialog bind:this={box} onclose={() => (g.rules = false)} aria-labelledby="regles-titre">
  <h2 id="regles-titre">Règles du jeu</h2>
  <p><strong>But :</strong> renverser les 12 royaux (Valets, Dames, Rois) ensemble. Si un seul joueur ne peut plus encaisser la riposte, l’équipe perd.</p>
  <h3>À votre tour</h3>
  <ol>
    <li>1. Jouez une carte, un combo (2 à 5 de même valeur, total ≤ 10), ou un As (Compagnon animal) avec une autre carte. Le Bouffon se joue seul.</li>
    <li>2. Le pouvoir de la couleur s’applique, sauf si l’ennemi est immunisé contre elle.</li>
    <li>3. Les dégâts sont égaux à la valeur des cartes (Valet 10, Dame 15, Roi 20, As 1).</li>
    <li>4. Si l’ennemi survit, il riposte : défaussez des cartes d’une valeur au moins égale à son attaque.</li>
  </ol>
  <h3>Les quatre pouvoirs</h3>
  <p>♥ remet des cartes de la défausse sous la pioche. ♦ fait piocher l’équipe. ♣ double les dégâts. ♠ réduit l’attaque de l’ennemi.</p>
  <p>Tuer un royal pile sur ses PV place sa carte sur la pioche. Céder est interdit si tous les autres viennent de le faire.</p>
  <form method="dialog"><button data-variant="primary">Compris</button></form>
</dialog>

<style>
  ol { display: grid; gap: var(--s2); margin-bottom: var(--s4); }
  form { margin-top: var(--s4); }
</style>
