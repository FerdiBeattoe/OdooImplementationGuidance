import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";

const RESET_FETCH_TIMEOUT_MS = 15_000;

const CANVAS_STYLE =
  "min-height: 100vh; box-sizing: border-box; " +
  "background: var(--canvas-bloom-warm-hero), var(--canvas-bloom-cool-hero), " +
  "var(--color-canvas-base), var(--surface-texture); " +
  "font-family: var(--font-body); color: var(--color-ink);";

const COLUMN_STYLE =
  "max-width: 440px; margin: 0 auto; " +
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

const PILL_PRIMARY_FULL_STYLE =
  "display: inline-flex; width: 100%; justify-content: center; align-items: center; gap: 8px; " +
  "padding: 11px 20px; border-radius: var(--radius-pill); " +
  "background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg); " +
  "border: 1px solid var(--color-pill-primary-bg); " +
  "font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; " +
  "cursor: pointer; transition: all var(--dur-base) var(--ease);";

const PILL_SECONDARY_FULL_STYLE =
  "display: inline-flex; width: 100%; justify-content: center; align-items: center; gap: 8px; " +
  "padding: 11px 20px; border-radius: var(--radius-pill); " +
  "background: var(--color-pill-secondary-bg); color: var(--color-pill-secondary-fg); " +
  "border: 1px solid var(--color-pill-secondary-border); " +
  "font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; " +
  "cursor: pointer; transition: all var(--dur-base) var(--ease);";

const TEXT_LINK_STYLE =
  "background: none; border: none; padding: 0; cursor: pointer; " +
  "font-family: var(--font-body); font-size: var(--fs-small); " +
  "color: var(--color-subtle); text-decoration: underline; text-underline-offset: 3px; " +
  "align-self: flex-start; transition: color var(--dur-fast) var(--ease);";

const INLINE_ERROR_STYLE =
  "background: var(--color-chip-review-bg); border: 1px solid var(--color-chip-review-fg); " +
  "border-radius: var(--radius-panel); padding: var(--space-3) var(--space-4); " +
  "color: var(--color-chip-review-fg); font-family: var(--font-body); font-size: var(--fs-small); " +
  "line-height: var(--lh-body);";

const SUCCESS_CARD_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-card); padding: var(--space-7); " +
  "display: flex; flex-direction: column; gap: var(--space-4); " +
  "box-shadow: var(--shadow-raised);";

const SUCCESS_DOT_STYLE =
  "width: 6px; height: 6px; border-radius: 50%; background: var(--accent-grad); " +
  "align-self: flex-start;";

const SUCCESS_TITLE_STYLE =
  "margin: 0; font-family: var(--font-body); font-size: var(--fs-h1); " +
  "font-weight: 600; color: var(--color-ink); line-height: var(--lh-tight); " +
  "letter-spacing: var(--track-tight);";

const SUCCESS_TITLE_H2_STYLE =
  "margin: 0; font-family: var(--font-body); font-size: var(--fs-h2); " +
  "font-weight: 600; color: var(--color-ink); line-height: var(--lh-tight); " +
  "letter-spacing: var(--track-tight);";

const SUCCESS_BODY_STYLE =
  "margin: 0; font-family: var(--font-body); font-size: var(--fs-body); " +
  "color: var(--color-body); line-height: var(--lh-body);";

const SUCCESS_EMAIL_STYLE =
  "font-family: var(--font-mono); font-size: var(--fs-micro); color: var(--color-muted); margin: 0;";

const CHECKLIST_WRAP_STYLE =
  "display: flex; flex-direction: column; gap: var(--space-2); margin-top: var(--space-2);";

const CHECKLIST_ROW_STYLE =
  "display: flex; align-items: center; gap: var(--space-2); " +
  "font-family: var(--font-body); font-size: var(--fs-micro); color: var(--color-muted); " +
  "transition: color var(--dur-fast) var(--ease);";

const CHECKLIST_DOT_EMPTY_STYLE =
  "width: 10px; height: 10px; border-radius: 50%; " +
  "border: 1px solid var(--color-line); background: var(--color-surface); " +
  "flex-shrink: 0;";

const CHECKLIST_DOT_FILLED_STYLE =
  "width: 10px; height: 10px; border-radius: 50%; " +
  "border: none; background: var(--accent-grad); flex-shrink: 0;";

