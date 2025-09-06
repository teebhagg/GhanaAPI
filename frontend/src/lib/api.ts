export type AddressDto = {
  digitalCode: string;
  addressLine1: string;
  addressLine2?: string;
  latitude: number;
  longitude: number;
  postalCode?: string;
};

export type ExchangeRateDto = {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  provider: string;
  timestamp: string | Date;
};

export type HistoricalRateDto = {
  baseCurrency: string;
  targetCurrency: string;
  rate: number;
  date: string | Date;
  provider: string;
};

export type ConvertCurrencyDto = {
  from: string;
  to: string;
  amount: number;
};

export type ConversionResult = {
  from: string;
  to: string;
  amount: number;
  rate: number;
  result: number;
  provider: string;
  timestamp: string | Date;
};

export type RouteStep = {
  instruction: string;
  distance: number;
  duration: number;
  coordinates?: [number, number];
  maneuver?: string;
};

export type RouteDirectionsResponse = {
  distance: number;
  duration: number;
  geometry?: [number, number][];
  steps?: RouteStep[];
  start: {
    coordinates: [number, number];
    name?: string;
    resolved_from: "coordinates" | "geocoding";
  };
  end: {
    coordinates: [number, number];
    name?: string;
    resolved_from: "coordinates" | "geocoding";
  };
  profile: string;
  estimated_cost?: number;
  provider: string;
};

export const RouteProfile = {
  DRIVING_CAR: "driving-car",
  DRIVING_HGV: "driving-hgv",
  CYCLING_REGULAR: "cycling-regular",
  FOOT_WALKING: "foot-walking",
  WHEELCHAIR: "wheelchair",
} as const;

export type RouteProfile = (typeof RouteProfile)[keyof typeof RouteProfile];

export type RouteQuery = {
  start_lat?: number;
  start_lng?: number;
  start_name?: string;
  end_lat?: number;
  end_lng?: number;
  end_name?: string;
  profile?: RouteProfile;
  instructions?: boolean;
  geometry?: boolean;
};

export type FuelPrice = {
  petrol: number;
  diesel: number;
  lpg?: number;
  currency: string;
  lastUpdated: string;
  source: string;
};

export type NearbyStop = {
  id?: string;
  name: string;
  coordinates: [number, number];
  type: string;
  distance: number;
  routes?: string[];
};

export type NearbyStopsQuery = {
  lat: number;
  lng: number;
  radius?: number;
  type?: string;
};

export type NearbyStopsResponse = {
  success: boolean;
  data: NearbyStop[];
  count: number;
  center: [number, number];
  radius: number;
};

const API_BASE = "http://localhost:3000/api/v1";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export const api = {
  // Addresses
  reverseGeocode(lat: number, lng: number) {
    const q = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
    }).toString();
    return http<AddressDto | null>(`/addresses/lookup?${q}`);
  },
  searchAddresses(q: string) {
    const qs = new URLSearchParams({ q }).toString();
    return http<AddressDto[]>(`/addresses/search?${qs}`);
  },

  // Locations
  getRegions() {
    return http<{ code: string; label: string }[]>(`/locations/regions`);
  },
  getDistricts(regionId: string) {
    return http<
      { code: string; label: string; category: string; capital: string }[]
    >(`/locations/districts/${encodeURIComponent(regionId)}`);
  },

  // Exchange rates
  getCurrentRates(currencies?: string[]) {
    const qs = currencies?.length
      ? `?${new URLSearchParams({
          currencies: currencies.join(","),
        }).toString()}`
      : "";
    return http<ExchangeRateDto[]>(`/exchange-rates/current${qs}`);
  },
  convertCurrency(body: ConvertCurrencyDto) {
    return http<ConversionResult>(`/exchange-rates/convert`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  },

  // Transport
  getRouteDirections(query: RouteQuery) {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        params.append(key, value.toString());
      }
    });
    return http<{
      success: boolean;
      data: RouteDirectionsResponse;
    }>(`/transport/directions?${params}`);
  },

  getFuelPrices() {
    return http<{
      success: boolean;
      data: FuelPrice;
    }>(`/transport/fuel-prices`);
  },

  getNearbyStops(query: NearbyStopsQuery) {
    const params = new URLSearchParams();
    params.append("lat", query.lat.toString());
    params.append("lng", query.lng.toString());
    if (query.radius !== undefined) {
      params.append("radius", query.radius.toString());
    }
    if (query.type) {
      params.append("type", query.type);
    }
    return http<NearbyStopsResponse>(`/transport/nearby-stops?${params}`);
  },
};
