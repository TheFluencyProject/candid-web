// Lesson page path arm, desktop: the left column is vertically centred, so its top moves with the window height and the
// title's lines; the path's first part starts on that line (Adam 11/18: the right side must not start above the left).
// Read inside the sticky column, so it holds while scrolled (both columns share the grid row's top).
// Self-contained on purpose (no imports, no outer references): the page also inlines this function's source as a
// script right after the path, so it's placed before first paint — no jump, no fade-in. LessonPagePath reruns it on resize.
export function alignLessonPath(heroId: string) {
  const hero = document.getElementById(heroId);
  const root = document.querySelector<HTMLElement>(".lpp");
  const first = hero?.firstElementChild;
  if (!hero || !root || !first) return;
  root.style.setProperty("--lpp-top", `${first.getBoundingClientRect().top - hero.getBoundingClientRect().top}px`);
}
