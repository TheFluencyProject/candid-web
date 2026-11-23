import type { Locale } from "@/i18n/routing";

// NEXT_PUBLIC_ (a client component reads this too) so a local run can point at the dev API
// (https://dev.api.joincandid.co). Unset everywhere deployed = prod.
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "https://api.joincandid.co";

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
  web_letter?: string | null;
  web_signature_url?: string | null;
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

// ── Creator invite page (joincandid.co/invite/{username}) ───────────

export interface CreatorInvite {
  name: string;
  teaching_language: string;
}

// null = no invite (unknown username, or the creator already signed their agreement).
// revalidate 60 matches the API's s-maxage, so signing turns the page off within ~1 minute.
export async function fetchCreatorInvite(username: string): Promise<CreatorInvite | null> {
  const res = await fetch(
    `${API_BASE_URL}/public/creator-invites/${encodeURIComponent(username)}`,
    { next: { revalidate: 60 }, signal: AbortSignal.timeout(8000) }
  );
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`fetchCreatorInvite(${username}): HTTP ${res.status}`);
  }
  return res.json();
}

// ── Public lessons (share page + home lessons ladder) ───────────────

export interface LessonMeta {
  lesson_id: string;
  source_id: string | null;
  source_type: string;
  orientation: "vertical" | "horizontal" | null;
  title: string;
  thumbnail_url: string;
  // Centre of the full-width square the tutor framed, 0-1 of image height. Optional so the page
  // keeps working against an API that predates the field; null/absent = plain centring.
  thumbnail_focus_y?: number | null;
  // Horizontal thumbnails: 0-1 centre of the slice a tall crop should show. null/absent = centred.
  thumbnail_focus_x?: number | null;
  localized_title: string;
  tutor_name: string;
  tutor_slug: string;
  teaching_language: string;
  difficulty_band: string | null;
  accent_color?: string | null;
}

// Returns null only for genuine 404 ("no such lesson"). Transient failures
// (timeout, 5xx, network) THROW so Next.js keeps the previous good cached
// value instead of caching the failure for the 1-week revalidate window.
export async function fetchLessonMeta(id: string, locale: string): Promise<LessonMeta | null> {
  // tv = title version: bump to drop week-old cached titles (2 = titles backfilled in every locale, 11/01;
  // 3 = the home path's part titles filled in every locale, 11/17).
  const res = await fetch(`${API_BASE_URL}/public/lessons/${id}?locale=${locale}&tv=3`, {
    next: { revalidate: 604800 },
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`fetchLessonMeta(${id}, ${locale}): HTTP ${res.status}`);
  }
  return res.json();
}

// The lesson's whole in-app path (GET /public/lessons/:id/path): every mini lesson of the visible split
// group, its coins in the app's order, its sticker, and the Dialogue / Unit Review tail.
export type LessonPathNodeKind = "watch" | "speak" | "vocab" | "quiz";
export interface LessonPathData {
  hub_nodes_per_indent: number;
  units: {
    // Only in the asked locale (emoji appended); null = no title in that language → "PART n" alone.
    title: string | null;
    watch_seconds: number;
    sticker: { url: string; width: number; height: number } | null;
    nodes: { kind: LessonPathNodeKind; goal?: number }[];
  }[];
  tail: { dialogue: boolean; review: boolean };
}

