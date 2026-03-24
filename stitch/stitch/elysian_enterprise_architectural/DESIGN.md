# Design System Specification: Architectural Precision

## 1. Overview & Creative North Star: "The Editorial Engineer"
This design system rejects the "bubbly" friendliness of modern SaaS in favor of a rigid, architectural authority. Our Creative North Star is **The Editorial Engineer**: a synthesis of high-end Swiss typography and brutalist structural integrity. 

The aesthetic is defined by **zero-radius geometry** and **tonal depth**. We move away from generic templates by utilizing intentional asymmetry—placing oversized display type against stark, empty containers. The interface should feel like a technical blueprint rendered on premium stationery. By removing all rounded corners, we emphasize the grid as the primary storytelling tool, creating a digital environment that feels constructed, not just rendered.

---

## 2. Color & Tonal Architecture
Color is used here as a structural material, not just decoration. We prioritize background shifts over lines to define space.

*   **Primary (#57344f) & Primary Container (#714b67):** These represent our "structural ink." Use these for high-impact actions and key navigational anchors.
*   **The "No-Line" Rule:** 1px solid borders are strictly prohibited for sectioning. To separate content, transition from `surface` (#fff7f9) to `surface-container-low` (#faf1f4). If a boundary feels too soft, increase the contrast to `surface-container-high` (#efe6e9) rather than reaching for a stroke.
*   **Surface Hierarchy & Nesting:** Treat the UI as stacked sheets of rigid cardstock. 
    *   *Base:* `surface`
    *   *Sectioning:* `surface-container-low`
    *   *Interactive Elements:* `surface-container-highest`
*   **Signature Textures:** For Hero sections or large CTAs, apply a subtle linear gradient from `primary` (#57344f) to `primary_container` (#714b67) at a 135-degree angle. This adds a "weighted" feel to the architectural sharp edges.
*   **The Glass Rule:** For floating navigation or overlays, use `surface_container_lowest` at 85% opacity with a `24px` backdrop blur. This ensures the rigid grid remains visible beneath the active layer.

---

## 3. Typography: The Manrope Monolith
We use **Manrope** exclusively. Its geometric construction complements our square-cornered containers.

*   **Display (LG: 3.5rem / MD: 2.75rem):** Set with `-0.04em` letter spacing. These are your architectural anchors. Use them sparingly, often aligned to the far left or right of a container to create asymmetric tension.
*   **Headlines (LG: 2rem / MD: 1.75rem):** Always SemiBold. Use these to label major functional blocks.
*   **Title (LG: 1.375rem):** The workhorse for card headers. 
*   **Body (LG: 1rem / MD: 0.875rem):** Set with generous line-height (1.6) to provide "white space" within the rigid containers.
*   **Label (MD: 0.75rem):** Always Uppercase with `+0.05em` letter spacing to mimic technical annotations on a schematic.

---

## 4. Elevation & Depth: Tonal Layering
In a world of sharp corners, traditional shadows can look muddy. We use **Tonal Layering** to define hierarchy.

*   **The Layering Principle:** Depth is achieved by "stepping." A `surface-container-lowest` (#ffffff) card sitting on a `surface-container` (#f4ecee) background provides sufficient contrast without the need for an outline.
*   **Ambient Shadows:** If an element must float (e.g., a modal), use a "Shadow-Wash." Color: `on-surface` (#1e1b1d) at 4% opacity. Blur: `40px`. Spread: `0px`. This creates a natural atmospheric lift rather than a harsh "drop shadow."
*   **The Ghost Border Fallback:** Only when accessibility demands it, use `outline-variant` (#d1c3ca) at 20% opacity. 100% opaque borders are forbidden as they "trap" the editorial flow.

---

## 5. Components: The Square Primitives

### Buttons
*   **Shape:** 0px (Square). No exceptions.
*   **Primary:** `primary` background with `on-primary` text. Use `spacing-6` (1.5rem) horizontal padding.
*   **Secondary:** `secondary-container` background. Sharp corners create a "block" look that feels more integrated into the grid.
*   **Interaction:** On hover, shift background to `primary-container`.

### Input Fields
*   **Styling:** Background `surface-container-high`, 0px border-radius, and a 2px bottom-border of `outline` (#80747a). 
*   **Focus State:** The bottom border transforms into `primary`. Do not use a four-sided focus ring; it breaks the vertical flow of the architectural grid.

### Cards & Lists
*   **The Divider Rule:** Forbid the use of 1px horizontal lines. 
*   **Implementation:** Use `spacing-8` (2rem) of vertical white space to separate list items. If separation is visually required, use a subtle background shift to `surface-container-low` for alternating items (Zebra striping without lines).
*   **Cards:** Use `surface-container-lowest` with sharp corners. The lack of shadow and roundness makes the card feel like a part of the page's structure rather than an object sitting on top of it.

### Editorial Data Grids (Custom Component)
Instead of standard tables, use "Technical Lists." Small `label-md` headers in `on-surface-variant` (#4e444a), with data points separated by `spacing-4` (1rem). Use a vertical `primary` accent bar (2px wide) on the far left of the active row to indicate selection.

---

## 6. Do’s and Don’ts

**Do:**
*   **Do** align all text to a strict vertical baseline. 
*   **Do** use asymmetrical layouts (e.g., a 4-column content area next to an 8-column empty space).
*   **Do** use `primary-fixed` (#ffd7f1) for subtle highlights in technical readouts or data visualizations.

**Don’t:**
*   **Don’t** use a single pixel of border-radius. Even a 1px "softening" destroys the architectural intent.
*   **Don’t** use icons with rounded terminals. Use sharp, geometric iconography to match the Manrope/Square aesthetic.
*   **Don’t** use center-alignment for long-form content. Architectural design is grounded; use left-alignment to maintain the "edge."

---

## 7. Spacing Scale
Maintain a rigid rhythmic unit. All spacing must be a multiple of **4px**.
*   **Micro-spacing:** `spacing-1` (0.25rem) or `spacing-2` (0.5rem) for label/input relationships.
*   **Section Spacing:** `spacing-16` (4rem) or `spacing-24` (6rem). Large gaps are necessary to prevent a square, grid-heavy design from feeling "cramped" or "cluttered." Space is the luxury that makes it feel high-end.