import { el } from "../lib/dom.js";

function renderNavLink(label, view, navigate) {
  return el("button", {
    className: "site-nav__link",
    type: "button",
    onclick: () => navigate(view),
  }, label);
}

export function renderSiteNav({ setCurrentView }) {
  let isOpen = false;

  const nav = el("nav", { className: "site-nav" });

  function syncMenuState() {
    nav.classList.toggle("is-open", isOpen);
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  }

  function navigate(view) {
    isOpen = false;
    syncMenuState();
    setCurrentView(view);
  }

  const brand = el("img", {
    src: "/assets/logo-project-odoo.png",
    alt: "Project Odoo",
    className: "site-nav__logo",
    onclick: () => navigate("home"),
    style: "cursor:pointer;",
  });

  const links = el("div", { className: "site-nav__links" }, [
    renderNavLink("How it works", "how-it-works", navigate),
    renderNavLink("Pricing", "pricing", navigate),
    renderNavLink("About", "about", navigate),
    renderNavLink("Blog", "blog", navigate),
  ]);

  const cta = el("button", {
    className: "site-nav__cta mkt-pill-btn",
    type: "button",
    onclick: () => navigate("auth"),
  }, "Start your implementation");

  const menuToggle = el("button", {
    className: "site-nav__menu-toggle",
    type: "button",
    "aria-expanded": "false",
    "aria-label": "Toggle site navigation",
    onclick: () => {
      isOpen = !isOpen;
      syncMenuState();
    },
  }, [
    el("span", { className: "site-nav__menu-bar", "aria-hidden": "true" }),
    el("span", { className: "site-nav__menu-bar", "aria-hidden": "true" }),
    el("span", { className: "site-nav__menu-bar", "aria-hidden": "true" }),
  ]);

  const panel = el("div", { className: "site-nav__panel" }, [
    links,
    cta,
  ]);

  nav.append(
    el("div", { className: "site-nav__inner" }, [
      brand,
      menuToggle,
      panel,
    ])
  );

  syncMenuState();
  return nav;
}
