import { renderSiteFooter } from "../../components/site-footer.js";
import { renderSiteNav } from "../../components/site-nav.js";
import { el } from "../../lib/dom.js";

function syncDocument(title) {
  document.title = title;
  if (typeof window.scrollTo === "function") {
    window.scrollTo(0, 0);
  }
}

function renderProblemCard(title, body) {
  return el("article", { className: "mkt-card" }, [
    el("h3", { className: "mkt-card__title" }, title),
    el("p", { className: "mkt-card__body" }, body),
  ]);
}

function renderStep(number, title, body) {
  return el("article", { className: "mkt-step" }, [
    el("span", { className: "mkt-step__number" }, String(number)),
    el("h3", { className: "mkt-step__title" }, title),
    el("p", { className: "mkt-step__body mkt-subheading" }, body),
  ]);
}

function renderStat(value, label) {
  return el("article", { className: "mkt-stat" }, [
    el("strong", { className: "mkt-stat__value" }, value),
    el("span", { className: "mkt-stat__label" }, label),
  ]);
}

function renderPlanCard(label, price, note, setCurrentView) {
  return el("article", { className: "mkt-card" }, [
    el("span", { className: "mkt-card__eyebrow" }, label),
    el("p", { className: "mkt-card__price" }, price),
    el("p", { className: "mkt-card__body" }, note),
    el("button", {
      className: "mkt-pill-btn",
      type: "button",
      onclick: () => setCurrentView("auth"),
    }, "Get started"),
  ]);
}

export function renderHomePage({ setCurrentView }) {
  syncDocument("Project Odoo | Governed Odoo 19 Implementation");

  const earlyAdopterBanner = el("div", {
    className: "mkt-early-adopter-banner",
    style: "display:none;",
  });

  async function loadEarlyAdopterStatus() {
    try {
      const response = await fetch("/api/licence/early-adopter-status");
      if (!response.ok) {
        return;
      }

      const status = await response.json();
      if (!status?.earlyAdopterActive) {
        earlyAdopterBanner.style.display = "none";
        return;
      }

      earlyAdopterBanner.textContent = `${status.remaining} of ${status.total} early adopter spots remaining  6 months for $249.50`;
      earlyAdopterBanner.style.display = "flex";
    } catch {
      earlyAdopterBanner.style.display = "none";
    }
  }

  void loadEarlyAdopterStatus();

  return el("div", { className: "mkt-page" }, [
    renderSiteNav({ setCurrentView }),

    el("section", { className: "mkt-hero" }, [
      el("div", { className: "mkt-shell mkt-hero__grid" }, [
        el("div", { className: "mkt-hero__content" }, [
          el("span", { className: "mkt-hero__eyebrow" }, "Governed Odoo 19 implementation"),
          el("h1", { className: "mkt-heading mkt-heading--hero" }, [
            el("span", { className: "mkt-heading__line" }, "Implement Odoo"),
            el("span", { className: "mkt-heading__line mkt-heading__line--accent" }, "the way your business works"),
          ]),
          el("p", { className: "mkt-subheading" }, "A fresh installation presents hundreds of configuration options, and the order in which you set things up matters  get the sequence wrong and downstream modules inherit incorrect data, tax settings, or access rules that are costly to unpick."),
          el("div", { className: "mkt-button-row" }, [
            el("button", {
              className: "mkt-pill-btn",
              type: "button",
              onclick: () => setCurrentView("auth"),
            }, "Start your implementation"),
            el("button", {
              className: "mkt-ghost-btn",
              type: "button",
              onclick: () => setCurrentView("how-it-works"),
            }, "See how it works"),
          ]),
          el("p", { className: "mkt-trust-bar" }, "Verified against live Odoo 19 | 124 checkpoints | 23 domains | 2,834 tests passing"),
        ]),
        el("aside", { className: "mkt-card mkt-card--featured" }, [
          el("span", { className: "mkt-card__eyebrow" }, "Why this matters"),
          el("h2", { className: "mkt-card__title" }, "Sequence drives every downstream decision"),
          el("p", { className: "mkt-card__body" }, "Project Odoo asks the business questions first, activates only the required domains, previews every governed write, and records the result with a truthful audit trail."),
          el("ul", { className: "mkt-feature-list" }, [
            el("li", {}, "34 business questions before configuration"),
            el("li", {}, "23 Odoo domains activated deterministically"),
            el("li", {}, "Preview, approval, and governed write path"),
          ]),
        ]),
      ]),
    ]),

    el("section", { className: "mkt-section mkt-section--alt" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Most Odoo implementations fail in the first 90 days"),
        el("div", { className: "mkt-grid mkt-grid--three" }, [
          renderProblemCard("Wrong sequence", "Configuring modules before master data is set corrupts downstream records. Tax codes, payment terms, and access rules all inherit from settings that should have been configured first."),
          renderProblemCard("No audit trail", "You cannot prove what was configured, when, or why. When something breaks six months later, there is no record to trace it back to."),
          renderProblemCard("Hidden dependencies", "A setting in Accounting affects Sales, Manufacturing, and HR in ways that are not obvious. Most implementations discover this the hard way."),
        ]),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "A governed implementation, not a guess"),
        el("div", { className: "mkt-grid mkt-grid--four" }, [
          renderStep(1, "Answer 34 business questions", "Discovery captures the business model before any configuration path is chosen."),
          renderStep(2, "Pipeline activates your 23 domains", "Domain activation follows your answers deterministically, not consultant intuition."),
          renderStep(3, "Preview every change before it writes", "You see the exact intended action, safety class, and downstream impact first."),
          renderStep(4, "Confirm. Audit trail complete.", "Nothing writes until you approve it, and every execution is recorded."),
        ]),
        el("button", {
          className: "mkt-link-button",
          type: "button",
          onclick: () => setCurrentView("how-it-works"),
        }, "See the full process"),
      ]),
    ]),

    el("section", { className: "mkt-section mkt-section--alt" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Built on real Odoo 19 data"),
        el("div", { className: "mkt-grid mkt-grid--three" }, [
          renderStat("124", "checkpoints"),
          renderStat("23", "domains"),
          renderStat("2,834", "tests passing"),
        ]),
        el("p", { className: "mkt-subheading" }, "Every checkpoint verified against a live Odoo 19 instance. Not documentation. Not guesswork."),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Simple pricing"),
        earlyAdopterBanner,
        el("div", { className: "mkt-grid mkt-grid--three" }, [
          renderPlanCard("Monthly", "$149", "One Odoo instance, governed pipeline included.", setCurrentView),
          renderPlanCard("6 months", "$499", "The core implementation window for most teams.", setCurrentView),
          renderPlanCard("Annual", "$799", "Best value for multi-phase rollout and expansion.", setCurrentView),
        ]),
        el("button", {
          className: "mkt-link-button",
          type: "button",
          onclick: () => setCurrentView("pricing"),
        }, "See full pricing details"),
      ]),
    ]),

    renderSiteFooter({ setCurrentView }),
  ]);
}
