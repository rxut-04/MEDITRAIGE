# Hero Text Animation & Italic Styling — Rebuild Spec

Source of truth in MediTriage:
- Hero markup: `src/pages/Landing.jsx` (Hero section)
- Rotator component: `src/components/ui/text-rotate.tsx`
- Fonts / tokens / italic utility: `src/index.css`
- Copy: `src/constants.ts` (`BRAND`)
- Animation library: `motion` (Motion One / Framer Motion v12 package: `"motion": "^12.x"`)

This document is written so another project can recreate the **exact** hero typography + rotation behavior.

---

## 1. Design intent (what you are rebuilding)

The hero headline is a **two-line stacked title**:

| Line | Content | Style |
|------|---------|--------|
| 1 (static) | `Clinical` | Same serif family as H1, **not** italic, near-black (`obsidian`) |
| 2 (rotating) | `Intelligence.` → `Precision.` → `Clarity.` → `Assurance.` → `Empathy.` | Same size as line 1, **Instrument Serif italic**, accent orange (`sage` token = `#f2572b`) |

Below the H1, a supporting sentence uses **sans Inter + italic** at reduced opacity.

Visually: editorial clinical luxury — black upright word + coral italic rotating word, character-by-character spring wipe.

---

## 2. Dependencies

```bash
npm install motion clsx tailwind-merge
```

Optional (only if you copy the class-merge helper):

```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

Import Motion from:

```ts
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "motion/react"
```

> Note: the repo also lists `framer-motion`, but the hero uses the **`motion`** package API (`motion/react`). Either works if versions align; stick to one.

---

## 3. Fonts (critical for italic look)

### 3.1 Google Fonts load

Must load **Instrument Serif with italic axis** (`ital@0;1`):

```css
@import url('https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap');
```

If you omit `ital@0;1`, browsers fake-italic the upright face and the hero will look wrong.

### 3.2 CSS variables / Tailwind theme

```css
@theme {
  --font-serif: 'Instrument Serif', Georgia, serif;
  --font-sans: 'Inter', system-ui, sans-serif;

  --color-paper: #FFFFFF;
  --color-obsidian: #171717;
  --color-sage: #f2572b; /* accent — name is historical; color is orange-coral */
}
```

### 3.3 Base heading rule

All headings default to serif:

```css
h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-serif);
}
```

### 3.4 Reusable “luxury italic” utility (optional)

Used elsewhere; hero rotating line applies the same idea inline:

```css
.text-luxury {
  font-family: var(--font-serif);
  font-style: italic;
  letter-spacing: -0.025em; /* tracking-tight */
}
```

---

## 4. Color & type tokens used on the hero

| Token / class | Value / meaning |
|---------------|-----------------|
| `text-obsidian` | `#171717` — static “Clinical” + body default |
| `text-sage` | `#f2572b` — rotating italic line only |
| `text-obsidian/70` | 70% opacity black — subtitle |
| `font-serif` | Instrument Serif |
| `italic` | `font-style: italic` (true italic cut) |
| `tracking-tighter` | H1 container letter-spacing |
| `tracking-tight` | Rotating line letter-spacing |
| H1 size | `text-5xl` mobile → `md:text-8xl` desktop |
| H1 weight | `font-semibold` |
| H1 leading | `leading-[0.9]` (tight stack) |

---

## 5. Exact hero markup (structure)

Conceptual structure (Tailwind class names from production):

