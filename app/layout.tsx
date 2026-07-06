import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import Providers from "./providers";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "Scotiabank",
  description: "Simulated bank & wallet management",
  icons: {
    icon: [
      { url: "/scotiabanklogo.png", type: "image/png" },
      { url: "/icon.png", type: "image/png" },
    ],
    shortcut: "/scotiabanklogo.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Scotiabank",
    description: "Secure digital banking for wallets, transfers, and account insights.",
    siteName: "Scotiabank",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Scotiabank digital banking",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scotiabank",
    description: "Secure digital banking for wallets, transfers, and account insights.",
    images: ["/og-image.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
