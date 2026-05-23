/* global React */
const { useRef, useEffect, useState, useMemo } = React;

/* ------------------------------------------------------------------ */
/*  Easing                                                            */
/* ------------------------------------------------------------------ */
const easeInOutCubic = (t) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const smoothstep = (a, b, t) => {
  const x = clamp((t - a) / (b - a));
  return x * x * (3 - 2 * x);
};

/* ------------------------------------------------------------------ */
/*  Image plates — placeholder swatches with monospace labels.        */
/*  Replace `src` with a real image to drop in production photos.     */
/* ------------------------------------------------------------------ */
const PLATES = [
  {
    num: "01",
    chapter: "Pavilion",
    title: "Shelter shaped\nby weather.",
    bg: "linear-gradient(135deg, #b6a78a 0%, #8d7b5e 100%)",
    accent: "#f0e9dc",
    note: "[ PAVILION — exterior, dawn light ]",
  },
  {
    num: "02",
    chapter: "Trail",
    title: "Wayfinding\nas a quiet language.",
    bg: "linear-gradient(160deg, #4b5d4a 0%, #243024 100%)",
    accent: "#d9e0c8",
    note: "[ TRAIL — directional totem, forest floor ]",
  },
  {
    num: "03",
    chapter: "Plaza",
    title: "A bench is also\nan invitation.",
    bg: "linear-gradient(150deg, #cdb89a 0%, #7d6645 100%)",
    accent: "#1c1611",
    note: "[ PLAZA — modular seating, morning ]",
  },
  {
    num: "04",
    chapter: "Workshop",
    title: "Material first,\nform follows.",
    bg: "linear-gradient(135deg, #2a2a26 0%, #4a463d 100%)",
    accent: "#e9dfc8",
    note: "[ WORKSHOP — CNC bed, oak ]",
  },
  {
    num: "05",
    chapter: "Coast",
    title: "Built once,\nstanding long.",
    bg: "linear-gradient(160deg, #6e8694 0%, #2e3f4b 100%)",
    accent: "#f4ede0",
    note: "[ COAST — recycled-plastic walkway ]",
  },
];

/* ------------------------------------------------------------------ */
/*  Stripe pattern for placeholder plates — gives them texture so     */
/*  they don't feel like flat color blocks.                           */
/* ------------------------------------------------------------------ */
const StripeOverlay = () => (
  <div
    aria-hidden="true"
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage:
        "repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 2px, transparent 2px 14px)",
      mixBlendMode: "overlay",
      pointerEvents: "none",
    }}
  />
);

const GrainOverlay = () => (
  <div
    aria-hidden="true"
    style={{
      position: "absolute",
      inset: 0,
      backgroundImage:
        "radial-gradient(rgba(255,255,255,0.06) 1px, transparent 1px)",
      backgroundSize: "3px 3px",
      mixBlendMode: "soft-light",
      pointerEvents: "none",
    }}
  />
);

