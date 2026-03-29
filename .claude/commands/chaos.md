# Controlled Chaos Design System

## The Three Axioms (These override everything else)

**I. Hierarchy is the only job.** Every pixel answers: what first, what second, what never? Size is loudest, then weight, color, position, motion. The most powerful tool is omission.

**II. Tension is beauty.** Near-symmetry over perfect. Every composition needs one discord — one break that proves the rest is intentional. Whitespace is counterforce, not absence. Grids exist to be *almost* followed.

**III. The medium is time.** Screens are not posters. Revelation over time creates narrative. Scroll, viewport, pointer, and elapsed time are design variables. If it could be printed unchanged, it's not using the screen.

**Decision engine — apply to every choice:**
1. Does this serve hierarchy? → Remove or subordinate if not.
2. Does this create intentional tension? → Add a discord if everything is too resolved.
3. Does this use the medium? → Make it respond to scroll/viewport/pointer/time.

See `AXIOMS.md` for the full derivation, corollaries, and the relationship between craft and taste.

## What This Is
A creative design system for building award-level UI/UX — inspired by Awwwards SOTD winners and Cargo graphic templates. NOT a corporate system. A system of controlled chaos.

## How to Use This System

When building any page or component:

1. **Choose a mode** (or mix them):
   - `swiss` — Neue Grafik editorial, grid-locked, systematic
   - `brutalist` — Maximum volume, raw, unapologetic
   - `immersive` — Dark atmospheric, scroll-driven, experiential
   - `kinetic` — Typography in motion, animated, alive
   - `gallery` — White cube minimal, work speaks for itself

2. **Set the forces** via `data-forces` attribute on the root element

3. **Choose a mood** via `data-mood` attribute:
   `void`, `void-inverse`, `dusk`, `signal`, `earth`, `frost`, `blaze`, `bruise`, `concrete`

4. **Use the typographic voices**:
   - `.voice-monument` — Architectural display (Space Grotesk)
   - `.voice-editorial` — Elegant serif (Playfair Display)
   - `.voice-swiss` — Systematic sans (Inter)
   - `.voice-brutalist` — Raw mono (Space Mono)
   - `.voice-expressive` — Versatile (DM Sans)

5. **Import the tokens**:
   ```html
   <link rel="stylesheet" href="tokens/layout.css">
   <link rel="stylesheet" href="tokens/typography.css">
   <link rel="stylesheet" href="tokens/color.css">
   <link rel="stylesheet" href="tokens/motion.css">
   <link rel="stylesheet" href="tokens/forces.css">
   ```

## Design Principles (Non-Negotiable)
- Type is the hero. If it works without color/images, you've won.
- Tension is beauty. Near-symmetry over perfect symmetry.
- Whitespace is pressurized, not empty.
- Motion has meaning or it doesn't exist.
- Break rules only after understanding why they exist.
- The screen is not paper — use viewport, scroll, pointer, time.

## File Structure
- `tokens/` — CSS custom properties (forces, typography, color, motion, layout)
- `modes/` — Complete aesthetic presets (reserved for future CSS-only mode files)
- `components/` — Reusable component patterns (reserved for future)
- `showcase/` — Live demos of each mode (index, swiss, brutalist, immersive, kinetic, gallery)

## Key CSS Variables
- `--type-massive` through `--type-micro` — Non-linear type scale
- `--color-bg`, `--color-fg`, `--color-accent-1`, `--color-discord` — Mood-driven colors
- `--force-structure` through `--force-shout` — Creative force dials (0 to 1)
- `--dur-instant` through `--dur-meditate` — Motion tempo
- `--ease-out-expo`, `--ease-spring`, `--ease-snap` — Timing curves

## When Creating New Pages
Always start from the five forces — where does this piece live on each spectrum?
Then pick the mode, mood, and voices that match. Compose from tokens, not from scratch.

---

## Modes Reference

| Mode | `data-forces` | Character | Force Profile |
|------|--------------|-----------|---------------|
| Swiss Editorial | `swiss` | Neue Grafik, grid-locked, systematic | structure:0.85, breath:0.65, edge:0.85, stillness:0.8 |
| Brutalist Poster | `brutalist` | Maximum volume, raw, unapologetic | disruption:0.8, density:0.85, edge:1, shout:1 |
| Immersive Dark | `immersive` | Atmospheric, scroll-driven, experiential | breath:0.8, warmth:0.6, motion:0.9 |
| Kinetic Type | `kinetic` | Typography in motion, animated, alive | motion:1, shout:0.7, structure:0.55 |
| Gallery Minimal | `gallery` | White cube, work speaks for itself | structure:0.9, breath:1, whisper:0.9, stillness:0.8 |

## Moods (Color Palettes)

