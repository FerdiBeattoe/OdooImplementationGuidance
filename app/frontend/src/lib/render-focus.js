function canPreserveSelection(node) {
  const tagName = node?.tagName?.toLowerCase();
  return tagName === "input" || tagName === "textarea";
}

function getChildIndex(parent, child) {
  if (!parent?.childNodes) {
    return -1;
  }

  return Array.prototype.indexOf.call(parent.childNodes, child);
}

export function captureRenderFocus(root, activeElement = root?.ownerDocument?.activeElement ?? null) {
  if (!root || !activeElement || activeElement === root) {
    return null;
  }

  if (typeof root.contains === "function" && !root.contains(activeElement)) {
    return null;
  }

  const path = [];
  let currentNode = activeElement;

  while (currentNode && currentNode !== root) {
    const parentNode = currentNode.parentNode;
    const childIndex = getChildIndex(parentNode, currentNode);

    if (!parentNode || childIndex < 0) {
      return null;
    }

    path.unshift(childIndex);
    currentNode = parentNode;
  }

  return {
    path,
    selectionStart: canPreserveSelection(activeElement) ? activeElement.selectionStart : null,
    selectionEnd: canPreserveSelection(activeElement) ? activeElement.selectionEnd : null
  };
}

export function restoreRenderFocus(root, snapshot) {
  if (!root || !snapshot?.path?.length) {
    return;
  }

  let currentNode = root;

  for (const childIndex of snapshot.path) {
    if (!currentNode?.childNodes || childIndex >= currentNode.childNodes.length) {
      return;
    }

    currentNode = currentNode.childNodes[childIndex];
  }

  if (!currentNode || typeof currentNode.focus !== "function") {
    return;
  }

  currentNode.focus();

  if (!canPreserveSelection(currentNode) || typeof currentNode.setSelectionRange !== "function") {
    return;
  }

  const valueLength = typeof currentNode.value === "string" ? currentNode.value.length : 0;
  const selectionStart = Math.min(snapshot.selectionStart ?? valueLength, valueLength);
  const selectionEnd = Math.min(snapshot.selectionEnd ?? selectionStart, valueLength);

  currentNode.setSelectionRange(selectionStart, selectionEnd);
}