/* ------------------------------------------------------------------ */
/*  A single image "plate" inside the pinned hero. Its transform is   */
/*  driven by `p` (0..1) — the scroll progress for THIS plate's turn. */
/*                                                                    */
/*  motion modes:                                                     */
/*    flyby   — starts small at bottom, scales up past viewer & out  */
/*    parallax— slides upward through the frame at constant scale     */
/*    crossfade— scale + fade, no vertical translate                  */
/* ------------------------------------------------------------------ */
function Plate({ plate, p, motion, isActive, showLabel }) {
  // p is a signed value: -1 (off bottom) → 0 (centered/peak) → +1 (off top)
  // For "in view": -1..1
  let translateY = 0;
  let scale = 1;
  let opacity = 1;
  let frameOpacity = 1;

  if (motion === "flyby") {
    // Enter from bottom, small. Cross zero at peak (full size). Exit upward, oversized.
    // Translate: from +60vh (below) through 0 to -90vh (off top)
    translateY = p < 0 ? p * 60 : p * -90;
    // Scale: ramps from 0.55 → 1.0 → 1.25 (the "fly past" feel)
    if (p < 0) scale = 0.55 + (1 - 0.55) * (1 + p); // -1..0 -> 0.55..1.0
    else scale = 1 + 0.25 * p; // 0..1 -> 1..1.25
    // Fade ends a touch early on exit so we don't see a blunt cut
    opacity = clamp(1 - Math.max(0, p - 0.75) / 0.25);
    if (p < -0.85) opacity = clamp(1 + (p + 1) / 0.15); // fade in tail
  } else if (motion === "parallax") {
    translateY = p * -70; // straight slide up
    scale = 1.05;
    opacity = clamp(1 - Math.abs(p) * 0.8);
  } else if (motion === "crossfade") {
    translateY = 0;
    scale = 1 + (1 - Math.abs(p)) * 0.04 + Math.max(0, p) * 0.06;
    opacity = clamp(1 - Math.pow(Math.abs(p), 1.4));
  }

  // Inner-frame (the wide image-card label) reveals only when near-center
  const proximity = 1 - Math.min(1, Math.abs(p) * 1.4);
  const labelOpacity = easeOutCubic(clamp(proximity));

  // Hide entirely when far away to save paint
  if (Math.abs(p) >= 1.05) opacity = 0;

  return (
    <div
      aria-hidden={!isActive}
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        willChange: "transform, opacity",
        transform: `translate3d(0, ${translateY}vh, 0) scale(${scale})`,
        opacity,
        transition: "opacity 120ms linear",
      }}
    >
      {/* Image card — not full-bleed: leaves a margin so the bg tone breathes */}
      <figure
        style={{
          position: "relative",
          margin: 0,
          width: "min(78vw, 1280px)",
          height: "min(72vh, 760px)",
          background: plate.bg,
          overflow: "hidden",
          boxShadow:
            "0 40px 80px -30px rgba(0,0,0,0.45), 0 8px 24px -12px rgba(0,0,0,0.25)",
        }}
      >
        <StripeOverlay />
        <GrainOverlay />

        {/* Top-left: number */}
        <div
          className="mono"
          style={{
            position: "absolute",
            top: 24,
            left: 28,
            color: plate.accent,
            fontSize: 12,
            fontWeight: 500,
            opacity: 0.85,
            letterSpacing: "0.14em",
            textTransform: "uppercase",
          }}
        >
          {plate.num} — {plate.chapter}
        </div>

        {/* Bottom-right: placeholder note (so user knows it's a slot) */}
        {showLabel && (
          <div
            className="mono"
            style={{
              position: "absolute",
              bottom: 22,
              right: 28,
              color: plate.accent,
              fontSize: 10,
              opacity: 0.7,
              letterSpacing: "0.1em",
            }}
          >
            {plate.note}
          </div>
        )}

        {/* Center hairline crosshair — proper "image placeholder" hint */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.18,
          }}
        >
          <div
            style={{
              width: 1,
              height: "70%",
              background: plate.accent,
            }}
          />
          <div
            style={{
              position: "absolute",
              width: "70%",
              height: 1,
              background: plate.accent,
            }}
          />
        </div>

        {/* Plate caption — bottom-left chapter title, reveals near peak */}
        <figcaption
          style={{
            position: "absolute",
            left: 28,
            bottom: 60,
            color: plate.accent,
            opacity: labelOpacity * 0.95,
            transform: `translateY(${(1 - labelOpacity) * 14}px)`,
            transition: "none",
            maxWidth: "60%",
            fontFamily: "Fraunces, Georgia, serif",
            fontWeight: 300,
            fontSize: "clamp(28px, 3.2vw, 48px)",
            lineHeight: 1.05,
            letterSpacing: "-0.01em",
            whiteSpace: "pre-line",
          }}
        >
          {plate.title}
        </figcaption>
      </figure>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  HERO — the whole pinned scroll experience.                        */