| Mood | `data-mood` | Background | Foreground | Accent | Discord |
|------|------------|------------|------------|--------|---------|
| Void | `void` | #000000 | #ffffff | #ffffff | #ff0040 |
| Void Inverse | `void-inverse` | #ffffff | #000000 | #000000 | #ff0040 |
| Dusk | `dusk` | #0d1117 | #f0e6d3 | #d4a574 | #ff6b35 |
| Signal | `signal` | #0a0a0f | #e0ffe0 | #00ff88 | #ff0066 |
| Earth | `earth` | #f2ede4 | #2c2416 | #a0522d | #c73e1d |
| Frost | `frost` | #f0f4f8 | #1a1f36 | #5b6abf | #e53e3e |
| Blaze | `blaze` | #0a0000 | #fff0e0 | #ff3d00 | #00ff88 |
| Bruise | `bruise` | #0f0a1a | #e8dff5 | #a855f7 | #22d3ee |
| Concrete | `concrete` | #b8b8b0 | #1a1a18 | #1a1a18 | #ff4400 |

## Typographic Voices

| Class | Font | Character | Use |
|-------|------|-----------|-----|
| `.voice-monument` | Space Grotesk | Architectural, bold, uppercase | Heroes, statements |
| `.voice-editorial` | Playfair Display | Elegant serif, refined | Long reads, sophistication |
| `.voice-swiss` | Inter | Systematic sans | Information density, labels |
| `.voice-brutalist` | Space Mono | Raw monospace | Disruption, data |
| `.voice-expressive` | DM Sans | Fluid, versatile | Art direction, personality |

## Type Scale

| Variable | Range | Use |
|----------|-------|-----|
| `--type-massive` | 56-192px | Page-defining statements |
| `--type-display` | 40-112px | Section heroes |
| `--type-headline` | 28-56px | Section titles |
| `--type-subhead` | 18-24px | Subsections |
| `--type-body` | 15-18px | Reading text |
| `--type-body-small` | 13-15px | Secondary text |
| `--type-caption` | 11-13px | Labels, metadata |
| `--type-micro` | 9-11px | Smallest text |

## Layout Classes

**Grids:**
- `.grid-swiss` — 12-column foundation
- `.grid-auto` — auto-fill responsive
- `.grid-asymmetric` — 2fr/1fr deliberate imbalance
- `.grid-editorial` — Named areas: full, wide, content
- `.grid-masonry` — CSS columns masonry
- `.grid-cargo` — Tight 1px-gap grid

**Sections:**
- `.section-hero` — Full viewport, centered
- `.section-breath` — Generous vertical padding
- `.section-bleed` — Edge-to-edge 100vw
- `.section-sticky` — Sticky positioned, 100dvh

**Containers:**
- `.container` — Max 1600px centered
- `.container.--narrow` — 640px
- `.container.--regular` — 960px
- `.container.--wide` — 1200px

## Motion Classes

- `.motion-reveal` — Scroll-triggered fade+up
- `.motion-stagger` — Children cascade with stagger delays
- `.motion-clip-up` — Clip-path reveal animation
- `.motion-marquee` — Infinite horizontal scroll
- `.motion-hover-lift` — Hover translateY(-4px)
- `.motion-hover-scale` — Hover scale(1.03)
- `.motion-scroll-fade` — Scroll-driven fade
- `.motion-scroll-parallax` — Scroll-driven parallax

## The Five Forces

| Force Pair | Low (0) | High (1) |
|-----------|---------|----------|
| `--force-structure` / `--force-disruption` | Chaos, freeform | Rigid grid, systematic |
| `--force-density` / `--force-breath` | Airy, spacious | Packed, heavy |
| `--force-warmth` / `--force-edge` | Rounded, organic | Sharp, angular |
| `--force-stillness` / `--force-motion` | Static, monumental | Kinetic, animated |
| `--force-whisper` / `--force-shout` | Barely there | Maximum volume |

## Scroll Reveal Pattern (JavaScript)

```javascript
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('--visible');
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.motion-reveal, .motion-stagger').forEach(el => observer.observe(el));
```

## Recommended Mode + Mood Pairings

| Mode | Primary Mood | Alt Mood |
|------|-------------|----------|
| Swiss | `void-inverse` | `frost` |
| Brutalist | `concrete` | `blaze` |
| Immersive | `signal` | `dusk` |
| Kinetic | `dusk` | `bruise` |
| Gallery | `void-inverse` | `void` |

## Design Rules for Generation

1. **Type is the hero.** If the design works without color or images, it succeeds.
2. **Tension is beauty.** Near-symmetry over perfect symmetry.
3. **Whitespace is pressurized.** It pushes elements apart with intent, not emptiness.
4. **Motion has meaning.** Every animation must have a purpose or it should not exist.
5. **The discord accent breaks the mood.** Every palette has one rule-breaking color — use it sparingly.
6. **One mood per page.** Mix voices freely, but stay in one color world.
7. **Start from the five forces.** Decide where on each spectrum, then let derived values do the work.
8. **The screen is not paper.** Use viewport units, scroll position, pointer position, time.

Apply this system to: $ARGUMENTS
