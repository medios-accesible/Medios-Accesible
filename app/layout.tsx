import type { Metadata } from "next";
import MobileSiteMenu from "../components/MobileSiteMenu";
import "./globals.css";

export const metadata: Metadata = {
  title: "Medios Accesible | Custom-Coded Websites & Digital Systems",
  description:
    "Medios Accesible builds custom-coded websites, e-commerce stores, digital systems, client portals, SEO pages, and immersive digital experiences."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <MobileSiteMenu />
        {children}
      </body>
    </html>
  );
}
