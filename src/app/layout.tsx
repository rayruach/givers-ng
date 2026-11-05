import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Givers.ng – Swipe & Bless",
  description: "Give freely, receive gracefully. Nigeria's community gifting platform by BallHard Charities.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
        <script src="https://js.paystack.co/v1/inline.js" async></script>
      </head>
      <body className="min-h-screen flex flex-col selection:bg-charity-200 selection:text-charity-800">
        {children}
      </body>
    </html>
  );
}
