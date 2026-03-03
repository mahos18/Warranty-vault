import type { Metadata, Viewport } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import BottomNav from "@/components/BottomNav";

export const metadata: Metadata = {
  title: "Warranty Vault",
  description: "Track your product warranties — never miss an expiry again.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Warranty Vault",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#0ea5e9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body>
          {/* Mobile-first container: full width on mobile, centered card on desktop */}
          <div className="min-h-screen bg-slate-100">
            <div className="relative mx-auto max-w-md min-h-screen bg-white shadow-xl flex flex-col">
              {/* Main scrollable content */}
              <main className="flex-1 overflow-y-auto pb-20">
                {children}
              </main>

              {/* Persistent bottom navigation */}
              <BottomNav />
            </div>
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}