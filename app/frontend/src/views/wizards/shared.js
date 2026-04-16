import { clearNode, el } from "../../lib/dom.js";
import { onboardingStore } from "../../state/onboarding-store.js";
import { addCompletedWizard } from "../../state/app-store.js";

const CARD_STYLE = [
  "max-width: 880px",
  "margin: 0 auto",
  "background: var(--color-surface)",
  "border: 1px solid var(--color-line)",
  "border-radius: var(--radius-card)",
  "padding: var(--space-7) var(--space-8)",
  "display: flex",
  "flex-direction: column",
  "gap: var(--space-5)",
  "font-family: var(--font-body)",
  "color: var(--color-ink)"
].join("; ");

const FIELD_BLOCK_STYLE = "display: flex; flex-direction: column; gap: var(--space-2);";
const LABEL_STYLE = "font-size: var(--fs-small); font-weight: 500; color: var(--color-ink);";
const HELP_STYLE = "font-size: var(--fs-micro); color: var(--color-muted); margin: 0;";
const ERROR_STYLE = "font-size: var(--fs-micro); color: var(--color-chip-review-fg); margin: 0;";
const GRID_STYLE =
  "display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--space-4);";

const PRIMARY_BUTTON_STYLE = [
  "background: var(--color-pill-primary-bg)",
  "color: var(--color-pill-primary-fg)",
  "border: 1px solid var(--color-pill-primary-bg)",
  "border-radius: var(--radius-pill)",
  "font-size: var(--fs-small)",
  "font-weight: 500",
  "padding: 10px 18px",
  "cursor: pointer",
  "font-family: var(--font-body)",
  "transition: all var(--dur-base) var(--ease)"
].join("; ");

const SECONDARY_BUTTON_STYLE = [
  "background: var(--color-pill-secondary-bg)",
  "color: var(--color-pill-secondary-fg)",
  "border: 1px solid var(--color-pill-secondary-border)",
  "border-radius: var(--radius-pill)",
  "font-size: var(--fs-small)",
  "font-weight: 500",
  "padding: 10px 18px",
  "cursor: pointer",
  "font-family: var(--font-body)",
  "transition: all var(--dur-base) var(--ease)"
].join("; ");

const INPUT_STYLE = [
  "font-family: var(--font-body)",
  "font-size: var(--fs-body)",
  "color: var(--color-ink)",
  "background: var(--color-surface)",
  "border: 1px solid var(--color-line)",
  "border-radius: var(--radius-input)",
  "padding: 11px 14px",
  "outline: none",
  "width: 100%",
  "box-sizing: border-box",
  "transition: border-color var(--dur-base) var(--ease)"
].join("; ");

export const COMMON_CURRENCY_OPTIONS = Object.freeze([
  { value: "USD", label: "USD" },
  { value: "EUR", label: "EUR" },
  { value: "GBP", label: "GBP" },
  { value: "ZAR", label: "ZAR" },
  { value: "AED", label: "AED" },
  { value: "CAD", label: "CAD" },
  { value: "AUD", label: "AUD" },
  { value: "JPY", label: "JPY" },
]);

export const COMMON_LANGUAGE_OPTIONS = Object.freeze([
  { value: "en_US", label: "English (US)" },
  { value: "en_GB", label: "English (UK)" },
  { value: "fr_FR", label: "French" },
  { value: "de_DE", label: "German" },
  { value: "es_ES", label: "Spanish" },
  { value: "pt_BR", label: "Portuguese (Brazil)" },
]);

function bindFocusBorder(node) {
  node.addEventListener("focus", () => {
    node.style.borderColor = "var(--color-ink)";
  });
  node.addEventListener("blur", () => {
    node.style.borderColor = "var(--color-line)";
  });
}

function getInitialValue(field) {
  if (field.type === "checkbox") return Boolean(field.defaultValue);
  if (field.type === "repeater") {
    if (Array.isArray(field.defaultValue) && field.defaultValue.length > 0) {
      return field.defaultValue.slice();
    }
    const minItems = Number.isInteger(field.minItems) && field.minItems > 0 ? field.minItems : 1;
    return Array.from({ length: minItems }, () => "");
  }
  return field.defaultValue ?? "";
}

