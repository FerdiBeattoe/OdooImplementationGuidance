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
        el("h1", { className: "mkt-heading mkt-heading--hero" }, "Built for the businesses Odoo was built for"),
        el("p", { className: "mkt-subheading" }, "Project Odoo is a governed implementation engine  not a consultant, not a wizard, not a remediation tool."),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Odoo is powerful. Implementation is hard."),
        el("p", { className: "mkt-subheading" }, "A fresh Odoo installation gives you a blank system and hundreds of configuration options. The order in which you configure them matters  and most businesses discover this after they have already configured things in the wrong sequence. Consultants are expensive. Configuring blindly is costly. Project Odoo is the third option."),
      ]),
    ]),

    el("section", { className: "mkt-section mkt-section--alt" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "A governed implementation engine"),
        el("div", { className: "mkt-grid mkt-grid--three" }, [
          renderPrincipleCard("Real writes", "Every governed write executes through the Odoo application layer. No direct database access."),
          renderPrincipleCard("Full audit trail", "Every action recorded with execution ID, timestamp, and result status."),
          renderPrincipleCard("Approval gated", "Nothing writes to your Odoo instance without explicit preview and approval."),
        ]),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Project Odoo is just the beginning"),
        el("p", { className: "mkt-subheading" }, "Project Odoo is the first vertical of Project ERP  a governed implementation engine being built for every major ERP system. The same pipeline, the same governance, the same audit trail  across Odoo, NetSuite, SAP, Sage, and Xero."),
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
        el("h2", { className: "mkt-heading mkt-heading--section" }, "124 checkpoints  23 domains  2,834 tests passing"),
        el("p", { className: "mkt-subheading" }, "Verified against a live Odoo 19 instance."),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack mkt-center" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Ready to start?"),
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
