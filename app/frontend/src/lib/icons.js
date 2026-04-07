/**
 * Lucide icon helper — creates inline SVG elements from the lucide icon library.
 * Requires window.lucide to be loaded (via UMD script in index.html).
 * Retries if lucide hasn't loaded yet when the function runs.
 */
export function lucideIcon(name, size = 20) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svg.setAttribute("width", String(size));
  svg.setAttribute("height", String(size));
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  svg.style.display = "inline-block";
  svg.style.verticalAlign = "middle";
  svg.style.flexShrink = "0";

  function tryRender() {
    if (!window.lucide) {
      setTimeout(tryRender, 100);
      return;
    }

    // Method 1: icons object (camelCase and PascalCase keys)
    const icons = window.lucide.icons || {};

    const camelName = name
      .split("-")
      .map((part, i) => {
        if (i === 0) return part.toLowerCase();
        if (/^\d+$/.test(part)) return part;
        return part[0].toUpperCase() + part.slice(1).toLowerCase();
      })
      .join("");

    const PascalName = camelName[0].toUpperCase() + camelName.slice(1);

    // Method 2: direct property on lucide (e.g. window.lucide.Building2)
    const iconData = icons[camelName] || icons[PascalName] ||
      window.lucide[PascalName] || window.lucide[camelName];

    if (iconData) {
      svg.innerHTML = "";
      if (Array.isArray(iconData)) {
        const children = iconData[2] || [];
        children.forEach((child) => {
          if (!Array.isArray(child)) return;
          const el = document.createElementNS("http://www.w3.org/2000/svg", child[0]);
          const attrs = child[1] || {};
          Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
          svg.appendChild(el);
        });
      }
    } else {
      // Fallback: draw a simple square so missing icons are visible
      const rect = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      rect.setAttribute("width", "18");
      rect.setAttribute("height", "18");
      rect.setAttribute("x", "3");
      rect.setAttribute("y", "3");
      rect.setAttribute("rx", "2");
      rect.setAttribute("fill", "none");
      svg.appendChild(rect);
      svg.setAttribute("data-icon-missing", name);
    }
  }
  tryRender();
  return svg;
}

// Self-test on load
if (typeof window !== "undefined") {
  setTimeout(() => {
    const testSvg = lucideIcon("building-2", 20);
    const hasPaths = testSvg.querySelectorAll("path, rect, circle, line").length > 0;
    console.log("[icons.js] Lucide test:",
      hasPaths ? "PASS" : "FAIL",
      "window.lucide:", !!window.lucide,
      "icons count:", Object.keys(window.lucide?.icons || {}).length);
  }, 1000);
}
