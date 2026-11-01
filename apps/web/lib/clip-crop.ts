// A marketing clip's admin-picked horizontal framing (MarketingClip.crop_center: 0-1 centre of the
// visible slice of the video's width). Null/absent = centred, the old look.

/** object-position x for an object-cover picture so its visible slice centres on `center`. */
export function cover_position_x(center: number | null | undefined, media_aspect: number, box_aspect: number): string {
  const visible = Math.min(box_aspect / media_aspect, 1);
  if (center == null || visible >= 1) return "50%";
  return `${Math.min(1, Math.max(0, (center - visible / 2) / (1 - visible))) * 100}%`;
}

/** Left edge (source px) of a `slice_w`-wide slice of a `w`-wide frame centred on `center`. */
export function crop_slice_x(center: number | null | undefined, w: number, slice_w: number): number {
  if (center == null) return (w - slice_w) / 2;
  return Math.min(w - slice_w, Math.max(0, center * w - slice_w / 2));
}
