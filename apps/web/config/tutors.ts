export interface TutorPageConfig {
  photo: {
    desktop: string; // CSS object-position, e.g. "70% 20%"
    mobile: string;
  };
  arrow: {
    desktop: { top: string; left: string; rotation?: string };
    mobile: { top: string; right: string; rotation?: string };
  };
}

const tutorPageConfig: Record<string, TutorPageConfig> = {
  "korean-mia": {
    photo: {
      desktop: "center 20%",
      mobile: "86% 20%",
    },
    arrow: {
      desktop: { top: "55%", left: "65%" },
      mobile: { top: "43%", right: "4%" },
    },
  },
  "english-adam": {
    photo: {
      desktop: "70% 20%",
      mobile: "80% 55%",
    },
    arrow: {
      desktop: { top: "45%", left: "55%" },
      mobile: { top: "55%", right: "8%" },
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