function createInitialValues(fields) {
  const values = {};
  fields.forEach((field) => {
    values[field.name] = getInitialValue(field);
  });
  return values;
}

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeRepeater(value) {
  if (!Array.isArray(value)) return [];
  return value.map((entry) => trimString(entry)).filter(Boolean);
}

function normalizeFieldValue(field, value) {
  if (field.type === "checkbox") return Boolean(value);
  if (field.type === "repeater") return normalizeRepeater(value);
  return trimString(value);
}

function buildNormalizedValues(fields, values) {
  const normalized = {};
  fields.forEach((field) => {
    normalized[field.name] = normalizeFieldValue(field, values[field.name]);
  });
  return normalized;
}

function validateField(field, normalizedValue) {
  if (!field.required) return null;

  if (field.type === "checkbox") return null;

  if (field.type === "repeater") {
    const count = Array.isArray(normalizedValue) ? normalizedValue.length : 0;
    if (count === 0) {
      return `${field.label} is required.`;
    }
    if (Number.isInteger(field.minItems) && count < field.minItems) {
      return `Enter at least ${field.minItems} value(s) for ${field.label.toLowerCase()}.`;
    }
    return null;
  }

  if (normalizedValue === "") {
    return `${field.label} is required.`;
  }

  return null;
}

function renderSelect(field, value, updateValue) {
  const options = [el("option", { value: "" }, field.placeholder || "Select an option")];
  (field.options || []).forEach((option) => {
    const descriptor = typeof option === "string" ? { value: option, label: option } : option;
    options.push(el("option", { value: descriptor.value }, descriptor.label));
  });

  const input = el(
    "select",
    {
      style: INPUT_STYLE,
      onchange: (event) => updateValue(event.target.value || ""),
    },
    options
  );
  input.value = value || "";
  bindFocusBorder(input);
  return input;
}

function renderRepeater(field, values, updateValue) {
  const wrapper = el("div", { style: "display: flex; flex-direction: column; gap: 10px;" });
  const rows = Array.isArray(values) ? values : [""];

  const removeBtnStyle = [
    "width: 32px",
    "height: 32px",
    "min-width: 32px",
    "border: 1px solid var(--color-line)",
    "background: var(--color-surface)",
    "color: var(--color-subtle)",
    "border-radius: var(--radius-input)",
    "cursor: pointer",
    "font-size: 14px",
    "font-family: var(--font-body)",
    "display: inline-flex",
    "align-items: center",
    "justify-content: center",
    "transition: all var(--dur-base) var(--ease)"
  ].join("; ");

  const addBtnStyle = [
    "border: 1px dashed var(--color-line-soft)",
    "color: var(--color-subtle)",
    "background: transparent",
    "border-radius: var(--radius-pill)",
    "font-family: var(--font-body)",
    "font-size: var(--fs-small)",
    "font-weight: 500",
    "padding: 9px 16px",
    "cursor: pointer",
    "align-self: flex-start",
    "transition: all var(--dur-base) var(--ease)"
  ].join("; ");

  rows.forEach((entry, index) => {
    const rowInput = el("input", {
      type: "text",
      style: INPUT_STYLE + " flex: 1;",
      placeholder: field.placeholder || field.label,
      value: entry || "",
      oninput: (event) => {
        const nextValues = rows.slice();
        nextValues[index] = event.target.value || "";
        updateValue(nextValues);
      },
    });
    bindFocusBorder(rowInput);

    const canRemove = rows.length > (field.minItems || 1);

    wrapper.append(
      el("div", { style: "display: flex; gap: 8px; align-items: center;" }, [
        rowInput,
        el(
          "button",
          {
            type: "button",
            style: removeBtnStyle + (!canRemove ? "; opacity: 0.45; cursor: not-allowed;" : ""),
            disabled: !canRemove,
            "aria-label": "Remove",
            onclick: () => {
              if (!canRemove) return;
              updateValue(rows.filter((_, rowIndex) => rowIndex !== index));
            },
          },
          "\u00D7"
        ),
      ])
    );
  });

  const canAddMore = !Number.isInteger(field.maxItems) || rows.length < field.maxItems;
  wrapper.append(
    el(
      "button",
      {
        type: "button",
        style: addBtnStyle + (!canAddMore ? " opacity: 0.45; cursor: not-allowed;" : ""),
        disabled: !canAddMore,
        onclick: () => {
          if (!canAddMore) return;
          updateValue(rows.concat([""]));
        },
      },
      field.addLabel || "+ Add another"
    )
  );

  return wrapper;
}

