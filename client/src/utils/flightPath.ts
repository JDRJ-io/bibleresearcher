/**
 * Predict landing spot during fast flick scrolls
 * Helps pre-warm cache for where user will end up
 * 
 * MOBILE OPTIMIZATION: Uses higher velocity multiplier (2.5 vs 1.8) because
 * touch scrolling has more momentum and travels further per flick
 */

export function predictLanding(
  center: number, 
  velocityRps: number, 
  minJump = 200, 
  maxJump = 1500,
  velocityMultiplier = 1.8
): number {
  const jump = Math.max(
    minJump, 
    Math.min(maxJump, Math.round(Math.abs(velocityRps) * velocityMultiplier))
  );
  const dir = Math.sign(velocityRps || 1);
  return center + dir * jump;
}

/**
 * Calculate range for flight path warming
 * Returns [start, end] indices to pre-warm
 */
export function flightPathRange(
  center: number,
  velocityRps: number,
  total: number,
  warmRadius = 200,
  velocityMultiplier = 1.8
): [number, number] {
  const landing = predictLanding(center, velocityRps, 200, 1500, velocityMultiplier);
  const clamped = Math.max(0, Math.min(total - 1, landing));
  
  return [
    Math.max(0, clamped - warmRadius),
    Math.min(total - 1, clamped + warmRadius)
  ];
}
