import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { useCallback, useEffect, useState } from 'react'
import { StatusCard } from '../components/StatusCard'
import { StatusHeader } from '../components/StatusHeader'
import { StatusStats } from '../components/StatusStats'
import { getCategoryFromEndpointName } from '../lib/categories'
import { GHANA_API_ENDPOINTS } from '../lib/endpoints'
import { checkService } from '../lib/fetchStatus'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'GhanaAPI Status' },
      { name: 'description', content: 'GhanaAPI Status' },
      {
        name: 'keywords',
        content:
          'GhanaAPI Status, GhanaAPI, GhanaAPI Status, GhanaAPI Status Page, GhanaAPI Status Check, GhanaAPI Status Page, GhanaAPI Status Check',
      },
      { name: 'author', content: 'Joshua Ansah' },
    ],
  }),
  validateSearch: (search: Record<string, unknown>) => ({
    _refresh: (search._refresh as number) || undefined,
  }),
  loader: async () => {
    const results = await Promise.all(
      GHANA_API_ENDPOINTS.map(async (ep) => ({
        name: ep.name,
        description: ep.description,
        url: ep.endpoint,
        ...(await checkService(ep.endpoint, ep.method, ep.body)),
      })),
    )

    return {
      checkedAt: new Date().toISOString(),
      services: results,
    }
  },
  component: StatusPage,
})

// Category order for consistent display
const CATEGORY_ORDER = [
  'Address Services',
  'Banking & ATM Locator',
  'Education Data',
  'Exchange Rates',
  'Locations',
  'Stock Market Data',
  'Transport & Logistics',
  'Other',
]

const REFRESH_INTERVAL = 10 * 60 * 1000 // 10 minutes in milliseconds

function StatusPage() {
  const { checkedAt, services } = Route.useLoaderData()
  const navigate = useNavigate()
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastCheckedAt, setLastCheckedAt] = useState(checkedAt)
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL / 1000) // Convert to seconds

  // Track when new data arrives to stop loading state
  useEffect(() => {
    if (checkedAt !== lastCheckedAt) {
      setIsRefreshing(false)
      setLastCheckedAt(checkedAt)
      setCountdown(REFRESH_INTERVAL / 1000) // Reset countdown after refresh
    }
  }, [checkedAt, lastCheckedAt])

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      // Navigate with a timestamp query param to force reload
      await navigate({
        to: '/',
        search: { _refresh: Date.now() },
        replace: true,
      })
    } catch (error) {
      console.error('Error refreshing:', error)
      setIsRefreshing(false)
    }
  }, [navigate])

  // Auto-refresh every 10 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      handleRefresh()
    }, REFRESH_INTERVAL)

    return () => clearInterval(interval)
  }, [handleRefresh])

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          return REFRESH_INTERVAL / 1000 // Reset to 10 minutes
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  const operationalCount = services.filter(
    (s: any) => s.status === 'operational',
  ).length
  const downCount = services.filter((s: any) => s.status === 'down').length
  const totalCount = services.length

  // Group services by major category
  const groupedServices = services.reduce((acc: any, service: any) => {
    const category = getCategoryFromEndpointName(service.name)
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(service)
    return acc
  }, {})

  // Sort categories by predefined order
  const sortedCategories = Object.keys(groupedServices).sort((a, b) => {
    const indexA = CATEGORY_ORDER.indexOf(a)
    const indexB = CATEGORY_ORDER.indexOf(b)
    if (indexA === -1 && indexB === -1) return a.localeCompare(b)
    if (indexA === -1) return 1
    if (indexB === -1) return -1
    return indexA - indexB
  })

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="flex-1">
        <div className="container mx-auto px-6 py-12">
          <StatusHeader
            onRefresh={handleRefresh}
            isRefreshing={isRefreshing}
            countdown={countdown}
          />

          <StatusStats
            total={totalCount}
            operational={operationalCount}
            down={downCount}
            lastChecked={checkedAt}
          />

          {/* Services Grid */}
          <div className="mt-12 space-y-12">
            {sortedCategories.map((category) => {
              const categoryServices = groupedServices[category]
              const categoryOperational = categoryServices.filter(
                (s: any) => s.status === 'operational',
              ).length
              const categoryTotal = categoryServices.length

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-semibold tracking-tight">
                      {category}
                    </h2>
                    <div className="text-sm text-muted-foreground">
                      {categoryOperational}/{categoryTotal} operational
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {categoryServices.map((service: any) => (
                      <StatusCard
                        key={service.name}
                        name={service.name}
                        description={service.description}
                        url={service.url}
                        status={service.status}
                        responseTime={service.responseTime}
                        httpStatus={service.httpStatus}
                        isLoading={isRefreshing}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
