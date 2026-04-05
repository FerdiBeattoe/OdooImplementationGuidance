import { renderSiteFooter } from "../../components/site-footer.js";
import { renderSiteNav } from "../../components/site-nav.js";
import { el } from "../../lib/dom.js";

function syncDocument(title) {
  document.title = title;
  if (typeof window.scrollTo === "function") {
    window.scrollTo(0, 0);
  }
}

function renderLayer(number, title, body, detail, reverse = false) {
  const className = reverse
    ? "mkt-grid mkt-grid--two mkt-layer mkt-layer--reverse"
    : "mkt-grid mkt-grid--two mkt-layer";

  return el("section", { className }, [
    el("div", { className: "mkt-layer__number" }, number),
    el("div", { className: "mkt-layer__content" }, [
      el("span", { className: "mkt-card__index" }, number),
      el("h2", { className: "mkt-heading mkt-heading--section" }, title),
      el("p", { className: "mkt-subheading" }, body),
      el("p", { className: "mkt-subheading mkt-layer__detail" }, detail),
    ]),
  ]);
}

export function renderHowItWorksPage({ setCurrentView }) {
  syncDocument("Project Odoo | How It Works");

  return el("div", { className: "mkt-page" }, [
    renderSiteNav({ setCurrentView }),

    el("section", { className: "mkt-hero mkt-hero--dark" }, [
      el("div", { className: "mkt-shell mkt-hero__content" }, [
        el("span", { className: "mkt-hero__eyebrow" }, "12-step implementation pipeline"),
        el("h1", { className: "mkt-heading mkt-heading--hero" }, "How Project Odoo works"),
        el("p", { className: "mkt-subheading" }, "From your first discovery answer to verified go-live readiness — every step governed, every write audited, every decision traceable."),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        renderLayer(
          "01",
          "34 business questions",
          "Before any module is configured, Project Odoo captures how your business actually operates — revenue model, operations, procurement, manufacturing, finance, and team structure. Configuration without this context is how implementations fail.",
          "Your answers activate or deactivate each of the 23 Odoo domains. Businesses that skip discovery and activate everything pay for it in complexity, broken dependencies, and months of cleanup."
        ),
        renderLayer(
          "02",
          "168 checkpoints across 23 domains",
          "Every checkpoint is classified in plain terms: will it change data or just confirm a state? Is it safe to run or does it need conditions met first? Does it need your approval or is it informational? You always know what you are approving.",
          "You review the exact records that will be created or modified — not a summary, but the actual write operation. Nothing executes without your explicit approval.",
          true
        ),
        renderLayer(
          "03",
          "Real writes. Full audit trail.",
          "Approved changes execute through Odoo's own application layer — the same path as manual configuration. Business rules, validations, and access controls fire on every write. Direct database access bypasses all of that, which is how data integrity breaks silently.",
          "Finishing configuration does not mean your system is ready for production. The readiness engine validates that your implementation is operationally sound — not just technically complete."
        ),
      ]),
    ]),

    el("section", { className: "mkt-section mkt-section--alt" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Checkpoint lifecycle"),
        el("div", { className: "mkt-flow" }, [
          el("div", { className: "mkt-flow__item" }, "Not Started"),
          el("div", { className: "mkt-flow__arrow" }, "->"),
          el("div", { className: "mkt-flow__item mkt-flow__item--active" }, "Preview"),
          el("div", { className: "mkt-flow__arrow" }, "->"),
          el("div", { className: "mkt-flow__item" }, "Approved"),
          el("div", { className: "mkt-flow__arrow" }, "->"),
          el("div", { className: "mkt-flow__item" }, "Written"),
          el("div", { className: "mkt-flow__arrow" }, "->"),
          el("div", { className: "mkt-flow__item" }, "Complete"),
        ]),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack mkt-center" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Connect your Odoo instance and start discovery"),
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
