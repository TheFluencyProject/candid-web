import type { Metadata } from "next";

const APP_STORE_URL = "https://apps.apple.com/app/id6754859158";

export const metadata: Metadata = {
  metadataBase: new URL("https://daylienglish.com"),
  title: "Dayli",
  description:
    "Learn English with real YouTube videos on Dayli. Download the app to start watching.",
  openGraph: {
    type: "website",
    title: "Dayli",
    description:
      "Learn English with real YouTube videos on Dayli. Download the app to start watching.",
    siteName: "Dayli",
    images: [{ url: "/ogimage.png", width: 1200, height: 630, alt: "Dayli" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Dayli",
    description:
      "Learn English with real YouTube videos on Dayli. Download the app to start watching.",
  },
};

export default function VideosPage() {
  return (
    <>
      <main
        style={{
          backgroundColor: "#131212",
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
