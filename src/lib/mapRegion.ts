/** Default radius when picking or searching by map region (district / province scale). */
export const MAP_REGION_RADIUS_KM = 80;

export function formatRegionRadiusLabel(radiusKm: number = MAP_REGION_RADIUS_KM): string {
  if (radiusKm >= 100) return `~${Math.round(radiusKm)} km`;
  return `~${radiusKm} km`;
}
