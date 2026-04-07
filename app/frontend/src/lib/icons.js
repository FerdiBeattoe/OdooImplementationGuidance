/**
 * Lucide icon helper — creates inline SVG elements from the lucide icon library.
 * Requires window.lucide to be loaded (via UMD script in index.html).
 * Retries if lucide hasn't loaded yet when the function runs.
 */

// Diagnostic — log actual icon key format on load
if (typeof window !== "undefined") {
  setTimeout(() => {
    if (window.lucide && window.lucide.icons) {
      const keys = Object.keys(window.lucide.icons);
      console.log("[icons.js] First 5 keys:", keys.slice(0, 5));
      console.log("[icons.js] building2 exists:", !!window.lucide.icons["building2"]);
      console.log("[icons.js] Building2 exists:", !!window.lucide.icons["Building2"]);
      console.log("[icons.js] arrowLeft exists:", !!window.lucide.icons["arrowLeft"]);
      const sample = window.lucide.icons[keys[0]];
      console.log("[icons.js] Sample icon format:", JSON.stringify(sample).slice(0, 200));
    }
  }, 500);
}

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
    if (!window.lucide || !window.lucide.icons) {
      setTimeout(tryRender, 100);
      return;
    }

    const icons = window.lucide.icons;
    const camelName = name
      .split("-")
      .map((part, i) => {
        if (i === 0) return part.toLowerCase();
        if (/^\d+$/.test(part)) return part;
        return part[0].toUpperCase() + part.slice(1).toLowerCase();
      })
      .join("");

    const PascalName = camelName[0].toUpperCase() + camelName.slice(1);

    const iconData = icons[camelName] || icons[PascalName];

    if (!iconData) {
      svg.setAttribute("data-icon-missing", name);
      return;
    }

    svg.innerHTML = "";

    // Format 1: [tag, attrs, children[]]
    if (Array.isArray(iconData) && iconData[2]) {
      iconData[2].forEach((child) => {
        if (!Array.isArray(child)) return;
        const el = document.createElementNS("http://www.w3.org/2000/svg", child[0]);
        Object.entries(child[1] || {}).forEach(([k, v]) => el.setAttribute(k, v));
        svg.appendChild(el);
      });
      return;
    }

    // Format 2: function that returns SVG string
    if (typeof iconData === "function") {
      const result = iconData({});
      if (typeof result === "string") {
        svg.innerHTML = result;
        return;
      }
    }

    // Format 3: object with toSvg method
    if (iconData && iconData.toSvg) {
      svg.innerHTML = iconData.toSvg();
      return;
    }

    // Format 4: direct SVG innerHTML
    if (typeof iconData === "string") {
      svg.innerHTML = iconData;
      return;
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
