// ---------------------------------------------------------------------------
// Auth Screen — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Two-mode screen: "Create account" and "Sign in"
// Design matches landing page: #0c1a30 bg, #f59e0b accent, Fraunces/DM Sans
// ---------------------------------------------------------------------------

import { el } from "../lib/dom.js";
import { onboardingStore } from "../state/onboarding-store.js";
import { setCurrentView } from "../state/app-store.js";

// ---------------------------------------------------------------------------
// renderAuthScreen
//
// @param {object} props
// @param {Function} props.onBack — navigates back to landing page
// ---------------------------------------------------------------------------

export function renderAuthScreen({ onBack } = {}) {
  let mode = "signin"; // "signin" | "signup"

  const container = el("div", { className: "auth-page" });

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

      // Client-side validation
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
            btn.textContent = "Create account \u2192";
            return;
          }
          onboardingStore.setAuth(data.session?.access_token, data.user, data.projectId);
          setCurrentView("onboarding");
        } catch {
          showError("Network error — please try again.");
          btn.disabled = false;
          btn.textContent = "Create account \u2192";
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
            btn.textContent = "Sign in \u2192";
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
          btn.textContent = "Sign in \u2192";
        }
      }
    }

    const fields = [];

    if (isSignup) {
      fields.push(
        el("div", { className: "auth-field" }, [
          el("label", { className: "auth-label", htmlFor: "auth-fullName" }, "Full name"),
          el("input", { className: "auth-input", type: "text", id: "auth-fullName", name: "fullName",
            placeholder: "Jane Smith", autocomplete: "name", required: true }),
        ])
      );
    }

    fields.push(
      el("div", { className: "auth-field" }, [
        el("label", { className: "auth-label", htmlFor: "auth-email" }, "Email"),
        el("input", { className: "auth-input", type: "email", id: "auth-email", name: "email",
          placeholder: "you@company.com", autocomplete: "email", required: true }),
      ]),
      el("div", { className: "auth-field" }, [
        el("label", { className: "auth-label", htmlFor: "auth-password" }, "Password"),
        el("input", { className: "auth-input", type: "password", id: "auth-password", name: "password",
          placeholder: isSignup ? "Min 8 characters" : "Your password",
          autocomplete: isSignup ? "new-password" : "current-password", required: true }),
      ])
    );

    if (isSignup) {
      fields.push(
        el("div", { className: "auth-field" }, [
          el("label", { className: "auth-label", htmlFor: "auth-companyName" }, "Company name"),
          el("input", { className: "auth-input", type: "text", id: "auth-companyName", name: "companyName",
            placeholder: "Acme Ltd", autocomplete: "organization", required: true }),
        ])
      );
    }

    errorEl = el("p", { className: "auth-error", style: "display:none" }, "");

    const form = el("form", { className: "auth-form", onsubmit: handleSubmit }, [
      ...fields,
      errorEl,
      el("button", { className: "auth-submit-btn", type: "submit" },
        isSignup ? "Create account \u2192" : "Sign in \u2192"
      ),
    ]);

    const toggleText = isSignup
      ? "Already have an account? "
      : "No account yet? ";
    const toggleLink = el("button", {
      className: "auth-toggle-link",
      type: "button",
      onclick: () => { mode = isSignup ? "signin" : "signup"; render(); },
    }, isSignup ? "Sign in" : "Create account");

    const card = el("div", { className: "auth-card" }, [
      el("h1", { className: "auth-heading" },
        isSignup ? "Create your account" : "Welcome back"
      ),
      el("p", { className: "auth-sub" },
        isSignup
          ? "Set up your implementation workspace."
          : "Sign in to continue your implementation."
      ),
      form,
      el("p", { className: "auth-toggle" }, [toggleText, toggleLink]),
    ]);

    const backLink = el("button", {
      className: "auth-back-link",
      type: "button",
      onclick: () => onBack && onBack(),
    }, "\u2190 Back to home");

    container.append(
      el("div", { className: "auth-page__inner" }, [
        backLink,
        card,
      ])
    );
  }

  render();
  return container;
}
