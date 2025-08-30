/**
 * Map Utilities Class
 *
 * Provides utility functions for map-related calculations and visualizations,
 * particularly for handling radius scaling and map display optimizations.
 */
export class MapUtils {
  /**
   * Default scale factor for converting meters to map pixels
   * This factor helps maintain appropriate visual proportions
   */
  private static readonly DEFAULT_RADIUS_SCALE_FACTOR = 50;

  /**
   * Maximum allowed circle radius in map pixels
   * Prevents circles from becoming too large and overwhelming the map
   */
  private static readonly DEFAULT_MAX_CIRCLE_RADIUS = 50;

  /**
   * Calculates the appropriate circle radius for map visualization
   *
   * This function scales a real-world radius (in meters) to an appropriate
   * visual radius on the map while ensuring it doesn't exceed maximum bounds.
   *
   * @param searchRadius - The actual search radius in meters (e.g., 1000 for 1km)
   * @param scaleFactor - Optional scale factor for pixel conversion (default: 50)
   * @param maxRadius - Optional maximum radius in pixels (default: 50)
   * @returns The calculated circle radius in pixels for map display
   *
   * @example
   * ```typescript
   * // For a 1000m radius search
   * const radius = MapUtils.calculateCircleRadius(1000);
   * // Returns: 20 (1000 / 50, capped at 50)
   *
   * // With custom scaling
   * const radius = MapUtils.calculateCircleRadius(1000, 25, 100);
   * // Returns: 40 (1000 / 25, capped at 100)
   * ```
   */
  static calculateCircleRadius(
    searchRadius: number,
    scaleFactor: number = MapUtils.DEFAULT_RADIUS_SCALE_FACTOR,
    maxRadius: number = MapUtils.DEFAULT_MAX_CIRCLE_RADIUS
  ): number {
    if (searchRadius <= 0) {
      return 0;
    }

    if (scaleFactor <= 0) {
      throw new Error('Scale factor must be greater than 0');
    }

    // Calculate the scaled radius and ensure it doesn't exceed the maximum
    const scaledRadius = searchRadius / scaleFactor;
    return Math.min(scaledRadius, maxRadius);
  }

  /**
   * Calculates the optimal zoom level for a given radius
   *
   * @param radiusInMeters - The radius in meters
   * @returns The recommended zoom level (higher = more zoomed in)
   */
  static calculateOptimalZoom(radiusInMeters: number): number {
    // Rough estimation: smaller radius = higher zoom
    if (radiusInMeters <= 500) return 15;
    if (radiusInMeters <= 1000) return 14;
    if (radiusInMeters <= 2000) return 13;
    if (radiusInMeters <= 5000) return 12;
    return 11;
  }

  /**
   * Validates coordinate bounds for Ghana
   *
   * @param lat - Latitude to validate
   * @param lng - Longitude to validate
   * @returns True if coordinates are within Ghana's approximate bounds
   */
  static isValidGhanaCoordinate(lat: number, lng: number): boolean {
    // Ghana's approximate boundaries
    const minLat = 4.5;
    const maxLat = 11.5;
    const minLng = -3.5;
    const maxLng = 1.5;

    return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
  }

  /**
   * Calculates the distance between two coordinates using the Haversine formula
   *
   * @param lat1 - Latitude of first point
   * @param lng1 - Longitude of first point
   * @param lat2 - Latitude of second point
   * @param lng2 - Longitude of second point
   * @returns Distance in meters
   */
  static calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }
}

/**
 * Convenience function for calculating circle radius
 *
 * This is a standalone function that can be imported directly
 * for cases where you don't need the full MapUtils class.
 *
 * @param searchRadius - The search radius in meters
 * @param scaleFactor - Optional scale factor (default: 50)
 * @param maxRadius - Optional maximum radius (default: 50)
 * @returns The calculated circle radius in pixels
 */
export function calculateCircleRadius(
  searchRadius: number,
  scaleFactor: number = 50,
  maxRadius: number = 50
): number {
  return MapUtils.calculateCircleRadius(searchRadius, scaleFactor, maxRadius);
}