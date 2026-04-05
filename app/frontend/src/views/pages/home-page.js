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
          el("span", { className: "mkt-hero__eyebrow" }, "34 questions before the first write"),
          el("h1", { className: "mkt-heading mkt-heading--hero" }, [
            el("span", { className: "mkt-heading__line" }, "Implement Odoo"),
            el("span", { className: "mkt-heading__line mkt-heading__line--accent" }, "the way your business works"),
          ]),
          el("p", { className: "mkt-subheading" }, "Odoo has hundreds of configuration options, and the order you set them matters. Get the sequence wrong and tax settings, access rules, and master data errors cascade into every downstream module."),
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
          el("h2", { className: "mkt-card__title" }, "Business questions first. Configuration second."),
          el("p", { className: "mkt-card__body" }, "Stop configuring modules you do not need and discovering broken dependencies weeks later. Project Odoo maps your business first, then activates only the domains that match — with every write previewed before it executes."),
          el("ul", { className: "mkt-feature-list" }, [
            el("li", {}, "34 questions map your business before any setting is touched"),
            el("li", {}, "Only the domains you need — activated from your answers, not guesswork"),
            el("li", {}, "Every change previewed and approved before it touches your instance"),
          ]),
        ]),
      ]),
    ]),

    el("section", { className: "mkt-section mkt-section--alt" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Most Odoo implementations fail in the first 90 days"),
        el("div", { className: "mkt-grid mkt-grid--three" }, [
          renderProblemCard("Wrong sequence", "You set up Sales before Accounting is configured. Every invoice inherits the wrong tax code. Fixing it means undoing weeks of configuration — or starting over."),
          renderProblemCard("No audit trail", "Your CFO asks why revenue recognition changed. Nobody can say which setting was modified, by whom, or when. You are debugging a black box."),
          renderProblemCard("Hidden dependencies", "You change a fiscal position in Accounting. Three weeks later, eCommerce tax calculations break, purchase orders show wrong payment terms, and expense reports use the wrong currency. One setting. Four broken modules."),
        ]),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "A governed implementation, not a guess"),
        el("div", { className: "mkt-grid mkt-grid--four" }, [
          renderStep(1, "Answer 34 business questions", "Revenue model, operations, procurement, and team structure are captured upfront. The right questions prevent the wrong configuration."),
          renderStep(2, "Pipeline activates your 23 domains", "No consultant decides which modules to enable. Your answers determine activation — the same inputs always produce the same result."),
          renderStep(3, "Preview every change before it writes", "Before anything writes, you see what will change, which records are affected, and whether the action is safe, conditional, or blocked by dependencies."),
          renderStep(4, "Confirm. Audit trail complete.", "Every write is recorded with a unique execution ID, timestamp, and result. Six months from now, you can trace any setting back to the approval that authorized it."),
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
        el("h2", { className: "mkt-heading mkt-heading--section" }, "Proven against a live Odoo 19 instance"),
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
          renderPlanCard("Monthly", "$149", "Start immediately. Full governed pipeline, cancel anytime.", setCurrentView),
          renderPlanCard("6 months", "$499", "The standard implementation window — discovery through go-live.", setCurrentView),
          renderPlanCard("Annual", "$799", "For multi-phase rollouts, seasonal expansion, or ongoing governance.", setCurrentView),
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
