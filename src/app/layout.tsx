import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Sora, Young_Serif } from "next/font/google";
import { ConvexClientProvider } from "@/components/providers";
import { PwaRegister } from "@/components/pwa-register";
import { clerkAppearance } from "@/lib/clerk-appearance";
import "./globals.css";

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
  themeColor: "#0a1210",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${plexMono.variable} ${youngSerif.variable} h-full dark`}
    >
      <body className="min-h-full font-sans nv-atmosphere">
        <ClerkProvider appearance={clerkAppearance}>
          <ConvexClientProvider>{children}</ConvexClientProvider>
          <PwaRegister />
        </ClerkProvider>
      </body>
    </html>
  );
}
