import { renderSiteFooter } from "../../components/site-footer.js";
import { renderSiteNav } from "../../components/site-nav.js";
import { el } from "../../lib/dom.js";

function syncDocument(title) {
  document.title = title;
  if (typeof window.scrollTo === "function") {
    window.scrollTo(0, 0);
  }
}

function renderFeatureList() {
  return el("ul", { className: "mkt-feature-list" }, [
    el("li", {}, "All 23 Odoo domains"),
    el("li", {}, "168 checkpoints"),
    el("li", {}, "Full audit trail"),
    el("li", {}, "Go-live readiness engine"),
    el("li", {}, "One Odoo instance"),
  ]);
}

function renderPricingCard({ label, price, interval, saving, featured = false, badge = null, setCurrentView }) {
  const className = featured ? "mkt-card mkt-card--featured" : "mkt-card";

  return el("article", { className }, [
    badge ? el("span", { className: "mkt-badge" }, badge) : null,
    el("span", { className: "mkt-card__eyebrow" }, label),
    el("p", { className: "mkt-card__price" }, [
      price,
      interval ? el("span", { className: "mkt-card__note" }, interval) : null,
    ]),
    saving ? el("p", { className: "mkt-card__saving" }, saving) : null,
    renderFeatureList(),
    el("button", {
      className: "mkt-pill-btn",
      type: "button",
      onclick: () => setCurrentView("auth"),
    }, "Get started"),
  ]);
}

function renderFaqItem(question, answer) {
  return el("article", { className: "mkt-qna__item" }, [
    el("h3", { className: "mkt-qna__question" }, question),
    el("p", { className: "mkt-qna__answer" }, answer),
  ]);
}

export function renderPricingPage({ setCurrentView }) {
  syncDocument("Project Odoo | Pricing");

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

      earlyAdopterBanner.innerHTML = "";
      earlyAdopterBanner.append(
        el("span", {}, `Early adopter offer  ${status.remaining} of ${status.total} spots remaining`),
        el("strong", {}, "First 20 companies: 6 months for $249.50"),
        el("span", {}, "After that, standard pricing applies.")
      );
      earlyAdopterBanner.style.display = "flex";
    } catch {
      earlyAdopterBanner.style.display = "none";
    }
  }

  void loadEarlyAdopterStatus();

  return el("div", { className: "mkt-page" }, [
    renderSiteNav({ setCurrentView }),

    el("section", { className: "mkt-hero" }, [
      el("div", { className: "mkt-shell mkt-hero__content" }, [
        el("h1", { className: "mkt-heading mkt-heading--hero" }, "Your Odoo implementation, structured from day one"),
        el("p", { className: "mkt-subheading" }, "One licence per Odoo instance. Everything included. No seat fees."),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        earlyAdopterBanner,
        el("div", { className: "mkt-pricing-grid" }, [
          renderPricingCard({
            label: "Monthly",
            price: "$149",
            interval: "/month",
            setCurrentView,
          }),
          renderPricingCard({
            label: "6 months",
            price: "$499",
            saving: "Save $395 vs monthly",
            featured: true,
            badge: "Most popular",
            setCurrentView,
          }),
          renderPricingCard({
            label: "Annual",
            price: "$799",
            interval: "/year",
            saving: "Save $989 vs monthly",
            setCurrentView,
          }),
        ]),
      ]),
    ]),

    el("section", { className: "mkt-section mkt-section--alt" }, [
      el("div", { className: "mkt-shell" }, [
        el("div", { className: "mkt-note" }, [
          el("h2", { className: "mkt-heading mkt-heading--section" }, "Foundation domain always free"),
          el("p", { className: "mkt-subheading" }, "Connect your Odoo instance and configure company details, currency, localization, and base access controls — the foundation every other domain depends on. No credit card. No time limit."),
        ]),
      ]),
    ]),

    el("section", { className: "mkt-section" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("h2", { className: "mkt-heading mkt-heading--section" }, "FAQ"),
        el("div", { className: "mkt-qna" }, [
          renderFaqItem("What counts as a company?", "One Odoo database / instance. Each instance requires its own licence."),
          renderFaqItem("What happens when my licence expires?", "Everything you have built is preserved — checkpoint history, approval records, and full audit trail remain intact and accessible. Governed writes are paused until you renew."),
          renderFaqItem("Is this a replacement for an Odoo consultant?", "It is a complement, not a replacement. Project Odoo handles the governed configuration sequence — the part most implementations get wrong. Business process design, custom development, integrations, and training are where consultants add the most value. Many consultants use Project Odoo to deliver faster, more reliable implementations for their clients."),
          renderFaqItem("Which Odoo versions are supported?", "Odoo 19. Additional versions are planned."),
          renderFaqItem("Where is my data stored?", "Discovery answers, checkpoint statuses, approval records, and audit trail are stored in Supabase (EU region), encrypted at rest. Project Odoo never stores your Odoo credentials or business data. See our Privacy Policy."),
        ]),
      ]),
    ]),

    renderSiteFooter({ setCurrentView }),
  ]);
}
