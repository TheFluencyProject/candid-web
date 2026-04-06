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
