import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Providers } from "@/components/providers/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Futapp · Gestión Deportiva",
    template: "%s · Futapp",
  },
  description:
    "Centro de organización, comunicación y seguimiento deportivo para equipos de fútbol.",
  keywords: [
    "fútbol", "gestión deportiva", "equipo", "convocatorias",
    "alineación", "plantilla", "futapp", "pagos", "QR Bancolombia",
  ],
  authors: [{ name: "yecos" }],
  creator: "yecos",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Futapp",
  },
  openGraph: {
    title: "Futapp · Gestión Deportiva",
    description: "Centro de organización, comunicación y seguimiento deportivo para equipos de fútbol.",
    type: "website",
    locale: "es_CO",
  },
  twitter: {
    card: "summary_large_image",
    title: "Futapp · Gestión Deportiva",
    description: "Centro de organización, comunicación y seguimiento deportivo para equipos de fútbol.",
  },
  icons: {
    icon: "/logo.svg",
    apple: "/logo.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#16a34a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster />
        <Sonner position="top-center" richColors />
      </body>
    </html>
  );
}
