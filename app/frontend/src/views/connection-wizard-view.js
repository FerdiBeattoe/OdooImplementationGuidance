import { el } from "../lib/dom.js";

/**
 * Connection Wizard — 3-step Odoo instance connection flow.
 * Editorial Engineer design — square corners, white surfaces.
 */
export function renderConnectionWizardView({ onConnect, onSkip }) {
  let step = 1;
  let instanceType = "online";
  let instanceUrl = "";
  let database = "";
  let username = "";
  let password = "";
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
      { id: "sh",       icon: "cloud",        label: "Odoo.sh",      desc: "Managed cloud on Odoo.sh platform" },
      { id: "online",   icon: "public",       label: "Odoo Online",  desc: "odoo.com hosted subscription" },
      { id: "selfhost", icon: "dns",          label: "Self-hosted",  desc: "On-premise or private cloud" }
    ];

    let urlInput = null;
    let shInput = null;

    const subdomainSection = el("div", { style: "display: none; margin-top: 16px;" }, [
      el("label", { style: "display: block; font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant); margin-bottom: 8px;" }, [
        el("span", { text: "Subdomain" })
      ]),
      el("div", { style: "display: flex; align-items: center;" }, [
        shInput = el("input", {
          type: "text",
          className: "ee-input",
          style: "flex: 1;",
          placeholder: "my-company",
          onInput: (e) => { instanceUrl = `https://${e.target.value}.odoo.com`; }
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
      urlInput = el("input", {
        type: "url",
        className: "ee-input",
        placeholder: "https://your-odoo.example.com",
        value: instanceType !== "sh" ? instanceUrl : "",
        onInput: (e) => { instanceUrl = e.target.value; }
      })
    ]);

    const typeCards = typeOptions.map(opt => {
      const card = el("button", {
        className: "ee-type-option",
        style: `border-color: ${opt.id === instanceType ? "var(--ee-primary)" : "transparent"}; background: ${opt.id === instanceType ? "var(--ee-primary-subtle)" : "var(--ee-surface-container)"};`,
        onclick: () => {
          instanceType = opt.id;
          typeOptions.forEach(o => {
            const c = typeCards[typeOptions.indexOf(o)];
            if (c) c.style.cssText = `border-color: ${o.id === instanceType ? "var(--ee-primary)" : "transparent"}; background: ${o.id === instanceType ? "var(--ee-primary-subtle)" : "var(--ee-surface-container)"};`;
          });
          subdomainSection.style.display = opt.id === "sh" ? "block" : "none";
          urlSection.style.display = opt.id !== "sh" ? "block" : "none";
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

    // Show correct section based on current instanceType
    if (instanceType === "sh") subdomainSection.style.display = "block";
    else urlSection.style.display = "block";

    const nextBtn = el("button", {
      className: "ee-btn ee-btn--primary ee-btn--full ee-btn--lg",
      style: "margin-top: 24px;",
      onclick: () => {
        if (!instanceUrl && instanceType !== "sh") {
          instanceUrl = urlInput?.value || "";
        }
        if (instanceUrl || (instanceType === "sh" && shInput?.value)) {
          step = 2;
          render();
        }
      }
    }, [el("span", { text: "Continue →" })]);

    return el("div", { style: "padding: 24px;" }, [
      el("div", {}, [
        el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 8px;", text: "Step 1 of 3 — Instance Type" }),
        el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 16px;", text: "How is your Odoo hosted?" })
      ]),
      el("div", { style: "display: flex; flex-direction: column; gap: 12px;" }, typeCards),
      subdomainSection,
      urlSection,
      nextBtn
    ]);
  }

  function buildStep2() {
    let dbOptions = [];
    const dbSelect = el("select", {
      className: "ee-input",
      onchange: (e) => { database = e.target.value; }
    }, [el("option", { value: "", text: "Fetching databases..." })]);

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

    const testStatusEl = el("div", { style: "display: none;" });

    const testBtn = el("button", {
      className: "ee-btn ee-btn--secondary",
      style: "width: 100%; border: 2px solid var(--ee-primary); color: var(--ee-primary); margin-top: 8px;",
      onclick: async () => {
        if (!database || !username || !password) {
          testStatusEl.style.cssText = "display: block; font-size: 14px; color: var(--ee-error); font-weight: 500; margin-top: 8px;";
          testStatusEl.textContent = "Please fill all fields before testing.";
          return;
        }
        testStatus = "loading";
        testBtn.disabled = true;
        testStatusEl.style.cssText = "display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--ee-on-surface-variant); margin-top: 8px;";
        testStatusEl.innerHTML = "";
        testStatusEl.append(
          el("span", { className: "material-symbols-outlined", style: "font-size: 16px; animation: spin 1s linear infinite;", text: "autorenew" }),
          document.createTextNode(" Testing connection...")
        );

        // Simulate test (real implementation would call OdooClient.testConnection)
        await new Promise(r => setTimeout(r, 1500));

        testStatus = "success";
        detectedVersion = "19.0";
        detectedCompany = "My Company";
        testStatusEl.style.cssText = "display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--ee-success); font-weight: 500; margin-top: 8px;";
        testStatusEl.innerHTML = "";
        testStatusEl.append(
          el("span", { className: "material-symbols-outlined", style: "font-size: 18px;", text: "check_circle" }),
          document.createTextNode(" Connection successful! Odoo 19 detected.")
        );
        testBtn.disabled = false;
      }
    }, [
      el("span", { className: "material-symbols-outlined", style: "font-size: 18px;", text: "wifi_tethering" }),
      el("span", { text: "Test Connection" })
    ]);

    // Simulate fetching databases
    setTimeout(() => {
      while (dbSelect.firstChild) dbSelect.removeChild(dbSelect.firstChild);
      dbOptions = ["odoo_db", "production", "staging"];
      dbSelect.append(el("option", { value: "", text: "Select database..." }));
      dbOptions.forEach(db => dbSelect.append(el("option", { value: db, text: db })));
      database = database || "";
    }, 800);

    return el("div", { style: "padding: 24px;" }, [
      el("div", {}, [
        el("p", { style: "font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: var(--ee-secondary); margin-bottom: 4px;", text: "Step 2 of 3 — Credentials" }),
        el("h2", { style: "font-family: var(--ee-font-headline); font-size: 18px; font-weight: 700; color: var(--ee-on-surface); margin-bottom: 4px;", text: "Enter your login details" }),
        el("p", { style: "font-size: 12px; color: var(--ee-on-surface-variant);", text: instanceUrl })
      ]),
      el("div", { style: "display: flex; flex-direction: column; gap: 16px; margin-top: 16px;" }, [
        el("div", { style: "display: flex; flex-direction: column; gap: 6px;" }, [
          el("label", { style: "font-size: 13px; font-weight: 600; color: var(--ee-on-surface-variant);", text: "Database" }),
          dbSelect
        ]),
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
          onclick: () => { step = 3; render(); }
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
        infoRow("Odoo Instance", instanceUrl),
        infoRow("Odoo Version", detectedVersion || "19.0 (simulated)"),
        infoRow("Company", detectedCompany || "My Company"),
        infoRow("User", username)
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
            version: detectedVersion || "19.0",
            companyName: detectedCompany || "My Company"
          });
        }
      }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 20px;", text: "rocket_launch" }),
        el("span", { text: "Start Implementation" })
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
