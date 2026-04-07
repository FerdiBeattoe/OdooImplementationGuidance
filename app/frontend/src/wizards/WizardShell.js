import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";

/**
 * WizardShell — shared scaffold for all 12 module setup wizards.
 *
 * Usage:
 *   const shell = createWizardShell({ title, steps, onComplete, onCancel });
 *   shell.render()    → DOM element to mount
 *   shell.goToStep(n) → jump to a step
 *   shell.setStepData(n, data) → store step data
 *   shell.getAllData() → { step0: {...}, step1: {...}, ... }
 */
export function createWizardShell({ title, subtitle, icon, steps, onComplete, onCancel }) {
  let currentStep = 0;
  const stepData = steps.map(() => ({}));
  let contentArea = null;
  let stepperArea = null;
  let prevBtn = null;
  let nextBtn = null;
  let progressLabel = null;

  function validateCurrentStep() {
    if (!contentArea) return true;
    const requiredInputs = contentArea.querySelectorAll("[data-required='true']");
    let valid = true;
    requiredInputs.forEach(input => {
      const val = (input.value || "").trim();
      const errorEl = input.parentElement?.querySelector(".field-error");
      if (!val) {
        input.classList.add("error");
        if (errorEl) errorEl.classList.add("visible");
        valid = false;
      } else {
        input.classList.remove("error");
        if (errorEl) errorEl.classList.remove("visible");
      }
    });
    if (!valid) {
      const first = contentArea.querySelector("input.error, select.error");
      if (first) first.focus();
    }
    return valid;
  }

  function getCurrentContent() {
    return steps[currentStep]?.render({
      data: stepData[currentStep],
      allData: stepData,
      setData: (patch) => {
        stepData[currentStep] = { ...stepData[currentStep], ...patch };
      }
    });
  }

  function updateStepper() {
    if (!stepperArea) return;
    while (stepperArea.firstChild) stepperArea.removeChild(stepperArea.firstChild);

    steps.forEach((step, i) => {
      const isDone    = i < currentStep;
      const isActive  = i === currentStep;

      const circleStyle = isDone
        ? "width: 32px; height: 32px; border-radius: 50%; background: #f59e0b; color: #0c1a30; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center;"
        : isActive
        ? "width: 32px; height: 32px; border-radius: 50%; background: #0c1a30; color: #ffffff; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center;"
        : "width: 32px; height: 32px; border-radius: 50%; background: #f1f5f9; color: #94a3b8; border: 1px solid #e2e8f0; font-size: 13px; font-weight: 600; display: flex; align-items: center; justify-content: center;";

      const labelColor = isActive || isDone ? "#0c1a30" : "#64748b";

      const dot = el("div", {
        style: "display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0;",
      }, [
        el("div", { style: circleStyle }, [
          isDone
            ? lucideIcon("check", 16)
            : el("span", { text: String(i + 1) })
        ]),
        el("span", {
          style: `font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: ${labelColor};`,
          text: step.label || `Step ${i + 1}`
        })
      ]);

      stepperArea.append(dot);

      // connector (not after last)
      if (i < steps.length - 1) {
        stepperArea.append(el("div", {
          style: `flex: 1; height: 1px; background: #e2e8f0; margin-bottom: 24px; min-width: 16px;`
        }));
      }
    });
  }

  function updateNav() {
    if (!prevBtn || !nextBtn || !progressLabel) return;
    prevBtn.disabled = currentStep === 0;
    prevBtn.style.opacity = currentStep === 0 ? "0.4" : "1";
    prevBtn.style.cursor = currentStep === 0 ? "not-allowed" : "pointer";

    const isLast = currentStep === steps.length - 1;
    nextBtn.textContent = isLast ? "Finish & Push to Odoo" : "Next \u2192";

    progressLabel.textContent = `Step ${currentStep + 1} of ${steps.length}`;
  }

  function goToStep(n) {
    if (n < 0 || n >= steps.length) return;
    currentStep = n;

    // Fade out
    if (contentArea) {
      contentArea.style.opacity = "0";
      contentArea.style.transform = "translateY(4px)";
    }

    setTimeout(() => {
      if (!contentArea) return;
      while (contentArea.firstChild) contentArea.removeChild(contentArea.firstChild);
      const stepEl = getCurrentContent();
      if (stepEl) contentArea.append(stepEl);
      contentArea.style.opacity = "1";
      contentArea.style.transform = "translateY(0)";
      updateStepper();
      updateNav();
    }, 150);
  }

  function render() {
    stepperArea = el("div", {
      style: "display: flex; align-items: flex-end; gap: 0; padding: 20px 28px; border-bottom: 1px solid #f1f5f9; overflow-x: auto;"
    });

    contentArea = el("div", {
      style: "padding: 24px 28px; min-height: 280px; opacity: 1; transform: translateY(0); transition: opacity 0.15s, transform 0.15s;"
    });

    prevBtn = el("button", {
      style: "background: none; border: none; color: #64748b; font-size: 14px; font-weight: 500; cursor: pointer; padding: 0;",
      onclick: () => {
        if (currentStep > 0) goToStep(currentStep - 1);
      }
    }, [
      el("span", { text: "\u2190 Previous" })
    ]);

    nextBtn = el("button", {
      style: "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; font-size: 14px; font-weight: 600; padding: 8px 20px; cursor: pointer;",
      onclick: () => {
        if (currentStep < steps.length - 1) {
          if (!validateCurrentStep()) return;
          goToStep(currentStep + 1);
        } else {
          onComplete && onComplete(stepData);
        }
      }
    }, [
      el("span", { text: "Next \u2192" })
    ]);

    progressLabel = el("span", {
      style: "font-size: 12px; color: #94a3b8;"
    });

    const footer = el("div", {
      style: "padding: 16px 28px; border-top: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: space-between;"
    }, [
      prevBtn,
      progressLabel,
      nextBtn
    ]);

    // Initial content
    const stepEl = getCurrentContent();
    if (stepEl) contentArea.append(stepEl);

    updateStepper();
    updateNav();

    const closeBtn = el("button", {
      style: "margin-left: auto; background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; padding: 4px; border-radius: 6px;",
      onclick: onCancel,
      title: "Cancel"
    }, [
      lucideIcon("x", 20)
    ]);
    closeBtn.onmouseenter = () => { closeBtn.style.background = "rgba(12,26,48,0.06)"; };
    closeBtn.onmouseleave = () => { closeBtn.style.background = "none"; };

    return el("div", { style: "max-width: 680px; width: 100%; margin: 0 auto;" }, [
      // Card
      el("div", { style: "background: #ffffff; border-radius: 12px; border: 1px solid #e2e8f0; box-shadow: 0 24px 64px rgba(0,0,0,0.12); overflow: hidden;" }, [
        // Header
        el("div", { style: "padding: 24px 28px 20px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: flex-start; gap: 16px;" }, [
          icon ? el("div", { style: "width: 44px; height: 44px; border-radius: 10px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); color: #92400e; display: flex; align-items: center; justify-content: center; flex-shrink: 0;" }, [
            lucideIcon(icon, 20)
          ]) : null,
          el("div", { style: "flex: 1;" }, [
            el("h2", { style: "font-size: 18px; font-weight: 600; color: #0c1a30; margin-bottom: 2px;", text: title }),
            subtitle ? el("p", { style: "font-size: 13px; color: #64748b;", text: subtitle }) : null
          ]),
          closeBtn
        ]),
        // Stepper
        stepperArea,
        // Content
        contentArea,
        // Footer
        footer
      ])
    ]);
  }

  return {
    render,
    goToStep,
    setStepData: (n, data) => { stepData[n] = { ...stepData[n], ...data }; },
    getAllData: () => stepData
  };
}

