# Design System Strategy: The Editorial Engineer

## 1. Overview & Creative North Star
This design system is built for the "Editorial Engineer." It rejects the softness of modern consumer SaaS in favor of the uncompromising precision of architectural blueprints and high-end technical journals. It is designed for enterprise Odoo implementation—a task requiring absolute clarity, structural integrity, and professional authority.

**The Creative North Star: Architectural Brutalism**
The system treats the UI not as a collection of widgets, but as a structured environment. We utilize intentional asymmetry, massive typographic contrast, and a "monolithic" approach to layout. By removing all corner radii and traditional borders, we create a space that feels engineered, high-end, and permanent.

---

## 2. Colors & Tonal Architecture
The palette is a sophisticated exercise in restraint. We have eliminated all warm, "friendly" undertones in favor of a cold, technical spectrum of deep slates and charcoals, punctuated by a singular, surgical accent.

### The Palette
*   **Primary (Enterprise Plum - #714B67):** Use this with extreme intent. It is a marker of "The Active State" or "The Critical Path." It should never be used for large surfaces, only for precise accents (CTAs, active tab indicators, or critical data points).
*   **Secondary/Tertiary (Slate & Charcoal):** `secondary` (#526075) and `tertiary` (#526074) provide the structural foundation, offering a cool, metallic depth.
*   **Neutral/Surface:** Ranging from `surface-container-lowest` (#ffffff) to `surface-dim` (#cdd9ff), these create the environment.

### The "No-Line" Rule
**Borders are prohibited for sectioning.** To define the architecture of a page, designers must use background color shifts. A side navigation should be `surface-container-low` against a `surface` background. The "line" is created by the juxtaposition of two colors, not a 1px stroke. This forces a cleaner, more deliberate layout.

### Surface Hierarchy & Nesting
Treat the UI as a series of nested physical layers. 
*   **Base:** `surface` (#faf8ff).
*   **Large Structural Blocks:** `surface-container-low` (#f2f3ff).
*   **Interactive Cards/Modules:** `surface-container-lowest` (#ffffff).
By placing the "lowest" (brightest) tier on top of "low" tiers, we create a natural, architectural lift that mimics fine paper stacked on a slate desk.

### The "Glass & Gradient" Rule
For high-end floating elements (modals, dropdowns), use **Glassmorphism**. Apply a semi-transparent `surface` color with a `backdrop-blur` of 20px. To add "soul" to hero sections, utilize a subtle linear gradient from `primary` (#79526f) to `primary-container` (#ffd7f1) at a 45-degree angle, ensuring it feels like a light refraction rather than a decorative element.

---

## 3. Typography: The Technical Voice
We use **Manrope** for its unique balance between geometric precision and high-readability.

*   **Display Scale:** Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) for high-impact editorial moments. This conveys authority.
*   **The Label System:** `label-md` and `label-sm` are the "engineer’s notes." Use these for metadata, captions, and micro-copy. They should often be in all-caps with increased letter-spacing (+0.05em) to mimic technical drawings.
*   **Hierarchy:** Pair a bold `headline-sm` with a regular `body-md`. The contrast in weight and size is what creates the "Editorial" feel—information is not just displayed; it is curated.

---

## 4. Elevation & Depth
Depth in this system is achieved through **Tonal Layering**, not structural shadows.

*   **The Layering Principle:** Avoid shadows for static elements. Use the `surface-container` tokens to stack elements. An inner module should be one step lighter or darker than its parent container.
*   **Ambient Shadows:** When an element must float (e.g., a primary modal), use a high-dispersion, low-opacity shadow: `0 20px 40px rgba(17, 48, 105, 0.08)`. The shadow color is derived from `on-surface` to keep it natural and integrated.
*   **The "Ghost Border" Fallback:** If accessibility requires a container definition in high-density data views, use a "Ghost Border": `outline-variant` at 15% opacity. Never use a 100% opaque border.
*   **Sharpness:** All corners are `0px`. No exceptions. This reinforces the "Architectural" North Star.

---

## 5. Components

### Buttons
*   **Primary:** Sharp squares, `primary` background, `on-primary` text. No icons unless they represent a specific technical action (e.g., "Download PDF").
*   **Secondary:** `surface-container-high` background with a `primary` text label. 
*   **Tertiary:** Transparent background, `primary` text, with a 2px `primary` bottom-border that only appears on hover.

### Input Fields
*   **State:** Use `surface-container-highest` for the input track. 
*   **Indicator:** When focused, use a 2px `primary` border on the *left side only* to signify the active line—reminiscent of a cursor in a code editor.
*   **Corners:** Strict 0px.

### Cards & Lists
*   **No Dividers:** Prohibit horizontal lines between list items. Use the Spacing Scale (e.g., `spacing-4`) to create air. 
*   **Grouping:** Group related list items within a `surface-container-low` block to separate them from the main flow.

### Implementation Specific: The "Odoo Grid"
Since this is for Odoo implementation, data density is high. Use the strict grid-based layout to align every label and value. If a column of data exists, its header must align perfectly with the "Editorial" headline of the section above it. Use `spacing-1` for tight data relationships and `spacing-10` for section breaks.

---

## 6. Do’s and Don’ts

### Do:
*   **Embrace White Space:** High-end design requires "breathing room." If a screen feels crowded, increase the `spacing` tokens rather than adding borders.
*   **Use Mono-spaced Numbers:** Where possible, use Manrope's tabular figures for data columns to maintain the "Engineer" precision.
*   **Align to the Grid:** Every element must snap to the underlying grid. Asymmetry should be intentional (e.g., a wide left margin for a headline), not accidental.

### Don’t:
*   **No Rounding:** Do not use `border-radius`. Even a 2px radius breaks the architectural integrity of this system.
*   **No Warm Tones:** Avoid any hex code with high red/yellow values unless it is the specific `primary` plum or an `error` state.
*   **No Default Shadows:** Never use the standard CSS "drop shadow." If it doesn't look like ambient light hitting a physical surface, it doesn't belong.
*   **No Icons as Decoration:** Icons must be functional. Do not use them to "pretty up" a layout. If the text is clear, the icon is often redundant.