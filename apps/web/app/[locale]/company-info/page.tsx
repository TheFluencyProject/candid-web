import ReactMarkdown from "react-markdown";
import { readFile } from "fs/promises";
import path from "path";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/routing";
import { redirect } from "next/navigation";
import SiteFooter from "@/components/SiteFooter";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function CompanyInfoPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  // This page only exists for Korean
  if (locale !== "ko") {
    redirect("/");
  }

  const file_path = path.join(
    process.cwd(),
    "public",
    "content",
    `company-info-ko.md`
  );
  const content = await readFile(file_path, "utf-8");

  return <CompanyInfoContent content={content} />;
}

function CompanyInfoContent({ content }: { content: string }) {
  const t = useTranslations("company_info");
  const footerT = useTranslations("footer");

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#18181E" }}>
    <main className="px-8 py-10 md:px-12 lg:px-16">
      <header className="mb-10">
        <Link href="/" className="inline-block mb-8">
          <Image
            src="/wordmark-white.svg"
            alt="Candid"
            width={60}
            height={30}
            className="hover:opacity-80 transition-opacity"
          />
        </Link>

        <h1 className="text-4xl md:text-5xl font-light text-white mb-6">
          {t("title")}
        </h1>
      </header>

      <article className="prose prose-invert prose-gray max-w-3xl">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-light text-white mt-8 mb-4">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-light text-white mt-8 mb-4">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-xl font-light text-white mt-6 mb-3">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-gray-300 text-base leading-relaxed mb-4">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="text-gray-300 list-disc list-inside mb-4 space-y-2">
                {children}
              </ul>
            ),
            li: ({ children }) => (
              <li className="text-gray-300">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="text-white font-semibold">{children}</strong>
            ),
            a: ({ href, children }) => (
              <a
                href={href}
                className="text-blue-400 hover:text-blue-300 underline"
              >
                {children}
              </a>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </article>
    </main>
      <SiteFooter />
    </div>
  );
}
