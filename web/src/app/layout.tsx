import type { Metadata } from "next";
import "./globals.css";
import { Inter } from "next/font/google";
import Header from "../components/Header";
import Footer from "../components/Footer";
import SupabaseProvider from "../components/SupabaseProvider";
import RouteTransition from "../components/RouteTransition";
import ChunkErrorHandler from "../components/ChunkErrorHandler";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "PichangApp - Encuentra tu pichanga",
  description:
    "Únete al próximo partido de fútbol amateur cerca de ti. Cupos pagados. 100% online.",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
  openGraph: {
    title: "PichangApp - Encuentra tu pichanga",
    description:
      "Únete al próximo partido de fútbol amateur cerca de ti. Cupos pagados. 100% online.",
    url: "/",
    siteName: "PichangApp",
    locale: "es_CL",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es-CL" className="scroll-smooth">
      <body className={`${inter.variable} antialiased font-sans text-gray-900 bg-white min-h-screen flex flex-col`}>
        <SupabaseProvider>
          <ChunkErrorHandler />
          <Header />
          <RouteTransition>{children}</RouteTransition>
          <Footer />
        </SupabaseProvider>
      </body>
    </html>
  );
}
