import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { getState, setCurrentView } from "../state/app-store.js";
import { onboardingStore } from "../state/onboarding-store.js";

const TOTAL_STEPS = 3;
const PULSE_KEYFRAMES_ID = "pod-connection-wizard-keyframes";

const CANVAS_STYLE =
  "min-height: 100vh; box-sizing: border-box; " +
  "background: var(--canvas-bloom-warm-hero), var(--canvas-bloom-cool-hero), " +
  "var(--color-canvas-base), var(--surface-texture); " +
  "font-family: var(--font-body); color: var(--color-ink);";

const COLUMN_STYLE =
  "max-width: 560px; margin: 0 auto; " +
  "display: flex; flex-direction: column; gap: var(--space-8); " +
  "padding: var(--space-10) var(--space-5);";

const BRAND_STYLE =
  "display: inline-flex; align-self: flex-start; align-items: center; " +
  "font-family: var(--font-body); font-size: var(--fs-body); font-weight: 600; " +
  "letter-spacing: var(--track-tight); color: var(--color-ink); " +
  "background: none; border: none; padding: 0; cursor: pointer;";

const EYEBROW_STYLE =
  "display: inline-flex; align-self: flex-start; align-items: center; " +
  "padding: 4px 12px; border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-pill); background: var(--color-surface); " +
  "font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; " +
  "text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); " +
  "color: var(--color-subtle);";

const HERO_BLOCK_STYLE = "display: flex; flex-direction: column; gap: var(--space-4);";

const HEADLINE_STYLE =
  "margin: 0; font-family: var(--font-body); font-size: var(--fs-h1); " +
  "font-weight: 600; line-height: var(--lh-tight); letter-spacing: var(--track-tight); " +
  "color: var(--color-ink);";

const HEADLINE_MUTED_SPAN_STYLE = "color: var(--color-muted);";

const FORM_CARD_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-card); padding: var(--space-7); " +
  "display: flex; flex-direction: column; gap: var(--space-5); " +
  "box-shadow: var(--shadow-raised);";

const FIELD_WRAP_STYLE = "display: flex; flex-direction: column; gap: var(--space-2);";

const FIELD_LABEL_STYLE =
  "font-family: var(--font-body); font-size: var(--fs-small); " +
  "font-weight: 500; color: var(--color-ink);";

const FIELD_INPUT_BODY_STYLE =
  "width: 100%; box-sizing: border-box; " +
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-input); padding: 10px 12px; " +
  "font-family: var(--font-body); font-size: var(--fs-small); color: var(--color-ink); " +
  "outline: none; transition: border-color var(--dur-fast) var(--ease);";

const FIELD_INPUT_MONO_STYLE =
  "width: 100%; box-sizing: border-box; " +
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-input); padding: 10px 12px; " +
  "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-ink); " +
  "outline: none; transition: border-color var(--dur-fast) var(--ease);";

const FIELD_HINT_STYLE =
  "font-family: var(--font-body); font-size: var(--fs-micro); " +
  "color: var(--color-muted); line-height: var(--lh-body); margin: 0;";

const FIELD_HINT_MONO_STYLE =
  "font-family: var(--font-mono); font-size: var(--fs-micro); " +
  "color: var(--color-muted); line-height: var(--lh-body); margin: 0;";

const PILL_PRIMARY_STYLE =
  "display: inline-flex; align-items: center; gap: 8px; " +
  "padding: 11px 20px; border-radius: var(--radius-pill); " +
  "background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg); " +
  "border: 1px solid var(--color-pill-primary-bg); " +
  "font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; " +
  "cursor: pointer; transition: all var(--dur-base) var(--ease);";

const PILL_SECONDARY_STYLE =
  "display: inline-flex; align-items: center; gap: 8px; " +
  "padding: 11px 20px; border-radius: var(--radius-pill); " +
  "background: var(--color-pill-secondary-bg); color: var(--color-pill-secondary-fg); " +
  "border: 1px solid var(--color-pill-secondary-border); " +
  "font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; " +
  "cursor: pointer; transition: all var(--dur-base) var(--ease);";

const STEP_NAV_ROW_STYLE =
  "display: flex; justify-content: space-between; align-items: center; gap: var(--space-3);";

const SEGMENTED_WRAP_STYLE =
  "display: flex; flex-direction: column; gap: var(--space-2);";

const SEGMENTED_ROW_STYLE =
  "display: flex; gap: var(--space-2); flex-wrap: wrap;";

