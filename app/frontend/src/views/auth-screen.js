import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { onboardingStore } from "../state/onboarding-store.js";
import { setCurrentView } from "../state/app-store.js";
import { writeStoredProjectId } from "./landing-page.js";

const AUTH_FETCH_TIMEOUT_MS = 15_000;

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
  "margin: 0; font-family: var(--font-body); font-size: var(--fs-display); " +
  "font-weight: 600; line-height: var(--lh-tight); letter-spacing: var(--track-tight); " +
  "color: var(--color-ink);";

const HEADLINE_MUTED_SPAN_STYLE = "color: var(--color-muted);";

const HEADLINE_ACCENT_SPAN_STYLE =
  "background: var(--accent-grad); -webkit-background-clip: text; " +
  "background-clip: text; color: transparent;";

const LEDE_STYLE =
  "margin: 0; font-family: var(--font-body); font-size: var(--fs-body); " +
  "line-height: var(--lh-body); color: var(--color-body);";

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

const TOGGLE_FOOTER_STYLE =
  "text-align: center; font-family: var(--font-body); font-size: var(--fs-small); " +
  "color: var(--color-muted); margin: 0;";

const TOGGLE_INLINE_LINK_STYLE =
  "background: none; border: none; padding: 0; cursor: pointer; " +
  "font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; " +
  "color: var(--color-ink); text-decoration: underline; text-underline-offset: 3px; " +
  "margin-left: 4px;";

const SUCCESS_CARD_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-card); padding: var(--space-7); " +
  "display: flex; flex-direction: column; gap: var(--space-4); " +
  "box-shadow: var(--shadow-raised);";

const SUCCESS_DOT_STYLE =
  "width: 6px; height: 6px; border-radius: 50%; background: var(--accent-grad); " +
  "align-self: flex-start;";

const SUCCESS_TITLE_STYLE =
  "margin: 0; font-family: var(--font-body); font-size: var(--fs-h2); " +
  "font-weight: 600; color: var(--color-ink); line-height: var(--lh-tight); " +
  "letter-spacing: var(--track-tight);";

const SUCCESS_BODY_STYLE =
  "margin: 0; font-family: var(--font-body); font-size: var(--fs-body); " +
  "color: var(--color-body); line-height: var(--lh-body);";

const SUCCESS_EMAIL_STYLE =
  "font-family: var(--font-mono); font-size: var(--fs-micro); color: var(--color-muted); margin: 0;";

function bindFocusBorder(node) {
  if (!node) return;
  node.addEventListener("focus", () => { node.style.borderColor = "var(--color-ink)"; });
  node.addEventListener("blur", () => { node.style.borderColor = "var(--color-line)"; });
}

