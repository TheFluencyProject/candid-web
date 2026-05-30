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

/**
 * Fetch a tutor by slug. Returns null only for genuine 404 ("no such tutor").
 * Transient failures (timeout, 5xx, network) THROW intentionally — Next.js's
 * data cache keeps the previous good value when the data fn throws, so a
 * temporary API outage falls back to the last successful render instead of
 * poisoning the cache with an empty page for the SWR window.
 */
export async function fetchTutor(
  slug: string,
  locale: string
): Promise<Tutor | null> {
  const res = await fetch(
    `${API_BASE_URL}/public/tutors/${slug}?locale=${locale}`,
    // 8s ceiling so a stalled API can't hold SSR hostage. AbortSignal triggers
    // a TimeoutError which propagates as a thrown error — see fn comment above.
    { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`fetchTutor(${slug}, ${locale}): HTTP ${res.status}`);
  }
  return res.json();
}

// ── Web signup (Join-for-free) ───────────────────────────────────────

export interface WebSignupPayload {
  id_token: string;
  tutor_slug: string;
  display_name?: string | null;
  locale: "en" | "ko";
}

export interface WebSignupResponse {
  status: "ok";
  already_has_account: boolean;
}

/**
 * Submit the web "Join for free" signup. The backend creates a web_signups
 * row keyed on firebase_uid and fires the welcome email — both are idempotent,
 * so a flaky retry is safe.
 */
export async function submit_web_signup(payload: WebSignupPayload): Promise<WebSignupResponse> {
  const { id_token, ...body } = payload;
  const res = await fetch(`${API_BASE_URL}/account/web-signup`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${id_token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error(`submit_web_signup: HTTP ${res.status}`);
  }
  return res.json();
}
