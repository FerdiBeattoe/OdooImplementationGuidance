import { el } from "../lib/dom.js";
import { renderStatusBadge } from "../components/status-badge.js";
import { lucideIcon } from "../lib/icons.js";

const WIZARD_CATEGORIES = [
  {
    id: "foundation",
    label: "Foundation Setup",
    description: "Start here: create your database, set up your company, and establish master data",
    icon: "layers",
    wizards: [
      { id: "database-creation", label: "Create Odoo Database", icon: "database", description: "Set up your Odoo instance" },
      { id: "company-setup", label: "Company Setup", icon: "building-2", description: "Configure your business details" },
      { id: "master-data", label: "Master Data", icon: "folder-open", description: "Products, customers, and suppliers" }
    ]
  },
  {
    id: "operations",
    label: "Core Operations",
    description: "Set up your day-to-day business processes",
    icon: "settings",
    wizards: [
      { id: "crm-setup", label: "CRM Setup", icon: "target", description: "Leads, opportunities, and pipeline" },
      { id: "sales-setup", label: "Sales Setup", icon: "tag", description: "Quotations, orders, and invoicing" },
      { id: "inventory-setup", label: "Inventory Setup", icon: "package", description: "Warehouses, stock, and movements" },
      { id: "purchase-setup", label: "Purchase Setup", icon: "shopping-cart", description: "Vendors, POs, and receipts" },
      { id: "manufacturing-setup", label: "Manufacturing Setup", icon: "factory", description: "BOMs, work centers, and production" }
    ]
  },
  {
    id: "finance",
    label: "Finance & Go-Live",
    description: "Complete your financial setup and prepare for launch",
    icon: "landmark",
    wizards: [
      { id: "accounting-setup", label: "Accounting Setup", icon: "calculator", description: "Chart of accounts, taxes, and journals" },
      { id: "go-live-readiness", label: "Go-Live Checklist", icon: "rocket", description: "Final checks before launch" }
    ]
  }
];

export function renderWizardLauncherView(project, onLaunchWizard, onBack) {
  const completedWizards = project.workflowState?.completedWizards || [];

  return el("div", { style: "max-width: 1100px; margin: 0 auto; padding: 32px; display: flex; flex-direction: column; gap: 32px;" }, [
    // Header
    el("div", {}, [
      el("span", { style: "display: inline-block; font-size: 11px; letter-spacing: 0.1em; color: #92400e; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); border-radius: 6px; padding: 3px 10px; font-weight: 600; text-transform: uppercase; margin-bottom: 8px;", text: "CONFIGURATION WIZARDS" }),
      el("h2", { style: "font-size: 28px; font-weight: 700; color: #0c1a30; font-family: Inter, sans-serif; margin-bottom: 8px;", text: "Setup Wizards" }),
      el("p", { style: "font-size: 14px; color: #64748b;", text: "Step-by-step assistants to configure Odoo correctly. Each wizard guides you through the right sequence of decisions." })
    ]),
    
    // Categories
    ...WIZARD_CATEGORIES.map(category => renderWizardCategory(category, completedWizards, onLaunchWizard)),
    
    // Back button
    el("div", { style: "margin-top: 16px;" }, [
      el("button", {
        style: "font-size: 13px; font-weight: 600; color: #64748b; background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 8px;",
        onclick: onBack
      }, [
        lucideIcon("arrow-left", 18),
        el("span", { text: "Back to Dashboard" })
      ])
    ])
  ]);
}

function renderWizardCategory(category, completedWizards, onLaunchWizard) {
  return el("div", { style: "margin-bottom: 32px;" }, [
    // Category header
    el("div", { style: "display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;" }, [
      (() => { const ic = lucideIcon(category.icon, 20); ic.style.color = "#64748b"; return ic; })(),
      el("div", {}, [
        el("h3", { style: "font-size: 18px; font-weight: 600; color: #0c1a30; margin-bottom: 2px;", text: category.label }),
        el("p", { style: "font-size: 13px; color: #64748b;", text: category.description })
      ])
    ]),
    // Wizard grid
    el("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 12px;" },
      category.wizards.map(wizard => {
        const isCompleted = completedWizards.includes(wizard.id);
        const statusBadge = isCompleted
          ? el("span", { style: "display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #065f46; background: rgba(16,185,129,0.08); border: 1px solid rgba(16,185,129,0.2); border-radius: 6px; padding: 2px 8px; margin-left: auto; flex-shrink: 0;", text: "Complete" })
          : el("span", { style: "display: inline-block; font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: #64748b; background: rgba(12,26,48,0.06); border: 1px solid rgba(12,26,48,0.1); border-radius: 6px; padding: 2px 8px; margin-left: auto; flex-shrink: 0;", text: "Not Started" });

        const card = el("div", {
          style: "display: flex; align-items: center; gap: 16px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 16px 20px; cursor: pointer; transition: border-color 0.15s, box-shadow 0.15s;",
          onclick: () => onLaunchWizard(wizard.id)
        }, [
          // Icon
          el("div", {
            style: "width: 44px; height: 44px; border-radius: 10px; background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.15); display: flex; align-items: center; justify-content: center; flex-shrink: 0;"
          }, [
            (() => { const ic = lucideIcon(isCompleted ? "check" : wizard.icon, 20); ic.style.color = isCompleted ? "#065f46" : "#92400e"; return ic; })()
          ]),
          // Text
          el("div", { style: "flex: 1; min-width: 0;" }, [
            el("h4", { style: "font-size: 15px; font-weight: 600; color: #0c1a30; margin-bottom: 2px;", text: wizard.label }),
            el("p", { style: "font-size: 12px; color: #64748b;", text: wizard.description })
          ]),
          statusBadge
        ]);

        card.onmouseenter = () => { card.style.borderColor = "#f59e0b"; card.style.boxShadow = "0 2px 8px rgba(245,158,11,0.1)"; };
        card.onmouseleave = () => { card.style.borderColor = "#e2e8f0"; card.style.boxShadow = "none"; };
        return card;
      })
    )
  ]);
}