function renderField({ id, label, type, name, placeholder, autocomplete, mono = false, hint = "" }) {
  const input = el("input", {
    style: mono ? FIELD_INPUT_MONO_STYLE : FIELD_INPUT_BODY_STYLE,
    type,
    id,
    name,
    placeholder,
    autocomplete,
    required: true,
  });
  bindFocusBorder(input);

  const children = [
    el("label", { style: FIELD_LABEL_STYLE, htmlFor: id }, label),
    input,
  ];
  if (hint) {
    children.push(el("p", { style: FIELD_HINT_STYLE }, hint));
  }
  return el("div", { style: FIELD_WRAP_STYLE }, children);
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

function renderChevron(size = 16) {
  return lucideIcon("chevron-right", size);
}

export function renderAuthScreen({ onBack } = {}) {
  let mode = "signin";
  let pendingEmail = "";
  const container = el("div", { className: "auth-page", style: CANVAS_STYLE });

  function navigateHome() {
    if (onBack) {
      onBack();
      return;
    }
    setCurrentView("home");
  }

  function render() {
    clearNode(container);

    if (container._cleanupPopstate) {
      window.removeEventListener("popstate", container._cleanupPopstate);
    }
    const handlePopstate = () => setCurrentView("home");
    window.addEventListener("popstate", handlePopstate);
    container._cleanupPopstate = handlePopstate;

    if (mode === "signup-check-email") {
      renderCheckEmail();
      return;
    }

    renderForm();
  }

  function renderForm() {
    const isCreateMode = mode === "create";
    let errorEl = null;

    function showError(message) {
      if (!errorEl) return;
      errorEl.textContent = message;
      errorEl.style.display = message ? "block" : "none";
    }

    async function handleSubmit(event) {
      event.preventDefault();
      showError("");

      const form = event.target;
      const email = (form.elements.email?.value || "").trim();
      const password = form.elements.password?.value || "";

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("Enter a valid email address.");
        return;
      }

      if (password.length < 8) {
        showError("Password must be at least 8 characters.");
        return;
      }

      onboardingStore.reset();

      if (isCreateMode) {
        const fullName = (form.elements.fullName?.value || "").trim();
        const companyName = (form.elements.companyName?.value || "").trim();
        const inviteCode = (form.elements.inviteCode?.value || "").trim();

        if (!fullName) {
          showError("Full name is required.");
          return;
        }

        if (!companyName) {
          showError("Company name is required.");
          return;
        }

        if (!inviteCode || !inviteCode.toUpperCase().startsWith("BETA-")) {
          showError("Enter your invite code. Format: BETA-PROJ-XXXX");
          return;
        }

        const submitButton = form.querySelector("button[type=submit]");
        const submitLabel = submitButton?.querySelector("[data-role=label]");
        submitButton.disabled = true;
        if (submitLabel) submitLabel.textContent = "Creating account\u2026";

        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS);

        try {
          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, email, password, companyName, inviteCode }),
            signal: controller.signal,
          });

          let data;
          try {
            data = await response.json();
          } catch {
            showError(
              response.ok
                ? "Unexpected server response. Please try again."
                : `Server error (${response.status}). Please try again.`
            );
            return;
          }

          if (!response.ok) {
            showError(data.error || "Account creation failed.");
            return;
          }

          if (data.signInFailed) {
            showError("Account created. Sign in to continue.");
            mode = "signin";
            render();
            const emailInput = container.querySelector('input[type="email"]');
            if (emailInput) emailInput.value = email;
            return;
          }

          if (data.user && !data.session) {
            pendingEmail = email;
            mode = "signup-check-email";
            render();
            return;
          }

          if (!data.user || !data.session) {
            showError("Unexpected response from server. Please try again.");
            return;
          }

          onboardingStore.setAuth(data.session?.access_token, data.user, data.projectId);
          setCurrentView("onboarding");
        } catch (err) {
          if (err.name === "AbortError") {
            showError("Request timed out. Check your connection and try again.");
          } else {
            showError("Network error \u2014 please try again.");
          }
        } finally {
          clearTimeout(timer);
          submitButton.disabled = false;
          if (submitLabel) submitLabel.textContent = "Create account";
        }

        return;
      }

      const submitButton = form.querySelector("button[type=submit]");
      const submitLabel = submitButton?.querySelector("[data-role=label]");
      submitButton.disabled = true;
      if (submitLabel) submitLabel.textContent = "Signing in\u2026";

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS);

      try {
        const response = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
          signal: controller.signal,
        });

        let data;
        try {
          data = await response.json();
        } catch {
          showError(
            response.ok
              ? "Unexpected server response. Please try again."
              : `Server error (${response.status}). Please try again.`
          );
          return;
        }

        if (!response.ok) {
          showError(data.error || "Sign in failed.");
          return;
        }

        if (!data.user || !data.session) {
          showError("Unexpected response from server. Please try again.");
          return;
        }

        const projectId = data.projects && data.projects.length > 0
          ? data.projects[0].id
          : null;
        onboardingStore.setAuth(data.session?.access_token, data.user, projectId);

        if (projectId) {
          writeStoredProjectId(projectId);
          setCurrentView("dashboard");
        } else {
          setCurrentView("onboarding");
        }
      } catch (err) {
        if (err.name === "AbortError") {
          showError("Request timed out. Check your connection and try again.");
        } else {
          showError("Network error \u2014 please try again.");
        }
      } finally {
        clearTimeout(timer);
        submitButton.disabled = false;
        if (submitLabel) submitLabel.textContent = "Sign in";
      }
    }

    errorEl = el("div", {
      className: "auth-error",
      style: `${INLINE_ERROR_STYLE} display: none;`,
    }, "");

    const fields = isCreateMode
      ? [
          renderField({
            id: "auth-full-name",
            label: "Full name",
            type: "text",
            name: "fullName",
            placeholder: "Jane Smith",
            autocomplete: "name",
          }),
          renderField({
            id: "auth-email",
            label: "Email",
            type: "email",
            name: "email",
            placeholder: "you@company.com",
            autocomplete: "email",
            mono: true,
          }),
          renderField({
            id: "auth-company-name",
            label: "Company name",
            type: "text",
            name: "companyName",
            placeholder: "Acme Ltd",
            autocomplete: "organization",
          }),
          renderField({
            id: "auth-invite-code",
            label: "Invite code",
            type: "text",
            name: "inviteCode",
            placeholder: "BETA-PROJ-XXXX",
            autocomplete: "off",
            mono: true,
            hint: "No code? Email hello@projecterp.co.za",
          }),
          renderField({
            id: "auth-password",
            label: "Password",
            type: "password",
            name: "password",
            placeholder: "At least 8 characters",
            autocomplete: "new-password",
          }),
        ]
      : [
          renderField({
            id: "auth-email",
            label: "Email",
            type: "email",
            name: "email",
            placeholder: "you@company.com",
            autocomplete: "email",
            mono: true,
          }),
          renderField({
            id: "auth-password",
            label: "Password",
            type: "password",
            name: "password",
            placeholder: "Your password",
            autocomplete: "current-password",
          }),
        ];

    const submitLabel = el("span", { "data-role": "label", text: isCreateMode ? "Create account" : "Sign in" });
    const submit = el("button", {
      className: "auth-submit-btn",
      type: "submit",
      style: PILL_PRIMARY_FULL_STYLE,
    }, [submitLabel, renderChevron(16)]);

    const belowPrimaryLink = isCreateMode
      ? el("button", {
          type: "button",
          style: TEXT_LINK_STYLE,
          onclick: () => { mode = "signin"; render(); },
        }, "Already have an account?")
      : el("button", {
          type: "button",
          style: TEXT_LINK_STYLE,
          onclick: () => setCurrentView("reset-password"),
        }, "Forgot your password?");

    const form = el("form", {
      className: "auth-form",
      style: FORM_CARD_STYLE,
      onsubmit: handleSubmit,
      noValidate: true,
    }, [
      ...fields,
      errorEl,
      submit,
      belowPrimaryLink,
    ]);

    const headline = isCreateMode
      ? el("h1", { style: HEADLINE_STYLE }, [
          el("span", { text: "Hello. " }),
          el("span", { style: HEADLINE_MUTED_SPAN_STYLE, text: "Let\u2019s get your Odoo " }),
          el("span", { style: HEADLINE_ACCENT_SPAN_STYLE, text: "implementation" }),
          el("span", { style: HEADLINE_MUTED_SPAN_STYLE, text: " underway." }),
        ])
      : el("h1", { style: HEADLINE_STYLE }, [
          el("span", { text: "Welcome " }),
          el("span", { style: HEADLINE_ACCENT_SPAN_STYLE, text: "back" }),
          el("span", { text: "." }),
          el("span", { style: HEADLINE_MUTED_SPAN_STYLE, text: " Let\u2019s pick up where you left off." }),
        ]);

    const lede = el("p", { style: LEDE_STYLE },
      isCreateMode
        ? "Takes about two minutes. You\u2019ll need your Odoo URL and database name handy, but we\u2019ll walk you through it."
        : "No password resets, no magic links this session \u2014 just your email and the password you set."
    );

    const heroBlock = el("div", { style: HERO_BLOCK_STYLE }, [
      renderEyebrow(isCreateMode ? "Create account" : "Sign in"),
      headline,
      lede,
    ]);

    const togglePrompt = isCreateMode ? "Already have one? " : "New here? ";
    const toggleLink = el("button", {
      type: "button",
      style: TOGGLE_INLINE_LINK_STYLE,
      onclick: () => { mode = isCreateMode ? "signin" : "create"; render(); },
    }, isCreateMode ? "Sign in" : "Create an account");

    const toggleFooter = el("p", { style: TOGGLE_FOOTER_STYLE }, [togglePrompt, toggleLink]);

    const column = el("div", { style: COLUMN_STYLE }, [
      renderBrandMark(navigateHome),
      heroBlock,
      form,
      toggleFooter,
    ]);

    container.append(column);
  }

  function renderCheckEmail() {
    async function handleResend() {
      if (!pendingEmail) return;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS);
      resendBtn.disabled = true;
      try {
        await fetch("/api/auth/resend-confirmation", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: pendingEmail }),
          signal: controller.signal,
        });
      } catch {
        // Silent — confirmation send errors handled server-side.
      } finally {
        clearTimeout(timer);
        resendBtn.disabled = false;
      }
    }

    const resendBtn = el("button", {
      type: "button",
      style: PILL_SECONDARY_FULL_STYLE,
      onclick: handleResend,
    }, [el("span", { text: "Resend email" })]);

    const successCard = el("div", { style: SUCCESS_CARD_STYLE }, [
      el("span", { style: SUCCESS_DOT_STYLE }),
      el("h2", { style: SUCCESS_TITLE_STYLE }, "Check your email"),
      el("p", { style: SUCCESS_BODY_STYLE },
        `We sent a confirmation link to ${pendingEmail}. Click it and come right back.`
      ),
      el("p", { style: SUCCESS_EMAIL_STYLE }, pendingEmail),
      resendBtn,
      el("button", {
        type: "button",
        style: TEXT_LINK_STYLE,
        onclick: () => { mode = "signin"; render(); },
      }, "Back to sign in"),
    ]);

    const column = el("div", { style: COLUMN_STYLE }, [
      renderBrandMark(navigateHome),
      successCard,
    ]);

    container.append(column);
  }

  render();

  const originalRemove = container.remove;
  container.remove = function () {
    if (container._cleanupPopstate) {
      window.removeEventListener("popstate", container._cleanupPopstate);
    }
    return originalRemove.call(this);
  };

  return container;
}
