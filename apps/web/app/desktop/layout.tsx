// Top-level routes live outside /[locale], whose layout supplies <html>/<body>, so this route
// provides its own (mirrors app/lesson/layout.tsx). Dark color-scheme matches the page.
export default function DesktopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body>{children}</body>
    </html>
  );
}
