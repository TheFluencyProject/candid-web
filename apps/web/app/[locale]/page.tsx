import { headers } from "next/headers";
import { setRequestLocale } from "next-intl/server";
import { isCandidtutorsHost } from "@/lib/canonical-hosts";
import CandidtutorsLanding from "@/components/CandidtutorsLanding";
import SimpleLanding from "@/components/SimpleLanding";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function Home({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Host-conditional: candidtutors.co/ keeps its stripped landing; joincandid.co
  // (+ previews + localhost) get the new simple landing. The old carousel lives
  // at /classic.
  const host = (await headers()).get("host") ?? "";
  if (isCandidtutorsHost(host)) {
    return <CandidtutorsLanding />;
  }

  return <SimpleLanding locale={locale} />;
}
