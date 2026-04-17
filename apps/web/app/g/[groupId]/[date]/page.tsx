import type { Metadata } from "next";

const APP_STORE_URL = "https://apps.apple.com/app/id6754859158";

export const metadata: Metadata = {
  metadataBase: new URL("https://joincandid.co"),
  title: "Candid Immersion",
  description:
    "Join your group's daily English immersion session on Candid.",
  openGraph: {
    type: "website",
    title: "Candid Immersion",
    description: "Join your group's daily English immersion session on Candid.",
    siteName: "Candid",
  },
  twitter: {
    card: "summary_large_image",
    title: "Candid Immersion",
    description: "Join your group's daily English immersion session on Candid.",
  },
};

export default function GroupDatePage() {
  return (
    <>
      <main
        style={{
          backgroundColor: "#1A1A1D",
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          color: "white",
          padding: "2rem",
          textAlign: "center",
        }}
      >
        <p style={{ fontSize: "1.125rem", color: "#9ca3af" }}>
          Opening in App Store…
        </p>
        <p style={{ marginTop: "1rem", fontSize: "0.875rem", color: "#6b7280" }}>
          <a
            href={APP_STORE_URL}
            style={{ color: "#9ca3af", textDecoration: "underline" }}
          >
            Tap here if you are not redirected
          </a>
        </p>
      </main>
      <script
        dangerouslySetInnerHTML={{
          __html: `window.location.replace(${JSON.stringify(APP_STORE_URL)});`,
        }}
      />
    </>
  );
}
