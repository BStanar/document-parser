import type { Metadata } from 'next'
import { Montserrat, Merriweather, Source_Code_Pro } from 'next/font/google'
import './globals.css'
import { NuqsAdapter } from 'nuqs/adapters/next/app'
import { Toaster } from '@/components/ui/sonner'
import { TRPCReactProvider } from '@/trpc/client'
import { Navbar } from '@/components/navbar'

const fontSans = Montserrat({ subsets: ['latin'], variable: '--font-sans' })
const fontSerif = Merriweather({ subsets: ['latin'], variable: '--font-serif' })
const fontMono = Source_Code_Pro({ subsets: ['latin'], variable: '--font-mono' })

export const metadata: Metadata = {
  title: 'DocParser',
  description: 'Smart document processing system',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${fontSans.variable} ${fontSerif.variable} ${fontMono.variable} min-h-screen flex flex-col antialiased`}>
        <TRPCReactProvider>
          <NuqsAdapter>
            <Navbar />
            <main className="flex-1">{children}</main>
            <Toaster />
          </NuqsAdapter>
        </TRPCReactProvider>
      </body>
    </html>
  )
}