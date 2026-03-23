import test from "node:test";
import assert from "node:assert/strict";

import { captureRenderFocus, restoreRenderFocus } from "./render-focus.js";

function createNode(tagName, children = []) {
  const node = {
    tagName,
    childNodes: [],
    parentNode: null,
    value: "",
    selectionStart: null,
    selectionEnd: null,
    focused: false,
    focus() {
      this.focused = true;
    },
    setSelectionRange(start, end) {
      this.selectionStart = start;
      this.selectionEnd = end;
    },
    contains(target) {
      if (this === target) {
        return true;
      }

      return this.childNodes.some((child) => typeof child.contains === "function" && child.contains(target));
    }
  };

  children.forEach((child) => appendChild(node, child));
  return node;
}

function appendChild(parent, child) {
  child.parentNode = parent;
  parent.childNodes.push(child);
}

test("captureRenderFocus stores the active input path and selection", () => {
  const input = createNode("INPUT");
  input.value = "Draft";
  input.selectionStart = 5;
  input.selectionEnd = 5;

  const root = createNode("DIV", [createNode("SECTION", [createNode("DIV", [input])])]);
  const snapshot = captureRenderFocus(root, input);

  assert.deepEqual(snapshot, {
    path: [0, 0, 0],
    selectionStart: 5,
    selectionEnd: 5
  });
});

test("restoreRenderFocus refocuses the remounted input at the same path", () => {
  const root = createNode("DIV", [createNode("SECTION", [createNode("DIV", [createNode("INPUT")])])]);
  const nextInput = root.childNodes[0].childNodes[0].childNodes[0];
  nextInput.value = "Updated";

  restoreRenderFocus(root, {
    path: [0, 0, 0],
    selectionStart: 7,
    selectionEnd: 7
  });

  assert.equal(nextInput.focused, true);
  assert.equal(nextInput.selectionStart, 7);
  assert.equal(nextInput.selectionEnd, 7);
});

test("restoreRenderFocus fails safe when the remounted path no longer exists", () => {
  const root = createNode("DIV", [createNode("SECTION")]);

  assert.doesNotThrow(() =>
    restoreRenderFocus(root, {
      path: [0, 1, 0],
      selectionStart: 1,
      selectionEnd: 1
    })
  );
});