```tsx
const prefersReducedMotion = useReducedMotion()

<section className="relative min-h-screen flex items-center justify-center overflow-hidden py-32">
  {/* background layer omitted — not part of text animation */}

  <div className="max-w-5xl mx-auto px-6 text-center z-10 relative">
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 1.2, ease: "easeOut" }}
      className="flex flex-col items-center"
    >
      {/* Optional pill / tagline above H1 — not the rotator */}

      <LayoutGroup>
        <motion.h1
          layout
          className="text-5xl md:text-8xl font-semibold text-obsidian leading-[0.9] mb-10 select-none tracking-tighter flex flex-col items-center"
        >
          {/* LINE 1 — static, upright */}
          <motion.span
            layout
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
          >
            Clinical
          </motion.span>

          {/* LINE 2 — rotating italic accent */}
          <TextRotate
            texts={[
              "Intelligence.",
              "Precision.",
              "Clarity.",
              "Assurance.",
              "Empathy.",
            ]}
            mainClassName="justify-center font-serif italic tracking-tight text-sage"
            splitLevelClassName="overflow-hidden pr-1 pb-2 md:pb-4"
            staggerFrom="last"
            staggerDuration={0.025}
            initial={{ y: "100%", opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: "-120%", opacity: 0 }}
            transition={{ type: "spring", damping: 30, stiffness: 400 }}
            rotationInterval={2600}
            auto={!prefersReducedMotion}
          />
        </motion.h1>
      </LayoutGroup>

      {/* Subtitle — Inter italic, not the rotator */}
      <p className="text-lg md:text-2xl text-obsidian/70 max-w-[600px] mx-auto mb-12 font-medium leading-relaxed italic">
        Experience the bridge between clinical precision and personalized care.
        Our state-of-the-art triage engine provides immediate clarity for your
        health journey.
      </p>
    </motion.div>
  </div>
</section>
```

### 5.1 Why `LayoutGroup` + `layout`?

`LayoutGroup` wraps the H1 so when the rotating word changes length (`Intelligence.` vs `Clarity.`), Motion can **smoothly reflow** the layout of surrounding layout-aware nodes. Both the static `Clinical` span and the `TextRotate` root use `layout`.

### 5.2 Reduced motion

```ts
const prefersReducedMotion = useReducedMotion()
// ...
auto={!prefersReducedMotion}
```

When the OS prefers reduced motion, rotation **stops** (`auto={false}`). The first word stays visible.

---

## 6. Italic styling rules (precise)

### 6.1 Rotating line (the signature look)

Applied via `mainClassName` on `TextRotate`:

```
justify-center font-serif italic tracking-tight text-sage
```

Breakdown:

| Class | Effect |
|-------|--------|
| `justify-center` | Flex justify on the rotator row |
| `font-serif` | Instrument Serif (true italic available) |
| `italic` | Uses Instrument Serif **italic** face |
| `tracking-tight` | Slightly tighter glyphs |
| `text-sage` | Accent color `#f2572b` |

**Do not** put `italic` on the static “Clinical” line. Contrast upright vs italic is intentional.

### 6.2 Clip / overflow for the wipe

```
splitLevelClassName="overflow-hidden pr-1 pb-2 md:pb-4"
```

- `overflow-hidden` — masks characters sliding from `y: 100%` → `0` and exiting to `y: -120%` (classic “curtain / mask” reveal).
- `pr-1` — tiny right padding so italic glyph overhang / period isn’t clipped horizontally.
- `pb-2 md:pb-4` — bottom padding so italic descenders and large `text-8xl` glyphs aren’t clipped by the mask.

### 6.3 Subtitle italic (secondary)

```
font-medium leading-relaxed italic
```

This is **Inter italic** (body stack), not Instrument Serif — softer editorial support under the display H1.

### 6.4 Elsewhere in the product (same italic language)

Pattern reused on the landing page:

```html
<span class="text-sage italic">trust.</span>
```

Utility alias:

```html
<span class="text-luxury">...</span>
<!-- = font-serif italic tracking-tight -->
```

---

## 7. TextRotate animation behavior (exact)

### 7.1 Defaults inside the component

| Prop | Component default | Hero override |
|------|-------------------|---------------|
| `splitBy` | `"characters"` | (default) |
| `rotationInterval` | `2000` ms | **`2600` ms** |
| `staggerDuration` | `0` | **`0.025` s** |
| `staggerFrom` | `"first"` | **`"last"`** |
| `loop` | `true` | (default) |
| `auto` | `true` | **`!prefersReducedMotion`** |
| `animatePresenceMode` | `"wait"` | (default) |
| `animatePresenceInitial` | `false` | (default) |
| `initial` | `{ y: "100%", opacity: 0 }` | same |
| `animate` | `{ y: 0, opacity: 1 }` | same |
| `exit` | `{ y: "-120%", opacity: 0 }` | same |
| `transition` | spring `damping: 25, stiffness: 300` | spring **`damping: 30, stiffness: 400`** |

