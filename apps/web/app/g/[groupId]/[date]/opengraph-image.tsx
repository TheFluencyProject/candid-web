import { ImageResponse } from "next/og";

export const revalidate = 604800; // 1 week

export const alt = "Candid Immersion";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

function formatDate(dateStr: string): string {
  const [mm, dd, yy] = dateStr.split("-");
  const month = new Date(2000 + Number(yy), Number(mm) - 1).toLocaleString(
    "en-US",
    { month: "long" }
  );
  const day = Number(dd);
  const suffix =
    day >= 11 && day <= 13
      ? "th"
      : (["th", "st", "nd", "rd"][day % 10] ?? "th");
  return `${month} ${day}${suffix}`;
}

export default async function Image({
  params,
}: {
  params: Promise<{ groupId: string; date: string }>;
}) {
  const { date } = await params;

  // Fetch Barlow Condensed from Google Fonts
  const css = await fetch(
    "https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600"
  ).then((r) => r.text());
  const fontUrl = css.match(/src: url\((.+?)\)/)?.[1];
  const fontData = fontUrl
    ? await fetch(fontUrl).then((r) => r.arrayBuffer())
    : null;

  const dateLabel = formatDate(date);

  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          backgroundColor: "#1A1A1D",
          gap: 20,
        }}
      >
        <span
          style={{
            fontFamily: "'Barlow Condensed'",
            fontSize: 84,
            fontWeight: 600,
            color: "#ffffff",
            letterSpacing: "-0.5px",
          }}
        >
          Candid Immersion
        </span>
        <span
          style={{
            fontFamily: "'Barlow Condensed'",
            fontSize: 52,
            fontWeight: 600,
            color: "#ffffff",
            letterSpacing: "-0.5px",
          }}
        >
          {dateLabel}
        </span>
      </div>
    ),
    {
      ...size,
      fonts: fontData
        ? [
            {
              name: "Barlow Condensed",
              data: fontData,
              style: "normal",
              weight: 600,
            },
          ]
        : [],
      headers: {
        "Cache-Control": "public, max-age=604800, immutable",
      },
    }
  );
}