const SEGMENTED_OPTION_STYLE =
  "flex: 1 1 0; min-width: 120px; " +
  "padding: 10px 14px; border-radius: var(--radius-pill); " +
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "color: var(--color-body); font-family: var(--font-body); font-size: var(--fs-small); " +
  "font-weight: 500; cursor: pointer; text-align: center; " +
  "transition: all var(--dur-fast) var(--ease);";

const SEGMENTED_OPTION_SELECTED_STYLE =
  "flex: 1 1 0; min-width: 120px; " +
  "padding: 10px 14px; border-radius: var(--radius-pill); " +
  "background: var(--color-chip-ready-bg); border: 1px solid var(--color-ink); " +
  "color: var(--color-ink); font-family: var(--font-body); font-size: var(--fs-small); " +
  "font-weight: 500; cursor: pointer; text-align: center; " +
  "transition: all var(--dur-fast) var(--ease);";

const CHECKBOX_ROW_STYLE =
  "display: flex; align-items: center; gap: var(--space-3); cursor: pointer; " +
  "padding: var(--space-3); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-panel); background: var(--color-surface);";

const CHECKBOX_DOT_STYLE =
  "width: 16px; height: 16px; border-radius: 4px; " +
  "border: 1px solid var(--color-line); background: var(--color-surface); " +
  "display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;";

const CHECKBOX_DOT_CHECKED_STYLE =
  "width: 16px; height: 16px; border-radius: 4px; " +
  "border: 1px solid var(--color-ink); background: var(--color-ink); " +
  "color: var(--color-pill-primary-fg); " +
  "display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;";

const CHECKBOX_LABEL_STYLE =
  "font-family: var(--font-body); font-size: var(--fs-small); color: var(--color-ink);";

const INLINE_ERROR_STYLE =
  "background: var(--color-chip-review-bg); border: 1px solid var(--color-chip-review-fg); " +
  "border-radius: var(--radius-panel); padding: var(--space-3) var(--space-4); " +
  "color: var(--color-chip-review-fg); font-family: var(--font-body); font-size: var(--fs-small); " +
  "line-height: var(--lh-body); display: flex; flex-direction: column; gap: var(--space-1);";

const SUMMARY_ROW_STYLE =
  "display: flex; justify-content: space-between; gap: var(--space-4); " +
  "padding: var(--space-3) 0; border-bottom: 1px solid var(--color-line-soft); " +
  "font-family: var(--font-body); font-size: var(--fs-small);";

const SUMMARY_LABEL_STYLE = "color: var(--color-muted);";
const SUMMARY_VALUE_STYLE =
  "color: var(--color-ink); font-family: var(--font-mono); text-align: right; " +
  "overflow-wrap: anywhere;";

const TESTING_BLOCK_STYLE =
  "display: flex; flex-direction: column; align-items: center; gap: var(--space-4); " +
  "padding: var(--space-8) var(--space-6); text-align: center;";

const PULSE_DOT_STYLE =
  "width: 10px; height: 10px; border-radius: 50%; background: var(--accent-grad); " +
  "animation: pod-pulse 1.6s var(--ease) infinite;";

const TESTING_TEXT_STYLE =
  "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted); margin: 0;";

const SUCCESS_BLOCK_STYLE =
  "display: flex; flex-direction: column; gap: var(--space-4);";

const SUCCESS_TITLE_STYLE =
  "margin: 0; font-family: var(--font-body); font-size: var(--fs-h1); " +
  "font-weight: 600; color: var(--color-ink); line-height: var(--lh-tight); " +
  "letter-spacing: var(--track-tight);";

const SUCCESS_BODY_STYLE =
  "margin: 0; font-family: var(--font-body); font-size: var(--fs-body); " +
  "color: var(--color-body); line-height: var(--lh-body);";

const GRADIENT_CHECK_WRAP_STYLE =
  "width: 48px; height: 48px; border-radius: 50%; background: var(--accent-grad); " +
  "display: flex; align-items: center; justify-content: center; align-self: flex-start;";

const TEXT_LINK_STYLE =
  "background: none; border: none; padding: 0; cursor: pointer; " +
  "font-family: var(--font-body); font-size: var(--fs-small); " +
  "color: var(--color-subtle); text-decoration: underline; text-underline-offset: 3px; " +
  "align-self: center; transition: color var(--dur-fast) var(--ease);";

