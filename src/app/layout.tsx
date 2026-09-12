import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { Calistoga, Fraunces, IBM_Plex_Mono, Sora, Young_Serif } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import { ThemeBoot } from "@/components/theme-boot";
import { clerkAppearance } from "@/lib/clerk-appearance";
import "./globals.css";
import "./folio-pages.css";

const sora = Sora({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

const youngSerif = Young_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
});

const landDisplay = Calistoga({
  variable: "--font-land-display",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

const landScript = Fraunces({
  variable: "--font-land-script",
  subsets: ["latin"],
  weight: ["600"],
  style: ["italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "NoteVault — Notes powered by Convex",
  description: "Your personal knowledge vault — collections, entries, and real-time sync",
  applicationName: "NoteVault",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "NoteVault",
  },
  icons: {
    icon: [{ url: "/icons/icon-192.svg", type: "image/svg+xml" }],
    apple: [{ url: "/icons/icon-192.svg" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#fbf8f2",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${plexMono.variable} ${youngSerif.variable} ${landDisplay.variable} ${landScript.variable} h-full`}
    >
      <body className="min-h-full font-sans nv-atmosphere">
        <ClerkProvider appearance={clerkAppearance}>
          <ThemeBoot />
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <PwaRegister />
        </ClerkProvider>
      </body>
    </html>
  );
}
