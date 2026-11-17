import { Lobster_Two } from "next/font/google";

// The script word in the hero title and the closing line, in the wordmark's own typeface (Adam 11/11, 11/17).
// 700 for the closing line; the hero uses 400 (Adam 11/17: "real-life" felt too bold next to the light title).
export const lobster = Lobster_Two({ weight: ["400", "700"], style: "italic", subsets: ["latin"], display: "swap" });
