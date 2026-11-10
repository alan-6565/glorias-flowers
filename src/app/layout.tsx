import type { Metadata } from "next";
import { Cormorant_Garamond, Jost, Pinyon_Script } from "next/font/google";
import { CartProvider } from "@/components/Cart";
import "./globals.css";

const serif = Cormorant_Garamond({ variable: "--font-cormorant", subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"] });
const script = Pinyon_Script({ variable: "--font-pinyon", subsets: ["latin"], weight: "400" });
const sans = Jost({ variable: "--font-jost", subsets: ["latin"], weight: ["300", "400", "500"] });

export const metadata: Metadata = {
  title: "Gloria's Gift & Flower Shop — San Pablo, CA",
  description: "Ramos buchones, arreglos personalizados, perfumes originales y globos en San Pablo, California.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // Font variables live on <html> so the theme's font tokens can see them
    <html lang="es" className={`${serif.variable} ${script.variable} ${sans.variable}`}>
      <body className="bg-ivory font-sans text-ink antialiased">
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
