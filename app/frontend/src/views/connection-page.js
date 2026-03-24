import {
  DEPLOYMENTS,
  EDITIONS,
  ODOO_VERSION,
  PROJECT_MODES,
  getCombinationError
} from "/shared/index.js";
import { el } from "../lib/dom.js";

/**
 * Full-page non-technical connection / project setup screen.
 * Designed for users with no Odoo technical background.
 * Bypasses the layout shell — renders directly into the app root.
 */
export function renderConnectionPage(project, onIdentityChange, onEnvironmentChange, onBegin) {
  const combinationError = getCombinationError(project.projectIdentity);

  // ── Left panel ────────────────────────────────────────────────────────
  const leftPanel = el("aside", { className: "conn-left", "aria-label": "About this guide" }, [
    el("div", { className: "conn-left__inner" }, [
      el("div", { className: "conn-brand" }, [
        el("span", { className: "conn-brand__badge", text: "Odoo 19" }),
        el("h1", { className: "conn-brand__title", text: "Your free Odoo 19 setup guide" }),
        el("p", { className: "conn-brand__sub", text: "We walk you through every step in plain English — no IT background needed." })
      ]),
      el("ul", { className: "conn-features", "aria-label": "What this guide does" }, [
        featureBullet("✓", "Built specifically for Odoo 19"),
        featureBullet("✓", "tells you exactly what to set up and in what order"),
        featureBullet("✓", "Explains why each decision matters for your business"),
        featureBullet("✓", "Save your progress and come back whenever you like"),
        featureBullet("✓", "Live connection is optional and stays bounded when enabled")
      ]),
      el("div", { className: "conn-editions", "aria-label": "Supported Odoo editions" }, [
        el("p", { className: "conn-editions__label", text: "Works with" }),
        el("div", { className: "conn-editions__chips" }, [
          el("span", { className: "conn-chip", text: "Community" }),
          el("span", { className: "conn-chip", text: "Enterprise" })
        ])
      ]),
      el("blockquote", { className: "conn-testimonial" }, [
        el("p", { text: "\"I had no idea where to start. This guide felt like having a knowledgeable friend sitting next to me the whole time.\"" }),
        el("footer", { text: "— Small business owner, implemented Odoo 19 in 6 weeks" })
      ])
    ])
  ]);

  // ── Right panel ───────────────────────────────────────────────────────
  const editionSelect = connSelect(
    "conn-edition",
    "Which version of Odoo do you have?",
    "Your Odoo account page will tell you — it says Community or Enterprise near your subscription.",
    EDITIONS,
    project.projectIdentity.edition,
    (value) => onIdentityChange({ edition: value })
  );

  const deploymentSelect = connSelect(
    "conn-deployment",
    "Where is your Odoo running?",
    "Not sure? If you log in at yourname.odoo.com it's Odoo Online. If your IT team hosts it, choose On-Premise.",
    DEPLOYMENTS,
    project.projectIdentity.deployment,
    (value) => onIdentityChange({ deployment: value })
  );

  const modeSelect = connSelect(
    "conn-mode",
    "What are you trying to do?",
    "Most people choosing this for the first time should pick 'New implementation'.",
    PROJECT_MODES,
    project.projectIdentity.projectMode,
    (value) => onIdentityChange({ projectMode: value })
  );

  const nameInput = connInput(
    "conn-name",
    "What shall we call this project?",
    "e.g. My Business Odoo Setup",
    "Give it any name you like — it's just for your records.",
    project.projectIdentity.projectName,
    (value) => onIdentityChange({ projectName: value })
  );

  const orgInput = connInput(
    "conn-org",
    "Your business name",
    "e.g. The Old Manor Gift Shop",
    "This appears on your setup progress so you know which business it belongs to.",
    project.projectIdentity.organizationName,
    (value) => onIdentityChange({ organizationName: value })
  );

  const ownerInput = connInput(
    "conn-owner",
    "Your name",
    "e.g. Margaret Hartley",
    "The person leading this setup — usually you!",
    project.projectIdentity.projectOwner,
    (value) => onIdentityChange({ projectOwner: value })
  );

  const beginDisabled = !!combinationError;
  const beginBtn = el("button", {
    id: "conn-begin-btn",
    className: "conn-begin-btn" + (beginDisabled ? " conn-begin-btn--disabled" : ""),
    disabled: beginDisabled ? "disabled" : undefined,
    onclick: beginDisabled ? null : () => onBegin(),
    "aria-label": "Begin my Odoo 19 setup",
    title: beginDisabled ? combinationError : "Start your guided Odoo 19 setup"
  }, [
    el("span", { text: "Begin my setup →" })
  ]);

  const versionNote = el("p", { className: "conn-version-note" }, [
    el("span", { className: "conn-version-dot", "aria-hidden": "true" }),
    el("span", { text: `This guide covers Odoo ${ODOO_VERSION} only` })
  ]);

  const errorNote = combinationError
    ? el("p", { className: "conn-error-note", role: "alert", text: `⚠ ${combinationError}` })
    : null;

  const helpLink = el("p", { className: "conn-help-link" }, [
    el("a", {
      href: "https://www.odoo.com/pricing",
      target: "_blank",
      rel: "noopener noreferrer",
      text: "Don't have Odoo yet? Compare plans on odoo.com →"
    })
  ]);

  const progressBar = el("div", { className: "conn-progress", "aria-label": "Setup progress: step 1 of 2", role: "progressbar", "aria-valuenow": "1", "aria-valuemin": "0", "aria-valuemax": "2" }, [
    el("div", { className: "conn-progress__fill" })
  ]);

  const rightPanel = el("main", {
    className: "conn-right",
    id: "main-content",
    "aria-label": "Setup form"
  }, [
    el("div", { className: "conn-right__inner" }, [
      el("p", { className: "conn-step-label", text: "Step 1 of 2 — Tell us about your Odoo" }),
      el("h2", { className: "conn-heading", text: "Let's get your Odoo 19 guide ready" }),
      el("p", { className: "conn-subheading", text: "Answer a few quick questions and we'll tailor the guide to your exact setup. It takes about 2 minutes." }),

      el("div", { className: "conn-form", role: "form", "aria-label": "Odoo setup details" }, [
        editionSelect,
        deploymentSelect,
        modeSelect,
        el("hr", { className: "conn-divider", "aria-hidden": "true" }),
        el("p", { className: "conn-section-label", text: "A little about you (optional but helpful)" }),
        orgInput,
        ownerInput,
        nameInput
      ]),

      errorNote,
      beginBtn,
      helpLink,
      versionNote,
      progressBar
    ])
  ]);

  return el("div", {
    className: "conn-page",
    role: "region",
    "aria-label": "Odoo 19 Setup Guide — getting started"
  }, [leftPanel, rightPanel]);
}

