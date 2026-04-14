import { clearNode, el } from "../../lib/dom.js";
import { onboardingStore } from "../../state/onboarding-store.js";
import { addCompletedWizard } from "../../state/app-store.js";

const CARD_STYLE = [
  "max-width: 880px",
  "margin: 0 auto",
  "background: #ffffff",
  "border: 1px solid #e2e8f0",
  "border-radius: 10px",
  "padding: 28px",
  "display: flex",
  "flex-direction: column",
  "gap: 20px",
  "font-family: Inter, sans-serif",
].join("; ");

const FIELD_BLOCK_STYLE = "display: flex; flex-direction: column; gap: 6px;";
const LABEL_STYLE = "font-size: 13px; font-weight: 600; color: #0c1a30;";
const HELP_STYLE = "font-size: 12px; color: #64748b; margin: 0;";
const ERROR_STYLE = "font-size: 12px; color: #b91c1c; margin: 0;";
const GRID_STYLE = "display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px;";
const PRIMARY_BUTTON_STYLE = [
  "background: #f59e0b",
  "border: 1px solid #f59e0b",
  "color: #0c1a30",
  "border-radius: 6px",
  "font-size: 14px",
  "font-weight: 600",
  "padding: 10px 18px",
  "cursor: pointer",
].join("; ");
const SECONDARY_BUTTON_STYLE = [
  "background: #ffffff",
  "border: 1px solid rgba(12,26,48,0.2)",
  "color: #0c1a30",
  "border-radius: 6px",
  "font-size: 14px",
  "font-weight: 600",
  "padding: 10px 18px",
  "cursor: pointer",
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
      className: "ee-input",
      onchange: (event) => updateValue(event.target.value || ""),
    },
    options
  );
  input.value = value || "";
  return input;
}

function renderRepeater(field, values, updateValue) {
  const wrapper = el("div", { style: "display: flex; flex-direction: column; gap: 10px;" });
  const rows = Array.isArray(values) ? values : [""];

  rows.forEach((entry, index) => {
    wrapper.append(
      el("div", { style: "display: flex; gap: 8px; align-items: center;" }, [
        el("input", {
          type: "text",
          className: "ee-input",
          placeholder: field.placeholder || field.label,
          value: entry || "",
          style: "flex: 1;",
          oninput: (event) => {
            const nextValues = rows.slice();
            nextValues[index] = event.target.value || "";
            updateValue(nextValues);
          },
        }),
        el(
          "button",
          {
            type: "button",
            style: SECONDARY_BUTTON_STYLE + (rows.length <= (field.minItems || 1) ? "; opacity: 0.45; cursor: not-allowed;" : ""),
            disabled: rows.length <= (field.minItems || 1),
            onclick: () => {
              if (rows.length <= (field.minItems || 1)) return;
              updateValue(rows.filter((_, rowIndex) => rowIndex !== index));
            },
          },
          "Remove"
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
        style: SECONDARY_BUTTON_STYLE + (!canAddMore ? "; opacity: 0.45; cursor: not-allowed;" : ""),
        disabled: !canAddMore,
        onclick: () => {
          if (!canAddMore) return;
          updateValue(rows.concat([""]));
        },
      },
      field.addLabel || "Add another"
    )
  );

  return wrapper;
}

function renderInput(field, value, updateValue) {
  if (field.type === "select") {
    return renderSelect(field, value, updateValue);
  }

  if (field.type === "checkbox") {
    return el("label", { style: "display: flex; align-items: center; gap: 10px; color: #0c1a30; font-size: 13px;" }, [
      el("input", {
        type: "checkbox",
        checked: Boolean(value),
        onchange: (event) => updateValue(Boolean(event.target.checked)),
      }),
      el("span", {}, field.checkboxLabel || field.label),
    ]);
  }

  if (field.type === "textarea") {
    return el("textarea", {
      className: "ee-input",
      rows: String(field.rows || 4),
      placeholder: field.placeholder || "",
      value: value || "",
      oninput: (event) => updateValue(event.target.value || ""),
    });
  }

  if (field.type === "repeater") {
    return renderRepeater(field, value, updateValue);
  }

  return el("input", {
    type: field.type || "text",
    className: "ee-input",
    placeholder: field.placeholder || "",
    value: value ?? "",
    min: field.min ?? undefined,
    max: field.max ?? undefined,
    step: field.step ?? undefined,
    maxlength: field.maxLength ?? undefined,
    oninput: (event) => updateValue(event.target.value || ""),
  });
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

function renderDismissedState(title, onCancel, reopen) {
  return el("div", { style: CARD_STYLE }, [
    el("h2", { style: "font-size: 22px; font-weight: 700; color: #0c1a30; margin: 0;" }, title),
    el("p", { style: "font-size: 14px; color: #64748b; margin: 0;" }, "This setup form is hidden for now."),
    el("div", { style: "display: flex; gap: 12px;" }, [
      el("button", { type: "button", style: SECONDARY_BUTTON_STYLE, onclick: reopen }, "Open form"),
      typeof onCancel === "function"
        ? el("button", { type: "button", style: SECONDARY_BUTTON_STYLE, onclick: onCancel }, "Back to module setup")
        : null,
    ]),
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
        renderDismissedState(title, onCancel, () => {
          local.hidden = false;
          rerender();
        })
      );
      return;
    }

    const normalizedValues = buildNormalizedValues(fields, local.values);
    const nextErrors = {};
    const fieldNodes = fields.map((field) => renderField(field, local, rerender));

    container.append(
      el("div", { style: CARD_STYLE }, [
        el("div", { style: "display: flex; flex-direction: column; gap: 6px;" }, [
          el("h2", { style: "font-size: 24px; font-weight: 700; color: #0c1a30; margin: 0;" }, title),
          el(
            "p",
            { style: "font-size: 14px; color: #64748b; margin: 0;" },
            `This information will be used to configure ${subtitleDomain} in your Odoo instance`
          ),
        ]),
        el("div", { style: fields.length > 3 ? GRID_STYLE : "display: flex; flex-direction: column; gap: 16px;" }, fieldNodes),
        local.success
          ? el(
              "div",
              {
                style: "background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 10px; padding: 14px 16px;",
              },
              el(
                "p",
                { style: "font-size: 13px; color: #065f46; font-weight: 600; margin: 0;" },
                "Configuration saved - this will be applied when you run the pipeline"
              )
            )
          : null,
        el("div", { style: "display: flex; justify-content: flex-end; gap: 12px;" }, [
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
        ]),
      ])
    );
  }

  rerender();
  return container;
}
