import { getDomainSupport } from "/shared/index.js";
import { clearNode, el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { getState, setCurrentView } from "../state/app-store.js";
import { onboardingStore } from "../state/onboarding-store.js";
import { pipelineStore } from "../state/pipeline-store.js";

const CANVAS_STYLE =
  "background: var(--canvas-bloom-warm), var(--canvas-bloom-cool), " +
  "var(--color-canvas-base), var(--surface-texture); " +
  "padding: var(--space-6) var(--space-7) var(--space-8); " +
  "font-family: var(--font-body); color: var(--color-ink);";

const PANEL_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-panel);";

const CARD_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-card);";

const PILL_PRIMARY =
  "display: inline-flex; align-items: center; gap: 8px; " +
  "padding: 9px 16px; border-radius: var(--radius-pill); " +
  "background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg); " +
  "border: 1px solid var(--color-pill-primary-bg); " +
  "font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; " +
  "cursor: pointer; transition: all var(--dur-base) var(--ease);";

const PILL_SECONDARY =
  "display: inline-flex; align-items: center; gap: 8px; " +
  "padding: 9px 16px; border-radius: var(--radius-pill); " +
  "background: var(--color-pill-secondary-bg); color: var(--color-pill-secondary-fg); " +
  "border: 1px solid var(--color-pill-secondary-border); " +
  "font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; " +
  "cursor: pointer; transition: all var(--dur-base) var(--ease);";

const EYEBROW_STYLE =
  "display: inline-flex; align-self: flex-start; align-items: center; " +
  "padding: 4px 12px; border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-pill); background: var(--color-surface); " +
  "font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; " +
  "text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); " +
  "color: var(--color-subtle);";

const MONO_META_STYLE =
  "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted);";

const FIELD_STYLE =
  "width: 100%; box-sizing: border-box; " +
  "background: var(--color-surface); border: 1px solid var(--color-line); " +
  "border-radius: var(--radius-input); padding: 10px 12px; " +
  "font-family: var(--font-body); font-size: var(--fs-small); color: var(--color-ink); " +
  "outline: none; transition: border-color var(--dur-fast) var(--ease);";

const FIELD_MONO_STYLE = `${FIELD_STYLE} font-family: var(--font-mono);`;

const FIELD_LABEL_STYLE =
  "font-family: var(--font-body); font-size: var(--fs-micro); " +
  "text-transform: uppercase; letter-spacing: var(--track-eyebrow); " +
  "font-weight: 600; color: var(--color-muted);";

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

function bindFocusBorder(node) {
  if (!node) return;
  node.addEventListener("focus", () => { node.style.borderColor = "var(--color-ink)"; });
  node.addEventListener("blur", () => { node.style.borderColor = "var(--color-line)"; });
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
    day: "numeric", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  }).format(parsed);
}

function deriveInstanceHost(url, database) {
  const raw = typeof url === "string" ? url.trim() : "";
  if (raw) {
    try { return new URL(raw).hostname; }
    catch {
      const stripped = raw.replace(/^https?:\/\//i, "").split(/[/?#]/)[0];
      if (stripped) return stripped;
    }
  }
  const db = typeof database === "string" ? database.trim() : "";
  return db || "NEW";
}

function readJsonResponse(response) {
  return response.text().then((raw) => {
    if (!raw) return {};
    try { return JSON.parse(raw); } catch { return {}; }
  });
}

function buildHeaders(token, includeJson = true) {
  const headers = {};
  if (includeJson) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, options);
  const payload = await readJsonResponse(response);
  if (!response.ok) throw new Error(payload.error || payload.detail || "Request failed.");
  if (payload?.error) throw new Error(payload.error);
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
    if (currentUserId && member.account_id === currentUserId) return true;
    return (
      !currentUserId && currentUserEmail &&
      String(member.email || "").trim().toLowerCase() === currentUserEmail
    );
  }) || null;
}