// ── Helpers ──────────────────────────────────────────────────────────────

function featureBullet(icon, text) {
  return el("li", { className: "conn-features__item" }, [
    el("span", { className: "conn-features__icon", "aria-hidden": "true", text: icon }),
    el("span", { text })
  ]);
}

function connInput(id, label, placeholder, hint, value, onChange) {
  const input = el("input", {
    id,
    type: "text",
    placeholder,
    value,
    autocomplete: "off",
    "aria-describedby": `${id}-hint`,
    oninput: (event) => onChange(event.target.value)
  });

  return el("div", { className: "conn-field" }, [
    el("label", { htmlFor: id, className: "conn-field__label", text: label }),
    input,
    el("p", { id: `${id}-hint`, className: "conn-field__hint", text: hint })
  ]);
}

function connSelect(id, label, hint, options, selectedValue, onChange) {
  const select = el("select", {
    id,
    "aria-describedby": `${id}-hint`,
    onchange: (event) => onChange(event.target.value)
  }, options.map((opt) => {
    const option = el("option", { value: opt, text: opt });
    option.selected = opt === selectedValue;
    return option;
  }));

  return el("div", { className: "conn-field" }, [
    el("label", { htmlFor: id, className: "conn-field__label", text: label }),
    el("div", { className: "conn-select-wrap" }, [select]),
    el("p", { id: `${id}-hint`, className: "conn-field__hint", text: hint })
  ]);
}
