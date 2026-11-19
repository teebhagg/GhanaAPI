import { createFileRoute } from '@tanstack/react-router'
import { ServiceRow } from '../components/ServiceRow'
import { StatusStrip } from '../components/StatusStrip'
import { Summary } from '../components/Summary'
import { getCategoryFromEndpointName } from '../lib/categories'
import { GHANA_API_ENDPOINTS } from '../lib/endpoints'
import { useStatuses } from '../lib/useStatuses'

export const Route = createFileRoute('/')({
  head: () => ({
    meta: [
      { title: 'GhanaAPI Status' },
      {
        name: 'description',
        content: 'Live status of every GhanaAPI endpoint.',
      },
    ],
  }),
  component: StatusPage,
})

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

// Static: derived from the endpoint list, so it renders instantly (and on the server).
const GROUPS = (() => {
  const map = new Map<string, typeof GHANA_API_ENDPOINTS>()
  for (const ep of GHANA_API_ENDPOINTS) {
    const c = getCategoryFromEndpointName(ep.name)
    map.set(c, [...(map.get(c) ?? []), ep])
  }
  return [...map.entries()].sort(
    ([a], [b]) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b),
  )
})()

function StatusPage() {
  const { entries, run, checking, checkedAt, refresh } = useStatuses()
  const total = GHANA_API_ENDPOINTS.length
  const values = Object.values(entries)
  const down = values.filter((e) => e.status === 'down').length

  return (
    <div className="mx-auto max-w-3xl px-5 pt-12 pb-20">
      <Summary
        total={total}
        done={values.length}
        down={down}
        checking={checking}
        checkedAt={checkedAt}
        onRefresh={refresh}
      />
      <StatusStrip entries={entries} run={run} />

      <div className="mt-12 space-y-10">
        {GROUPS.map(([category, eps]) => {
          const up = eps.filter(
            (e) => entries[e.name]?.status === 'operational',
          ).length
          const settled = eps.filter((e) => entries[e.name]).length
          return (
            <section key={category} aria-labelledby={`c-${category}`}>
              <div className="flex items-baseline justify-between border-b border-foreground pb-2">
                <h2 id={`c-${category}`} className="text-sm font-semibold">
                  {category}
                </h2>
                <span className="tabular text-sm text-muted-foreground">
                  {settled === 0
                    ? `${eps.length} endpoints`
                    : `${up}/${eps.length} up`}
                </span>
              </div>
              <ul>
                {eps.map((ep) => (
                  <ServiceRow
                    key={ep.name}
                    name={ep.name}
                    description={ep.description}
                    url={ep.endpoint}
                    entry={entries[ep.name]}
                    stale={
                      checking &&
                      !!entries[ep.name] &&
                      entries[ep.name].run !== run
                    }
                  />
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    </div>
  )
}
