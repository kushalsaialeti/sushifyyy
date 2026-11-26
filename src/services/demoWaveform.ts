export function demoPeak(index: number, seed: number) {
  const random = Math.sin(index * 12.9898 + seed * 78.233) * 43758.5453;
  const envelope = Math.abs(Math.sin(index / 7 + seed) * 0.6 + Math.sin(index / 19 + seed * 1.7) * 0.4);
  return Math.max(0.08, Math.min(1, 0.12 + envelope * 0.6 + (random - Math.floor(random)) * 0.34));
}
