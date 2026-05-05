export interface TutorPageConfig {
  photo: {
    desktop: string; // CSS object-position, e.g. "70% 20%"
    mobile: string;
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
  };
}

const tutorPageConfig: Record<string, TutorPageConfig> = {
  "korean-mia": {
    photo: {
      desktop: "center 10%",
      mobile: "95% 12%",
    },
    arrow: {
      desktop: { top: "65%", left: "85%" },
      mobile: { top: "38%", right: "4%" },
    },
  },
  "english-adam": {
    photo: {
      desktop: "70% 25%",
      mobile: "90% 20%",
    },
    arrow: {
      desktop: { top: "73%", left: "76%" },
      mobile: { top: "50%", right: "8%" },
    },
  },
  "korean-chan": {
    photo: {
      desktop: "center top",
      mobile: "center top",
    },
    arrow: {
      desktop: { top: "50%", left: "55%" },
      mobile: { top: "20%", right: "5%" },
    },
    hero: {
      textColor: "#FFFFFF",
      textShadow: "0 2px 6px rgba(0,0,0,0.55)",
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