function resolveActiveDomains() {
  const runtimeDomains = pipelineStore.getState().runtime_state?.activated_domains?.domains;
  if (Array.isArray(runtimeDomains) && runtimeDomains.length > 0) {
    return runtimeDomains.map((domain) => {
      if (typeof domain === "string") return domain;
      if (domain?.activated === false) return null;
      return domain?.domain_id || domain?.id || null;
    }).filter(Boolean);
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
      if (!current.domains.includes(domainLabel)) current.domains.push(domainLabel);
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
    @keyframes scanner-pulse {
      0%, 100% { opacity: 0.4; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.2); }
    }
    .scanner-spin { animation: scanner-spin 1s linear infinite; }
    .scanner-pulse-dot {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: var(--accent-grad);
      animation: scanner-pulse 1.4s ease-in-out infinite;
    }
    .scanner-results-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: var(--space-4);
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
  const icon = renderScannerIcon(iconName, 16);
  icon.style.color = "var(--color-ink)";
  return el("div", {
    style: "display: flex; align-items: center; gap: var(--space-2); margin-bottom: var(--space-4);",
  }, [
    icon,
    el("span", {
      style:
        "font-size: var(--fs-h3); font-weight: 600; " +
        "color: var(--color-ink); letter-spacing: var(--track-tight);",
      text,
    }),
  ]);
}

function fieldShell(label, input, note = null) {
  return el("label", {
    style: "display: flex; flex-direction: column; gap: 6px;",
  }, [
    el("span", { style: FIELD_LABEL_STYLE, text: label }),
    input,
    note,
  ]);
}

