import type { Metadata } from "next";
import { Montserrat, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const lato = Lato({
  variable: "--font-lato",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Storely — Curated marketplace",
  description: "A modern marketplace for everyday and editorial finds. Curated, fast, fair.",
};

/**
 * Root layout — intentionally minimal. The storefront chrome (UtilityBar,
 * Navbar, Footer) lives in `app/(shop)/layout.tsx` so the admin panel
 * (`app/admin/*`) can render its own dedicated shell without the shop
 * navigation. Providers wraps everything because Clerk + TanStack Query
 * are needed on every route.
 */
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${lato.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
