import type { Metadata } from "next"
import { Geist, Lora, Amiri } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { Providers } from "@/components/providers"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
})

const serif = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
})

const arabic = Amiri({
  variable: "--font-arabic",
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  display: "swap",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://amyc.or.tz"),
  title: {
    default: "Ansaar Muslim Youth Centre (AMYC) — Official Digital Platform",
    template: "%s · AMYC",
  },
  description:
    "The official digital platform of the Ansaar Muslim Youth Centre (AMYC) — a pioneering Islamic institution in Tanzania since 1980, serving through education, da'wah, welfare, healthcare, media and a nationwide network of schools and Majimbo.",
  keywords: [
    "AMYC",
    "Ansaar Muslim Youth Centre",
    "Islamic organization Tanzania",
    "Muslim schools Tanzania",
    "Da'wah",
    "Islamic education",
    "Tanga",
    "Majimbo",
    "Radio Ihsaan FM",
  ],
  authors: [{ name: "Ansaar Muslim Youth Centre" }],
  creator: "Ansaar Muslim Youth Centre",
  openGraph: {
    title: "Ansaar Muslim Youth Centre (AMYC)",
    description:
      "A pioneering Islamic institution in Tanzania since 1980 — education, da'wah, welfare, healthcare and a nationwide network of schools and Majimbo.",
    url: "https://amyc.or.tz",
    siteName: "AMYC",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Ansaar Muslim Youth Centre (AMYC)",
    description: "Official digital platform of AMYC — Tanzania's pioneering Islamic youth institution since 1980.",
  },
  robots: { index: true, follow: true },
  alternates: { languages: { en: "/", sw: "/", ar: "/" } },
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${serif.variable} ${arabic.variable} min-h-screen bg-background font-sans antialiased`}>
        <Providers>
          {children}
        </Providers>
        <Toaster />
        <SonnerToaster richColors position="top-right" />
      </body>
    </html>
  )
}
