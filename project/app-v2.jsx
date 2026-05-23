/* global React, ReactDOM, HeroV2, AfterHeroV2,
   TweaksPanel, TweakSection, TweakRadio, TweakToggle, TweakSlider, TweakSelect, useTweaks */

const TONES = {
  sand:    { bg: "#ece7df", bgRgb: "236, 231, 223", ink: "#1a1916", inkRgb: "26, 25, 22",   muted: "#6b665d", rule: "rgba(26,25,22,0.18)" },
  paper:   { bg: "#f4f1ea", bgRgb: "244, 241, 234", ink: "#1a1714", inkRgb: "26, 23, 20",   muted: "#74695b", rule: "rgba(26,23,20,0.16)" },
  bone:    { bg: "#e5e1d6", bgRgb: "229, 225, 214", ink: "#161513", inkRgb: "22, 21, 19",   muted: "#615d52", rule: "rgba(22,21,19,0.20)" },
  ink:     { bg: "#15140f", bgRgb: "21, 20, 15",    ink: "#f1ead7", inkRgb: "241, 234, 215", muted: "#9f9886", rule: "rgba(241,234,215,0.16)" },
  pine:    { bg: "#1a2420", bgRgb: "26, 36, 32",    ink: "#e8e4d4", inkRgb: "232, 228, 212", muted: "#9ba093", rule: "rgba(232,228,212,0.16)" },
};

function applyTone(name) {
  const t = TONES[name] || TONES.sand;
  const r = document.documentElement;
  r.style.setProperty("--bg", t.bg);
  r.style.setProperty("--bg-rgb", t.bgRgb);
  r.style.setProperty("--ink", t.ink);
  r.style.setProperty("--ink-rgb", t.inkRgb);
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
      tone: "sand",
      speed: 1,
      density: 8,
      spread: 1,
      cardSize: 1,
      showCounter: true,
      showPlateLabels: true,
      perspective: "deep",
    };
  }
})();

function App() {
  const [tweaks, setTweak] = useTweaks(DEFAULTS);

  React.useEffect(() => { applyTone(tweaks.tone); }, [tweaks.tone]);

  return (
    <>
      <HeroV2 tweaks={tweaks} />
      <AfterHeroV2 />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Motion">
          <TweakRadio
            label="Perspective"
            value={tweaks.perspective}
            onChange={(v) => setTweak("perspective", v)}
            options={[
              { value: "flat",   label: "Flat" },
              { value: "normal", label: "Normal" },
              { value: "deep",   label: "Deep" },
            ]}
          />
          <TweakSlider
            label="Flight speed"
            min={0.4}
            max={2.2}
            step={0.05}
            value={tweaks.speed}
            unit={'\u00d7'}
            onChange={(v) => setTweak("speed", v)}
          />
          <TweakSlider
            label="Cards in flight"
            min={3}
            max={14}
            step={1}
            value={tweaks.density}
            onChange={(v) => setTweak("density", v)}
          />
          <TweakSlider
            label="Spread"
            min={0.4}
            max={1.8}
            step={0.05}
            value={tweaks.spread}
            unit={'\u00d7'}
            onChange={(v) => setTweak("spread", v)}
          />
          <TweakSlider
            label="Card size"
            min={0.4}
            max={1.6}
            step={0.05}
            value={tweaks.cardSize}
            unit={'\u00d7'}
            onChange={(v) => setTweak("cardSize", v)}
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
            label="Now-showing chip"
            value={tweaks.showCounter}
            onChange={(v) => setTweak("showCounter", v)}
          />
          <TweakToggle
            label="Plate slot notes"
            value={tweaks.showPlateLabels}
            onChange={(v) => setTweak("showPlateLabels", v)}
          />
        </TweakSection>
      </TweaksPanel>
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
