<script>
  /** Illustration d’un royal (J, Q ou K). Couleurs héritées de --tint / --suit : thème par data-suit du parent. */
  let { rank = "K" } = $props();
</script>

<svg viewBox="0 0 64 64" role="img" aria-label={{ J: "Valet", Q: "Dame", K: "Roi" }[rank]}>
  <rect width="64" height="64" fill="var(--tint)" />
  {#if rank === "Q"}<path d="M14 58V26h8v14h20V26h8v32z" fill="var(--encre)" />{/if}
  {#if rank === "K"}<path d="M20 40h24l-2 18H22z" fill="var(--encre)" />{/if}
  <rect x="20" y="22" width="24" height="26" fill="var(--craie)" stroke="var(--encre)" stroke-width="3" />
  <path d="M18 24V8l8 8 6-10 6 10 8-8v16z" fill="var(--soufre)" stroke="var(--encre)" stroke-width="3" stroke-linejoin="round" />
  <rect x="26" y="32" width="4" height="5" fill="var(--encre)" /><rect x="35" y="32" width="4" height="5" fill="var(--encre)" />
  <rect x="22" y="39" width="4" height="3" fill="var(--vermillon)" /><rect x="39" y="39" width="4" height="3" fill="var(--vermillon)" />
  <path d="M27 43h11" stroke="var(--encre)" stroke-width="3" />
  <path d="M10 62h44" stroke="var(--encre)" stroke-width="3" />
</svg>

<style>
  svg { width: 100%; height: 100%; display: block; }
</style>
