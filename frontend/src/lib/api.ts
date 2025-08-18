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

const API_BASE = "https://api.ghana-api.dev/api/v1";

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
};
