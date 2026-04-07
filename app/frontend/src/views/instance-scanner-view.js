import { getDomainSupport } from "/shared/index.js";
import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { getState, setCurrentView } from "../state/app-store.js";
import { onboardingStore } from "../state/onboarding-store.js";
import { pipelineStore } from "../state/pipeline-store.js";

const NAVY = "#0c1a30";
const AMBER = "#f59e0b";
const SUCCESS = "#16a34a";
const DANGER = "#dc2626";
const MUTED = "#6b7280";
const BORDER = "#e2e8f0";
const CARD = "background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px;";
const FIELD = "width: 100%; border: 1px solid #d1d5db; border-radius: 6px; padding: 10px 12px; font-size: 14px; color: #111827; font-family: Inter, sans-serif; background: #ffffff; box-sizing: border-box;";
const FADED_AMBER = "background: rgba(245,158,11,0.12); border: 1px solid rgba(245,158,11,0.3); color: #92400e; border-radius: 6px; font-family: Inter, sans-serif; font-weight: 600; cursor: pointer;";
const SECONDARY = "background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.15); color: #0c1a30; border-radius: 6px; font-family: Inter, sans-serif; font-weight: 600; cursor: pointer;";
const PRIMARY = "background: #0c1a30; border: 1px solid #0c1a30; color: #ffffff; border-radius: 6px; font-family: Inter, sans-serif; font-weight: 600; cursor: pointer;";
const DOMAIN_SUPPORT_ALIASES = {
  foundation: "foundation-company-localization",
  users_roles: "users-roles-security",
  master_data: "master-data",
  manufacturing: "manufacturing-mrp",
  website_ecommerce: "website-ecommerce",
};
const MODULE_LABELS = {
  account: "Accounting",
  approvals: "Approvals",
  base: "Base",
  contacts: "Contacts",
  crm: "CRM",
  documents: "Documents",
  hr: "HR",
  mrp: "Manufacturing",
  mrp_plm: "PLM",
  point_of_sale: "Point of Sale",
  product: "Products",
  project: "Projects",
  purchase: "Purchase",
  quality_control: "Quality",
  sale: "Sales",
  sale_management: "Sales",
  sign: "Sign",
  stock: "Inventory",
  uom: "Units of Measure",
  website: "Website",
  website_sale: "Website / eCommerce",
};

function renderScannerIcon(name, size) {
  const normalized = String(name || "")
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/([A-Za-z])([0-9])/g, "$1-$2")
    .replace(/([0-9])([A-Za-z])/g, "$1-$2")
    .toLowerCase();

  return lucideIcon(normalized, size);
}

