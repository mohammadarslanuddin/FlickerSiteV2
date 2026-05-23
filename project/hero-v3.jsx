/* global React, gsap */
const { useRef, useEffect, useState } = React;

/* ------------------------------------------------------------------ */
/*  Book covers                                                       */
/* ------------------------------------------------------------------ */
const BOOKS = [
"books/01.png", "books/02.png", "books/03.png", "books/04.png",
"books/05.png", "books/06.png", "books/07.png", "books/08.png",
"books/09.png", "books/10.png", "books/11.png", "books/12.png",
"books/13.png"];


function loadImages(srcs) {
  return Promise.all(
    srcs.map(
      (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null);
        img.src = src;
      })
    )
  ).then((arr) => arr.filter(Boolean));
}

/* ------------------------------------------------------------------ */
/*  Hero — auto-animated canvas flythrough of book covers.            */
/* ------------------------------------------------------------------ */
function HeroV3({ tweaks }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const rotatorRef = useRef(null);
  const scrollIndRef = useRef(null); // wrapper that fades / re-enters on scroll
  const scrollTextRef = useRef(null); // "Scroll" word — split into chars on init
  const scrollLineRef = useRef(null); // hairline divider — scaleX reveal
  const scrollIconRef = useRef(null); // arrow icon wrapper — scale-in reveal
  const scrollArrowRef = useRef(null); // bouncing arrow target
  const bookCardOuterRef = useRef(null); // scroll-driven fade target
  const bookCardRef = useRef(null); // entrance + dismiss animation target
  const [bookCardDismissed, setBookCardDismissed] = useState(false);

  /* ---------- Headline rolling text (single-reel approach) ----------
     Per-character cell approach broke kerning AND mis-sized cells when the
     two phrases had different char widths at the same position. The cleaner
     pattern: two complete phrase blocks stacked inside one overflow-hidden
     viewport, animate the reel up by 50% (i.e. one phrase height) to swap.
     Native text rendering = native kerning = proper letter spacing. */
  useEffect(() => {
    const el = rotatorRef.current;
    if (!el) return;
    const PHRASES = ["Learn Smarter,", "Grow Faster,"];
    const DISPLAY_MS = 3000; // dwell time per phrase
    const ROLL_DURATION = 0.9;
    let idx = 0;
    let cancelled = false;
    let timeoutId = 0;

    // Configure the viewport (the rotator span itself)
    el.textContent = "";
    el.style.cssText =
    "display:inline-block;overflow:hidden;height:1em;" +
    "line-height:1;vertical-align:top;";

    const reel = document.createElement("span");
    reel.style.cssText = "display:block;will-change:transform;";
    el.appendChild(reel);

    const populate = (current, next) => {
      reel.textContent = "";
      const a = document.createElement("span");
      a.style.cssText =
      "display:block;line-height:1;text-align:center;white-space:nowrap;";
      a.textContent = current;
      const b = document.createElement("span");
      b.style.cssText =
      "display:block;line-height:1;text-align:center;white-space:nowrap;";
      b.textContent = next;
      reel.appendChild(a);
      reel.appendChild(b);
    };

    populate(PHRASES[0], PHRASES[1]);

    const tick = () => {
      if (cancelled) return;
      const current = PHRASES[idx];
      const next = PHRASES[(idx + 1) % PHRASES.length];
      populate(current, next);
      gsap.set(reel, { yPercent: 0 });
      gsap.to(reel, {
        yPercent: -50, // reel = 2 phrases tall; -50% → next phrase visible
        duration: ROLL_DURATION,
        ease: "power3.inOut",
        onComplete: () => {
          idx = (idx + 1) % PHRASES.length;
          timeoutId = window.setTimeout(tick, DISPLAY_MS);
        }
      });
    };

    timeoutId = window.setTimeout(tick, DISPLAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
      gsap.killTweensOf(reel);
    };
  }, []);

  /* ---------- Bouncing scroll-down arrow ---------- */
  useEffect(() => {
    const el = scrollArrowRef.current;
    if (!el) return;
    const tween = gsap.to(el, {
      y: 8,
      duration: 1.0,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });
    return () => tween.kill();
  }, []);

  /* ---------- Lucide icon hydration ----------
     Lucide's createIcons() walks the document and replaces every
     <i data-lucide="name"> with the matching SVG. We re-run it after each
     render that could (re)introduce <i> elements — e.g. the book card
     mounting/unmounting. */
  useEffect(() => {
    if (typeof window === "undefined" || !window.lucide) return;
    const id = requestAnimationFrame(() => window.lucide.createIcons());
    return () => cancelAnimationFrame(id);
  });

  /* ---------- GSAP hover layer ----------
     Modern hover scale/translate on the page's primary interactives, wired
     after mount. CSS still owns color/border transitions; this layer owns
     transform-based motion so it composes cleanly with entrance/dismiss
     tweens elsewhere. */
  useEffect(() => {
    const cleanups = [];

    const wire = (el, enter, leave) => {
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      el.addEventListener("mousedown", press);
      el.addEventListener("mouseup", release);
      cleanups.push(() => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
        el.removeEventListener("mousedown", press);
        el.removeEventListener("mouseup", release);
      });
    };

    // Press feedback: subtle squish on every CTA
    function press(e) {
      gsap.to(e.currentTarget, { scale: 0.97, duration: 0.12, ease: "power2.out", overwrite: "auto" });
    }
    function release(e) {
      gsap.to(e.currentTarget, { scale: 1.04, duration: 0.18, ease: "power2.out", overwrite: "auto" });
    }

    // Primary + Secondary CTAs \u2014 lift + scale on hover, arrow slides on primary
    document.querySelectorAll(".cta").forEach((el) => {
      const arrow = el.querySelector(".cta-arrow");
      const enter = () => {
        gsap.to(el, { scale: 1.04, y: -2, duration: 0.32, ease: "power3.out", overwrite: "auto" });
        if (arrow) gsap.to(arrow, { x: 4, duration: 0.32, ease: "power3.out", overwrite: "auto" });
      };
      const leave = () => {
        gsap.to(el, { scale: 1, y: 0, duration: 0.4, ease: "power3.out", overwrite: "auto" });
        if (arrow) gsap.to(arrow, { x: 0, duration: 0.4, ease: "power3.out", overwrite: "auto" });
      };
      wire(el, enter, leave);
    });

    // Nav links \u2014 micro lift + scale
    document.querySelectorAll(".nav-link").forEach((el) => {
      const enter = () =>
      gsap.to(el, { y: -1, scale: 1.04, duration: 0.25, ease: "power3.out", overwrite: "auto" });
      const leave = () =>
      gsap.to(el, { y: 0, scale: 1, duration: 0.3, ease: "power3.out", overwrite: "auto" });
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    });

    // Book-card dismiss (\u00d7) \u2014 gentle scale on hover, distinct from card lift
    document.querySelectorAll(".book-card-dismiss").forEach((el) => {
      const enter = () =>
      gsap.to(el, { scale: 1.18, duration: 0.22, ease: "power3.out", overwrite: "auto" });
      const leave = () =>
      gsap.to(el, { scale: 1, duration: 0.28, ease: "power3.out", overwrite: "auto" });
      el.addEventListener("mouseenter", enter);
      el.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        el.removeEventListener("mouseenter", enter);
        el.removeEventListener("mouseleave", leave);
      });
    });

    return () => cleanups.forEach((fn) => fn());
  }, [bookCardDismissed]); // re-wire after dismiss button mounts/unmounts

  /* ---------- Book of the week: entrance + scroll-driven fade -----------
     Two refs:
       • inner ref — handles entrance + dismiss animations
       • outer ref — receives the scroll-driven opacity/y/blur
     so the two effects never fight for the same transform. */
  useEffect(() => {
    if (bookCardDismissed) return;
    const inner = bookCardRef.current;
    const outer = bookCardOuterRef.current;
    if (!inner || !outer) return;

    // Entrance — slides up + scales in after a 3-second delay so it doesn't
    // compete with the headline / canvas reveal on first load.
    gsap.set(inner, { opacity: 0, y: 28, scale: 0.96 });
    gsap.to(inner, {
      opacity: 1, y: 0, scale: 1,
      duration: 0.85, delay: 3, ease: "power3.out"
    });

    // Scroll-driven defocus: as the hero scrolls past its first half, the
    // card fades, drifts down, and softly blurs out — a depth-of-field exit
    // rather than a hard opacity cut.
    let st = null;
    if (typeof ScrollTrigger !== "undefined" && wrapRef.current) {
      st = ScrollTrigger.create({
        trigger: wrapRef.current,
        start: "top top",
        end: "50% top",
        onUpdate: (self) => {
          const p = self.progress; // 0 → 1 across the first half of hero
          // Smooth easing on the scroll mapping for a more organic feel
          const eased = p * p * (3 - 2 * p); // smoothstep
          gsap.set(outer, {
            opacity: 1 - eased,
            y: eased * 24,
            filter: `blur(${eased * 5}px)`
          });
        }
      });
    }

    return () => {
      if (st) st.kill();
      gsap.killTweensOf([inner, outer]);
    };
  }, [bookCardDismissed]);

  /* ---------- Scroll indicator: char-split entry + ScrollTrigger reveal ----
     On mount we split "Scroll" into per-character spans and run a coordinated
     entry: chars unfold from below, hairline scales in, arrow pops with a
     gentle overshoot. When the user scrolls below the hero we fade the whole
     indicator out + push it down 16px. On scroll back up to the hero we
     replay the entry animation. */
  useEffect(() => {
    const indEl = scrollIndRef.current;
    const textEl = scrollTextRef.current;
    const lineEl = scrollLineRef.current;
    const iconEl = scrollIconRef.current;
    if (!indEl || !textEl || !lineEl || !iconEl) return;

    // Split "Scroll" into characters once
    textEl.textContent = "";
    const chars = [];
    for (const ch of "Scroll") {
      const s = document.createElement("span");
      s.style.cssText = "display:inline-block;will-change:transform;line-height:1;";
      s.textContent = ch;
      textEl.appendChild(s);
      chars.push(s);
    }

    // Coordinated reveal — chars rise + tilt back to upright, line draws in
    // from the left, arrow eases in with a slight overshoot.
    const reveal = () => {
      gsap.set(indEl, { opacity: 1, y: 0 });
      gsap.set(chars, { opacity: 0, yPercent: 110, rotateX: -90 });
      gsap.set(lineEl, { scaleX: 0, transformOrigin: "left center" });
      gsap.set(iconEl, { opacity: 0, scale: 0.3 });

      const tl = gsap.timeline();
      tl.to(chars, {
        opacity: 1, yPercent: 0, rotateX: 0,
        duration: 0.6, stagger: 0.04, ease: "power3.out"
      });
      tl.to(lineEl, {
        scaleX: 1, duration: 0.45, ease: "power3.out"
      }, "-=0.45");
      tl.to(iconEl, {
        opacity: 1, scale: 1, duration: 0.5, ease: "back.out(1.7)"
      }, "-=0.35");
      return tl;
    };

    const hide = () => {
      gsap.to(indEl, {
        opacity: 0, y: 16, duration: 0.35, ease: "power2.in"
      });
    };

    // Initial entry
    reveal();

    // Hide once user scrolls below the hero, replay when they come back
    let st = null;
    if (typeof ScrollTrigger !== "undefined" && wrapRef.current) {
      st = ScrollTrigger.create({
        trigger: wrapRef.current,
        start: "top top",
        end: "bottom 60%",
        onLeave: hide,
        onEnterBack: reveal
      });
    }

    return () => {
      if (st) st.kill();
      gsap.killTweensOf([indEl, chars, lineEl, iconEl]);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const ctx = canvas.getContext("2d");

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let W = 0,H = 0;
    let raf = 0;
    let cancelled = false;
    const tweens = [];
    const cards = [];

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      W = Math.max(1, r.width);
      H = Math.max(1, r.height);
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    // -------------------- perspective config --------------------
    const FOCAL = tweaks.perspective === "deep" ? 700 :
    tweaks.perspective === "flat" ? 1400 :
    950;
    const Z_FAR = 1400;
    const Z_NEAR = -260;
    const FADE_FAR_START = 1300;
    const FADE_FAR_END = 950;
    const FADE_NEAR_START = 60;
    const FADE_NEAR_END = -200;
    const SPREAD = 520 * tweaks.spread;
    const N = Math.max(2, Math.min(16, Math.round(tweaks.density)));
    const TRAVERSE = 7 / Math.max(0.2, tweaks.speed);
    const CARD_SIZE = tweaks.cardSize || 1;

    let lastImgIdx = -1;

    loadImages(BOOKS).then((images) => {
      if (cancelled || images.length === 0) return;

      for (let i = 0; i < N; i++) {
        cards.push({
          worldX: 0, worldY: 0, z: Z_FAR, rot: 0,
          imgIdx: i % images.length,
          scaleJitter: 1,
          angle: null
        });
      }

      function spawn(card, delay = 0, firstZ = Z_FAR) {
        // Circular orbit layout — angles picked via best-candidate
        // sampling so the ring stays evenly populated. Covers stay upright.
        const RADIUS = SPREAD;
        const RADIUS_JITTER = SPREAD * 0.08;
        const TRIES = 16;
        let bestAngle = 0,bestMinAngDist = -1;
        for (let t = 0; t < TRIES; t++) {
          const ang = Math.random() * Math.PI * 2;
          let minAng = Infinity;
          for (const other of cards) {
            if (other === card) continue;
            if (other.z > Z_FAR || other.z < Z_NEAR) continue;
            if (other.angle == null) continue;
            let d = Math.abs(ang - other.angle) % (Math.PI * 2);
            if (d > Math.PI) d = Math.PI * 2 - d;
            if (d < minAng) minAng = d;
          }
          if (minAng > bestMinAngDist) {
            bestMinAngDist = minAng;
            bestAngle = ang;
          }
        }
        card.angle = bestAngle;
        const r = RADIUS + (Math.random() - 0.5) * 2 * RADIUS_JITTER;
        card.worldX = Math.cos(bestAngle) * r;
        card.worldY = Math.sin(bestAngle) * r * 0.7;
        card.rot = 0;
        // Cover picker — avoid repeating back-to-back
        let next;
        do {next = Math.floor(Math.random() * images.length);} while (
        images.length > 1 && next === lastImgIdx);
        card.imgIdx = next;
        lastImgIdx = next;
        card.scaleJitter = 0.92 + Math.random() * 0.28;
        card.z = firstZ;

        const tween = gsap.to(card, {
          z: Z_NEAR,
          duration: TRAVERSE * (firstZ === Z_FAR ? 1 : (firstZ - Z_NEAR) / (Z_FAR - Z_NEAR)),
          delay,
          ease: "none",
          onComplete: () => {if (!cancelled) spawn(card, 0, Z_FAR);}
        });
        tweens.push(tween);
      }

      cards.forEach((card, i) => {
        const t0 = i / N;
        const startZ = Z_FAR - t0 * (Z_FAR - Z_NEAR);
        spawn(card, 0, startZ);
      });

      const ASPECT = 2 / 3;

      const render = () => {
        ctx.clearRect(0, 0, W, H);
        const cx = W / 2;
        const cy = H / 2;
        const sorted = cards.slice().sort((a, b) => b.z - a.z);

        for (const c of sorted) {
          const factor = FOCAL / (FOCAL + c.z);
          if (!isFinite(factor) || factor <= 0) continue;

          let a = 1;
          if (c.z > FADE_FAR_END)
          a *= 1 - Math.min(1, Math.max(0, (c.z - FADE_FAR_END) / (FADE_FAR_START - FADE_FAR_END)));
          if (c.z < FADE_NEAR_START)
          a *= Math.min(1, Math.max(0, (c.z - FADE_NEAR_END) / (FADE_NEAR_START - FADE_NEAR_END)));
          if (a <= 0.005) continue;

          const px = cx + c.worldX * factor;
          const py = cy + c.worldY * factor;

          const base = Math.min(W, H) * 0.46 * c.scaleJitter * CARD_SIZE;
          const h = base * factor;
          const w = h * ASPECT;

          const img = images[c.imgIdx];
          if (!img) continue;

          ctx.save();
          ctx.globalAlpha = a;
          ctx.translate(px, py);
          ctx.rotate(c.rot);
          // Design-system --shadow-md equivalent in canvas — the warm ink
          // shadow at low opacity, restrained per Flicker's spec.
          // CSS: 0 4px 12px -2px hsl(345 30% 10% / 0.08)
          ctx.shadowColor = "rgba(33, 23, 26, 0.18)";
          ctx.shadowBlur = 14 * factor;
          ctx.shadowOffsetY = 6 * factor;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }

        raf = requestAnimationFrame(render);
      };
      raf = requestAnimationFrame(render);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      tweens.forEach((t) => t.kill());
      cards.forEach((c) => gsap.killTweensOf(c));
    };
  }, [tweaks.density, tweaks.speed, tweaks.spread, tweaks.perspective, tweaks.cardSize]);

  return (
    <section
      ref={wrapRef}
      data-screen-label="01 Hero"
      style={{
        position: "relative",
        height: "100vh",
        width: "100%",
        overflow: "hidden",
        background: "var(--bg)"
      }}>
      
      {/* ---------- Canvas (floating book covers) ---------- */}
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", inset: 0, display: "block", zIndex: 10 }} />
      

      {/* ---------- Backdrop fog: radial canvas-color halo behind content ----
                                                     A single canvas-color veil fading to transparent. Pure gradient,
                                                     no blur — per the latest direction. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 12,
          pointerEvents: "none",
          background:
          "radial-gradient(ellipse 92% 78% at 50% 52%, " +
          "rgba(var(--bg-rgb), 0.97) 0%, " +
          "rgba(var(--bg-rgb), 0.92) 14%, " +
          "rgba(var(--bg-rgb), 0.78) 30%, " +
          "rgba(var(--bg-rgb), 0.50) 50%, " +
          "rgba(var(--bg-rgb), 0.22) 72%, " +
          "rgba(var(--bg-rgb), 0.00) 92%)"
        }} />
      

      {/* ---------- Top chrome ---------- */}
      <header
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          padding: "22px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 30
        }}>
        
        {/* Flicker logo — brick wordmark */}
        <a href="#" aria-label="Flicker home" style={{ display: "inline-flex", alignItems: "center" }}>
          <img
            src="flicker/logo-flicker-brick.svg"
            alt="Flicker"
            style={{ height: 28, display: "block", width: "90px" }} />
          
        </a>

        <nav style={{ display: "flex", alignItems: "center", gap: 32 }}>
          <a href="#library" className="nav-link" style={{ lineHeight: "0.55", fontFamily: "Outfit" }}>Library</a>
          <a href="#how" className="nav-link">How it works</a>
          <a href="#pricing" className="nav-link">Pricing</a>
          <a
            href="#signin"
            className="nav-link"
            style={{
              padding: "8px 16px",
              border: "1px solid rgba(var(--ink-rgb), 0.22)",
              borderRadius: "var(--radius-full)"
            }}>
            
            Sign in
          </a>
        </nav>
      </header>

      {/* ---------- Centered content ---------- */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 20,
          padding: "0 24px",
          textAlign: "center"
        }}>
        
        {/* Eyebrow removed per direction — content sits cleanly centered. */}

        {/* Display headline — GT Super Display.
                                                       Top line: rolling-text rotator. Black weight (900).
                                                       Bottom line: static "in Minutes." in italic light brick. */}
        <h1
          style={{
            margin: 0,
            fontFamily: "var(--font-serif-display)",
            fontWeight: 900,
            fontSize: "clamp(48px, 8vw, 132px)",
            lineHeight: 1,
            letterSpacing: "-0.05em",
            color: "var(--ink)",
            maxWidth: 1200,
            textWrap: "balance"
          }}>
          
          <span
            ref={rotatorRef}
            className="headline-roll"
            style={{
              display: "block",
              fontWeight: 900
            }}>
            
            Learn Smarter,
          </span>
          <em
            style={{
              display: "block",
              fontStyle: "italic",

              color: "var(--brick)", lineHeight: 1, fontWeight: "600", fontFamily: "\"GT Super Display Trial\"", fontSize: "132px"
            }}>in minutes.


          </em>
        </h1>

        {/* Subtitle — Outfit lead */}
        <p
          style={{
            margin: "26px 0 0 0",
            fontFamily: "var(--font-sans)",
            fontWeight: 300,
            fontSize: "clamp(17px, 1.4vw, 22px)",
            lineHeight: 1.5,
            color: "var(--ink-soft)",
            maxWidth: 620,
            textWrap: "pretty"
          }}>
          
          Get the core ideas from the world&rsquo;s best books, without the
          hours. Flicker turns big reads into clear insights you can use today.
        </p>

        {/* CTAs */}
        <div
          style={{
            marginTop: 36,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
          
          <a href="#get-started" className="cta cta-primary">
            Get started
            <span aria-hidden="true" className="cta-arrow">
              <i data-lucide="arrow-right" width="16" height="16" style={{ display: "block" }}></i>
            </span>
          </a>
          <a href="#download" className="cta cta-secondary">
            <img
              src="flicker/app-icon.svg"
              alt=""
              aria-hidden="true"
              width="28"
              height="28"
              style={{ display: "block", borderRadius: 7, marginRight: 2 }} />
            
            Download app
          </a>
        </div>
      </div>

      {/* ---------- Bottom-left tagline ---------- */}
      <div
        style={{
          position: "absolute",
          left: 36, bottom: 28,
          zIndex: 25,
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-xs)",
          fontWeight: 500,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
        
        <span
          aria-hidden="true"
          className="stat-stack">
          
          <img src="books/03.png" alt="" className="stat-stack-cover" style={{ zIndex: 4 }} />
          <img src="books/07.png" alt="" className="stat-stack-cover" style={{ zIndex: 3 }} />
          <img src="books/10.png" alt="" className="stat-stack-cover" style={{ zIndex: 2 }} />
          <img src="books/12.png" alt="" className="stat-stack-cover" style={{ zIndex: 1 }} />
        </span>
        2,300+ titles &middot; 15-min reads
      </div>

      {/* ---------- Book of the week card ---------- */}
      {!bookCardDismissed &&
      <div ref={bookCardOuterRef} className="book-card-wrap">
        <div ref={bookCardRef} className="book-card-lift">
          <a
            href="#book-of-the-week"
            className="book-card"
            aria-label="Book of the week: Atomic Habits by James Clear"
            style={{ borderWidth: "0px", backgroundColor: "rgb(248, 245, 239)" }}
            onMouseEnter={() => {
              const lift = bookCardRef.current;
              if (!lift) return;
              lift.classList.add("is-lifted");
              gsap.to(lift, { y: -4, duration: 0.32, ease: "power3.out", overwrite: "auto" });
            }}
            onMouseLeave={() => {
              const lift = bookCardRef.current;
              if (!lift) return;
              lift.classList.remove("is-lifted");
              gsap.to(lift, { y: 0, duration: 0.4, ease: "power3.out", overwrite: "auto" });
            }}>

            <img
              src="books/01.png"
              alt=""
              className="book-card-cover"
              loading="lazy" />

            <div className="book-card-text">
              <span className="book-card-badge" style={{ fontWeight: "400", fontSize: "9px" }}>Book of the week</span>
              <span className="book-card-title" style={{ letterSpacing: "-0.8px", fontSize: "16px" }}>Atomic Habits</span>
              <span className="book-card-meta">
                <span>James Clear</span>
                <span aria-hidden="true" className="book-card-meta-dot" />
                <span className="book-card-genre">Self-development</span>
              </span>
            </div>
          </a>
          <button
            type="button"
            className="book-card-dismiss"
            aria-label="Dismiss book of the week"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const lift = bookCardRef.current;
              if (!lift) {setBookCardDismissed(true);return;}
              gsap.to(lift, {
                opacity: 0, scale: 0.94, y: 14, filter: "blur(4px)",
                duration: 0.4, ease: "power2.in",
                onComplete: () => setBookCardDismissed(true)
              });
            }}>

            <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true" style={{ display: "none" }}>
              <path d="M2 2L8 8M8 2L2 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <i data-lucide="x" width="12" height="12" style={{ display: "block" }}></i>
          </button>
        </div>
      </div>
      }
      }

      {/* ---------- Bottom-right scroll indicator (replaces pause button) -- */}
      <div
        ref={scrollIndRef}
        style={{
          position: "absolute",
          right: 36, bottom: 28,
          zIndex: 25,
          fontFamily: "var(--font-sans)",
          fontSize: "var(--text-xs)",
          fontWeight: 500,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          display: "flex",
          alignItems: "center",
          gap: 10,
          perspective: 400
        }}>

        <span
          ref={scrollTextRef}
          style={{
            display: "inline-flex",
            lineHeight: 1,
            overflow: "hidden",
            paddingBottom: 2
          }}>
          Scroll
        </span>
        <span
          ref={scrollLineRef}
          style={{ display: "inline-block", width: 22, height: 1, background: "currentColor", opacity: 0.6 }} />
        
        <span
          ref={scrollIconRef}
          aria-hidden="true"
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>

          <span
            ref={scrollArrowRef}
            style={{ display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
            <i data-lucide="arrow-down" width="12" height="12" style={{ display: "block" }}></i>
          </span>
        </span>
      </div>
    </section>);

}

/* ------------------------------------------------------------------ */
/*  Section AFTER the hero                                            */
/* ------------------------------------------------------------------ */
function AfterHeroV3() {
  return (
    <section
      data-screen-label="02 After hero"
      style={{
        background: "var(--bg)",
        padding: "10vh 8vw",
        borderTop: "1px solid var(--rule)"
      }}>
      
      <div
        className="t-eyebrow"
        style={{ marginBottom: 28 }}>
        
        How it works
      </div>
      <p
        className="t-h1"
        style={{
          margin: 0,
          maxWidth: 920,
          color: "var(--ink)",
          textWrap: "pretty",
          fontWeight: 500
        }}>
        
        Every Flicker is a 15-minute distillation written by editors, not
        algorithms. Listen on the commute, read in bed, save what
        matters &mdash; and keep the books you love in your pocket.
      </p>
    </section>);

}

window.HeroV3 = HeroV3;
window.AfterHeroV3 = AfterHeroV3;