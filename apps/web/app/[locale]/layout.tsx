import type { Metadata } from "next";
import Script from "next/script";
import { cookies } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";
import { notFound } from "next/navigation";
import { PostHogProvider } from "@/components/PostHogProvider";
import InAppBrowserBlocker from "@/components/InAppBrowserBlocker";
import DownloadQRInterceptor from "@/components/DownloadQRInterceptor";
import { CTA_FLAG_KEY } from "@/lib/posthog-config";
import { getMobileCtaVariant } from "@/lib/posthog-server";

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
      url: "https://joincandid.co",
      title: t.title,
      description: t.description,
      siteName: "Candid",
      images: [
        {
          url: "https://joincandid.co/mia-og-preview.png",
          alt: t.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t.title,
      description: t.description,
      images: ["https://joincandid.co/mia-og-preview.png"],
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

  // Reading cookies opts this layout into dynamic rendering — required so the
  // server-decided variant matches the client SDK's bootstrap on first paint.
  const cookieStore = await cookies();
  const distinctId = cookieStore.get("candid_did")?.value ?? crypto.randomUUID();
  const bootstrapFlags: Record<string, string | boolean> =
    locale === "en" ? { [CTA_FLAG_KEY]: await getMobileCtaVariant(distinctId) } : {};

  // Get messages for client components
  const messages = await getMessages();

  return (
    <html lang={locale}>
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-JC7C08X4X1"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-JC7C08X4X1');
          `}
        </Script>
        <link
          href="https://fonts.googleapis.com/css2?family=Sriracha&display=swap"
          rel="stylesheet"
        />
        {/* Smart App Banner — hidden for now, doesn't look good with the always-visible CTA button */}
        {/* <meta name="apple-itunes-app" content="app-id=6754859158" /> */}
        <meta name="color-scheme" content="dark" />
        <meta name="theme-color" content="#18181C" />
      </head>
      <body>
        <NextIntlClientProvider messages={messages}>
          <PostHogProvider distinctId={distinctId} bootstrapFlags={bootstrapFlags}>
            {children}
            <InAppBrowserBlocker />
            <DownloadQRInterceptor />
          </PostHogProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
