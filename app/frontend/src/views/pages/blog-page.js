import { renderSiteFooter } from "../../components/site-footer.js";
import { renderSiteNav } from "../../components/site-nav.js";
import { el } from "../../lib/dom.js";

function syncDocument(title) {
  document.title = title;
  if (typeof window.scrollTo === "function") {
    window.scrollTo(0, 0);
  }
}

function renderPostCard({ category, headline, excerpt, author, date }) {
  return el("article", { className: "mkt-card mkt-blog-card" }, [
    el("span", { className: "mkt-card__eyebrow" }, category),
    el("h2", { className: "mkt-card__title" }, headline),
    el("p", { className: "mkt-card__body" }, excerpt),
    el("div", { className: "mkt-blog-card__footer" }, [
      el("div", { className: "mkt-blog-card__meta" }, [
        el("span", {}, author),
        el("span", {}, date),
      ]),
      el("button", {
        className: "mkt-blog-card__action",
        type: "button",
        disabled: true,
      }, "Read more \u2192"),
    ]),
  ]);
}

export function renderBlogPage({ setCurrentView }) {
  syncDocument("Project Odoo | Blog");

  return el("div", { className: "mkt-page" }, [
    renderSiteNav({ setCurrentView }),

    el("section", { className: "mkt-hero" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("span", { className: "mkt-card__eyebrow" }, "Implementation notes"),
        el("h1", { className: "mkt-heading mkt-heading--hero" }, "Sequence, checkpoints, and governed Odoo 19 implementation"),
        el("p", { className: "mkt-subheading" }, "A working library of implementation guidance from the Project Odoo team. These are the dependencies, ordering rules, and product lessons behind governed configuration."),
      ]),
    ]),

    el("section", { className: "mkt-section mkt-section--alt" }, [
      el("div", { className: "mkt-shell mkt-stack" }, [
        el("div", { className: "mkt-grid mkt-grid--two mkt-blog-grid" }, [
          renderPostCard({
            category: "Implementation Guide",
            headline: "The right order to configure Odoo 19 \u2014 and why sequence matters",
            excerpt: "Most Odoo implementations configure modules in the wrong order. Here is the sequence that prevents downstream data corruption.",
            author: "Project Odoo Team",
            date: "April 2026",
          }),
          renderPostCard({
            category: "Product",
            headline: "What 124 checkpoints taught us about Odoo configuration dependencies",
            excerpt: "After verifying 124 checkpoints against a live Odoo 19 instance, patterns emerged about which settings break the most downstream modules.",
            author: "Project Odoo Team",
            date: "April 2026",
          }),
        ]),
      ]),
    ]),

    renderSiteFooter({ setCurrentView }),
  ]);
}