// The path is an extra: any failure (404 until the route reaches prod, timeout, 5xx) → null, and the page
// shows today's hero instead. 1 h cache: stickers are made after a lesson's first opens.
export async function fetchLessonPath(id: string, locale: string): Promise<LessonPathData | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/public/lessons/${id}/path?locale=${locale}`, {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const data: LessonPathData = await res.json();
    return data.units?.length ? data : null;
  } catch {
    return null;
  }
}

// ── Marketing clips (joincandid.co hero) ─────────────────────────────

export interface WordLevelCaption {
  text: string;
  start_time: number;
  end_time: number;
}

export interface MarketingClip {
  lesson_id: string;
  caption_segment_id: string;
  tutor_name: string;
  /** Optional: absent until the backend ships it — the card falls back to an initial. */
  tutor_profile_picture_url?: string | null;
  title: string;
  text: string;
  translation: string | null;
  word_level_captions: WordLevelCaption[] | null;
  start_time: number;
  end_time: number;
  mux_playback_id: string;
  thumbnail_url: string | null;
  /** 0-1 centre of the visible slice when a horizontal clip is cropped. Optional: absent until the backend ships it; null/absent = centred. */
  crop_center?: number | null;
  /** A tutor's dashboard-starred pick. Optional: absent until the backend ships it. */
  featured?: boolean;
}

/**
 * Fetch live marketing clips. No opts → the home hero (one caption segment per recent
 * lesson of every active tutor). `opts.slug` → that tutor's own random handful (card
 * marquee). `opts.language` → one clip per recent lesson of every active tutor teaching
 * that language (the tutor page's "other creators" row). Throws on transient failure so
 * Next's data cache serves the last good render; callers fall back on throw.
 */
export async function fetchMarketingClips(
  locale: string,
  opts?: { slug?: string; language?: string },
): Promise<MarketingClip[]> {
  const { slug, language } = opts ?? {};
  const path = slug
    ? `/public/tutors/${slug}/marketing-clips?locale=${locale}`
    : `/public/marketing-clips?locale=${locale}${language ? `&language=${encodeURIComponent(language)}` : ""}`;
  const res = await fetch(
    `${API_BASE_URL}${path}`,
    { next: { revalidate: 300 }, signal: AbortSignal.timeout(8000) }
  );
  // 404 = endpoint not deployed yet / unknown slug → treat as "no clips", not an error,
  // so web can ship ahead of the backend without the marquee throwing.
  if (res.status === 404) return [];
  if (!res.ok) {
    throw new Error(`fetchMarketingClips(${locale}${slug ? `, slug=${slug}` : language ? `, language=${language}` : ""}): HTTP ${res.status}`);
  }
  const body = (await res.json()) as { clips?: MarketingClip[] };
  // Starred (dashboard-approved) clips only, for every caller — unstarred fill never ships.
  return (body.clips ?? []).filter((c) => c.featured);
}

// ── Web signup (Join-for-free) ───────────────────────────────────────

export interface WebSignupPayload {
  id_token: string;
  tutor_slug: string;
  display_name?: string | null;
  locale: Locale;
  auth_provider: "apple" | "google";
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

// ── Android waitlist (Download tap on Android) ───────────────────────

export type AndroidWaitlistSurface = "tutor" | "lesson" | "site";

export interface AndroidWaitlistPayload {
  email: string;
  tutor_slug: string | null;
  surface: AndroidWaitlistSurface;
  locale: string | null;
}

/**
 * Join the Android waitlist. Public endpoint (no auth) — backend stores the email in
 * android_waitlist and pings Slack. A repeat email still returns ok.
 */
export async function submit_android_waitlist(payload: AndroidWaitlistPayload): Promise<{ ok: boolean }> {
  const res = await fetch(`${API_BASE_URL}/public/android-waitlist`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error(`submit_android_waitlist: HTTP ${res.status}`);
  }
  return res.json();
}

// ── Match request (candidtutors.co/ intake) ───────────────────────────

export interface MatchRequestPayload {
  first_name: string;
  last_name: string;
  email: string;
  answers: Record<string, unknown>;
}

/**
 * Submit the candidtutors.co/ "Get matched with a tutor" intake. Public
 * endpoint (no auth) — backend stores the row in tutor_match_requests and
 * pings Slack for manual followup.
 */
export async function submit_match_request(payload: MatchRequestPayload): Promise<{ id: string }> {
  const res = await fetch(`${API_BASE_URL}/public/match-requests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) {
    throw new Error(`submit_match_request: HTTP ${res.status}`);
  }
  return res.json();
}