### 7.2 Character stagger (hero-specific)

With `staggerFrom="last"` and `staggerDuration={0.025}`:

- Characters animate **from the end of the word toward the start**.
- Delay for character index `i` (0-based) among `total` characters:

```
delay = (total - 1 - i) * 0.025
```

Example for `Clarity.` (8 graphemes including `.`):

| Char | Index | Delay |
|------|-------|-------|
| `.` | 7 | 0 |
| `y` | 6 | 0.025 |
| `t` | 5 | 0.050 |
| … | … | … |
| `C` | 0 | 0.175 |

Enter and exit both use the same stagger function.

### 7.3 Motion per character

Each grapheme is a `motion.span` with `display: inline-block` so `y` transforms work:

1. **Enter**: from below the mask (`y: 100%`, opacity 0) → rest (`y: 0`, opacity 1)
2. **Exit**: to above the mask (`y: -120%`, opacity 0)
3. **Spring**: `type: "spring", damping: 30, stiffness: 400` (snappy, lightly underdamped)

`AnimatePresence mode="wait"` ensures the outgoing word finishes exiting before the next word enters.

### 7.4 Split algorithm

For `splitBy="characters"`:

1. Split current string on spaces into words.
2. Split each word into **graphemes** via `Intl.Segmenter("en", { granularity: "grapheme" })` (emoji/unicode safe); fallback `Array.from(text)`.
3. Render word wrappers; insert a literal space between words when `needsSpace` is true.

Hero texts are single words + period, so you effectively get one word object per string.

### 7.5 Accessibility

- Visible animated layer: `aria-hidden="true"`
- Screen readers get a live plain text twin:

```tsx
<span className="sr-only">{texts[currentTextIndex]}</span>
```

### 7.6 Imperative API (optional)

Ref exposes: `next()`, `previous()`, `jumpTo(index)`, `reset()`. Hero does not use the ref; rotation is interval-driven only.

### 7.7 Interval

```ts
useEffect(() => {
  if (!auto) return
  const intervalId = setInterval(next, rotationInterval) // 2600ms on hero
  return () => clearInterval(intervalId)
}, [next, rotationInterval, auto])
```

---

## 8. Full `TextRotate` component (copy-paste)

Use this file as-is in the other project (`components/ui/text-rotate.tsx`):

