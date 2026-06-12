// Always start a (re)load at the top — don't let the browser restore scroll.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.scrollTo(0, 0);

// ---- Scale the fixed 1920-wide canvas to the viewport width ----
const FRAME_W = 1920;
const FRAME_H = 2130;
const stage = document.querySelector(".stage");

function applyScale() {
  const scale = window.innerWidth / FRAME_W;
  document.documentElement.style.setProperty("--scale", scale);
  // keep the scroll length correct (theme A; theme B's .stage-b uses a CSS height)
  if (stage) stage.style.height = FRAME_H * scale + "px";
}
applyScale();
window.addEventListener("resize", applyScale);

// ---- Typewriter speech bubble (both themes) ----
// Types the text out char-by-char (the bubble hugs content, so it grows) and
// then STAYS (no erasing). Uses code points so emoji stay intact.
function typeBubble(p) {
  const chars = [...(p.dataset.text || "")];
  const out = p.querySelector(".typed");
  if (!out || !chars.length) return;
  let i = 0;
  (function tick() {
    out.textContent = chars.slice(0, i).join("");
    if (i < chars.length) {
      i++;
      setTimeout(tick, 85);
    }
    // fully typed → stop; text remains, caret keeps blinking (CSS)
  })();
}
document.querySelectorAll(".status-bar p[data-text]").forEach(typeBubble);

// ---- Theme switcher ----
// Clicking RELOADS the page into the other theme, so the content-generation
// (reveal) animation plays from scratch every time. The chosen theme is kept
// in localStorage; an inline script in <body> applies it before first paint.
const isThemeB = document.body.classList.contains("theme-inzoi");
const themeBtn = document.getElementById("theme-toggle");
if (themeBtn) {
  themeBtn.addEventListener("click", () => {
    localStorage.setItem("kus-theme", isThemeB ? "a" : "b");
    window.scrollTo(0, 0);
    location.reload();
  });
}

// ---- Reveal the ACTIVE theme's content (cascade) on load / scroll ----
const STAGGER = 220; // ms between sequential (.seq) items in the same wave
const activeStage = isThemeB ? ".stage-b" : ".stage";

// Reveal a batch of elements: .seq ones cascade top→bottom, others appear at once.
function revealBatch(els) {
  const seq = els
    .filter((el) => el.classList.contains("seq"))
    .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top);
  els
    .filter((el) => !el.classList.contains("seq"))
    .forEach((el) => el.classList.add("in"));
  seq.forEach((el, i) => {
    el.style.transitionDelay = i * STAGGER + "ms";
    el.classList.add("in");
  });
}

const io = new IntersectionObserver(
  (entries) => {
    const shown = entries.filter((e) => e.isIntersecting).map((e) => e.target);
    if (shown.length) {
      revealBatch(shown);
      shown.forEach((el) => io.unobserve(el));
    }
  },
  { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
);

document
  .querySelectorAll(`${activeStage} .reveal, ${activeStage} .focus-panel`)
  .forEach((el) => io.observe(el));

// Reveal everything already within the first viewport on load (as one cascade).
window.addEventListener("load", () => {
  const vh = window.innerHeight;
  const visible = [
    ...document.querySelectorAll(`${activeStage} .reveal, ${activeStage} .focus-panel`),
  ].filter((el) => !el.classList.contains("in") && el.getBoundingClientRect().top < vh * 0.95);
  if (visible.length) {
    revealBatch(visible);
    visible.forEach((el) => io.unobserve(el));
  }
});
