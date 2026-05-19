import type { Metadata } from "next";
import { Montserrat, Lato } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { UtilityBar } from "@/components/shell/UtilityBar";
import { Navbar } from "@/components/shell/Navbar";
import { Footer } from "@/components/shell/Footer";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${lato.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>
          <UtilityBar />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
