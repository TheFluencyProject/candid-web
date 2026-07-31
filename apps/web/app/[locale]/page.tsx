import type { Metadata } from "next";
import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { isCandidtutorsHost } from "@/lib/canonical-hosts";
import CandidtutorsLanding from "@/components/CandidtutorsLanding";
import SimpleLanding from "@/components/SimpleLanding";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

/**
 * hreflang for the two home variants. Lives on the page, not [locale]/layout.tsx —
 * the layout also wraps /privacy, /terms, /tutor/*, which would all inherit a home
 * canonical and be mis-canonicalized.
 *
 * Absolute URLs because the [locale] tree sets no metadataBase; relative ones would
 * resolve against localhost. Host comes from the header since candidtutors.co serves
 * this same route and must not canonicalize to joincandid.co.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const host = (await headers()).get("host") ?? "joincandid.co";
  const origin = host.startsWith("localhost") || host.startsWith("127.0.0.1")
    ? `http://${host}`
    : `https://${host}`;

  return {
    alternates: {
      canonical: locale === "ko" ? `${origin}/ko` : origin,
      languages: {
        en: origin,
        ko: `${origin}/ko`,
        "x-default": origin,
      },
    },
  };
}

export default async function Home({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;

  // Host-conditional: candidtutors.co/ keeps its stripped landing; joincandid.co
  // (+ previews + localhost) get the new simple landing. The old carousel lives
  // at /classic.
  const host = (await headers()).get("host") ?? "";
  if (isCandidtutorsHost(host)) {
    return <CandidtutorsLanding />;
  }

  return <SimpleLanding locale={locale} karaoke={sp.karaoke !== "0"} />;
}
