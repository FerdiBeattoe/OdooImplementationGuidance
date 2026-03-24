import { el } from "../lib/dom.js";

/**
 * Connection Wizard — 3-step Odoo instance connection flow.
 * Shown before main app if no instance is connected.
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
    className: "min-h-screen bg-background flex items-center justify-center p-6"
  });

  function render() {
    while (container.firstChild) container.removeChild(container.firstChild);
    container.append(buildStep());
  }

  function buildStep() {
    return el("div", { className: "w-full max-w-xl" }, [
      // Header
      el("div", { className: "text-center mb-8" }, [
        el("div", { className: "w-16 h-16 rounded-2xl primary-gradient flex items-center justify-center mx-auto mb-4 shadow-lg" }, [
          el("span", { className: "material-symbols-outlined text-white text-3xl", text: "hub" })
        ]),
        el("h1", { className: "font-headline text-2xl font-bold text-on-surface", text: "Connect to Odoo 19" }),
        el("p", { className: "text-sm text-on-surface-variant mt-2", text: "Link your Odoo instance to enable wizard push and live data sync." })
      ]),
      // Step indicator
      el("div", { className: "flex items-center justify-center gap-3 mb-8" }, [1, 2, 3].map(n =>
        el("div", { className: "flex items-center gap-2" }, [
          el("div", {
            className: `w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              n < step ? "bg-secondary text-on-secondary" :
              n === step ? "bg-primary text-on-primary ring-4 ring-primary-fixed/50" :
              "bg-surface-container-high text-outline"
            }`
          }, [
            n < step
              ? el("span", { className: "material-symbols-outlined text-[16px]", style: "font-variation-settings:'FILL' 1", text: "check" })
              : el("span", { text: String(n) })
          ]),
          n < 3 ? el("div", { className: `w-8 h-0.5 ${n < step ? "bg-secondary" : "bg-surface-container-high"}` }) : null
        ])
      )),
      // Card
      el("div", { className: "bg-surface-container-lowest rounded-2xl shadow-xl border border-outline-variant/10 overflow-hidden" }, [
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

    const subdomainSection = el("div", { className: "space-y-3", style: "display: none" }, [
      el("label", { className: "block text-sm font-semibold text-on-surface-variant" }, [
        el("span", { text: "Subdomain" })
      ]),
      el("div", { className: "flex items-center gap-0" }, [
        shInput = el("input", {
          type: "text",
          className: "flex-1 h-11 px-4 bg-surface-container-high border-0 border-b-2 border-outline focus:border-primary rounded-l-lg text-sm",
          placeholder: "my-company",
          onInput: (e) => { instanceUrl = `https://${e.target.value}.odoo.com`; }
        }),
        el("span", { className: "h-11 px-4 bg-surface-container-high border-0 border-b-2 border-outline text-sm text-on-surface-variant flex items-center rounded-r-lg", text: ".odoo.com" })
      ])
    ]);

    const urlSection = el("div", { className: "space-y-3", style: "display: none" }, [
      el("label", { className: "block text-sm font-semibold text-on-surface-variant" }, [
        el("span", { text: "Odoo URL" })
      ]),
      urlInput = el("input", {
        type: "url",
        className: "w-full h-11 px-4 bg-surface-container-high border-0 border-b-2 border-outline focus:border-primary rounded-lg text-sm",
        placeholder: "https://your-odoo.example.com",
        value: instanceType !== "sh" ? instanceUrl : "",
        onInput: (e) => { instanceUrl = e.target.value; }
      })
    ]);

    const typeCards = typeOptions.map(opt => {
      const card = el("button", {
        className: `w-full text-left p-4 rounded-xl border-2 transition-all ${opt.id === instanceType ? "border-primary bg-primary-fixed/20" : "border-outline-variant/20 hover:border-primary/30"}`,
        onclick: () => {
          instanceType = opt.id;
          typeOptions.forEach(o => {
            const c = typeCards[typeOptions.indexOf(o)];
            if (c) c.className = `w-full text-left p-4 rounded-xl border-2 transition-all ${o.id === instanceType ? "border-primary bg-primary-fixed/20" : "border-outline-variant/20 hover:border-primary/30"}`;
          });
          subdomainSection.style.display = opt.id === "sh" ? "block" : "none";
          urlSection.style.display = opt.id !== "sh" ? "block" : "none";
          if (opt.id === "selfhost") {
            const warn = el("p", { className: "text-xs text-warning mt-1", text: "⚠ Warning: HTTPS is required for production. Self-signed certificates may cause issues." });
            urlSection.append(warn);
          }
        }
      }, [
        el("div", { className: "flex items-center gap-3" }, [
          el("span", { className: `material-symbols-outlined text-[22px] ${opt.id === instanceType ? "text-primary" : "text-on-surface-variant"}`, text: opt.icon }),
          el("div", {}, [
            el("p", { className: "text-sm font-bold text-on-surface", text: opt.label }),
            el("p", { className: "text-xs text-on-surface-variant", text: opt.desc })
          ])
        ])
      ]);
      return card;
    });

    // Show correct section based on current instanceType
    if (instanceType === "sh") subdomainSection.style.display = "block";
    else urlSection.style.display = "block";

    const nextBtn = el("button", {
      className: "w-full bg-primary text-on-primary font-bold text-sm py-3 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm",
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

    return el("div", { className: "p-6 space-y-6" }, [
      el("div", {}, [
        el("p", { className: "text-xs font-bold uppercase tracking-widest text-secondary mb-3", text: "Step 1 of 3 — Instance Type" }),
        el("h2", { className: "font-headline text-lg font-bold text-on-surface mb-4", text: "How is your Odoo hosted?" })
      ]),
      el("div", { className: "space-y-3" }, typeCards),
      subdomainSection,
      urlSection,
      nextBtn
    ]);
  }

  function buildStep2() {
    let dbOptions = [];
    const dbSelect = el("select", {
      className: "w-full h-11 px-4 bg-surface-container-high border-0 border-b-2 border-outline focus:border-primary rounded-lg text-sm",
      onchange: (e) => { database = e.target.value; }
    }, [el("option", { value: "", text: "Fetching databases..." })]);

    const usernameIn = el("input", {
      type: "email",
      className: "w-full h-11 px-4 bg-surface-container-high border-0 border-b-2 border-outline focus:border-primary rounded-lg text-sm",
      placeholder: "admin@company.com",
      value: username,
      onInput: (e) => { username = e.target.value; }
    });

    const passwordIn = el("input", {
      type: "password",
      className: "w-full h-11 px-4 bg-surface-container-high border-0 border-b-2 border-outline focus:border-primary rounded-lg text-sm",
      placeholder: "••••••••",
      onInput: (e) => { password = e.target.value; }
    });

    const testStatusEl = el("div", { className: "hidden" });

    const testBtn = el("button", {
      className: "flex items-center justify-center gap-2 w-full border-2 border-primary text-primary font-semibold text-sm py-2.5 rounded-xl hover:bg-primary-fixed/10 transition-all",
      onclick: async () => {
        if (!database || !username || !password) {
          testStatusEl.className = "text-sm text-error font-medium py-2";
          testStatusEl.textContent = "Please fill all fields before testing.";
          return;
        }
        testStatus = "loading";
        testBtn.disabled = true;
        testStatusEl.className = "flex items-center gap-2 text-sm text-on-surface-variant py-2";
        testStatusEl.innerHTML = "";
        testStatusEl.append(
          el("span", { className: "material-symbols-outlined animate-spin text-[16px]", text: "autorenew" }),
          document.createTextNode(" Testing connection...")
        );

        // Simulate test (real implementation would call OdooClient.testConnection)
        await new Promise(r => setTimeout(r, 1500));

        testStatus = "success";
        detectedVersion = "19.0";
        detectedCompany = "My Company";
        testStatusEl.className = "flex items-center gap-2 text-sm text-green-700 font-medium py-2";
        testStatusEl.innerHTML = "";
        testStatusEl.append(
          el("span", { className: "material-symbols-outlined text-[18px]", text: "check_circle" }),
          document.createTextNode(" Connection successful! Odoo 19 detected.")
        );
        testBtn.disabled = false;
      }
    }, [
      el("span", { className: "material-symbols-outlined text-[18px]", text: "wifi_tethering" }),
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

    return el("div", { className: "p-6 space-y-5" }, [
      el("div", {}, [
        el("p", { className: "text-xs font-bold uppercase tracking-widest text-secondary mb-1", text: "Step 2 of 3 — Credentials" }),
        el("h2", { className: "font-headline text-lg font-bold text-on-surface mb-1", text: "Enter your login details" }),
        el("p", { className: "text-xs text-on-surface-variant", text: instanceUrl })
      ]),
      el("div", { className: "space-y-4" }, [
        el("div", { className: "space-y-1.5" }, [
          el("label", { className: "block text-sm font-semibold text-on-surface-variant", text: "Database" }),
          dbSelect
        ]),
        el("div", { className: "space-y-1.5" }, [
          el("label", { className: "block text-sm font-semibold text-on-surface-variant", text: "Email / Username" }),
          usernameIn
        ]),
        el("div", { className: "space-y-1.5" }, [
          el("label", { className: "block text-sm font-semibold text-on-surface-variant", text: "Password" }),
          passwordIn
        ])
      ]),
      testBtn,
      testStatusEl,
      el("div", { className: "flex gap-3" }, [
        el("button", {
          className: "flex-1 border border-outline-variant text-on-surface font-semibold text-sm py-2.5 rounded-xl hover:bg-surface-container transition-all",
          onclick: () => { step = 1; render(); }
        }, [el("span", { text: "← Back" })]),
        el("button", {
          className: "flex-1 bg-primary text-on-primary font-bold text-sm py-2.5 rounded-xl hover:opacity-90 transition-all",
          onclick: () => { step = 3; render(); }
        }, [el("span", { text: "Continue →" })])
      ])
    ]);
  }

  function buildStep3() {
    return el("div", { className: "p-6 space-y-6" }, [
      el("div", {}, [
        el("p", { className: "text-xs font-bold uppercase tracking-widest text-secondary mb-1", text: "Step 3 of 3 — Confirmation" }),
        el("h2", { className: "font-headline text-lg font-bold text-on-surface mb-1", text: "Ready to connect!" })
      ]),
      el("div", { className: "bg-secondary-container/30 rounded-xl p-5 space-y-3" }, [
        infoRow("Odoo Instance", instanceUrl),
        infoRow("Odoo Version", detectedVersion || "19.0 (simulated)"),
        infoRow("Company", detectedCompany || "My Company"),
        infoRow("User", username)
      ]),
      el("div", { className: "p-3 bg-surface-container rounded-lg text-xs text-on-surface-variant" }, [
        el("p", { text: "🔒 Your credentials are stored only in this browser session and never saved to disk or sent to third parties." })
      ]),
      el("button", {
        className: "w-full bg-secondary text-on-secondary font-bold text-base py-3.5 rounded-xl hover:opacity-90 active:scale-95 transition-all shadow-sm",
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
        el("span", { className: "material-symbols-outlined text-[20px]", text: "rocket_launch" }),
        el("span", { className: "ml-2", text: "Start Implementation" })
      ]),
      el("div", { className: "flex gap-3" }, [
        el("button", {
          className: "flex-1 border border-outline-variant text-on-surface font-medium text-sm py-2 rounded-xl hover:bg-surface-container transition-all",
          onclick: () => { step = 2; render(); }
        }, [el("span", { text: "← Back" })]),
        el("button", {
          className: "flex-1 text-sm text-on-surface-variant hover:underline",
          onclick: onSkip
        }, [el("span", { text: "Skip for now" })])
      ])
    ]);
  }

  function infoRow(label, value) {
    return el("div", { className: "flex items-center justify-between py-1" }, [
      el("span", { className: "text-xs text-on-surface-variant font-medium", text: label }),
      el("span", { className: "text-sm font-bold text-on-surface", text: value || "—" })
    ]);
  }

  render();
  return container;
}