```tsx
"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react"
import {
  AnimatePresence,
  AnimatePresenceProps,
  motion,
  MotionProps,
  Transition,
} from "motion/react"

import { cn } from "../../lib/utils"

interface TextRotateProps {
  texts: string[]
  rotationInterval?: number
  initial?: MotionProps["initial"]
  animate?: MotionProps["animate"]
  exit?: MotionProps["exit"]
  animatePresenceMode?: AnimatePresenceProps["mode"]
  animatePresenceInitial?: boolean
  staggerDuration?: number
  staggerFrom?: "first" | "last" | "center" | number | "random"
  transition?: Transition
  loop?: boolean
  auto?: boolean
  splitBy?: "words" | "characters" | "lines" | string
  onNext?: (index: number) => void
  mainClassName?: string
  splitLevelClassName?: string
  elementLevelClassName?: string
}

export interface TextRotateRef {
  next: () => void
  previous: () => void
  jumpTo: (index: number) => void
  reset: () => void
}

interface WordObject {
  characters: string[]
  needsSpace: boolean
}

const TextRotate = forwardRef<TextRotateRef, TextRotateProps>(
  (
    {
      texts,
      transition = { type: "spring", damping: 25, stiffness: 300 },
      initial = { y: "100%", opacity: 0 },
      animate = { y: 0, opacity: 1 },
      exit = { y: "-120%", opacity: 0 },
      animatePresenceMode = "wait",
      animatePresenceInitial = false,
      rotationInterval = 2000,
      staggerDuration = 0,
      staggerFrom = "first",
      loop = true,
      auto = true,
      splitBy = "characters",
      onNext,
      mainClassName,
      splitLevelClassName,
      elementLevelClassName,
      ...props
    },
    ref
  ) => {
    const [currentTextIndex, setCurrentTextIndex] = useState(0)

    const splitIntoCharacters = (text: string): string[] => {
      if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
        const segmenter = new Intl.Segmenter("en", { granularity: "grapheme" })
        return Array.from(segmenter.segment(text), ({ segment }) => segment)
      }
      return Array.from(text)
    }

    const elements = useMemo(() => {
      const currentText = texts[currentTextIndex]
      if (splitBy === "characters") {
        const text = currentText.split(" ")
        return text.map((word, i) => ({
          characters: splitIntoCharacters(word),
          needsSpace: i !== text.length - 1,
        }))
      }
      return splitBy === "words"
        ? currentText.split(" ")
        : splitBy === "lines"
          ? currentText.split("\n")
          : currentText.split(splitBy)
    }, [texts, currentTextIndex, splitBy])

    const getStaggerDelay = useCallback(
      (index: number, totalChars: number) => {
        const total = totalChars
        if (staggerFrom === "first") return index * staggerDuration
        if (staggerFrom === "last") return (total - 1 - index) * staggerDuration
        if (staggerFrom === "center") {
          const center = Math.floor(total / 2)
          return Math.abs(center - index) * staggerDuration
        }
        if (staggerFrom === "random") {
          const randomIndex = Math.floor(Math.random() * total)
          return Math.abs(randomIndex - index) * staggerDuration
        }
        return Math.abs(staggerFrom - index) * staggerDuration
      },
      [staggerFrom, staggerDuration]
    )

    const handleIndexChange = useCallback(
      (newIndex: number) => {
        setCurrentTextIndex(newIndex)
        onNext?.(newIndex)
      },
      [onNext]
    )

    const next = useCallback(() => {
      const nextIndex =
        currentTextIndex === texts.length - 1
          ? loop
            ? 0
            : currentTextIndex
          : currentTextIndex + 1

      if (nextIndex !== currentTextIndex) {
        handleIndexChange(nextIndex)
      }
    }, [currentTextIndex, texts.length, loop, handleIndexChange])

    const previous = useCallback(() => {
      const prevIndex =
        currentTextIndex === 0
          ? loop
            ? texts.length - 1
            : currentTextIndex
          : currentTextIndex - 1

      if (prevIndex !== currentTextIndex) {
        handleIndexChange(prevIndex)
      }
    }, [currentTextIndex, texts.length, loop, handleIndexChange])

    const jumpTo = useCallback(
      (index: number) => {
        const validIndex = Math.max(0, Math.min(index, texts.length - 1))
        if (validIndex !== currentTextIndex) {
          handleIndexChange(validIndex)
        }
      },
      [texts.length, currentTextIndex, handleIndexChange]
    )

    const reset = useCallback(() => {
      if (currentTextIndex !== 0) {
        handleIndexChange(0)
      }
    }, [currentTextIndex, handleIndexChange])

    useImperativeHandle(
      ref,
      () => ({ next, previous, jumpTo, reset }),
      [next, previous, jumpTo, reset]
    )

    useEffect(() => {
      if (!auto) return
      const intervalId = setInterval(next, rotationInterval)
      return () => clearInterval(intervalId)
    }, [next, rotationInterval, auto])

    return (
      <motion.span
        className={cn("flex flex-wrap whitespace-pre-wrap", mainClassName)}
        {...props}
        layout
        transition={transition}
      >
        <span className="sr-only">{texts[currentTextIndex]}</span>

        <AnimatePresence
          mode={animatePresenceMode}
          initial={animatePresenceInitial}
        >
          <motion.div
            key={currentTextIndex}
            className={cn(
              "flex flex-wrap",
              splitBy === "lines" && "flex-col w-full"
            )}
            layout
            aria-hidden="true"
          >
            {(splitBy === "characters"
              ? (elements as WordObject[])
              : (elements as string[]).map((el, i) => ({
                  characters: [el],
                  needsSpace: i !== elements.length - 1,
                }))
            ).map((wordObj, wordIndex, array) => {
              const previousCharsCount = array
                .slice(0, wordIndex)
                .reduce((sum, word) => sum + word.characters.length, 0)

              return (
                <span
                  key={wordIndex}
                  className={cn("inline-flex", splitLevelClassName)}
                >
                  {wordObj.characters.map((char, charIndex) => (
                    <motion.span
                      initial={initial}
                      animate={animate}
                      exit={exit}
                      key={charIndex}
                      transition={{
                        ...transition,
                        delay: getStaggerDelay(
                          previousCharsCount + charIndex,
                          array.reduce(
                            (sum, word) => sum + word.characters.length,
                            0
                          )
                        ),
                      }}
                      className={cn("inline-block", elementLevelClassName)}
                    >
                      {char}
                    </motion.span>
                  ))}
                  {wordObj.needsSpace && (
                    <span className="whitespace-pre"> </span>
                  )}
                </span>
              )
            })}
          </motion.div>
        </AnimatePresence>
      </motion.span>
    )
  }
)

TextRotate.displayName = "TextRotate"

export { TextRotate }
```

