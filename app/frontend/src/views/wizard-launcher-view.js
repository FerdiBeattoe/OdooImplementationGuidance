import { el } from "../lib/dom.js";
import { renderStatusBadge } from "../components/status-badge.js";

const WIZARD_CATEGORIES = [
  {
    id: "foundation",
    label: "Foundation Setup",
    description: "Start here: create your database, set up your company, and establish master data",
    wizards: [
      { id: "database-creation", label: "Create Odoo Database", icon: "🗄️", description: "Set up your Odoo instance" },
      { id: "company-setup", label: "Company Setup", icon: "🏢", description: "Configure your business details" },
      { id: "master-data", label: "Master Data", icon: "📋", description: "Products, customers, and suppliers" }
    ]
  },
  {
    id: "operations",
    label: "Core Operations",
    description: "Set up your day-to-day business processes",
    wizards: [
      { id: "crm-setup", label: "CRM Setup", icon: "🤝", description: "Leads, opportunities, and pipeline" },
      { id: "sales-setup", label: "Sales Setup", icon: "💰", description: "Quotations, orders, and invoicing" },
      { id: "inventory-setup", label: "Inventory Setup", icon: "📦", description: "Warehouses, stock, and movements" },
      { id: "purchase-setup", label: "Purchase Setup", icon: "🛒", description: "Vendors, POs, and receipts" },
      { id: "manufacturing-setup", label: "Manufacturing Setup", icon: "⚙️", description: "BOMs, work centers, and production" }
    ]
  },
  {
    id: "finance",
    label: "Finance & Go-Live",
    description: "Complete your financial setup and prepare for launch",
    wizards: [
      { id: "accounting-setup", label: "Accounting Setup", icon: "📊", description: "Chart of accounts, taxes, and journals" },
      { id: "go-live-readiness", label: "Go-Live Checklist", icon: "🚀", description: "Final checks before launch" }
    ]
  }
];

export function renderWizardLauncherView(project, onLaunchWizard, onBack) {
  const completedWizards = project.workflowState?.completedWizards || [];
  
  return el("section", { className: "workspace" }, [
    header("Guided Setup Wizards", "Step-by-step assistants to configure Odoo correctly. Each wizard guides you through the right sequence of decisions."),
    
    el("div", { className: "wizard-launcher-grid" }, 
      WIZARD_CATEGORIES.map(category => 
        renderWizardCategory(category, completedWizards, onLaunchWizard)
      )
    ),
    
    el("div", { className: "hero-panel__actions" }, [
      el("button", { 
        className: "button button--secondary", 
        text: "← Back to Dashboard", 
        onclick: onBack 
      })
    ])
  ]);
}

function renderWizardCategory(category, completedWizards, onLaunchWizard) {
  return el("section", { className: "panel wizard-category" }, [
    el("h3", { text: category.label }),
    el("p", { className: "wizard-category__description", text: category.description }),
    
    el("div", { className: "wizard-list" },
      category.wizards.map(wizard => {
        const isCompleted = completedWizards.includes(wizard.id);
        
        return el("button", {
          className: `wizard-card ${isCompleted ? "wizard-card--completed" : ""}`,
          onclick: () => onLaunchWizard(wizard.id)
        }, [
          el("span", { className: "wizard-card__icon", text: wizard.icon }),
          el("div", { className: "wizard-card__content" }, [
            el("h4", { text: wizard.label }),
            el("p", { text: wizard.description }),
            isCompleted 
              ? el("span", { className: "wizard-card__status", text: "✓ Complete" })
              : null
          ])
        ]);
      })
    )
  ]);
}

function header(title, description) {
  return el("header", { className: "workspace__header" }, [
    el("h2", { text: title }),
    el("p", { text: description })
  ]);
}