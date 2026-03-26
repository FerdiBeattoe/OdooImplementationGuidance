import { el } from "../lib/dom.js";
import { getState } from "../state/app-store.js";

export function renderConnectionWizardView({ onConnect, onSkip }) {
  const state = {
    step: 1,
    instanceType: "online",
    edition: "community",
    instanceUrl: "",
    database: "",
    username: "",
    password: "",
    isNewDatabase: false,
    testStatus: "idle",
    testError: null,
    canContinue: false
  };

  const container = el("div", {
    style: "min-height: 100vh; background: var(--ee-surface); display: flex; align-items: center; justify-content: center; padding: 24px;"
  });

  // Create persistent input references
  const inputs = {};

  render();
  return container;

  function render() {
    container.innerHTML = "";
    container.append(buildWizard());
  }

  function buildWizard() {
    return el("div", { style: "width: 100%; max-width: 520px;" }, [
      el("div", { style: "text-align: center; margin-bottom: 32px;" }, [
        el("div", { 
          style: "width: 48px; height: 48px; background: var(--ee-primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;"
        }, [
          el("span", { className: "material-symbols-outlined", style: "color: white; font-size: 24px;", text: "hub" })
        ]),
        el("h1", { style: "font-family: var(--ee-font-headline); font-size: 22px; font-weight: 700; color: var(--ee-on-surface);" }, "Connect to Odoo"),
        el("p", { style: "font-size: 14px; color: var(--ee-on-surface-variant); margin-top: 8px;" }, "ProjectOdoo — Odoo made easy")
      ]),

      // Step indicator
      el("div", { style: "display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 32px;" },
        [1, 2, 3].map(n => el("div", { style: "display: flex; align-items: center; gap: 8px;" }, [
          el("div", {
            style: `width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; ${
              n < state.step ? "background: var(--ee-secondary); color: white;" :
              n === state.step ? "background: var(--ee-primary); color: white;" :
              "background: var(--ee-surface-container); color: var(--ee-outline);"
            }`
          }, [n < state.step ? el("span", { className: "material-symbols-outlined", style: "font-size: 16px;", text: "check" }) : el("span", { text: String(n) })]),
          n < 3 ? el("div", { style: `width: 32px; height: 2px; background: ${n < state.step ? "var(--ee-primary)" : "var(--ee-surface-container-high)"};` }) : null
        ]))
      ),

      // Main card
      el("div", { style: "background: var(--ee-surface-container-low); box-shadow: var(--ee-shadow-lg);" }, 
        state.step === 1 ? buildStep1() : state.step === 2 ? buildStep2() : buildStep3()
      )
    ]);
  }

  function buildStep1() {
    const content = el("div", { style: "padding: 24px;" });

    // Title
    content.append(el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 8px;" }, "Step 1 of 3 — Instance Type"));
    content.append(el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 16px;" }, "How is your Odoo hosted?"));

    // Type options
    const types = [
      { id: "online", icon: "public", label: "Odoo Online", desc: "odoo.com hosted" },
      { id: "sh", icon: "cloud", label: "Odoo.sh", desc: "Managed cloud platform" },
      { id: "selfhost", icon: "dns", label: "Self-hosted", desc: "On-premise server" }
    ];

    types.forEach(t => {
      content.append(el("button", {
        style: `width: 100%; text-align: left; padding: 16px; margin-bottom: 8px; background: ${state.instanceType === t.id ? "var(--ee-primary-subtle)" : "var(--ee-surface-container)"}; border-left: 3px solid ${state.instanceType === t.id ? "var(--ee-primary)" : "transparent"}; cursor: pointer;`,
        onclick: () => {
          state.instanceType = t.id;
          state.instanceUrl = "";
          state.database = "";
          render();
        }
      }, [
        el("div", { style: "display: flex; align-items: center; gap: 12px;" }, [
          el("span", { className: "material-symbols-outlined", style: `font-size: 22px; color: ${state.instanceType === t.id ? "var(--ee-primary)" : "var(--ee-on-surface-variant)"};`, text: t.icon }),
          el("div", {}, [
            el("p", { style: "font-size: 14px; font-weight: 600; color: var(--ee-on-surface);" }, t.label),
            el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant);" }, t.desc)
          ])
        ])
      ]));
    });

    // Edition
    content.append(el("p", { style: "font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin: 16px 0 12px;" }, "Edition"));
    const editionRow = el("div", { style: "display: flex; gap: 12px;" });
    ["community", "enterprise"].forEach(ed => {
      editionRow.append(el("button", {
        style: `flex: 1; padding: 12px; ${state.edition === ed ? "background: var(--ee-primary); color: white;" : "background: var(--ee-surface-container); border: 1px solid var(--ee-outline-variant);"}`,
        onclick: () => { state.edition = ed; render(); }
      }, [
        el("p", { style: "font-size: 14px; font-weight: 600;" }, ed.charAt(0).toUpperCase() + ed.slice(1)),
        el("p", { style: "font-size: 11px; opacity: 0.8;" }, ed === "community" ? "Free, open-source" : "Paid subscription")
      ]));
    });
    content.append(editionRow);

    // URL Input (store reference)
    content.append(el("p", { style: "font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin: 16px 0 8px;" }, "Your Odoo Address"));
    
    let continueBtn = null;

    inputs.url = el("input", {
      type: "text",
      className: "ee-input",
      placeholder: "mycompany.odoo.com",
      value: state.instanceUrl,
      onInput: (e) => {
        let val = e.target.value.trim().toLowerCase();
        val = val.replace(/^https?:\/\//, "").replace(/\/.*$/, "");
        state.instanceUrl = val;

        // Update preview
        const preview = content.querySelector("#url-preview");
        if (preview) preview.textContent = val ? `https://${val}` : "https://yourcompany.odoo.com";

        // Update database
        const match = val.match(/^(?:www\.)?([^\.]+)/);
        const db = match ? match[1] : val;
        state.database = db;
        const dbPreview = content.querySelector("#db-preview");
        if (dbPreview) dbPreview.textContent = db || "yourcompany";

        // Enable/disable continue button reactively
        if (continueBtn) {
          continueBtn.disabled = val.length === 0;
          continueBtn.style.opacity = val.length === 0 ? "0.5" : "";
        }
      }
    });
    content.append(inputs.url);

    // Preview
    content.append(el("div", { style: "margin-top: 8px; padding: 10px 12px; background: var(--ee-surface-container);" }, [
      el("p", { style: "font-size: 12px; margin: 0;" }, [
        el("span", { style: "font-weight: 600;" }, "Connecting to: "),
        el("span", { id: "url-preview" }, state.instanceUrl ? `https://${state.instanceUrl}` : "https://yourcompany.odoo.com")
      ]),
      el("p", { style: "font-size: 12px; color: var(--ee-secondary); margin: 4px 0 0 0;" }, [
        el("span", { style: "font-weight: 600;" }, "Database: "),
        el("span", { id: "db-preview" }, state.database || "yourcompany")
      ])
    ]));

    // Continue — read state.instanceUrl directly, never the closed-over canContinue
    const initialCanContinue = state.instanceUrl.length > 0;
    continueBtn = el("button", {
      className: "ee-btn ee-btn--primary ee-btn--full",
      style: `margin-top: 24px; ${!initialCanContinue ? "opacity: 0.5;" : ""}`,
      disabled: !initialCanContinue,
      onclick: () => {
        if (inputs.url) {
          let val = inputs.url.value.trim().toLowerCase().replace(/^https?:\/\//, "").replace(/\/.*$/, "");
          state.instanceUrl = val ? `https://${val}` : "";
          const match = val.match(/^(?:www\.)?([^\.]+)/);
          state.database = match ? match[1] : val;
        }
        if (state.instanceUrl.length > 0) {
          state.step = 2;
          render();
        }
      }
    }, [el("span", { text: "Continue →" })]);
    content.append(continueBtn);

    return content;
  }

  function buildStep2() {
    const content = el("div", { style: "padding: 24px;" });

    content.append(el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary);" }, "Step 2 of 3 — Credentials"));
    content.append(el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface);" }, "Enter your login details"));
    content.append(el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant); marginBottom: 16;" }, state.instanceUrl));

    // Database
    content.append(el("p", { style: "font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin: 16px 0 6px;" }, "Database Name"));
    inputs.database = el("input", { type: "text", className: "ee-input", placeholder: "my_database", value: state.database });
    content.append(inputs.database);

    // Create new toggle
    content.append(el("div", { 
      style: "display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--ee-surface-container); cursor: pointer; margin: 12px 0;",
      onclick: () => { state.isNewDatabase = !state.isNewDatabase; render(); }
    }, [
      el("div", { style: `width: 20px; height: 20px; border: 2px solid ${state.isNewDatabase ? "var(--ee-primary)" : "var(--ee-outline)"}; background: ${state.isNewDatabase ? "var(--ee-primary)" : "transparent"};` }, 
        state.isNewDatabase ? el("span", { className: "material-symbols-outlined", style: "font-size: 14px; color: white;", text: "check" }) : null),
      el("span", { style: "font-size: 14px;" }, "Create new database")
    ]));

    // Username
    content.append(el("p", { style: "font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin: 16px 0 6px;" }, "Email / Username"));
    inputs.username = el("input", { type: "email", className: "ee-input", placeholder: "admin@company.com", value: state.username });
    content.append(inputs.username);

    // Password
    content.append(el("p", { style: "font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin: 16px 0 6px;" }, "Password"));
    inputs.password = el("input", { type: "password", className: "ee-input", placeholder: "••••••••", value: state.password });
    content.append(inputs.password);

    // Test button
    const isTesting = state.testStatus === "loading";
    content.append(el("button", {
      className: "ee-btn ee-btn--secondary",
      style: `width: 100%; border: 2px solid var(--ee-primary); color: var(--ee-primary); margin-top: 16px; ${isTesting ? "opacity: 0.7;" : ""}`,
      disabled: isTesting,
      onclick: async () => {
        if (isTesting) return;

        // Get values from inputs
        const db = inputs.database?.value?.trim() || "";
        const user = inputs.username?.value?.trim() || "";
        const pass = inputs.password?.value || "";

        if (!db || !user || !pass) {
          state.testStatus = "error";
          state.testError = { message: "Please fill in all fields", suggestion: "Database, username, and password are required." };
          state.canContinue = false;
          render();
          return;
        }

        state.database = db;
        state.username = user;
        state.password = pass;
        state.testStatus = "loading";
        state.testError = null;
        state.canContinue = false;
        render();

        try {
          // Normalise URL: re-derive from raw input to avoid state.instanceUrl missing protocol
          const rawUrl = (inputs.url?.value || state.instanceUrl || "").trim()
            .replace(/^https?:\/\//, "").replace(/\/.*$/, "");
          const canonicalUrl = rawUrl ? `https://${rawUrl}` : "";

          if (!canonicalUrl) {
            state.testStatus = "error";
            state.testError = { message: "No server URL", suggestion: "Enter your Odoo instance address in Step 1." };
            state.canContinue = false;
            render();
            return;
          }

          // Use active project ID so the test connection is reusable by Step 3
          const activeProjectId = getState().activeProject?.projectIdentity?.projectId || "test-connection";
          const payload = {
            project: { projectIdentity: { projectId: activeProjectId } },
            credentials: {
              url: canonicalUrl,
              database: db,
              username: user,
              password: pass,
              edition: state.edition,
              instanceType: state.instanceType,
              createNewDatabase: state.isNewDatabase
            }
          };
          console.log('Sending to backend:', JSON.stringify(payload));
          const res = await fetch("/api/connection/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          const data = await res.json();

          if (!res.ok) {
            state.testStatus = "error";
            state.testError = getError(data.error || "Connection failed");
            state.canContinue = false;
          } else {
            state.testStatus = "success";
            state.testError = null;
            state.canContinue = true;
          }
        } catch (e) {
          console.error('Connection test fetch error:', e);
          state.testStatus = "error";
          state.testError = { message: "Cannot reach server", suggestion: e.message || "Check your internet connection and that the backend is running." };
          state.canContinue = false;
        }

        render();
      }
    }, [
      isTesting 
        ? el("span", { className: "material-symbols-outlined", style: "animation: spin 1s linear infinite;", text: "autorenew" })
        : el("span", { className: "material-symbols-outlined", text: "wifi_tethering" }),
      el("span", { text: isTesting ? "Testing..." : "Test Connection" })
    ]));

    // Status
    if (state.testStatus === "error" && state.testError) {
      content.append(el("div", { style: "margin-top: 12px; padding: 16px; background: var(--ee-error-soft); border-left: 3px solid var(--ee-error);" }, [
        el("p", { style: "font-size: 14px; font-weight: 600; color: var(--ee-error);" }, state.testError.message),
        el("p", { style: "font-size: 13px; color: var(--ee-on-surface-variant);" }, state.testError.suggestion)
      ]));
    } else if (state.testStatus === "success") {
      content.append(el("div", { style: "margin-top: 12px; padding: 16px; background: var(--ee-success-soft); border-left: 3px solid var(--ee-success);" }, [
        el("p", { style: "font-size: 14px; font-weight: 600; color: var(--ee-success);" }, "✓ Connection successful!")
      ]));
    }

    // Buttons
    const buttons = el("div", { style: "display: flex; gap: 12px; margin-top: 16px;" });
    buttons.append(el("button", { className: "ee-btn ee-btn--secondary", style: "flex: 1;", onclick: () => { state.step = 1; render(); } }, [el("span", { text: "← Back" })]));
    buttons.append(el("button", { 
      className: "ee-btn ee-btn--primary", 
      style: `flex: 1; ${!state.canContinue ? "opacity: 0.5; cursor: not-allowed;" : ""}`,
      disabled: !state.canContinue,
      onclick: () => { if (state.canContinue) { state.step = 3; render(); } }
    }, [el("span", { text: "Continue →" })]));
    content.append(buttons);

    return content;
  }

  function buildStep3() {
    return el("div", { style: "padding: 24px;" }, [
      el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary);" }, "Step 3 of 3 — Confirmation"),
      el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface);" }, "Ready to connect!"),
      
      el("div", { style: "background: var(--ee-secondary-container); padding: 20px; margin: 16px 0;" }, [
        el("p", { style: "font-size: 14px; margin: 4px 0;" }, [el("strong", {}, "Type: "), state.instanceType === "online" ? "Odoo Online" : state.instanceType === "sh" ? "Odoo.sh" : "Self-hosted"]),
        el("p", { style: "font-size: 14px; margin: 4px 0;" }, [el("strong", {}, "Edition: "), state.edition]),
        el("p", { style: "font-size: 14px; margin: 4px 0;" }, [el("strong", {}, "URL: "), state.instanceUrl]),
        el("p", { style: "font-size: 14px; margin: 4px 0;" }, [el("strong", {}, "Database: "), state.database, state.isNewDatabase ? " (will create)" : ""])
      ]),

      el("button", {
        className: "ee-btn ee-btn--primary ee-btn--full",
        style: "margin: 16px 0;",
        onclick: () => {
          const rawUrl = (state.instanceUrl || "").trim()
            .replace(/^https?:\/\//, "").replace(/\/.*$/, "");
          
          onConnect({
            url: rawUrl ? `https://${rawUrl}` : "",
            database: state.database,
            username: state.username,
            password: state.password,
            edition: state.edition,
            instanceType: state.instanceType,
            createNewDatabase: state.isNewDatabase
          });
        }
      }, [el("span", { text: state.isNewDatabase ? "Create Database & Connect" : "Connect to Odoo" })]),

      el("div", { style: "display: flex; gap: 12px;" }, [
        el("button", { className: "ee-btn ee-btn--secondary", style: "flex: 1;", onclick: () => { state.step = 2; render(); } }, [el("span", { text: "← Back" })]),
        el("button", { style: "flex: 1; color: var(--ee-on-surface-variant); background: none; border: none; text-decoration: underline;", onclick: onSkip }, [el("span", { text: "Skip for now" })])
      ])
    ]);
  }

  function getError(err) {
    const m = err.toLowerCase();
    if (m.includes("authentication") || m.includes("password") || m.includes("login")) return { message: "Invalid username or password", suggestion: "Check your credentials are correct." };
    if (m.includes("database")) return { message: "Database not found", suggestion: "Check the database name or select 'Create new database'." };
    if (m.includes("url") || m.includes("host") || m.includes("network")) return { message: "Cannot reach server", suggestion: "Check the URL and ensure server is online." };
    return { message: "Connection failed", suggestion: err };
  }
}

// Add spin animation
if (typeof document !== "undefined") {
  const s = document.createElement("style");
  s.textContent = "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
  document.head.appendChild(s);
}