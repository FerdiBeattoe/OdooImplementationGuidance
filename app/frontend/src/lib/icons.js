/**
 * Lucide icon helper — creates inline SVG elements from the lucide icon library.
 * Requires window.lucide to be loaded (via UMD script in index.html).
 */
export function lucideIcon(name, size = 20) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("width", size);
  svg.setAttribute("height", size);
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "2");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");

  const iconData = window.lucide && window.lucide.icons[name];
  if (iconData) {
    (iconData[2] || []).forEach(child => {
      const childEl = document.createElementNS("http://www.w3.org/2000/svg", child[0]);
      Object.entries(child[1] || {}).forEach(([k, v]) => childEl.setAttribute(k, v));
      svg.appendChild(childEl);
    });
  }
  return svg;
}
