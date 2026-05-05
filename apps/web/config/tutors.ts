export interface TutorPageConfig {
  photo: {
    // CSS object-position, e.g. "70% 20%". Counterintuitive but important:
    // X/Y here is the SOURCE-IMAGE coordinate that aligns with the same
    // coordinate of the container. Higher X% means the crop window moves
    // RIGHT into the source — which makes the subject appear further LEFT
    // in the visible frame (and vice versa). Same for Y. So if the subject
    // looks "too far right on mobile", INCREASE X%, don't decrease it.
    desktop: string;
    mobile: string;
    // Optional CSS transform-scale on mobile only. Defaults to 1.15 (matches the
    // baseline zoom-in applied via Tailwind). Set <1.15 to zoom out for tutors
    // whose photo benefits from more breathing room.
    mobileScale?: number;
    // Optional vertical translate on mobile, applied AFTER scale so it actually
    // shifts the rendered photo within the hero box. We need this because most
    // source photos have the same aspect ratio as the mobile container after
    // object-cover scales them to fit height — meaning object-position Y% has
    // zero effect (no vertical room to slide). translateY operates on the
    // already-rendered IMG, so it's the only knob that actually moves the
    // subject up/down on mobile. Use any CSS length, e.g. "5%" or "-30px".
    mobileTranslateY?: string;
    // Optional horizontal translate on mobile (same rationale as translateY,
    // for the case where object-position X% has hit its 0/100% rail). Negative
    // values move the subject left in the frame.
    mobileTranslateX?: string;
  };
  arrow: {
    desktop: { top: string; left: string; rotation?: string };
    mobile: { top: string; right: string; rotation?: string };
  };
  // Optional per-tutor hero text override. Use when the bg image is busy/light
  // and the default dark headline would get lost (e.g. a cherry-blossom photo).
  // Applies to both the homepage carousel hero and the per-tutor guide hero.
  hero?: {
    textColor?: string;
    textShadow?: string;
    // Optional radial/linear overlay drawn above the bg photo and below the
    // text. Use any CSS background value. Helpful when the photo's top-left
    // (where the headline sits on desktop) needs darkening for legibility.
    overlay?: string;
  };
  // Optional per-tutor subtitle override (HTML allowed; use <br/> for line
  // break). Falls back to the i18n "guide.subtitle" string when absent.
  subtitle?: {
    en?: string;
  };
}

const tutorPageConfig: Record<string, TutorPageConfig> = {
  "korean-mia": {
    photo: {
      desktop: "55% 15%",
      mobile: "98% 50%",
      mobileTranslateY: "10%",
      mobileTranslateX: "-3%",
    },
    arrow: {
      desktop: { top: "65%", left: "85%" },
      mobile: { top: "38%", right: "4%" },
    },
    hero: {
      textColor: "#FFFFFF",
      textShadow: "0 0 14px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.4)",
      overlay: "radial-gradient(ellipse 95% 65% at 0% 0%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)",
    },
    subtitle: {
      en: "Get Mia's weekly set of Korean listening & speaking lessons<br/>centered around her daily life in Korea",
    },
  },
  "english-adam": {
    photo: {
      desktop: "87% 33%",
      mobile: "100% 50%",
      mobileTranslateY: "7%",
      mobileTranslateX: "-3%",
    },
    arrow: {
      desktop: { top: "73%", left: "76%" },
      mobile: { top: "50%", right: "8%" },
    },
    hero: {
      textColor: "#FFFFFF",
      textShadow: "0 0 14px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.4)",
      overlay: "radial-gradient(ellipse 95% 65% at 0% 0%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)",
    },
    subtitle: {
      en: "Get Adam's weekly set of English listening & speaking lessons<br/>centered around his daily life across New York City & Seoul",
    },
  },
  "korean-chan": {
    photo: {
      desktop: "center top",
      mobile: "85% 20%",
      mobileScale: 1.08,
      mobileTranslateY: "-6%",
      mobileTranslateX: "-2%",
    },
    arrow: {
      desktop: { top: "50%", left: "55%" },
      mobile: { top: "20%", right: "5%" },
    },
    hero: {
      textColor: "#FFFFFF",
      // Soft glow + tight drop. The glow detaches the text from the busy
      // cherry-blossom photo; the tight drop adds crisp definition without
      // looking blurry.
      textShadow: "0 0 14px rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.4)",
      // Radial oval anchored to the top-left, fading to transparent ~2/3
      // across — darkens the area behind the headline without dimming the rest.
      overlay: "radial-gradient(ellipse 95% 65% at 0% 0%, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0) 100%)",
    },
    subtitle: {
      en: "Get Chan's weekly set of Korean listening & speaking lessons<br/>centered around his daily life in Korea",
    },
  },
};

const defaultConfig: TutorPageConfig = {
  photo: {
    desktop: "center top",
    mobile: "center top",
  },
  arrow: {
    desktop: { top: "50%", left: "55%" },
    mobile: { top: "20%", right: "5%" },
  },
};

export function getTutorPageConfig(slug: string): TutorPageConfig {
  return tutorPageConfig[slug] ?? defaultConfig;
}