export function renderInstanceScannerView({ project, onNavigate } = {}) {
  const container = el("section", {
    style: `${CANVAS_STYLE} max-width: 1240px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-5);`,
    dataset: { testid: "instance-scanner-view" },
  });
  const styleEl = el("style", { text: scannerStyles() });
  const contentEl = el("div");
  const modalHost = el("div");
  const toastHost = el("div", {
    style:
      "position: fixed; right: var(--space-6); bottom: var(--space-6); z-index: 120; " +
      "display: flex; flex-direction: column; gap: var(--space-3);",
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
      open: false, module: null, password: "", error: "", submitting: false,
    },
    sessionInstalled: new Set(),
  };
  let toastTimer = null;
  let latestLoadId = 0;

  container.append(styleEl, contentEl, modalHost, toastHost);

  function navigate(view) {
    if (onNavigate) { onNavigate(view); return; }
    setCurrentView(view);
  }

  function showToast(message) {
    clearNode(toastHost);
    if (toastTimer) { clearTimeout(toastTimer); toastTimer = null; }
    toastHost.append(el("div", {
      style:
        "background: var(--color-pill-primary-bg); color: var(--color-pill-primary-fg); " +
        "padding: var(--space-3) var(--space-5); border-radius: var(--radius-pill); " +
        "font-family: var(--font-body); font-size: var(--fs-small); " +
        "box-shadow: var(--shadow-menu); max-width: 320px;",
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
    const host = deriveInstanceHost(
      state.scanContext?.url || onboardingState?.connection?.url || "",
      state.scanContext?.database || onboardingState?.connection?.database || ""
    );
    return {
      onboardingState, projectId, currentMembership, isProjectLead,
      activeDomains, requiredModules, installedSet, filteredModules,
      missingRequiredModules, trackedModuleRows, host,
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
      if (requestId !== latestLoadId) return;
      state.members = Array.isArray(payload.members) ? payload.members : [];
      state.teamError = "";
    } catch (error) {
      if (requestId !== latestLoadId) return;
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
      state.installModal = { open: false, module: null, password: "", error: "", submitting: false };
      render();
    } catch (error) {
      state.scanning = false;
      state.scanError = error instanceof Error ? error.message : "Scan failed.";
      render();
    }
  }

  function openInstallModal(module) {
    state.installModal = { open: true, module, password: "", error: "", submitting: false };
    render();
  }

  function closeInstallModal() {
    state.installModal = { open: false, module: null, password: "", error: "", submitting: false };
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
    state.installRowErrors = { ...state.installRowErrors, [module.name]: "" };
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
      state.installRowErrors = { ...state.installRowErrors, [module.name]: message };
      render();
    }
  }

  function renderScanForm() {
    const urlInput = el("input", {
      type: "text",
      value: state.form.url,
      placeholder: "https://mycompany.odoo.com",
      style: FIELD_MONO_STYLE,
      onInput: (event) => { state.form.url = event.target.value; },
      dataset: { testid: "scanner-url-input" },
    });
    bindFocusBorder(urlInput);

    const databaseInput = el("input", {
      type: "text",
      value: state.form.database,
      placeholder: "mycompany",
      style: FIELD_MONO_STYLE,
      onInput: (event) => { state.form.database = event.target.value; },
      dataset: { testid: "scanner-database-input" },
    });
    bindFocusBorder(databaseInput);

    const usernameInput = el("input", {
      type: "email",
      value: state.form.username,
      placeholder: "admin@mycompany.com",
      style: FIELD_STYLE,
      onInput: (event) => { state.form.username = event.target.value; },
      dataset: { testid: "scanner-username-input" },
    });
    bindFocusBorder(usernameInput);

    const passwordInput = el("input", {
      type: "password",
      value: state.form.password,
      placeholder: "",
      style: FIELD_STYLE,
      onInput: (event) => { state.form.password = event.target.value; },
      dataset: { testid: "scanner-password-input" },
    });
    bindFocusBorder(passwordInput);

    const lockNote = el("div", {
      style:
        "display: inline-flex; align-items: center; gap: 8px; " +
        "font-size: var(--fs-small); color: var(--color-muted);",
    }, [
      renderScannerIcon("lock", 13),
      el("span", { text: "Your credentials are used once to scan and are never stored." }),
    ]);

    const scanButton = el("button", {
      type: "button",
      disabled: state.scanning,
      style: `${PILL_PRIMARY} width: 100%; justify-content: center; padding: 12px 18px;${state.scanning ? " opacity: 0.75; cursor: wait;" : ""}`,
      onClick: () => { void submitScan(); },
      dataset: { testid: "scanner-submit-button" },
    }, [
      state.scanning
        ? el("span", { className: "scanner-pulse-dot" })
        : renderScannerIcon("scan-line", 14),
      el("span", {
        style: state.scanning ? "font-family: var(--font-mono);" : "",
        text: state.scanning ? "Scanning..." : "Scan instance",
      }),
    ]);

    return el("div", {
      style: "display: flex; justify-content: center;",
    }, [
      el("div", {
        style:
          `${CARD_STYLE} width: 100%; max-width: 520px; ` +
          `padding: var(--space-7); display: flex; flex-direction: column; gap: var(--space-4);`,
      }, [
        el("div", { style: "display: flex; flex-direction: column; gap: var(--space-2);" }, [
          el("span", { style: EYEBROW_STYLE, text: "SCANNER" }),
          el("h1", {
            style:
              "margin: 0; font-size: var(--fs-h1); font-weight: 600; " +
              "color: var(--color-ink); letter-spacing: var(--track-tight); " +
              "line-height: var(--lh-snug);",
            text: "Scan your Odoo instance",
          }),
          el("p", {
            style:
              "margin: 0; font-size: var(--fs-body); color: var(--color-muted); " +
              "line-height: var(--lh-body);",
            text: "We'll check what's already configured so you start from the right place.",
          }),
        ]),
        fieldShell("Odoo URL", urlInput),
        fieldShell("Database", databaseInput),
        fieldShell("Username", usernameInput),
        fieldShell("Password", passwordInput, lockNote),
        scanButton,
        state.scanError
          ? el("div", {
              style: "font-size: var(--fs-small); color: var(--color-chip-review-fg);",
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
      style: `${PANEL_STYLE} padding: var(--space-5);`,
    }, [
      cardTitle("building-2", "Company"),
      ...rows.map((row) => el("div", {
        style:
          "display: flex; justify-content: space-between; gap: var(--space-3); " +
          "padding: var(--space-2) 0; border-bottom: 1px solid var(--color-line-soft);",
      }, [
        el("span", {
          style: "font-size: var(--fs-small); color: var(--color-muted);",
          text: row.label,
        }),
        el("span", {
          style:
            "font-family: var(--font-mono); font-size: var(--fs-small); " +
            "color: var(--color-ink); text-align: right;",
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
      style: `${FIELD_STYLE} margin-bottom: var(--space-3);`,
      onInput: (event) => { state.moduleFilter = event.target.value; render(); },
      dataset: { testid: "scanner-module-filter" },
    });
    bindFocusBorder(filterInput);
    const count = Array.isArray(scanResult?.modules_installed) ? scanResult.modules_installed.length : 0;
    return el("section", {
      style: `${PANEL_STYLE} padding: var(--space-5);`,
    }, [
      cardTitle("package", `Installed modules (${count})`),
      filterInput,
      el("div", { className: "scanner-module-list" }, filteredModules.length
        ? filteredModules.map((module) => el("div", {
            style:
              "display: flex; align-items: center; gap: var(--space-2); " +
              "padding: 9px 0; border-bottom: 1px solid var(--color-line-soft);",
          }, [
            el("span", {
              style:
                "width: 6px; height: 6px; border-radius: 50%; " +
                "background: var(--color-ink); flex-shrink: 0;",
            }),
            el("span", {
              style: "font-size: var(--fs-small); color: var(--color-ink);",
              text: String(module.label || module.name || "Unknown module"),
            }),
          ]))
        : [el("div", {
            style: "font-size: var(--fs-small); color: var(--color-muted); padding: 8px 0;",
            text: "No modules match your filter.",
          })]),
    ]);
  }

  function kpiTile(label, value, emphasize = false) {
    return el("div", {
      style:
        "display: flex; justify-content: space-between; align-items: baseline; " +
        "gap: var(--space-3); padding: var(--space-2) 0; " +
        "border-bottom: 1px solid var(--color-line-soft);",
    }, [
      el("span", {
        style: "font-size: var(--fs-small); color: var(--color-muted);",
        text: label,
      }),
      el("span", {
        style:
          `font-family: var(--font-mono); font-size: var(--fs-body); ` +
          `font-weight: ${emphasize ? "600" : "400"}; ` +
          `color: ${emphasize ? "var(--color-ink)" : "var(--color-subtle)"}; ` +
          `font-variant-numeric: tabular-nums;`,
        text: String(value),
      }),
    ]);
  }

  function renderDataCountsPanel(scanResult) {
    return el("section", {
      style: `${PANEL_STYLE} padding: var(--space-5);`,
    }, [
      cardTitle("database", "Existing data"),
      ...dataCountRows(scanResult).map((row) => kpiTile(row.label, row.value, row.value > 0)),
    ]);
  }

  function statusBadge(installed) {
    if (installed) {
      return el("span", {
        style:
          "display: inline-flex; align-items: center; padding: 2px 10px; " +
          "border-radius: var(--radius-pill); " +
          "background: var(--color-chip-ready-bg); color: var(--color-chip-ready-fg); " +
          "font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600;",
        text: "Installed",
      });
    }
    return el("span", {
      style:
        "display: inline-flex; align-items: center; padding: 2px 10px; " +
        "border-radius: var(--radius-pill); " +
        "background: var(--color-chip-review-bg); color: var(--color-chip-review-fg); " +
        "font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600;",
      text: "Not installed",
    });
  }

  function renderRequiredModulesSection(derived) {
    const readyBanner = el("div", {
      style:
        `${PANEL_STYLE} padding: var(--space-4) var(--space-5); ` +
        `display: flex; align-items: center; gap: var(--space-2);`,
    }, [
      (() => {
        const icon = renderScannerIcon("check-circle", 16);
        icon.style.color = "var(--color-chip-ready-fg)";
        return icon;
      })(),
      el("span", {
        style: "font-size: var(--fs-body); color: var(--color-body); font-weight: 500;",
        text: "All required modules are installed. Your instance is ready for implementation.",
      }),
    ]);

    const rows = derived.trackedModuleRows.map((module) => {
      const installed = derived.installedSet.has(module.name);
      const inlineError = state.installRowErrors[module.name];
      return el("div", {
        style:
          `${CARD_STYLE} padding: var(--space-4) var(--space-5); ` +
          `display: flex; flex-direction: column; gap: var(--space-2);`,
        dataset: { testid: `scanner-module-row-${module.name}` },
      }, [
        el("div", {
          style:
            "display: flex; justify-content: space-between; gap: var(--space-3); " +
            "align-items: flex-start; flex-wrap: wrap;",
        }, [
          el("div", {
            style: "display: flex; flex-direction: column; gap: 6px; min-width: 240px; flex: 1;",
          }, [
            el("span", {
              style:
                "font-size: var(--fs-body); font-weight: 600; color: var(--color-ink); " +
                "letter-spacing: var(--track-tight);",
              text: module.label,
            }),
            el("span", {
              style:
                "font-family: var(--font-mono); font-size: var(--fs-small); " +
                "color: var(--color-muted);",
              text: module.name,
            }),
            el("span", {
              style: "font-size: var(--fs-small); color: var(--color-body);",
              text: module.description,
            }),
          ]),
          el("div", {
            style: "display: flex; align-items: center; gap: var(--space-2); flex-wrap: wrap;",
          }, [
            statusBadge(installed),
            !installed && derived.isProjectLead
              ? el("button", {
                  type: "button",
                  style: PILL_SECONDARY,
                  onClick: () => openInstallModal(module),
                  dataset: { testid: `scanner-install-button-${module.name}` },
                }, [el("span", { text: "Install" })])
              : null,
          ]),
        ]),
        inlineError && !installed
          ? el("div", {
              style: "font-size: var(--fs-small); color: var(--color-chip-review-fg);",
              text: inlineError,
            })
          : null,
      ]);
    });

    return el("section", {
      style: "display: flex; flex-direction: column; gap: var(--space-4);",
      dataset: { testid: "scanner-required-modules-section" },
    }, [
      el("div", {
        style: "display: flex; flex-direction: column; gap: 6px;",
      }, [
        el("span", { style: EYEBROW_STYLE, text: "REQUIRED MODULES" }),
        el("h2", {
          style:
            "margin: 0; font-size: var(--fs-h2); font-weight: 600; " +
            "color: var(--color-ink); letter-spacing: var(--track-tight);",
          text: "Required modules",
        }),
        el("p", {
          style:
            "margin: 0; font-size: var(--fs-body); color: var(--color-muted); " +
            "line-height: var(--lh-body);",
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

    const pwInput = el("input", {
      type: "password",
      value: state.installModal.password,
      placeholder: "",
      style: FIELD_STYLE,
      onInput: (event) => { state.installModal.password = event.target.value; },
      dataset: { testid: "scanner-install-password-input" },
    });
    bindFocusBorder(pwInput);

    return el("div", {
      style:
        "position: fixed; inset: 0; background: rgba(0,0,0,0.5); " +
        "display: flex; align-items: center; justify-content: center; " +
        "padding: var(--space-6); z-index: 100;",
      onClick: (event) => {
        if (event.target === event.currentTarget && !state.installModal.submitting) {
          closeInstallModal();
        }
      },
    }, [
      el("div", {
        style:
          `width: 100%; max-width: 440px; ${CARD_STYLE} ` +
          `padding: var(--space-7); box-shadow: var(--shadow-menu); ` +
          `display: flex; flex-direction: column; gap: var(--space-4);`,
      }, [
        el("div", { style: "display: flex; flex-direction: column; gap: var(--space-2);" }, [
          el("span", { style: EYEBROW_STYLE, text: "INSTALL MODULE" }),
          el("h2", {
            style:
              "margin: 0; font-size: var(--fs-h2); font-weight: 600; " +
              "color: var(--color-ink); letter-spacing: var(--track-tight);",
            text: `Install ${module.label}`,
          }),
        ]),
        el("p", {
          style:
            "margin: 0; font-size: var(--fs-body); color: var(--color-body); " +
            "line-height: var(--lh-body);",
        }, [
          el("span", { text: "Install this module on " }),
          el("span", {
            style: "font-family: var(--font-mono); color: var(--color-ink);",
            text: state.scanContext?.database || "this database",
          }),
          el("span", { text: "? This will modify your live Odoo instance." }),
        ]),
        fieldShell("Password", pwInput),
        state.installModal.error
          ? el("div", {
              style: "font-size: var(--fs-small); color: var(--color-chip-review-fg);",
              text: state.installModal.error,
            })
          : null,
        state.teamError && !derived.isProjectLead
          ? el("div", {
              style: "font-size: var(--fs-small); color: var(--color-muted);",
              text: state.teamError,
            })
          : null,
        el("div", {
          style: "display: flex; justify-content: flex-end; gap: var(--space-3); flex-wrap: wrap;",
        }, [
          el("button", {
            type: "button",
            style: PILL_SECONDARY,
            disabled: state.installModal.submitting,
            onClick: closeInstallModal,
          }, [el("span", { text: "Cancel" })]),
          el("button", {
            type: "button",
            style: `${PILL_PRIMARY}${state.installModal.submitting ? " opacity: 0.75; cursor: wait;" : ""}`,
            disabled: state.installModal.submitting,
            onClick: () => { void confirmInstall(); },
            dataset: { testid: "scanner-install-confirm-button" },
          }, [
            state.installModal.submitting
              ? el("span", { className: "scanner-pulse-dot" })
              : renderScannerIcon("package-plus", 14),
            el("span", {
              style: state.installModal.submitting ? "font-family: var(--font-mono);" : "",
              text: state.installModal.submitting ? "Installing..." : "Install module",
            }),
          ]),
        ]),
      ]),
    ]);
  }

  function renderResultsView(derived) {
    return el("div", {
      style: "display: flex; flex-direction: column; gap: var(--space-5);",
    }, [
      el("div", {
        style:
          `position: sticky; top: 0; z-index: 20; ${PANEL_STYLE} ` +
          `padding: var(--space-4) var(--space-5); ` +
          `display: flex; align-items: center; justify-content: space-between; ` +
          `gap: var(--space-4); flex-wrap: wrap;`,
      }, [
        el("div", {
          style: "display: flex; flex-direction: column; gap: var(--space-2); flex: 1 1 360px; min-width: 260px;",
        }, [
          el("span", { style: EYEBROW_STYLE, text: `SCANNER · ${derived.host}` }),
          el("h1", {
            style:
              "margin: 0; font-size: var(--fs-h1); font-weight: 600; " +
              "letter-spacing: var(--track-tight); line-height: var(--lh-snug); " +
              "color: var(--color-ink); font-family: var(--font-body);",
            text: state.scanResult?.company?.name || "Odoo instance scan",
          }),
          el("span", {
            style: MONO_META_STYLE,
            text: `Scanned ${formatTimestamp(state.scanResult?.scanned_at)}  ·  ${state.scanContext?.database || ""}`,
          }),
        ]),
        el("button", {
          type: "button",
          style: PILL_SECONDARY,
          onClick: () => {
            state.scanResult = null;
            state.scanContext = null;
            state.scanError = "";
            state.moduleFilter = "";
            state.form.password = "";
            state.installRowErrors = {};
            state.installModal = { open: false, module: null, password: "", error: "", submitting: false };
            state.sessionInstalled = new Set();
            render();
          },
          dataset: { testid: "scanner-rescan-button" },
        }, [
          renderScannerIcon("refresh-cw", 14),
          el("span", { text: "Re-scan" }),
        ]),
      ]),
      el("div", { className: "scanner-results-grid" }, [
        renderCompanyPanel(state.scanResult),
        renderInstalledModulesPanel(state.scanResult, derived.filteredModules),
        renderDataCountsPanel(state.scanResult),
      ]),
      renderRequiredModulesSection(derived),
      el("div", {
        style:
          "display: flex; align-items: center; gap: var(--space-2); " +
          "padding: var(--space-3) 0; " +
          "font-family: var(--font-mono); font-size: var(--fs-small); " +
          "color: var(--color-subtle);",
      }, [
        renderScannerIcon("lock", 13),
        el("span", { text: "Credentials are used once and never stored." }),
      ]),
    ]);
  }

  function renderContinueButton() {
    return el("div", {
      style: "display: flex; justify-content: flex-end;",
    }, [
      el("button", {
        type: "button",
        style: PILL_PRIMARY,
        onClick: () => navigate("pipeline"),
        dataset: { testid: "scanner-continue-button" },
      }, [
        renderScannerIcon("arrow-right", 16),
        el("span", { text: "Continue to pipeline" }),
      ]),
    ]);
  }

  function renderContent() {
    const derived = derivedState();
    return el("div", {
      style: "display: flex; flex-direction: column; gap: var(--space-5);",
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
      if (modal) modalHost.append(modal);
    }
  }

  render();
  queueMicrotask(() => { void loadMembers(); });

  return container;
}
