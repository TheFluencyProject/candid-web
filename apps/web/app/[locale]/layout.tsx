import type { Metadata } from "next";
import Script from "next/script";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const messages = await getMessages();
  const t = messages.metadata as { title: string; description: string };

  return {
    title: t.title,
    description: t.description,
    openGraph: {
      type: "website",
      locale: locale === "ko" ? "ko_KR" : "en_US",
      url: "https://englishmode.app",
      title: t.title,
      description: t.description,
      siteName: "Dayli",
      images: [
        {
          url: "https://englishmode.app/ogimage.png",
          alt: t.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
      images: ["https://englishmode.app/ogimage.png"],
    },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  // Validate locale
  if (!routing.locales.includes(locale as "ko" | "en")) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

  // Get messages for client components
  const messages = await getMessages();

  return (
    <html lang={locale}>
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
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
