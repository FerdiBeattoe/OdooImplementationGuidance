import { clearNode, el } from "../lib/dom.js";

const UPDATE_PASSWORD_TIMEOUT_MS = 15_000;

function renderPasswordField({ id, label, name, placeholder, marginBottom }) {
  return el("div", { style: `display:flex; flex-direction:column; margin-bottom:${marginBottom};` }, [
    el("label", {
      className: "auth-label",
      htmlFor: id,
      style: "margin-bottom:5px;"
    }, label),
    el("input", {
      className: "auth-input",
      type: "password",
      id,
      name,
      placeholder,
      autocomplete: "new-password",
      required: true,
      style: "width:100%; padding:9px 12px; border:1px solid #e2e8f0; border-radius:6px; font-size:14px; box-sizing:border-box;"
    }),
  ]);
}

export function renderResetPasswordScreen({ setCurrentView }) {
  const container = el("div", { className: "auth-page" });
  let passwordUpdated = false;
  let errorEl = null;

  function showError(message) {
    if (!errorEl) {
      return;
    }

    errorEl.textContent = message || "";
  }

  async function handleSubmit(event) {
    event.preventDefault();

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
      showError("Reset link expired. Please request a new one.");
      return;
    }

    showError("");

    const submitButton = form.querySelector("button[type=submit]");
    const originalLabel = submitButton?.textContent || "Set new password";

    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Setting password...";
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), UPDATE_PASSWORD_TIMEOUT_MS);

    try {
      const response = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password, accessToken }),
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
        showError(data.error || "Unable to update password.");
        return;
      }

      sessionStorage.removeItem("reset_access_token");
      passwordUpdated = true;
      render();
    } catch (error) {
      if (error.name === "AbortError") {
        showError("Request timed out. Please check your connection and try again.");
      } else {
        showError("Network error - please try again.");
      }
    } finally {
      clearTimeout(timer);
      if (submitButton && submitButton.isConnected) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  }

  function renderCardContent() {
    const logo = el("img", {
      src: "/assets/logo-project-odoo.png",
      alt: "Project Odoo",
      style: "width:100%; max-width:100%; height:auto; object-fit:contain; display:block; margin-bottom:32px; padding:0 16px; box-sizing:border-box;"
    });

    if (passwordUpdated) {
      return [
        logo,
        el("h2", {
          className: "auth-heading",
          style: "margin:0 0 4px; color:#0c1a30; font-size:20px; font-weight:600; line-height:1.2;"
        }, "Password updated"),
        el("p", {
          className: "auth-sub",
          style: "margin:0 0 24px; color:#64748b; font-size:13px; line-height:1.6;"
        }, "Your password has been changed. You can now sign in."),
        el("button", {
          className: "auth-submit-btn",
          type: "button",
          style: "width:100%;",
          onclick: () => setCurrentView("auth"),
        }, "Go to sign in"),
      ];
    }

    errorEl = el("div", {
      className: "auth-error",
      style: "color:#dc2626; font-size:13px; min-height:20px; margin-top:8px; line-height:1.5;"
    }, "");

    return [
      logo,
      el("h2", {
        className: "auth-heading",
        style: "margin:0 0 4px; color:#0c1a30; font-size:20px; font-weight:600; line-height:1.2;"
      }, "Set your new password"),
      el("p", {
        className: "auth-sub",
        style: "margin:0 0 24px; color:#64748b; font-size:13px; line-height:1.6;"
      }, "Enter a new password for your Project Odoo account."),
      el("form", { onsubmit: handleSubmit, style: "display:flex; flex-direction:column;" }, [
        renderPasswordField({
          id: "reset-password",
          label: "New password",
          name: "password",
          placeholder: "Min 8 characters",
          marginBottom: "14px"
        }),
        renderPasswordField({
          id: "reset-password-confirm",
          label: "Confirm password",
          name: "confirmPassword",
          placeholder: "Repeat your password",
          marginBottom: "24px"
        }),
        el("button", {
          className: "auth-submit-btn",
          type: "submit",
          style: "width:100%; margin-bottom:0;"
        }, "Set new password"),
        errorEl,
      ]),
    ];
  }

  function render() {
    clearNode(container);

    const card = el("div", {
      style: "background:#ffffff; border-radius:12px; padding:48px 40px; width:420px; max-width:90vw; box-shadow:0 24px 64px rgba(0,0,0,0.4); box-sizing:border-box;"
    }, renderCardContent());

    container.append(card);
  }

  render();
  return container;
}
