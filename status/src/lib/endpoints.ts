// Ghana API Endpoints

export interface Endpoint {
  name: string
  description: string
  endpoint: string
  icon?: string
  method?: string
  body?: any
}

const BASE_URL = 'https://api.ghana-api.dev/api/v1'

export const GHANA_API_ENDPOINTS: Array<Endpoint> = [
  // Address Services
  //   {
  //     name: 'Address Services',
  //     description: 'Validate and discover Ghana Post Digital Addresses.',
  //     endpoint: `${BASE_URL}/addresses`,
  //   },
  {
    name: 'Address Lookup',
    description: 'Reverse geocoding nearest digital address by coordinates.',
    endpoint: `${BASE_URL}/addresses/lookup?lat=5.6037&lng=-0.187`,
  },
  {
    name: 'Address Search',
    description: 'Search addresses and digital codes by keyword.',
    endpoint: `${BASE_URL}/addresses/search?q=Accra`,
  },
  {
    name: 'Address Validation',
    description: 'Validate Ghana Post Digital Address code.',
    endpoint: `${BASE_URL}/addresses/validate/GA-543-1234`,
  },

  // Banking & ATM Locator
  //   {
  //     name: 'Banking & ATM Locator',
  //     description: 'Find bank branches and ATMs nationwide.',
  //     endpoint: `${BASE_URL}/banking`,
  //   },
  {
    name: 'Bank Search',
    description: 'Search for banks and ATMs by name, location, or type.',
    endpoint: `${BASE_URL}/banking/search?q=GCB`,
    // endpoint: `${BASE_URL}/banking/search?q=GCB&location=Accra`,
  },
  {
    name: 'All Banks',
    description: 'Retrieve all bank branches (excluding ATM-only locations).',
    endpoint: `${BASE_URL}/banking/banks`,
  },
  {
    name: 'All ATMs',
    description: 'Retrieve all ATM locations.',
    endpoint: `${BASE_URL}/banking/atms`,
  },
  {
    name: 'Banks by Region',
    description: 'Get banks by region (e.g., Greater Accra, Ashanti).',
    endpoint: `${BASE_URL}/banking/region/Greater%20Accra`,
  },
  {
    name: 'Banks by City',
    description: 'Get banks by city (e.g., Accra, Kumasi).',
    endpoint: `${BASE_URL}/banking/city/Accra`,
  },
  {
    name: 'Nearby Banks',
    description: 'Find nearest banks and ATMs to a location.',
    endpoint: `${BASE_URL}/banking/nearby?lat=5.6037&lng=-0.187&radius=1000`,
  },

  // Education
  //   {
  //     name: 'Education Data',
  //     description: 'Get information about Ghanaian educational institutions.',
  //     endpoint: `${BASE_URL}/education`,
  //   },
  {
    name: 'School Search',
    description: 'Search for educational institutions by various criteria.',
    endpoint: `${BASE_URL}/education/schools/search?name=University&region=Greater%20Accra`,
  },
  {
    name: 'All Schools',
    description: 'Retrieve all educational institutions with pagination.',
    endpoint: `${BASE_URL}/education/schools?limit=20&offset=0`,
  },
  {
    name: 'School Statistics',
    description: 'Get statistical information about schools.',
    endpoint: `${BASE_URL}/education/schools/statistics`,
  },
  {
    name: 'School by ID',
    description: 'Get detailed information about a specific school.',
    endpoint: `${BASE_URL}/education/schools/550e8400-e29b-41d4-a716-446655440000`,
  },
  {
    name: 'Schools by Region',
    description: 'Get all schools in a specific region.',
    endpoint: `${BASE_URL}/education/schools/region/Greater%20Accra`,
  },
  {
    name: 'Schools by District',
    description: 'Get all schools in a specific district.',
    endpoint: `${BASE_URL}/education/schools/district/Accra%20Metropolis`,
  },
  {
    name: 'Schools by Category',
    description: 'Get schools by category (SHS, JHS, Primary, etc.).',
    endpoint: `${BASE_URL}/education/schools/category/SHS`,
  },
  {
    name: 'Schools by Grade',
    description: 'Get schools by grade/rating (A-D).',
    endpoint: `${BASE_URL}/education/schools/grade/A`,
  },

  // Exchange Rates
  //   {
  //     name: 'Exchange Rates',
  //     description: 'Get real-time and historical currency exchange data.',
  //     endpoint: `${BASE_URL}/exchange-rates`,
  //   },
  {
    name: 'Current Rates',
    description: 'Get current exchange rates for GHS.',
    endpoint: `${BASE_URL}/exchange-rates/current`,
  },
  {
    name: 'Historical Rates',
    description: 'Get historical exchange rates from stored snapshots.',
    endpoint: `${BASE_URL}/exchange-rates/historical?from=2024-01-01&to=2024-01-31&currency=USD`,
  },
  {
    name: 'Currency Trend',
    description: 'Get 7-day exchange rate trend for a currency.',
    endpoint: `${BASE_URL}/exchange-rates/USD/trend`,
  },
  {
    name: 'Currency Convert',
    description: 'Convert currency amounts.',
    endpoint: `${BASE_URL}/exchange-rates/convert`,
    method: 'POST',
    body: { from: 'USD', to: 'GHS', amount: 100 },
  },

  // Locations
  //   {
  //     name: 'Location Services',
  //     description: 'Get information about administrative regions and districts.',
  //     endpoint: `${BASE_URL}/locations`,
  //   },
  {
    name: 'All Regions',
    description: 'List all administrative regions in Ghana.',
    endpoint: `${BASE_URL}/locations/regions`,
  },
  {
    name: 'Districts by Region',
    description: 'List districts for a specific region.',
    endpoint: `${BASE_URL}/locations/districts/Greater%20Accra`,
  },

  // Stock Market
  //   {
  //     name: 'Stock Market Data',
  //     description: 'Get real-time and analytical data for Ghana Stock Exchange.',
  //     endpoint: `${BASE_URL}/stock-market`,
  //   },
  {
    name: 'Stock Search',
    description: 'Search for stocks by symbol, name, sector, or price range.',
    endpoint: `${BASE_URL}/stock-market/search?sector=Banking`,
  },
  {
    name: 'Stock by Symbol',
    description: 'Get detailed information for a specific stock.',
    endpoint: `${BASE_URL}/stock-market/stock/GCB`,
  },
  {
    name: 'All Stocks',
    description: 'Get current data for all listed stocks on GSE.',
    endpoint: `${BASE_URL}/stock-market/all`,
  },
  {
    name: 'Stocks by Sector',
    description: 'Get all stocks in a specific sector.',
    endpoint: `${BASE_URL}/stock-market/sector/Banking`,
  },
  {
    name: 'Market Summary',
    description: 'Get Ghana Stock Exchange market overview.',
    endpoint: `${BASE_URL}/stock-market/market-summary`,
  },
  {
    name: 'Sector Performance',
    description: 'Get performance metrics for all sectors.',
    endpoint: `${BASE_URL}/stock-market/sector-performance`,
  },
  {
    name: 'Available Sectors',
    description: 'Get list of available stock sectors.',
    endpoint: `${BASE_URL}/stock-market/sectors`,
  },

  // Business Verification
  //   {
  //     name: 'Business Verification',
  //     description: 'Verify business information against official records.',
  //     endpoint: `${BASE_URL}/business-verification`,
  //   },
  //   {
  //     name: 'Business Search',
  //     description: 'Search for registered businesses in Ghana.',
  //     endpoint: `${BASE_URL}/business-verification/search?businessName=Tech%20Solutions&location=Accra`,
  //   },
  //   {
  //     name: 'Business Verify',
  //     description: 'Verify business details against official records.',
  //     endpoint: `${BASE_URL}/business-verification/verify`,
  //   },
  //   {
  //     name: 'Business by Registration',
  //     description: 'Get business by registration number.',
  //     endpoint: `${BASE_URL}/business-verification/business/CS-123456789`,
  //   },
  //   {
  //     name: 'Name Availability',
  //     description: 'Check if a proposed business name is available.',
  //     endpoint: `${BASE_URL}/business-verification/name-search/My%20New%20Business%20Ltd`,
  //   },
  //   {
  //     name: 'Business Stats',
  //     description: 'Get business verification service statistics.',
  //     endpoint: `${BASE_URL}/business-verification/stats`,
  //   },
  //   {
  //     name: 'Business Health',
  //     description: 'Health check for business verification service.',
  //     endpoint: `${BASE_URL}/business-verification/health`,
  //   },

  // Transport & Logistics
  //   {
  //     name: 'Transport & Logistics',
  //     description:
  //       'Plan routes, estimate travel times, and find transport stops.',
  //     endpoint: `${BASE_URL}/transport`,
  //   },
  {
    name: 'Transport Stops',
    description: 'Get transport stops (bus stops, stations) for a city.',
    endpoint: `${BASE_URL}/transport/stops?city=accra`,
  },
  {
    name: 'Route Calculation',
    description: 'Calculate route between two points with distance and time.',
    endpoint: `${BASE_URL}/transport/route-calculation?start_lat=5.6037&start_lng=-0.1870&end_lat=5.6333&end_lng=-0.1833&mode=driving`,
  },
  {
    name: 'Route Directions',
    description: 'Get detailed route directions between locations.',
    endpoint: `${BASE_URL}/transport/directions?start_name=Kwame%20Nkrumah%20Circle,%20Accra&end_name=Kumasi%20Central%20Market&profile=driving-car`,
  },
  {
    name: 'Nearby Stops',
    description: 'Find nearby transport stops to a location.',
    endpoint: `${BASE_URL}/transport/nearby-stops?lat=5.6037&lng=-0.187&radius=1000`,
  },
  {
    name: 'Fuel Prices',
    description: 'Get current fuel prices in Ghana.',
    endpoint: `${BASE_URL}/transport/fuel-prices`,
  },
  {
    name: 'Travel Cost',
    description: 'Calculate travel cost for a route.',
    endpoint: `${BASE_URL}/transport/travel-cost?distance=50&mode=car`,
  },
]
