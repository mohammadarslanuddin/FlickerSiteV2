/* global React, ReactDOM, Hero, AfterHero, TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSlider, TweakSelect, useTweaks */

const TONES = {
  sand:    { bg: "#ece7df", ink: "#1a1916", muted: "#6b665d", rule: "rgba(26,25,22,0.18)" },
  paper:   { bg: "#f4f1ea", ink: "#1a1714", muted: "#74695b", rule: "rgba(26,23,20,0.16)" },
  bone:    { bg: "#e5e1d6", ink: "#161513", muted: "#615d52", rule: "rgba(22,21,19,0.20)" },
  ink:     { bg: "#15140f", ink: "#f1ead7", muted: "#9f9886", rule: "rgba(241,234,215,0.16)" },
  pine:    { bg: "#1a2420", ink: "#e8e4d4", muted: "#9ba093", rule: "rgba(232,228,212,0.16)" },
};

function applyTone(name) {
  const t = TONES[name] || TONES.sand;
  const r = document.documentElement;
  r.style.setProperty("--bg", t.bg);
  r.style.setProperty("--ink", t.ink);
  r.style.setProperty("--ink-muted", t.muted);
  r.style.setProperty("--rule", t.rule);
}

const DEFAULTS = (() => {
  try {
    const raw = document.getElementById("tweak-defaults").textContent;
    const json = raw.match(/\{[\s\S]*\}/)[0];
    return JSON.parse(json);
  } catch (e) {
    return {
      motion: "flyby",
      tone: "sand",
      showCounter: true,
      showPlateLabels: true,
      slideCount: 5,
      scrollSpeed: 1,
    };
  }
})();

function App() {
  const [tweaks, setTweak] = useTweaks(DEFAULTS);

  React.useEffect(() => {
    applyTone(tweaks.tone);
  }, [tweaks.tone]);

  return (
    <>
      <Hero tweaks={tweaks} />
      <AfterHero />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Motion">
          <TweakRadio
            label="Image motion"
            value={tweaks.motion}
            onChange={(v) => setTweak("motion", v)}
            options={[
              { value: "flyby",     label: "Flyby" },
              { value: "parallax",  label: "Parallax" },
              { value: "crossfade", label: "Fade" },
            ]}
          />
          <TweakSlider
            label="Scroll length"
            min={0.6}
            max={1.8}
            step={0.05}
            value={tweaks.scrollSpeed}
            unit="×"
            onChange={(v) => setTweak("scrollSpeed", v)}
          />
        </TweakSection>

        <TweakSection label="Tone">
          <TweakSelect
            label="Palette"
            value={tweaks.tone}
            onChange={(v) => setTweak("tone", v)}
            options={[
              { value: "sand",  label: "Sand" },
              { value: "paper", label: "Paper" },
              { value: "bone",  label: "Bone" },
              { value: "ink",   label: "Ink (dark)" },
              { value: "pine",  label: "Pine (dark)" },
            ]}
          />
        </TweakSection>

        <TweakSection label="Chrome">
          <TweakToggle
            label="Index counter"
            value={tweaks.showCounter}
            onChange={(v) => setTweak("showCounter", v)}
          />
          <TweakToggle
            label="Plate notes"
            value={tweaks.showPlateLabels}
            onChange={(v) => setTweak("showPlateLabels", v)}
          />
          <TweakSlider
            label="Plate count"
            min={2}
            max={5}
            step={1}
            value={tweaks.slideCount}
            onChange={(v) => setTweak("slideCount", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
