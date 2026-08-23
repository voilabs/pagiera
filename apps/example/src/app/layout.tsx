import type { Metadata } from "next";
import { Geist, Geist_Mono, Press_Start_2P, Syncopate, Manrope } from "next/font/google";
import { PagieraProvider } from "pagiera/provider";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const pressStart2P = Press_Start_2P({
  weight: "400",
  variable: "--font-press-start-2p",
});

const syncopate = Syncopate({
  weight: "400",
  variable: "--font-syncopate",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pagiera package example",
  description: "A standalone consumer of the Pagiera npm package",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased" suppressHydrationWarning>
      <body className="min-h-full flex flex-col"
        suppressHydrationWarning>
        <PagieraProvider
          fonts={[
            { variable: geistSans.variable, title: "Geist Sans" },
            { variable: geistMono.variable, title: "Geist Mono" },
            { variable: pressStart2P.variable, title: "Press Start 2P" },
            { variable: syncopate.variable, title: "Syncopate" },
            { variable: manrope.variable, title: "Manrope" },
          ]}
        >
          {children}
        </PagieraProvider>
      </body>
    </html>
  );
}
