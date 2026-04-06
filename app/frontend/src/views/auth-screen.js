import { el } from "../lib/dom.js";
import { onboardingStore } from "../state/onboarding-store.js";
import { setCurrentView } from "../state/app-store.js";
import { writeStoredProjectId } from "./landing-page.js";

const AUTH_FETCH_TIMEOUT_MS = 15_000;

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

    // Browser back support — remove previous listener before adding new one
    if (container._cleanupPopstate) {
      window.removeEventListener("popstate", container._cleanupPopstate);
    }
    const handlePopstate = () => setCurrentView("home");
    window.addEventListener("popstate", handlePopstate);
    container._cleanupPopstate = handlePopstate;

    if (mode === "forgot") {
      renderForgotPassword(container);
      return;
    }

    const isCreateMode = mode === "create";
    let errorEl = null;

    function showError(message) {
      if (!errorEl) return;
      errorEl.textContent = message;
      errorEl.style.display = message ? "block" : "none";
    }

    async function handleSubmit(event) {
      event.preventDefault();

      const form = event.target;
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

      // Clear previous user state before any API call
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
          showError("Please enter your invite code. Format: BETA-PROJ-XXXX");
          return;
        }

        const submitButton = form.querySelector("button[type=submit]");
        submitButton.disabled = true;
        submitButton.textContent = "Creating account...";

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
            showError("Account created successfully. Please sign in to continue.");
            mode = "signin";
            render();
            const emailInput = container.querySelector('input[type="email"]');
            if (emailInput) emailInput.value = email;
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
            showError("Request timed out. Please check your connection and try again.");
          } else {
            showError("Network error \u2014 please try again.");
          }
        } finally {
          clearTimeout(timer);
          submitButton.disabled = false;
          submitButton.textContent = "Create account \u2192";
        }

        return;
      }

      const submitButton = form.querySelector("button[type=submit]");
      submitButton.disabled = true;
      submitButton.textContent = "Signing in...";

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

        // Returning user with existing project → dashboard; new user → onboarding
        if (projectId) {
          writeStoredProjectId(projectId);
          setCurrentView("dashboard");
        } else {
          setCurrentView("onboarding");
        }
      } catch (err) {
        if (err.name === "AbortError") {
          showError("Request timed out. Please check your connection and try again.");
        } else {
          showError("Network error \u2014 please try again.");
        }
      } finally {
        clearTimeout(timer);
        submitButton.disabled = false;
        submitButton.textContent = "Sign in \u2192";
      }
    }

    const fields = isCreateMode
      ? [
          renderField({ id: "auth-full-name", label: "Full name", type: "text", name: "fullName", placeholder: "Jane Smith", autocomplete: "name" }),
          renderField({ id: "auth-email", label: "Email", type: "email", name: "email", placeholder: "you@company.com", autocomplete: "email" }),
          renderField({ id: "auth-company-name", label: "Company name", type: "text", name: "companyName", placeholder: "Acme Ltd", autocomplete: "organization" }),
          renderField({ id: "auth-invite-code", label: "Invite code", type: "text", name: "inviteCode", placeholder: "BETA-PROJ-XXXX", autocomplete: "off" }),
          el("p", { style: "font-size:11px; color:#94a3b8; margin-top:-10px; margin-bottom:14px;" }, "Don\u2019t have a code? Email hello@projecterp.co.za"),
          renderField({ id: "auth-password", label: "Password", type: "password", name: "password", placeholder: "Min 8 characters", autocomplete: "new-password" }),
        ]
      : [
          renderField({ id: "auth-email", label: "Email", type: "email", name: "email", placeholder: "you@company.com", autocomplete: "email" }),
          renderField({ id: "auth-password", label: "Password", type: "password", name: "password", placeholder: "Your password", autocomplete: "current-password" }),
          el("button", {
            type: "button",
            style: "background:none; border:none; padding:0; font-size:12px; color:#94a3b8; cursor:pointer; text-align:right; width:100%; margin-bottom:16px;",
            onclick: () => { mode = "forgot"; render(); },
          }, "Forgot password?"),
        ];

    errorEl = el("div", { className: "auth-error", style: "display:none" }, "");

    const form = el("form", { className: "auth-form", onsubmit: handleSubmit }, [
      ...fields,
      el("button", { className: "auth-submit-btn", type: "submit" }, isCreateMode ? "Create account \u2192" : "Sign in \u2192"),
      errorEl,
    ]);

    const togglePrompt = isCreateMode ? "Already have an account? " : "No account yet? ";
    const toggleLink = el("span", {
      style: "color:#f59e0b; cursor:pointer; font-weight:500;",
      onclick: () => {
        mode = isCreateMode ? "signin" : "create";
        render();
      },
    }, isCreateMode ? "Sign in" : "Create account");

    const leftPanel = el("section", { className: "auth-left" }, [
      el("img", {
        src: "/assets/logo-project-odoo.png",
        alt: "Project Odoo",
        className: "auth-logo",
        onclick: () => navigateHome(),
      }),
      el("div", { className: "auth-main" }, [
        el("div", { className: "auth-form-shell" }, [
          el("div", { className: "auth-tabs", role: "tablist", "aria-label": "Authentication mode" }, [
            el("button", {
              className: isCreateMode ? "auth-tab" : "auth-tab auth-tab--active",
              type: "button",
              role: "tab",
              "aria-selected": String(!isCreateMode),
              onclick: () => { if (mode !== "signin") { mode = "signin"; render(); } },
            }, "Sign in"),
            el("button", {
              className: isCreateMode ? "auth-tab auth-tab--active" : "auth-tab",
              type: "button",
              role: "tab",
              "aria-selected": String(isCreateMode),
              onclick: () => { if (mode !== "create") { mode = "create"; render(); } },
            }, "Create account"),
          ]),
          el("h2", { className: "auth-heading" }, isCreateMode ? "Start your implementation" : "Welcome back"),
          el("p", { className: "auth-sub" }, isCreateMode ? "Create your Project Odoo account." : "Sign in to continue your implementation."),
          form,
          el("p", { className: "auth-toggle" }, [togglePrompt, toggleLink]),
        ]),
      ]),
      el("button", {
        className: "auth-back-link",
        type: "button",
        onclick: () => navigateHome(),
      }, "\u2190 Back to home"),
    ]);

    const cardStyle = "background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:20px 24px; flex:1; min-height:0; overflow:hidden; display:flex; flex-direction:column;";
    const tagStyle = "display:inline-block; font-size:10px; letter-spacing:0.1em; font-weight:600; text-transform:uppercase; color:#92400e; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:6px; padding:3px 10px; margin-bottom:12px; align-self:flex-start; flex-shrink:0;";
    const headingStyle = "font-size:14px; font-weight:600; color:#0c1a30; line-height:1.3; margin:0 0 6px; flex-shrink:0;";
    const bodyStyle = "font-size:12px; color:#64748b; line-height:1.5; margin:0; flex:1; overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical;";
    const btnStyle = "flex-shrink:0; margin-top:10px; align-self:flex-start; font-size:12px; font-weight:600; color:#92400e; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:6px; padding:6px 14px; cursor:pointer;";

    const rightPanel = el("aside", { className: "auth-right" }, [
      el("div", { style: cardStyle }, [
        el("span", { style: tagStyle }, "IMPLEMENTATION GUIDE"),
        el("h3", { style: headingStyle }, "The right order to configure Odoo 19 \u2014 and why sequence matters"),
        el("p", { style: bodyStyle }, "Most Odoo implementations configure modules in the wrong order. Here is the sequence that prevents downstream data corruption."),
        el("button", {
          type: "button",
          style: btnStyle,
          onclick: () => setCurrentView("blog"),
        }, "Read more \u2192"),
      ]),
      el("div", { style: cardStyle }, [
        el("span", { style: tagStyle }, "PRODUCT"),
        el("h3", { style: headingStyle }, "What 124 checkpoints taught us about Odoo configuration dependencies"),
        el("p", { style: bodyStyle }, "After verifying 124 checkpoints against a live Odoo 19 instance, patterns emerged about which settings break the most downstream modules."),
        el("button", {
          type: "button",
          style: btnStyle,
          onclick: () => setCurrentView("blog"),
        }, "Read more \u2192"),
      ]),
    ]);

    container.append(
      el("div", { className: "auth-layout" }, [
        leftPanel,
        rightPanel,
      ])
    );
  }

  function renderForgotPassword(target) {
    target.innerHTML = "";

    let messageEl = null;
    let errorEl = null;

    function showMessage(msg) {
      if (messageEl) { messageEl.textContent = msg; messageEl.style.display = msg ? "block" : "none"; }
      if (errorEl) { errorEl.style.display = "none"; }
    }

    function showResetError(msg) {
      if (errorEl) { errorEl.textContent = msg; errorEl.style.display = msg ? "block" : "none"; }
      if (messageEl) { messageEl.style.display = "none"; }
    }

    async function handleReset(event) {
      event.preventDefault();
      const form = event.target;
      const email = (form.elements.resetEmail?.value || "").trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showResetError("Please enter a valid email address.");
        return;
      }

      const submitBtn = form.querySelector("button[type=submit]");
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), AUTH_FETCH_TIMEOUT_MS);

      try {
        const response = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          signal: controller.signal,
        });

        let data;
        try {
          data = await response.json();
        } catch {
          showResetError(
            response.ok
              ? "Unexpected server response. Please try again."
              : `Server error (${response.status}). Please try again.`
          );
          return;
        }

        if (!response.ok) {
          showResetError(data.error || "Failed to send reset email.");
          return;
        }

        showMessage("Check your email for a reset link.");
      } catch (err) {
        if (err.name === "AbortError") {
          showResetError("Request timed out. Please check your connection and try again.");
        } else {
          showResetError("Network error \u2014 please try again.");
        }
      } finally {
        clearTimeout(timer);
        submitBtn.disabled = false;
        submitBtn.textContent = "Send reset link \u2192";
      }
    }

    errorEl = el("div", { className: "auth-error", style: "display:none" }, "");
    messageEl = el("div", { className: "auth-success", style: "display:none; color:#16a34a; font-size:13px; margin-top:8px;" }, "");

    const resetForm = el("form", { className: "auth-form", onsubmit: handleReset }, [
      renderField({ id: "auth-reset-email", label: "Email", type: "email", name: "resetEmail", placeholder: "you@company.com", autocomplete: "email" }),
      el("button", { className: "auth-submit-btn", type: "submit" }, "Send reset link \u2192"),
      errorEl,
      messageEl,
    ]);

    const leftPanel = el("section", { className: "auth-left" }, [
      el("img", {
        src: "/assets/logo-project-odoo.png",
        alt: "Project Odoo",
        className: "auth-logo",
        onclick: () => navigateHome(),
      }),
      el("div", { className: "auth-main" }, [
        el("div", { className: "auth-form-shell" }, [
          el("h2", { className: "auth-heading" }, "Reset your password"),
          el("p", { className: "auth-sub" }, "Enter your email and we\u2019ll send you a reset link."),
          resetForm,
          el("button", {
            type: "button",
            style: "background:none; border:none; padding:0; font-size:13px; color:#f59e0b; cursor:pointer; font-weight:500; margin-top:16px;",
            onclick: () => { mode = "signin"; render(); },
          }, "\u2190 Back to sign in"),
        ]),
      ]),
      el("button", {
        className: "auth-back-link",
        type: "button",
        onclick: () => navigateHome(),
      }, "\u2190 Back to home"),
    ]);

    const cardStyle = "background:#ffffff; border:1px solid #e2e8f0; border-radius:10px; padding:20px 24px; flex:1; min-height:0; overflow:hidden; display:flex; flex-direction:column;";
    const tagStyle = "display:inline-block; font-size:10px; letter-spacing:0.1em; font-weight:600; text-transform:uppercase; color:#92400e; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:6px; padding:3px 10px; margin-bottom:12px; align-self:flex-start; flex-shrink:0;";
    const headingStyle = "font-size:14px; font-weight:600; color:#0c1a30; line-height:1.3; margin:0 0 6px; flex-shrink:0;";
    const bodyStyle = "font-size:12px; color:#64748b; line-height:1.5; margin:0; flex:1; overflow:hidden; display:-webkit-box; -webkit-line-clamp:3; -webkit-box-orient:vertical;";
    const btnStyle = "flex-shrink:0; margin-top:10px; align-self:flex-start; font-size:12px; font-weight:600; color:#92400e; background:rgba(245,158,11,0.08); border:1px solid rgba(245,158,11,0.2); border-radius:6px; padding:6px 14px; cursor:pointer;";

    const rightPanel = el("aside", { className: "auth-right" }, [
      el("div", { style: cardStyle }, [
        el("span", { style: tagStyle }, "IMPLEMENTATION GUIDE"),
        el("h3", { style: headingStyle }, "The right order to configure Odoo 19 \u2014 and why sequence matters"),
        el("p", { style: bodyStyle }, "Most Odoo implementations configure modules in the wrong order. Here is the sequence that prevents downstream data corruption."),
        el("button", { type: "button", style: btnStyle, onclick: () => setCurrentView("blog") }, "Read more \u2192"),
      ]),
      el("div", { style: cardStyle }, [
        el("span", { style: tagStyle }, "PRODUCT"),
        el("h3", { style: headingStyle }, "What 124 checkpoints taught us about Odoo configuration dependencies"),
        el("p", { style: bodyStyle }, "After verifying 124 checkpoints against a live Odoo 19 instance, patterns emerged about which settings break the most downstream modules."),
        el("button", { type: "button", style: btnStyle, onclick: () => setCurrentView("blog") }, "Read more \u2192"),
      ]),
    ]);

    target.append(el("div", { className: "auth-layout" }, [leftPanel, rightPanel]));
  }

  render();

  // Cleanup reference for popstate listener removal
  const originalRemove = container.remove;
  container.remove = function () {
    if (container._cleanupPopstate) {
      window.removeEventListener("popstate", container._cleanupPopstate);
    }
    return originalRemove.call(this);
  };

  return container;
}
