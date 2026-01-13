// Category mapping for better grouping
export function getCategoryFromEndpointName(name: string): string {
  // Address Services
  if (name.startsWith('Address')) return 'Address Services'

  // Banking & ATM Locator
  if (
    name.startsWith('Bank') ||
    name === 'All Banks' ||
    name === 'All ATMs' ||
    name.startsWith('Banks by') ||
    name.startsWith('Nearby Banks')
  )
    return 'Banking & ATM Locator'

  // Education Data
  if (
    name.startsWith('School') ||
    name.startsWith('Education') ||
    name.startsWith('Schools by')
  )
    return 'Education Data'

  // Exchange Rates
  if (
    name.startsWith('Exchange') ||
    name.startsWith('Currency') ||
    name.startsWith('Current Rates') ||
    name.startsWith('Historical Rates')
  )
    return 'Exchange Rates'

  // Locations
  if (
    name.startsWith('Location') ||
    name === 'All Regions' ||
    name.startsWith('Districts')
  )
    return 'Locations'

  // Stock Market Data
  if (
    name.startsWith('Stock') ||
    name === 'Market Summary' ||
    name === 'Sector Performance' ||
    name === 'Available Sectors' ||
    name.startsWith('Stocks by')
  )
    return 'Stock Market Data'

  // Transport & Logistics
  if (
    name.startsWith('Transport') ||
    name.startsWith('Route') ||
    name === 'Nearby Stops' ||
    name.startsWith('Fuel') ||
    name.startsWith('Travel')
  )
    return 'Transport & Logistics'

  // Default fallback
  return 'Other'
}