function renderInput(field, value, updateValue) {
  if (field.type === "select") {
    return renderSelect(field, value, updateValue);
  }

  if (field.type === "checkbox") {
    return el(
      "label",
      {
        style:
          "display: flex; align-items: center; gap: 10px; color: var(--color-ink); " +
          "font-size: var(--fs-small); font-family: var(--font-body);",
      },
      [
        el("input", {
          type: "checkbox",
          checked: Boolean(value),
          onchange: (event) => updateValue(Boolean(event.target.checked)),
        }),
        el("span", {}, field.checkboxLabel || field.label),
      ]
    );
  }

  if (field.type === "textarea") {
    const ta = el("textarea", {
      style: INPUT_STYLE + " resize: vertical; min-height: 96px;",
      rows: String(field.rows || 4),
      placeholder: field.placeholder || "",
      value: value || "",
      oninput: (event) => updateValue(event.target.value || ""),
    });
    bindFocusBorder(ta);
    return ta;
  }

  if (field.type === "repeater") {
    return renderRepeater(field, value, updateValue);
  }

  const input = el("input", {
    type: field.type || "text",
    style: INPUT_STYLE,
    placeholder: field.placeholder || "",
    value: value ?? "",
    min: field.min ?? undefined,
    max: field.max ?? undefined,
    step: field.step ?? undefined,
    maxlength: field.maxLength ?? undefined,
    oninput: (event) => updateValue(event.target.value || ""),
  });
  bindFocusBorder(input);
  return input;
}

function renderField(field, local, rerender) {
  const error = local.errors[field.name] || "";
  const value = local.values[field.name];

  return el("div", { style: FIELD_BLOCK_STYLE }, [
    field.type === "checkbox" ? null : el("label", { style: LABEL_STYLE }, field.label),
    renderInput(field, value, (nextValue) => {
      local.values[field.name] = nextValue;
      if (field.type === "repeater") {
        local.errors[field.name] = "";
        rerender();
      }
    }),
    field.helpText ? el("p", { style: HELP_STYLE }, field.helpText) : null,
    error ? el("p", { style: ERROR_STYLE }, error) : null,
  ]);
}

function renderHero(domainId, title, subtitleDomain) {
  const eyebrow = el(
    "span",
    {
      style: [
        "display: inline-flex",
        "padding: 5px 12px",
        "border: 1px solid var(--color-line)",
        "border-radius: var(--radius-pill)",
        "font-size: var(--fs-tiny)",
        "font-weight: 600",
        "text-transform: uppercase",
        "letter-spacing: var(--track-eyebrow-strong)",
        "color: var(--color-subtle)",
        "background: var(--color-surface)",
        "align-self: flex-start",
        "font-family: var(--font-body)"
      ].join("; "),
    },
    `Module setup · ${(domainId || "").toUpperCase()}`
  );

  const heading = el(
    "h2",
    {
      style: [
        "font-size: var(--fs-h1)",
        "font-weight: 600",
        "letter-spacing: var(--track-tight)",
        "line-height: var(--lh-snug)",
        "color: var(--color-ink)",
        "margin: var(--space-3) 0 0"
      ].join("; "),
    },
    title
  );

  const lede = el(
    "p",
    {
      style: [
        "font-size: var(--fs-body)",
        "color: var(--color-body)",
        "line-height: var(--lh-body)",
        "margin: var(--space-2) 0 0",
        "max-width: 620px"
      ].join("; "),
    },
    `This information will be used to configure ${subtitleDomain} in your Odoo instance.`
  );

  return el("div", { style: "display: flex; flex-direction: column;" }, [eyebrow, heading, lede]);
}

