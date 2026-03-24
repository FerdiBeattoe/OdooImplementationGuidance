# Design System Specification: The Enterprise Architect

## 1. Overview & Creative North Star
**Creative North Star: "The Editorial Engineer"**
Most enterprise tools feel like spreadsheets—dense, rigid, and exhausting. This design system breaks the "DOS-like" legacy of ERP implementation by treating data with editorial intent. We move away from the "box-within-a-box" layout toward a **layered, glass-like experience** that feels sophisticated yet authoritative. 

By leveraging intentional asymmetry, high-contrast typography scales, and tonal depth, we transform a complex implementation tool into a guided journey. The interface shouldn't just show data; it should narrate the progress of the enterprise.

---

## 2. Colors & Surface Philosophy
Our palette moves beyond simple "brand colors" into functional layers that provide cognitive relief.

### The Palette
- **Primary (`#57344f`):** A sophisticated deep plum, evolving Odoo’s heritage into a premium executive tone. Use for high-intent actions.
- **Secondary (`#13677b`):** A functional teal. This is our "Implementation Blue," used for progress, technical status, and guidance.
- **Surface System:** We utilize a "Cool Slate" spectrum (`#f7f9fb` to `#eceef0`) to define hierarchy without visual noise.

### The "No-Line" Rule
**Strict Mandate:** Traditional 1px solid borders are prohibited for sectioning. 
Structure is defined through:
1.  **Background Color Shifts:** Place a `surface_container_low` section atop a `surface` background.
2.  **Tonal Transitions:** Use the `surface_container` tiers to nest content.
3.  **Soft Negative Space:** Let the `3` (1rem) or `4` (1.4rem) spacing tokens do the work of a divider.

### Glass & Gradient Rule
To achieve a "High-Tech SaaS" aesthetic, floating elements (modals, popovers) must use **Glassmorphism**. Apply the `surface_container_lowest` token with a `backdrop-filter: blur(12px)` at 90% opacity. For primary CTAs, apply a subtle linear gradient from `primary` to `primary_container` to give the button "physicality" and soul.

---

## 3. Typography: The Narrative Hierarchy
We use a dual-font strategy to balance technical precision with high-end editorial feel.

*   **Display & Headlines (Manrope):** A modern geometric sans-serif with an open aperture. Use `display-lg` and `headline-md` to create "Landmark Moments" in the implementation process.
*   **Body & UI (Inter):** The workhorse. Inter’s tall x-height ensures readability for complex data strings.

| Role | Token | Font | Size | Intent |
| :--- | :--- | :--- | :--- | :--- |
| **Hero Title** | `display-md` | Manrope | 2.75rem | Major Module Headers |
| **Section Title** | `headline-sm`| Manrope | 1.5rem | Data Category Grouping |
| **Primary UI** | `title-sm` | Inter | 1rem | Input Labels / Navigation |
| **Data/Body** | `body-md` | Inter | 0.875rem | Default Table & Form Text |
| **Technical** | `label-sm` | Inter | 0.6875rem | Status Badges / Metadata |

---

## 4. Elevation & Depth: Tonal Layering
Depth in this system is a result of **physical stacking**, not artificial shadows.

*   **The Layering Principle:** 
    *   Level 0: `surface` (The canvas)
    *   Level 1: `surface_container_low` (Sidebar or Background cards)
    *   Level 2: `surface_container_lowest` (Interactive cards/Active workspace)
*   **Ambient Shadows:** For floating elements (menus), use an ultra-diffused shadow: `box-shadow: 0 12px 40px rgba(25, 28, 30, 0.06)`. The shadow color is derived from `on_surface`, never pure black.
*   **The "Ghost Border" Fallback:** If a container requires definition against a similar background, use `outline_variant` at **15% opacity**. This creates a "whisper" of an edge rather than a hard line.

---

## 5. Components & Primitive Styles

### Buttons (The "Soft-Tactile" State)
*   **Primary:** Gradient from `primary` to `primary_container`. Radius: `md` (0.75rem). Use `on_primary` for text.
*   **Secondary:** Ghost style. Transparent background with a `secondary` text color and a `secondary_fixed` background on hover.
*   **Tertiary:** No background. Use `on_surface_variant` for subtle utility actions.

### Progress & Steppers (Guided Experience)
Since this is an implementation tool, progress is paramount.
*   **Implementation Tracks:** Use `secondary_container` for the track and `secondary` for the fill. 
*   **Step Indicators:** Use `xl` (1.5rem) roundedness for circular step indicators to create a "High-Tech" soft feel.

### Form Inputs
*   **Visual Style:** Forbid heavy borders. Use `surface_container_high` as the input background with a 2px bottom-accent in `outline` that transitions to `primary` on focus.
*   **Rounding:** `DEFAULT` (0.5rem) to maintain a professional, crisp edge.

### Cards & Data Lists
*   **Zero-Divider Policy:** Never use `<hr>` or border-bottoms. Use the Spacing Scale `2` (0.7rem) for vertical separation and `surface_container_low` for alternating row backgrounds if the data is extremely dense.

### Custom Component: The "Implementation Health" Card
A signature component for this system. Use a `surface_container_lowest` card with a `secondary` glow (blur 20px, opacity 10%) behind it to indicate a "Live" or "Active" implementation module.

---

## 6. Do’s and Don’ts

### Do
*   **Do** use asymmetrical layouts. A wider left column for data and a narrower right column for "Expert Guidance" creates an editorial feel.
*   **Do** use the `primary_fixed` color for "Success" or "Complete" states to soften the traditional "Green" which can feel jarring in a premium palette.
*   **Do** embrace whitespace. If you think there is enough space, add one more increment from the spacing scale (`4` to `5`).

### Don't
*   **Don't** use 100% black. Use `on_surface` (`#191c1e`) for all text to maintain the slate-professional tone.
*   **Don't** use sharp corners (`none`). This evokes the "DOS" era we are moving away from. Stick to `md` (0.75rem) as your baseline.
*   **Don't** cluster more than 7 data points in a single view without a `surface_container` break. Complex Odoo data must be "chunked" to remain intuitive.