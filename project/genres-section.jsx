/* global React, gsap, ScrollTrigger */
const { useRef, useEffect } = React;

/* ------------------------------------------------------------------ */
/*  Genre rows                                                        */
/*  All rows share style now \u2014 weight 900, upright, canvas-shade.  */
/* ------------------------------------------------------------------ */
const GENRE_ROWS = [
["Self-development", "Productivity", "Habits", "Psychology",
"Mindfulness", "Communication", "Confidence", "Focus"],
["Business", "Leadership", "Strategy", "Marketing",
"Finance", "Investing", "Entrepreneurship", "Negotiation"],
["History", "Biography", "Memoir", "Politics",
"Society", "Culture", "Essays", "Travel"],
["Science", "Technology", "Innovation", "Health",
"Philosophy", "Creativity", "Nature", "Design"]];


const DIRECTIONS = [-1, 1, -1, 1]; // alternating row direction
const SEPARATOR = "\u00a0\u00b7\u00a0"; // middot, used between every genre
// How far each row translates relative to its content width. Kept very
// gentle — the horizontal motion is for atmosphere, not for revealing all
// genres. ~1–2 genres slide past per row before the section unpins.
const TRAVEL_FRACTION = 0.15;

/* ------------------------------------------------------------------ */
/*  GenresSection \u2014 pinned horizontal scroll                        */
/* ------------------------------------------------------------------ */
function GenresSection() {
  const sectionRef = useRef(null);
  const innerRef = useRef(null);
  const headingRef = useRef(null);
  const trackRefs = [useRef(null), useRef(null), useRef(null), useRef(null)];

  useEffect(() => {
    if (typeof ScrollTrigger === "undefined") return;
    const section = sectionRef.current;
    const heading = headingRef.current;
    if (!section || !heading) return;

    const triggers = [];

    // ---------- Morph entry: heading reveal (scoped to this section) ----
    const eyebrowEl = heading.querySelector(".badge");
    const h1El = heading.querySelector(".t-h1");
    const rowEls = section.querySelectorAll(".genre-row");

    const entryTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: "top 85%",
        end: "top 35%",
        scrub: 1
      }
    });
    triggers.push(entryTl.scrollTrigger);
    if (eyebrowEl) entryTl.from(eyebrowEl, { opacity: 0, y: 20, duration: 0.5 });
    if (h1El) entryTl.from(h1El, { opacity: 0, y: 40, duration: 0.7, ease: "power3.out" }, "-=0.3");
    if (rowEls.length) entryTl.from(rowEls, { opacity: 0, y: 40, duration: 0.6, stagger: 0.08, ease: "power3.out" }, "-=0.3");

    // ---------- Pinned horizontal scrub ----------
    const setupHorizontal = () => {
      const tracks = trackRefs.map((r, i) => {
        const el = r.current;
        if (!el) return null;
        // halfWidth = width of one copy (content is duplicated 2\u00d7 in the DOM)
        const half = el.scrollWidth / 2;
        const dir = DIRECTIONS[i];
        const travel = half * TRAVEL_FRACTION;
        // For dir=-1 (right-to-left): start at 0, end at -travel
        // For dir=+1 (left-to-right): start at -travel, end at 0
        const fromX = dir === 1 ? -travel : 0;
        const toX = dir === 1 ? 0 : -travel;
        gsap.set(el, { x: fromX });
        return { el, fromX, toX };
      }).filter(Boolean);

      const horizontalTl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          // Vertical scroll budget while pinned. Higher = slower horizontal
          // motion per pixel of vertical scroll.
          end: () => "+=" + window.innerHeight * 1.4,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true
        }
      });
      triggers.push(horizontalTl.scrollTrigger);

      tracks.forEach(({ el, toX }) => {
        horizontalTl.to(el, { x: toX, ease: "none" }, 0);
      });
    };

    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => {
        setupHorizontal();
        ScrollTrigger.refresh();
        if (window.lucide) window.lucide.createIcons();
      });
    } else {
      setupHorizontal();
      if (window.lucide) window.lucide.createIcons();
    }

    return () => {
      triggers.forEach((t) => t && t.kill && t.kill());
    };
  }, []);

  // Pre-build each row's text (content duplicated 2\u00d7 so loop is seamless).
  const rowText = (items) => {
    const joined = items.join(SEPARATOR);
    return joined + SEPARATOR + joined + SEPARATOR;
  };

  return (
    <section
      ref={sectionRef}
      data-screen-label="02 Genres"
      className="genres-section">
      
      <div ref={innerRef} className="genres-inner">
        {/* ---------- Heading (top-left, editorial) — original copy ---------- */}
        <div ref={headingRef} className="genres-heading" style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-start' }}>
          <span className="badge badge-pop" style={{ marginBottom: 24, fontSize: "14px" }}>
            <i data-lucide="book-open" width="14" height="14"></i>
            How it works
          </span>
          <p
            className="t-h1"
            style={{
              margin: 0,
              maxWidth: 920,
              color: "var(--ink)",
              textWrap: "pretty",
              lineHeight: "1.1", fontSize: "46px", fontFamily: "\"GT Super Display Trial\"", fontWeight: "900", letterSpacing: "-1px"
            }}>Three steps from a great book to a clear insight you can use today.




          </p>
        </div>

        {/* ---------- Rows (full-bleed so text flows to viewport edges) ----- */}
        <div className="genres-rows" role="list">
          {GENRE_ROWS.map((items, i) =>
          <div key={i} className="genre-row" role="listitem">
              <div
              ref={trackRefs[i]}
              className="genre-track" style={{ fontFamily: "Outfit", opacity: "0.3" }}>
              
                {rowText(items)}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>);

}

window.GenresSection = GenresSection;