---

## 9. Parent entrance animation (wraps whole hero copy)

Not part of `TextRotate`, but part of the hero text feel:

```ts
initial={{ opacity: 0, y: 30 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 1.2, ease: "easeOut" }}
```

The H1 block (static + rotator) fades/slides up once on mount over **1.2s**.

---

## 10. Word list & copy (as shipped)

```ts
texts: [
  "Intelligence.",
  "Precision.",
  "Clarity.",
  "Assurance.",
  "Empathy.",
]
```

Static prefix: `Clinical`

Subtitle (`BRAND.copy.hero_sub`):

> Experience the bridge between clinical precision and personalized care. Our state-of-the-art triage engine provides immediate clarity for your health journey.

---

## 11. Rebuild checklist (for the other project)

1. Install `motion`, load **Instrument Serif italic** + Inter.
2. Map `font-serif`, `obsidian`, `sage` (`#f2572b`) in theme/CSS.
3. Copy `TextRotate` + `cn` helper.
4. Stack H1: upright `Clinical` + `TextRotate` with **exact** hero props from §5.
5. Keep `overflow-hidden` + bottom padding on the split level so the wipe clips cleanly.
6. Wire `useReducedMotion` → `auto={!prefersReducedMotion}`.
7. Verify: rotating line is coral italic serif; static line is black upright serif; chars stagger from the **end**; cycle every **2.6s**.

### Common failure modes

| Symptom | Likely cause |
|---------|----------------|
| Fake / slanted upright italic | Font loaded without italic (`ital@0;1`) |
| Characters don’t slide, whole word pops | Missing `inline-block` on char spans, or no `overflow-hidden` mask |
| Descenders clipped | Missing `pb-2 md:pb-4` on split level |
| Period / italic edge clipped | Missing `pr-1` |
| Layout jump when word length changes | Missing `LayoutGroup` / `layout` on H1 + rotator |
| Animation runs when user asked for less motion | Forgot `useReducedMotion` gate on `auto` |

---

## 12. Minimal CSS-only equivalent of the italic *look* (no animation)

If you only need the static typographic pairing:

```html
<h1 style="font-family: 'Instrument Serif', Georgia, serif; font-size: clamp(3rem, 8vw, 6rem); font-weight: 600; line-height: 0.9; letter-spacing: -0.05em; color: #171717; text-align: center;">
  <span style="display: block;">Clinical</span>
  <span style="display: block; font-style: italic; color: #f2572b; letter-spacing: -0.025em;">
    Intelligence.
  </span>
</h1>
```

Animation still requires the Motion + `TextRotate` stack in §7–§8.

---

*Generated from MediTriage production sources: `Landing.jsx`, `text-rotate.tsx`, `index.css`, `constants.ts`.*
