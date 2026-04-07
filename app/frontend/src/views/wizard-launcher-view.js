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
        el("span", { className: "material-symbols-outlined", style: "font-size: 18px;", text: "arrow_back" }),
        el("span", { text: "Back to Dashboard" })
      ])
    ])
  ]);
}

function renderWizardCategory(category, completedWizards, onLaunchWizard) {
  return el("div", { style: "margin-bottom: 32px;" }, [
    // Category header
    el("div", { style: "display: flex; align-items: center; gap: 12px; margin-bottom: 16px; padding-bottom: 12px; border-bottom: 1px solid #e2e8f0;" }, [
      el("span", { className: "material-symbols-outlined", style: "font-size: 22px; color: #64748b;", text: category.icon }),
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
            el("span", { className: "material-symbols-outlined", style: `font-size: 20px; color: ${isCompleted ? "#065f46" : "#92400e"};`, text: isCompleted ? "check" : wizard.icon })
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