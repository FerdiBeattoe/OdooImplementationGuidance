import { el } from "../lib/dom.js";
import { renderStatusBadge } from "../components/status-badge.js";

const WIZARD_CATEGORIES = [
  {
    id: "foundation",
    label: "Foundation Setup",
    description: "Start here: create your database, set up your company, and establish master data",
    icon: "foundation",
    wizards: [
      { id: "database-creation", label: "Create Odoo Database", icon: "database", description: "Set up your Odoo instance" },
      { id: "company-setup", label: "Company Setup", icon: "business", description: "Configure your business details" },
      { id: "master-data", label: "Master Data", icon: "folder_open", description: "Products, customers, and suppliers" }
    ]
  },
  {
    id: "operations",
    label: "Core Operations",
    description: "Set up your day-to-day business processes",
    icon: "settings_applications",
    wizards: [
      { id: "crm-setup", label: "CRM Setup", icon: "group", description: "Leads, opportunities, and pipeline" },
      { id: "sales-setup", label: "Sales Setup", icon: "shopping_cart", description: "Quotations, orders, and invoicing" },
      { id: "inventory-setup", label: "Inventory Setup", icon: "inventory_2", description: "Warehouses, stock, and movements" },
      { id: "purchase-setup", label: "Purchase Setup", icon: "local_shipping", description: "Vendors, POs, and receipts" },
      { id: "manufacturing-setup", label: "Manufacturing Setup", icon: "precision_manufacturing", description: "BOMs, work centers, and production" }
    ]
  },
  {
    id: "finance",
    label: "Finance & Go-Live",
    description: "Complete your financial setup and prepare for launch",
    icon: "account_balance",
    wizards: [
      { id: "accounting-setup", label: "Accounting Setup", icon: "account_balance_wallet", description: "Chart of accounts, taxes, and journals" },
      { id: "go-live-readiness", label: "Go-Live Checklist", icon: "rocket_launch", description: "Final checks before launch" }
    ]
  }
];

export function renderWizardLauncherView(project, onLaunchWizard, onBack) {
  const completedWizards = project.workflowState?.completedWizards || [];
  
  return el("div", { style: "max-width: 1100px; margin: 0 auto; padding: 32px; display: flex; flex-direction: column; gap: 32px;" }, [
    // Header
    el("div", {}, [
      el("p", { style: "font-family: var(--font-label); font-size: 11px; font-weight: 500; letter-spacing: 0.08em; text-transform: uppercase; color: var(--color-primary); margin-bottom: 4px;", text: "PROJECTODOO SETUP" }),
      el("h2", { style: "font-family: var(--font-headline); font-size: 28px; font-weight: 700; color: var(--color-on-surface); letter-spacing: var(--ls-snug); margin-bottom: 8px;", text: "Setup Wizards" }),
      el("p", { style: "font-family: var(--font-body); font-size: 14px; color: var(--color-on-surface-variant);", text: "Step-by-step assistants to configure Odoo correctly. Each wizard guides you through the right sequence of decisions." })
    ]),
    
    // Categories
    ...WIZARD_CATEGORIES.map(category => renderWizardCategory(category, completedWizards, onLaunchWizard)),
    
    // Back button
    el("div", { style: "margin-top: 16px;" }, [
      el("button", { 
        style: "font-family: var(--font-label); font-size: 13px; font-weight: 600; color: var(--color-on-surface-variant); background: none; border: none; cursor: pointer; display: flex; align-items: center; gap: 8px; padding: 8px;",
        onclick: onBack 
      }, [
        el("span", { className: "material-symbols-outlined", style: "font-size: 18px;", text: "arrow_back" }),
        el("span", { text: "Back to Dashboard" })
      ])
    ])
  ]);
}

function renderWizardCategory(category, completedWizards, onLaunchWizard) {
  return el("div", { style: "margin-bottom: 32px;" }, [
    // Category header
    el("div", { style: "display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid var(--color-surface-container-high);" }, [
      el("span", { className: "material-symbols-outlined", style: "font-size: 22px; color: var(--color-on-surface-variant);", text: category.icon }),
      el("div", {}, [
        el("h3", { style: "font-family: var(--font-headline); font-size: 18px; font-weight: 600; color: var(--color-on-surface); letter-spacing: var(--ls-snug); margin-bottom: 2px;", text: category.label }),
        el("p", { style: "font-family: var(--font-body); font-size: 13px; color: var(--color-on-surface-variant);", text: category.description })
      ])
    ]),
    // Wizard grid
    el("div", { style: "display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;" },
      category.wizards.map(wizard => {
        const isCompleted = completedWizards.includes(wizard.id);
        
        return el("div", {
          style: `position: relative; background: var(--color-surface); box-shadow: var(--shadow-sm); padding: 24px; cursor: pointer; transition: all 150ms ease; ${isCompleted ? "border-left: 3px solid #059669;" : ""}`,
          onmouseenter: (e) => { e.currentTarget.style.boxShadow = "var(--shadow-md)"; e.currentTarget.style.background = "var(--color-surface-container-low)"; },
          onmouseleave: (e) => { e.currentTarget.style.boxShadow = "var(--shadow-sm)"; e.currentTarget.style.background = "var(--color-surface)"; },
          onclick: () => onLaunchWizard(wizard.id)
        }, [
          // Complete badge
          isCompleted ? el("div", { 
            style: "position: absolute; top: 16px; right: 16px; width: 24px; height: 24px; background: #059669; display: flex; align-items: center; justify-content: center;" 
          }, [
            el("span", { className: "material-symbols-outlined", style: "font-size: 16px; color: #ffffff;", text: "check" })
          ]) : null,
          // Icon
          el("div", {
            style: "width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); border-radius: 50%; margin-bottom: 16px;"
          }, [
            el("span", { className: "material-symbols-outlined", style: "font-size: 20px; color: #92400e;", text: wizard.icon })
          ]),
          // Content
          el("h4", { style: "font-family: var(--font-headline); font-size: 16px; font-weight: 600; color: var(--color-on-surface); margin-bottom: 4px;", text: wizard.label }),
          el("p", { style: "font-family: var(--font-body); font-size: 13px; color: var(--color-on-surface-variant); margin-bottom: 12px; line-height: 1.5;", text: wizard.description }),
          // Status badge
          isCompleted 
            ? el("span", { style: "font-family: var(--font-label); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: var(--ls-wide); padding: 2px 6px; background: rgba(16, 185, 129, 0.1); color: #059669;", text: "Complete" })
            : el("span", { style: "font-family: var(--font-label); font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: var(--ls-wide); padding: 2px 6px; background: var(--color-surface-container-high); color: var(--color-on-surface-variant);", text: "Not Started" })
        ]);
      })
    )
  ]);
}