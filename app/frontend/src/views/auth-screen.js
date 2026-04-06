import { el } from "../lib/dom.js";
import { onboardingStore } from "../state/onboarding-store.js";
import { setCurrentView } from "../state/app-store.js";

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

function renderStat(value, label) {
  return el("div", { className: "auth-stat" }, [
    el("strong", { className: "auth-stat__value" }, value),
    el("span", { className: "auth-stat__label" }, label),
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

    // Browser back support
    window.history.pushState({ view: "auth" }, "", window.location.href);
    const handlePopstate = () => setCurrentView("home");
    window.addEventListener("popstate", handlePopstate);
    container._cleanupPopstate = handlePopstate;

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

        try {
          const response = await fetch("/api/auth/signup", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ fullName, email, password, companyName, inviteCode }),
          });
          const data = await response.json();

          if (!response.ok) {
            showError(data.error || "Account creation failed.");
            submitButton.disabled = false;
            submitButton.textContent = "Create account \u2192";
            return;
          }

          onboardingStore.setAuth(data.session?.access_token, data.user, data.projectId);
          setCurrentView("onboarding");
        } catch {
          showError("Network error - please try again.");
          submitButton.disabled = false;
          submitButton.textContent = "Create account \u2192";
        }

        return;
      }

      const submitButton = form.querySelector("button[type=submit]");
      submitButton.disabled = true;
      submitButton.textContent = "Signing in...";

      try {
        const response = await fetch("/api/auth/signin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (!response.ok) {
          showError(data.error || "Sign in failed.");
          submitButton.disabled = false;
          submitButton.textContent = "Sign in \u2192";
          return;
        }

        const projectId = data.projects && data.projects.length > 0
          ? data.projects[0].id
          : null;
        onboardingStore.setAuth(data.session?.access_token, data.user, projectId);
        setCurrentView("onboarding");
      } catch {
        showError("Network error - please try again.");
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

    const rightPanel = el("aside", { className: "auth-right" }, [
      el("section", { className: "auth-panel" }, [
        el("span", {
          className: "auth-panel__tag",
          style: "display:inline-block; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25); border-radius:6px; padding:3px 10px;",
        }, "IMPLEMENTATION GUIDE"),
        el("div", { className: "auth-media-placeholder" }, [
          /* Replace this div with:
             el("img", { src: "/assets/blog-hero.jpg",
             style: "width:100%;height:140px;object-fit:cover;border-radius:6px;" })
          */
          el("span", {}, "Image coming soon"),
        ]),
        el("h3", { className: "auth-panel__heading" }, "The right order to configure Odoo 19 \u2014 and why sequence matters"),
        el("p", { className: "auth-panel__copy", style: "flex:1;" }, "Most Odoo implementations configure modules in the wrong order. Here is the sequence that prevents downstream data corruption."),
        el("button", {
          className: "auth-panel__link",
          type: "button",
          style: "display:inline-block; font-size:12px; font-weight:600; color:#92400e; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25); border-radius:6px; padding:6px 14px;",
          onclick: () => setCurrentView("blog"),
        }, "Read more \u2192"),
      ]),
      el("section", { className: "auth-panel" }, [
        el("span", {
          className: "auth-panel__tag",
          style: "display:inline-block; background:rgba(245,158,11,0.1); border:1px solid rgba(245,158,11,0.25); border-radius:6px; padding:3px 10px;",
        }, "PRODUCT"),
        el("div", { className: "auth-stats-row" }, [
          renderStat("124", "checkpoints"),
          renderStat("23", "domains"),
          renderStat("2,834", "tests passing"),
        ]),
        el("p", { className: "auth-panel__copy auth-panel__copy--bottom" }, "Every checkpoint verified against a live Odoo 19 instance."),
      ]),
    ]);

    container.append(
      el("div", { className: "auth-layout" }, [
        leftPanel,
        rightPanel,
      ])
    );
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
