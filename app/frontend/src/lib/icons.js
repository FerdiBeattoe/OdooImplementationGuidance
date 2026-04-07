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

  function toPascalCase(kebab) {
    return kebab
      .split("-")
      .map((part) => {
        if (/^\d+$/.test(part)) return part;
        return part[0].toUpperCase() + part.slice(1).toLowerCase();
      })
      .join("");
  }

  function render() {
    if (!window.lucide || !window.lucide.icons) {
      setTimeout(render, 100);
      return;
    }

    const key = toPascalCase(name);
    const iconData = window.lucide.icons[key];

    if (!iconData) {
      svg.setAttribute("data-icon-missing", name);
      return;
    }

    svg.innerHTML = "";

    // Format: flat array of child tuples e.g. [["path",{"d":"..."}], ...]
    const children = Array.isArray(iconData[0])
      ? iconData        // flat array
      : iconData[2];    // wrapped: [tag, attrs, children]

    if (!children) return;

    children.forEach((child) => {
      if (!Array.isArray(child)) return;
      const el = document.createElementNS("http://www.w3.org/2000/svg", child[0]);
      Object.entries(child[1] || {}).forEach(([k, v]) => el.setAttribute(k, v));
      svg.appendChild(el);
    });
  }

  render();
  return svg;
}