const GRADIENT_CHECK_WRAP_STYLE =
  "width: 48px; height: 48px; border-radius: 50%; background: var(--accent-grad); " +
  "display: flex; align-items: center; justify-content: center; align-self: flex-start;";

const PASSWORD_RULES = [
  { id: "len", label: "At least 8 characters", test: (v) => v.length >= 8 },
  { id: "num", label: "One number", test: (v) => /\d/.test(v) },
  { id: "upper", label: "One uppercase letter", test: (v) => /[A-Z]/.test(v) },
  { id: "lower", label: "One lowercase letter", test: (v) => /[a-z]/.test(v) },
];

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

function renderField({ id, label, type, name, placeholder, autocomplete, mono = false, onInput }) {
  const input = el("input", {
    style: mono ? FIELD_INPUT_MONO_STYLE : FIELD_INPUT_BODY_STYLE,
    type,
    id,
    name,
    placeholder,
    autocomplete,
    required: true,
  });
  if (onInput) input.addEventListener("input", onInput);
  bindFocusBorder(input);
  return el("div", { style: FIELD_WRAP_STYLE }, [
    el("label", { style: FIELD_LABEL_STYLE, htmlFor: id }, label),
    input,
  ]);
}

function renderGradientCheckIcon() {
  const check = lucideIcon("check", 24);
  check.style.color = "var(--color-pill-primary-fg)";
  check.style.strokeWidth = "2.5";
  return el("div", {
    style: GRADIENT_CHECK_WRAP_STYLE,
    "aria-hidden": "true",
  }, [check]);
}

