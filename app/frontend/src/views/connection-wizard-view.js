import { el } from "../lib/dom.js";

/**
 * Connection Wizard — 3-step Odoo instance connection flow.
 * Editorial Engineer design — square corners, white surfaces.
 * IMPROVED: Single state object, proper validation, loading guards.
 */
export function renderConnectionWizardView({ onConnect, onSkip }) {
  // ====================== STATE ======================
  const state = {
    step: 1,
    instanceType: "online",
    edition: "community",
    instanceUrl: "",
    database: "",
    username: "",
    password: "",
    isNewDatabase: false,
    testStatus: "idle",        // idle | loading | success | error
    testError: null,
    detectedVersion: "",
    detectedCompany: "",
    detectedEdition: "",
    detectedDeployment: ""
  };

  const container = el("div", {
    style: "min-height: 100vh; background: var(--ee-surface); display: flex; align-items: center; justify-content: center; padding: 24px;"
  });

  let isTesting = false;

  function render() {
    while (container.firstChild) container.removeChild(container.firstChild);
    container.append(buildStep());
  }

  // ====================== STEP BUILDERS ======================
  function buildStep() {
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
      el("div", { 
        style: "display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 32px;"
      }, [1, 2, 3].map(n =>
        el("div", { style: "display: flex; align-items: center; gap: 8px;" }, [
          el("div", {
            style: `width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 700; ${
              n < state.step ? "background: var(--ee-secondary); color: white;" :
              n === state.step ? "background: var(--ee-primary); color: white;" :
              "background: var(--ee-surface-container); color: var(--ee-outline);"
            }`
          }, [
            n < state.step
              ? el("span", { className: "material-symbols-outlined", style: "font-size: 16px;", text: "check" })
              : el("span", { text: String(n) })
          ]),
          n < 3 ? el("div", { 
            style: `width: 32px; height: 2px; background: ${n < state.step ? "var(--ee-primary)" : "var(--ee-surface-container-high)"};`
          }) : null
        ])
      )),
      // Card
      el("div", { 
        style: "background: var(--ee-surface-container-low); box-shadow: var(--ee-shadow-lg);"
      }, [
        state.step === 1 ? buildStep1() :
        state.step === 2 ? buildStep2() :
        buildStep3()
      ])
    ]);
  }

  // ====================== STEP 1: INSTANCE TYPE ======================
  function buildStep1() {
    const typeOptions = [
      { id: "online",   icon: "public",       label: "Odoo Online",  desc: "odoo.com hosted subscription" },
      { id: "sh",       icon: "cloud",        label: "Odoo.sh",      desc: "Managed cloud on Odoo.sh platform" },
      { id: "selfhost", icon: "dns",          label: "Self-hosted",  desc: "On-premise or private cloud" }
    ];

    const editionOptions = [
      { id: "community", label: "Community", desc: "Free, open-source" },
      { id: "enterprise", label: "Enterprise", desc: "Paid subscription with extra features" }
    ];

    // === URL INPUT SECTION ===
    const urlInput = el("input", {
      type: "text",
      className: "ee-input",
      placeholder: "mycompany.odoo.com",
      value: state.instanceUrl.replace(/^https?:\/\//i, '').toLowerCase(),
      onInput: (e) => { 
        let val = e.target.value.trim().toLowerCase();
        
        // Remove any protocol if user included it
        val = val.replace(/^https?:\/\//, '');
        
        // Remove any paths or query strings
        val = val.replace(/\/.*$/, '');
        val = val.replace(/\?.*$/, '');
        
        // Always use https://
        state.instanceUrl = val ? `https://${val}` : '';
        
        // Extract database name - handles both www.test236.odoo.com and test236.odoo.com
        if (state.instanceUrl.includes('.odoo.com')) {
          const match = state.instanceUrl.match(/https?:\/\/([^\/]+)\.odoo\.com/i);
          if (match) {
            const subdomain = match[1];
            // Remove www. prefix if present
            const cleanSubdomain = subdomain.replace(/^www\./, '');
            state.database = cleanSubdomain;
          }
        }
        
        render();
      }
    });

    const urlPreview = el("div", { 
      style: "margin-top: 8px; padding: 10px 12px; background: var(--ee-surface-container); border-left: 3px solid var(--ee-secondary);"
    }, [
      el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant); margin: 0;" }, [
        el("span", { style: "font-weight: 600; color: var(--ee-on-surface);" }, "Connecting to: "),
        el("span", { text: state.instanceUrl || 'https://yourcompany.odoo.com' })
      ]),
      state.database ? el("p", { style: "font-size: 12px; color: var(--ee-secondary); margin: '4px 0 0 0';" }, [
        el("span", { style: "font-weight: 600;" }, "Database: "),
        el("span", { text: state.database })
      ]) : null
    ]);

    const typeCards = typeOptions.map(opt => {
      const card = el("button", {
        className: "ee-type-option",
        style: `width: 100%; text-align: left; padding: 16px; background: ${opt.id === state.instanceType ? "var(--ee-primary-subtle)" : "var(--ee-surface-container)"}; border-left: 3px solid ${opt.id === state.instanceType ? "var(--ee-primary)" : "transparent"}; cursor: pointer; transition: all 150ms ease;`,
        onclick: () => {
          state.instanceType = opt.id;
          if (opt.id === "online") state.instanceUrl = "";
          else if (opt.id === "sh") state.instanceUrl = "";
          else state.instanceUrl = "";
          state.database = "";
          render();
        }
      }, [
        el("div", { style: "display: flex; align-items: center; gap: 12px;" }, [
          el("span", { 
            className: "material-symbols-outlined",
            style: `font-size: 22px; color: ${opt.id === state.instanceType ? "var(--ee-primary)" : "var(--ee-on-surface-variant)"};`,
            text: opt.icon 
          }),
          el("div", {}, [
            el("p", { style: "font-size: 14px; font-weight: 600; color: var(--ee-on-surface); margin-bottom: 2px;", text: opt.label }),
            el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant);", text: opt.desc })
          ])
        ])
      ]);
      return card;
    });

    const editionSelector = el("div", { style: "display: flex; gap: 12px; margin-top: 16px;" }, 
      editionOptions.map(opt => 
        el("button", {
          className: "ee-btn",
          style: `flex: 1; justify-content: center; ${state.edition === opt.id ? "background: var(--ee-primary); color: white;" : "background: var(--ee-surface-container); color: var(--ee-on-surface); border: 1px solid var(--ee-outline-variant);"}`,
          onclick: () => { state.edition = opt.id; render(); }
        }, [
          el("div", { style: "text-align: center;" }, [
            el("p", { style: "font-size: 14px; font-weight: 600;", text: opt.label }),
            el("p", { style: "font-size: 11px; opacity: 0.8;", text: opt.desc })
          ])
        ])
      )
    );

    // === VALIDATION ===
    const canContinue = state.instanceUrl && state.instanceUrl.startsWith("https://") && state.database;

    const nextBtn = el("button", {
      className: "ee-btn ee-btn--primary ee-btn--full ee-btn--lg",
      style: `margin-top: 24px; ${!canContinue ? 'opacity: 0.5; cursor: not-allowed;' : ''}`,
      disabled: !canContinue,
      onclick: () => {
        if (!canContinue) return;
        state.step = 2;
        state.testStatus = "idle";
        state.testError = null;
        render();
      }
    }, [el("span", { text: "Continue →" })]);

    return el("div", { style: "padding: 24px;" }, [
      el("div", {}, [
        el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 8px;", text: "Step 1 of 3 — Instance Type" }),
        el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 16px;", text: "How is your Odoo hosted?" })
      ]),
      el("div", { style: "display: flex; flex-direction: column; gap: 12px;" }, typeCards),
      
      el("div", { style: "margin-top: 24px;" }, [
        el("label", { style: "display: block; font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin-bottom: 12px;" }, "Edition"),
        editionSelector
      ]),
      
      // URL Input Section
      el("div", { style: "margin-top: 16px;" }, [
        el("label", { style: "display: block; font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin-bottom: 8px;" }, [
          el("span", { text: "Your Odoo Address" })
        ]),
        urlInput,
        urlPreview,
        el("p", { 
          style: "font-size: 11px; color: var(--ee-outline); margin-top: 8px;"
        }, "💡 Just type your company name like \"mycompany.odoo.com\" — with or without www.")
      ]),
      
      nextBtn
    ]);
  }

  // ====================== STEP 2: CREDENTIALS ======================
  function buildStep2() {
    const dbInput = el("input", {
      type: "text",
      className: "ee-input",
      placeholder: "my_database",
      value: state.database,
      onInput: (e) => { state.database = e.target.value; }
    });

    const usernameIn = el("input", {
      type: "email",
      className: "ee-input",
      placeholder: "admin@company.com",
      value: state.username,
      onInput: (e) => { state.username = e.target.value; }
    });

    const passwordIn = el("input", {
      type: "password",
      className: "ee-input",
      placeholder: "••••••••",
      onInput: (e) => { state.password = e.target.value; }
    });

    const newDbToggle = el("div", { 
      style: "display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--ee-surface-container); cursor: pointer;",
      onclick: () => { state.isNewDatabase = !state.isNewDatabase; render(); }
    }, [
      el("div", { 
        style: `width: 20px; height: 20px; border: 2px solid ${state.isNewDatabase ? "var(--ee-primary)" : "var(--ee-outline)"}; background: ${state.isNewDatabase ? "var(--ee-primary)" : "transparent"}; display: flex; align-items: center; justify-content: center;`
      }, state.isNewDatabase ? el("span", { className: "material-symbols-outlined", style: "font-size: 14px; color: white;", text: "check" }) : null),
      el("span", { style: "font-size: 14px; color: var(--ee-on-surface);" }, "Create new database")
    ]);

    // === TEST CONNECTION BUTTON ===
    const testBtn = el("button", {
      className: "ee-btn ee-btn--secondary",
      style: "width: 100%; border: 2px solid var(--ee-primary); color: var(--ee-primary); margin-top: 16px;",
      disabled: isTesting,
      onclick: async () => {
        if (isTesting) return;

        // === VALIDATION ===
        if (!state.database?.trim()) {
          showTestError("validation", "Database name is required", "Please enter your database name.");
          return;
        }
        if (!state.username?.trim()) {
          showTestError("validation", "Username / Email is required", "Please enter your email or username.");
          return;
        }
        if (!state.password) {
          showTestError("validation", "Password is required", "Please enter your password.");
          return;
        }

        isTesting = true;
        state.testStatus = "loading";
        state.testError = null;
        render();

        try {
          const response = await fetch("/api/connection/connect", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              project: { projectIdentity: { projectId: "test-connection" } },
              credentials: {
                url: state.instanceUrl,
                database: state.database.trim(),
                username: state.username.trim(),
                password: state.password,
                edition: state.edition,
                instanceType: state.instanceType,
                createNewDatabase: state.isNewDatabase
              }
            })
          });

          const payload = await response.json();

          if (!response.ok) {
            state.testStatus = "error";
            state.testError = categorizeConnectionError(payload.error || payload.message || "Connection failed");
            render();
            return;
          }

          // === SUCCESS ===
          state.testStatus = "success";
          state.testError = null;

          // Safely extract detection data
          const env = payload.project?.connectionState?.environmentIdentity || {};
          state.detectedVersion = env.serverVersion || "19.0";
          state.detectedCompany = env.companyName || env.database || state.database;
          state.detectedEdition = env.edition || state.edition;
          state.detectedDeployment = env.deployment || state.instanceType;

          render();

        } catch (err) {
          state.testStatus = "error";
          state.testError = {
            category: "network",
            message: "Cannot reach the Odoo server",
            suggestion: "Please check your internet connection, the URL, and that the Odoo instance is running."
          };
          render();
        } finally {
          isTesting = false;
        }
      }
    }, [
      state.testStatus === "loading" 
        ? el("span", { className: "material-symbols-outlined", style: "font-size: 18px; animation: spin 1s linear infinite;", text: "autorenew" })
        : el("span", { className: "material-symbols-outlined", style: "font-size: 18px;", text: "wifi_tethering" }),
      el("span", { text: state.testStatus === "loading" ? "Testing Connection..." : "Test Connection" })
    ]);

    // === STATUS DISPLAY ===
    const testStatusEl = el("div", { style: "display: none; margin-top: 12px;" });

    if (state.testStatus === "error" && state.testError) {
      testStatusEl.style.cssText = "display: block; margin-top: 12px;";
      testStatusEl.innerHTML = "";
      testStatusEl.append(
        el("div", {
          style: "padding: 16px; background: var(--ee-error-soft); border-left: 3px solid var(--ee-error);"
        }, [
          el("div", { style: "display: flex; align-items: center; gap: 8px; margin-bottom: 8px;" }, [
            el("span", { className: "material-symbols-outlined", style: "font-size: 20px; color: var(--ee-error);", text: "error" }),
            el("span", { style: "font-size: 14px; font-weight: 600; color: var(--ee-error);", text: state.testError.message })
          ]),
          el("p", { style: "font-size: 13px; color: var(--ee-on-surface-variant); white-space: pre-line;", text: state.testError.suggestion })
        ])
      );
    } else if (state.testStatus === "success") {
      testStatusEl.style.cssText = "display: block; margin-top: 12px;";
      testStatusEl.innerHTML = "";
      testStatusEl.append(
        el("div", {
          style: "padding: 16px; background: var(--ee-success-soft); border-left: 3px solid var(--ee-success);"
        }, [
          el("div", { style: "display: flex; align-items: center; gap: 8px; margin-bottom: 8px;" }, [
            el("span", { className: "material-symbols-outlined", style: "font-size: 20px; color: var(--ee-success);", text: "check_circle" }),
            el("span", { style: "font-size: 14px; font-weight: 600; color: var(--ee-success);", text: "Connection successful!" })
          ]),
          el("p", { style: "font-size: 13px; color: var(--ee-on-surface-variant);", 
            text: `Detected: Odoo ${state.detectedVersion} ${state.detectedEdition} on ${state.detectedDeployment}` 
          })
        ])
      );
    }

    // === CONTINUE BUTTON (disabled until success) ===
    const continueBtn = el("button", {
      className: "ee-btn ee-btn--primary",
      style: `flex: 1; ${state.testStatus !== "success" ? 'opacity: 0.5; cursor: not-allowed;' : ''}`,
      disabled: state.testStatus !== "success",
      onclick: () => {
        if (state.testStatus !== "success") return;
        state.step = 3;
        render();
      }
    }, "Continue →");

    return el("div", { style: "padding: 24px;" }, [
      el("div", {}, [
        el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 4px;", text: "Step 2 of 3 — Credentials" }),
        el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 4px;", text: "Enter your login details" }),
        el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant);", text: state.instanceUrl })
      ]),
      el("div", { style: "display: flex; flex-direction: column; gap: 16px; margin-top: 16px;" }, [
        el("div", { style: "display: flex; flex-direction: column; gap: 6px;" }, [
          el("label", { style: "font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant);", text: "Database Name" }),
          dbInput,
          el("p", { style: "font-size: 11px; color: var(--ee-outline);" }, "Enter your existing database name, or check 'Create new database' below")
        ]),
        newDbToggle,
        el("div", { style: "display: flex; flex-direction: column; gap: 6px;" }, [
          el("label", { style: "font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant);", text: "Email / Username" }),
          usernameIn
        ]),
        el("div", { style: "display: flex; flex-direction: column; gap: 6px;" }, [
          el("label", { style: "font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant);", text: "Password" }),
          passwordIn
        ])
      ]),
      testBtn,
      testStatusEl,
      el("div", { style: "display: flex; gap: 12px; margin-top: 16px;" }, [
        el("button", {
          className: "ee-btn ee-btn--secondary",
          style: "flex: 1;",
          disabled: isTesting,
          onclick: () => { 
            if (isTesting) return;
            state.step = 1; 
            render(); 
          }
        }, "← Back"),
        continueBtn
      ])
    ]);
  }

  // ====================== STEP 3: CONFIRMATION ======================
  function buildStep3() {
    return el("div", { style: "padding: 24px;" }, [
      el("div", {}, [
        el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 4px;", text: "Step 3 of 3 — Confirmation" }),
        el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 4px;", text: "Ready to connect!" })
      ]),
      el("div", { 
        style: "background: var(--ee-secondary-container); padding: 20px; margin: 16px 0;"
      }, [
        infoRow("Instance Type", state.instanceType === "online" ? "Odoo Online" : state.instanceType === "sh" ? "Odoo.sh" : "Self-hosted"),
        infoRow("Edition", state.edition.charAt(0).toUpperCase() + state.edition.slice(1)),
        infoRow("Odoo URL", state.instanceUrl),
        infoRow("Database", state.database + (state.isNewDatabase ? " (will be created)" : "")),
        infoRow("Odoo Version", state.detectedVersion || "19.0"),
        infoRow("Company", state.detectedCompany || state.database)
      ]),
      el("div", { 
        style: "padding: 12px; background: var(--ee-surface-container); font-size: 12px; color: var(--ee-on-surface-variant); margin-bottom: 16px;"
      }, [
        el("p", { text: "🔒 Your credentials are stored only in this browser session and never saved to disk or sent to third parties." })
      ]),
      el("button", {
        className: "ee-btn ee-btn--primary ee-btn--lg ee-btn--full",
        style: "margin-bottom: 12px;",
        onclick: () => {
          onConnect({
            url: state.instanceUrl,
            database: state.database,
            username: state.username,
            password: state.password,
            edition: state.edition,
            isNewDatabase: state.isNewDatabase,
            version: state.detectedVersion || "19.0",
            companyName: state.detectedCompany || state.database,
            instanceType: state.instanceType
          });
        }
      }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 20px;", text: "rocket_launch" }),
        el("span", { text: state.isNewDatabase ? "Create Database & Start" : "Start Implementation" })
      ]),
      el("div", { style: "display: flex; gap: 12px;" }, [
        el("button", {
          className: "ee-btn ee-btn--secondary",
          style: "flex: 1;",
          onclick: () => { state.step = 2; render(); }
        }, "← Back"),
        el("button", {
          style: "flex: 1; font-size: 14px; color: var(--ee-on-surface-variant); background: none; border: none; cursor: pointer; text-decoration: underline;",
          onclick: onSkip
        }, "Skip for now")
      ])
    ]);
  }

  // ====================== HELPERS ======================
  function showTestError(category, message, suggestion) {
    state.testStatus = "error";
    state.testError = { category, message, suggestion };
    render();
  }

  function infoRow(label, value) {
    return el("div", { 
      style: "display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--ee-surface-container);"
    }, [
      el("span", { style: "font-size: 12px; color: var(--ee-on-surface-variant); font-weight: 500;", text: label }),
      el("span", { style: "font-size: 14px; font-weight: 600; color: var(--ee-on-surface);", text: value || "—" })
    ]);
  }

  function categorizeConnectionError(error) {
    const msg = String(error).toLowerCase();
    
    if (msg.includes("database") && (msg.includes("not found") || msg.includes("does not exist"))) {
      return {
        category: "database",
        message: "Database not found",
        suggestion: `The database "${state.database}" does not exist on this Odoo server.\n\nPlease:\n• Check the database name spelling\n• Ask your administrator for the correct database name\n• Check "Create new database" if you want to create it now`
      };
    }
    
    if (msg.includes("authentication") || msg.includes("login") || msg.includes("password") || msg.includes("credential")) {
      return {
        category: "authentication",
        message: "Invalid username or password",
        suggestion: "Please check:\n• Your email/username is correct\n• Your password is correct (case-sensitive)\n• Caps Lock is not on"
      };
    }
    
    if (msg.includes("url") || msg.includes("host") || msg.includes("network") || msg.includes("fetch") || msg.includes("failed")) {
      return {
        category: "url",
        message: "Cannot reach Odoo server",
        suggestion: "Please check:\n• The URL is correct: " + state.instanceUrl + "\n• Your internet connection is working\n• The Odoo server is online\n• Try logging in via the Odoo web interface first"
      };
    }
    
    if (msg.includes("version") || msg.includes("unsupported")) {
      return {
        category: "version",
        message: "Unsupported Odoo version",
        suggestion: "This guide only supports Odoo 19. Please connect to an Odoo 19 instance."
      };
    }
    
    if (msg.includes("https") || msg.includes("ssl") || msg.includes("tls")) {
      return {
        category: "https",
        message: "HTTPS connection required",
        suggestion: "Odoo Online requires a secure HTTPS connection. The URL should start with https://"
      };
    }
    
    return {
      category: "unknown",
      message: "Connection failed",
      suggestion: `Error: ${error}\n\nPlease check:\n• All fields are filled correctly\n• The Odoo server is online\n• Try logging in via the Odoo web interface first\n• Contact your Odoo administrator if the problem persists`
    };
  }

  // Add spin animation
  const style = el("style", {}, `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `);
  container.append(style);

  render();
  return container;
}
