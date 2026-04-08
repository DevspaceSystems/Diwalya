import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import BottomNav from "@/components/BottomNav";
import Navbar from "@/components/Navbar";
import PWARegistry from "@/components/pwa/PWARegistry";
import InstallPrompt from "@/components/pwa/InstallPrompt";


const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://diwalya.com'),
  title: "Diwalya - Ghana's Trusted Skilled & Unskilled Worker Marketplace",
  description: "Connect with verified skilled and unskilled workers in Ghana. Diwalya is where talent meets opportunity for plumbers, electricians, cleaners, and more.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Diwalya",
  },
  icons: {

    icon: [
      { url: '/icon.png' },
      { url: '/diwalya-logo.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: '/apple-icon.png',
  },
  openGraph: {
    title: "Diwalya - Talent Meets Opportunity",
    description: "Connect with verified skilled and unskilled workers in Ghana.",
    url: 'https://diwalya.com',
    siteName: 'Diwalya',
    images: [
      {
        url: '/diwalya-logo.png',
        width: 1200,
        height: 630,
        alt: 'Diwalya Platform Logo',
      },
    ],
    locale: 'en_GH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Diwalya - Talent Meets Opportunity",
    description: "Connect with verified skilled and unskilled workers in Ghana.",
    images: ['/diwalya-logo.png'],
  },
};







export const viewport: Viewport = {
  themeColor: "#1E3A8A", // Deep blue
  width: "device-width",
  initialScale: 1,
  maximumScale: 1, // Useful to prevent zooming on input focus in mobile, giving app feel
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} antialiased bg-gray-50 text-gray-900 pb-16 md:pb-0`}>
        <PWARegistry />
        <Navbar />
        {children}
        <BottomNav />
        <InstallPrompt />
      </body>

    </html>
  );
}
