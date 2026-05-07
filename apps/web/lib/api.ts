export const API_BASE_URL = "https://api.joincandid.co";

export interface TutorLanguageProficiency {
  language: string;
  level: string;
}

export interface TutorMetadata {
  name_kr?: string;
  [key: string]: unknown;
}

export interface Tutor {
  slug: string;
  name: string;
  title: string;
  cool_title?: string;
  web_title_override?: string | null;
  short_description?: string;
  city: string | null;
  birthday: string | null;
  instagram_handle: string | null;
  tiktok_handle: string | null;
  youtube_handle: string | null;
  profile_picture_url: string | null;
  large_profile_picture_url: string | null;
  intro_video_url: string | null;
  intro_video_mux_playback_id?: string | null;
  intro_video_urls_by_locale?: Record<string, string>;
  screenshot_community_url: string | null;
  screenshot_intro_url: string | null;
  screenshot_learn_url: string | null;
  screenshot_listen_url: string | null;
  screenshot_map_url: string | null;
  screenshot_shadow_url: string | null;
  screenshot_week_url: string | null;
  web_bg_picture_url: string | null;
  chat_background_url?: string | null;
  personal_photo_urls?: string[] | null;
  languages: TutorLanguageProficiency[];
  teaching_language: string;
  metadata: TutorMetadata | null;
}

export async function fetchTutor(
  slug: string,
  locale: string
): Promise<Tutor | null> {
  try {
    const res = await fetch(
      `${API_BASE_URL}/public/tutors/${slug}?locale=${locale}`,
      { next: { revalidate: 300 } }
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