// ── Reusable form field helpers ─────────────────────────────────

export function formField(label, inputEl, helperText, required = false) {
  if (required && inputEl) {
    inputEl.setAttribute("data-required", "true");
    inputEl.addEventListener("input", () => {
      if ((inputEl.value || "").trim()) {
        inputEl.classList.remove("error");
        const errEl = inputEl.parentElement?.querySelector(".field-error");
        if (errEl) errEl.classList.remove("visible");
      }
    });
  }
  return el("div", { style: "display: flex; flex-direction: column; gap: 6px; margin-bottom: 12px;" }, [
    el("label", { style: "font-size: 13px; font-weight: 500; color: #374151; display: block;" }, [
      el("span", { text: label }),
      required ? el("span", { style: "color: #dc2626; margin-left: 2px;", text: "*" }) : null
    ]),
    inputEl,
    helperText ? el("p", { style: "font-size: 12px; color: #64748b;", text: helperText }) : null,
    required ? el("p", { className: "field-error", text: `${label} is required` }) : null
  ]);
}

export function formInput(options = {}) {
  return el("input", {
    type: options.type || "text",
    placeholder: options.placeholder || "",
    value: options.value || "",
    style: "width: 100%; padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; color: #0c1a30; box-sizing: border-box; outline: none;",
    ...options.attrs
  });
}

