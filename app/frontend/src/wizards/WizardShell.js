import { el } from "../lib/dom.js";

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
      const isUpcoming = i > currentStep;

      // dot
      const dot = el("div", {
        className: `flex flex-col items-center gap-1.5 flex-shrink-0`,
      }, [
        el("div", {
          className: `flex items-center justify-center rounded-full border-2 transition-all ${
            isDone
              ? "w-9 h-9 bg-secondary text-on-secondary border-secondary shadow-sm"
              : isActive
              ? "w-10 h-10 bg-primary text-on-primary border-primary shadow-md ring-4 ring-primary-fixed/50"
              : "w-9 h-9 bg-surface-container-highest text-outline border-outline-variant"
          }`,
        }, [
          isDone
            ? el("span", { className: "material-symbols-outlined text-[18px]", style: "font-variation-settings: 'FILL' 1", text: "check" })
            : el("span", { className: `font-bold ${isActive ? "text-sm" : "text-xs"}`, text: String(i + 1) })
        ]),
        el("span", {
          className: `text-[10px] font-semibold uppercase tracking-wide ${isActive ? "text-primary" : isDone ? "text-secondary" : "text-outline"}`,
          text: step.label || `Step ${i + 1}`
        })
      ]);

      stepperArea.append(dot);

      // connector (not after last)
      if (i < steps.length - 1) {
        stepperArea.append(el("div", {
          className: `flex-1 h-0.5 mb-4 transition-colors ${isDone ? "bg-secondary" : "bg-surface-container-high"}`,
          style: "min-width: 16px"
        }));
      }
    });
  }

  function updateNav() {
    if (!prevBtn || !nextBtn || !progressLabel) return;
    prevBtn.disabled = currentStep === 0;
    prevBtn.classList.toggle("opacity-40", currentStep === 0);
    prevBtn.classList.toggle("cursor-not-allowed", currentStep === 0);

    const isLast = currentStep === steps.length - 1;
    nextBtn.textContent = isLast ? "Finish & Push to Odoo" : "Next →";
    nextBtn.classList.toggle("bg-secondary", isLast);
    nextBtn.classList.toggle("bg-primary", !isLast);

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
      className: "flex items-end gap-0 px-8 py-5 bg-surface-container-low border-b border-outline-variant/10 overflow-x-auto no-scrollbar"
    });

    contentArea = el("div", {
      className: "wizard-content-area px-8 py-8 min-h-96 transition-all duration-150",
      style: "opacity: 1; transform: translateY(0)"
    });

    prevBtn = el("button", {
      className: "flex items-center gap-2 px-5 py-2.5 rounded-xl border border-outline-variant text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors",
      onclick: () => {
        if (currentStep > 0) goToStep(currentStep - 1);
      }
    }, [
      el("span", { className: "material-symbols-outlined text-[18px]", text: "arrow_back" }),
      el("span", { text: "Previous" })
    ]);

    nextBtn = el("button", {
      className: "flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary text-on-primary text-sm font-bold shadow-sm hover:opacity-90 active:scale-95 transition-all",
      onclick: () => {
        if (currentStep < steps.length - 1) {
          if (!validateCurrentStep()) return;
          goToStep(currentStep + 1);
        } else {
          onComplete && onComplete(stepData);
        }
      }
    }, [
      el("span", { text: "Next →" }),
      el("span", { className: "material-symbols-outlined text-[18px]", text: "arrow_forward" })
    ]);

    progressLabel = el("span", {
      className: "text-xs text-on-surface-variant font-medium"
    });

    const footer = el("div", {
      className: "flex items-center justify-between px-8 py-5 border-t border-outline-variant/10 bg-surface-container-low"
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

    return el("div", { className: "max-w-3xl mx-auto" }, [
      // Card
      el("div", { className: "bg-surface-container-lowest rounded-xl shadow-card border border-outline-variant/10 overflow-hidden" }, [
        // Header
        el("div", { className: "px-8 py-6 border-b border-outline-variant/10 flex items-center justify-between" }, [
          el("div", { className: "flex items-center gap-4" }, [
            icon ? el("div", { className: "w-10 h-10 rounded-xl primary-gradient flex items-center justify-center" }, [
              el("span", { className: "material-symbols-outlined text-white", text: icon })
            ]) : null,
            el("div", {}, [
              el("h2", { className: "font-headline text-xl font-bold text-on-surface", text: title }),
              subtitle ? el("p", { className: "text-sm text-on-surface-variant mt-0.5", text: subtitle }) : null
            ])
          ]),
          el("button", {
            className: "p-2 rounded-lg hover:bg-surface-container transition-colors text-on-surface-variant",
            onclick: onCancel,
            title: "Cancel"
          }, [
            el("span", { className: "material-symbols-outlined text-[20px]", text: "close" })
          ])
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
  return el("div", { className: "space-y-1.5" }, [
    el("label", { className: "block text-sm font-semibold text-on-surface-variant" }, [
      el("span", { text: label }),
      required ? el("span", { className: "text-error ml-0.5", text: "*" }) : null
    ]),
    inputEl,
    helperText ? el("p", { className: "text-xs text-on-surface-variant", text: helperText }) : null,
    required ? el("p", { className: "field-error", text: `${label} is required` }) : null
  ]);
}

export function formInput(options = {}) {
  return el("input", {
    type: options.type || "text",
    placeholder: options.placeholder || "",
    value: options.value || "",
    className: "w-full h-11 px-4 bg-surface-container-high border-0 border-b-2 border-outline focus:border-primary rounded-lg focus:ring-0 text-on-surface text-sm transition-colors",
    ...options.attrs
  });
}

export function formSelect(options = [], selected = "", attrs = {}) {
  return el("select", {
    className: "w-full h-11 px-4 bg-surface-container-high border-0 border-b-2 border-outline focus:border-primary rounded-lg focus:ring-0 text-on-surface text-sm transition-colors",
    ...attrs
  }, options.map(opt => {
    const val = typeof opt === "string" ? opt : opt.value;
    const lbl = typeof opt === "string" ? opt : opt.label;
    return el("option", { value: val, selected: val === selected ? "selected" : null, text: lbl });
  }));
}

export function formCheckbox(label, checked = false, onChange) {
  const id = `cb-${Math.random().toString(36).slice(2, 8)}`;
  const cb = el("input", { type: "checkbox", id, className: "rounded border-outline w-4 h-4 text-primary focus:ring-primary/20" });
  if (checked) cb.checked = true;
  if (onChange) cb.addEventListener("change", e => onChange(e.target.checked));
  return el("label", { htmlFor: id, className: "flex items-center gap-3 cursor-pointer group" }, [
    cb,
    el("span", { className: "text-sm text-on-surface font-medium group-hover:text-primary transition-colors", text: label })
  ]);
}

export function formSection(title, children) {
  return el("div", { className: "space-y-4" }, [
    el("h4", { className: "font-headline text-sm font-bold text-on-surface-variant uppercase tracking-widest border-b border-outline-variant/20 pb-2", text: title }),
    ...children
  ]);
}

export function formGrid(children, cols = 2) {
  return el("div", { className: `grid grid-cols-1 md:grid-cols-${cols} gap-4` }, children);
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
      pushBtn.innerHTML = "";
      const spinner = el("span", { className: "animate-spin material-symbols-outlined text-[18px]", text: "autorenew" });
      pushBtn.append(spinner, document.createTextNode(" Pushing to Odoo..."));
      statusEl.className = "text-center text-sm text-on-surface-variant py-2";
      statusEl.textContent = "Sending data to Odoo...";

      try {
        const result = await (onPush ? onPush(data) : Promise.resolve({ ok: true }));
        pushState = "success";
        pushBtn.innerHTML = "";
        pushBtn.append(
          el("span", { className: "material-symbols-outlined text-[18px]", text: "check_circle" }),
          document.createTextNode(" Pushed Successfully!")
        );
        pushBtn.className = "w-full flex items-center justify-center gap-2 bg-secondary text-on-secondary font-bold text-sm py-3 rounded-xl cursor-default";
        statusEl.className = "text-center text-sm text-green-700 font-medium py-2";
        statusEl.textContent = "✓ All data saved to Odoo successfully.";
      } catch (err) {
        pushState = "error";
        pushBtn.disabled = false;
        pushBtn.innerHTML = "Retry Push";
        pushBtn.innerHTML = "";
        pushBtn.append(document.createTextNode("Retry Push"));
        statusEl.className = "text-center text-sm text-error py-2";
        statusEl.textContent = `Error: ${err?.message || "Unknown error"}`;
      }
    }
  }, [
    el("span", { className: "material-symbols-outlined text-[18px]", text: "cloud_upload" }),
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
