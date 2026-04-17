import { el } from "../lib/dom.js";
import { lucideIcon } from "../lib/icons.js";
import { onboardingStore } from "../state/onboarding-store.js";

const WIZARD_CATEGORIES = [
  {
    id: "foundation",
    label: "Foundation setup",
    description: "Start here: create your database, set up your company, and establish master data.",
    icon: "layers",
    wizards: [
      { id: "database-creation", label: "Create Odoo database", icon: "database", description: "Set up your Odoo instance" },
      { id: "company-setup", label: "Company setup", icon: "building-2", description: "Configure your business details" },
      { id: "master-data", label: "Master data", icon: "folder-open", description: "Products, customers, and suppliers" },
    ],
  },
  {
    id: "operations",
    label: "Core operations",
    description: "Set up day-to-day business processes across the instance.",
    icon: "settings",
    wizards: [
      { id: "crm-setup", label: "CRM setup", icon: "target", description: "Leads, opportunities, and pipeline" },
      { id: "sales-setup", label: "Sales setup", icon: "tag", description: "Quotations, orders, and invoicing" },
      { id: "inventory-setup", label: "Inventory setup", icon: "package", description: "Warehouses, stock, and movements" },
      { id: "purchase-setup", label: "Purchase setup", icon: "shopping-cart", description: "Vendors, POs, and receipts" },
      { id: "manufacturing-setup", label: "Manufacturing setup", icon: "factory", description: "BOMs, work centers, and production" },
    ],
  },
  {
    id: "finance",
    label: "Finance & go-live",
    description: "Complete financial setup and prepare for launch.",
    icon: "landmark",
    wizards: [
      { id: "accounting-setup", label: "Accounting setup", icon: "calculator", description: "Chart of accounts, taxes, and journals" },
      { id: "go-live-readiness", label: "Go-live checklist", icon: "rocket", description: "Final checks before launch" },
    ],
  },
];

// ── Token styles ────────────────────────────────────────────────

const CANVAS_STYLE =
  "min-height: 100vh; background: var(--canvas-bloom-warm), var(--canvas-bloom-cool), var(--color-canvas-base), var(--surface-texture); padding: var(--space-8) var(--space-5) var(--space-12); font-family: var(--font-body); color: var(--color-ink); box-sizing: border-box;";

const COLUMN_STYLE =
  "max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: var(--space-7);";

const HERO_STYLE =
  "display: flex; flex-direction: column; gap: var(--space-3);";

const EYEBROW_STYLE =
  "display: inline-flex; align-self: flex-start; align-items: center; padding: 4px 12px; border: 1px solid var(--color-line); border-radius: var(--radius-pill); background: var(--color-surface); font-family: var(--font-body); font-size: var(--fs-tiny); font-weight: 600; text-transform: uppercase; letter-spacing: var(--track-eyebrow-strong); color: var(--color-subtle);";

const HERO_H1 =
  "font-family: var(--font-display); font-size: var(--fs-h1); font-weight: 600; letter-spacing: var(--track-tight); line-height: var(--lh-snug); color: var(--color-ink); margin: 0;";

const HERO_MUTED = "color: var(--color-muted);";

const HERO_SUB =
  "font-family: var(--font-mono); font-size: var(--fs-small); color: var(--color-muted); margin: 0; line-height: var(--lh-body);";

const CATEGORY_WRAP_STYLE =
  "display: flex; flex-direction: column; gap: var(--space-5);";

const CATEGORY_HEAD_STYLE =
  "display: flex; align-items: flex-start; gap: var(--space-4); padding-bottom: var(--space-3); border-bottom: 1px solid var(--color-line);";

const CATEGORY_ICON_STYLE =
  "display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: var(--radius-md); background: var(--color-line-soft); color: var(--color-muted); flex-shrink: 0;";

const CATEGORY_TITLE_STYLE =
  "font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 600; color: var(--color-ink); margin: 0 0 2px 0; letter-spacing: var(--track-tight);";

const CATEGORY_DESC_STYLE =
  "font-family: var(--font-body); font-size: var(--fs-small); color: var(--color-muted); margin: 0;";

const GRID_STYLE =
  "display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: var(--space-4);";

const CARD_STYLE =
  "background: var(--color-surface); border: 1px solid var(--color-line); border-radius: var(--radius-panel); padding: var(--space-5); display: flex; flex-direction: column; gap: var(--space-3); cursor: pointer; transition: border-color var(--dur-base) var(--ease), box-shadow var(--dur-base) var(--ease), transform var(--dur-base) var(--ease);";

const CARD_ICON_STYLE =
  "width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--color-line-soft); display: flex; align-items: center; justify-content: center; color: var(--color-ink); flex-shrink: 0;";

const CARD_ICON_DONE_STYLE =
  "width: 40px; height: 40px; border-radius: var(--radius-md); background: var(--color-chip-ready-bg); display: flex; align-items: center; justify-content: center; color: var(--color-chip-ready-fg); flex-shrink: 0;";

const CARD_TITLE_STYLE =
  "font-family: var(--font-display); font-size: var(--fs-h3); font-weight: 600; color: var(--color-ink); margin: 0; letter-spacing: var(--track-tight);";

const CARD_DESC_STYLE =
  "font-family: var(--font-body); font-size: var(--fs-small); color: var(--color-muted); margin: 0; line-height: var(--lh-body);";

