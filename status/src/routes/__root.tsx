import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'

import Footer from '../components/Footer'
import Header from '../components/Header'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Ghana API Status',
        description: 'GhanaAPI Status',
        keywords:
          'GhanaAPI Status, GhanaAPI, GhanaAPI Status, GhanaAPI Status Page, GhanaAPI Status Check, GhanaAPI Status Page, GhanaAPI Status Check',
        author: 'Joshua Ansah',
      },
    ],
    links: [
      {
        rel: 'stylesheet',
        href: appCss,
      },
      {
        rel: 'icon',
        type: 'image/jpeg',
        href: '/ghana-api.jpeg',
      },
      {
        rel: 'apple-touch-icon',
        href: '/ghana-api.jpeg',
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Scripts />
      </body>
    </html>
  )
}
