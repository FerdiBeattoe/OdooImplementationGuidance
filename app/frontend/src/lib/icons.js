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
    if (window.lucide && window.lucide.icons) {
      const iconName = name
        .split("-")
        .map((p, i) => (i === 0 ? p : p[0].toUpperCase() + p.slice(1)))
        .join("");
      const iconData = window.lucide.icons[iconName];
      if (iconData && iconData[2]) {
        svg.innerHTML = "";
        iconData[2].forEach((child) => {
          if (!Array.isArray(child)) return;
          const el = document.createElementNS("http://www.w3.org/2000/svg", child[0]);
          const attrs = child[1] || {};
          Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
          svg.appendChild(el);
        });
      }
    } else {
      setTimeout(tryRender, 100);
    }
  }
  tryRender();
  return svg;
}