const CARD_ID_STYLE =
  "font-family: var(--font-mono); font-size: var(--fs-tiny); color: var(--color-subtle); margin: 0;";

const CARD_ROW_STYLE =
  "display: flex; align-items: center; justify-content: space-between; gap: var(--space-3);";

const CHIP_BASE =
  "display: inline-flex; align-items: center; padding: 4px 10px; border-radius: var(--radius-pill); font-family: var(--font-mono); font-size: var(--fs-tiny); font-weight: 500; text-transform: uppercase; letter-spacing: var(--track-eyebrow);";

const CHIP_READY = `${CHIP_BASE} background: var(--color-chip-ready-bg); color: var(--color-chip-ready-fg);`;
const CHIP_NEUTRAL = `${CHIP_BASE} background: var(--color-chip-bg); color: var(--color-chip-fg);`;

const BACK_BTN_STYLE =
  "display: inline-flex; align-items: center; gap: 8px; padding: 8px 14px; border-radius: var(--radius-pill); background: var(--color-pill-secondary-bg); color: var(--color-pill-secondary-fg); border: 1px solid var(--color-pill-secondary-border); font-family: var(--font-body); font-size: var(--fs-small); font-weight: 500; cursor: pointer; transition: all var(--dur-base) var(--ease); align-self: flex-start;";

function resolveInstanceHost(project) {
  const obState = onboardingStore.getState();
  const url = project?.connectionState?.url ?? obState?.connection?.url ?? null;
  if (!url) return "";
  try { return new URL(url).host; }
  catch { return String(url).replace(/^https?:\/\//i, "").split("/")[0]; }
}

export function renderWizardLauncherView(project, onLaunchWizard, onBack) {
  const completedWizards = project?.workflowState?.completedWizards || [];
  const instanceHost = resolveInstanceHost(project);

  const hero = el("div", { style: HERO_STYLE }, [
    el("span", {
      style: EYEBROW_STYLE,
      text: instanceHost ? `CONFIGURATION · ${instanceHost}` : "CONFIGURATION · wizards",
    }),
    el("h1", { style: HERO_H1 }, [
      el("span", { text: "Setup " }),
      el("span", { style: HERO_MUTED, text: "wizards" }),
    ]),
    el("p", {
      style: HERO_SUB,
      text: "step-by-step assistants · each wizard guides you through the right sequence of decisions",
    }),
  ]);

  const categorySections = WIZARD_CATEGORIES.map((category) =>
    renderWizardCategory(category, completedWizards, onLaunchWizard)
  );

  const backBtn = el("button", {
    type: "button",
    style: BACK_BTN_STYLE,
    onclick: onBack,
  }, [
    lucideIcon("arrow-left", 16),
    el("span", { text: "Back to dashboard" }),
  ]);

  const column = el("div", { style: COLUMN_STYLE }, [hero, ...categorySections, backBtn]);
  return el("div", { style: CANVAS_STYLE }, [column]);
}

function renderWizardCategory(category, completedWizards, onLaunchWizard) {
  return el("div", { style: CATEGORY_WRAP_STYLE }, [
    el("div", { style: CATEGORY_HEAD_STYLE }, [
      el("div", { style: CATEGORY_ICON_STYLE }, [lucideIcon(category.icon, 18)]),
      el("div", { style: "flex: 1;" }, [
        el("h2", { style: CATEGORY_TITLE_STYLE, text: category.label }),
        el("p", { style: CATEGORY_DESC_STYLE, text: category.description }),
      ]),
    ]),
    el("div", { style: GRID_STYLE },
      category.wizards.map((w) => renderWizardCard(w, completedWizards.includes(w.id), onLaunchWizard))
    ),
  ]);
}

function renderWizardCard(wizard, isCompleted, onLaunchWizard) {
  const statusChip = el("span", {
    style: isCompleted ? CHIP_READY : CHIP_NEUTRAL,
    text: isCompleted ? "Complete" : "Not started",
  });

  const iconName = isCompleted ? "check" : wizard.icon;
  const iconStyle = isCompleted ? CARD_ICON_DONE_STYLE : CARD_ICON_STYLE;

  const card = el("div", {
    style: CARD_STYLE,
    dataset: { wizardId: wizard.id },
    onclick: () => onLaunchWizard && onLaunchWizard(wizard.id),
  }, [
    el("div", { style: CARD_ROW_STYLE }, [
      el("div", { style: iconStyle }, [lucideIcon(iconName, 20)]),
      statusChip,
    ]),
    el("div", { style: "display: flex; flex-direction: column; gap: 6px;" }, [
      el("h3", { style: CARD_TITLE_STYLE, text: wizard.label }),
      el("p", { style: CARD_DESC_STYLE, text: wizard.description }),
    ]),
    el("p", { style: CARD_ID_STYLE, text: wizard.id }),
  ]);

  card.addEventListener("mouseenter", () => {
    card.style.borderColor = "var(--color-ink)";
    card.style.transform = "translateY(-1px)";
    card.style.boxShadow = "var(--shadow-sm)";
  });
  card.addEventListener("mouseleave", () => {
    card.style.borderColor = "var(--color-line)";
    card.style.transform = "translateY(0)";
    card.style.boxShadow = "none";
  });

  return card;
}
