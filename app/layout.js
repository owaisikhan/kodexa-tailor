import { Cormorant_Garamond, Jost } from "next/font/google";
import "@/app/_styles/globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const jost = Jost({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-jost",
  display: "swap",
});

export const metadata = {
  title: "KODEXA TAILOR — The Anatomy of a Suit",
  description:
    "Kodexa Tailor bespoke tailoring. Eight movements of craft, from the measure of a man to the last quarter-inch of a working cuff.",
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${cormorant.variable} ${jost.variable}`}
    >
      <body>{children}</body>
    </html>
  );
}