const SECURITY_FOOTER_STYLE =
  "display: flex; align-items: center; justify-content: center; gap: var(--space-2); " +
  "font-family: var(--font-mono); font-size: var(--fs-micro); color: var(--color-muted); " +
  "text-align: center;";

function injectPulseKeyframes() {
  if (typeof document === "undefined") return;
  if (document.getElementById(PULSE_KEYFRAMES_ID)) return;
  const styleEl = document.createElement("style");
  styleEl.id = PULSE_KEYFRAMES_ID;
  styleEl.textContent =
    "@keyframes pod-pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.2); } }";
  document.head.appendChild(styleEl);
}

function bindFocusBorder(node) {
  if (!node) return;
  node.addEventListener("focus", () => { node.style.borderColor = "var(--color-ink)"; });
  node.addEventListener("blur", () => { node.style.borderColor = "var(--color-line)"; });
}

function renderBrandMark(onClick) {
  return el("button", {
    type: "button",
    style: BRAND_STYLE,
    onclick: onClick,
    "aria-label": "Project Odoo \u2014 home",
    text: "Project Odoo",
  });
}

function renderEyebrow(text) {
  return el("span", { style: EYEBROW_STYLE, text });
}

function renderGradientCheck() {
  const check = lucideIcon("check", 24);
  check.style.color = "var(--color-pill-primary-fg)";
  check.style.strokeWidth = "2.5";
  return el("div", {
    style: GRADIENT_CHECK_WRAP_STYLE,
    "aria-hidden": "true",
  }, [check]);
}

function deriveDefaultDatabase(url) {
  const host = (url || "").toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const match = host.match(/^(?:www\.)?([^.]+)/);
  return match ? match[1] : host;
}

