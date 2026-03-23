export function el(tag, options = {}, children = []) {
  const node = document.createElement(tag);

  Object.entries(options).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      return;
    }

    if (key === "className") {
      node.className = value;
      return;
    }

    if (key === "dataset") {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        node.dataset[dataKey] = dataValue;
      });
      return;
    }

    if (key.startsWith("on") && typeof value === "function") {
      node.addEventListener(key.slice(2).toLowerCase(), value);
      return;
    }

    if (key === "text") {
      node.textContent = value;
      return;
    }

    node.setAttribute(key, value);
  });

  const normalizedChildren = Array.isArray(children) ? children : [children];

  normalizedChildren
    .filter(Boolean)
    .forEach((child) => {
      if (typeof child === "string") {
        node.append(document.createTextNode(child));
        return;
      }

      node.append(child);
    });

  return node;
}

export function clearNode(node) {
  while (node.firstChild) {
    node.removeChild(node.firstChild);
  }
}
