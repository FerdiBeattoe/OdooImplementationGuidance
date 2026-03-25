import { el } from "../lib/dom.js";

/**
 * Connection Wizard — 3-step Odoo instance connection flow.
 * FIXED: No re-render on typing, inputs keep focus.
 */
export function renderConnectionWizardView({ onConnect, onSkip }) {
  // State stored in closure, synced only on actions (not on typing)
  let step = 1;
  let instanceType = "online";
  let edition = "community";
  let instanceUrl = "";
  let database = "";
  let username = "";
  let password = "";
  let isNewDatabase = false;
  let testStatus = "idle";
  let testError = null;
  let isTesting = false;
  let canContinue = false;

  const container = el("div", {
    style: "min-height: 100vh; background: var(--ee-surface); display: flex; align-items: center; justify-content: center; padding: 24px;"
  });

  // Initial render
  render();
  return container;

  function render() {
    container.innerHTML = "";
    container.append(buildWizard());
  }

  function buildWizard() {
    return el("div", { style: "width: 100%; max-width: 520px;" }, [
      // Header
      el("div", { style: "text-align: center; margin-bottom: 32px;" }, [
        el("div", { 
          style: "width: 48px; height: 48px; background: var(--ee-primary); display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;"
        }, [
          el("span", { className: "material-symbols-outlined", style: "color: white; font-size: 24px;", text: "hub" })
        ]),
        el("h1", { 
          style: "font-family: var(--ee-font-headline); font-size: 22px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 8px;"
        }, "Connect to Odoo 19"),
        el("p", { 
          style: "font-size: 14px; color: var(--ee-on-surface-variant);"
        }, "Link your Odoo instance to enable wizard push and live data sync.")
      ]),

      // Step indicator
      buildStepIndicator(),

      // Card content
      el("div", { 
        style: "background: var(--ee-surface-container-low); box-shadow: var(--ee-shadow-lg);"
      }, step === 1 ? buildStep1() : step === 2 ? buildStep2() : buildStep3())
    ]);
  }

  function buildStepIndicator() {
    return el("div", { 
      style: "display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 32px;"
    }, [1, 2, 3].map(n =>
      el("div", { style: "display: flex; align-items: center; gap: 8px;" }, [
        el("div", {
          style: `width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; ${
            n < step ? "background: var(--ee-secondary); color: white;" :
            n === step ? "background: var(--ee-primary); color: white;" :
            "background: var(--ee-surface-container); color: var(--ee-outline);"
          }`
        }, [
          n < step
            ? el("span", { className: "material-symbols-outlined", style: "font-size: 16px;", text: "check" })
            : el("span", { text: String(n) })
        ]),
        n < 3 ? el("div", { 
          style: `width: 32px; height: 2px; background: ${n < step ? "var(--ee-primary)" : "var(--ee-surface-container-high)"};`
        }) : null
      ])
    ));
  }

  // ====================== STEP 1 ======================
  function buildStep1() {
    const typeOptions = [
      { id: "online", icon: "public", label: "Odoo Online", desc: "odoo.com hosted subscription" },
      { id: "sh", icon: "cloud", label: "Odoo.sh", desc: "Managed cloud on Odoo.sh platform" },
      { id: "selfhost", icon: "dns", label: "Self-hosted", desc: "On-premise or private cloud" }
    ];

    const editionOptions = [
      { id: "community", label: "Community", desc: "Free, open-source" },
      { id: "enterprise", label: "Enterprise", desc: "Paid subscription with extra features" }
    ];

    const content = el("div", { style: "padding: 24px;" });

    // Title
    content.append(el("div", {}, [
      el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 8px;" }, 
        "Step 1 of 3 — Instance Type"),
      el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 16px;" }, 
        "How is your Odoo hosted?")
    ]));

    // Type cards
    typeOptions.forEach(opt => {
      content.append(el("button", {
        className: "ee-type-option",
        style: `width: 100%; text-align: left; padding: 16px; margin-bottom: 8px; background: ${opt.id === instanceType ? "var(--ee-primary-subtle)" : "var(--ee-surface-container)"}; border-left: 3px solid ${opt.id === instanceType ? "var(--ee-primary)" : "transparent"}; cursor: pointer;`,
        onclick: () => {
          instanceType = opt.id;
          instanceUrl = opt.id === "online" ? "" : "";
          database = "";
          render();
        }
      }, [
        el("div", { style: "display: flex; align-items: center; gap: 12px;" }, [
          el("span", { 
            className: "material-symbols-outlined",
            style: `font-size: 22px; color: ${opt.id === instanceType ? "var(--ee-primary)" : "var(--ee-on-surface-variant)"};`,
            text: opt.icon 
          }),
          el("div", {}, [
            el("p", { style: "font-size: 14px; font-weight: 600; color: var(--ee-on-surface); margin-bottom: 2px;" }, opt.label),
            el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant);" }, opt.desc)
          ])
        ])
      ]));
    });

    // Edition selector
    content.append(el("label", { style: "display: block; font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin: 16px 0 12px;" }, "Edition"));
    
    const editionRow = el("div", { style: "display: flex; gap: 12px;" });
    editionOptions.forEach(opt => {
      editionRow.append(el("button", {
        className: "ee-btn",
        style: `flex: 1; justify-content: center; ${edition === opt.id ? "background: var(--ee-primary); color: white;" : "background: var(--ee-surface-container); color: var(--ee-on-surface); border: 1px solid var(--ee-outline-variant);"}`,
        onclick: () => { edition = opt.id; render(); }
      }, [
        el("div", { style: "text-align: center;" }, [
          el("p", { style: "font-size: 14px; font-weight: 600;" }, opt.label),
          el("p", { style: "font-size: 11px; opacity: 0.8;" }, opt.desc)
        ])
      ]));
    });
    content.append(editionRow);

    // URL input for online/selfhost
    if (instanceType !== "sh") {
      content.append(el("label", { style: "display: block; font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin: 16px 0 8px;" }, 
        instanceType === "online" ? "Your Odoo Address" : "Odoo URL"));
      
      const urlInput = el("input", {
        type: "text",
        className: "ee-input",
        placeholder: instanceType === "online" ? "mycompany.odoo.com" : "https://your-odoo.example.com",
        value: instanceUrl
      });
      content.append(urlInput);

      // Live preview
      if (instanceType === "online") {
        content.append(el("div", { 
          style: "margin-top: 8px; padding: 10px 12px; background: var(--ee-surface-container);"
        }, [
          el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant); margin: 0;" }, [
            el("span", { style: "font-weight: 600; color: var(--ee-on-surface);" }, "Connecting to: "),
            el("span", { text: instanceUrl ? `https://${instanceUrl.toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '')}` : "https://yourcompany.odoo.com" })
          ]),
          database ? el("p", { style: "font-size: 12px; color: var(--ee-secondary); margin: '4px 0 0 0';" }, [
            el("span", { style: "font-weight: 600;" }, "Database: "),
            el("span", { text: database })
          ]) : null
        ]));
      }
    }

    // Odoo.sh subdomain input
    if (instanceType === "sh") {
      content.append(el("label", { style: "display: block; font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin: 16px 0 8px;" }, "Odoo.sh Subdomain"));
      
      const subdomainInput = el("input", {
        type: "text",
        className: "ee-input",
        placeholder: "my-project",
        value: instanceUrl.replace(/\.odoo\.com$/, '').replace(/^https?:\/\//, '')
      });
      content.append(subdomainInput);
      content.append(el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant); marginTop: 6;" }, 
        ".odoo.com will be added automatically"));
    }

    // Continue button
    const isValid = instanceType === "sh" ? 
      instanceUrl.replace(/\.odoo\.com$/, '').length > 0 :
      instanceUrl.length > 0;

    const continueBtn = el("button", {
      className: "ee-btn ee-btn--primary ee-btn--full ee-btn--lg",
      style: `margin-top: 24px; ${!isValid ? "opacity: 0.5; cursor: not-allowed;" : ""}`,
      disabled: !isValid,
      onclick: () => {
        // Get values from DOM inputs (not state)
        const urlInput = content.querySelector('input[type="text"]');
        if (urlInput) {
          let val = urlInput.value.trim().toLowerCase();
          
          if (instanceType === "sh") {
            instanceUrl = val ? `https://${val}.odoo.com` : "";
            database = val;
          } else {
            // Clean URL
            val = val.replace(/^https?:\/\//, '');
            val = val.replace(/\/.*$/, '');
            instanceUrl = val ? `https://${val}` : "";
            
            // Extract database from subdomain
            const match = val.match(/^(?:www\.)?([^\.]+)/);
            database = match ? match[1] : val;
          }
        }
        
        if (isValid) {
          step = 2;
          render();
        }
      }
    }, [el("span", { text: "Continue →" })]);
    content.append(continueBtn);

    return content;
  }

  // ====================== STEP 2 ======================
  function buildStep2() {
    const content = el("div", { style: "padding: 24px;" });

    // Title
    content.append(el("div", {}, [
      el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 4px;" }, 
        "Step 2 of 3 — Credentials"),
      el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 4px;" }, 
        "Enter your login details"),
      el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant);" }, instanceUrl)
    ]));

    // Database input
    content.append(el("label", { style: "display: block; font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin: 16px 0 6px;" }, "Database Name"));
    const dbInput = el("input", {
      type: "text",
      className: "ee-input",
      placeholder: "my_database",
      value: database
    });
    content.append(dbInput);
    content.append(el("p", { style: "font-size: 11px; color: var(--ee-outline); margin: 4px 0 12px;" }, 
      "Enter your existing database name, or check 'Create new database' below"));

    // Create new database toggle
    content.append(el("div", { 
      style: "display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--ee-surface-container); cursor: pointer;",
      onclick: () => { 
        isNewDatabase = !isNewDatabase; 
        render();
      }
    }, [
      el("div", { 
        style: `width: 20px; height: 20px; border: 2px solid ${isNewDatabase ? "var(--ee-primary)" : "var(--ee-outline)"}; background: ${isNewDatabase ? "var(--ee-primary)" : "transparent"}; display: flex; align-items: center; justify-content: center;`
      }, isNewDatabase ? el("span", { className: "material-symbols-outlined", style: "font-size: 14px; color: white;", text: "check" }) : null),
      el("span", { style: "font-size: 14px; color: var(--ee-on-surface);" }, "Create new database")
    ]));

    // Username
    content.append(el("label", { style: "display: block; font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin: 16px 0 6px;" }, "Email / Username"));
    const usernameInput = el("input", {
      type: "email",
      className: "ee-input",
      placeholder: "admin@company.com",
      value: username
    });
    content.append(usernameInput);

    // Password
    content.append(el("label", { style: "display: block; font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin: 16px 0 6px;" }, "Password"));
    const passwordInput = el("input", {
      type: "password",
      className: "ee-input",
      placeholder: "••••••••",
      value: password
    });
    content.append(passwordInput);

    // Test button
    const testBtn = el("button", {
      className: "ee-btn ee-btn--secondary",
      style: `width: 100%; border: 2px solid var(--ee-primary); color: var(--ee-primary); margin-top: 16px; ${isTesting ? "opacity: 0.7;" : ""}`,
      disabled: isTesting,
      onclick: async () => {
        if (isTesting) return;

        // Get values from DOM
        database = dbInput.value.trim();
        username = usernameInput.value.trim();
        password = passwordInput.value;

        if (!database || !username || !password) {
          testStatus = "error";
          testError = { message: "Please fill in all fields", suggestion: "Database, username, and password are required." };
          render();
          return;
        }

        isTesting = true;
        testStatus = "loading";
        testError = null;
        canContinue = false;
        render();

        try {
          const response = await fetch("/api/connection/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project: { projectIdentity: { projectId: "test-connection" } },
              credentials: {
                url: instanceUrl,
                database: database,
                username: username,
                password: password,
                edition: edition,
                instanceType: instanceType,
                createNewDatabase: isNewDatabase
              }
            })
          });

          const payload = await response.json();

          if (!response.ok) {
            testStatus = "error";
            testError = getErrorDetails(payload.error || "Connection failed");
            canContinue = false;
          } else {
            testStatus = "success";
            testError = null;
            canContinue = true;
          }
        } catch (err) {
          testStatus = "error";
          testError = { message: "Cannot reach server", suggestion: "Check your internet connection and try again." };
          canContinue = false;
        }

        isTesting = false;
        render();
      }
    }, [
      isTesting 
        ? el("span", { className: "material-symbols-outlined", style: "font-size: 18px; animation: spin 1s linear infinite;", text: "autorenew" })
        : el("span", { className: "material-symbols-outlined", style: "font-size: 18px;", text: "wifi_tethering" }),
      el("span", { text: isTesting ? " Testing..." : "Test Connection" })
    ]);
    content.append(testBtn);

    // Status display
    if (testStatus === "error" && testError) {
      content.append(el("div", {
        style: "margin-top: 12px; padding: 16px; background: var(--ee-error-soft); border-left: 3px solid var(--ee-error);"
      }, [
        el("div", { style: "display: flex; align-items: center; gap: 8px; margin-bottom: 8px;" }, [
          el("span", { className: "material-symbols-outlined", style: "font-size: 20px; color: var(--ee-error);", text: "error" }),
          el("span", { style: "font-size: 14px; font-weight: 600; color: var(--ee-error);" }, testError.message)
        ]),
        el("p", { style: "font-size: 13px; color: var(--ee-on-surface-variant); white-space: pre-line;" }, testError.suggestion)
      ]));
    } else if (testStatus === "success") {
      content.append(el("div", {
        style: "margin-top: 12px; padding: 16px; background: var(--ee-success-soft); border-left: 3px solid var(--ee-success);"
      }, [
        el("div", { style: "display: flex; align-items: center; gap: 8px;" }, [
          el("span", { className: "material-symbols-outlined", style: "font-size: 20px; color: var(--ee-success);", text: "check_circle" }),
          el("span", { style: "font-size: 14px; font-weight: 600; color: var(--ee-success);" }, "Connection successful!")
        ])
      ]));
    }

    // Buttons row
    const buttonsRow = el("div", { style: "display: flex; gap: 12px; margin-top: 16px;" });
    
    buttonsRow.append(el("button", {
      className: "ee-btn ee-btn--secondary",
      style: "flex: 1;",
      onclick: () => { step = 1; render(); }
    }, [el("span", { text: "← Back" })]));

    buttonsRow.append(el("button", {
      className: "ee-btn ee-btn--primary",
      style: `flex: 1; ${!canContinue ? "opacity: 0.5; cursor: not-allowed;" : ""}`,
      disabled: !canContinue,
      onclick: () => {
        if (!canContinue) return;
        step = 3;
        render();
      }
    }, [el("span", { text: "Continue →" })]));

    content.append(buttonsRow);

    return content;
  }

  // ====================== STEP 3 ======================
  function buildStep3() {
    return el("div", { style: "padding: 24px;" }, [
      el("div", {}, [
        el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 4px;" }, 
          "Step 3 of 3 — Confirmation"),
        el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 4px;" }, 
          "Ready to connect!")
      ]),
      
      el("div", { style: "background: var(--ee-secondary-container); padding: 20px; margin: 16px 0;" }, [
        infoRow("Instance", instanceType === "online" ? "Odoo Online" : instanceType === "sh" ? "Odoo.sh" : "Self-hosted"),
        infoRow("Edition", edition.charAt(0).toUpperCase() + edition.slice(1)),
        infoRow("URL", instanceUrl),
        infoRow("Database", database + (isNewDatabase ? " (will create)" : ""))
      ]),

      el("button", {
        className: "ee-btn ee-btn--primary ee-btn--lg ee-btn--full",
        style: "margin: 16px 0 12px;",
        onclick: () => {
          onConnect({
            url: instanceUrl,
            database,
            username,
            password,
            edition,
            isNewDatabase,
            instanceType
          });
        }
      }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 20px;", text: "rocket_launch" }),
        el("span", { text: isNewDatabase ? "Create Database & Connect" : "Connect to Odoo" })
      ]),

      el("div", { style: "display: flex; gap: 12px;" }, [
        el("button", {
          className: "ee-btn ee-btn--secondary",
          style: "flex: 1;",
          onclick: () => { step = 2; render(); }
        }, [el("span", { text: "← Back" })]),
        el("button", {
          style: "flex: 1; font-size: 14px; color: var(--ee-on-surface-variant); background: none; border: none; cursor: pointer; text-decoration: underline;",
          onclick: onSkip
        }, [el("span", { text: "Skip for now" })])
      ])
    ]);
  }

  function infoRow(label, value) {
    return el("div", { style: "display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--ee-surface-container);" }, [
      el("span", { style: "font-size: 12px; color: var(--ee-on-surface-variant); font-weight: 500;" }, label),
      el("span", { style: "font-size: 14px; font-weight: 600; color: var(--ee-on-surface);" }, value || "—")
    ]);
  }

  function getErrorDetails(error) {
    const msg = error.toLowerCase();
    if (msg.includes("authentication") || msg.includes("login") || msg.includes("password")) {
      return { message: "Invalid username or password", suggestion: "Check your email and password are correct." };
    }
    if (msg.includes("database")) {
      return { message: "Database not found", suggestion: "The database name doesn't exist. Check 'Create new database' if you need to create it." };
    }
    if (msg.includes("url") || msg.includes("host") || msg.includes("network")) {
      return { message: "Cannot reach Odoo server", suggestion: "Check the URL is correct and the server is online." };
    }
    return { message: "Connection failed", suggestion: error };
  }
}

// Add spin animation style
const spinStyle = document.createElement("style");
spinStyle.textContent = "@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }";
document.head.appendChild(spinStyle);