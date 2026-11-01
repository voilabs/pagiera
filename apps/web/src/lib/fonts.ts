import { Inter, JetBrains_Mono, Newsreader } from "next/font/google";

// One set of families for the marketing pages and the documentation.
export const sans = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
});
export const serif = Newsreader({
  subsets: ["latin", "latin-ext"],
  weight: ["300", "400"],
  variable: "--font-serif",
});
export const mono = JetBrains_Mono({
  subsets: ["latin", "latin-ext"],
  variable: "--font-mono",
});
export const fontVariables = `${sans.variable} ${serif.variable} ${mono.variable}`;
