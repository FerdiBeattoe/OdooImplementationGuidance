// ---------------------------------------------------------------------------
// Auth Screen — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Two-mode screen: "Create account" and "Sign in"
// Redesigned as a split-screen workspace while preserving auth behavior.
// ---------------------------------------------------------------------------

import { el } from "../lib/dom.js";
import { onboardingStore } from "../state/onboarding-store.js";
import { setCurrentView } from "../state/app-store.js";
import { renderAppNav } from "../components/app-nav.js";

function renderField({ id, label, type, name, placeholder, autocomplete }) {
  return el("div", { className: "auth-field" }, [
    el("label", { className: "auth-label", htmlFor: id }, label),
    el("input", {
      className: "auth-input",
      type,
      id,
      name,
      placeholder,
      autocomplete,
      required: true,
    }),
  ]);
}

function renderProofStat(value, label) {
  return el("div", { className: "auth-proof-stat" }, [
    el("strong", { className: "auth-proof-stat__value" }, value),
    el("span", { className: "auth-proof-stat__label" }, label),
  ]);
}

export function renderAuthScreen({ onBack } = {}) {
  let mode = "signin";

  const container = el("div", { className: "auth-page" });

  function navigateHome() {
    if (onBack) {
      onBack();
      return;
    }
    setCurrentView("home");
  }

  function render() {
    container.innerHTML = "";

    const isSignup = mode === "signup";

    let errorEl = null;

    function showError(msg) {
      if (errorEl) {
        errorEl.textContent = msg;
        errorEl.style.display = msg ? "block" : "none";
      }
    }

    async function handleSubmit(e) {
      e.preventDefault();

      const form = e.target;
      const email = (form.elements.email?.value || "").trim();
      const password = form.elements.password?.value || "";

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showError("Please enter a valid email address.");
        return;
      }
      if (password.length < 8) {
        showError("Password must be at least 8 characters.");
        return;
      }

      if (isSignup) {
        const fullName = (form.elements.fullName?.value || "").trim();
        const companyName = (form.elements.companyName?.value || "").trim();
        if (!fullName) { showError("Full name is required."); return; }
        if (!companyName) { showError("Company name is required."); return; }

        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true;
        btn.textContent = "Creating account…";

        try {
          const res = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, email, password, companyName }),
          });
          const data = await res.json();
          if (!res.ok) {
            showError(data.error || "Account creation failed.");
            btn.disabled = false;
            btn.textContent = "Create account →";
            return;
          }
          onboardingStore.setAuth(data.session?.access_token, data.user, data.projectId);
          setCurrentView("onboarding");
        } catch {
          showError("Network error — please try again.");
          btn.disabled = false;
          btn.textContent = "Create account →";
        }
      } else {
        const btn = form.querySelector("button[type=submit]");
        btn.disabled = true;
        btn.textContent = "Signing in…";

        try {
          const res = await fetch("/api/auth/signin", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
          });
          const data = await res.json();
          if (!res.ok) {
            showError(data.error || "Sign in failed.");
            btn.disabled = false;
            btn.textContent = "Sign in →";
            return;
          }
          const projectId = data.projects && data.projects.length > 0
            ? data.projects[0].id
            : null;
          onboardingStore.setAuth(data.session?.access_token, data.user, projectId);
          setCurrentView("onboarding");
        } catch {
          showError("Network error — please try again.");
          btn.disabled = false;
          btn.textContent = "Sign in →";
        }
      }
    }

    const fields = isSignup
      ? [
          renderField({
            id: "auth-fullName",
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
          }),
          renderField({
            id: "auth-companyName",
            label: "Company name",
            type: "text",
            name: "companyName",
            placeholder: "Acme Ltd",
            autocomplete: "organization",
          }),
          renderField({
            id: "auth-password",
            label: "Password",
            type: "password",
            name: "password",
            placeholder: "Min 8 characters",
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

    errorEl = el("p", { className: "auth-error", style: "display:none" }, "");

    const form = el("form", { className: "auth-form", onsubmit: handleSubmit }, [
      ...fields,
      errorEl,
      el("button", { className: "auth-submit-btn", type: "submit" },
        isSignup ? "Create account →" : "Sign in →"
      ),
    ]);

    const togglePrompt = isSignup
      ? "Already have an account? "
      : "No account yet? ";
    const toggleLink = el("button", {
      className: "auth-toggle-link",
      type: "button",
      onclick: () => {
        mode = isSignup ? "signin" : "signup";
        render();
      },
    }, isSignup ? "Sign in" : "Create account");

    container.append(
      el("div", { className: "auth-shell" }, [
        el("section", { className: "auth-shell__left" }, [
          el("div", { className: "auth-shell__nav" }, [
            renderAppNav({
              setCurrentView: () => navigateHome(),
              showBackLink: false,
            }),
          ]),
          el("div", { className: "auth-shell__left-main" }, [
            el("div", { className: "auth-card" }, [
              el("div", { className: "auth-mode-toggle", role: "tablist", "aria-label": "Authentication mode" }, [
                el("button", {
                  className: isSignup ? "auth-mode-tab" : "auth-mode-tab auth-mode-tab--active",
                  type: "button",
                  role: "tab",
                  "aria-selected": String(!isSignup),
                  onclick: () => {
                    if (mode !== "signin") {
                      mode = "signin";
                      render();
                    }
                  },
                }, "Sign in"),
                el("button", {
                  className: isSignup ? "auth-mode-tab auth-mode-tab--active" : "auth-mode-tab",
                  type: "button",
                  role: "tab",
                  "aria-selected": String(isSignup),
                  onclick: () => {
                    if (mode !== "signup") {
                      mode = "signup";
                      render();
                    }
                  },
                }, "Create account"),
              ]),
              el("div", { className: "auth-card__intro" }, [
                el("h1", { className: "auth-heading" },
                  isSignup ? "Start your implementation" : "Welcome back"
                ),
                el("p", { className: "auth-sub" },
                  isSignup
                    ? "Create your Project Odoo account."
                    : "Sign in to continue your implementation."
                ),
              ]),
              form,
              el("p", { className: "auth-toggle" }, [togglePrompt, toggleLink]),
            ]),
          ]),
          el("div", { className: "auth-shell__footer" }, [
            el("button", {
              className: "auth-back-link",
              type: "button",
              onclick: () => navigateHome(),
            }, "← Back to projecterp.com"),
          ]),
        ]),
        el("aside", { className: "auth-shell__right" }, [
          el("section", { className: "auth-panel" }, [
            el("p", { className: "auth-panel__tag" }, "Latest from the blog"),
            el("h2", { className: "auth-panel__heading" }, "The right order to configure Odoo 19 — and why sequence matters"),
            el("p", { className: "auth-panel__copy" }, "Most implementations configure modules before master data is set. Here is the sequence that prevents downstream data corruption."),
            el("button", {
              className: "auth-panel__link",
              type: "button",
              onclick: () => setCurrentView("blog"),
            }, "Read article →"),
          ]),
          el("section", { className: "auth-panel" }, [
            el("p", { className: "auth-panel__tag" }, "Built on real data"),
            el("div", { className: "auth-proof-stats" }, [
              renderProofStat("124", "checkpoints"),
              renderProofStat("23", "domains"),
              renderProofStat("2,834", "tests passing"),
            ]),
            el("p", { className: "auth-panel__copy" }, "Every checkpoint verified against a live Odoo 19 instance."),
          ]),
        ]),
      ])
    );
  }

  render();
  return container;
}