export function renderResetPasswordScreen({ setCurrentView }) {
  const container = el("div", { className: "auth-page", style: CANVAS_STYLE });

  let step1EmailSent = false;
  let step1Email = "";
  let step2Complete = false;

  function goToSignIn() {
    setCurrentView("auth");
  }

  function navigateHome() {
    setCurrentView("home");
  }

  function render() {
    clearNode(container);
    const hasToken = Boolean(sessionStorage.getItem("reset_access_token"));

    if (hasToken) {
      if (step2Complete) {
        renderStep2Success();
      } else {
        renderStep2Form();
      }
    } else {
      if (step1EmailSent) {
        renderStep1Success();
      } else {
        renderStep1Form();
      }
    }
  }

  function renderStep1Form() {
    let errorEl = null;
    function showError(msg) {
      if (!errorEl) return;
      errorEl.textContent = msg;
      errorEl.style.display = msg ? "block" : "none";
    }

    async function handleSubmit(event) {
      event.preventDefault();
      showError("");

      const form = event.target;
      const email = (form.elements.resetEmail?.value || "").trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("Enter a valid email address.");
        return;
      }

      const submitBtn = form.querySelector("button[type=submit]");
      const submitLabel = submitBtn?.querySelector("[data-role=label]");
      submitBtn.disabled = true;
      if (submitLabel) submitLabel.textContent = "Sending\u2026";

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), RESET_FETCH_TIMEOUT_MS);

      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          signal: controller.signal,
        });

        let data;
        try { data = await response.json(); } catch {
          showError(response.ok
            ? "Unexpected server response. Please try again."
            : `Server error (${response.status}). Please try again.`);
          return;
        }

        if (!response.ok) {
          showError(data.error || "Failed to send reset email.");
          return;
        }

        step1Email = email;
        step1EmailSent = true;
        render();
      } catch (err) {
        if (err.name === "AbortError") {
          showError("Request timed out. Check your connection and try again.");
        } else {
          showError("Network error \u2014 please try again.");
        }
      } finally {
        clearTimeout(timer);
        submitBtn.disabled = false;
        if (submitLabel) submitLabel.textContent = "Send reset link";
      }
    }

    errorEl = el("div", {
      className: "auth-error",
      style: `${INLINE_ERROR_STYLE} display: none;`,
    }, "");

    const submitLabel = el("span", { "data-role": "label", text: "Send reset link" });
    const submit = el("button", {
      className: "auth-submit-btn",
      type: "submit",
      style: PILL_PRIMARY_FULL_STYLE,
    }, [submitLabel, lucideIcon("chevron-right", 16)]);

    const form = el("form", {
      className: "auth-form",
      style: FORM_CARD_STYLE,
      onsubmit: handleSubmit,
      noValidate: true,
    }, [
      renderField({
        id: "reset-email",
        label: "Email",
        type: "email",
        name: "resetEmail",
        placeholder: "you@company.com",
        autocomplete: "email",
        mono: true,
      }),
      errorEl,
      submit,
      el("button", {
        type: "button",
        style: TEXT_LINK_STYLE,
        onclick: goToSignIn,
      }, "Back to sign in"),
    ]);

    const headline = el("h1", { style: HEADLINE_STYLE }, [
      el("span", { text: "Forgot your password?" }),
      el("span", { style: HEADLINE_MUTED_SPAN_STYLE, text: " No trouble. Enter your email and we\u2019ll send a reset link." }),
    ]);

    const heroBlock = el("div", { style: HERO_BLOCK_STYLE }, [
      renderEyebrow("Reset password"),
      headline,
    ]);

    const column = el("div", { style: COLUMN_STYLE }, [
      renderBrandMark(navigateHome),
      heroBlock,
      form,
    ]);

    container.append(column);
  }

  function renderStep1Success() {
    async function handleResend() {
      if (!step1Email) return;
      resendBtn.disabled = true;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), RESET_FETCH_TIMEOUT_MS);
      try {
        await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: step1Email }),
          signal: controller.signal,
        });
      } catch {
        // Silent — server handles delivery; double-sends are harmless.
      } finally {
        clearTimeout(timer);
        resendBtn.disabled = false;
      }
    }

    const resendBtn = el("button", {
      type: "button",
      style: PILL_SECONDARY_FULL_STYLE,
      onclick: handleResend,
    }, [el("span", { text: "Resend" })]);

    const successCard = el("div", { style: SUCCESS_CARD_STYLE }, [
      el("span", { style: SUCCESS_DOT_STYLE }),
      el("h2", { style: SUCCESS_TITLE_H2_STYLE }, "Check your email"),
      el("p", { style: SUCCESS_BODY_STYLE }, `We sent a reset link to ${step1Email}.`),
      el("p", { style: SUCCESS_EMAIL_STYLE }, step1Email),
      resendBtn,
      el("button", {
        type: "button",
        style: TEXT_LINK_STYLE,
        onclick: goToSignIn,
      }, "Back to sign in"),
    ]);

    const column = el("div", { style: COLUMN_STYLE }, [
      renderBrandMark(navigateHome),
      successCard,
    ]);

    container.append(column);
  }

  function renderStep2Form() {
    let errorEl = null;
    let newPasswordInput = null;
    const ruleRefs = {};

    function showError(msg) {
      if (!errorEl) return;
      errorEl.textContent = msg;
      errorEl.style.display = msg ? "block" : "none";
    }

    function updateChecklist(value) {
      PASSWORD_RULES.forEach((rule) => {
        const ref = ruleRefs[rule.id];
        if (!ref) return;
        const passed = rule.test(value);
        ref.dot.setAttribute("style", passed ? CHECKLIST_DOT_FILLED_STYLE : CHECKLIST_DOT_EMPTY_STYLE);
        ref.row.style.color = passed ? "var(--color-ink)" : "var(--color-muted)";
      });
    }

    async function handleSubmit(event) {
      event.preventDefault();
      showError("");

      const form = event.target;
      const password = form.elements.password?.value || "";
      const confirmPassword = form.elements.confirmPassword?.value || "";

      if (password.length < 8) {
        showError("Password must be at least 8 characters.");
        return;
      }

      if (password !== confirmPassword) {
        showError("Passwords do not match.");
        return;
      }

      const accessToken = sessionStorage.getItem("reset_access_token");
      if (!accessToken) {
        showError("Reset link expired. Request a new one.");
        return;
      }

      const submitButton = form.querySelector("button[type=submit]");
      const submitLabel = submitButton?.querySelector("[data-role=label]");
      submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = "Setting password\u2026";

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), RESET_FETCH_TIMEOUT_MS);

      try {
        const response = await fetch("/api/auth/update-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password, accessToken }),
          signal: controller.signal,
        });

        let data;
        try { data = await response.json(); } catch {
          showError(response.ok
            ? "Unexpected server response. Please try again."
            : `Server error (${response.status}). Please try again.`);
          return;
        }

        if (!response.ok) {
          showError(data.error || "Unable to update password.");
          return;
        }

        sessionStorage.removeItem("reset_access_token");
        step2Complete = true;
        render();
      } catch (err) {
        if (err.name === "AbortError") {
          showError("Request timed out. Check your connection and try again.");
        } else {
          showError("Network error \u2014 please try again.");
        }
      } finally {
        clearTimeout(timer);
        if (submitButton && submitButton.isConnected) {
          submitButton.disabled = false;
          if (submitLabel) submitLabel.textContent = "Set password";
        }
      }
    }

    const checklistRows = PASSWORD_RULES.map((rule) => {
      const dot = el("span", { style: CHECKLIST_DOT_EMPTY_STYLE });
      const row = el("div", { style: CHECKLIST_ROW_STYLE }, [
        dot,
        el("span", { text: rule.label }),
      ]);
      ruleRefs[rule.id] = { dot, row };
      return row;
    });

    newPasswordInput = el("input", {
      style: FIELD_INPUT_BODY_STYLE,
      type: "password",
      id: "reset-password",
      name: "password",
      placeholder: "New password",
      autocomplete: "new-password",
      required: true,
    });
    newPasswordInput.addEventListener("input", (e) => updateChecklist(e.target.value));
    bindFocusBorder(newPasswordInput);

    const newPasswordField = el("div", { style: FIELD_WRAP_STYLE }, [
      el("label", { style: FIELD_LABEL_STYLE, htmlFor: "reset-password" }, "New password"),
      newPasswordInput,
      el("div", { style: CHECKLIST_WRAP_STYLE }, checklistRows),
    ]);

    const confirmInput = el("input", {
      style: FIELD_INPUT_BODY_STYLE,
      type: "password",
      id: "reset-password-confirm",
      name: "confirmPassword",
      placeholder: "Repeat your password",
      autocomplete: "new-password",
      required: true,
    });
    bindFocusBorder(confirmInput);

    const confirmField = el("div", { style: FIELD_WRAP_STYLE }, [
      el("label", { style: FIELD_LABEL_STYLE, htmlFor: "reset-password-confirm" }, "Confirm password"),
      confirmInput,
    ]);

    errorEl = el("div", {
      className: "auth-error",
      style: `${INLINE_ERROR_STYLE} display: none;`,
    }, "");

    const submitLabel = el("span", { "data-role": "label", text: "Set password" });
    const submit = el("button", {
      className: "auth-submit-btn",
      type: "submit",
      style: PILL_PRIMARY_FULL_STYLE,
    }, [submitLabel, lucideIcon("chevron-right", 16)]);

    const form = el("form", {
      className: "auth-form",
      style: FORM_CARD_STYLE,
      onsubmit: handleSubmit,
      noValidate: true,
    }, [
      newPasswordField,
      confirmField,
      errorEl,
      submit,
    ]);

    const headline = el("h1", { style: HEADLINE_STYLE }, [
      el("span", { text: "One more step." }),
      el("span", { style: HEADLINE_MUTED_SPAN_STYLE, text: " Pick a strong password \u2014 at least 8 characters." }),
    ]);

    const heroBlock = el("div", { style: HERO_BLOCK_STYLE }, [
      renderEyebrow("Set a new password"),
      headline,
    ]);

    const column = el("div", { style: COLUMN_STYLE }, [
      renderBrandMark(navigateHome),
      heroBlock,
      form,
    ]);

    container.append(column);
  }

  function renderStep2Success() {
    const successCard = el("div", { style: SUCCESS_CARD_STYLE }, [
      renderGradientCheckIcon(),
      el("h2", { style: SUCCESS_TITLE_STYLE }, "Password set"),
      el("p", { style: SUCCESS_BODY_STYLE }, "You can sign in with your new password now."),
      el("button", {
        type: "button",
        style: PILL_PRIMARY_FULL_STYLE,
        onclick: goToSignIn,
      }, [
        el("span", { text: "Go to sign in" }),
        lucideIcon("chevron-right", 16),
      ]),
    ]);

    const column = el("div", { style: COLUMN_STYLE }, [
      renderBrandMark(navigateHome),
      successCard,
    ]);

    container.append(column);
  }

  render();
  return container;
}