/*  We use a tall outer container; the inner stage is position:sticky */
/*  pinned at viewport-top for the duration of the scroll budget.     */
/* ------------------------------------------------------------------ */
function Hero({ tweaks }) {
  const outerRef = useRef(null);
  const [progress, setProgress] = useState(0); // 0..1 across the whole hero scroll
  const slides = PLATES.slice(0, tweaks.slideCount);
  const N = slides.length;

  // Total scroll budget: 1 viewport for intro + N viewports for plates + 0.5 outro
  const scrollVH = useMemo(
    () => (1 + N * 1.0 * tweaks.scrollSpeed + 0.5),
    [N, tweaks.scrollSpeed]
  );

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = outerRef.current;
        if (!el) return;
        const r = el.getBoundingClientRect();
        const total = r.height - window.innerHeight;
        const scrolled = -r.top;
        setProgress(clamp(scrolled / Math.max(1, total)));
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      cancelAnimationFrame(raf);
    };
  }, []);

  // Map global progress to per-plate p ∈ [-1, +1].
  // Intro takes 0..1/(N+1.5); each plate occupies 1/(N+1.5) of progress.
  const seg = 1 / (N + 1.5);
  const introEnd = seg; // 1 vh
  const plateStart = (i) => introEnd + i * seg;
  const plateEnd = (i) => introEnd + (i + 1) * seg;

  // Title visibility: visible during intro + first half of plate-stack, then fades
  const titleAlpha = (() => {
    if (progress < introEnd) return 1;
    // fade across the first plate transition
    const t = (progress - introEnd) / (seg * N);
    return clamp(1 - Math.pow(t, 1.8));
  })();

  // Compute active plate index (the one closest to center)
  const activeIdx = (() => {
    if (progress <= introEnd) return -1;
    let best = 0;
    let bestDist = Infinity;
    for (let i = 0; i < N; i++) {
      const mid = (plateStart(i) + plateEnd(i)) / 2;
      const d = Math.abs(progress - mid);
      if (d < bestDist) { bestDist = d; best = i; }
    }
    return best;
  })();

  // Scroll-hint fade
  const scrollHintAlpha = clamp(1 - progress * 14);

  return (
    <section
      ref={outerRef}
      data-screen-label="01 Hero"
      style={{
        position: "relative",
        height: `${scrollVH * 100}vh`,
        background: "var(--bg)",
      }}
    >
      {/* Pinned stage */}
      <div
        style={{
          position: "sticky",
          top: 0,
          height: "100vh",
          overflow: "hidden",
        }}
      >
        {/* ---------- Top chrome ---------- */}
        <header
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            padding: "26px 36px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            zIndex: 30,
            mixBlendMode: progress > introEnd ? "difference" : "normal",
            color: progress > introEnd ? "#f5efe2" : "var(--ink)",
            transition: "color 200ms linear",
          }}
        >
          <div
            style={{
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 400,
              fontSize: 22,
              letterSpacing: "-0.01em",
            }}
          >
            Meridian<span style={{ verticalAlign: "super", fontSize: 10 }}>®</span>
          </div>
          <nav
            className="mono"
            style={{
              display: "flex",
              gap: 28,
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            <a href="#">Work</a>
            <a href="#">Studio</a>
            <a href="#">Journal</a>
            <a href="#">Contact</a>
          </nav>
        </header>

        {/* ---------- Plates layer ---------- */}
        <div style={{ position: "absolute", inset: 0, zIndex: 10 }}>
          {slides.map((plate, i) => {
            const ps = plateStart(i);
            const pe = plateEnd(i);
            // local: -1 when scroll is at ps - seg, 0 at center, +1 at pe + seg
            // we want the plate to enter slightly before its segment & exit slightly after
            const mid = (ps + pe) / 2;
            const half = (pe - ps) / 2 + seg * 0.5; // overlap with neighbors
            const local = clamp((progress - mid) / half, -1.5, 1.5);
            return (
              <Plate
                key={i}
                plate={plate}
                p={local}
                motion={tweaks.motion}
                isActive={i === activeIdx}
                showLabel={tweaks.showPlateLabels}
              />
            );
          })}
        </div>

        {/* ---------- Centered title (the "content placed in middle") ---------- */}
        <div
          aria-hidden={titleAlpha < 0.05}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            pointerEvents: "none",
            opacity: titleAlpha,
            transform: `translateY(${(1 - titleAlpha) * -20}px)`,
          }}
        >
          <h1
            style={{
              margin: 0,
              padding: "0 24px",
              fontFamily: "Fraunces, Georgia, serif",
              fontWeight: 300,
              fontSize: "clamp(48px, 9vw, 168px)",
              lineHeight: 0.92,
              letterSpacing: "-0.03em",
              textAlign: "center",
              color: "var(--ink)",
              maxWidth: "1400px",
              mixBlendMode: "difference",
              color: "#f5efe2",
            }}
          >
            Spaces for people,<br />
            <em style={{ fontStyle: "italic", fontWeight: 300 }}>made for life.</em>
          </h1>
        </div>

        {/* ---------- Bottom-left tagline ---------- */}
        <div
          className="mono"
          style={{
            position: "absolute",
            left: 36,
            bottom: 28,
            zIndex: 25,
            fontSize: 11,
            letterSpacing: "0.16em",
            textTransform: "uppercase",
            color: progress > introEnd ? "#f5efe2" : "var(--ink-muted)",
            mixBlendMode: progress > introEnd ? "difference" : "normal",
            transition: "color 200ms linear",
            opacity: 0.85,
          }}
        >
          Made&nbsp;to&nbsp;Last&nbsp;·&nbsp;Est.&nbsp;2014
        </div>

        {/* ---------- Bottom-center scroll hint ---------- */}
        <div
          className="mono"
          style={{
            position: "absolute",
            left: "50%",
            bottom: 28,
            transform: "translateX(-50%)",
            zIndex: 25,
            fontSize: 11,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: scrollHintAlpha,
            color: progress > introEnd ? "#f5efe2" : "var(--ink)",
            mixBlendMode: progress > introEnd ? "difference" : "normal",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          Scroll to explore
          <span
            style={{
              display: "inline-block",
              width: 28,
              height: 1,
              background: "currentColor",
              opacity: 0.6,
            }}
          />
          ↓
        </div>

        {/* ---------- Bottom-right counter ---------- */}
        {tweaks.showCounter && (
          <div
            className="mono"
            style={{
              position: "absolute",
              right: 36,
              bottom: 28,
              zIndex: 25,
              fontSize: 11,
              letterSpacing: "0.14em",
              color: progress > introEnd ? "#f5efe2" : "var(--ink)",
              mixBlendMode: progress > introEnd ? "difference" : "normal",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ opacity: 0.55 }}>Index</span>
            <span style={{ fontSize: 22, fontFamily: "Fraunces, Georgia, serif" }}>
              {String(Math.max(0, activeIdx + 1)).padStart(2, "0")}
            </span>
            <span style={{ opacity: 0.4 }}>/ {String(N).padStart(2, "0")}</span>
          </div>
        )}

        {/* ---------- Progress rail (right edge) ---------- */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            right: 16,
            top: "20%",
            bottom: "20%",
            width: 1,
            background: "rgba(26,25,22,0.15)",
            zIndex: 25,
            mixBlendMode: progress > introEnd ? "difference" : "normal",
          }}
        >
          <div
            style={{
              position: "absolute",
              left: -2,
              top: `${progress * 100}%`,
              width: 5,
              height: 5,
              borderRadius: "50%",
              background: progress > introEnd ? "#f5efe2" : "var(--ink)",
              transform: "translateY(-50%)",
            }}
          />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Section AFTER the hero — proves the pinned scroll releases cleanly */
/* ------------------------------------------------------------------ */
function AfterHero() {
  return (
    <section
      data-screen-label="02 After hero"
      style={{
        background: "var(--bg)",
        padding: "12vh 8vw",
        borderTop: "1px solid var(--rule)",
      }}
    >
      <div
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          marginBottom: 32,
        }}
      >
        § Continued — Studio note
      </div>
      <p
        style={{
          margin: 0,
          maxWidth: 920,
          fontFamily: "Fraunces, Georgia, serif",
          fontWeight: 300,
          fontSize: "clamp(28px, 3vw, 44px)",
          lineHeight: 1.18,
          letterSpacing: "-0.01em",
          textWrap: "pretty",
        }}
      >
        Going beyond the expected is our calling. True sustainability demands
        creativity aligned with strict principles — keeping us on a long
        journey of measured, considered work.
      </p>
      <div
        className="mono"
        style={{
          marginTop: 80,
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
        }}
      >
        (Scroll back up to replay the hero.)
      </div>
    </section>
  );
}

window.Hero = Hero;
window.AfterHero = AfterHero;