function renderSavedHint() {
  return el(
    "div",
    {
      style: "display: inline-flex; align-items: center; gap: 8px; flex: 1;",
    },
    [
      el("span", {
        style:
          "width: 6px; height: 6px; border-radius: 50%; background: var(--accent-grad); display: inline-block;",
      }),
      el(
        "span",
        {
          style:
            "font-size: var(--fs-micro); color: var(--color-subtle); font-family: var(--font-mono);",
        },
        "Changes saved locally — not yet committed to Odoo"
      ),
    ]
  );
}

function renderDismissedState(title, onCancel, reopen, domainId, subtitleDomain) {
  const buttons = el("div", { style: "display: flex; gap: 12px;" }, [
    el("button", { type: "button", style: SECONDARY_BUTTON_STYLE, onclick: reopen }, "Open form"),
    typeof onCancel === "function"
      ? el(
          "button",
          { type: "button", style: SECONDARY_BUTTON_STYLE, onclick: onCancel },
          "Back to module setup"
        )
      : null,
  ]);

  return el("div", { style: CARD_STYLE }, [
    renderHero(domainId, title, subtitleDomain),
    el(
      "p",
      {
        style:
          "font-size: var(--fs-body); color: var(--color-body); line-height: var(--lh-body); margin: 0;",
      },
      "This setup form is hidden for now."
    ),
    buttons,
  ]);
}

export function createGovernedWizardView({
  wizardId,
  domainId,
  title,
  subtitleDomain,
  fields,
  getCapture,
  validate = null,
  onCancel = null,
}) {
  const local = {
    values: createInitialValues(fields),
    errors: {},
    success: false,
    hidden: false,
  };

  const container = el("div");

  function rerender() {
    clearNode(container);

    if (local.hidden) {
      container.append(
        renderDismissedState(
          title,
          onCancel,
          () => {
            local.hidden = false;
            rerender();
          },
          domainId,
          subtitleDomain
        )
      );
      return;
    }

    const normalizedValues = buildNormalizedValues(fields, local.values);
    const nextErrors = {};
    const fieldNodes = fields.map((field) => renderField(field, local, rerender));

    const actionRow = el(
      "div",
      {
        style:
          "display: flex; justify-content: flex-end; align-items: center; gap: 12px; " +
          "padding-top: var(--space-5); border-top: 1px solid var(--color-line);",
      },
      [
        local.success ? renderSavedHint() : el("div", { style: "flex: 1;" }),
        el(
          "button",
          {
            type: "button",
            style: SECONDARY_BUTTON_STYLE,
            onclick: () => {
              local.hidden = true;
              rerender();
            },
          },
          "Skip for now"
        ),
        el(
          "button",
          {
            type: "button",
            style: PRIMARY_BUTTON_STYLE,
            onclick: () => {
              fields.forEach((field) => {
                const message = validateField(field, normalizedValues[field.name]);
                if (message) {
                  nextErrors[field.name] = message;
                }
              });

              if (typeof validate === "function") {
                Object.assign(nextErrors, validate(normalizedValues));
              }

              local.errors = nextErrors;
              if (Object.keys(nextErrors).length > 0) {
                local.success = false;
                rerender();
                return;
              }

              onboardingStore.setWizardCapture(domainId, getCapture(normalizedValues));
              addCompletedWizard(wizardId);
              local.success = true;
              rerender();
            },
          },
          "Save & Configure"
        ),
      ]
    );

    container.append(
      el("div", { style: CARD_STYLE }, [
        renderHero(domainId, title, subtitleDomain),
        el(
          "div",
          {
            style:
              fields.length > 3
                ? GRID_STYLE
                : "display: flex; flex-direction: column; gap: var(--space-4);",
          },
          fieldNodes
        ),
        actionRow,
      ])
    );
  }

  rerender();
  return container;
}
