export interface TutorPageConfig {
  arrow: {
    desktop: { top: string; left: string; rotation?: string };
    mobile: { top: string; right: string; rotation?: string };
  };
  photoPosition?: string;
}

const tutorPageConfig: Record<string, TutorPageConfig> = {
  "korean-mia": {
    arrow: {
      desktop: { top: "55%", left: "65%" },
      mobile: { top: "28%", right: "4%" },
    },
    photoPosition: "center top",
  },
  "english-adam": {
    arrow: {
      desktop: { top: "45%", left: "55%" },
      mobile: { top: "22%", right: "8%" },
    },
    photoPosition: "70% top",
  },
};

export function getTutorPageConfig(slug: string): TutorPageConfig {
  return (
    tutorPageConfig[slug] ?? {
      arrow: {
        desktop: { top: "50%", left: "55%" },
        mobile: { top: "20%", right: "5%" },
      },
      photoPosition: "center top",
    }
  );
}
