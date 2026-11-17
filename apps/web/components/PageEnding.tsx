import { getTranslations } from "next-intl/server";
import { lobster } from "@/lib/lobster";

// The page's closing line (mockup E1, approved 11/11) with one real-photo sticker per tutor floating in a fixed
// circle round it (Adam 11/17: never Tina's drawings, Didi always 054). Outlines are pre-recolored in the files.
// [file, x %, y %, height px, rotation deg, bob seconds], going round from the top.
const STICKERS: [string, number, number, number, number, number][] = [
  ["end-020-ffbfb8", 34.7, 5.7, 123, 0, 2.84], // Mia
  ["end-hayden-29-a4d8fe", 63.9, 5.6, 106, -5, 3.45],
  ["end-grace-12-e5d183", 92.7, 10.4, 110, 1, 3.93],
  ["end-jinny-28-c2dd94", 94.9, 65.7, 112, 11, 3.2],
  ["end-tina-16-c9b8ff", 77.5, 93.7, 101, -6, 3.03],
  ["end-054-ffbfb8", 48.6, 91.3, 114, -5, 3.16], // Didi
  ["end-hansoo-14-a4d8fe", 21.2, 93.5, 107, -5, 2.78],
  ["end-sol-01-e5d183", 7.3, 60.8, 113, -10, 2.58],
  ["end-ellie-05-c2dd94", 7.7, 10.0, 109, -2, 3.1],
];

export default async function PageEnding() {
  const t = await getTranslations("home");
  return (
    // One screen under the top bar, the line centered (Adam 11/17).
    <section className="flex min-h-[calc(100svh-61px)] flex-col justify-center overflow-hidden py-16">
      <div className="pe-bomb">
        <h2 className="pe-head">
          {t.rich("ending_line", {
            cool: (chunks) => <span className={`pe-cool ${lobster.className}`}>{chunks}</span>,
            br: () => <br />,
            wm: () => <img className="pe-wm" src="/wordmark-white.svg" alt="Candid" />,
          })}
        </h2>
        {STICKERS.map(([file, x, y, h, r, d]) => (
          <div key={file} className="pe-p" style={{ left: `${x}%`, top: `${y}%` }}>
            <img
              src={`/landing/${file}.webp`}
              alt=""
              loading="lazy"
              style={{ ["--h" as string]: `${h}px`, ["--r" as string]: `${r}deg`, ["--d" as string]: `${d}s` }}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
