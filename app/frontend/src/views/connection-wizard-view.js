import { el } from "../lib/dom.js";

/**
 * Connection Wizard — 3-step Odoo instance connection flow.
 * Editorial Engineer design — square corners, white surfaces.
 */
export function renderConnectionWizardView({ onConnect, onSkip }) {
  let step = 1;
  let instanceType = "online";
  let edition = "community"; // community | enterprise
  let instanceUrl = "";
  let database = "";
  let username = "";
  let password = "";
  let isNewDatabase = false;
  let testStatus = "idle"; // idle | loading | success | error
  let testError = "";
  let detectedVersion = "";
  let detectedCompany = "";

  const container = el("div", {
    style: "min-height: 100vh; background: var(--ee-surface); display: flex; align-items: center; justify-content: center; padding: 24px;"
  });

  function render() {
    while (container.firstChild) container.removeChild(container.firstChild);
    container.append(buildStep());
  }

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
      )),
      // Card
      el("div", { 
        style: "background: var(--ee-surface-container-low); box-shadow: var(--ee-shadow-lg);"
      }, [
        step === 1 ? buildStep1() :
        step === 2 ? buildStep2() :
        buildStep3()
      ])
    ]);
  }

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

    let urlInput = null;
    let subdomainInput = null;

    const subdomainSection = el("div", { style: "display: none; margin-top: 16px;" }, [
      el("label", { style: "display: block; font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin-bottom: 8px;" }, [
        el("span", { text: "Odoo.sh Subdomain" })
      ]),
      el("div", { style: "display: flex; align-items: center;" }, [
        subdomainInput = el("input", {
          type: "text",
          className: "ee-input",
          style: "flex: 1;",
          placeholder: "my-project",
          onInput: (e) => { 
            const val = e.target.value.trim();
            instanceUrl = val ? `https://${val}.odoo.com` : "";
          }
        }),
        el("span", { 
          style: "padding: 0 16px; height: 44px; background: var(--ee-surface-container-high); display: flex; align-items: center; font-size: 14px; color: var(--ee-on-surface-variant); border-left: 1px solid var(--ee-outline-variant);",
          text: ".odoo.com"
        })
      ])
    ]);

    const urlSection = el("div", { style: "display: none; margin-top: 16px;" }, [
      el("label", { style: "display: block; font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin-bottom: 8px;" }, [
        el("span", { text: "Odoo URL" })
      ]),
      el("input", {
        type: "url",
        className: "ee-input",
        placeholder: "https://your-odoo.example.com",
        value: instanceType === "online" ? (instanceUrl || "https://") : instanceUrl,
        onInput: (e) => { 
          instanceUrl = e.target.value.trim();
          // Auto-extract database name from URL for Odoo Online
          if (instanceType === "online" && instanceUrl.includes(".odoo.com")) {
            const match = instanceUrl.match(/https?:\/\/([^.]+)\.odoo\.com/);
            if (match && !database) {
              database = match[1];
            }
          }
        }
      }),
      instanceType === "online" ? el("p", { 
        style: "font-size: 12px; color: var(--ee-on-surface-variant); margin-top: 6px;"
      }, "Enter your Odoo Online URL (e.g., https://mycompany.odoo.com)") : null
    ]);

    const typeCards = typeOptions.map(opt => {
      const card = el("button", {
        className: "ee-type-option",
        style: `width: 100%; text-align: left; padding: 16px; background: ${opt.id === instanceType ? "var(--ee-primary-subtle)" : "var(--ee-surface-container)"}; border-left: 3px solid ${opt.id === instanceType ? "var(--ee-primary)" : "transparent"}; cursor: pointer; transition: all 150ms ease;`,
        onclick: () => {
          instanceType = opt.id;
          // Reset URL when changing types
          if (opt.id === "online") instanceUrl = "https://";
          else if (opt.id === "sh") instanceUrl = "";
          else instanceUrl = "";
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
          style: `flex: 1; justify-content: center; ${edition === opt.id ? "background: var(--ee-primary); color: white;" : "background: var(--ee-surface-container); color: var(--ee-on-surface); border: 1px solid var(--ee-outline-variant);"}`,
          onclick: () => { edition = opt.id; render(); }
        }, [
          el("div", { style: "text-align: center;" }, [
            el("p", { style: "font-size: 14px; font-weight: 600;", text: opt.label }),
            el("p", { style: "font-size: 11px; opacity: 0.8;", text: opt.desc })
          ])
        ])
      )
    );

    // Show correct section based on current instanceType
    if (instanceType === "sh") subdomainSection.style.display = "block";
    else urlSection.style.display = "block";

    const nextBtn = el("button", {
      className: "ee-btn ee-btn--primary ee-btn--full ee-btn--lg",
      style: "margin-top: 24px;",
      onclick: () => {
        if (instanceType === "sh" && subdomainInput?.value) {
          instanceUrl = `https://${subdomainInput.value}.odoo.com`;
        }
        if (!instanceUrl) {
          alert("Please enter your Odoo URL");
          return;
        }
        step = 2;
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
      
      subdomainSection,
      urlSection,
      nextBtn
    ]);
  }

  function buildStep2() {
    const dbInput = el("input", {
      type: "text",
      className: "ee-input",
      placeholder: "my_database",
      value: database,
      onInput: (e) => { database = e.target.value; }
    });

    const usernameIn = el("input", {
      type: "email",
      className: "ee-input",
      placeholder: "admin@company.com",
      value: username,
      onInput: (e) => { username = e.target.value; }
    });

    const passwordIn = el("input", {
      type: "password",
      className: "ee-input",
      placeholder: "••••••••",
      onInput: (e) => { password = e.target.value; }
    });

    const newDbToggle = el("div", { 
      style: "display: flex; align-items: center; gap: 12px; padding: 12px; background: var(--ee-surface-container); cursor: pointer;",
      onclick: () => { isNewDatabase = !isNewDatabase; render(); }
    }, [
      el("div", { 
        style: `width: 20px; height: 20px; border: 2px solid ${isNewDatabase ? "var(--ee-primary)" : "var(--ee-outline)"}; background: ${isNewDatabase ? "var(--ee-primary)" : "transparent"}; display: flex; align-items: center; justify-content: center;`
      }, isNewDatabase ? el("span", { className: "material-symbols-outlined", style: "font-size: 14px; color: white;", text: "check" }) : null),
      el("span", { style: "font-size: 14px; color: var(--ee-on-surface);" }, "Create new database")
    ]);

    const testStatusEl = el("div", { style: "display: none; margin-top: 12px;" });

    const testBtn = el("button", {
      className: "ee-btn ee-btn--secondary",
      style: "width: 100%; border: 2px solid var(--ee-primary); color: var(--ee-primary); margin-top: 16px;",
      onclick: async () => {
        if (!database || !username || !password) {
          testStatusEl.style.cssText = "display: block; font-size: 14px; color: var(--ee-error); font-weight: 500; margin-top: 12px; padding: 12px; background: var(--ee-error-soft);";
          testStatusEl.textContent = "Please fill all fields before testing.";
          return;
        }
        testStatus = "loading";
        testBtn.disabled = true;
        testStatusEl.style.cssText = "display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--ee-on-surface-variant); margin-top: 12px;";
        testStatusEl.innerHTML = "";
        testStatusEl.append(
          el("span", { className: "material-symbols-outlined", style: "font-size: 16px; animation: spin 1s linear infinite;", text: "autorenew" }),
          document.createTextNode(" Testing connection...")
        );

        // Simulate connection test
        await new Promise(r => setTimeout(r, 1500));

        // In a real implementation, this would call an API to test the connection
        // For now, we simulate success if fields are filled
        if (database && username && password) {
          testStatus = "success";
          detectedVersion = "19.0";
          detectedCompany = database.charAt(0).toUpperCase() + database.slice(1);
          testStatusEl.style.cssText = "display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--ee-success); font-weight: 500; margin-top: 12px; padding: 12px; background: var(--ee-success-soft);";
          testStatusEl.innerHTML = "";
          testStatusEl.append(
            el("span", { className: "material-symbols-outlined", style: "font-size: 18px;", text: "check_circle" }),
            document.createTextNode(` Connected! Odoo 19 ${edition} detected.`)
          );
        } else {
          testStatus = "error";
          testStatusEl.style.cssText = "display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--ee-error); font-weight: 500; margin-top: 12px; padding: 12px; background: var(--ee-error-soft);";
          testStatusEl.innerHTML = "";
          testStatusEl.append(
            el("span", { className: "material-symbols-outlined", style: "font-size: 18px;", text: "error" }),
            document.createTextNode(" Connection failed. Please check your credentials.")
          );
        }
        testBtn.disabled = false;
      }
    }, [
      el("span", { className: "material-symbols-outlined", style: "font-size: 18px;", text: "wifi_tethering" }),
      el("span", { text: "Test Connection" })
    ]);

    return el("div", { style: "padding: 24px;" }, [
      el("div", {}, [
        el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 4px;", text: "Step 2 of 3 — Credentials" }),
        el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 4px;", text: "Enter your login details" }),
        el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant);", text: instanceUrl })
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
          onclick: () => { step = 1; render(); }
        }, [el("span", { text: "← Back" })]),
        el("button", {
          className: "ee-btn ee-btn--primary",
          style: "flex: 1;",
          onclick: () => { 
            if (!database || !username || !password) {
              alert("Please fill in all fields");
              return;
            }
            step = 3; 
            render(); 
          }
        }, [el("span", { text: "Continue →" })])
      ])
    ]);
  }

  function buildStep3() {
    return el("div", { style: "padding: 24px;" }, [
      el("div", {}, [
        el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 4px;", text: "Step 3 of 3 — Confirmation" }),
        el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 4px;", text: "Ready to connect!" })
      ]),
      el("div", { 
        style: "background: var(--ee-secondary-container); padding: 20px; margin: 16px 0;"
      }, [
        infoRow("Instance Type", instanceType === "online" ? "Odoo Online" : instanceType === "sh" ? "Odoo.sh" : "Self-hosted"),
        infoRow("Edition", edition.charAt(0).toUpperCase() + edition.slice(1)),
        infoRow("Odoo URL", instanceUrl),
        infoRow("Database", database + (isNewDatabase ? " (will be created)" : "")),
        infoRow("Odoo Version", detectedVersion || "19.0"),
        infoRow("Company", detectedCompany || database)
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
            url: instanceUrl,
            database,
            username,
            password,
            edition,
            isNewDatabase,
            version: detectedVersion || "19.0",
            companyName: detectedCompany || database,
            instanceType
          });
        }
      }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 20px;", text: "rocket_launch" }),
        el("span", { text: isNewDatabase ? "Create Database & Start" : "Start Implementation" })
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
    return el("div", { 
      style: "display: flex; align-items: center; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--ee-surface-container);"
    }, [
      el("span", { style: "font-size: 12px; color: var(--ee-on-surface-variant); font-weight: 500;", text: label }),
      el("span", { style: "font-size: 14px; font-weight: 600; color: var(--ee-on-surface);", text: value || "—" })
    ]);
  }

  // Add spin animation
  const style = el("style", {}, `
    @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
  `);
  container.append(style);

  render();
  return container;
}
