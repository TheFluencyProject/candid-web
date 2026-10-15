import AnonAnalytics from "@/components/AnonAnalytics";

// Top-level routes live outside /[locale], whose layout supplies <html>/<body>, so this route
// provides its own (mirrors app/desktop/layout.tsx). Dark color-scheme matches the page.
export default function ExtensionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body>
        <AnonAnalytics>{children}</AnonAnalytics>
      </body>
    </html>
  );
}
