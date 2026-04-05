import { renderSiteFooter } from "../../components/site-footer.js";
import { renderSiteNav } from "../../components/site-nav.js";
import { el } from "../../lib/dom.js";

function syncDocument(title) {
  document.title = title;
  if (typeof window.scrollTo === "function") {
    window.scrollTo(0, 0);
  }
}

function renderPrincipleCard(title, body) {
  return el("article", { className: "mkt-card" }, [
    el("h3", { className: "mkt-card__title" }, title),
    el("p", { className: "mkt-card__body" }, body),
  ]);
}

export function renderAboutPage({ setCurrentView }) {
  syncDocument("Project Odoo | About");

  return el("div", { className: "mkt-page" }, [
    renderSiteNav({ setCurrentView }),

    el("section", { className: "mkt-hero mkt-hero--dark" }, [
      el("div", { className: "mkt-shell mkt-hero__content" }, [
        el("h1", { className: "mkt-heading mkt-heading--hero" }, "Odoo was built for growing businesses. So is this."),
        el("p", { className: "mkt-subheading" }, "Project Odoo is a governed implementation engine  not a consultant, not a wizard, not a remediation tool."),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Odoo is powerful. Implementation is hard."),
        el("p", { className: "mkt-subheading" }, "A fresh Odoo installation gives you a blank system and hundreds of configuration options. Configure Accounting before master data is set and every journal entry, tax calculation, and payment term inherits incorrect defaults — defaults you will spend weeks correcting after they cascade through Sales, Purchase, and Inventory. Consultants are expensive. Configuring blindly is costly. Project Odoo is the third option."),
      ]),
    ]),

    el("section", { className: "mkt-section mkt-section--alt" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "A governed implementation engine"),
        el("div", { className: "mkt-grid mkt-grid--three" }, [
          renderPrincipleCard("Real writes", "Every governed write goes through Odoo's application layer — the same path as manual configuration. Business rules, validations, and computed fields all fire correctly. Direct database access bypasses these safeguards."),
          renderPrincipleCard("Full audit trail", "Six months from now, when a setting needs to change, you can trace the original configuration back to the exact approval, the person who authorized it, and the reasoning behind it."),
          renderPrincipleCard("Approval gated", "You see exactly what will be written before it executes. Every configuration change is an informed decision, not a hope that the defaults are correct."),
        ]),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Project Odoo is just the beginning"),
        el("p", { className: "mkt-subheading" }, "Every ERP implementation faces the same problem: hundreds of settings, invisible dependencies, and no governed way to configure them in the right order. Project Odoo proves the model for Odoo 19. Project ERP extends it to NetSuite, SAP, Sage, and Xero — the same discovery-driven pipeline, the same approval governance, the same audit trail."),
        el("ul", { className: "mkt-roadmap-pills" }, [
          el("li", { className: "mkt-roadmap-pill mkt-roadmap-pill--active" }, "Project Odoo"),
          el("li", { className: "mkt-roadmap-pill" }, "Project NetSuite"),
          el("li", { className: "mkt-roadmap-pill" }, "Project SAP"),
          el("li", { className: "mkt-roadmap-pill" }, "Project Sage"),
          el("li", { className: "mkt-roadmap-pill" }, "Project Xero"),
        ]),
      ]),
    ]),

    el("section", { className: "mkt-section mkt-section--alt" }, [
      el("div", { className: "mkt-shell mkt-stack mkt-center" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "124 checkpoints across 23 domains, backed by 2,834 passing tests"),
        el("p", { className: "mkt-subheading" }, "Every checkpoint verified against a live Odoo 19 instance — not documentation, not assumptions."),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack mkt-center" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Connect your Odoo instance"),
        el("div", { className: "mkt-button-row", style: "justify-content:center;" }, [
          el("button", {
            className: "mkt-pill-btn",
            type: "button",
            onclick: () => setCurrentView("auth"),
          }, "Start your implementation"),
        ]),
      ]),
    ]),

    renderSiteFooter({ setCurrentView }),
  ]);
}
