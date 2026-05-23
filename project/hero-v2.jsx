/* global React, gsap */
const { useRef, useEffect, useState } = React;

/* ------------------------------------------------------------------ */
/*  Book covers — drop more by adding entries here.                   */
/* ------------------------------------------------------------------ */
const BOOKS = [
"books/01.png",
"books/02.png",
"books/03.png",
"books/04.png",
"books/05.png",
"books/06.png",
"books/07.png",
"books/08.png",
"books/09.png",
"books/10.png",
"books/11.png",
"books/12.png",
"books/13.png"];


/* ------------------------------------------------------------------ */
/*  Preload all covers as HTMLImageElements. Resolves with the array. */
/* ------------------------------------------------------------------ */
function loadImages(srcs) {
  return Promise.all(
    srcs.map(
      (src) =>
      new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => resolve(null); // tolerate missing
        img.src = src;
      })
    )
  ).then((arr) => arr.filter(Boolean));
}

/* ------------------------------------------------------------------ */
/*  Hero — auto-animated canvas flythrough of book covers.            */
/* ------------------------------------------------------------------ */
function HeroV2({ tweaks }) {
  const wrapRef = useRef(null);
  const canvasRef = useRef(null);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  pausedRef.current = paused;

  // Re-init when these change
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
          scaleJitter: 1
        });
      }

      function spawn(card, delay = 0, firstZ = Z_FAR) {
        // Circular layout — cards orbit around the optical axis. Best-candidate
        // sampling chooses an angle on the ring that's farthest (in angular
        // distance) from every other active card, so the ring stays evenly
        // populated without locking each card to a fixed slot.
        const RADIUS = SPREAD;            // ring radius in world units
        const RADIUS_JITTER = SPREAD * 0.08; // tiny breathing room so it doesn't read mechanical
        const TRIES = 16;
        let bestAngle = 0,bestMinAngDist = -1;
        for (let t = 0; t < TRIES; t++) {
          const ang = Math.random() * Math.PI * 2;
          let minAng = Infinity;
          for (const other of cards) {
            if (other === card) continue;
            if (other.z > Z_FAR || other.z < Z_NEAR) continue;
            if (other.angle == null) continue;
            // Shortest signed angular distance
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
        card.worldY = Math.sin(bestAngle) * r * 0.7; // slight vertical compression — feels more cinematic than a perfect circle
        card.rot = 0; // covers stay upright
        // Avoid repeating the same cover back-to-back
        let next;
        do {
          next = Math.floor(Math.random() * images.length);
        } while (images.length > 1 && next === lastImgIdx);
        card.imgIdx = next;
        lastImgIdx = next;
        card.scaleJitter = 0.92 + Math.random() * 0.28; // tightened for evener feel
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

      const ASPECT = 2 / 3; // portrait book covers

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
          ctx.shadowColor = "rgba(0,0,0,0.45)";
          ctx.shadowBlur = 32 * factor;
          ctx.shadowOffsetY = 14 * factor;
          ctx.drawImage(img, -w / 2, -h / 2, w, h);
          ctx.restore();
        }

        raf = requestAnimationFrame(render);
      };
      raf = requestAnimationFrame(render);
    });

    // -------------------- pause toggle --------------------
    // We pause GSAP globally for THIS hero's tweens by setting their
    // timeScale via a tracked global state. Cleaner: pause each tween.
    // Use a polling hook reading pausedRef.
    let lastPaused = false;
    const watchPause = () => {
      if (cancelled) return;
      const p = pausedRef.current;
      if (p !== lastPaused) {
        tweens.forEach((t) => {
          if (p) t.pause();else
          t.resume();
        });
        lastPaused = p;
      }
      requestAnimationFrame(watchPause);
    };
    requestAnimationFrame(watchPause);

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
      

      {/* ---------- Backdrop fog: radial bg-color halo behind content ---------- */}
      {/* Layer 1: wide soft fog (improves text contrast without hiding cards) */}
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
      
      {/* Layer 2: tighter blur halo \u2014 gives a depth-of-field defocus on
              the cards passing closest to the headline. Pure CSS. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          left: "50%",
          top: "50%",
          width: "min(92vw, 1500px)",
          height: "min(76vh, 820px)",
          transform: "translate(-50%, -50%)",
          zIndex: 13,
          pointerEvents: "none",
          borderRadius: "50%",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          maskImage:
          "radial-gradient(ellipse at center, black 0%, black 42%, transparent 82%)",
          WebkitMaskImage:
          "radial-gradient(ellipse at center, black 0%, black 42%, transparent 82%)"
        }} />
      

      {/* ---------- Top chrome ---------- */}
      <header
        style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          padding: "26px 36px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          zIndex: 30,
          color: "var(--ink)"
        }}>
        
        <div
          style={{
            fontFamily: "Fraunces, Georgia, serif",
            fontWeight: 500,
            fontSize: 22,
            letterSpacing: "-0.01em",
            display: "flex",
            alignItems: "center",
            gap: 10
          }}>
          
          <span
            aria-hidden="true"
            style={{
              display: "inline-block",
              width: 14,
              height: 14,
              borderRadius: 3,
              background: "var(--ink)"
            }} />
          
          Flicker
        </div>
        <nav
          className="mono"
          style={{
            display: "flex",
            gap: 28,
            fontSize: 12,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "var(--ink)"
          }}>
          
          <a href="#">Library</a>
          <a href="#">How it works</a>
          <a href="#">Pricing</a>
          <a href="#">Sign in</a>
        </nav>
      </header>

      {/* ---------- Centered content (headline + subtitle + CTAs) ---------- */}
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
        
        <h1
          style={{
            margin: 0,
            fontFamily: "Fraunces, Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(44px, 7.2vw, 124px)",
            lineHeight: 0.96,
            letterSpacing: "-0.035em",
            color: "var(--ink)",
            maxWidth: 1200,
            textWrap: "balance"
          }}>
          Learn Smarter,
          <br />
          <em style={{ fontStyle: "italic", fontWeight: 300 }}>in Minutes.</em>
        </h1>

        <p
          style={{
            margin: "28px 0 0 0",
            fontFamily: "Fraunces, Georgia, serif",
            fontWeight: 300,
            fontSize: "clamp(16px, 1.35vw, 22px)",
            lineHeight: 1.45,
            letterSpacing: "-0.005em",
            color: "var(--ink)",
            opacity: 0.78,
            maxWidth: 640,
            textWrap: "pretty"
          }}>
          
          Get the core ideas from the world's best books, without the hours.
          Flicker turns big reads into clear insights you can use today.
        </p>

        <div
          style={{
            marginTop: 36,
            display: "flex",
            gap: 12,
            flexWrap: "wrap",
            justifyContent: "center"
          }}>
          
          <a href="#get-started" className="cta cta-primary">
            Get Started
            <span aria-hidden="true" className="cta-arrow">{'\u2192'}</span>
          </a>
          <a href="#download" className="cta cta-secondary">
            Download App
          </a>
        </div>
      </div>

      {/* ---------- Bottom-left: tagline ---------- */}
      <div
        className="mono"
        style={{
          position: "absolute",
          left: 36, bottom: 28,
          zIndex: 25,
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--ink)",
          opacity: 0.65,
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
        
        <span
          aria-hidden="true"
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--ink)"
          }} />
        
        {'2,300+\u00a0titles\u00a0\u00b7\u00a015-min reads'}
      </div>

      {/* ---------- Bottom-center scroll hint ---------- */}
      <div
        className="mono"
        style={{
          position: "absolute",
          left: "50%", bottom: 28,
          transform: "translateX(-50%)",
          zIndex: 25,
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--ink)",
          opacity: 0.65,
          display: "flex",
          alignItems: "center",
          gap: 10
        }}>
        
        Scroll
        <span style={{ display: "inline-block", width: 22, height: 1, background: "currentColor", opacity: 0.6 }} />
        {'\u2193'}
      </div>

      {/* ---------- Bottom-right: pause / play toggle ---------- */}
      <button
        type="button"
        onClick={() => setPaused((p) => !p)}
        className="mono play-toggle"
        aria-pressed={paused}
        style={{
          position: "absolute",
          right: 36, bottom: 22,
          zIndex: 25,
          background: "transparent",
          border: "1px solid var(--rule)",
          color: "var(--ink)",
          padding: "10px 14px 10px 12px",
          display: "flex",
          alignItems: "center",
          gap: 10,
          fontSize: 11,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          cursor: "pointer",
          opacity: 0.9
        }}>
        
        <span
          aria-hidden="true"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14
          }}>
          
          {paused ?
          // play triangle
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <path d="M2 1 L9 5 L2 9 Z" fill="currentColor" />
            </svg> :

          // pause bars
          <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
              <rect x="1.5" y="1" width="2.5" height="8" fill="currentColor" />
              <rect x="6" y="1" width="2.5" height="8" fill="currentColor" />
            </svg>
          }
        </span>
        {paused ? "Play" : "Pause"}
      </button>
    </section>);

}

/* ------------------------------------------------------------------ */
/*  Section AFTER the hero \u2014 proves layout flows below the canvas.   */
/* ------------------------------------------------------------------ */
function AfterHeroV2() {
  return (
    <section
      data-screen-label="02 After hero"
      style={{
        background: "var(--bg)",
        padding: "12vh 8vw",
        borderTop: "1px solid var(--rule)"
      }}>
      
      <div
        className="mono"
        style={{
          fontSize: 11,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
          marginBottom: 32
        }}>
        
        {'\u00a7 How it works'}
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
          color: "var(--ink)"
        }}>
        
        Every Flicker is a 15-minute distillation written by editors, not
        {"algorithms. Listen on the commute, read at the gym, save what matters \u2014 and keep the books you love in your pocket."}
      </p>
    </section>);

}

window.HeroV2 = HeroV2;
window.AfterHeroV2 = AfterHeroV2;