function trimString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function humanizeKey(value) {
  return String(value || "")
    .split(/[_\-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function formatTimestamp(value) {
  if (!value) return "Date unavailable";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Date unavailable";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(parsed);
}

function readJsonResponse(response) {
  return response.text().then((raw) => {
    if (!raw) return {};
    try {
      return JSON.parse(raw);
    } catch {
      return {};
    }
  });
}

function buildHeaders(token, includeJson = true) {
  const headers = {};
  if (includeJson) {
    headers["Content-Type"] = "application/json";
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  return headers;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await readJsonResponse(response);

  if (!response.ok) {
    throw new Error(payload.error || payload.detail || "Request failed.");
  }

  if (payload?.error) {
    throw new Error(payload.error);
  }

  return payload;
}

function resolveProjectId(project) {
  const appState = getState();
  const onboardingState = onboardingStore.getState();
  const runtimeState = pipelineStore.getState().runtime_state;

  return (
    runtimeState?.project_identity?.project_id ||
    onboardingState?.connection?.project_id ||
    project?.projectIdentity?.projectId ||
    appState?.activeProject?.projectIdentity?.projectId ||
    null
  );
}

function resolveTeamMembership(members, onboardingState) {
  const currentUserId = onboardingState?.user?.id || null;
  const currentUserEmail = String(onboardingState?.user?.email || "").trim().toLowerCase();
  const activeMembers = Array.isArray(members) ? members.filter((member) => member?.accepted_at) : [];

  return activeMembers.find((member) => {
    if (currentUserId && member.account_id === currentUserId) {
      return true;
    }

    return (
      !currentUserId &&
      currentUserEmail &&
      String(member.email || "").trim().toLowerCase() === currentUserEmail
    );
  }) || null;
}

function resolveActiveDomains() {
  const runtimeDomains = pipelineStore.getState().runtime_state?.activated_domains?.domains;
  if (Array.isArray(runtimeDomains) && runtimeDomains.length > 0) {
    return runtimeDomains
      .map((domain) => {
        if (typeof domain === "string") return domain;
        if (domain?.activated === false) return null;
        return domain?.domain_id || domain?.id || null;
      })
      .filter(Boolean);
  }

  const previewDomains = onboardingStore.getState()?.activated_domains_preview;
  if (Array.isArray(previewDomains)) {
    return previewDomains.filter((domain) => typeof domain === "string" && domain.trim());
  }

  return [];
}

function getSupportDomainId(domainId) {
  if (!domainId) return "";
  return DOMAIN_SUPPORT_ALIASES[domainId] || String(domainId).replace(/_/g, "-");
}

function moduleLabel(moduleName) {
  return MODULE_LABELS[moduleName] || humanizeKey(moduleName);
}

function buildRequiredModules(domainIds) {
  const modules = new Map();

  for (const domainId of domainIds) {
    const support = getDomainSupport(getSupportDomainId(domainId));
    const domainLabel = humanizeKey(domainId);
    const domainSummary = String(support.summary || "").trim();

    for (const moduleName of support.moduleNames || []) {
      if (!moduleName) continue;
      if (!modules.has(moduleName)) {
        modules.set(moduleName, {
          name: moduleName,
          label: moduleLabel(moduleName),
          description: domainSummary || `Required for ${domainLabel}.`,
          domains: [domainLabel],
        });
        continue;
      }

      const current = modules.get(moduleName);
      if (!current.domains.includes(domainLabel)) {
        current.domains.push(domainLabel);
      }
    }
  }

  return [...modules.values()]
    .map((module) => ({
      ...module,
      description: module.domains.length > 1
        ? `Required for ${module.domains.join(", ")}.`
        : module.description,
    }))
    .sort((left, right) => left.label.localeCompare(right.label));
}

function dataCountRows(scanResult) {
  const counts = scanResult?.data_counts || {};
  return [
    { key: "res.users", label: "Users", value: Number(counts["res.users"] || 0) },
    { key: "res.partner", label: "Partners", value: Number(counts["res.partner"] || 0) },
    { key: "account.account", label: "Chart of Accounts", value: Number(counts["account.account"] || 0) },
    { key: "product.template", label: "Products", value: Number(counts["product.template"] || 0) },
    { key: "sale.order", label: "Sales Orders", value: Number(counts["sale.order"] || 0) },
    { key: "purchase.order", label: "Purchase Orders", value: Number(counts["purchase.order"] || 0) },
    { key: "stock.picking", label: "Stock", value: Number(counts["stock.picking"] || 0) },
  ];
}

function scannerStyles() {
  return `
    @keyframes scanner-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .scanner-spin { animation: scanner-spin 1s linear infinite; }
    .scanner-results-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 24px;
      align-items: start;
    }
    .scanner-module-list {
      max-height: 320px;
      overflow: auto;
    }
    @media (max-width: 1100px) {
      .scanner-results-grid { grid-template-columns: 1fr; }
    }
  `;
}

function cardTitle(iconName, text) {
  return el("div", {
    style: "display: flex; align-items: center; gap: 10px; margin-bottom: 16px;",
  }, [
    (() => {
      const icon = renderScannerIcon(iconName, 16);
      icon.style.color = NAVY;
      return icon;
    })(),
    el("span", {
      style: `font-size: 16px; font-weight: 700; color: ${NAVY};`,
      text,
    }),
  ]);
}

function fieldShell(label, input, note = null) {
  return el("label", {
    style: "display: flex; flex-direction: column; gap: 6px;",
  }, [
    el("span", {
      style: "font-size: 13px; font-weight: 600; color: #374151;",
      text: label,
    }),
    input,
    note,
  ]);
}

export function renderInstanceScannerView({ project, onNavigate } = {}) {
  const container = el("section", {
    style: "max-width: 1240px; margin: 0 auto; padding: 32px; font-family: Inter, sans-serif; display: flex; flex-direction: column; gap: 24px;",
    dataset: { testid: "instance-scanner-view" },
  });
  const styleEl = el("style", { text: scannerStyles() });
  const contentEl = el("div");
  const modalHost = el("div");
  const toastHost = el("div", {
    style: "position: fixed; right: 24px; bottom: 24px; z-index: 110; display: flex; flex-direction: column; gap: 12px;",
  });
  const state = {
    form: {
      url: onboardingStore.getState()?.connection?.url || "",
      database: onboardingStore.getState()?.connection?.database || "",
      username: onboardingStore.getState()?.user?.email || "",
      password: "",
    },
    scanning: false,
    scanError: "",
    scanResult: null,
    scanContext: null,
    moduleFilter: "",
    members: [],
    teamError: "",
    loadingTeam: false,
    installRowErrors: {},
    installModal: {
      open: false,
      module: null,
      password: "",
      error: "",
      submitting: false,
    },
    sessionInstalled: new Set(),
  };
  let toastTimer = null;
  let latestLoadId = 0;

  container.append(styleEl, contentEl, modalHost, toastHost);

  function navigate(view) {
    if (onNavigate) {
      onNavigate(view);
      return;
    }
    setCurrentView(view);
  }

  function showToast(message) {
    clearNode(toastHost);
    if (toastTimer) {
      clearTimeout(toastTimer);
      toastTimer = null;
    }

    toastHost.append(el("div", {
      style: "background: #0c1a30; color: #ffffff; padding: 12px 20px; border-radius: 6px; font-size: 14px; box-shadow: 0 10px 25px rgba(12,26,48,0.18); max-width: 320px;",
      text: message,
    }));

    toastTimer = setTimeout(() => {
      clearNode(toastHost);
      toastTimer = null;
    }, 3000);
  }

  function derivedState() {
    const onboardingState = onboardingStore.getState();
    const projectId = resolveProjectId(project);
    const currentMembership = resolveTeamMembership(state.members, onboardingState);
    const isProjectLead = currentMembership?.role === "project_lead";
    const activeDomains = resolveActiveDomains();
    const requiredModules = buildRequiredModules(activeDomains);
    const installedModules = Array.isArray(state.scanResult?.modules_installed) ? state.scanResult.modules_installed : [];
    const installedSet = new Set(installedModules.map((module) => String(module.name || "").trim()).filter(Boolean));
    const filteredModules = installedModules
      .filter((module) => {
        const query = trimString(state.moduleFilter).toLowerCase();
        if (!query) return true;
        const label = String(module.label || module.name || "").toLowerCase();
        const name = String(module.name || "").toLowerCase();
        return label.includes(query) || name.includes(query);
      })
      .sort((left, right) => String(left.label || left.name || "").localeCompare(String(right.label || right.name || "")));
    const missingRequiredModules = requiredModules.filter((module) => !installedSet.has(module.name));
    const trackedModuleRows = requiredModules.filter(
      (module) => missingRequiredModules.some((candidate) => candidate.name === module.name) || state.sessionInstalled.has(module.name)
    );

    return {
      onboardingState,
      projectId,
      currentMembership,
      isProjectLead,
      activeDomains,
      requiredModules,
      installedSet,
      filteredModules,
      missingRequiredModules,
      trackedModuleRows,
    };
  }

  async function loadMembers() {
    const onboardingState = onboardingStore.getState();
    const projectId = resolveProjectId(project);
    const hasUserIdentity = Boolean(
      onboardingState?.user?.id ||
      String(onboardingState?.user?.email || "").trim()
    );

    if (!projectId || !hasUserIdentity) {
      state.members = [];
      state.teamError = "";
      render();
      return;
    }

    const requestId = ++latestLoadId;
    state.loadingTeam = true;
    state.teamError = "";
    render();

    try {
      const payload = await requestJson(`/api/team/${encodeURIComponent(projectId)}`, {
        method: "GET",
        headers: buildHeaders(onboardingState?.sessionToken || null, false),
      });

      if (requestId !== latestLoadId) {
        return;
      }

      state.members = Array.isArray(payload.members) ? payload.members : [];
      state.teamError = "";
    } catch (error) {
      if (requestId !== latestLoadId) {
        return;
      }

      state.members = [];
      state.teamError = error instanceof Error ? error.message : "Failed to load team members.";
    } finally {
      if (requestId === latestLoadId) {
        state.loadingTeam = false;
        render();
      }
    }
  }

  async function submitScan() {
    const url = trimString(state.form.url);
    const database = trimString(state.form.database);
    const username = trimString(state.form.username);
    const password = state.form.password;

    if (!url || !database || !username || !password) {
      state.scanError = "All four fields are required.";
      render();
      return;
    }

    state.scanning = true;
    state.scanError = "";
    render();

    try {
      const token = onboardingStore.getState()?.sessionToken || null;
      const payload = await requestJson("/api/odoo/scan", {
        method: "POST",
        headers: buildHeaders(token, true),
        body: JSON.stringify({ url, database, username, password, projectId: resolveProjectId(project) }),
      });

      state.scanning = false;
      state.scanResult = payload;
      state.scanContext = { url, database, username };
      state.form.password = "";
      state.moduleFilter = "";
      state.installRowErrors = {};
      state.sessionInstalled = new Set();
      state.installModal = {
        open: false,
        module: null,
        password: "",
        error: "",
        submitting: false,
      };
      render();
    } catch (error) {
      state.scanning = false;
      state.scanError = error instanceof Error ? error.message : "Scan failed.";
      render();
    }
  }

  function openInstallModal(module) {
    state.installModal = {
      open: true,
      module,
      password: "",
      error: "",
      submitting: false,
    };
    render();
  }

  function closeInstallModal() {
    state.installModal = {
      open: false,
      module: null,
      password: "",
      error: "",
      submitting: false,
    };
    render();
  }

  async function confirmInstall() {
    const { module } = state.installModal;
    const { projectId } = derivedState();

    if (!module || !state.scanContext) {
      state.installModal.error = "Module install context is unavailable.";
      render();
      return;
    }

    if (!projectId) {
      state.installModal.error = "Project ID is unavailable.";
      render();
      return;
    }

    if (!state.installModal.password) {
      state.installModal.error = "Password is required.";
      render();
      return;
    }

    state.installModal.submitting = true;
    state.installModal.error = "";
    state.installRowErrors = {
      ...state.installRowErrors,
      [module.name]: "",
    };
    render();

    try {
      const token = onboardingStore.getState()?.sessionToken || null;
      await requestJson("/api/odoo/install-module", {
        method: "POST",
        headers: buildHeaders(token, true),
        body: JSON.stringify({
          url: state.scanContext.url,
          database: state.scanContext.database,
          username: state.scanContext.username,
          password: state.installModal.password,
          moduleName: module.name,
          projectId,
        }),
      });

      const existingModules = Array.isArray(state.scanResult?.modules_installed)
        ? state.scanResult.modules_installed
        : [];
      if (!existingModules.some((entry) => entry.name === module.name)) {
        state.scanResult = {
          ...state.scanResult,
          modules_installed: [
            ...existingModules,
            { name: module.name, label: module.label, state: "installed" },
          ],
        };
      }
      state.sessionInstalled.add(module.name);
      closeInstallModal();
      showToast(`${module.label} installed successfully`);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Module install failed.";
      state.installModal.submitting = false;
      state.installModal.error = message;
      state.installRowErrors = {
        ...state.installRowErrors,
        [module.name]: message,
      };
      render();
    }
  }

  function renderScanForm() {
    const urlInput = el("input", {
      type: "text",
      value: state.form.url,
      placeholder: "https://mycompany.odoo.com",
      style: FIELD,
      onInput: (event) => {
        state.form.url = event.target.value;
      },
      dataset: { testid: "scanner-url-input" },
    });
    const databaseInput = el("input", {
      type: "text",
      value: state.form.database,
      placeholder: "mycompany",
      style: FIELD,
      onInput: (event) => {
        state.form.database = event.target.value;
      },
      dataset: { testid: "scanner-database-input" },
    });
    const usernameInput = el("input", {
      type: "email",
      value: state.form.username,
      placeholder: "admin@mycompany.com",
      style: FIELD,
      onInput: (event) => {
        state.form.username = event.target.value;
      },
      dataset: { testid: "scanner-username-input" },
    });
    const passwordInput = el("input", {
      type: "password",
      value: state.form.password,
      placeholder: "",
      style: FIELD,
      onInput: (event) => {
        state.form.password = event.target.value;
      },
      dataset: { testid: "scanner-password-input" },
    });
    const lockNote = el("div", {
      style: "display: inline-flex; align-items: center; gap: 8px; font-size: 13px; color: #6b7280;",
    }, [
      renderScannerIcon("Lock", 13),
      el("span", { text: "Your credentials are used once to scan and are never stored." }),
    ]);

    return el("div", {
      style: "display: flex; justify-content: center;",
    }, [
      el("div", {
        style: `${CARD} width: 100%; max-width: 520px; padding: 28px; display: flex; flex-direction: column; gap: 18px;`,
      }, [
        el("div", { style: "display: flex; flex-direction: column; gap: 6px;" }, [
          el("h1", {
            style: `margin: 0; font-size: 28px; font-weight: 700; color: ${NAVY};`,
            text: "Scan Your Odoo Instance",
          }),
          el("p", {
            style: "margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;",
            text: "We'll check what's already configured so you start from the right place.",
          }),
        ]),
        fieldShell("Odoo URL", urlInput),
        fieldShell("Database", databaseInput),
        fieldShell("Username", usernameInput),
        fieldShell("Password", passwordInput, lockNote),
        el("button", {
          type: "button",
          disabled: state.scanning,
          style: `${FADED_AMBER} width: 100%; padding: 12px 18px; display: inline-flex; align-items: center; justify-content: center; gap: 8px;${state.scanning ? " opacity: 0.75; cursor: wait;" : ""}`,
          onClick: () => {
            void submitScan();
          },
          dataset: { testid: "scanner-submit-button" },
        }, [
          state.scanning
            ? (() => {
                const spinner = renderScannerIcon("Loader", 14);
                spinner.classList.add("scanner-spin");
                return spinner;
              })()
            : renderScannerIcon("ScanLine", 14),
          el("span", { text: state.scanning ? "Scanning..." : "Scan Instance" }),
        ]),
        state.scanError
          ? el("div", {
              style: `font-size: 13px; color: ${DANGER};`,
              text: state.scanError,
            })
          : null,
      ]),
    ]);
  }

  function renderCompanyPanel(scanResult) {
    const rows = [
      { label: "Currency", value: scanResult?.company?.currency || "—" },
      { label: "Country", value: scanResult?.company?.country || "—" },
      { label: "Email", value: scanResult?.company?.email || "—" },
      { label: "Phone", value: scanResult?.company?.phone || "—" },
      { label: "Website", value: scanResult?.company?.website || "—" },
    ];

    return el("section", {
      style: `${CARD} padding: 20px;`,
    }, [
      cardTitle("Building2", "Company"),
      ...rows.map((row) => el("div", {
        style: "display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f3f4f6;",
      }, [
        el("span", {
          style: "font-size: 13px; color: #6b7280;",
          text: row.label,
        }),
        el("span", {
          style: `font-size: 14px; color: ${NAVY}; text-align: right;`,
          text: row.value,
        }),
      ])),
    ]);
  }

  function renderInstalledModulesPanel(scanResult, filteredModules) {
    const filterInput = el("input", {
      type: "text",
      value: state.moduleFilter,
      placeholder: "Filter modules...",
      style: `${FIELD} margin-bottom: 14px;`,
      onInput: (event) => {
        state.moduleFilter = event.target.value;
        render();
      },
      dataset: { testid: "scanner-module-filter" },
    });

    return el("section", {
      style: `${CARD} padding: 20px;`,
    }, [
      cardTitle("Package", `Installed Modules (${Array.isArray(scanResult?.modules_installed) ? scanResult.modules_installed.length : 0})`),
      filterInput,
      el("div", {
        className: "scanner-module-list",
      }, filteredModules.length
        ? filteredModules.map((module) => el("div", {
            style: "display: flex; align-items: center; gap: 10px; padding: 9px 0; border-bottom: 1px solid #f3f4f6;",
          }, [
            el("span", {
              style: `width: 8px; height: 8px; border-radius: 999px; background: ${SUCCESS}; flex-shrink: 0;`,
            }),
            el("span", {
              style: `font-size: 14px; color: ${NAVY};`,
              text: String(module.label || module.name || "Unknown module"),
            }),
          ]))
        : [el("div", {
            style: "font-size: 14px; color: #6b7280; padding: 8px 0;",
            text: "No modules match your filter.",
          })]),
    ]);
  }

  function renderDataCountsPanel(scanResult) {
    return el("section", {
      style: `${CARD} padding: 20px;`,
    }, [
      cardTitle("Database", "Existing Data"),
      ...dataCountRows(scanResult).map((row) => el("div", {
        style: "display: flex; justify-content: space-between; gap: 16px; padding: 10px 0; border-bottom: 1px solid #f3f4f6;",
      }, [
        el("span", {
          style: "font-size: 14px; color: #6b7280;",
          text: row.label,
        }),
        el("span", {
          style: `font-size: 15px; font-weight: ${row.value > 0 ? "700" : "500"}; color: ${row.value > 0 ? NAVY : "#9ca3af"};`,
          text: String(row.value),
        }),
      ])),
    ]);
  }

  function statusBadge(installed) {
    return el("span", {
      style: installed
        ? "display: inline-flex; align-items: center; padding: 5px 10px; border-radius: 999px; background: rgba(22,163,74,0.12); color: #166534; font-size: 12px; font-weight: 700;"
        : "display: inline-flex; align-items: center; padding: 5px 10px; border-radius: 999px; background: rgba(220,38,38,0.1); color: #b91c1c; font-size: 12px; font-weight: 700;",
      text: installed ? "Installed" : "Not Installed",
    });
  }

  function renderRequiredModulesSection(derived) {
    const readyBanner = el("div", {
      style: `${CARD} padding: 16px 18px; display: flex; align-items: center; gap: 10px; background: rgba(22,163,74,0.08); border-color: rgba(22,163,74,0.2);`,
    }, [
      (() => {
        const icon = renderScannerIcon("CheckCircle", 16);
        icon.style.color = SUCCESS;
        return icon;
      })(),
      el("span", {
        style: "font-size: 14px; color: #166534; font-weight: 600;",
        text: "All required modules are installed. Your instance is ready for implementation.",
      }),
    ]);

    const rows = derived.trackedModuleRows.map((module) => {
      const installed = derived.installedSet.has(module.name);
      const inlineError = state.installRowErrors[module.name];

      return el("div", {
        style: `${CARD} padding: 18px; display: flex; flex-direction: column; gap: 10px;`,
        dataset: { testid: `scanner-module-row-${module.name}` },
      }, [
        el("div", {
          style: "display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; flex-wrap: wrap;",
        }, [
          el("div", {
            style: "display: flex; flex-direction: column; gap: 6px; min-width: 240px; flex: 1;",
          }, [
            el("span", {
              style: `font-size: 15px; font-weight: 700; color: ${NAVY};`,
              text: module.label,
            }),
            el("span", {
              style: "font-size: 13px; color: #6b7280;",
              text: `${module.name}  ${module.description}`,
            }),
          ]),
          el("div", {
            style: "display: flex; align-items: center; gap: 10px; flex-wrap: wrap;",
          }, [
            statusBadge(installed),
            !installed && derived.isProjectLead
              ? el("button", {
                  type: "button",
                  style: `${FADED_AMBER} padding: 10px 14px;`,
                  onClick: () => openInstallModal(module),
                  dataset: { testid: `scanner-install-button-${module.name}` },
                }, [
                  el("span", { text: "Install" }),
                ])
              : null,
          ]),
        ]),
        inlineError && !installed
          ? el("div", {
              style: `font-size: 13px; color: ${DANGER};`,
              text: inlineError,
            })
          : null,
      ]);
    });

    return el("section", {
      style: "display: flex; flex-direction: column; gap: 16px;",
      dataset: { testid: "scanner-required-modules-section" },
      }, [
        el("div", {
          style: "display: flex; flex-direction: column; gap: 6px;",
        }, [
        el("h2", {
          style: `margin: 0; font-size: 22px; font-weight: 700; color: ${NAVY};`,
          text: "Required Modules",
        }),
        el("p", {
          style: "margin: 0; font-size: 14px; color: #6b7280; line-height: 1.5;",
          text: "These modules are required for your selected implementation domains but are not installed on your instance.",
        }),
      ]),
      derived.missingRequiredModules.length === 0 ? readyBanner : null,
      ...rows,
    ]);
  }

  function renderInstallModal(derived) {
    const module = state.installModal.module;
    if (!module) return null;

    return el("div", {
      style: "position: fixed; inset: 0; background: rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; padding: 24px; z-index: 100;",
      onClick: (event) => {
        if (event.target === event.currentTarget && !state.installModal.submitting) {
          closeInstallModal();
        }
      },
    }, [
      el("div", {
        style: "width: 100%; max-width: 480px; background: #ffffff; border-radius: 10px; padding: 32px; box-shadow: 0 24px 48px rgba(12,26,48,0.18); display: flex; flex-direction: column; gap: 16px;",
      }, [
        el("h2", {
          style: `margin: 0; font-size: 18px; font-weight: 700; color: ${NAVY};`,
          text: "Install Module",
        }),
        el("p", {
          style: "margin: 0; font-size: 14px; color: #374151; line-height: 1.5;",
          text: `Install ${module.label} on ${state.scanContext?.database || "this database"}?`,
        }),
        el("p", {
          style: "margin: 0; font-size: 14px; color: #92400e; line-height: 1.5;",
          text: "This will modify your live Odoo instance.",
        }),
        fieldShell("Password", el("input", {
          type: "password",
          value: state.installModal.password,
          placeholder: "",
          style: FIELD,
          onInput: (event) => {
            state.installModal.password = event.target.value;
          },
          dataset: { testid: "scanner-install-password-input" },
        })),
        state.installModal.error
          ? el("div", {
              style: `font-size: 13px; color: ${DANGER};`,
              text: state.installModal.error,
            })
          : null,
        state.teamError && !derived.isProjectLead
          ? el("div", {
              style: "font-size: 13px; color: #6b7280;",
              text: state.teamError,
            })
          : null,
        el("div", {
          style: "display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;",
        }, [
          el("button", {
            type: "button",
            style: `${SECONDARY} padding: 10px 16px;`,
            disabled: state.installModal.submitting,
            onClick: closeInstallModal,
          }, [el("span", { text: "Cancel" })]),
          el("button", {
            type: "button",
            style: `${FADED_AMBER} padding: 10px 16px;${state.installModal.submitting ? " opacity: 0.75; cursor: wait;" : ""}`,
            disabled: state.installModal.submitting,
            onClick: () => {
              void confirmInstall();
            },
            dataset: { testid: "scanner-install-confirm-button" },
          }, [
            state.installModal.submitting
              ? (() => {
                  const spinner = renderScannerIcon("Loader", 14);
                  spinner.classList.add("scanner-spin");
                  return spinner;
                })()
              : renderScannerIcon("PackagePlus", 14),
            el("span", { text: state.installModal.submitting ? "Installing..." : "Install Module" }),
          ]),
        ]),
      ]),
    ]);
  }

  function renderResultsView(derived) {
    return el("div", {
      style: "display: flex; flex-direction: column; gap: 24px;",
    }, [
      el("div", {
        style: `${CARD} padding: 20px; display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap;`,
      }, [
        el("div", { style: "display: flex; flex-direction: column; gap: 6px;" }, [
          el("h1", {
            style: `margin: 0; font-size: 28px; font-weight: 700; color: ${NAVY};`,
            text: state.scanResult?.company?.name || "Odoo Instance Scan",
          }),
          el("span", {
            style: "font-size: 13px; color: #6b7280;",
            text: `Scanned ${formatTimestamp(state.scanResult?.scanned_at)}`,
          }),
        ]),
        el("button", {
          type: "button",
          style: `${SECONDARY} padding: 9px 14px;`,
          onClick: () => {
            state.scanResult = null;
            state.scanContext = null;
            state.scanError = "";
            state.moduleFilter = "";
            state.form.password = "";
            state.installRowErrors = {};
            state.installModal = {
              open: false,
              module: null,
              password: "",
              error: "",
              submitting: false,
            };
            state.sessionInstalled = new Set();
            render();
          },
          dataset: { testid: "scanner-rescan-button" },
        }, [
          renderScannerIcon("RefreshCw", 14),
          el("span", { text: "Re-scan" }),
        ]),
      ]),
      el("div", {
        className: "scanner-results-grid",
      }, [
        renderCompanyPanel(state.scanResult),
        renderInstalledModulesPanel(state.scanResult, derived.filteredModules),
        renderDataCountsPanel(state.scanResult),
      ]),
      renderRequiredModulesSection(derived),
    ]);
  }

  function renderContinueButton() {
    return el("div", {
      style: "display: flex; justify-content: flex-end;",
    }, [
      el("button", {
        type: "button",
        style: `${PRIMARY} padding: 12px 18px; display: inline-flex; align-items: center; gap: 8px;`,
        onClick: () => navigate("pipeline"),
        dataset: { testid: "scanner-continue-button" },
      }, [
        renderScannerIcon("ArrowRight", 16),
        el("span", { text: "Continue to Pipeline" }),
      ]),
    ]);
  }

  function renderContent() {
    const derived = derivedState();

    return el("div", {
      style: "display: flex; flex-direction: column; gap: 24px;",
    }, [
      state.scanResult ? renderResultsView(derived) : renderScanForm(),
      renderContinueButton(),
    ]);
  }

  function render() {
    clearNode(contentEl);
    clearNode(modalHost);
    contentEl.append(renderContent());
    if (state.installModal.open) {
      const modal = renderInstallModal(derivedState());
      if (modal) {
        modalHost.append(modal);
      }
    }
  }

  render();
  queueMicrotask(() => {
    void loadMembers();
  });

  return container;
}
