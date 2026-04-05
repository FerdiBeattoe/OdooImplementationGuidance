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
        el("p", { className: "mkt-subheading" }, "A 12-step governed pipeline that takes you from first question to go-live readiness."),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        renderLayer(
          "01",
          "34 business questions",
          "The onboarding wizard asks what your business actually does  revenue model, operations, procurement, manufacturing, finance, and team structure. Your answers drive everything downstream.",
          "Domain activation engine deterministically activates or deactivates each of the 23 Odoo domains based on your answers. No guesswork. No over-configuration."
        ),
        renderLayer(
          "02",
          "168 checkpoints across 23 domains",
          "The pipeline orchestrator runs a 12-step process on every run. Each checkpoint is classified by safety class, validation source, and execution relevance.",
          "You see exactly what will be written before anything touches your Odoo instance. Every change requires explicit approval.",
          true
        ),
        renderLayer(
          "03",
          "Real writes. Full audit trail.",
          "Approved checkpoints execute real Odoo writes through the Odoo application layer  never direct database access. Every execution is recorded with result status, timestamp, and execution ID.",
          "The distinction between configuration complete and operationally ready is enforced by the go-live readiness engine."
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
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Ready to start your implementation?"),
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