function normaliseUrl(raw) {
  const trimmed = (raw || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  return trimmed ? `https://${trimmed}` : "";
}

function humanizeError(err) {
  const message = typeof err === "string" ? err : (err?.message || "Connection failed.");
  const lower = message.toLowerCase();
  if (lower.includes("authentication") || lower.includes("password") || lower.includes("login")) {
    return { message: "Invalid username or password", suggestion: "Check your credentials and try again." };
  }
  if (lower.includes("database")) {
    return { message: "Database not found", suggestion: "Check the database name, or enable 'Create new database'." };
  }
  if (lower.includes("url") || lower.includes("host") || lower.includes("network")) {
    return { message: "Cannot reach your Odoo", suggestion: "Check the URL and ensure the server is online." };
  }
  return { message: "Connection failed", suggestion: message };
}

export function renderConnectionWizardView({ onConnect, onSkip }) {
  injectPulseKeyframes();

  const stored = onboardingStore.getState();
  const storedUrlRaw = (stored.connection?.url || "").replace(/^https?:\/\//, "").replace(/\/.*$/, "");
  const storedDb = stored.connection?.database || "";

  const state = {
    step: 1,
    instanceType: "online",
    edition: "community",
    instanceUrl: storedUrlRaw,
    database: storedDb || deriveDefaultDatabase(storedUrlRaw),
    username: "",
    password: "",
    isNewDatabase: false,
    testStatus: "idle",
    testError: null,
  };

  const inputs = {};
  const container = el("div", { style: CANVAS_STYLE });

  render();
  return container;

  function captureStep1() {
    if (inputs.url) {
      let val = inputs.url.value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      state.instanceUrl = val;
      if (!state.database || state.database === deriveDefaultDatabase(state.instanceUrl)) {
        state.database = deriveDefaultDatabase(val);
      }
    }
    if (inputs.database) {
      const db = inputs.database.value.trim();
      if (db) state.database = db;
    }
  }

  function captureStep2() {
    if (inputs.username) state.username = inputs.username.value.trim();
    if (inputs.password) state.password = inputs.password.value;
  }

  function navigateHome() {
    setCurrentView("home");
  }

  function render() {
    clearNode(container);

    const heroBlock = buildHeroBlock();
    const card = el("div", { style: FORM_CARD_STYLE }, buildStepContent());

    const children = [
      renderBrandMark(navigateHome),
      heroBlock,
      card,
    ];

    if (state.step < 3 || (state.step === 3 && state.testStatus !== "loading" && state.testStatus !== "success")) {
      children.push(buildStepNav());
    }

    children.push(buildCancelLink());
    children.push(buildSecurityFooter());

    const column = el("div", { style: COLUMN_STYLE }, children);
    container.append(column);
  }

  function buildHeroBlock() {
    const eyebrowText = `Connect \u00b7 Step ${state.step} / ${TOTAL_STEPS}`;

    if (state.step === 3 && state.testStatus === "success") {
      return el("div", { style: HERO_BLOCK_STYLE }, [
        renderEyebrow("Connected"),
      ]);
    }

    let headline;
    if (state.step === 1) {
      headline = el("h1", { style: HEADLINE_STYLE }, [
        el("span", { text: "Where\u2019s your Odoo?" }),
        el("span", { style: HEADLINE_MUTED_SPAN_STYLE, text: " Paste the URL and database name \u2014 we\u2019ll verify it responds." }),
      ]);
    } else if (state.step === 2) {
      headline = el("h1", { style: HEADLINE_STYLE }, [
        el("span", { text: "Who are you logging in as?" }),
        el("span", { style: HEADLINE_MUTED_SPAN_STYLE, text: " We use these credentials once to authenticate this connection. We never store them." }),
      ]);
    } else {
      headline = el("h1", { style: HEADLINE_STYLE }, [
        el("span", { text: "Let\u2019s make sure this works." }),
        el("span", { style: HEADLINE_MUTED_SPAN_STYLE, text: " We\u2019ll run a quick read-only check against your instance." }),
      ]);
    }

    return el("div", { style: HERO_BLOCK_STYLE }, [
      renderEyebrow(eyebrowText),
      headline,
    ]);
  }

  function buildStepContent() {
    if (state.step === 1) return buildStep1Content();
    if (state.step === 2) return buildStep2Content();
    return buildStep3Content();
  }

  function buildStep1Content() {
    const urlInput = el("input", {
      style: FIELD_INPUT_MONO_STYLE,
      type: "text",
      id: "conn-url",
      name: "instanceUrl",
      placeholder: "your-db.odoo.com",
      autocomplete: "off",
      value: state.instanceUrl,
    });
    urlInput.addEventListener("input", (e) => {
      const val = e.target.value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
      state.instanceUrl = val;
      if (inputs.database && (inputs.database.value === "" || inputs.database.dataset.auto === "1")) {
        const derived = deriveDefaultDatabase(val);
        inputs.database.value = derived;
        inputs.database.dataset.auto = "1";
        state.database = derived;
      }
    });
    bindFocusBorder(urlInput);
    inputs.url = urlInput;

    const urlField = el("div", { style: FIELD_WRAP_STYLE }, [
      el("label", { style: FIELD_LABEL_STYLE, htmlFor: "conn-url" }, "Odoo URL"),
      urlInput,
      el("p", { style: FIELD_HINT_MONO_STYLE }, "https://your-db.odoo.com"),
    ]);

    const dbInput = el("input", {
      style: FIELD_INPUT_MONO_STYLE,
      type: "text",
      id: "conn-db",
      name: "database",
      placeholder: "my_database",
      autocomplete: "off",
      value: state.database,
    });
    dbInput.addEventListener("input", (e) => {
      state.database = e.target.value.trim();
      dbInput.dataset.auto = "0";
    });
    bindFocusBorder(dbInput);
    inputs.database = dbInput;

    const dbField = el("div", { style: FIELD_WRAP_STYLE }, [
      el("label", { style: FIELD_LABEL_STYLE, htmlFor: "conn-db" }, "Database name"),
      dbInput,
      el("p", { style: FIELD_HINT_STYLE }, "Found in your Odoo admin \u2192 Settings \u2192 Database."),
    ]);

    const typeField = buildSegmented({
      label: "How is your Odoo hosted?",
      value: state.instanceType,
      options: [
        { value: "online", label: "Odoo Online" },
        { value: "sh", label: "Odoo.sh" },
        { value: "selfhost", label: "Self-hosted" },
      ],
      onSelect: (value) => { state.instanceType = value; render(); },
    });

    const editionField = buildSegmented({
      label: "Edition",
      value: state.edition,
      options: [
        { value: "community", label: "Community" },
        { value: "enterprise", label: "Enterprise" },
      ],
      onSelect: (value) => { state.edition = value; render(); },
    });

    return [urlField, dbField, typeField, editionField];
  }

  function buildSegmented({ label, value, options, onSelect }) {
    const row = el("div", { style: SEGMENTED_ROW_STYLE });
    options.forEach((opt) => {
      const isSelected = value === opt.value;
      row.append(el("button", {
        type: "button",
        style: isSelected ? SEGMENTED_OPTION_SELECTED_STYLE : SEGMENTED_OPTION_STYLE,
        onclick: () => onSelect(opt.value),
      }, opt.label));
    });
    return el("div", { style: SEGMENTED_WRAP_STYLE }, [
      el("span", { style: FIELD_LABEL_STYLE }, label),
      row,
    ]);
  }

  function buildStep2Content() {
    const userInput = el("input", {
      style: FIELD_INPUT_BODY_STYLE,
      type: "email",
      id: "conn-user",
      name: "username",
      placeholder: "admin@company.com",
      autocomplete: "email",
      value: state.username,
    });
    bindFocusBorder(userInput);
    inputs.username = userInput;

    const userField = el("div", { style: FIELD_WRAP_STYLE }, [
      el("label", { style: FIELD_LABEL_STYLE, htmlFor: "conn-user" }, "Email or username"),
      userInput,
    ]);

    const passInput = el("input", {
      style: FIELD_INPUT_BODY_STYLE,
      type: "password",
      id: "conn-pass",
      name: "password",
      placeholder: "Your Odoo password",
      autocomplete: "current-password",
      value: state.password,
    });
    bindFocusBorder(passInput);
    inputs.password = passInput;

    const passField = el("div", { style: FIELD_WRAP_STYLE }, [
      el("label", { style: FIELD_LABEL_STYLE, htmlFor: "conn-pass" }, "Password"),
      passInput,
      el("p", { style: FIELD_HINT_MONO_STYLE }, "Used once. Not stored. Not logged."),
    ]);

    const checkboxIcon = state.isNewDatabase ? lucideIcon("check", 12) : null;
    if (checkboxIcon) {
      checkboxIcon.style.color = "var(--color-pill-primary-fg)";
      checkboxIcon.style.strokeWidth = "3";
    }
    const checkboxRow = el("div", {
      style: CHECKBOX_ROW_STYLE,
      onclick: () => { state.isNewDatabase = !state.isNewDatabase; render(); },
    }, [
      el("span", {
        style: state.isNewDatabase ? CHECKBOX_DOT_CHECKED_STYLE : CHECKBOX_DOT_STYLE,
      }, state.isNewDatabase ? [checkboxIcon] : []),
      el("span", { style: CHECKBOX_LABEL_STYLE, text: "Create new database on this instance" }),
    ]);

    return [userField, passField, checkboxRow];
  }

  function buildStep3Content() {
    if (state.testStatus === "loading") {
      return [
        el("div", { style: TESTING_BLOCK_STYLE }, [
          el("span", { style: PULSE_DOT_STYLE }),
          el("p", { style: TESTING_TEXT_STYLE }, "Testing connection\u2026"),
          el("p", { style: TESTING_TEXT_STYLE }, `Authenticating as ${state.username || "your user"}\u2026`),
        ]),
      ];
    }

    if (state.testStatus === "success") {
      return [
        el("div", { style: SUCCESS_BLOCK_STYLE }, [
          renderGradientCheck(),
          el("h2", { style: SUCCESS_TITLE_STYLE }, "You\u2019re connected"),
          el("p", { style: SUCCESS_BODY_STYLE },
            `Your Odoo at ${state.instanceUrl ? `https://${state.instanceUrl}` : "your instance"} is ready. Let\u2019s continue to the dashboard.`
          ),
          el("button", {
            type: "button",
            style: PILL_PRIMARY_STYLE,
            onclick: () => handleConnect(),
          }, [
            el("span", { text: "Continue to dashboard" }),
            lucideIcon("chevron-right", 16),
          ]),
        ]),
      ];
    }

    const summary = el("div", { style: "display: flex; flex-direction: column;" }, [
      buildSummaryRow("URL", state.instanceUrl ? `https://${state.instanceUrl}` : "\u2014"),
      buildSummaryRow("Database", state.database || "\u2014"),
      buildSummaryRow("Username", state.username || "\u2014"),
      buildSummaryRow("Type", state.instanceType === "online" ? "Odoo Online" : state.instanceType === "sh" ? "Odoo.sh" : "Self-hosted"),
      buildSummaryRow("Edition", state.edition === "community" ? "Community" : "Enterprise"),
      state.isNewDatabase ? buildSummaryRow("Database action", "Create new") : null,
    ].filter(Boolean));

    const content = [summary];

    if (state.testStatus === "error" && state.testError) {
      content.push(el("div", { style: INLINE_ERROR_STYLE }, [
        el("strong", { text: state.testError.message }),
        el("span", { text: state.testError.suggestion }),
      ]));
    }

    return content;
  }

  function buildSummaryRow(label, value) {
    return el("div", { style: SUMMARY_ROW_STYLE }, [
      el("span", { style: SUMMARY_LABEL_STYLE, text: label }),
      el("span", { style: SUMMARY_VALUE_STYLE, text: value }),
    ]);
  }

  function buildStepNav() {
    const backVisible = state.step > 1;
    const back = backVisible
      ? el("button", {
          type: "button",
          style: PILL_SECONDARY_STYLE,
          onclick: () => {
            if (state.step === 2) captureStep2();
            if (state.step === 3 && state.testStatus === "error") state.testStatus = "idle";
            state.step = Math.max(1, state.step - 1);
            render();
          },
        }, [lucideIcon("chevron-left", 16), el("span", { text: "Back" })])
      : el("span", {});

    let primaryLabel = "Continue";
    let primaryAction = () => advanceStep();
    if (state.step === 3) {
      primaryLabel = state.testStatus === "error" ? "Retry" : "Run connection test";
      primaryAction = () => runConnectionTest();
    }

    const primary = el("button", {
      type: "button",
      style: PILL_PRIMARY_STYLE,
      onclick: primaryAction,
    }, [
      el("span", { text: primaryLabel }),
      lucideIcon("chevron-right", 16),
    ]);

    return el("div", { style: STEP_NAV_ROW_STYLE }, [back, primary]);
  }

  function advanceStep() {
    if (state.step === 1) {
      captureStep1();
      if (!state.instanceUrl) {
        flashFieldError(inputs.url);
        return;
      }
      if (!state.database) {
        flashFieldError(inputs.database);
        return;
      }
      state.step = 2;
      render();
      return;
    }
    if (state.step === 2) {
      captureStep2();
      if (!state.username) {
        flashFieldError(inputs.username);
        return;
      }
      if (!state.password) {
        flashFieldError(inputs.password);
        return;
      }
      state.step = 3;
      state.testStatus = "idle";
      state.testError = null;
      render();
    }
  }

  function flashFieldError(node) {
    if (!node) return;
    node.style.borderColor = "var(--color-chip-review-fg)";
    node.focus();
  }

  async function runConnectionTest() {
    state.testStatus = "loading";
    state.testError = null;
    render();

    const canonicalUrl = normaliseUrl(state.instanceUrl);
    if (!canonicalUrl) {
      state.testStatus = "error";
      state.testError = { message: "No server URL", suggestion: "Enter your Odoo URL in step 1." };
      render();
      return;
    }

    const activeProjectId = getState().activeProject?.projectIdentity?.projectId || "test-connection";
    const payload = {
      project: { projectIdentity: { projectId: activeProjectId } },
      credentials: {
        url: canonicalUrl,
        database: state.database,
        username: state.username,
        password: state.password,
        edition: state.edition,
        instanceType: state.instanceType,
        createNewDatabase: state.isNewDatabase,
      },
    };

    try {
      const token = onboardingStore.getState()?.sessionToken || "";
      const headers = { "Content-Type": "application/json" };
      if (token) headers.Authorization = `Bearer ${token}`;
      const res = await fetch("/api/connection/connect", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        state.testStatus = "error";
        state.testError = humanizeError(data.error || "Connection failed");
      } else {
        state.testStatus = "success";
        state.testError = null;
      }
    } catch (err) {
      state.testStatus = "error";
      state.testError = humanizeError(err);
    }
    render();
  }

  function handleConnect() {
    const canonicalUrl = normaliseUrl(state.instanceUrl);
    onConnect({
      url: canonicalUrl,
      database: state.database,
      username: state.username,
      password: state.password,
      edition: state.edition,
      instanceType: state.instanceType,
      createNewDatabase: state.isNewDatabase,
    });
  }

  function buildCancelLink() {
    if (state.step === 3 && state.testStatus === "success") return null;
    return el("button", {
      type: "button",
      style: TEXT_LINK_STYLE,
      onclick: () => {
        if (typeof onSkip === "function") {
          onSkip();
        } else {
          setCurrentView("home");
        }
      },
    }, "Cancel and return home");
  }

  function buildSecurityFooter() {
    const lock = lucideIcon("lock", 12);
    lock.style.color = "var(--color-muted)";
    return el("div", { style: SECURITY_FOOTER_STYLE }, [
      lock,
      el("span", { text: "Credentials are ephemeral. This session: not stored, not logged, not returned." }),
    ]);
  }
}
