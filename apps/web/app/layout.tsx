import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

const description = "English Mode is a language learning app that replaces mindless scrolling with English immersion. Learn to speak naturally and watch your fluency grow."
export const metadata: Metadata = {
  title: "English Mode: Replace scrolling with English immersion",
  description: description,
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://englishmode.app",
    title: "English Mode: Replace scrolling with English immersion",
    description: description,
    siteName: "English Mode",
    images: [
      {
        url: "https://englishmode.app/ogimage.png",
        alt: "English Mode: Replace scrolling with English immersion",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "English Mode: Replace scrolling with English immersion",
    description: description,
    images: ["https://englishmode.app/ogimage.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-7ZF3G2WP8Q"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-7ZF3G2WP8Q');
          `}
        </Script>

        <meta name="color-scheme" content="dark" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}