export function formSelect(options = [], selected = "", attrs = {}) {
  return el("select", {
    style: "width: 100%; padding: 9px 12px; border: 1px solid #e2e8f0; border-radius: 6px; font-size: 14px; color: #0c1a30; box-sizing: border-box; outline: none; background: #ffffff;",
    ...attrs
  }, options.map(opt => {
    const val = typeof opt === "string" ? opt : opt.value;
    const lbl = typeof opt === "string" ? opt : opt.label;
    return el("option", { value: val, selected: val === selected ? "selected" : null, text: lbl });
  }));
}

export function formCheckbox(label, checked = false, onChange) {
  const id = `cb-${Math.random().toString(36).slice(2, 8)}`;
  const cb = el("input", { type: "checkbox", id, style: "accent-color: #f59e0b; width: 16px; height: 16px;" });
  if (checked) cb.checked = true;
  if (onChange) cb.addEventListener("change", e => onChange(e.target.checked));
  return el("label", { htmlFor: id, style: "display: flex; align-items: center; gap: 12px; cursor: pointer;" }, [
    cb,
    el("span", { style: "font-size: 14px; color: #0c1a30; font-weight: 500;", text: label })
  ]);
}

export function formSection(title, children) {
  return el("div", { style: "display: flex; flex-direction: column; gap: 16px;" }, [
    el("h4", { style: "font-size: 11px; font-weight: 600; letter-spacing: 0.1em; text-transform: uppercase; color: #64748b; margin-bottom: 0; padding-bottom: 8px; border-bottom: 1px solid #f1f5f9;", text: title }),
    ...children
  ]);
}

export function formGrid(children, cols = 2) {
  return el("div", { style: `display: grid; grid-template-columns: repeat(${cols}, 1fr); gap: 16px;` }, children);
}

export function pushSummaryStep(label, data, onPush) {
  const flatEntries = flattenObject(data);
  let pushState = "idle"; // idle | loading | success | error

  const statusEl = el("div", { className: "hidden" });

  const pushBtn = el("button", {
    className: "w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-bold text-sm py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm",
    onclick: async () => {
      if (pushState === "loading") return;
      pushState = "loading";
      pushBtn.disabled = true;
      clearNode(pushBtn);
      const spinner = lucideIcon("loader-2", 18); spinner.classList.add("animate-spin");
      pushBtn.append(spinner, document.createTextNode(" Pushing to Odoo..."));
      statusEl.className = "text-center text-sm text-on-surface-variant py-2";
      statusEl.textContent = "Sending data to Odoo...";

      try {
        const result = await (onPush ? onPush(data) : Promise.resolve({ ok: true }));
        pushState = "success";
        clearNode(pushBtn);
        pushBtn.append(
          lucideIcon("check-circle", 18),
          document.createTextNode(" Pushed Successfully!")
        );
        pushBtn.className = "w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-bold text-sm py-3 rounded-xl cursor-default";
        statusEl.className = "text-center text-sm text-green-700 font-medium py-2";
        statusEl.textContent = "✓ All data saved to Odoo successfully.";
      } catch (err) {
        pushState = "error";
        pushBtn.disabled = false;
        clearNode(pushBtn);
        pushBtn.append(document.createTextNode("Retry Push"));
        statusEl.className = "text-center text-sm text-error py-2";
        statusEl.textContent = `Error: ${err?.message || "Unknown error"}`;
      }
    }
  }, [
    lucideIcon("cloud-upload", 18),
    el("span", { text: `Push ${label} to Odoo` })
  ]);

  return el("div", { className: "space-y-6" }, [
    el("div", { className: "bg-surface-container-low rounded-xl p-6 space-y-3" }, [
      el("h4", { className: "font-headline text-sm font-bold text-on-surface mb-4", text: "Review Summary" }),
      el("div", { className: "space-y-2" },
        flatEntries.map(([key, val]) =>
          el("div", { className: "flex justify-between items-start py-1.5 border-b border-outline-variant/10 last:border-0" }, [
            el("span", { className: "text-xs text-on-surface-variant font-medium capitalize", text: key.replace(/([A-Z])/g, " $1").replace(/_/g, " ") }),
            el("span", { className: "text-xs text-on-surface font-semibold text-right max-w-xs", text: String(val || "—") })
          ])
        )
      )
    ]),
    pushBtn,
    statusEl
  ]);
}

function flattenObject(obj, prefix = "") {
  const result = [];
  for (const [key, val] of Object.entries(obj || {})) {
    const fullKey = prefix ? `${prefix} ${key}` : key;
    if (val && typeof val === "object" && !Array.isArray(val)) {
      result.push(...flattenObject(val, fullKey));
    } else if (Array.isArray(val)) {
      result.push([fullKey, `${val.length} items`]);
    } else {
      result.push([fullKey, val]);
    }
  }
  return result;
}
